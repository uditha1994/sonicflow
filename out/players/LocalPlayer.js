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
exports.LocalPlayer = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const mm = __importStar(require("music-metadata"));
const Constants_1 = require("../utils/Constants");
const MemoryManager_1 = require("../utils/MemoryManager");
/**
 * Handles local file music playback and metadata extraction.
 * Supports all common audio formats.
 */
class LocalPlayer {
    constructor() {
        this.cache = MemoryManager_1.MemoryManager.getInstance();
    }
    /**
     * Open a file dialog to browse for music files
     */
    async browseFiles() {
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: true,
            canSelectFolders: false,
            filters: {
                'Audio Files': Constants_1.CONSTANTS.SUPPORTED_FORMATS.map(f => f.slice(1)),
                'All Files': ['*']
            },
            title: 'Select Music Files'
        });
        if (!uris || uris.length === 0) {
            return [];
        }
        const tracks = [];
        for (const uri of uris) {
            const track = await this.getTrackMetadata(uri.fsPath);
            if (track) {
                tracks.push(track);
            }
        }
        return tracks;
    }
    /**
     * Browse and select a folder to scan for music files
     */
    async browseFolder() {
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            canSelectFolders: true,
            canSelectFiles: false,
            title: 'Select Music Folder'
        });
        if (!uris || uris.length === 0) {
            return [];
        }
        return this.scanDirectory(uris[0].fsPath);
    }
    /**
     * Recursively scan a directory for music files
     */
    async scanDirectory(dirPath, maxDepth = 3) {
        const tracks = [];
        try {
            await this.scanDirectoryRecursive(dirPath, tracks, 0, maxDepth);
        }
        catch (error) {
            console.error(`[SonicFlow] Directory scan error:`, error);
            vscode.window.showErrorMessage(`Failed to scan directory: ${dirPath}`);
        }
        return tracks;
    }
    async scanDirectoryRecursive(dirPath, tracks, currentDepth, maxDepth) {
        if (currentDepth > maxDepth) {
            return;
        }
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                await this.scanDirectoryRecursive(fullPath, tracks, currentDepth + 1, maxDepth);
            }
            else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (Constants_1.CONSTANTS.SUPPORTED_FORMATS.includes(ext)) {
                    const track = await this.getTrackMetadata(fullPath);
                    if (track) {
                        tracks.push(track);
                    }
                }
            }
        }
    }
    /**
     * Extract metadata from an audio file
     */
    async getTrackMetadata(filePath) {
        // Check cache first
        const cacheKey = `metadata:${filePath}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const stat = await fs.promises.stat(filePath);
            if (!stat.isFile()) {
                return null;
            }
            const metadata = await mm.parseFile(filePath, {
                duration: true,
                skipCovers: true // Save memory - don't load cover art into metadata
            });
            const track = {
                id: this.generateTrackId(filePath),
                title: metadata.common.title || path.basename(filePath, path.extname(filePath)),
                artist: metadata.common.artist || 'Unknown Artist',
                album: metadata.common.album || 'Unknown Album',
                duration: Math.round(metadata.format.duration || 0),
                source: 'local',
                uri: filePath,
                genre: metadata.common.genre?.[0],
                tags: metadata.common.genre || [],
                addedAt: Date.now()
            };
            this.cache.set(cacheKey, track);
            return track;
        }
        catch (error) {
            console.error(`[SonicFlow] Metadata extraction failed for ${filePath}:`, error);
            // Return basic track info without metadata
            return {
                id: this.generateTrackId(filePath),
                title: path.basename(filePath, path.extname(filePath)),
                artist: 'Unknown Artist',
                duration: 0,
                source: 'local',
                uri: filePath,
                addedAt: Date.now()
            };
        }
    }
    /**
     * Get the file URI for webview audio playback
     */
    getPlaybackUri(track, webview) {
        const fileUri = vscode.Uri.file(track.uri);
        return webview.asWebviewUri(fileUri);
    }
    /**
     * Check if a file exists and is readable
     */
    async validateTrack(track) {
        try {
            await fs.promises.access(track.uri, fs.constants.R_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    generateTrackId(filePath) {
        // Simple hash based on file path
        let hash = 0;
        for (let i = 0; i < filePath.length; i++) {
            const char = filePath.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return `local_${Math.abs(hash).toString(36)}`;
    }
}
exports.LocalPlayer = LocalPlayer;
//# sourceMappingURL=LocalPlayer.js.map