import * as vscode from 'vscode';
import { Playlist, Track, CONSTANTS } from '../utils/Constants';
import { PlaylistStorage } from './PlaylistStorage';

/**
 * High-level playlist management operations.
 */
export class PlaylistManager {
    private storage: PlaylistStorage;
    private playlists: Playlist[] = [];
    private playlistChangeEmitter = new vscode.EventEmitter<Playlist[]>();

    readonly onPlaylistChange = this.playlistChangeEmitter.event;

    constructor(context: vscode.ExtensionContext) {
        this.storage = new PlaylistStorage(context);
        this.playlists = this.storage.loadPlaylists();
    }

    /**
     * Get all playlists
     */
    getAll(): Playlist[] {
        return [...this.playlists];
    }

    /**
     * Get a playlist by ID
     */
    getById(id: string): Playlist | undefined {
        return this.playlists.find(p => p.id === id);
    }

    /**
     * Create a new playlist via user input
     */
    async createPlaylist(initialTracks?: Track[]): Promise<Playlist | null> {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter playlist name',
            placeHolder: 'My Awesome Playlist',
            title: 'SonicFlow - Create Playlist',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Playlist name cannot be empty';
                }
                if (value.length > 100) {
                    return 'Playlist name too long (max 100 characters)';
                }
                return null;
            }
        });

        if (!name) { return null; }

        const description = await vscode.window.showInputBox({
            prompt: 'Enter playlist description (optional)',
            placeHolder: 'Chill vibes for late night coding...',
            title: 'SonicFlow - Playlist Description'
        });

        const playlist: Playlist = {
            id: this.generatePlaylistId(),
            name: name.trim(),
            description: description?.trim(),
            tracks: initialTracks || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            source: this.determineSource(initialTracks || [])
        };

        this.playlists.push(playlist);
        await this.storage.savePlaylists(this.playlists);
        this.playlistChangeEmitter.fire(this.playlists);

        vscode.window.showInformationMessage(`✅ Playlist "${name}" created!`);
        return playlist;
    }

    /**
     * Add a track to a playlist
     */
    async addTrackToPlaylist(track: Track, playlistId?: string): Promise<boolean> {
        let targetPlaylist: Playlist | undefined;

        if (playlistId) {
            targetPlaylist = this.getById(playlistId);
        } else {
            // Let user pick a playlist
            const items = this.playlists.map(p => ({
                label: p.name,
                description: `${p.tracks.length} tracks`,
                id: p.id
            }));

            items.unshift({
                label: '$(add) Create New Playlist',
                description: '',
                id: '__new__'
            });

            const selected = await vscode.window.showQuickPick(items, {
                title: 'Add to Playlist',
                placeHolder: 'Select a playlist'
            });

            if (!selected) { return false; }

            if (selected.id === '__new__') {
                const newPlaylist = await this.createPlaylist([track]);
                return newPlaylist !== null;
            }

            targetPlaylist = this.getById(selected.id);
        }

        if (!targetPlaylist) { return false; }

        // Check for duplicates
        if (targetPlaylist.tracks.some(t => t.id === track.id)) {
            vscode.window.showInformationMessage('Track already in playlist.');
            return false;
        }

        if (targetPlaylist.tracks.length >= CONSTANTS.MAX_PLAYLIST_SIZE) {
            vscode.window.showWarningMessage(
                `Playlist limit reached (${CONSTANTS.MAX_PLAYLIST_SIZE} tracks).`
            );
            return false;
        }

        targetPlaylist.tracks.push(track);
        targetPlaylist.updatedAt = Date.now();
        targetPlaylist.source = this.determineSource(targetPlaylist.tracks);

        await this.storage.savePlaylists(this.playlists);
        this.playlistChangeEmitter.fire(this.playlists);
        return true;
    }

    /**
     * Remove a track from a playlist
     */
    async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<boolean> {
        const playlist = this.getById(playlistId);
        if (!playlist) { return false; }

        playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
        playlist.updatedAt = Date.now();

        await this.storage.savePlaylists(this.playlists);
        this.playlistChangeEmitter.fire(this.playlists);
        return true;
    }

    /**
     * Delete a playlist
     */
    async deletePlaylist(playlistId: string): Promise<boolean> {
        const playlist = this.getById(playlistId);
        if (!playlist) { return false; }

        const confirm = await vscode.window.showWarningMessage(
            `Delete playlist "${playlist.name}"?`,
            { modal: true },
            'Delete'
        );

        if (confirm !== 'Delete') { return false; }

        this.playlists = this.playlists.filter(p => p.id !== playlistId);
        await this.storage.savePlaylists(this.playlists);
        this.playlistChangeEmitter.fire(this.playlists);
        return true;
    }

    /**
     * Rename a playlist
     */
    async renamePlaylist(playlistId: string): Promise<boolean> {
        const playlist = this.getById(playlistId);
        if (!playlist) { return false; }

        const newName = await vscode.window.showInputBox({
            prompt: 'Enter new playlist name',
            value: playlist.name,
            title: 'SonicFlow - Rename Playlist'
        });

        if (!newName) { return false; }

        playlist.name = newName.trim();
        playlist.updatedAt = Date.now();

        await this.storage.savePlaylists(this.playlists);
        this.playlistChangeEmitter.fire(this.playlists);
        return true;
    }

    /**
     * Show playlist picker and return selected playlist's tracks
     */
    async pickPlaylist(): Promise<Playlist | null> {
        if (this.playlists.length === 0) {
            vscode.window.showInformationMessage('No playlists found. Create one first!');
            return null;
        }

        const items = this.playlists.map(p => ({
            label: `$(list-unordered) ${p.name}`,
            description: `${p.tracks.length} tracks | ${p.source}`,
            detail: p.description || '',
            playlist: p
        }));

        const selected = await vscode.window.showQuickPick(items, {
            title: 'SonicFlow - Select Playlist',
            placeHolder: 'Choose a playlist to play',
            matchOnDescription: true
        });

        return selected?.playlist || null;
    }

    /**
     * Export playlists
     */
    async exportPlaylists(): Promise<void> {
        const playlistsToExport = this.playlists;
        if (playlistsToExport.length === 0) {
            vscode.window.showInformationMessage('No playlists to export.');
            return;
        }
        await this.storage.exportPlaylists(playlistsToExport);
    }

    /**
     * Import playlists
     */
    async importPlaylists(): Promise<void> {
        const imported = await this.storage.importPlaylists();
        if (imported.length > 0) {
            this.playlists = imported;
            this.playlistChangeEmitter.fire(this.playlists);
        }
    }

    private generatePlaylistId(): string {
        return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    private determineSource(tracks: Track[]): 'local' | 'youtube' | 'mixed' {
        if (tracks.length === 0) { return 'local'; }
        const sources = new Set(tracks.map(t => t.source));
        if (sources.size > 1) { return 'mixed'; }
        // Safe extraction - first track's source is guaranteed since tracks.length > 0
        const firstSource = tracks[0].source;
        return firstSource;
    }

    dispose(): void {
        this.playlistChangeEmitter.dispose();
    }
}