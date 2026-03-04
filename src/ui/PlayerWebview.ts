import * as vscode from 'vscode';
import * as path from 'path';
import { PlayerManager } from '../players/PlayerManager';
import { PlaylistManager } from '../playlist/PlaylistManager';
import { VibeEngine } from '../recommendation/VibeEngine';
import { Track, PlayerState } from '../utils/Constants';

/**
 * Main webview panel that hosts the SonicFlow player UI.
 * Handles bidirectional communication between the extension
 * and the webview.
 */
export class PlayerWebview {
    public static readonly viewType = 'sonicflow.player';
    private static instance: PlayerWebview | undefined;

    private panel: vscode.WebviewPanel;
    private playerManager: PlayerManager;
    private playlistManager: PlaylistManager;
    private vibeEngine: VibeEngine;
    private extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        playerManager: PlayerManager,
        playlistManager: PlaylistManager,
        vibeEngine: VibeEngine
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.playerManager = playerManager;
        this.playlistManager = playlistManager;
        this.vibeEngine = vibeEngine;

        this.setupPanel();
        this.setupMessageHandler();
        this.setupStateSync();
    }

    /**
     * Create or reveal the player panel
     */
    static createOrShow(
        extensionUri: vscode.Uri,
        playerManager: PlayerManager,
        playlistManager: PlaylistManager,
        vibeEngine: VibeEngine
    ): PlayerWebview {
        const column = vscode.ViewColumn.Beside;

        if (PlayerWebview.instance) {
            PlayerWebview.instance.panel.reveal(column);
            return PlayerWebview.instance;
        }

        const panel = vscode.window.createWebviewPanel(
            PlayerWebview.viewType,
            '🎵 SonicFlow',
            { viewColumn: column, preserveFocus: true },
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'dist'),
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    // Allow access to the entire filesystem for local music files
                    vscode.Uri.file('/')
                ]
            }
        );

        PlayerWebview.instance = new PlayerWebview(
            panel, extensionUri, playerManager, playlistManager, vibeEngine
        );

        return PlayerWebview.instance;
    }

    /**
     * Get the current instance (if exists)
     */
    static getInstance(): PlayerWebview | undefined {
        return PlayerWebview.instance;
    }

    /**
     * Send a message to the webview
     */
    postMessage(message: any): void {
        if (this.panel.visible) {
            this.panel.webview.postMessage(message);
        }
    }

    /**
     * Load and play a track
     */
    async loadTrack(track: Track): Promise<void> {
        const streamUrl = await this.playerManager.getStreamUrl(track, this.panel.webview);

        this.postMessage({
            type: 'loadTrack',
            track: track,
            streamUrl: streamUrl
        });

        await this.playerManager.play(track);
    }

    private setupPanel(): void {
        this.panel.webview.html = this.getHtmlContent();
        this.panel.iconPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'icons', 'sonicflow.svg');

        this.panel.onDidDispose(() => {
            PlayerWebview.instance = undefined;
            this.dispose();
        }, null, this.disposables);
    }

    private setupMessageHandler(): void {
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                try {
                    await this.handleMessage(message);
                } catch (error) {
                    console.error('[SonicFlow] Message handler error:', error);
                }
            },
            null,
            this.disposables
        );
    }

    private async handleMessage(message: any): Promise<void> {
        switch (message.command) {
            case 'togglePlayPause':
                this.playerManager.togglePlayPause();
                break;

            case 'next':
                await this.playerManager.next();
                await this.loadCurrentTrack();
                break;

            case 'previous':
                await this.playerManager.previous();
                await this.loadCurrentTrack();
                break;

            case 'toggleShuffle':
                this.playerManager.toggleShuffle();
                break;

            case 'toggleRepeat':
                this.playerManager.toggleRepeat();
                break;

            case 'toggleVibeMode':
                this.playerManager.toggleVibeMode();
                break;

            case 'setVolume':
                this.playerManager.setVolume(message.volume);
                break;

            case 'updatePosition':
                this.playerManager.updatePosition(message.position);
                break;

            case 'trackEnded':
                await this.playerManager.onTrackEnded();
                await this.loadCurrentTrack();
                break;

            case 'browseLocal':
                await this.handleBrowseLocal();
                break;

            case 'searchYouTube':
                await this.handleYouTubeSearch();
                break;

            case 'showPlaylist':
                await this.handleShowPlaylist();
                break;

            case 'playFromQueue':
                await this.handlePlayFromQueue(message.index);
                break;

            case 'removeFromQueue':
                this.playerManager.removeFromQueue(message.index);
                this.syncQueue();
                break;

            case 'changeTheme':
                // Store theme preference
                vscode.workspace.getConfiguration('sonicflow').update(
                    'theme',
                    message.theme.replace('theme-', ''),
                    vscode.ConfigurationTarget.Global
                );
                break;

            case 'audioError':
                console.error('[SonicFlow] Audio playback error:', message.error);
                vscode.window.showErrorMessage(`Playback error: ${message.error || 'Unknown error'}`);
                break;
        }
    }

    private async handleBrowseLocal(): Promise<void> {
        const localPlayer = this.playerManager.getLocalPlayer();

        const choice = await vscode.window.showQuickPick(
            [
                { label: '$(file) Select Files', description: 'Choose individual music files', id: 'files' },
                { label: '$(folder) Select Folder', description: 'Scan a folder for music', id: 'folder' }
            ],
            { title: 'Browse Local Music' }
        );

        if (!choice) { return; }

        let tracks: Track[];
        if (choice.id === 'files') {
            tracks = await localPlayer.browseFiles();
        } else {
            tracks = await localPlayer.browseFolder();
        }

        if (tracks.length === 0) { return; }

        // Ask what to do with the tracks
        const action = await vscode.window.showQuickPick(
            [
                { label: '$(play) Play Now', description: 'Replace queue and play', id: 'play' },
                { label: '$(add) Add to Queue', description: 'Add to current queue', id: 'queue' },
                { label: '$(list-unordered) Add to Playlist', description: 'Save to a playlist', id: 'playlist' }
            ],
            { title: `${tracks.length} track(s) found` }
        );

        if (!action) { return; }

        switch (action.id) {
            case 'play':
                this.playerManager.clearQueue();
                await this.playerManager.addTracksToQueue(tracks, true);
                await this.loadCurrentTrack();
                break;

            case 'queue':
                await this.playerManager.addTracksToQueue(tracks, !this.playerManager.getState().currentTrack);
                if (!this.playerManager.getState().currentTrack) {
                    await this.loadCurrentTrack();
                }
                break;

            case 'playlist':
                for (const track of tracks) {
                    await this.playlistManager.addTrackToPlaylist(track);
                }
                break;
        }

        this.syncQueue();
    }

    private async handleYouTubeSearch(): Promise<void> {
        const ytPlayer = this.playerManager.getYouTubePlayer();
        const track = await ytPlayer.interactiveSearch();

        if (!track) { return; }

        const action = await vscode.window.showQuickPick(
            [
                { label: '$(play) Play Now', id: 'play' },
                { label: '$(add) Add to Queue', id: 'queue' },
                { label: '$(list-unordered) Add to Playlist', id: 'playlist' }
            ],
            { title: `Selected: ${track.title}` }
        );

        if (!action) { return; }

        switch (action.id) {
            case 'play':
                await this.playerManager.addToQueue(track, true);
                await this.loadTrack(track);
                break;

            case 'queue':
                await this.playerManager.addToQueue(track, false);
                break;

            case 'playlist':
                await this.playlistManager.addTrackToPlaylist(track);
                break;
        }

        this.syncQueue();
    }

    private async handleShowPlaylist(): Promise<void> {
        const playlist = await this.playlistManager.pickPlaylist();
        if (!playlist || playlist.tracks.length === 0) { return; }

        const action = await vscode.window.showQuickPick(
            [
                { label: '$(play) Play Playlist', id: 'play' },
                { label: '$(add) Add to Queue', id: 'queue' }
            ],
            { title: `Playlist: ${playlist.name} (${playlist.tracks.length} tracks)` }
        );

        if (!action) { return; }

        if (action.id === 'play') {
            this.playerManager.clearQueue();
            await this.playerManager.addTracksToQueue(playlist.tracks, true);
            await this.loadCurrentTrack();
        } else {
            await this.playerManager.addTracksToQueue(playlist.tracks, false);
        }

        this.syncQueue();
    }

    private async handlePlayFromQueue(index: number): Promise<void> {
        const state = this.playerManager.getState();
        if (index >= 0 && index < state.queue.length) {
            const track = state.queue[index];
            this.playerManager.getState().queueIndex = index;
            await this.playerManager.play(track);
            await this.loadTrack(track);
            this.syncQueue();
        }
    }

    private async loadCurrentTrack(): Promise<void> {
        const state = this.playerManager.getState();
        if (state.currentTrack) {
            await this.loadTrack(state.currentTrack);
        }
    }

    private setupStateSync(): void {
        this.playerManager.onStateChange((state) => {
            this.postMessage({
                type: 'updateState',
                state: {
                    isPlaying: state.isPlaying,
                    shuffle: state.shuffle,
                    repeat: state.repeat,
                    vibeMode: state.vibeMode,
                    volume: state.volume,
                    queue: state.queue,
                    queueIndex: state.queueIndex
                }
            });
        }, null, this.disposables);
    }

    private syncQueue(): void {
        const state = this.playerManager.getState();
        this.postMessage({
            type: 'updateQueue',
            queue: state.queue,
            queueIndex: state.queueIndex
        });
    }

    private getHtmlContent(): string {
        const webview = this.panel.webview;
        const distPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');

        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(distPath, 'player.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(distPath, 'player.js')
        );

        const nonce = this.getNonce();
        const cspSource = webview.cspSource;

        // Read HTML template and replace placeholders
        const htmlPath = path.join(
            this.extensionUri.fsPath, 'dist', 'webview', 'player.html'
        );

        let html: string;
        try {
            html = require('fs').readFileSync(htmlPath, 'utf-8');
        } catch {
            // Fallback: construct HTML directly
            html = this.getInlineHtml();
        }

        return html
            .replace(/\$\{cspSource\}/g, cspSource)
            .replace(/\$\{nonce\}/g, nonce)
            .replace(/\$\{styleUri\}/g, styleUri.toString())
            .replace(/\$\{scriptUri\}/g, scriptUri.toString());
    }

    private getInlineHtml(): string {
        const webview = this.panel.webview;
        const distPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'player.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'player.js'));
        const nonce = this.getNonce();
        const cspSource = webview.cspSource;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" 
          content="default-src 'none'; 
                   img-src ${cspSource} https: data:; 
                   media-src ${cspSource} https: blob:;
                   script-src 'nonce-${nonce}'; 
                   style-src ${cspSource} 'unsafe-inline';
                   font-src ${cspSource};">
    <link rel="stylesheet" href="${styleUri}">
    <title>SonicFlow</title>
</head>
<body>
    <div id="sonicflow-app" class="theme-aurora">
        <div class="sf-header" id="dragBar">
            <div class="sf-logo">
                <span class="sf-logo-icon">◉</span>
                <span class="sf-logo-text">SonicFlow</span>
            </div>
            <div class="sf-header-actions">
                <button class="sf-btn-icon" id="btnMinimize" title="Minimize">─</button>
                <button class="sf-btn-icon" id="btnTheme" title="Change Theme">◐</button>
            </div>
        </div>
        <div class="sf-now-playing">
            <div class="sf-artwork-container">
                <div class="sf-artwork" id="artwork">
                    <div class="sf-artwork-placeholder">♪</div>
                    <img id="artworkImg" class="sf-artwork-img hidden" alt="Album Art"/>
                </div>
                <div class="sf-artwork-glow" id="artworkGlow"></div>
            </div>
            <div class="sf-track-info">
                <div class="sf-track-title" id="trackTitle">No Track Selected</div>
                <div class="sf-track-artist" id="trackArtist">Browse or search for music</div>
                <div class="sf-track-source" id="trackSource"></div>
            </div>
        </div>
        <div class="sf-progress-section">
            <span class="sf-time" id="currentTime">0:00</span>
            <div class="sf-progress-bar" id="progressBar">
                <div class="sf-progress-track">
                    <div class="sf-progress-fill" id="progressFill"></div>
                    <div class="sf-progress-handle" id="progressHandle"></div>
                </div>
            </div>
            <span class="sf-time" id="totalTime">0:00</span>
        </div>
        <div class="sf-controls">
            <button class="sf-btn-control sf-btn-secondary" id="btnShuffle" title="Shuffle">⇄</button>
            <button class="sf-btn-control" id="btnPrev" title="Previous">⏮</button>
            <button class="sf-btn-control sf-btn-play" id="btnPlayPause" title="Play">
                <span id="playIcon">▶</span>
                <span id="pauseIcon" class="hidden">⏸</span>
            </button>
            <button class="sf-btn-control" id="btnNext" title="Next">⏭</button>
            <button class="sf-btn-control sf-btn-secondary" id="btnRepeat" title="Repeat">
                🔁<span class="sf-repeat-badge hidden" id="repeatBadge">1</span>
            </button>
        </div>
        <div class="sf-volume-section">
            <button class="sf-btn-icon" id="btnVolume" title="Volume">
                <span id="volumeIcon">🔊</span>
                <span id="volumeHigh"></span>
                <span id="volumeMed"></span>
            </button>
            <div class="sf-volume-slider-container">
                <input type="range" class="sf-volume-slider" id="volumeSlider" min="0" max="100" value="70">
            </div>
        </div>
        <div class="sf-action-bar">
            <button class="sf-btn-action" id="btnBrowse" title="Browse Local Files">📁 Browse</button>
            <button class="sf-btn-action" id="btnYouTube" title="Search YouTube">🔍 YouTube</button>
            <button class="sf-btn-action" id="btnPlaylist" title="Playlists">📋 Playlists</button>
            <button class="sf-btn-action" id="btnVibe" title="Vibe Mode">🎵 Vibe</button>
        </div>
        <div class="sf-queue-section" id="queueSection">
            <div class="sf-queue-header" id="queueToggle">
                <span>Queue</span>
                <span class="sf-queue-count" id="queueCount">0</span>
            </div>
            <div class="sf-queue-list hidden" id="queueList"></div>
        </div>
        <audio id="audioPlayer" preload="metadata"></audio>
    </div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    dispose(): void {
        PlayerWebview.instance = undefined;
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}