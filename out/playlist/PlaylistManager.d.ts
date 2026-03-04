import * as vscode from 'vscode';
import { Playlist, Track } from '../utils/Constants';
/**
 * High-level playlist management operations.
 */
export declare class PlaylistManager {
    private storage;
    private playlists;
    private playlistChangeEmitter;
    readonly onPlaylistChange: vscode.Event<Playlist[]>;
    constructor(context: vscode.ExtensionContext);
    /**
     * Get all playlists
     */
    getAll(): Playlist[];
    /**
     * Get a playlist by ID
     */
    getById(id: string): Playlist | undefined;
    /**
     * Create a new playlist via user input
     */
    createPlaylist(initialTracks?: Track[]): Promise<Playlist | null>;
    /**
     * Add a track to a playlist
     */
    addTrackToPlaylist(track: Track, playlistId?: string): Promise<boolean>;
    /**
     * Remove a track from a playlist
     */
    removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<boolean>;
    /**
     * Delete a playlist
     */
    deletePlaylist(playlistId: string): Promise<boolean>;
    /**
     * Rename a playlist
     */
    renamePlaylist(playlistId: string): Promise<boolean>;
    /**
     * Show playlist picker and return selected playlist's tracks
     */
    pickPlaylist(): Promise<Playlist | null>;
    /**
     * Export playlists
     */
    exportPlaylists(): Promise<void>;
    /**
     * Import playlists
     */
    importPlaylists(): Promise<void>;
    private generatePlaylistId;
    private determineSource;
    dispose(): void;
}
//# sourceMappingURL=PlaylistManager.d.ts.map