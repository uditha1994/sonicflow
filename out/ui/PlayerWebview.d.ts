import * as vscode from 'vscode';
import { PlayerManager } from '../players/PlayerManager';
import { PlaylistManager } from '../playlist/PlaylistManager';
import { VibeEngine } from '../recommendation/VibeEngine';
import { Track } from '../utils/Constants';
/**
 * Main webview panel that hosts the SonicFlow player UI.
 * Handles bidirectional communication between the extension
 * and the webview.
 */
export declare class PlayerWebview {
    static readonly viewType = "sonicflow.player";
    private static instance;
    private panel;
    private playerManager;
    private playlistManager;
    private vibeEngine;
    private extensionUri;
    private disposables;
    private constructor();
    /**
     * Create or reveal the player panel
     */
    static createOrShow(extensionUri: vscode.Uri, playerManager: PlayerManager, playlistManager: PlaylistManager, vibeEngine: VibeEngine): PlayerWebview;
    /**
     * Get the current instance (if exists)
     */
    static getInstance(): PlayerWebview | undefined;
    /**
     * Send a message to the webview
     */
    postMessage(message: any): void;
    /**
     * Load and play a track
     */
    loadTrack(track: Track): Promise<void>;
    private setupPanel;
    private setupMessageHandler;
    private handleMessage;
    private handleBrowseLocal;
    private handleYouTubeSearch;
    private handleShowPlaylist;
    private handlePlayFromQueue;
    private loadCurrentTrack;
    private setupStateSync;
    private syncQueue;
    private getHtmlContent;
    private getInlineHtml;
    private getNonce;
    dispose(): void;
}
//# sourceMappingURL=PlayerWebview.d.ts.map