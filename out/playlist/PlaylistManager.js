"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistManager = void 0;
const vscode = __importStar(require("vscode"));
const Constants_1 = require("../utils/Constants");
const PlaylistStorage_1 = require("./PlaylistStorage");
/**
 * High-level playlist management operations.
 */
class PlaylistManager {
    constructor(context) {
        this.playlists = [];
        this.playlistChangeEmitter = new vscode.EventEmitter();
        this.onPlaylistChange = this.playlistChangeEmitter.event;
        this.storage = new PlaylistStorage_1.PlaylistStorage(context);
        this.playlists = this.storage.loadPlaylists();
    }
    /**
     * Get all playlists
     */
    getAll() {
        return [...this.playlists];
    }
    /**
     * Get a playlist by ID
     */
    getById(id) {
        return this.playlists.find(p => p.id === id);
    }
    /**
     * Create a new playlist via user input
     */
    async createPlaylist(initialTracks) {
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
        if (!name) {
            return null;
        }
        const description = await vscode.window.showInputBox({
            prompt: 'Enter playlist description (optional)',
            placeHolder: 'Chill vibes for late night coding...',
            title: 'SonicFlow - Playlist Description'
        });
        const playlist = {
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
    async addTrackToPlaylist(track, playlistId) {
        let targetPlaylist;
        if (playlistId) {
            targetPlaylist = this.getById(playlistId);
        }
        else {
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
            if (!selected) {
                return false;
            }
            if (selected.id === '__new__') {
                const newPlaylist = await this.createPlaylist([track]);
                return newPlaylist !== null;
            }
            targetPlaylist = this.getById(selected.id);
        }
        if (!targetPlaylist) {
            return false;
        }
        // Check for duplicates
        if (targetPlaylist.tracks.some(t => t.id === track.id)) {
            vscode.window.showInformationMessage('Track already in playlist.');
            return false;
        }
        if (targetPlaylist.tracks.length >= Constants_1.CONSTANTS.MAX_PLAYLIST_SIZE) {
            vscode.window.showWarningMessage(`Playlist limit reached (${Constants_1.CONSTANTS.MAX_PLAYLIST_SIZE} tracks).`);
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
    async removeTrackFromPlaylist(playlistId, trackId) {
        const playlist = this.getById(playlistId);
        if (!playlist) {
            return false;
        }
        playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
        playlist.updatedAt = Date.now();
        await this.storage.savePlaylists(this.playlists);
        this.playlistChangeEmitter.fire(this.playlists);
        return true;
    }
    /**
     * Delete a playlist
     */
    async deletePlaylist(playlistId) {
        const playlist = this.getById(playlistId);
        if (!playlist) {
            return false;
        }
        const confirm = await vscode.window.showWarningMessage(`Delete playlist "${playlist.name}"?`, { modal: true }, 'Delete');
        if (confirm !== 'Delete') {
            return false;
        }
        this.playlists = this.playlists.filter(p => p.id !== playlistId);
        await this.storage.savePlaylists(this.playlists);
        this.playlistChangeEmitter.fire(this.playlists);
        return true;
    }
    /**
     * Rename a playlist
     */
    async renamePlaylist(playlistId) {
        const playlist = this.getById(playlistId);
        if (!playlist) {
            return false;
        }
        const newName = await vscode.window.showInputBox({
            prompt: 'Enter new playlist name',
            value: playlist.name,
            title: 'SonicFlow - Rename Playlist'
        });
        if (!newName) {
            return false;
        }
        playlist.name = newName.trim();
        playlist.updatedAt = Date.now();
        await this.storage.savePlaylists(this.playlists);
        this.playlistChangeEmitter.fire(this.playlists);
        return true;
    }
    /**
     * Show playlist picker and return selected playlist's tracks
     */
    async pickPlaylist() {
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
    async exportPlaylists() {
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
    async importPlaylists() {
        const imported = await this.storage.importPlaylists();
        if (imported.length > 0) {
            this.playlists = imported;
            this.playlistChangeEmitter.fire(this.playlists);
        }
    }
    generatePlaylistId() {
        return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }
    determineSource(tracks) {
        if (tracks.length === 0) {
            return 'local';
        }
        const sources = new Set(tracks.map(t => t.source));
        if (sources.size > 1) {
            return 'mixed';
        }
        return sources.values().next().value;
    }
    dispose() {
        this.playlistChangeEmitter.dispose();
    }
}
exports.PlaylistManager = PlaylistManager;
//# sourceMappingURL=PlaylistManager.js.map