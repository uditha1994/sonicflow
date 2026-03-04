import * as vscode from 'vscode';
import { Playlist } from '../utils/Constants';
/**
 * Handles persistent storage of playlists.
 * Supports both VS Code global state and file-based export/import.
 */
export declare class PlaylistStorage {
    private context;
    constructor(context: vscode.ExtensionContext);
    /**
     * Save all playlists to VS Code global state
     */
    savePlaylists(playlists: Playlist[]): Promise<void>;
    /**
     * Load all playlists from VS Code global state
     */
    loadPlaylists(): Playlist[];
    /**
     * Save a single playlist (merge with existing)
     */
    savePlaylist(playlist: Playlist): Promise<void>;
    /**
     * Delete a playlist by ID
     */
    deletePlaylist(playlistId: string): Promise<void>;
    /**
     * Export playlists to a JSON file
     */
    exportPlaylists(playlists: Playlist[]): Promise<boolean>;
    /**
     * Import playlists from a JSON file
     */
    importPlaylists(): Promise<Playlist[]>;
    /**
     * Save play history
     */
    savePlayHistory(trackId: string): Promise<void>;
    /**
     * Get play history
     */
    getPlayHistory(): string[];
    /**
     * Save last played track info for session restoration
     */
    saveLastPlayed(trackInfo: {
        track: any;
        position: number;
        queue: any[];
    }): Promise<void>;
    /**
     * Get last played track info
     */
    getLastPlayed(): {
        track: any;
        position: number;
        queue: any[];
    } | undefined;
    private getDefaultExportPath;
}
//# sourceMappingURL=PlaylistStorage.d.ts.map