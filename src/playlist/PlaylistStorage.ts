import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Playlist, CONSTANTS } from '../utils/Constants';

/**
 * Handles persistent storage of playlists.
 * Supports both VS Code global state and file-based export/import.
 */
export class PlaylistStorage {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Save all playlists to VS Code global state
     */
    async savePlaylists(playlists: Playlist[]): Promise<void> {
        await this.context.globalState.update(CONSTANTS.STORAGE_PLAYLISTS, playlists);
    }

    /**
     * Load all playlists from VS Code global state
     */
    loadPlaylists(): Playlist[] {
        return this.context.globalState.get<Playlist[]>(CONSTANTS.STORAGE_PLAYLISTS, []);
    }

    /**
     * Save a single playlist (merge with existing)
     */
    async savePlaylist(playlist: Playlist): Promise<void> {
        const playlists = this.loadPlaylists();
        const existingIndex = playlists.findIndex(p => p.id === playlist.id);

        if (existingIndex >= 0) {
            playlists[existingIndex] = playlist;
        } else {
            playlists.push(playlist);
        }

        await this.savePlaylists(playlists);
    }

    /**
     * Delete a playlist by ID
     */
    async deletePlaylist(playlistId: string): Promise<void> {
        const playlists = this.loadPlaylists();
        const filtered = playlists.filter(p => p.id !== playlistId);
        await this.savePlaylists(filtered);
    }

    /**
     * Export playlists to a JSON file
     */
    async exportPlaylists(playlists: Playlist[]): Promise<boolean> {
        const uri = await vscode.window.showSaveDialog({
            filters: {
                'SonicFlow Playlist': ['sfpl'],
                'JSON': ['json']
            },
            title: 'Export Playlists',
            defaultUri: vscode.Uri.file(
                path.join(this.getDefaultExportPath(), 'sonicflow-playlists.sfpl')
            )
        });

        if (!uri) { return false; }

        try {
            const exportData = {
                version: '1.0',
                exportedAt: Date.now(),
                application: 'SonicFlow',
                playlists: playlists
            };

            await fs.promises.writeFile(
                uri.fsPath,
                JSON.stringify(exportData, null, 2),
                'utf-8'
            );

            vscode.window.showInformationMessage(
                `✅ Exported ${playlists.length} playlist(s) successfully!`
            );
            return true;
        } catch (error) {
            console.error('[SonicFlow] Export error:', error);
            vscode.window.showErrorMessage('Failed to export playlists.');
            return false;
        }
    }

    /**
     * Import playlists from a JSON file
     */
    async importPlaylists(): Promise<Playlist[]> {
        const uris = await vscode.window.showOpenDialog({
            filters: {
                'SonicFlow Playlist': ['sfpl'],
                'JSON': ['json']
            },
            canSelectMany: false,
            title: 'Import Playlists'
        });

        if (!uris || uris.length === 0) { return []; }

        try {
            const content = await fs.promises.readFile(uris[0].fsPath, 'utf-8');
            const importData = JSON.parse(content);

            if (!importData.playlists || !Array.isArray(importData.playlists)) {
                vscode.window.showErrorMessage('Invalid playlist file format.');
                return [];
            }

            const importedPlaylists: Playlist[] = importData.playlists;

            // Merge with existing playlists
            const existing = this.loadPlaylists();
            for (const imported of importedPlaylists) {
                const existingIndex = existing.findIndex(p => p.id === imported.id);
                if (existingIndex >= 0) {
                    // Ask user what to do with duplicates
                    const action = await vscode.window.showQuickPick(
                        ['Replace', 'Keep Both', 'Skip'],
                        { title: `Playlist "${imported.name}" already exists` }
                    );

                    if (action === 'Replace') {
                        existing[existingIndex] = imported;
                    } else if (action === 'Keep Both') {
                        imported.id = imported.id + '_imported_' + Date.now();
                        imported.name = imported.name + ' (Imported)';
                        existing.push(imported);
                    }
                    // 'Skip' - do nothing
                } else {
                    existing.push(imported);
                }
            }

            await this.savePlaylists(existing);
            vscode.window.showInformationMessage(
                `✅ Imported ${importedPlaylists.length} playlist(s) successfully!`
            );
            return existing;
        } catch (error) {
            console.error('[SonicFlow] Import error:', error);
            vscode.window.showErrorMessage('Failed to import playlists.');
            return [];
        }
    }

    /**
     * Save play history
     */
    async savePlayHistory(trackId: string): Promise<void> {
        const history = this.context.globalState.get<string[]>(CONSTANTS.STORAGE_PLAY_HISTORY, []);
        history.unshift(trackId);
        // Keep only last 100 entries
        const trimmed = history.slice(0, 100);
        await this.context.globalState.update(CONSTANTS.STORAGE_PLAY_HISTORY, trimmed);
    }

    /**
     * Get play history
     */
    getPlayHistory(): string[] {
        return this.context.globalState.get<string[]>(CONSTANTS.STORAGE_PLAY_HISTORY, []);
    }

    /**
     * Save last played track info for session restoration
     */
    async saveLastPlayed(trackInfo: { track: any; position: number; queue: any[] }): Promise<void> {
        await this.context.globalState.update(CONSTANTS.STORAGE_LAST_PLAYED, trackInfo);
    }

    /**
     * Get last played track info
     */
    getLastPlayed(): { track: any; position: number; queue: any[] } | undefined {
        return this.context.globalState.get(CONSTANTS.STORAGE_LAST_PLAYED);
    }

    private getDefaultExportPath(): string {
        const customPath = vscode.workspace.getConfiguration('sonicflow').get<string>('playlistStoragePath');
        if (customPath && fs.existsSync(customPath)) {
            return customPath;
        }
        return require('os').homedir();
    }
}