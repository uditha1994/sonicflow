import * as vscode from 'vscode';
import { Track } from '../utils/Constants';
/**
 * Handles local file music playback and metadata extraction.
 * Supports all common audio formats.
 */
export declare class LocalPlayer {
    private cache;
    constructor();
    /**
     * Open a file dialog to browse for music files
     */
    browseFiles(): Promise<Track[]>;
    /**
     * Browse and select a folder to scan for music files
     */
    browseFolder(): Promise<Track[]>;
    /**
     * Recursively scan a directory for music files
     */
    scanDirectory(dirPath: string, maxDepth?: number): Promise<Track[]>;
    private scanDirectoryRecursive;
    /**
     * Extract metadata from an audio file
     */
    getTrackMetadata(filePath: string): Promise<Track | null>;
    /**
     * Get the file URI for webview audio playback
     */
    getPlaybackUri(track: Track, webview: vscode.Webview): vscode.Uri;
    /**
     * Check if a file exists and is readable
     */
    validateTrack(track: Track): Promise<boolean>;
    private generateTrackId;
}
//# sourceMappingURL=LocalPlayer.d.ts.map