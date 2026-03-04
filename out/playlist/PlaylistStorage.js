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
exports.PlaylistStorage = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Constants_1 = require("../utils/Constants");
/**
 * Handles persistent storage of playlists.
 * Supports both VS Code global state and file-based export/import.
 */
class PlaylistStorage {
    constructor(context) {
        this.context = context;
    }
    /**
     * Save all playlists to VS Code global state
     */
    async savePlaylists(playlists) {
        await this.context.globalState.update(Constants_1.CONSTANTS.STORAGE_PLAYLISTS, playlists);
    }
    /**
     * Load all playlists from VS Code global state
     */
    loadPlaylists() {
        return this.context.globalState.get(Constants_1.CONSTANTS.STORAGE_PLAYLISTS, []);
    }
    /**
     * Save a single playlist (merge with existing)
     */
    async savePlaylist(playlist) {
        const playlists = this.loadPlaylists();
        const existingIndex = playlists.findIndex(p => p.id === playlist.id);
        if (existingIndex >= 0) {
            playlists[existingIndex] = playlist;
        }
        else {
            playlists.push(playlist);
        }
        await this.savePlaylists(playlists);
    }
    /**
     * Delete a playlist by ID
     */
    async deletePlaylist(playlistId) {
        const playlists = this.loadPlaylists();
        const filtered = playlists.filter(p => p.id !== playlistId);
        await this.savePlaylists(filtered);
    }
    /**
     * Export playlists to a JSON file
     */
    async exportPlaylists(playlists) {
        const uri = await vscode.window.showSaveDialog({
            filters: {
                'SonicFlow Playlist': ['sfpl'],
                'JSON': ['json']
            },
            title: 'Export Playlists',
            defaultUri: vscode.Uri.file(path.join(this.getDefaultExportPath(), 'sonicflow-playlists.sfpl'))
        });
        if (!uri) {
            return false;
        }
        try {
            const exportData = {
                version: '1.0',
                exportedAt: Date.now(),
                application: 'SonicFlow',
                playlists: playlists
            };
            await fs.promises.writeFile(uri.fsPath, JSON.stringify(exportData, null, 2), 'utf-8');
            vscode.window.showInformationMessage(`✅ Exported ${playlists.length} playlist(s) successfully!`);
            return true;
        }
        catch (error) {
            console.error('[SonicFlow] Export error:', error);
            vscode.window.showErrorMessage('Failed to export playlists.');
            return false;
        }
    }
    /**
     * Import playlists from a JSON file
     */
    async importPlaylists() {
        const uris = await vscode.window.showOpenDialog({
            filters: {
                'SonicFlow Playlist': ['sfpl'],
                'JSON': ['json']
            },
            canSelectMany: false,
            title: 'Import Playlists'
        });
        if (!uris || uris.length === 0) {
            return [];
        }
        try {
            const content = await fs.promises.readFile(uris[0].fsPath, 'utf-8');
            const importData = JSON.parse(content);
            if (!importData.playlists || !Array.isArray(importData.playlists)) {
                vscode.window.showErrorMessage('Invalid playlist file format.');
                return [];
            }
            const importedPlaylists = importData.playlists;
            // Merge with existing playlists
            const existing = this.loadPlaylists();
            for (const imported of importedPlaylists) {
                const existingIndex = existing.findIndex(p => p.id === imported.id);
                if (existingIndex >= 0) {
                    // Ask user what to do with duplicates
                    const action = await vscode.window.showQuickPick(['Replace', 'Keep Both', 'Skip'], { title: `Playlist "${imported.name}" already exists` });
                    if (action === 'Replace') {
                        existing[existingIndex] = imported;
                    }
                    else if (action === 'Keep Both') {
                        imported.id = imported.id + '_imported_' + Date.now();
                        imported.name = imported.name + ' (Imported)';
                        existing.push(imported);
                    }
                    // 'Skip' - do nothing
                }
                else {
                    existing.push(imported);
                }
            }
            await this.savePlaylists(existing);
            vscode.window.showInformationMessage(`✅ Imported ${importedPlaylists.length} playlist(s) successfully!`);
            return existing;
        }
        catch (error) {
            console.error('[SonicFlow] Import error:', error);
            vscode.window.showErrorMessage('Failed to import playlists.');
            return [];
        }
    }
    /**
     * Save play history
     */
    async savePlayHistory(trackId) {
        const history = this.context.globalState.get(Constants_1.CONSTANTS.STORAGE_PLAY_HISTORY, []);
        history.unshift(trackId);
        // Keep only last 100 entries
        const trimmed = history.slice(0, 100);
        await this.context.globalState.update(Constants_1.CONSTANTS.STORAGE_PLAY_HISTORY, trimmed);
    }
    /**
     * Get play history
     */
    getPlayHistory() {
        return this.context.globalState.get(Constants_1.CONSTANTS.STORAGE_PLAY_HISTORY, []);
    }
    /**
     * Save last played track info for session restoration
     */
    async saveLastPlayed(trackInfo) {
        await this.context.globalState.update(Constants_1.CONSTANTS.STORAGE_LAST_PLAYED, trackInfo);
    }
    /**
     * Get last played track info
     */
    getLastPlayed() {
        return this.context.globalState.get(Constants_1.CONSTANTS.STORAGE_LAST_PLAYED);
    }
    getDefaultExportPath() {
        const customPath = vscode.workspace.getConfiguration('sonicflow').get('playlistStoragePath');
        if (customPath && fs.existsSync(customPath)) {
            return customPath;
        }
        return require('os').homedir();
    }
}
exports.PlaylistStorage = PlaylistStorage;
//# sourceMappingURL=PlaylistStorage.js.map