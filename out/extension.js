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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const PlayerManager_1 = require("./players/PlayerManager");
const PlaylistManager_1 = require("./playlist/PlaylistManager");
const VibeEngine_1 = require("./recommendation/VibeEngine");
const PlayerWebview_1 = require("./ui/PlayerWebview");
const StatusBarController_1 = require("./ui/StatusBarController");
const ServiceRegistry_1 = require("./services/ServiceRegistry");
const MemoryManager_1 = require("./utils/MemoryManager");
/**
 * SonicFlow - VS Code Embedded Music Player Extension
 *
 * Features:
 * - Local file playback (MP3, WAV, FLAC, OGG, etc.)
 * - YouTube search and playback
 * - Playlist management with save/export/import
 * - Vibe Mode - smart recommendations
 * - Multiple unique color themes
 * - Status bar controls
 * - Memory-efficient caching
 * - Extensible service architecture
 */
let playerManager;
let playlistManager;
let vibeEngine;
let statusBar;
let serviceRegistry;
function activate(context) {
    console.log('[SonicFlow] Extension activating...');
    // Initialize core components
    playerManager = new PlayerManager_1.PlayerManager();
    playlistManager = new PlaylistManager_1.PlaylistManager(context);
    vibeEngine = new VibeEngine_1.VibeEngine(playerManager.getYouTubePlayer());
    statusBar = new StatusBarController_1.StatusBarController();
    serviceRegistry = new ServiceRegistry_1.ServiceRegistry();
    // Sync status bar with player state
    playerManager.onStateChange((state) => {
        statusBar.update(state);
    });
    // Register all commands
    registerCommands(context);
    console.log('[SonicFlow] Extension activated successfully!');
}
function registerCommands(context) {
    const commands = [
        // Player commands
        ['sonicflow.openPlayer', () => {
                PlayerWebview_1.PlayerWebview.createOrShow(context.extensionUri, playerManager, playlistManager, vibeEngine);
            }],
        ['sonicflow.playPause', () => {
                const webview = PlayerWebview_1.PlayerWebview.getInstance();
                if (webview) {
                    playerManager.togglePlayPause();
                    const state = playerManager.getState();
                    webview.postMessage({ type: state.isPlaying ? 'play' : 'pause' });
                }
                else {
                    // Open player if not open
                    PlayerWebview_1.PlayerWebview.createOrShow(context.extensionUri, playerManager, playlistManager, vibeEngine);
                }
            }],
        ['sonicflow.next', async () => {
                await playerManager.next();
                const webview = PlayerWebview_1.PlayerWebview.getInstance();
                const state = playerManager.getState();
                if (webview && state.currentTrack) {
                    await webview.loadTrack(state.currentTrack);
                }
            }],
        ['sonicflow.previous', async () => {
                await playerManager.previous();
                const webview = PlayerWebview_1.PlayerWebview.getInstance();
                const state = playerManager.getState();
                if (webview && state.currentTrack) {
                    await webview.loadTrack(state.currentTrack);
                }
            }],
        // Browse commands
        ['sonicflow.browseLocal', async () => {
                const webview = PlayerWebview_1.PlayerWebview.createOrShow(context.extensionUri, playerManager, playlistManager, vibeEngine);
                const localPlayer = playerManager.getLocalPlayer();
                const tracks = await localPlayer.browseFiles();
                if (tracks.length > 0) {
                    playerManager.clearQueue();
                    await playerManager.addTracksToQueue(tracks, true);
                    await webview.loadTrack(tracks[0]);
                }
            }],
        ['sonicflow.searchYouTube', async () => {
                const webview = PlayerWebview_1.PlayerWebview.createOrShow(context.extensionUri, playerManager, playlistManager, vibeEngine);
                const ytPlayer = playerManager.getYouTubePlayer();
                const track = await ytPlayer.interactiveSearch();
                if (track) {
                    await playerManager.addToQueue(track, true);
                    await webview.loadTrack(track);
                }
            }],
        // Playlist commands
        ['sonicflow.showPlaylist', async () => {
                const playlist = await playlistManager.pickPlaylist();
                if (playlist && playlist.tracks.length > 0) {
                    const webview = PlayerWebview_1.PlayerWebview.createOrShow(context.extensionUri, playerManager, playlistManager, vibeEngine);
                    playerManager.clearQueue();
                    await playerManager.addTracksToQueue(playlist.tracks, true);
                    await webview.loadTrack(playlist.tracks[0]);
                }
            }],
        ['sonicflow.createPlaylist', async () => {
                await playlistManager.createPlaylist();
            }],
        ['sonicflow.exportPlaylists', async () => {
                await playlistManager.exportPlaylists();
            }],
        ['sonicflow.importPlaylists', async () => {
                await playlistManager.importPlaylists();
            }],
        // Mode commands
        ['sonicflow.toggleVibeMode', () => {
                playerManager.toggleVibeMode();
                const state = playerManager.getState();
                vscode.window.showInformationMessage(`Vibe Mode: ${state.vibeMode ? 'ON 🎵' : 'OFF'}`);
            }],
        ['sonicflow.toggleShuffle', () => {
                playerManager.toggleShuffle();
                const state = playerManager.getState();
                vscode.window.showInformationMessage(`Shuffle: ${state.shuffle ? 'ON' : 'OFF'}`);
            }],
        ['sonicflow.toggleRepeat', () => {
                playerManager.toggleRepeat();
                const state = playerManager.getState();
                const labels = { none: 'Off', one: 'One', all: 'All' };
                vscode.window.showInformationMessage(`Repeat: ${labels[state.repeat]}`);
            }],
        ['sonicflow.setVolume', async () => {
                const input = await vscode.window.showInputBox({
                    prompt: 'Set volume (0-100)',
                    value: playerManager.getState().volume.toString(),
                    validateInput: (value) => {
                        const num = parseInt(value);
                        if (isNaN(num) || num < 0 || num > 100) {
                            return 'Please enter a number between 0 and 100';
                        }
                        return null;
                    }
                });
                if (input !== undefined) {
                    const volume = parseInt(input);
                    playerManager.setVolume(volume);
                    const webview = PlayerWebview_1.PlayerWebview.getInstance();
                    if (webview) {
                        webview.postMessage({ type: 'setVolume', volume });
                    }
                }
            }],
        ['sonicflow.showQueue', () => {
                const state = playerManager.getState();
                if (state.queue.length === 0) {
                    vscode.window.showInformationMessage('Queue is empty. Browse or search for music!');
                    return;
                }
                const items = state.queue.map((track, index) => ({
                    label: `${index === state.queueIndex ? '▶ ' : ''}${track.title}`,
                    description: track.artist,
                    detail: `${track.source === 'youtube' ? 'YouTube' : 'Local'} | ${formatDuration(track.duration)}`
                }));
                vscode.window.showQuickPick(items, {
                    title: `SonicFlow Queue (${state.queue.length} tracks)`,
                    placeHolder: 'Current queue'
                });
            }],
        ['sonicflow.clearCache', () => {
                const memoryManager = MemoryManager_1.MemoryManager.getInstance();
                const stats = memoryManager.getStats();
                memoryManager.clear();
                vscode.window.showInformationMessage(`Cache cleared! (Was: ${stats.keys} entries, ${stats.memoryEstimate})`);
            }]
    ];
    // Register all commands
    for (const [id, handler] of commands) {
        context.subscriptions.push(vscode.commands.registerCommand(id, handler));
    }
    // Register disposables
    context.subscriptions.push(statusBar, { dispose: () => playerManager.dispose() }, { dispose: () => playlistManager.dispose() }, { dispose: () => serviceRegistry.dispose() }, { dispose: () => MemoryManager_1.MemoryManager.getInstance().dispose() });
}
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
function deactivate() {
    console.log('[SonicFlow] Extension deactivating...');
    // Save state before deactivation
    const state = playerManager?.getState();
    if (state?.currentTrack) {
        console.log(`[SonicFlow] Last played: ${state.currentTrack.title}`);
    }
    // Cleanup is handled by disposables registered in context.subscriptions
}
//# sourceMappingURL=extension.js.map