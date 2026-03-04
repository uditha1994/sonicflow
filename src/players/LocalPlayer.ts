import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as mm from 'music-metadata';
import { Track, CONSTANTS } from '../utils/Constants';
import { MemoryManager } from '../utils/MemoryManager';

/**
 * Handles local file music playback and metadata extraction.
 * Supports all common audio formats.
 */
export class LocalPlayer {
    private cache: MemoryManager;

    constructor() {
        this.cache = MemoryManager.getInstance();
    }

    /**
     * Open a file dialog to browse for music files
     */
    async browseFiles(): Promise<Track[]> {
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: true,
            canSelectFolders: false,
            filters: {
                'Audio Files': CONSTANTS.SUPPORTED_FORMATS.map(f => f.slice(1)),
                'All Files': ['*']
            },
            title: 'Select Music Files'
        });

        if (!uris || uris.length === 0) {
            return [];
        }

        const tracks: Track[] = [];
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
    async browseFolder(): Promise<Track[]> {
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
    async scanDirectory(dirPath: string, maxDepth: number = 3): Promise<Track[]> {
        const tracks: Track[] = [];

        try {
            await this.scanDirectoryRecursive(dirPath, tracks, 0, maxDepth);
        } catch (error) {
            console.error(`[SonicFlow] Directory scan error:`, error);
            vscode.window.showErrorMessage(`Failed to scan directory: ${dirPath}`);
        }

        return tracks;
    }

    private async scanDirectoryRecursive(
        dirPath: string,
        tracks: Track[],
        currentDepth: number,
        maxDepth: number
    ): Promise<void> {
        if (currentDepth > maxDepth) { return; }

        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                await this.scanDirectoryRecursive(fullPath, tracks, currentDepth + 1, maxDepth);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if ((CONSTANTS.SUPPORTED_FORMATS as readonly string[]).includes(ext)) {
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
    async getTrackMetadata(filePath: string): Promise<Track | null> {
        // Check cache first
        const cacheKey = `metadata:${filePath}`;
        const cached = this.cache.get<Track>(cacheKey);
        if (cached) { return cached; }

        try {
            const stat = await fs.promises.stat(filePath);
            if (!stat.isFile()) { return null; }

            const metadata = await mm.parseFile(filePath, {
                duration: true,
                skipCovers: true  // Save memory - don't load cover art into metadata
            });

            const track: Track = {
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
        } catch (error) {
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
    getPlaybackUri(track: Track, webview: vscode.Webview): vscode.Uri {
        const fileUri = vscode.Uri.file(track.uri);
        return webview.asWebviewUri(fileUri);
    }

    /**
     * Check if a file exists and is readable
     */
    async validateTrack(track: Track): Promise<boolean> {
        try {
            await fs.promises.access(track.uri, fs.constants.R_OK);
            return true;
        } catch {
            return false;
        }
    }

    private generateTrackId(filePath: string): string {
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