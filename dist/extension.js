/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(__webpack_require__(1));
const PlayerManager_1 = __webpack_require__(2);
const PlaylistManager_1 = __webpack_require__(145);
const VibeEngine_1 = __webpack_require__(147);
const PlayerWebview_1 = __webpack_require__(148);
const StatusBarController_1 = __webpack_require__(149);
const ServiceRegistry_1 = __webpack_require__(150);
const MemoryManager_1 = __webpack_require__(111);
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


/***/ }),
/* 1 */
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerManager = void 0;
const vscode = __importStar(__webpack_require__(1));
const LocalPlayer_1 = __webpack_require__(3);
const YouTubePlayer_1 = __webpack_require__(116);
/**
 * Central player manager that coordinates between different
 * music sources and maintains the unified player state.
 */
class PlayerManager {
    constructor() {
        this.stateChangeEmitter = new vscode.EventEmitter();
        this.onStateChange = this.stateChangeEmitter.event;
        this.localPlayer = new LocalPlayer_1.LocalPlayer();
        this.youtubePlayer = new YouTubePlayer_1.YouTubePlayer();
        this.state = this.getDefaultState();
    }
    getState() {
        return { ...this.state };
    }
    getLocalPlayer() {
        return this.localPlayer;
    }
    getYouTubePlayer() {
        return this.youtubePlayer;
    }
    /**
     * Play a specific track
     */
    async play(track) {
        this.state.currentTrack = track;
        this.state.isPlaying = true;
        this.state.position = 0;
        this.state.duration = track.duration;
        this.emitStateChange();
    }
    /**
     * Add track to queue and optionally play it
     */
    async addToQueue(track, playNow = false) {
        this.state.queue.push(track);
        if (playNow || !this.state.currentTrack) {
            this.state.queueIndex = this.state.queue.length - 1;
            await this.play(track);
        }
        this.emitStateChange();
    }
    /**
     * Add multiple tracks to queue
     */
    async addTracksToQueue(tracks, playFirst = false) {
        const startIndex = this.state.queue.length;
        this.state.queue.push(...tracks);
        if (playFirst && tracks.length > 0) {
            this.state.queueIndex = startIndex;
            await this.play(tracks[0]);
        }
        this.emitStateChange();
    }
    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        this.state.isPlaying = !this.state.isPlaying;
        this.emitStateChange();
    }
    /**
     * Play next track in queue
     */
    async next() {
        if (this.state.queue.length === 0) {
            return;
        }
        if (this.state.shuffle) {
            const randomIndex = Math.floor(Math.random() * this.state.queue.length);
            this.state.queueIndex = randomIndex;
        }
        else {
            this.state.queueIndex++;
            if (this.state.queueIndex >= this.state.queue.length) {
                if (this.state.repeat === 'all') {
                    this.state.queueIndex = 0;
                }
                else {
                    this.state.isPlaying = false;
                    this.emitStateChange();
                    return;
                }
            }
        }
        const nextTrack = this.state.queue[this.state.queueIndex];
        if (nextTrack) {
            await this.play(nextTrack);
        }
    }
    /**
     * Play previous track in queue
     */
    async previous() {
        if (this.state.queue.length === 0) {
            return;
        }
        // If we're more than 3 seconds in, restart the current track
        if (this.state.position > 3) {
            this.state.position = 0;
            this.emitStateChange();
            return;
        }
        this.state.queueIndex--;
        if (this.state.queueIndex < 0) {
            if (this.state.repeat === 'all') {
                this.state.queueIndex = this.state.queue.length - 1;
            }
            else {
                this.state.queueIndex = 0;
            }
        }
        const prevTrack = this.state.queue[this.state.queueIndex];
        if (prevTrack) {
            await this.play(prevTrack);
        }
    }
    /**
     * Set volume (0-100)
     */
    setVolume(volume) {
        this.state.volume = Math.max(0, Math.min(100, volume));
        this.emitStateChange();
    }
    /**
     * Seek to position in seconds
     */
    seek(position) {
        this.state.position = Math.max(0, Math.min(position, this.state.duration));
        this.emitStateChange();
    }
    /**
     * Update playback position (called from webview)
     */
    updatePosition(position) {
        this.state.position = position;
        // Don't emit for position updates to avoid excessive communication
    }
    /**
     * Toggle shuffle mode
     */
    toggleShuffle() {
        this.state.shuffle = !this.state.shuffle;
        this.emitStateChange();
    }
    /**
     * Toggle repeat mode: none -> all -> one -> none
     */
    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(this.state.repeat);
        this.state.repeat = modes[(currentIndex + 1) % modes.length];
        this.emitStateChange();
    }
    /**
     * Toggle vibe mode (auto-recommendations)
     */
    toggleVibeMode() {
        this.state.vibeMode = !this.state.vibeMode;
        this.emitStateChange();
    }
    /**
     * Clear the queue
     */
    clearQueue() {
        this.state.queue = [];
        this.state.queueIndex = -1;
        this.emitStateChange();
    }
    /**
     * Remove a track from the queue
     */
    removeFromQueue(index) {
        if (index >= 0 && index < this.state.queue.length) {
            this.state.queue.splice(index, 1);
            if (index < this.state.queueIndex) {
                this.state.queueIndex--;
            }
            this.emitStateChange();
        }
    }
    /**
     * Handle track ended event
     */
    async onTrackEnded() {
        if (this.state.repeat === 'one') {
            this.state.position = 0;
            this.state.isPlaying = true;
            this.emitStateChange();
            return;
        }
        // Vibe mode: fetch similar tracks when queue is running low
        if (this.state.vibeMode &&
            this.state.queueIndex >= this.state.queue.length - 2 &&
            this.state.currentTrack) {
            const relatedTracks = await this.youtubePlayer.getRelatedTracks(this.state.currentTrack, 5);
            if (relatedTracks.length > 0) {
                this.state.queue.push(...relatedTracks);
            }
        }
        await this.next();
    }
    /**
     * Get the stream URL for current track
     */
    async getStreamUrl(track, webview) {
        if (track.source === 'local' && webview) {
            return this.localPlayer.getPlaybackUri(track, webview).toString();
        }
        else if (track.source === 'youtube') {
            return this.youtubePlayer.getStreamUrl(track.uri);
        }
        return null;
    }
    getDefaultState() {
        return {
            currentTrack: null,
            isPlaying: false,
            volume: vscode.workspace.getConfiguration('sonicflow').get('defaultVolume', 70),
            position: 0,
            duration: 0,
            shuffle: false,
            repeat: 'none',
            vibeMode: false,
            queue: [],
            queueIndex: -1
        };
    }
    emitStateChange() {
        this.stateChangeEmitter.fire(this.getState());
    }
    dispose() {
        this.youtubePlayer.dispose();
        this.stateChangeEmitter.dispose();
    }
}
exports.PlayerManager = PlayerManager;


/***/ }),
/* 3 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LocalPlayer = void 0;
const vscode = __importStar(__webpack_require__(1));
const path = __importStar(__webpack_require__(4));
const fs = __importStar(__webpack_require__(5));
const mm = __importStar(__webpack_require__(6));
const Constants_1 = __webpack_require__(110);
const MemoryManager_1 = __webpack_require__(111);
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


/***/ }),
/* 4 */
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),
/* 5 */
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ratingToStars = exports.orderTags = exports.parseFile = exports.parseStream = exports.selectCover = exports.parseBuffer = exports.parseFromTokenizer = void 0;
const strtok3 = __webpack_require__(7);
const Core = __webpack_require__(18);
const ParserFactory_1 = __webpack_require__(19);
const debug_1 = __webpack_require__(27);
const RandomFileReader_1 = __webpack_require__(109);
const debug = (0, debug_1.default)("music-metadata:parser");
var core_1 = __webpack_require__(18);
Object.defineProperty(exports, "parseFromTokenizer", ({ enumerable: true, get: function () { return core_1.parseFromTokenizer; } }));
Object.defineProperty(exports, "parseBuffer", ({ enumerable: true, get: function () { return core_1.parseBuffer; } }));
Object.defineProperty(exports, "selectCover", ({ enumerable: true, get: function () { return core_1.selectCover; } }));
/**
 * Parse audio from Node Stream.Readable
 * @param stream - Stream to read the audio track from
 * @param fileInfo - File information object or MIME-type, e.g.: 'audio/mpeg'
 * @param options - Parsing options
 * @returns Metadata
 */
async function parseStream(stream, fileInfo, options = {}) {
    const tokenizer = await strtok3.fromStream(stream, typeof fileInfo === 'string' ? { mimeType: fileInfo } : fileInfo);
    return Core.parseFromTokenizer(tokenizer, options);
}
exports.parseStream = parseStream;
/**
 * Parse audio from Node file
 * @param filePath - Media file to read meta-data from
 * @param options - Parsing options
 * @returns Metadata
 */
async function parseFile(filePath, options = {}) {
    debug(`parseFile: ${filePath}`);
    const fileTokenizer = await strtok3.fromFile(filePath);
    const fileReader = await RandomFileReader_1.RandomFileReader.init(filePath, fileTokenizer.fileInfo.size);
    try {
        await Core.scanAppendingHeaders(fileReader, options);
    }
    finally {
        await fileReader.close();
    }
    try {
        const parserName = ParserFactory_1.ParserFactory.getParserIdForExtension(filePath);
        if (!parserName)
            debug(' Parser could not be determined by file extension');
        return await ParserFactory_1.ParserFactory.parse(fileTokenizer, parserName, options);
    }
    finally {
        await fileTokenizer.close();
    }
}
exports.parseFile = parseFile;
/**
 * Create a dictionary ordered by their tag id (key)
 * @param nativeTags - List of tags
 * @returns Tags indexed by id
 */
exports.orderTags = Core.orderTags;
/**
 * Convert rating to 1-5 star rating
 * @param rating - Normalized rating [0..1] (common.rating[n].rating)
 * @returns Number of stars: 1, 2, 3, 4 or 5 stars
 */
exports.ratingToStars = Core.ratingToStars;
/**
 * Define default module exports
 */
exports["default"] = {
    parseStream,
    parseFile,
    parseFromTokenizer: Core.parseFromTokenizer,
    parseBuffer: Core.parseBuffer,
    selectCover: Core.selectCover
};


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fromStream = exports.fromBuffer = exports.EndOfStreamError = exports.fromFile = void 0;
const fs = __webpack_require__(8);
const core = __webpack_require__(9);
var FileTokenizer_1 = __webpack_require__(17);
Object.defineProperty(exports, "fromFile", ({ enumerable: true, get: function () { return FileTokenizer_1.fromFile; } }));
var core_1 = __webpack_require__(9);
Object.defineProperty(exports, "EndOfStreamError", ({ enumerable: true, get: function () { return core_1.EndOfStreamError; } }));
Object.defineProperty(exports, "fromBuffer", ({ enumerable: true, get: function () { return core_1.fromBuffer; } }));
/**
 * Construct ReadStreamTokenizer from given Stream.
 * Will set fileSize, if provided given Stream has set the .path property.
 * @param stream - Node.js Stream.Readable
 * @param fileInfo - Pass additional file information to the tokenizer
 * @returns Tokenizer
 */
async function fromStream(stream, fileInfo) {
    fileInfo = fileInfo ? fileInfo : {};
    if (stream.path) {
        const stat = await fs.stat(stream.path);
        fileInfo.path = stream.path;
        fileInfo.size = stat.size;
    }
    return core.fromStream(stream, fileInfo);
}
exports.fromStream = fromStream;


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

/**
 * Module convert fs functions to promise based functions
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.readFile = exports.writeFileSync = exports.writeFile = exports.read = exports.open = exports.close = exports.stat = exports.createReadStream = exports.pathExists = void 0;
const fs = __webpack_require__(5);
exports.pathExists = fs.existsSync;
exports.createReadStream = fs.createReadStream;
async function stat(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err)
                reject(err);
            else
                resolve(stats);
        });
    });
}
exports.stat = stat;
async function close(fd) {
    return new Promise((resolve, reject) => {
        fs.close(fd, err => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
exports.close = close;
async function open(path, mode) {
    return new Promise((resolve, reject) => {
        fs.open(path, mode, (err, fd) => {
            if (err)
                reject(err);
            else
                resolve(fd);
        });
    });
}
exports.open = open;
async function read(fd, buffer, offset, length, position) {
    return new Promise((resolve, reject) => {
        fs.read(fd, buffer, offset, length, position, (err, bytesRead, _buffer) => {
            if (err)
                reject(err);
            else
                resolve({ bytesRead, buffer: _buffer });
        });
    });
}
exports.read = read;
async function writeFile(path, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, err => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
exports.writeFile = writeFile;
function writeFileSync(path, data) {
    fs.writeFileSync(path, data);
}
exports.writeFileSync = writeFileSync;
async function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, buffer) => {
            if (err)
                reject(err);
            else
                resolve(buffer);
        });
    });
}
exports.readFile = readFile;


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fromBuffer = exports.fromStream = exports.EndOfStreamError = void 0;
const ReadStreamTokenizer_1 = __webpack_require__(10);
const BufferTokenizer_1 = __webpack_require__(16);
var peek_readable_1 = __webpack_require__(12);
Object.defineProperty(exports, "EndOfStreamError", ({ enumerable: true, get: function () { return peek_readable_1.EndOfStreamError; } }));
/**
 * Construct ReadStreamTokenizer from given Stream.
 * Will set fileSize, if provided given Stream has set the .path property/
 * @param stream - Read from Node.js Stream.Readable
 * @param fileInfo - Pass the file information, like size and MIME-type of the corresponding stream.
 * @returns ReadStreamTokenizer
 */
function fromStream(stream, fileInfo) {
    fileInfo = fileInfo ? fileInfo : {};
    return new ReadStreamTokenizer_1.ReadStreamTokenizer(stream, fileInfo);
}
exports.fromStream = fromStream;
/**
 * Construct ReadStreamTokenizer from given Buffer.
 * @param uint8Array - Uint8Array to tokenize
 * @param fileInfo - Pass additional file information to the tokenizer
 * @returns BufferTokenizer
 */
function fromBuffer(uint8Array, fileInfo) {
    return new BufferTokenizer_1.BufferTokenizer(uint8Array, fileInfo);
}
exports.fromBuffer = fromBuffer;


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReadStreamTokenizer = void 0;
const AbstractTokenizer_1 = __webpack_require__(11);
const peek_readable_1 = __webpack_require__(12);
const maxBufferSize = 256000;
class ReadStreamTokenizer extends AbstractTokenizer_1.AbstractTokenizer {
    constructor(stream, fileInfo) {
        super(fileInfo);
        this.streamReader = new peek_readable_1.StreamReader(stream);
    }
    /**
     * Get file information, an HTTP-client may implement this doing a HEAD request
     * @return Promise with file information
     */
    async getFileInfo() {
        return this.fileInfo;
    }
    /**
     * Read buffer from tokenizer
     * @param uint8Array - Target Uint8Array to fill with data read from the tokenizer-stream
     * @param options - Read behaviour options
     * @returns Promise with number of bytes read
     */
    async readBuffer(uint8Array, options) {
        const normOptions = this.normalizeOptions(uint8Array, options);
        const skipBytes = normOptions.position - this.position;
        if (skipBytes > 0) {
            await this.ignore(skipBytes);
            return this.readBuffer(uint8Array, options);
        }
        else if (skipBytes < 0) {
            throw new Error('`options.position` must be equal or greater than `tokenizer.position`');
        }
        if (normOptions.length === 0) {
            return 0;
        }
        const bytesRead = await this.streamReader.read(uint8Array, normOptions.offset, normOptions.length);
        this.position += bytesRead;
        if ((!options || !options.mayBeLess) && bytesRead < normOptions.length) {
            throw new peek_readable_1.EndOfStreamError();
        }
        return bytesRead;
    }
    /**
     * Peek (read ahead) buffer from tokenizer
     * @param uint8Array - Uint8Array (or Buffer) to write data to
     * @param options - Read behaviour options
     * @returns Promise with number of bytes peeked
     */
    async peekBuffer(uint8Array, options) {
        const normOptions = this.normalizeOptions(uint8Array, options);
        let bytesRead = 0;
        if (normOptions.position) {
            const skipBytes = normOptions.position - this.position;
            if (skipBytes > 0) {
                const skipBuffer = new Uint8Array(normOptions.length + skipBytes);
                bytesRead = await this.peekBuffer(skipBuffer, { mayBeLess: normOptions.mayBeLess });
                uint8Array.set(skipBuffer.subarray(skipBytes), normOptions.offset);
                return bytesRead - skipBytes;
            }
            else if (skipBytes < 0) {
                throw new Error('Cannot peek from a negative offset in a stream');
            }
        }
        if (normOptions.length > 0) {
            try {
                bytesRead = await this.streamReader.peek(uint8Array, normOptions.offset, normOptions.length);
            }
            catch (err) {
                if (options && options.mayBeLess && err instanceof peek_readable_1.EndOfStreamError) {
                    return 0;
                }
                throw err;
            }
            if ((!normOptions.mayBeLess) && bytesRead < normOptions.length) {
                throw new peek_readable_1.EndOfStreamError();
            }
        }
        return bytesRead;
    }
    async ignore(length) {
        // debug(`ignore ${this.position}...${this.position + length - 1}`);
        const bufSize = Math.min(maxBufferSize, length);
        const buf = new Uint8Array(bufSize);
        let totBytesRead = 0;
        while (totBytesRead < length) {
            const remaining = length - totBytesRead;
            const bytesRead = await this.readBuffer(buf, { length: Math.min(bufSize, remaining) });
            if (bytesRead < 0) {
                return bytesRead;
            }
            totBytesRead += bytesRead;
        }
        return totBytesRead;
    }
}
exports.ReadStreamTokenizer = ReadStreamTokenizer;


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbstractTokenizer = void 0;
const peek_readable_1 = __webpack_require__(12);
/**
 * Core tokenizer
 */
class AbstractTokenizer {
    constructor(fileInfo) {
        /**
         * Tokenizer-stream position
         */
        this.position = 0;
        this.numBuffer = new Uint8Array(8);
        this.fileInfo = fileInfo ? fileInfo : {};
    }
    /**
     * Read a token from the tokenizer-stream
     * @param token - The token to read
     * @param position - If provided, the desired position in the tokenizer-stream
     * @returns Promise with token data
     */
    async readToken(token, position = this.position) {
        const uint8Array = Buffer.alloc(token.len);
        const len = await this.readBuffer(uint8Array, { position });
        if (len < token.len)
            throw new peek_readable_1.EndOfStreamError();
        return token.get(uint8Array, 0);
    }
    /**
     * Peek a token from the tokenizer-stream.
     * @param token - Token to peek from the tokenizer-stream.
     * @param position - Offset where to begin reading within the file. If position is null, data will be read from the current file position.
     * @returns Promise with token data
     */
    async peekToken(token, position = this.position) {
        const uint8Array = Buffer.alloc(token.len);
        const len = await this.peekBuffer(uint8Array, { position });
        if (len < token.len)
            throw new peek_readable_1.EndOfStreamError();
        return token.get(uint8Array, 0);
    }
    /**
     * Read a numeric token from the stream
     * @param token - Numeric token
     * @returns Promise with number
     */
    async readNumber(token) {
        const len = await this.readBuffer(this.numBuffer, { length: token.len });
        if (len < token.len)
            throw new peek_readable_1.EndOfStreamError();
        return token.get(this.numBuffer, 0);
    }
    /**
     * Read a numeric token from the stream
     * @param token - Numeric token
     * @returns Promise with number
     */
    async peekNumber(token) {
        const len = await this.peekBuffer(this.numBuffer, { length: token.len });
        if (len < token.len)
            throw new peek_readable_1.EndOfStreamError();
        return token.get(this.numBuffer, 0);
    }
    /**
     * Ignore number of bytes, advances the pointer in under tokenizer-stream.
     * @param length - Number of bytes to ignore
     * @return resolves the number of bytes ignored, equals length if this available, otherwise the number of bytes available
     */
    async ignore(length) {
        if (this.fileInfo.size !== undefined) {
            const bytesLeft = this.fileInfo.size - this.position;
            if (length > bytesLeft) {
                this.position += bytesLeft;
                return bytesLeft;
            }
        }
        this.position += length;
        return length;
    }
    async close() {
        // empty
    }
    normalizeOptions(uint8Array, options) {
        if (options && options.position !== undefined && options.position < this.position) {
            throw new Error('`options.position` must be equal or greater than `tokenizer.position`');
        }
        if (options) {
            return {
                mayBeLess: options.mayBeLess === true,
                offset: options.offset ? options.offset : 0,
                length: options.length ? options.length : (uint8Array.length - (options.offset ? options.offset : 0)),
                position: options.position ? options.position : this.position
            };
        }
        return {
            mayBeLess: false,
            offset: 0,
            length: uint8Array.length,
            position: this.position
        };
    }
}
exports.AbstractTokenizer = AbstractTokenizer;


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamReader = exports.EndOfStreamError = void 0;
var EndOfFileStream_1 = __webpack_require__(13);
Object.defineProperty(exports, "EndOfStreamError", ({ enumerable: true, get: function () { return EndOfFileStream_1.EndOfStreamError; } }));
var StreamReader_1 = __webpack_require__(14);
Object.defineProperty(exports, "StreamReader", ({ enumerable: true, get: function () { return StreamReader_1.StreamReader; } }));


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EndOfStreamError = exports.defaultMessages = void 0;
exports.defaultMessages = 'End-Of-Stream';
/**
 * Thrown on read operation of the end of file or stream has been reached
 */
class EndOfStreamError extends Error {
    constructor() {
        super(exports.defaultMessages);
    }
}
exports.EndOfStreamError = EndOfStreamError;


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamReader = exports.EndOfStreamError = void 0;
const EndOfFileStream_1 = __webpack_require__(13);
const Deferred_1 = __webpack_require__(15);
var EndOfFileStream_2 = __webpack_require__(13);
Object.defineProperty(exports, "EndOfStreamError", ({ enumerable: true, get: function () { return EndOfFileStream_2.EndOfStreamError; } }));
const maxStreamReadSize = 1 * 1024 * 1024; // Maximum request length on read-stream operation
class StreamReader {
    constructor(s) {
        this.s = s;
        /**
         * Deferred used for postponed read request (as not data is yet available to read)
         */
        this.deferred = null;
        this.endOfStream = false;
        /**
         * Store peeked data
         * @type {Array}
         */
        this.peekQueue = [];
        if (!s.read || !s.once) {
            throw new Error('Expected an instance of stream.Readable');
        }
        this.s.once('end', () => this.reject(new EndOfFileStream_1.EndOfStreamError()));
        this.s.once('error', err => this.reject(err));
        this.s.once('close', () => this.reject(new Error('Stream closed')));
    }
    /**
     * Read ahead (peek) from stream. Subsequent read or peeks will return the same data
     * @param uint8Array - Uint8Array (or Buffer) to store data read from stream in
     * @param offset - Offset target
     * @param length - Number of bytes to read
     * @returns Number of bytes peeked
     */
    async peek(uint8Array, offset, length) {
        const bytesRead = await this.read(uint8Array, offset, length);
        this.peekQueue.push(uint8Array.subarray(offset, offset + bytesRead)); // Put read data back to peek buffer
        return bytesRead;
    }
    /**
     * Read chunk from stream
     * @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
     * @param offset - Offset target
     * @param length - Number of bytes to read
     * @returns Number of bytes read
     */
    async read(buffer, offset, length) {
        if (length === 0) {
            return 0;
        }
        if (this.peekQueue.length === 0 && this.endOfStream) {
            throw new EndOfFileStream_1.EndOfStreamError();
        }
        let remaining = length;
        let bytesRead = 0;
        // consume peeked data first
        while (this.peekQueue.length > 0 && remaining > 0) {
            const peekData = this.peekQueue.pop(); // Front of queue
            if (!peekData)
                throw new Error('peekData should be defined');
            const lenCopy = Math.min(peekData.length, remaining);
            buffer.set(peekData.subarray(0, lenCopy), offset + bytesRead);
            bytesRead += lenCopy;
            remaining -= lenCopy;
            if (lenCopy < peekData.length) {
                // remainder back to queue
                this.peekQueue.push(peekData.subarray(lenCopy));
            }
        }
        // continue reading from stream if required
        while (remaining > 0 && !this.endOfStream) {
            const reqLen = Math.min(remaining, maxStreamReadSize);
            const chunkLen = await this.readFromStream(buffer, offset + bytesRead, reqLen);
            bytesRead += chunkLen;
            if (chunkLen < reqLen)
                break;
            remaining -= chunkLen;
        }
        return bytesRead;
    }
    /**
     * Read chunk from stream
     * @param buffer Target Uint8Array (or Buffer) to store data read from stream in
     * @param offset Offset target
     * @param length Number of bytes to read
     * @returns Number of bytes read
     */
    async readFromStream(buffer, offset, length) {
        const readBuffer = this.s.read(length);
        if (readBuffer) {
            buffer.set(readBuffer, offset);
            return readBuffer.length;
        }
        else {
            const request = {
                buffer,
                offset,
                length,
                deferred: new Deferred_1.Deferred()
            };
            this.deferred = request.deferred;
            this.s.once('readable', () => {
                this.readDeferred(request);
            });
            return request.deferred.promise;
        }
    }
    /**
     * Process deferred read request
     * @param request Deferred read request
     */
    readDeferred(request) {
        const readBuffer = this.s.read(request.length);
        if (readBuffer) {
            request.buffer.set(readBuffer, request.offset);
            request.deferred.resolve(readBuffer.length);
            this.deferred = null;
        }
        else {
            this.s.once('readable', () => {
                this.readDeferred(request);
            });
        }
    }
    reject(err) {
        this.endOfStream = true;
        if (this.deferred) {
            this.deferred.reject(err);
            this.deferred = null;
        }
    }
}
exports.StreamReader = StreamReader;


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Deferred = void 0;
class Deferred {
    constructor() {
        this.resolve = () => null;
        this.reject = () => null;
        this.promise = new Promise((resolve, reject) => {
            this.reject = reject;
            this.resolve = resolve;
        });
    }
}
exports.Deferred = Deferred;


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BufferTokenizer = void 0;
const peek_readable_1 = __webpack_require__(12);
const AbstractTokenizer_1 = __webpack_require__(11);
class BufferTokenizer extends AbstractTokenizer_1.AbstractTokenizer {
    /**
     * Construct BufferTokenizer
     * @param uint8Array - Uint8Array to tokenize
     * @param fileInfo - Pass additional file information to the tokenizer
     */
    constructor(uint8Array, fileInfo) {
        super(fileInfo);
        this.uint8Array = uint8Array;
        this.fileInfo.size = this.fileInfo.size ? this.fileInfo.size : uint8Array.length;
    }
    /**
     * Read buffer from tokenizer
     * @param uint8Array - Uint8Array to tokenize
     * @param options - Read behaviour options
     * @returns {Promise<number>}
     */
    async readBuffer(uint8Array, options) {
        if (options && options.position) {
            if (options.position < this.position) {
                throw new Error('`options.position` must be equal or greater than `tokenizer.position`');
            }
            this.position = options.position;
        }
        const bytesRead = await this.peekBuffer(uint8Array, options);
        this.position += bytesRead;
        return bytesRead;
    }
    /**
     * Peek (read ahead) buffer from tokenizer
     * @param uint8Array
     * @param options - Read behaviour options
     * @returns {Promise<number>}
     */
    async peekBuffer(uint8Array, options) {
        const normOptions = this.normalizeOptions(uint8Array, options);
        const bytes2read = Math.min(this.uint8Array.length - normOptions.position, normOptions.length);
        if ((!normOptions.mayBeLess) && bytes2read < normOptions.length) {
            throw new peek_readable_1.EndOfStreamError();
        }
        else {
            uint8Array.set(this.uint8Array.subarray(normOptions.position, normOptions.position + bytes2read), normOptions.offset);
            return bytes2read;
        }
    }
    async close() {
        // empty
    }
}
exports.BufferTokenizer = BufferTokenizer;


/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fromFile = exports.FileTokenizer = void 0;
const AbstractTokenizer_1 = __webpack_require__(11);
const peek_readable_1 = __webpack_require__(12);
const fs = __webpack_require__(8);
class FileTokenizer extends AbstractTokenizer_1.AbstractTokenizer {
    constructor(fd, fileInfo) {
        super(fileInfo);
        this.fd = fd;
    }
    /**
     * Read buffer from file
     * @param uint8Array - Uint8Array to write result to
     * @param options - Read behaviour options
     * @returns Promise number of bytes read
     */
    async readBuffer(uint8Array, options) {
        const normOptions = this.normalizeOptions(uint8Array, options);
        this.position = normOptions.position;
        const res = await fs.read(this.fd, uint8Array, normOptions.offset, normOptions.length, normOptions.position);
        this.position += res.bytesRead;
        if (res.bytesRead < normOptions.length && (!options || !options.mayBeLess)) {
            throw new peek_readable_1.EndOfStreamError();
        }
        return res.bytesRead;
    }
    /**
     * Peek buffer from file
     * @param uint8Array - Uint8Array (or Buffer) to write data to
     * @param options - Read behaviour options
     * @returns Promise number of bytes read
     */
    async peekBuffer(uint8Array, options) {
        const normOptions = this.normalizeOptions(uint8Array, options);
        const res = await fs.read(this.fd, uint8Array, normOptions.offset, normOptions.length, normOptions.position);
        if ((!normOptions.mayBeLess) && res.bytesRead < normOptions.length) {
            throw new peek_readable_1.EndOfStreamError();
        }
        return res.bytesRead;
    }
    async close() {
        return fs.close(this.fd);
    }
}
exports.FileTokenizer = FileTokenizer;
async function fromFile(sourceFilePath) {
    const stat = await fs.stat(sourceFilePath);
    if (!stat.isFile) {
        throw new Error(`File not a file: ${sourceFilePath}`);
    }
    const fd = await fs.open(sourceFilePath, 'r');
    return new FileTokenizer(fd, { path: sourceFilePath, size: stat.size });
}
exports.fromFile = fromFile;


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.scanAppendingHeaders = exports.selectCover = exports.ratingToStars = exports.orderTags = exports.parseFromTokenizer = exports.parseBuffer = exports.parseStream = void 0;
const strtok3 = __webpack_require__(9);
const ParserFactory_1 = __webpack_require__(19);
const RandomUint8ArrayReader_1 = __webpack_require__(107);
const APEv2Parser_1 = __webpack_require__(61);
const ID3v1Parser_1 = __webpack_require__(59);
const Lyrics3_1 = __webpack_require__(108);
/**
 * Parse audio from Node Stream.Readable
 * @param stream - Stream to read the audio track from
 * @param options - Parsing options
 * @param fileInfo - File information object or MIME-type string
 * @returns Metadata
 */
function parseStream(stream, fileInfo, options = {}) {
    return parseFromTokenizer(strtok3.fromStream(stream, typeof fileInfo === 'string' ? { mimeType: fileInfo } : fileInfo), options);
}
exports.parseStream = parseStream;
/**
 * Parse audio from Node Buffer
 * @param uint8Array - Uint8Array holding audio data
 * @param fileInfo - File information object or MIME-type string
 * @param options - Parsing options
 * @returns Metadata
 * Ref: https://github.com/Borewit/strtok3/blob/e6938c81ff685074d5eb3064a11c0b03ca934c1d/src/index.ts#L15
 */
async function parseBuffer(uint8Array, fileInfo, options = {}) {
    const bufferReader = new RandomUint8ArrayReader_1.RandomUint8ArrayReader(uint8Array);
    await scanAppendingHeaders(bufferReader, options);
    const tokenizer = strtok3.fromBuffer(uint8Array, typeof fileInfo === 'string' ? { mimeType: fileInfo } : fileInfo);
    return parseFromTokenizer(tokenizer, options);
}
exports.parseBuffer = parseBuffer;
/**
 * Parse audio from ITokenizer source
 * @param tokenizer - Audio source implementing the tokenizer interface
 * @param options - Parsing options
 * @returns Metadata
 */
function parseFromTokenizer(tokenizer, options) {
    return ParserFactory_1.ParserFactory.parseOnContentType(tokenizer, options);
}
exports.parseFromTokenizer = parseFromTokenizer;
/**
 * Create a dictionary ordered by their tag id (key)
 * @param nativeTags list of tags
 * @returns tags indexed by id
 */
function orderTags(nativeTags) {
    const tags = {};
    for (const tag of nativeTags) {
        (tags[tag.id] = (tags[tag.id] || [])).push(tag.value);
    }
    return tags;
}
exports.orderTags = orderTags;
/**
 * Convert rating to 1-5 star rating
 * @param rating: Normalized rating [0..1] (common.rating[n].rating)
 * @returns Number of stars: 1, 2, 3, 4 or 5 stars
 */
function ratingToStars(rating) {
    return rating === undefined ? 0 : 1 + Math.round(rating * 4);
}
exports.ratingToStars = ratingToStars;
/**
 * Select most likely cover image.
 * @param pictures Usually metadata.common.picture
 * @return Cover image, if any, otherwise null
 */
function selectCover(pictures) {
    return pictures ? pictures.reduce((acc, cur) => {
        if (cur.name && cur.name.toLowerCase() in ['front', 'cover', 'cover (front)'])
            return cur;
        return acc;
    }) : null;
}
exports.selectCover = selectCover;
async function scanAppendingHeaders(randomReader, options = {}) {
    let apeOffset = randomReader.fileSize;
    if (await (0, ID3v1Parser_1.hasID3v1Header)(randomReader)) {
        apeOffset -= 128;
        const lyricsLen = await (0, Lyrics3_1.getLyricsHeaderLength)(randomReader);
        apeOffset -= lyricsLen;
    }
    options.apeHeader = await APEv2Parser_1.APEv2Parser.findApeFooterOffset(randomReader, apeOffset);
}
exports.scanAppendingHeaders = scanAppendingHeaders;


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ParserFactory = exports.parseHttpContentType = void 0;
const FileType = __webpack_require__(20);
const ContentType = __webpack_require__(25);
const MimeType = __webpack_require__(26);
const debug_1 = __webpack_require__(27);
const MetadataCollector_1 = __webpack_require__(37);
const AiffParser_1 = __webpack_require__(55);
const APEv2Parser_1 = __webpack_require__(61);
const AsfParser_1 = __webpack_require__(66);
const FlacParser_1 = __webpack_require__(70);
const MP4Parser_1 = __webpack_require__(75);
const MpegParser_1 = __webpack_require__(78);
const musepack_1 = __webpack_require__(82);
const OggParser_1 = __webpack_require__(88);
const WaveParser_1 = __webpack_require__(95);
const WavPackParser_1 = __webpack_require__(99);
const DsfParser_1 = __webpack_require__(101);
const DsdiffParser_1 = __webpack_require__(103);
const MatroskaParser_1 = __webpack_require__(105);
const debug = (0, debug_1.default)('music-metadata:parser:factory');
function parseHttpContentType(contentType) {
    const type = ContentType.parse(contentType);
    const mime = MimeType.parse(type.type);
    return {
        type: mime.type,
        subtype: mime.subtype,
        suffix: mime.suffix,
        parameters: type.parameters
    };
}
exports.parseHttpContentType = parseHttpContentType;
async function parse(tokenizer, parserId, opts = {}) {
    // Parser found, execute parser
    const parser = await ParserFactory.loadParser(parserId);
    const metadata = new MetadataCollector_1.MetadataCollector(opts);
    await parser.init(metadata, tokenizer, opts).parse();
    return metadata.toCommonMetadata();
}
class ParserFactory {
    /**
     * Parse metadata from tokenizer
     * @param tokenizer - Tokenizer
     * @param opts - Options
     * @returns Native metadata
     */
    static async parseOnContentType(tokenizer, opts) {
        const { mimeType, path, url } = await tokenizer.fileInfo;
        // Resolve parser based on MIME-type or file extension
        const parserId = ParserFactory.getParserIdForMimeType(mimeType) || ParserFactory.getParserIdForExtension(path) || ParserFactory.getParserIdForExtension(url);
        if (!parserId) {
            debug('No parser found for MIME-type / extension: ' + mimeType);
        }
        return this.parse(tokenizer, parserId, opts);
    }
    static async parse(tokenizer, parserId, opts) {
        if (!parserId) {
            // Parser could not be determined on MIME-type or extension
            debug('Guess parser on content...');
            const buf = Buffer.alloc(4100);
            await tokenizer.peekBuffer(buf, { mayBeLess: true });
            if (tokenizer.fileInfo.path) {
                parserId = this.getParserIdForExtension(tokenizer.fileInfo.path);
            }
            if (!parserId) {
                const guessedType = await FileType.fromBuffer(buf);
                if (!guessedType) {
                    throw new Error('Failed to determine audio format');
                }
                debug(`Guessed file type is mime=${guessedType.mime}, extension=${guessedType.ext}`);
                parserId = ParserFactory.getParserIdForMimeType(guessedType.mime);
                if (!parserId) {
                    throw new Error('Guessed MIME-type not supported: ' + guessedType.mime);
                }
            }
        }
        // Parser found, execute parser
        return parse(tokenizer, parserId, opts);
    }
    /**
     * @param filePath - Path, filename or extension to audio file
     * @return Parser sub-module name
     */
    static getParserIdForExtension(filePath) {
        if (!filePath)
            return;
        const extension = this.getExtension(filePath).toLocaleLowerCase() || filePath;
        switch (extension) {
            case '.mp2':
            case '.mp3':
            case '.m2a':
            case '.aac': // Assume it is ADTS-container
                return 'mpeg';
            case '.ape':
                return 'apev2';
            case '.mp4':
            case '.m4a':
            case '.m4b':
            case '.m4pa':
            case '.m4v':
            case '.m4r':
            case '.3gp':
                return 'mp4';
            case '.wma':
            case '.wmv':
            case '.asf':
                return 'asf';
            case '.flac':
                return 'flac';
            case '.ogg':
            case '.ogv':
            case '.oga':
            case '.ogm':
            case '.ogx':
            case '.opus': // recommended filename extension for Ogg Opus
            case '.spx': // recommended filename extension for Ogg Speex
                return 'ogg';
            case '.aif':
            case '.aiff':
            case '.aifc':
                return 'aiff';
            case '.wav':
            case '.bwf': // Broadcast Wave Format
                return 'riff';
            case '.wv':
            case '.wvp':
                return 'wavpack';
            case '.mpc':
                return 'musepack';
            case '.dsf':
                return 'dsf';
            case '.dff':
                return 'dsdiff';
            case '.mka':
            case '.mkv':
            case '.mk3d':
            case '.mks':
            case '.webm':
                return 'matroska';
        }
    }
    static async loadParser(moduleName) {
        switch (moduleName) {
            case 'aiff': return new AiffParser_1.AIFFParser();
            case 'adts':
            case 'mpeg':
                return new MpegParser_1.MpegParser();
            case 'apev2': return new APEv2Parser_1.APEv2Parser();
            case 'asf': return new AsfParser_1.AsfParser();
            case 'dsf': return new DsfParser_1.DsfParser();
            case 'dsdiff': return new DsdiffParser_1.DsdiffParser();
            case 'flac': return new FlacParser_1.FlacParser();
            case 'mp4': return new MP4Parser_1.MP4Parser();
            case 'musepack': return new musepack_1.default();
            case 'ogg': return new OggParser_1.OggParser();
            case 'riff': return new WaveParser_1.WaveParser();
            case 'wavpack': return new WavPackParser_1.WavPackParser();
            case 'matroska': return new MatroskaParser_1.MatroskaParser();
            default:
                throw new Error(`Unknown parser type: ${moduleName}`);
        }
    }
    static getExtension(fname) {
        const i = fname.lastIndexOf('.');
        return i === -1 ? '' : fname.slice(i);
    }
    /**
     * @param httpContentType - HTTP Content-Type, extension, path or filename
     * @returns Parser sub-module name
     */
    static getParserIdForMimeType(httpContentType) {
        let mime;
        try {
            mime = parseHttpContentType(httpContentType);
        }
        catch (err) {
            debug(`Invalid HTTP Content-Type header value: ${httpContentType}`);
            return;
        }
        const subType = mime.subtype.indexOf('x-') === 0 ? mime.subtype.substring(2) : mime.subtype;
        switch (mime.type) {
            case 'audio':
                switch (subType) {
                    case 'mp3': // Incorrect MIME-type, Chrome, in Web API File object
                    case 'mpeg':
                        return 'mpeg';
                    case 'aac':
                    case 'aacp':
                        return 'adts';
                    case 'flac':
                        return 'flac';
                    case 'ape':
                    case 'monkeys-audio':
                        return 'apev2';
                    case 'mp4':
                    case 'm4a':
                        return 'mp4';
                    case 'ogg': // RFC 7845
                    case 'opus': // RFC 6716
                    case 'speex': // RFC 5574
                        return 'ogg';
                    case 'ms-wma':
                    case 'ms-wmv':
                    case 'ms-asf':
                        return 'asf';
                    case 'aiff':
                    case 'aif':
                    case 'aifc':
                        return 'aiff';
                    case 'vnd.wave':
                    case 'wav':
                    case 'wave':
                        return 'riff';
                    case 'wavpack':
                        return 'wavpack';
                    case 'musepack':
                        return 'musepack';
                    case 'matroska':
                    case 'webm':
                        return 'matroska';
                    case 'dsf':
                        return 'dsf';
                }
                break;
            case 'video':
                switch (subType) {
                    case 'ms-asf':
                    case 'ms-wmv':
                        return 'asf';
                    case 'm4v':
                    case 'mp4':
                        return 'mp4';
                    case 'ogg':
                        return 'ogg';
                    case 'matroska':
                    case 'webm':
                        return 'matroska';
                }
                break;
            case 'application':
                switch (subType) {
                    case 'vnd.ms-asf':
                        return 'asf';
                    case 'ogg':
                        return 'ogg';
                }
                break;
        }
    }
}
exports.ParserFactory = ParserFactory;


/***/ }),
/* 20 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const Token = __webpack_require__(21);
const strtok3 = __webpack_require__(9);
const {
	stringToBytes,
	tarHeaderChecksumMatches,
	uint32SyncSafeToken
} = __webpack_require__(23);
const supported = __webpack_require__(24);

const minimumBytes = 4100; // A fair amount of file-types are detectable within this range

async function fromStream(stream) {
	const tokenizer = await strtok3.fromStream(stream);
	try {
		return await fromTokenizer(tokenizer);
	} finally {
		await tokenizer.close();
	}
}

async function fromBuffer(input) {
	if (!(input instanceof Uint8Array || input instanceof ArrayBuffer || Buffer.isBuffer(input))) {
		throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`Buffer\` or \`ArrayBuffer\`, got \`${typeof input}\``);
	}

	const buffer = input instanceof Buffer ? input : Buffer.from(input);

	if (!(buffer && buffer.length > 1)) {
		return;
	}

	const tokenizer = strtok3.fromBuffer(buffer);
	return fromTokenizer(tokenizer);
}

function _check(buffer, headers, options) {
	options = {
		offset: 0,
		...options
	};

	for (const [index, header] of headers.entries()) {
		// If a bitmask is set
		if (options.mask) {
			// If header doesn't equal `buf` with bits masked off
			if (header !== (options.mask[index] & buffer[index + options.offset])) {
				return false;
			}
		} else if (header !== buffer[index + options.offset]) {
			return false;
		}
	}

	return true;
}

async function fromTokenizer(tokenizer) {
	try {
		return _fromTokenizer(tokenizer);
	} catch (error) {
		if (!(error instanceof strtok3.EndOfStreamError)) {
			throw error;
		}
	}
}

async function _fromTokenizer(tokenizer) {
	let buffer = Buffer.alloc(minimumBytes);
	const bytesRead = 12;
	const check = (header, options) => _check(buffer, header, options);
	const checkString = (header, options) => check(stringToBytes(header), options);

	// Keep reading until EOF if the file size is unknown.
	if (!tokenizer.fileInfo.size) {
		tokenizer.fileInfo.size = Number.MAX_SAFE_INTEGER;
	}

	await tokenizer.peekBuffer(buffer, {length: bytesRead, mayBeLess: true});

	// -- 2-byte signatures --

	if (check([0x42, 0x4D])) {
		return {
			ext: 'bmp',
			mime: 'image/bmp'
		};
	}

	if (check([0x0B, 0x77])) {
		return {
			ext: 'ac3',
			mime: 'audio/vnd.dolby.dd-raw'
		};
	}

	if (check([0x78, 0x01])) {
		return {
			ext: 'dmg',
			mime: 'application/x-apple-diskimage'
		};
	}

	if (check([0x4D, 0x5A])) {
		return {
			ext: 'exe',
			mime: 'application/x-msdownload'
		};
	}

	if (check([0x25, 0x21])) {
		await tokenizer.peekBuffer(buffer, {length: 24, mayBeLess: true});

		if (checkString('PS-Adobe-', {offset: 2}) &&
			checkString(' EPSF-', {offset: 14})) {
			return {
				ext: 'eps',
				mime: 'application/eps'
			};
		}

		return {
			ext: 'ps',
			mime: 'application/postscript'
		};
	}

	if (
		check([0x1F, 0xA0]) ||
		check([0x1F, 0x9D])
	) {
		return {
			ext: 'Z',
			mime: 'application/x-compress'
		};
	}

	// -- 3-byte signatures --

	if (check([0xFF, 0xD8, 0xFF])) {
		return {
			ext: 'jpg',
			mime: 'image/jpeg'
		};
	}

	if (check([0x49, 0x49, 0xBC])) {
		return {
			ext: 'jxr',
			mime: 'image/vnd.ms-photo'
		};
	}

	if (check([0x1F, 0x8B, 0x8])) {
		return {
			ext: 'gz',
			mime: 'application/gzip'
		};
	}

	if (check([0x42, 0x5A, 0x68])) {
		return {
			ext: 'bz2',
			mime: 'application/x-bzip2'
		};
	}

	if (checkString('ID3')) {
		await tokenizer.ignore(6); // Skip ID3 header until the header size
		const id3HeaderLen = await tokenizer.readToken(uint32SyncSafeToken);
		if (tokenizer.position + id3HeaderLen > tokenizer.fileInfo.size) {
			// Guess file type based on ID3 header for backward compatibility
			return {
				ext: 'mp3',
				mime: 'audio/mpeg'
			};
		}

		await tokenizer.ignore(id3HeaderLen);
		return fromTokenizer(tokenizer); // Skip ID3 header, recursion
	}

	// Musepack, SV7
	if (checkString('MP+')) {
		return {
			ext: 'mpc',
			mime: 'audio/x-musepack'
		};
	}

	if (
		(buffer[0] === 0x43 || buffer[0] === 0x46) &&
		check([0x57, 0x53], {offset: 1})
	) {
		return {
			ext: 'swf',
			mime: 'application/x-shockwave-flash'
		};
	}

	// -- 4-byte signatures --

	if (check([0x47, 0x49, 0x46])) {
		return {
			ext: 'gif',
			mime: 'image/gif'
		};
	}

	if (checkString('FLIF')) {
		return {
			ext: 'flif',
			mime: 'image/flif'
		};
	}

	if (checkString('8BPS')) {
		return {
			ext: 'psd',
			mime: 'image/vnd.adobe.photoshop'
		};
	}

	if (checkString('WEBP', {offset: 8})) {
		return {
			ext: 'webp',
			mime: 'image/webp'
		};
	}

	// Musepack, SV8
	if (checkString('MPCK')) {
		return {
			ext: 'mpc',
			mime: 'audio/x-musepack'
		};
	}

	if (checkString('FORM')) {
		return {
			ext: 'aif',
			mime: 'audio/aiff'
		};
	}

	if (checkString('icns', {offset: 0})) {
		return {
			ext: 'icns',
			mime: 'image/icns'
		};
	}

	// Zip-based file formats
	// Need to be before the `zip` check
	if (check([0x50, 0x4B, 0x3, 0x4])) { // Local file header signature
		try {
			while (tokenizer.position + 30 < tokenizer.fileInfo.size) {
				await tokenizer.readBuffer(buffer, {length: 30});

				// https://en.wikipedia.org/wiki/Zip_(file_format)#File_headers
				const zipHeader = {
					compressedSize: buffer.readUInt32LE(18),
					uncompressedSize: buffer.readUInt32LE(22),
					filenameLength: buffer.readUInt16LE(26),
					extraFieldLength: buffer.readUInt16LE(28)
				};

				zipHeader.filename = await tokenizer.readToken(new Token.StringType(zipHeader.filenameLength, 'utf-8'));
				await tokenizer.ignore(zipHeader.extraFieldLength);

				// Assumes signed `.xpi` from addons.mozilla.org
				if (zipHeader.filename === 'META-INF/mozilla.rsa') {
					return {
						ext: 'xpi',
						mime: 'application/x-xpinstall'
					};
				}

				if (zipHeader.filename.endsWith('.rels') || zipHeader.filename.endsWith('.xml')) {
					const type = zipHeader.filename.split('/')[0];
					switch (type) {
						case '_rels':
							break;
						case 'word':
							return {
								ext: 'docx',
								mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
							};
						case 'ppt':
							return {
								ext: 'pptx',
								mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
							};
						case 'xl':
							return {
								ext: 'xlsx',
								mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
							};
						default:
							break;
					}
				}

				if (zipHeader.filename.startsWith('xl/')) {
					return {
						ext: 'xlsx',
						mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
					};
				}

				if (zipHeader.filename.startsWith('3D/') && zipHeader.filename.endsWith('.model')) {
					return {
						ext: '3mf',
						mime: 'model/3mf'
					};
				}

				// The docx, xlsx and pptx file types extend the Office Open XML file format:
				// https://en.wikipedia.org/wiki/Office_Open_XML_file_formats
				// We look for:
				// - one entry named '[Content_Types].xml' or '_rels/.rels',
				// - one entry indicating specific type of file.
				// MS Office, OpenOffice and LibreOffice may put the parts in different order, so the check should not rely on it.
				if (zipHeader.filename === 'mimetype' && zipHeader.compressedSize === zipHeader.uncompressedSize) {
					const mimeType = await tokenizer.readToken(new Token.StringType(zipHeader.compressedSize, 'utf-8'));

					switch (mimeType) {
						case 'application/epub+zip':
							return {
								ext: 'epub',
								mime: 'application/epub+zip'
							};
						case 'application/vnd.oasis.opendocument.text':
							return {
								ext: 'odt',
								mime: 'application/vnd.oasis.opendocument.text'
							};
						case 'application/vnd.oasis.opendocument.spreadsheet':
							return {
								ext: 'ods',
								mime: 'application/vnd.oasis.opendocument.spreadsheet'
							};
						case 'application/vnd.oasis.opendocument.presentation':
							return {
								ext: 'odp',
								mime: 'application/vnd.oasis.opendocument.presentation'
							};
						default:
					}
				}

				// Try to find next header manually when current one is corrupted
				if (zipHeader.compressedSize === 0) {
					let nextHeaderIndex = -1;

					while (nextHeaderIndex < 0 && (tokenizer.position < tokenizer.fileInfo.size)) {
						await tokenizer.peekBuffer(buffer, {mayBeLess: true});

						nextHeaderIndex = buffer.indexOf('504B0304', 0, 'hex');
						// Move position to the next header if found, skip the whole buffer otherwise
						await tokenizer.ignore(nextHeaderIndex >= 0 ? nextHeaderIndex : buffer.length);
					}
				} else {
					await tokenizer.ignore(zipHeader.compressedSize);
				}
			}
		} catch (error) {
			if (!(error instanceof strtok3.EndOfStreamError)) {
				throw error;
			}
		}

		return {
			ext: 'zip',
			mime: 'application/zip'
		};
	}

	if (checkString('OggS')) {
		// This is an OGG container
		await tokenizer.ignore(28);
		const type = Buffer.alloc(8);
		await tokenizer.readBuffer(type);

		// Needs to be before `ogg` check
		if (_check(type, [0x4F, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64])) {
			return {
				ext: 'opus',
				mime: 'audio/opus'
			};
		}

		// If ' theora' in header.
		if (_check(type, [0x80, 0x74, 0x68, 0x65, 0x6F, 0x72, 0x61])) {
			return {
				ext: 'ogv',
				mime: 'video/ogg'
			};
		}

		// If '\x01video' in header.
		if (_check(type, [0x01, 0x76, 0x69, 0x64, 0x65, 0x6F, 0x00])) {
			return {
				ext: 'ogm',
				mime: 'video/ogg'
			};
		}

		// If ' FLAC' in header  https://xiph.org/flac/faq.html
		if (_check(type, [0x7F, 0x46, 0x4C, 0x41, 0x43])) {
			return {
				ext: 'oga',
				mime: 'audio/ogg'
			};
		}

		// 'Speex  ' in header https://en.wikipedia.org/wiki/Speex
		if (_check(type, [0x53, 0x70, 0x65, 0x65, 0x78, 0x20, 0x20])) {
			return {
				ext: 'spx',
				mime: 'audio/ogg'
			};
		}

		// If '\x01vorbis' in header
		if (_check(type, [0x01, 0x76, 0x6F, 0x72, 0x62, 0x69, 0x73])) {
			return {
				ext: 'ogg',
				mime: 'audio/ogg'
			};
		}

		// Default OGG container https://www.iana.org/assignments/media-types/application/ogg
		return {
			ext: 'ogx',
			mime: 'application/ogg'
		};
	}

	if (
		check([0x50, 0x4B]) &&
		(buffer[2] === 0x3 || buffer[2] === 0x5 || buffer[2] === 0x7) &&
		(buffer[3] === 0x4 || buffer[3] === 0x6 || buffer[3] === 0x8)
	) {
		return {
			ext: 'zip',
			mime: 'application/zip'
		};
	}

	//

	// File Type Box (https://en.wikipedia.org/wiki/ISO_base_media_file_format)
	// It's not required to be first, but it's recommended to be. Almost all ISO base media files start with `ftyp` box.
	// `ftyp` box must contain a brand major identifier, which must consist of ISO 8859-1 printable characters.
	// Here we check for 8859-1 printable characters (for simplicity, it's a mask which also catches one non-printable character).
	if (
		checkString('ftyp', {offset: 4}) &&
		(buffer[8] & 0x60) !== 0x00 // Brand major, first character ASCII?
	) {
		// They all can have MIME `video/mp4` except `application/mp4` special-case which is hard to detect.
		// For some cases, we're specific, everything else falls to `video/mp4` with `mp4` extension.
		const brandMajor = buffer.toString('binary', 8, 12).replace('\0', ' ').trim();
		switch (brandMajor) {
			case 'avif':
				return {ext: 'avif', mime: 'image/avif'};
			case 'mif1':
				return {ext: 'heic', mime: 'image/heif'};
			case 'msf1':
				return {ext: 'heic', mime: 'image/heif-sequence'};
			case 'heic':
			case 'heix':
				return {ext: 'heic', mime: 'image/heic'};
			case 'hevc':
			case 'hevx':
				return {ext: 'heic', mime: 'image/heic-sequence'};
			case 'qt':
				return {ext: 'mov', mime: 'video/quicktime'};
			case 'M4V':
			case 'M4VH':
			case 'M4VP':
				return {ext: 'm4v', mime: 'video/x-m4v'};
			case 'M4P':
				return {ext: 'm4p', mime: 'video/mp4'};
			case 'M4B':
				return {ext: 'm4b', mime: 'audio/mp4'};
			case 'M4A':
				return {ext: 'm4a', mime: 'audio/x-m4a'};
			case 'F4V':
				return {ext: 'f4v', mime: 'video/mp4'};
			case 'F4P':
				return {ext: 'f4p', mime: 'video/mp4'};
			case 'F4A':
				return {ext: 'f4a', mime: 'audio/mp4'};
			case 'F4B':
				return {ext: 'f4b', mime: 'audio/mp4'};
			case 'crx':
				return {ext: 'cr3', mime: 'image/x-canon-cr3'};
			default:
				if (brandMajor.startsWith('3g')) {
					if (brandMajor.startsWith('3g2')) {
						return {ext: '3g2', mime: 'video/3gpp2'};
					}

					return {ext: '3gp', mime: 'video/3gpp'};
				}

				return {ext: 'mp4', mime: 'video/mp4'};
		}
	}

	if (checkString('MThd')) {
		return {
			ext: 'mid',
			mime: 'audio/midi'
		};
	}

	if (
		checkString('wOFF') &&
		(
			check([0x00, 0x01, 0x00, 0x00], {offset: 4}) ||
			checkString('OTTO', {offset: 4})
		)
	) {
		return {
			ext: 'woff',
			mime: 'font/woff'
		};
	}

	if (
		checkString('wOF2') &&
		(
			check([0x00, 0x01, 0x00, 0x00], {offset: 4}) ||
			checkString('OTTO', {offset: 4})
		)
	) {
		return {
			ext: 'woff2',
			mime: 'font/woff2'
		};
	}

	if (check([0xD4, 0xC3, 0xB2, 0xA1]) || check([0xA1, 0xB2, 0xC3, 0xD4])) {
		return {
			ext: 'pcap',
			mime: 'application/vnd.tcpdump.pcap'
		};
	}

	// Sony DSD Stream File (DSF)
	if (checkString('DSD ')) {
		return {
			ext: 'dsf',
			mime: 'audio/x-dsf' // Non-standard
		};
	}

	if (checkString('LZIP')) {
		return {
			ext: 'lz',
			mime: 'application/x-lzip'
		};
	}

	if (checkString('fLaC')) {
		return {
			ext: 'flac',
			mime: 'audio/x-flac'
		};
	}

	if (check([0x42, 0x50, 0x47, 0xFB])) {
		return {
			ext: 'bpg',
			mime: 'image/bpg'
		};
	}

	if (checkString('wvpk')) {
		return {
			ext: 'wv',
			mime: 'audio/wavpack'
		};
	}

	if (checkString('%PDF')) {
		await tokenizer.ignore(1350);
		const maxBufferSize = 10 * 1024 * 1024;
		const buffer = Buffer.alloc(Math.min(maxBufferSize, tokenizer.fileInfo.size));
		await tokenizer.readBuffer(buffer, {mayBeLess: true});

		// Check if this is an Adobe Illustrator file
		if (buffer.includes(Buffer.from('AIPrivateData'))) {
			return {
				ext: 'ai',
				mime: 'application/postscript'
			};
		}

		// Assume this is just a normal PDF
		return {
			ext: 'pdf',
			mime: 'application/pdf'
		};
	}

	if (check([0x00, 0x61, 0x73, 0x6D])) {
		return {
			ext: 'wasm',
			mime: 'application/wasm'
		};
	}

	// TIFF, little-endian type
	if (check([0x49, 0x49, 0x2A, 0x0])) {
		if (checkString('CR', {offset: 8})) {
			return {
				ext: 'cr2',
				mime: 'image/x-canon-cr2'
			};
		}

		if (check([0x1C, 0x00, 0xFE, 0x00], {offset: 8}) || check([0x1F, 0x00, 0x0B, 0x00], {offset: 8})) {
			return {
				ext: 'nef',
				mime: 'image/x-nikon-nef'
			};
		}

		if (
			check([0x08, 0x00, 0x00, 0x00], {offset: 4}) &&
			(check([0x2D, 0x00, 0xFE, 0x00], {offset: 8}) ||
				check([0x27, 0x00, 0xFE, 0x00], {offset: 8}))
		) {
			return {
				ext: 'dng',
				mime: 'image/x-adobe-dng'
			};
		}

		buffer = Buffer.alloc(24);
		await tokenizer.peekBuffer(buffer);
		if (
			(check([0x10, 0xFB, 0x86, 0x01], {offset: 4}) || check([0x08, 0x00, 0x00, 0x00], {offset: 4})) &&
			// This pattern differentiates ARW from other TIFF-ish file types:
			check([0x00, 0xFE, 0x00, 0x04, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x03, 0x01], {offset: 9})
		) {
			return {
				ext: 'arw',
				mime: 'image/x-sony-arw'
			};
		}

		return {
			ext: 'tif',
			mime: 'image/tiff'
		};
	}

	// TIFF, big-endian type
	if (check([0x4D, 0x4D, 0x0, 0x2A])) {
		return {
			ext: 'tif',
			mime: 'image/tiff'
		};
	}

	if (checkString('MAC ')) {
		return {
			ext: 'ape',
			mime: 'audio/ape'
		};
	}

	// https://github.com/threatstack/libmagic/blob/master/magic/Magdir/matroska
	if (check([0x1A, 0x45, 0xDF, 0xA3])) { // Root element: EBML
		async function readField() {
			const msb = await tokenizer.peekNumber(Token.UINT8);
			let mask = 0x80;
			let ic = 0; // 0 = A, 1 = B, 2 = C, 3 = D

			while ((msb & mask) === 0 && mask !== 0) {
				++ic;
				mask >>= 1;
			}

			const id = Buffer.alloc(ic + 1);
			await tokenizer.readBuffer(id);
			return id;
		}

		async function readElement() {
			const id = await readField();
			const lenField = await readField();
			lenField[0] ^= 0x80 >> (lenField.length - 1);
			const nrLen = Math.min(6, lenField.length); // JavaScript can max read 6 bytes integer
			return {
				id: id.readUIntBE(0, id.length),
				len: lenField.readUIntBE(lenField.length - nrLen, nrLen)
			};
		}

		async function readChildren(level, children) {
			while (children > 0) {
				const e = await readElement();
				if (e.id === 0x4282) {
					return tokenizer.readToken(new Token.StringType(e.len, 'utf-8')); // Return DocType
				}

				await tokenizer.ignore(e.len); // ignore payload
				--children;
			}
		}

		const re = await readElement();
		const docType = await readChildren(1, re.len);

		switch (docType) {
			case 'webm':
				return {
					ext: 'webm',
					mime: 'video/webm'
				};

			case 'matroska':
				return {
					ext: 'mkv',
					mime: 'video/x-matroska'
				};

			default:
				return;
		}
	}

	// RIFF file format which might be AVI, WAV, QCP, etc
	if (check([0x52, 0x49, 0x46, 0x46])) {
		if (check([0x41, 0x56, 0x49], {offset: 8})) {
			return {
				ext: 'avi',
				mime: 'video/vnd.avi'
			};
		}

		if (check([0x57, 0x41, 0x56, 0x45], {offset: 8})) {
			return {
				ext: 'wav',
				mime: 'audio/vnd.wave'
			};
		}

		// QLCM, QCP file
		if (check([0x51, 0x4C, 0x43, 0x4D], {offset: 8})) {
			return {
				ext: 'qcp',
				mime: 'audio/qcelp'
			};
		}
	}

	if (checkString('SQLi')) {
		return {
			ext: 'sqlite',
			mime: 'application/x-sqlite3'
		};
	}

	if (check([0x4E, 0x45, 0x53, 0x1A])) {
		return {
			ext: 'nes',
			mime: 'application/x-nintendo-nes-rom'
		};
	}

	if (checkString('Cr24')) {
		return {
			ext: 'crx',
			mime: 'application/x-google-chrome-extension'
		};
	}

	if (
		checkString('MSCF') ||
		checkString('ISc(')
	) {
		return {
			ext: 'cab',
			mime: 'application/vnd.ms-cab-compressed'
		};
	}

	if (check([0xED, 0xAB, 0xEE, 0xDB])) {
		return {
			ext: 'rpm',
			mime: 'application/x-rpm'
		};
	}

	if (check([0xC5, 0xD0, 0xD3, 0xC6])) {
		return {
			ext: 'eps',
			mime: 'application/eps'
		};
	}

	if (check([0x28, 0xB5, 0x2F, 0xFD])) {
		return {
			ext: 'zst',
			mime: 'application/zstd'
		};
	}

	// -- 5-byte signatures --

	if (check([0x4F, 0x54, 0x54, 0x4F, 0x00])) {
		return {
			ext: 'otf',
			mime: 'font/otf'
		};
	}

	if (checkString('#!AMR')) {
		return {
			ext: 'amr',
			mime: 'audio/amr'
		};
	}

	if (checkString('{\\rtf')) {
		return {
			ext: 'rtf',
			mime: 'application/rtf'
		};
	}

	if (check([0x46, 0x4C, 0x56, 0x01])) {
		return {
			ext: 'flv',
			mime: 'video/x-flv'
		};
	}

	if (checkString('IMPM')) {
		return {
			ext: 'it',
			mime: 'audio/x-it'
		};
	}

	if (
		checkString('-lh0-', {offset: 2}) ||
		checkString('-lh1-', {offset: 2}) ||
		checkString('-lh2-', {offset: 2}) ||
		checkString('-lh3-', {offset: 2}) ||
		checkString('-lh4-', {offset: 2}) ||
		checkString('-lh5-', {offset: 2}) ||
		checkString('-lh6-', {offset: 2}) ||
		checkString('-lh7-', {offset: 2}) ||
		checkString('-lzs-', {offset: 2}) ||
		checkString('-lz4-', {offset: 2}) ||
		checkString('-lz5-', {offset: 2}) ||
		checkString('-lhd-', {offset: 2})
	) {
		return {
			ext: 'lzh',
			mime: 'application/x-lzh-compressed'
		};
	}

	// MPEG program stream (PS or MPEG-PS)
	if (check([0x00, 0x00, 0x01, 0xBA])) {
		//  MPEG-PS, MPEG-1 Part 1
		if (check([0x21], {offset: 4, mask: [0xF1]})) {
			return {
				ext: 'mpg', // May also be .ps, .mpeg
				mime: 'video/MP1S'
			};
		}

		// MPEG-PS, MPEG-2 Part 1
		if (check([0x44], {offset: 4, mask: [0xC4]})) {
			return {
				ext: 'mpg', // May also be .mpg, .m2p, .vob or .sub
				mime: 'video/MP2P'
			};
		}
	}

	if (checkString('ITSF')) {
		return {
			ext: 'chm',
			mime: 'application/vnd.ms-htmlhelp'
		};
	}

	// -- 6-byte signatures --

	if (check([0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00])) {
		return {
			ext: 'xz',
			mime: 'application/x-xz'
		};
	}

	if (checkString('<?xml ')) {
		return {
			ext: 'xml',
			mime: 'application/xml'
		};
	}

	if (check([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C])) {
		return {
			ext: '7z',
			mime: 'application/x-7z-compressed'
		};
	}

	if (
		check([0x52, 0x61, 0x72, 0x21, 0x1A, 0x7]) &&
		(buffer[6] === 0x0 || buffer[6] === 0x1)
	) {
		return {
			ext: 'rar',
			mime: 'application/x-rar-compressed'
		};
	}

	if (checkString('solid ')) {
		return {
			ext: 'stl',
			mime: 'model/stl'
		};
	}

	// -- 7-byte signatures --

	if (checkString('BLENDER')) {
		return {
			ext: 'blend',
			mime: 'application/x-blender'
		};
	}

	if (checkString('!<arch>')) {
		await tokenizer.ignore(8);
		const str = await tokenizer.readToken(new Token.StringType(13, 'ascii'));
		if (str === 'debian-binary') {
			return {
				ext: 'deb',
				mime: 'application/x-deb'
			};
		}

		return {
			ext: 'ar',
			mime: 'application/x-unix-archive'
		};
	}

	// -- 8-byte signatures --

	if (check([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
		// APNG format (https://wiki.mozilla.org/APNG_Specification)
		// 1. Find the first IDAT (image data) chunk (49 44 41 54)
		// 2. Check if there is an "acTL" chunk before the IDAT one (61 63 54 4C)

		// Offset calculated as follows:
		// - 8 bytes: PNG signature
		// - 4 (length) + 4 (chunk type) + 13 (chunk data) + 4 (CRC): IHDR chunk

		await tokenizer.ignore(8); // ignore PNG signature

		async function readChunkHeader() {
			return {
				length: await tokenizer.readToken(Token.INT32_BE),
				type: await tokenizer.readToken(new Token.StringType(4, 'binary'))
			};
		}

		do {
			const chunk = await readChunkHeader();
			if (chunk.length < 0) {
				return; // Invalid chunk length
			}

			switch (chunk.type) {
				case 'IDAT':
					return {
						ext: 'png',
						mime: 'image/png'
					};
				case 'acTL':
					return {
						ext: 'apng',
						mime: 'image/apng'
					};
				default:
					await tokenizer.ignore(chunk.length + 4); // Ignore chunk-data + CRC
			}
		} while (tokenizer.position + 8 < tokenizer.fileInfo.size);

		return {
			ext: 'png',
			mime: 'image/png'
		};
	}

	if (check([0x41, 0x52, 0x52, 0x4F, 0x57, 0x31, 0x00, 0x00])) {
		return {
			ext: 'arrow',
			mime: 'application/x-apache-arrow'
		};
	}

	if (check([0x67, 0x6C, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00])) {
		return {
			ext: 'glb',
			mime: 'model/gltf-binary'
		};
	}

	// `mov` format variants
	if (
		check([0x66, 0x72, 0x65, 0x65], {offset: 4}) || // `free`
		check([0x6D, 0x64, 0x61, 0x74], {offset: 4}) || // `mdat` MJPEG
		check([0x6D, 0x6F, 0x6F, 0x76], {offset: 4}) || // `moov`
		check([0x77, 0x69, 0x64, 0x65], {offset: 4}) // `wide`
	) {
		return {
			ext: 'mov',
			mime: 'video/quicktime'
		};
	}

	// -- 9-byte signatures --

	if (check([0x49, 0x49, 0x52, 0x4F, 0x08, 0x00, 0x00, 0x00, 0x18])) {
		return {
			ext: 'orf',
			mime: 'image/x-olympus-orf'
		};
	}

	if (checkString('gimp xcf ')) {
		return {
			ext: 'xcf',
			mime: 'image/x-xcf'
		};
	}

	// -- 12-byte signatures --

	if (check([0x49, 0x49, 0x55, 0x00, 0x18, 0x00, 0x00, 0x00, 0x88, 0xE7, 0x74, 0xD8])) {
		return {
			ext: 'rw2',
			mime: 'image/x-panasonic-rw2'
		};
	}

	// ASF_Header_Object first 80 bytes
	if (check([0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11, 0xA6, 0xD9])) {
		async function readHeader() {
			const guid = Buffer.alloc(16);
			await tokenizer.readBuffer(guid);
			return {
				id: guid,
				size: Number(await tokenizer.readToken(Token.UINT64_LE))
			};
		}

		await tokenizer.ignore(30);
		// Search for header should be in first 1KB of file.
		while (tokenizer.position + 24 < tokenizer.fileInfo.size) {
			const header = await readHeader();
			let payload = header.size - 24;
			if (_check(header.id, [0x91, 0x07, 0xDC, 0xB7, 0xB7, 0xA9, 0xCF, 0x11, 0x8E, 0xE6, 0x00, 0xC0, 0x0C, 0x20, 0x53, 0x65])) {
				// Sync on Stream-Properties-Object (B7DC0791-A9B7-11CF-8EE6-00C00C205365)
				const typeId = Buffer.alloc(16);
				payload -= await tokenizer.readBuffer(typeId);

				if (_check(typeId, [0x40, 0x9E, 0x69, 0xF8, 0x4D, 0x5B, 0xCF, 0x11, 0xA8, 0xFD, 0x00, 0x80, 0x5F, 0x5C, 0x44, 0x2B])) {
					// Found audio:
					return {
						ext: 'asf',
						mime: 'audio/x-ms-asf'
					};
				}

				if (_check(typeId, [0xC0, 0xEF, 0x19, 0xBC, 0x4D, 0x5B, 0xCF, 0x11, 0xA8, 0xFD, 0x00, 0x80, 0x5F, 0x5C, 0x44, 0x2B])) {
					// Found video:
					return {
						ext: 'asf',
						mime: 'video/x-ms-asf'
					};
				}

				break;
			}

			await tokenizer.ignore(payload);
		}

		// Default to ASF generic extension
		return {
			ext: 'asf',
			mime: 'application/vnd.ms-asf'
		};
	}

	if (check([0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A])) {
		return {
			ext: 'ktx',
			mime: 'image/ktx'
		};
	}

	if ((check([0x7E, 0x10, 0x04]) || check([0x7E, 0x18, 0x04])) && check([0x30, 0x4D, 0x49, 0x45], {offset: 4})) {
		return {
			ext: 'mie',
			mime: 'application/x-mie'
		};
	}

	if (check([0x27, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], {offset: 2})) {
		return {
			ext: 'shp',
			mime: 'application/x-esri-shape'
		};
	}

	if (check([0x00, 0x00, 0x00, 0x0C, 0x6A, 0x50, 0x20, 0x20, 0x0D, 0x0A, 0x87, 0x0A])) {
		// JPEG-2000 family

		await tokenizer.ignore(20);
		const type = await tokenizer.readToken(new Token.StringType(4, 'ascii'));
		switch (type) {
			case 'jp2 ':
				return {
					ext: 'jp2',
					mime: 'image/jp2'
				};
			case 'jpx ':
				return {
					ext: 'jpx',
					mime: 'image/jpx'
				};
			case 'jpm ':
				return {
					ext: 'jpm',
					mime: 'image/jpm'
				};
			case 'mjp2':
				return {
					ext: 'mj2',
					mime: 'image/mj2'
				};
			default:
				return;
		}
	}

	if (
		check([0xFF, 0x0A]) ||
		check([0x00, 0x00, 0x00, 0x0C, 0x4A, 0x58, 0x4C, 0x20, 0x0D, 0x0A, 0x87, 0x0A])
	) {
		return {
			ext: 'jxl',
			mime: 'image/jxl'
		};
	}

	// -- Unsafe signatures --

	if (
		check([0x0, 0x0, 0x1, 0xBA]) ||
		check([0x0, 0x0, 0x1, 0xB3])
	) {
		return {
			ext: 'mpg',
			mime: 'video/mpeg'
		};
	}

	if (check([0x00, 0x01, 0x00, 0x00, 0x00])) {
		return {
			ext: 'ttf',
			mime: 'font/ttf'
		};
	}

	if (check([0x00, 0x00, 0x01, 0x00])) {
		return {
			ext: 'ico',
			mime: 'image/x-icon'
		};
	}

	if (check([0x00, 0x00, 0x02, 0x00])) {
		return {
			ext: 'cur',
			mime: 'image/x-icon'
		};
	}

	if (check([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])) {
		// Detected Microsoft Compound File Binary File (MS-CFB) Format.
		return {
			ext: 'cfb',
			mime: 'application/x-cfb'
		};
	}

	// Increase sample size from 12 to 256.
	await tokenizer.peekBuffer(buffer, {length: Math.min(256, tokenizer.fileInfo.size), mayBeLess: true});

	// -- 15-byte signatures --

	if (checkString('BEGIN:')) {
		if (checkString('VCARD', {offset: 6})) {
			return {
				ext: 'vcf',
				mime: 'text/vcard'
			};
		}

		if (checkString('VCALENDAR', {offset: 6})) {
			return {
				ext: 'ics',
				mime: 'text/calendar'
			};
		}
	}

	// `raf` is here just to keep all the raw image detectors together.
	if (checkString('FUJIFILMCCD-RAW')) {
		return {
			ext: 'raf',
			mime: 'image/x-fujifilm-raf'
		};
	}

	if (checkString('Extended Module:')) {
		return {
			ext: 'xm',
			mime: 'audio/x-xm'
		};
	}

	if (checkString('Creative Voice File')) {
		return {
			ext: 'voc',
			mime: 'audio/x-voc'
		};
	}

	if (check([0x04, 0x00, 0x00, 0x00]) && buffer.length >= 16) { // Rough & quick check Pickle/ASAR
		const jsonSize = buffer.readUInt32LE(12);
		if (jsonSize > 12 && buffer.length >= jsonSize + 16) {
			try {
				const header = buffer.slice(16, jsonSize + 16).toString();
				const json = JSON.parse(header);
				// Check if Pickle is ASAR
				if (json.files) { // Final check, assuring Pickle/ASAR format
					return {
						ext: 'asar',
						mime: 'application/x-asar'
					};
				}
			} catch (_) {
			}
		}
	}

	if (check([0x06, 0x0E, 0x2B, 0x34, 0x02, 0x05, 0x01, 0x01, 0x0D, 0x01, 0x02, 0x01, 0x01, 0x02])) {
		return {
			ext: 'mxf',
			mime: 'application/mxf'
		};
	}

	if (checkString('SCRM', {offset: 44})) {
		return {
			ext: 's3m',
			mime: 'audio/x-s3m'
		};
	}

	if (check([0x47], {offset: 4}) && (check([0x47], {offset: 192}) || check([0x47], {offset: 196}))) {
		return {
			ext: 'mts',
			mime: 'video/mp2t'
		};
	}

	if (check([0x42, 0x4F, 0x4F, 0x4B, 0x4D, 0x4F, 0x42, 0x49], {offset: 60})) {
		return {
			ext: 'mobi',
			mime: 'application/x-mobipocket-ebook'
		};
	}

	if (check([0x44, 0x49, 0x43, 0x4D], {offset: 128})) {
		return {
			ext: 'dcm',
			mime: 'application/dicom'
		};
	}

	if (check([0x4C, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46])) {
		return {
			ext: 'lnk',
			mime: 'application/x.ms.shortcut' // Invented by us
		};
	}

	if (check([0x62, 0x6F, 0x6F, 0x6B, 0x00, 0x00, 0x00, 0x00, 0x6D, 0x61, 0x72, 0x6B, 0x00, 0x00, 0x00, 0x00])) {
		return {
			ext: 'alias',
			mime: 'application/x.apple.alias' // Invented by us
		};
	}

	if (
		check([0x4C, 0x50], {offset: 34}) &&
		(
			check([0x00, 0x00, 0x01], {offset: 8}) ||
			check([0x01, 0x00, 0x02], {offset: 8}) ||
			check([0x02, 0x00, 0x02], {offset: 8})
		)
	) {
		return {
			ext: 'eot',
			mime: 'application/vnd.ms-fontobject'
		};
	}

	if (check([0x06, 0x06, 0xED, 0xF5, 0xD8, 0x1D, 0x46, 0xE5, 0xBD, 0x31, 0xEF, 0xE7, 0xFE, 0x74, 0xB7, 0x1D])) {
		return {
			ext: 'indd',
			mime: 'application/x-indesign'
		};
	}

	// Increase sample size from 256 to 512
	await tokenizer.peekBuffer(buffer, {length: Math.min(512, tokenizer.fileInfo.size), mayBeLess: true});

	// Requires a buffer size of 512 bytes
	if (tarHeaderChecksumMatches(buffer)) {
		return {
			ext: 'tar',
			mime: 'application/x-tar'
		};
	}

	if (check([0xFF, 0xFE, 0xFF, 0x0E, 0x53, 0x00, 0x6B, 0x00, 0x65, 0x00, 0x74, 0x00, 0x63, 0x00, 0x68, 0x00, 0x55, 0x00, 0x70, 0x00, 0x20, 0x00, 0x4D, 0x00, 0x6F, 0x00, 0x64, 0x00, 0x65, 0x00, 0x6C, 0x00])) {
		return {
			ext: 'skp',
			mime: 'application/vnd.sketchup.skp'
		};
	}

	if (checkString('-----BEGIN PGP MESSAGE-----')) {
		return {
			ext: 'pgp',
			mime: 'application/pgp-encrypted'
		};
	}

	// Check MPEG 1 or 2 Layer 3 header, or 'layer 0' for ADTS (MPEG sync-word 0xFFE)
	if (buffer.length >= 2 && check([0xFF, 0xE0], {offset: 0, mask: [0xFF, 0xE0]})) {
		if (check([0x10], {offset: 1, mask: [0x16]})) {
			// Check for (ADTS) MPEG-2
			if (check([0x08], {offset: 1, mask: [0x08]})) {
				return {
					ext: 'aac',
					mime: 'audio/aac'
				};
			}

			// Must be (ADTS) MPEG-4
			return {
				ext: 'aac',
				mime: 'audio/aac'
			};
		}

		// MPEG 1 or 2 Layer 3 header
		// Check for MPEG layer 3
		if (check([0x02], {offset: 1, mask: [0x06]})) {
			return {
				ext: 'mp3',
				mime: 'audio/mpeg'
			};
		}

		// Check for MPEG layer 2
		if (check([0x04], {offset: 1, mask: [0x06]})) {
			return {
				ext: 'mp2',
				mime: 'audio/mpeg'
			};
		}

		// Check for MPEG layer 1
		if (check([0x06], {offset: 1, mask: [0x06]})) {
			return {
				ext: 'mp1',
				mime: 'audio/mpeg'
			};
		}
	}
}

const stream = readableStream => new Promise((resolve, reject) => {
	// Using `eval` to work around issues when bundling with Webpack
	const stream = eval('require')('stream'); // eslint-disable-line no-eval

	readableStream.on('error', reject);
	readableStream.once('readable', async () => {
		// Set up output stream
		const pass = new stream.PassThrough();
		let outputStream;
		if (stream.pipeline) {
			outputStream = stream.pipeline(readableStream, pass, () => {
			});
		} else {
			outputStream = readableStream.pipe(pass);
		}

		// Read the input stream and detect the filetype
		const chunk = readableStream.read(minimumBytes) || readableStream.read() || Buffer.alloc(0);
		try {
			const fileType = await fromBuffer(chunk);
			pass.fileType = fileType;
		} catch (error) {
			reject(error);
		}

		resolve(outputStream);
	});
});

const fileType = {
	fromStream,
	fromTokenizer,
	fromBuffer,
	stream
};

Object.defineProperty(fileType, 'extensions', {
	get() {
		return new Set(supported.extensions);
	}
});

Object.defineProperty(fileType, 'mimeTypes', {
	get() {
		return new Set(supported.mimeTypes);
	}
});

module.exports = fileType;


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnsiStringType = exports.StringType = exports.BufferType = exports.Uint8ArrayType = exports.IgnoreType = exports.Float80_LE = exports.Float80_BE = exports.Float64_LE = exports.Float64_BE = exports.Float32_LE = exports.Float32_BE = exports.Float16_LE = exports.Float16_BE = exports.INT64_BE = exports.UINT64_BE = exports.INT64_LE = exports.UINT64_LE = exports.INT32_LE = exports.INT32_BE = exports.INT24_BE = exports.INT24_LE = exports.INT16_LE = exports.INT16_BE = exports.INT8 = exports.UINT32_BE = exports.UINT32_LE = exports.UINT24_BE = exports.UINT24_LE = exports.UINT16_BE = exports.UINT16_LE = exports.UINT8 = void 0;
const ieee754 = __webpack_require__(22);
// Primitive types
function dv(array) {
    return new DataView(array.buffer, array.byteOffset);
}
/**
 * 8-bit unsigned integer
 */
exports.UINT8 = {
    len: 1,
    get(array, offset) {
        return dv(array).getUint8(offset);
    },
    put(array, offset, value) {
        dv(array).setUint8(offset, value);
        return offset + 1;
    }
};
/**
 * 16-bit unsigned integer, Little Endian byte order
 */
exports.UINT16_LE = {
    len: 2,
    get(array, offset) {
        return dv(array).getUint16(offset, true);
    },
    put(array, offset, value) {
        dv(array).setUint16(offset, value, true);
        return offset + 2;
    }
};
/**
 * 16-bit unsigned integer, Big Endian byte order
 */
exports.UINT16_BE = {
    len: 2,
    get(array, offset) {
        return dv(array).getUint16(offset);
    },
    put(array, offset, value) {
        dv(array).setUint16(offset, value);
        return offset + 2;
    }
};
/**
 * 24-bit unsigned integer, Little Endian byte order
 */
exports.UINT24_LE = {
    len: 3,
    get(array, offset) {
        const dataView = dv(array);
        return dataView.getUint8(offset) + (dataView.getUint16(offset + 1, true) << 8);
    },
    put(array, offset, value) {
        const dataView = dv(array);
        dataView.setUint8(offset, value & 0xff);
        dataView.setUint16(offset + 1, value >> 8, true);
        return offset + 3;
    }
};
/**
 * 24-bit unsigned integer, Big Endian byte order
 */
exports.UINT24_BE = {
    len: 3,
    get(array, offset) {
        const dataView = dv(array);
        return (dataView.getUint16(offset) << 8) + dataView.getUint8(offset + 2);
    },
    put(array, offset, value) {
        const dataView = dv(array);
        dataView.setUint16(offset, value >> 8);
        dataView.setUint8(offset + 2, value & 0xff);
        return offset + 3;
    }
};
/**
 * 32-bit unsigned integer, Little Endian byte order
 */
exports.UINT32_LE = {
    len: 4,
    get(array, offset) {
        return dv(array).getUint32(offset, true);
    },
    put(array, offset, value) {
        dv(array).setUint32(offset, value, true);
        return offset + 4;
    }
};
/**
 * 32-bit unsigned integer, Big Endian byte order
 */
exports.UINT32_BE = {
    len: 4,
    get(array, offset) {
        return dv(array).getUint32(offset);
    },
    put(array, offset, value) {
        dv(array).setUint32(offset, value);
        return offset + 4;
    }
};
/**
 * 8-bit signed integer
 */
exports.INT8 = {
    len: 1,
    get(array, offset) {
        return dv(array).getInt8(offset);
    },
    put(array, offset, value) {
        dv(array).setInt8(offset, value);
        return offset + 1;
    }
};
/**
 * 16-bit signed integer, Big Endian byte order
 */
exports.INT16_BE = {
    len: 2,
    get(array, offset) {
        return dv(array).getInt16(offset);
    },
    put(array, offset, value) {
        dv(array).setInt16(offset, value);
        return offset + 2;
    }
};
/**
 * 16-bit signed integer, Little Endian byte order
 */
exports.INT16_LE = {
    len: 2,
    get(array, offset) {
        return dv(array).getInt16(offset, true);
    },
    put(array, offset, value) {
        dv(array).setInt16(offset, value, true);
        return offset + 2;
    }
};
/**
 * 24-bit signed integer, Little Endian byte order
 */
exports.INT24_LE = {
    len: 3,
    get(array, offset) {
        const unsigned = exports.UINT24_LE.get(array, offset);
        return unsigned > 0x7fffff ? unsigned - 0x1000000 : unsigned;
    },
    put(array, offset, value) {
        const dataView = dv(array);
        dataView.setUint8(offset, value & 0xff);
        dataView.setUint16(offset + 1, value >> 8, true);
        return offset + 3;
    }
};
/**
 * 24-bit signed integer, Big Endian byte order
 */
exports.INT24_BE = {
    len: 3,
    get(array, offset) {
        const unsigned = exports.UINT24_BE.get(array, offset);
        return unsigned > 0x7fffff ? unsigned - 0x1000000 : unsigned;
    },
    put(array, offset, value) {
        const dataView = dv(array);
        dataView.setUint16(offset, value >> 8);
        dataView.setUint8(offset + 2, value & 0xff);
        return offset + 3;
    }
};
/**
 * 32-bit signed integer, Big Endian byte order
 */
exports.INT32_BE = {
    len: 4,
    get(array, offset) {
        return dv(array).getInt32(offset);
    },
    put(array, offset, value) {
        dv(array).setInt32(offset, value);
        return offset + 4;
    }
};
/**
 * 32-bit signed integer, Big Endian byte order
 */
exports.INT32_LE = {
    len: 4,
    get(array, offset) {
        return dv(array).getInt32(offset, true);
    },
    put(array, offset, value) {
        dv(array).setInt32(offset, value, true);
        return offset + 4;
    }
};
/**
 * 64-bit unsigned integer, Little Endian byte order
 */
exports.UINT64_LE = {
    len: 8,
    get(array, offset) {
        return dv(array).getBigUint64(offset, true);
    },
    put(array, offset, value) {
        dv(array).setBigUint64(offset, value, true);
        return offset + 8;
    }
};
/**
 * 64-bit signed integer, Little Endian byte order
 */
exports.INT64_LE = {
    len: 8,
    get(array, offset) {
        return dv(array).getBigInt64(offset, true);
    },
    put(array, offset, value) {
        dv(array).setBigInt64(offset, value, true);
        return offset + 8;
    }
};
/**
 * 64-bit unsigned integer, Big Endian byte order
 */
exports.UINT64_BE = {
    len: 8,
    get(array, offset) {
        return dv(array).getBigUint64(offset);
    },
    put(array, offset, value) {
        dv(array).setBigUint64(offset, value);
        return offset + 8;
    }
};
/**
 * 64-bit signed integer, Big Endian byte order
 */
exports.INT64_BE = {
    len: 8,
    get(array, offset) {
        return dv(array).getBigInt64(offset);
    },
    put(array, offset, value) {
        dv(array).setBigInt64(offset, value);
        return offset + 8;
    }
};
/**
 * IEEE 754 16-bit (half precision) float, big endian
 */
exports.Float16_BE = {
    len: 2,
    get(dataView, offset) {
        return ieee754.read(dataView, offset, false, 10, this.len);
    },
    put(dataView, offset, value) {
        ieee754.write(dataView, value, offset, false, 10, this.len);
        return offset + this.len;
    }
};
/**
 * IEEE 754 16-bit (half precision) float, little endian
 */
exports.Float16_LE = {
    len: 2,
    get(array, offset) {
        return ieee754.read(array, offset, true, 10, this.len);
    },
    put(array, offset, value) {
        ieee754.write(array, value, offset, true, 10, this.len);
        return offset + this.len;
    }
};
/**
 * IEEE 754 32-bit (single precision) float, big endian
 */
exports.Float32_BE = {
    len: 4,
    get(array, offset) {
        return dv(array).getFloat32(offset);
    },
    put(array, offset, value) {
        dv(array).setFloat32(offset, value);
        return offset + 4;
    }
};
/**
 * IEEE 754 32-bit (single precision) float, little endian
 */
exports.Float32_LE = {
    len: 4,
    get(array, offset) {
        return dv(array).getFloat32(offset, true);
    },
    put(array, offset, value) {
        dv(array).setFloat32(offset, value, true);
        return offset + 4;
    }
};
/**
 * IEEE 754 64-bit (double precision) float, big endian
 */
exports.Float64_BE = {
    len: 8,
    get(array, offset) {
        return dv(array).getFloat64(offset);
    },
    put(array, offset, value) {
        dv(array).setFloat64(offset, value);
        return offset + 8;
    }
};
/**
 * IEEE 754 64-bit (double precision) float, little endian
 */
exports.Float64_LE = {
    len: 8,
    get(array, offset) {
        return dv(array).getFloat64(offset, true);
    },
    put(array, offset, value) {
        dv(array).setFloat64(offset, value, true);
        return offset + 8;
    }
};
/**
 * IEEE 754 80-bit (extended precision) float, big endian
 */
exports.Float80_BE = {
    len: 10,
    get(array, offset) {
        return ieee754.read(array, offset, false, 63, this.len);
    },
    put(array, offset, value) {
        ieee754.write(array, value, offset, false, 63, this.len);
        return offset + this.len;
    }
};
/**
 * IEEE 754 80-bit (extended precision) float, little endian
 */
exports.Float80_LE = {
    len: 10,
    get(array, offset) {
        return ieee754.read(array, offset, true, 63, this.len);
    },
    put(array, offset, value) {
        ieee754.write(array, value, offset, true, 63, this.len);
        return offset + this.len;
    }
};
/**
 * Ignore a given number of bytes
 */
class IgnoreType {
    /**
     * @param len number of bytes to ignore
     */
    constructor(len) {
        this.len = len;
    }
    // ToDo: don't read, but skip data
    get(array, off) {
    }
}
exports.IgnoreType = IgnoreType;
class Uint8ArrayType {
    constructor(len) {
        this.len = len;
    }
    get(array, offset) {
        return array.subarray(offset, offset + this.len);
    }
}
exports.Uint8ArrayType = Uint8ArrayType;
class BufferType {
    constructor(len) {
        this.len = len;
    }
    get(uint8Array, off) {
        return Buffer.from(uint8Array.subarray(off, off + this.len));
    }
}
exports.BufferType = BufferType;
/**
 * Consume a fixed number of bytes from the stream and return a string with a specified encoding.
 */
class StringType {
    constructor(len, encoding) {
        this.len = len;
        this.encoding = encoding;
    }
    get(uint8Array, offset) {
        return Buffer.from(uint8Array).toString(this.encoding, offset, offset + this.len);
    }
}
exports.StringType = StringType;
/**
 * ANSI Latin 1 String
 * Using windows-1252 / ISO 8859-1 decoding
 */
class AnsiStringType {
    constructor(len) {
        this.len = len;
    }
    static decode(buffer, offset, until) {
        let str = '';
        for (let i = offset; i < until; ++i) {
            str += AnsiStringType.codePointToString(AnsiStringType.singleByteDecoder(buffer[i]));
        }
        return str;
    }
    static inRange(a, min, max) {
        return min <= a && a <= max;
    }
    static codePointToString(cp) {
        if (cp <= 0xFFFF) {
            return String.fromCharCode(cp);
        }
        else {
            cp -= 0x10000;
            return String.fromCharCode((cp >> 10) + 0xD800, (cp & 0x3FF) + 0xDC00);
        }
    }
    static singleByteDecoder(bite) {
        if (AnsiStringType.inRange(bite, 0x00, 0x7F)) {
            return bite;
        }
        const codePoint = AnsiStringType.windows1252[bite - 0x80];
        if (codePoint === null) {
            throw Error('invaliding encoding');
        }
        return codePoint;
    }
    get(buffer, offset = 0) {
        return AnsiStringType.decode(buffer, offset, offset + this.len);
    }
}
exports.AnsiStringType = AnsiStringType;
AnsiStringType.windows1252 = [8364, 129, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352,
    8249, 338, 141, 381, 143, 144, 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732,
    8482, 353, 8250, 339, 157, 382, 376, 160, 161, 162, 163, 164, 165, 166, 167, 168,
    169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184,
    185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200,
    201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216,
    217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232,
    233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247,
    248, 249, 250, 251, 252, 253, 254, 255];


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports) => {

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.stringToBytes = string => [...string].map(character => character.charCodeAt(0));

/**
Checks whether the TAR checksum is valid.

@param {Buffer} buffer - The TAR header `[offset ... offset + 512]`.
@param {number} offset - TAR header offset.
@returns {boolean} `true` if the TAR checksum is valid, otherwise `false`.
*/
exports.tarHeaderChecksumMatches = (buffer, offset = 0) => {
	const readSum = parseInt(buffer.toString('utf8', 148, 154).replace(/\0.*$/, '').trim(), 8); // Read sum in header
	if (isNaN(readSum)) {
		return false;
	}

	let sum = 8 * 0x20; // Initialize signed bit sum

	for (let i = offset; i < offset + 148; i++) {
		sum += buffer[i];
	}

	for (let i = offset + 156; i < offset + 512; i++) {
		sum += buffer[i];
	}

	return readSum === sum;
};

/**
ID3 UINT32 sync-safe tokenizer token.
28 bits (representing up to 256MB) integer, the msb is 0 to avoid "false syncsignals".
*/
exports.uint32SyncSafeToken = {
	get: (buffer, offset) => {
		return (buffer[offset + 3] & 0x7F) | ((buffer[offset + 2]) << 7) | ((buffer[offset + 1]) << 14) | ((buffer[offset]) << 21);
	},
	len: 4
};


/***/ }),
/* 24 */
/***/ ((module) => {

"use strict";


module.exports = {
	extensions: [
		'jpg',
		'png',
		'apng',
		'gif',
		'webp',
		'flif',
		'xcf',
		'cr2',
		'cr3',
		'orf',
		'arw',
		'dng',
		'nef',
		'rw2',
		'raf',
		'tif',
		'bmp',
		'icns',
		'jxr',
		'psd',
		'indd',
		'zip',
		'tar',
		'rar',
		'gz',
		'bz2',
		'7z',
		'dmg',
		'mp4',
		'mid',
		'mkv',
		'webm',
		'mov',
		'avi',
		'mpg',
		'mp2',
		'mp3',
		'm4a',
		'oga',
		'ogg',
		'ogv',
		'opus',
		'flac',
		'wav',
		'spx',
		'amr',
		'pdf',
		'epub',
		'exe',
		'swf',
		'rtf',
		'wasm',
		'woff',
		'woff2',
		'eot',
		'ttf',
		'otf',
		'ico',
		'flv',
		'ps',
		'xz',
		'sqlite',
		'nes',
		'crx',
		'xpi',
		'cab',
		'deb',
		'ar',
		'rpm',
		'Z',
		'lz',
		'cfb',
		'mxf',
		'mts',
		'blend',
		'bpg',
		'docx',
		'pptx',
		'xlsx',
		'3gp',
		'3g2',
		'jp2',
		'jpm',
		'jpx',
		'mj2',
		'aif',
		'qcp',
		'odt',
		'ods',
		'odp',
		'xml',
		'mobi',
		'heic',
		'cur',
		'ktx',
		'ape',
		'wv',
		'dcm',
		'ics',
		'glb',
		'pcap',
		'dsf',
		'lnk',
		'alias',
		'voc',
		'ac3',
		'm4v',
		'm4p',
		'm4b',
		'f4v',
		'f4p',
		'f4b',
		'f4a',
		'mie',
		'asf',
		'ogm',
		'ogx',
		'mpc',
		'arrow',
		'shp',
		'aac',
		'mp1',
		'it',
		's3m',
		'xm',
		'ai',
		'skp',
		'avif',
		'eps',
		'lzh',
		'pgp',
		'asar',
		'stl',
		'chm',
		'3mf',
		'zst',
		'jxl',
		'vcf'
	],
	mimeTypes: [
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/webp',
		'image/flif',
		'image/x-xcf',
		'image/x-canon-cr2',
		'image/x-canon-cr3',
		'image/tiff',
		'image/bmp',
		'image/vnd.ms-photo',
		'image/vnd.adobe.photoshop',
		'application/x-indesign',
		'application/epub+zip',
		'application/x-xpinstall',
		'application/vnd.oasis.opendocument.text',
		'application/vnd.oasis.opendocument.spreadsheet',
		'application/vnd.oasis.opendocument.presentation',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/zip',
		'application/x-tar',
		'application/x-rar-compressed',
		'application/gzip',
		'application/x-bzip2',
		'application/x-7z-compressed',
		'application/x-apple-diskimage',
		'application/x-apache-arrow',
		'video/mp4',
		'audio/midi',
		'video/x-matroska',
		'video/webm',
		'video/quicktime',
		'video/vnd.avi',
		'audio/vnd.wave',
		'audio/qcelp',
		'audio/x-ms-asf',
		'video/x-ms-asf',
		'application/vnd.ms-asf',
		'video/mpeg',
		'video/3gpp',
		'audio/mpeg',
		'audio/mp4', // RFC 4337
		'audio/opus',
		'video/ogg',
		'audio/ogg',
		'application/ogg',
		'audio/x-flac',
		'audio/ape',
		'audio/wavpack',
		'audio/amr',
		'application/pdf',
		'application/x-msdownload',
		'application/x-shockwave-flash',
		'application/rtf',
		'application/wasm',
		'font/woff',
		'font/woff2',
		'application/vnd.ms-fontobject',
		'font/ttf',
		'font/otf',
		'image/x-icon',
		'video/x-flv',
		'application/postscript',
		'application/eps',
		'application/x-xz',
		'application/x-sqlite3',
		'application/x-nintendo-nes-rom',
		'application/x-google-chrome-extension',
		'application/vnd.ms-cab-compressed',
		'application/x-deb',
		'application/x-unix-archive',
		'application/x-rpm',
		'application/x-compress',
		'application/x-lzip',
		'application/x-cfb',
		'application/x-mie',
		'application/mxf',
		'video/mp2t',
		'application/x-blender',
		'image/bpg',
		'image/jp2',
		'image/jpx',
		'image/jpm',
		'image/mj2',
		'audio/aiff',
		'application/xml',
		'application/x-mobipocket-ebook',
		'image/heif',
		'image/heif-sequence',
		'image/heic',
		'image/heic-sequence',
		'image/icns',
		'image/ktx',
		'application/dicom',
		'audio/x-musepack',
		'text/calendar',
		'text/vcard',
		'model/gltf-binary',
		'application/vnd.tcpdump.pcap',
		'audio/x-dsf', // Non-standard
		'application/x.ms.shortcut', // Invented by us
		'application/x.apple.alias', // Invented by us
		'audio/x-voc',
		'audio/vnd.dolby.dd-raw',
		'audio/x-m4a',
		'image/apng',
		'image/x-olympus-orf',
		'image/x-sony-arw',
		'image/x-adobe-dng',
		'image/x-nikon-nef',
		'image/x-panasonic-rw2',
		'image/x-fujifilm-raf',
		'video/x-m4v',
		'video/3gpp2',
		'application/x-esri-shape',
		'audio/aac',
		'audio/x-it',
		'audio/x-s3m',
		'audio/x-xm',
		'video/MP1S',
		'video/MP2P',
		'application/vnd.sketchup.skp',
		'image/avif',
		'application/x-lzh-compressed',
		'application/pgp-encrypted',
		'application/x-asar',
		'model/stl',
		'application/vnd.ms-htmlhelp',
		'model/3mf',
		'image/jxl',
		'application/zstd'
	]
};


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */



/**
 * RegExp to match *( ";" parameter ) in RFC 7231 sec 3.1.1.1
 *
 * parameter     = token "=" ( token / quoted-string )
 * token         = 1*tchar
 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
 *               / DIGIT / ALPHA
 *               ; any VCHAR, except delimiters
 * quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
 * qdtext        = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
 * obs-text      = %x80-FF
 * quoted-pair   = "\" ( HTAB / SP / VCHAR / obs-text )
 */
var PARAM_REGEXP = /; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g // eslint-disable-line no-control-regex
var TEXT_REGEXP = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/ // eslint-disable-line no-control-regex
var TOKEN_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/

/**
 * RegExp to match quoted-pair in RFC 7230 sec 3.2.6
 *
 * quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
 * obs-text    = %x80-FF
 */
var QESC_REGEXP = /\\([\u000b\u0020-\u00ff])/g // eslint-disable-line no-control-regex

/**
 * RegExp to match chars that must be quoted-pair in RFC 7230 sec 3.2.6
 */
var QUOTE_REGEXP = /([\\"])/g

/**
 * RegExp to match type in RFC 7231 sec 3.1.1.1
 *
 * media-type = type "/" subtype
 * type       = token
 * subtype    = token
 */
var TYPE_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/

/**
 * Module exports.
 * @public
 */

exports.format = format
exports.parse = parse

/**
 * Format object to media type.
 *
 * @param {object} obj
 * @return {string}
 * @public
 */

function format (obj) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('argument obj is required')
  }

  var parameters = obj.parameters
  var type = obj.type

  if (!type || !TYPE_REGEXP.test(type)) {
    throw new TypeError('invalid type')
  }

  var string = type

  // append parameters
  if (parameters && typeof parameters === 'object') {
    var param
    var params = Object.keys(parameters).sort()

    for (var i = 0; i < params.length; i++) {
      param = params[i]

      if (!TOKEN_REGEXP.test(param)) {
        throw new TypeError('invalid parameter name')
      }

      string += '; ' + param + '=' + qstring(parameters[param])
    }
  }

  return string
}

/**
 * Parse media type to object.
 *
 * @param {string|object} string
 * @return {Object}
 * @public
 */

function parse (string) {
  if (!string) {
    throw new TypeError('argument string is required')
  }

  // support req/res-like objects as argument
  var header = typeof string === 'object'
    ? getcontenttype(string)
    : string

  if (typeof header !== 'string') {
    throw new TypeError('argument string is required to be a string')
  }

  var index = header.indexOf(';')
  var type = index !== -1
    ? header.slice(0, index).trim()
    : header.trim()

  if (!TYPE_REGEXP.test(type)) {
    throw new TypeError('invalid media type')
  }

  var obj = new ContentType(type.toLowerCase())

  // parse parameters
  if (index !== -1) {
    var key
    var match
    var value

    PARAM_REGEXP.lastIndex = index

    while ((match = PARAM_REGEXP.exec(header))) {
      if (match.index !== index) {
        throw new TypeError('invalid parameter format')
      }

      index += match[0].length
      key = match[1].toLowerCase()
      value = match[2]

      if (value.charCodeAt(0) === 0x22 /* " */) {
        // remove quotes
        value = value.slice(1, -1)

        // remove escapes
        if (value.indexOf('\\') !== -1) {
          value = value.replace(QESC_REGEXP, '$1')
        }
      }

      obj.parameters[key] = value
    }

    if (index !== header.length) {
      throw new TypeError('invalid parameter format')
    }
  }

  return obj
}

/**
 * Get content-type from req/res objects.
 *
 * @param {object}
 * @return {Object}
 * @private
 */

function getcontenttype (obj) {
  var header

  if (typeof obj.getHeader === 'function') {
    // res-like
    header = obj.getHeader('content-type')
  } else if (typeof obj.headers === 'object') {
    // req-like
    header = obj.headers && obj.headers['content-type']
  }

  if (typeof header !== 'string') {
    throw new TypeError('content-type header is missing from object')
  }

  return header
}

/**
 * Quote a string if necessary.
 *
 * @param {string} val
 * @return {string}
 * @private
 */

function qstring (val) {
  var str = String(val)

  // no need to quote tokens
  if (TOKEN_REGEXP.test(str)) {
    return str
  }

  if (str.length > 0 && !TEXT_REGEXP.test(str)) {
    throw new TypeError('invalid parameter value')
  }

  return '"' + str.replace(QUOTE_REGEXP, '\\$1') + '"'
}

/**
 * Class to represent a content type.
 * @private
 */
function ContentType (type) {
  this.parameters = Object.create(null)
  this.type = type
}


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/*!
 * media-typer
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */



/**
 * RegExp to match type in RFC 6838
 *
 * type-name = restricted-name
 * subtype-name = restricted-name
 * restricted-name = restricted-name-first *126restricted-name-chars
 * restricted-name-first  = ALPHA / DIGIT
 * restricted-name-chars  = ALPHA / DIGIT / "!" / "#" /
 *                          "$" / "&" / "-" / "^" / "_"
 * restricted-name-chars =/ "." ; Characters before first dot always
 *                              ; specify a facet name
 * restricted-name-chars =/ "+" ; Characters after last plus always
 *                              ; specify a structured syntax suffix
 * ALPHA =  %x41-5A / %x61-7A   ; A-Z / a-z
 * DIGIT =  %x30-39             ; 0-9
 */
var SUBTYPE_NAME_REGEXP = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.-]{0,126}$/
var TYPE_NAME_REGEXP = /^[A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126}$/
var TYPE_REGEXP = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/

/**
 * Module exports.
 */

exports.format = format
exports.parse = parse
exports.test = test

/**
 * Format object to media type.
 *
 * @param {object} obj
 * @return {string}
 * @public
 */

function format (obj) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('argument obj is required')
  }

  var subtype = obj.subtype
  var suffix = obj.suffix
  var type = obj.type

  if (!type || !TYPE_NAME_REGEXP.test(type)) {
    throw new TypeError('invalid type')
  }

  if (!subtype || !SUBTYPE_NAME_REGEXP.test(subtype)) {
    throw new TypeError('invalid subtype')
  }

  // format as type/subtype
  var string = type + '/' + subtype

  // append +suffix
  if (suffix) {
    if (!TYPE_NAME_REGEXP.test(suffix)) {
      throw new TypeError('invalid suffix')
    }

    string += '+' + suffix
  }

  return string
}

/**
 * Test media type.
 *
 * @param {string} string
 * @return {object}
 * @public
 */

function test (string) {
  if (!string) {
    throw new TypeError('argument string is required')
  }

  if (typeof string !== 'string') {
    throw new TypeError('argument string is required to be a string')
  }

  return TYPE_REGEXP.test(string.toLowerCase())
}

/**
 * Parse media type to object.
 *
 * @param {string} string
 * @return {object}
 * @public
 */

function parse (string) {
  if (!string) {
    throw new TypeError('argument string is required')
  }

  if (typeof string !== 'string') {
    throw new TypeError('argument string is required to be a string')
  }

  var match = TYPE_REGEXP.exec(string.toLowerCase())

  if (!match) {
    throw new TypeError('invalid media type')
  }

  var type = match[1]
  var subtype = match[2]
  var suffix

  // suffix after last +
  var index = subtype.lastIndexOf('+')
  if (index !== -1) {
    suffix = subtype.substr(index + 1)
    subtype = subtype.substr(0, index)
  }

  return new MediaType(type, subtype, suffix)
}

/**
 * Class for MediaType object.
 * @public
 */

function MediaType (type, subtype, suffix) {
  this.type = type
  this.subtype = subtype
  this.suffix = suffix
}


/***/ }),
/* 27 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */

if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
	module.exports = __webpack_require__(28);
} else {
	module.exports = __webpack_require__(31);
}


/***/ }),
/* 28 */
/***/ ((module, exports, __webpack_require__) => {

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	let m;

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	// eslint-disable-next-line no-return-assign
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug') || exports.storage.getItem('DEBUG') ;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = __webpack_require__(29)(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};


/***/ }),
/* 29 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = __webpack_require__(30);
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;

		createDebug.names = [];
		createDebug.skips = [];

		const split = (typeof namespaces === 'string' ? namespaces : '')
			.trim()
			.replace(/\s+/g, ',')
			.split(',')
			.filter(Boolean);

		for (const ns of split) {
			if (ns[0] === '-') {
				createDebug.skips.push(ns.slice(1));
			} else {
				createDebug.names.push(ns);
			}
		}
	}

	/**
	 * Checks if the given string matches a namespace template, honoring
	 * asterisks as wildcards.
	 *
	 * @param {String} search
	 * @param {String} template
	 * @return {Boolean}
	 */
	function matchesTemplate(search, template) {
		let searchIndex = 0;
		let templateIndex = 0;
		let starIndex = -1;
		let matchIndex = 0;

		while (searchIndex < search.length) {
			if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === '*')) {
				// Match character or proceed with wildcard
				if (template[templateIndex] === '*') {
					starIndex = templateIndex;
					matchIndex = searchIndex;
					templateIndex++; // Skip the '*'
				} else {
					searchIndex++;
					templateIndex++;
				}
			} else if (starIndex !== -1) { // eslint-disable-line no-negated-condition
				// Backtrack to the last '*' and try to match more characters
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else {
				return false; // No match
			}
		}

		// Handle trailing '*' in template
		while (templateIndex < template.length && template[templateIndex] === '*') {
			templateIndex++;
		}

		return templateIndex === template.length;
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names,
			...createDebug.skips.map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		for (const skip of createDebug.skips) {
			if (matchesTemplate(name, skip)) {
				return false;
			}
		}

		for (const ns of createDebug.names) {
			if (matchesTemplate(name, ns)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;


/***/ }),
/* 30 */
/***/ ((module) => {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ }),
/* 31 */
/***/ ((module, exports, __webpack_require__) => {

/**
 * Module dependencies.
 */

const tty = __webpack_require__(32);
const util = __webpack_require__(33);

/**
 * This is the Node.js implementation of `debug()`.
 */

exports.init = init;
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.destroy = util.deprecate(
	() => {},
	'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
);

/**
 * Colors.
 */

exports.colors = [6, 2, 3, 4, 5, 1];

try {
	// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
	// eslint-disable-next-line import/no-extraneous-dependencies
	const supportsColor = __webpack_require__(34);

	if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
		exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	}
} catch (error) {
	// Swallow - we only care if `supports-color` is available; it doesn't have to be.
}

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

exports.inspectOpts = Object.keys(process.env).filter(key => {
	return /^debug_/i.test(key);
}).reduce((obj, key) => {
	// Camel-case
	const prop = key
		.substring(6)
		.toLowerCase()
		.replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});

	// Coerce string value into JS value
	let val = process.env[key];
	if (/^(yes|on|true|enabled)$/i.test(val)) {
		val = true;
	} else if (/^(no|off|false|disabled)$/i.test(val)) {
		val = false;
	} else if (val === 'null') {
		val = null;
	} else {
		val = Number(val);
	}

	obj[prop] = val;
	return obj;
}, {});

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
	return 'colors' in exports.inspectOpts ?
		Boolean(exports.inspectOpts.colors) :
		tty.isatty(process.stderr.fd);
}

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	const {namespace: name, useColors} = this;

	if (useColors) {
		const c = this.color;
		const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
		const prefix = `  ${colorCode};1m${name} \u001B[0m`;

		args[0] = prefix + args[0].split('\n').join('\n' + prefix);
		args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
	} else {
		args[0] = getDate() + name + ' ' + args[0];
	}
}

function getDate() {
	if (exports.inspectOpts.hideDate) {
		return '';
	}
	return new Date().toISOString() + ' ';
}

/**
 * Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
 */

function log(...args) {
	return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + '\n');
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	if (namespaces) {
		process.env.DEBUG = namespaces;
	} else {
		// If you set a process.env field to null or undefined, it gets cast to the
		// string 'null' or 'undefined'. Just delete instead.
		delete process.env.DEBUG;
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
	return process.env.DEBUG;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

function init(debug) {
	debug.inspectOpts = {};

	const keys = Object.keys(exports.inspectOpts);
	for (let i = 0; i < keys.length; i++) {
		debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
}

module.exports = __webpack_require__(29)(exports);

const {formatters} = module.exports;

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

formatters.o = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts)
		.split('\n')
		.map(str => str.trim())
		.join(' ');
};

/**
 * Map %O to `util.inspect()`, allowing multiple lines if needed.
 */

formatters.O = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts);
};


/***/ }),
/* 32 */
/***/ ((module) => {

"use strict";
module.exports = require("tty");

/***/ }),
/* 33 */
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),
/* 34 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const os = __webpack_require__(35);
const tty = __webpack_require__(32);
const hasFlag = __webpack_require__(36);

const {env} = process;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false') ||
	hasFlag('color=never')) {
	forceColor = 0;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = 1;
}

if ('FORCE_COLOR' in env) {
	if (env.FORCE_COLOR === 'true') {
		forceColor = 1;
	} else if (env.FORCE_COLOR === 'false') {
		forceColor = 0;
	} else {
		forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
	}
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(haveStream, streamIsTTY) {
	if (forceColor === 0) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (haveStream && !streamIsTTY && forceColor === undefined) {
		return 0;
	}

	const min = forceColor || 0;

	if (env.TERM === 'dumb') {
		return min;
	}

	if (process.platform === 'win32') {
		// Windows 10 build 10586 is the first Windows release that supports 256 colors.
		// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI', 'GITHUB_ACTIONS', 'BUILDKITE'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream, stream && stream.isTTY);
	return translateLevel(level);
}

module.exports = {
	supportsColor: getSupportLevel,
	stdout: translateLevel(supportsColor(true, tty.isatty(1))),
	stderr: translateLevel(supportsColor(true, tty.isatty(2)))
};


/***/ }),
/* 35 */
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),
/* 36 */
/***/ ((module) => {

"use strict";


module.exports = (flag, argv = process.argv) => {
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const position = argv.indexOf(prefix + flag);
	const terminatorPosition = argv.indexOf('--');
	return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.joinArtists = exports.MetadataCollector = void 0;
const type_1 = __webpack_require__(38);
const debug_1 = __webpack_require__(27);
const GenericTagTypes_1 = __webpack_require__(40);
const CombinedTagMapper_1 = __webpack_require__(41);
const GenericTagMapper_1 = __webpack_require__(43);
const Util_1 = __webpack_require__(46);
const FileType = __webpack_require__(20);
const debug = (0, debug_1.default)('music-metadata:collector');
const TagPriority = ['matroska', 'APEv2', 'vorbis', 'ID3v2.4', 'ID3v2.3', 'ID3v2.2', 'exif', 'asf', 'iTunes', 'AIFF', 'ID3v1'];
/**
 * Provided to the parser to uodate the metadata result.
 * Responsible for triggering async updates
 */
class MetadataCollector {
    constructor(opts) {
        this.opts = opts;
        this.format = {
            tagTypes: [],
            trackInfo: []
        };
        this.native = {};
        this.common = {
            track: { no: null, of: null },
            disk: { no: null, of: null },
            movementIndex: {}
        };
        this.quality = {
            warnings: []
        };
        /**
         * Keeps track of origin priority for each mapped id
         */
        this.commonOrigin = {};
        /**
         * Maps a tag type to a priority
         */
        this.originPriority = {};
        this.tagMapper = new CombinedTagMapper_1.CombinedTagMapper();
        let priority = 1;
        for (const tagType of TagPriority) {
            this.originPriority[tagType] = priority++;
        }
        this.originPriority.artificial = 500; // Filled using alternative tags
        this.originPriority.id3v1 = 600; // Consider as the worst because of the field length limit
    }
    /**
     * @returns {boolean} true if one or more tags have been found
     */
    hasAny() {
        return Object.keys(this.native).length > 0;
    }
    addStreamInfo(streamInfo) {
        debug(`streamInfo: type=${type_1.TrackType[streamInfo.type]}, codec=${streamInfo.codecName}`);
        this.format.trackInfo.push(streamInfo);
    }
    setFormat(key, value) {
        debug(`format: ${key} = ${value}`);
        this.format[key] = value; // as any to override readonly
        if (this.opts.observer) {
            this.opts.observer({ metadata: this, tag: { type: 'format', id: key, value } });
        }
    }
    addTag(tagType, tagId, value) {
        debug(`tag ${tagType}.${tagId} = ${value}`);
        if (!this.native[tagType]) {
            this.format.tagTypes.push(tagType);
            this.native[tagType] = [];
        }
        this.native[tagType].push({ id: tagId, value });
        this.toCommon(tagType, tagId, value);
    }
    addWarning(warning) {
        this.quality.warnings.push({ message: warning });
    }
    postMap(tagType, tag) {
        // Common tag (alias) found
        // check if we need to do something special with common tag
        // if the event has been aliased then we need to clean it before
        // it is emitted to the user. e.g. genre (20) -> Electronic
        switch (tag.id) {
            case 'artist':
                if (this.commonOrigin.artist === this.originPriority[tagType]) {
                    // Assume the artist field is used as artists
                    return this.postMap('artificial', { id: 'artists', value: tag.value });
                }
                if (!this.common.artists) {
                    // Fill artists using artist source
                    this.setGenericTag('artificial', { id: 'artists', value: tag.value });
                }
                break;
            case 'artists':
                if (!this.common.artist || this.commonOrigin.artist === this.originPriority.artificial) {
                    if (!this.common.artists || this.common.artists.indexOf(tag.value) === -1) {
                        // Fill artist using artists source
                        const artists = (this.common.artists || []).concat([tag.value]);
                        const value = joinArtists(artists);
                        const artistTag = { id: 'artist', value };
                        this.setGenericTag('artificial', artistTag);
                    }
                }
                break;
            case 'picture':
                this.postFixPicture(tag.value).then(picture => {
                    if (picture !== null) {
                        tag.value = picture;
                        this.setGenericTag(tagType, tag);
                    }
                });
                return;
            case 'totaltracks':
                this.common.track.of = GenericTagMapper_1.CommonTagMapper.toIntOrNull(tag.value);
                return;
            case 'totaldiscs':
                this.common.disk.of = GenericTagMapper_1.CommonTagMapper.toIntOrNull(tag.value);
                return;
            case 'movementTotal':
                this.common.movementIndex.of = GenericTagMapper_1.CommonTagMapper.toIntOrNull(tag.value);
                return;
            case 'track':
            case 'disk':
            case 'movementIndex':
                const of = this.common[tag.id].of; // store of value, maybe maybe overwritten
                this.common[tag.id] = GenericTagMapper_1.CommonTagMapper.normalizeTrack(tag.value);
                this.common[tag.id].of = of != null ? of : this.common[tag.id].of;
                return;
            case 'bpm':
            case 'year':
            case 'originalyear':
                tag.value = parseInt(tag.value, 10);
                break;
            case 'date':
                // ToDo: be more strict on 'YYYY...'
                const year = parseInt(tag.value.substr(0, 4), 10);
                if (!isNaN(year)) {
                    this.common.year = year;
                }
                break;
            case 'discogs_label_id':
            case 'discogs_release_id':
            case 'discogs_master_release_id':
            case 'discogs_artist_id':
            case 'discogs_votes':
                tag.value = typeof tag.value === 'string' ? parseInt(tag.value, 10) : tag.value;
                break;
            case 'replaygain_track_gain':
            case 'replaygain_track_peak':
            case 'replaygain_album_gain':
            case 'replaygain_album_peak':
                tag.value = (0, Util_1.toRatio)(tag.value);
                break;
            case 'replaygain_track_minmax':
                tag.value = tag.value.split(',').map(v => parseInt(v, 10));
                break;
            case 'replaygain_undo':
                const minMix = tag.value.split(',').map(v => parseInt(v, 10));
                tag.value = {
                    leftChannel: minMix[0],
                    rightChannel: minMix[1]
                };
                break;
            case 'gapless': // iTunes gap-less flag
            case 'compilation':
            case 'podcast':
            case 'showMovement':
                tag.value = tag.value === '1' || tag.value === 1; // boolean
                break;
            case 'isrc': // Only keep unique values
                if (this.common[tag.id] && this.common[tag.id].indexOf(tag.value) !== -1)
                    return;
                break;
            default:
            // nothing to do
        }
        if (tag.value !== null) {
            this.setGenericTag(tagType, tag);
        }
    }
    /**
     * Convert native tags to common tags
     * @returns {IAudioMetadata} Native + common tags
     */
    toCommonMetadata() {
        return {
            format: this.format,
            native: this.native,
            quality: this.quality,
            common: this.common
        };
    }
    /**
     * Fix some common issues with picture object
     * @param picture Picture
     */
    async postFixPicture(picture) {
        if (picture.data && picture.data.length > 0) {
            if (!picture.format) {
                const fileType = await FileType.fromBuffer(picture.data);
                if (fileType) {
                    picture.format = fileType.mime;
                }
                else {
                    return null;
                }
            }
            picture.format = picture.format.toLocaleLowerCase();
            switch (picture.format) {
                case 'image/jpg':
                    picture.format = 'image/jpeg'; // ToDo: register warning
            }
            return picture;
        }
        this.addWarning(`Empty picture tag found`);
        return null;
    }
    /**
     * Convert native tag to common tags
     */
    toCommon(tagType, tagId, value) {
        const tag = { id: tagId, value };
        const genericTag = this.tagMapper.mapTag(tagType, tag, this);
        if (genericTag) {
            this.postMap(tagType, genericTag);
        }
    }
    /**
     * Set generic tag
     */
    setGenericTag(tagType, tag) {
        debug(`common.${tag.id} = ${tag.value}`);
        const prio0 = this.commonOrigin[tag.id] || 1000;
        const prio1 = this.originPriority[tagType];
        if ((0, GenericTagTypes_1.isSingleton)(tag.id)) {
            if (prio1 <= prio0) {
                this.common[tag.id] = tag.value;
                this.commonOrigin[tag.id] = prio1;
            }
            else {
                return debug(`Ignore native tag (singleton): ${tagType}.${tag.id} = ${tag.value}`);
            }
        }
        else {
            if (prio1 === prio0) {
                if (!(0, GenericTagTypes_1.isUnique)(tag.id) || this.common[tag.id].indexOf(tag.value) === -1) {
                    this.common[tag.id].push(tag.value);
                }
                else {
                    debug(`Ignore duplicate value: ${tagType}.${tag.id} = ${tag.value}`);
                }
                // no effect? this.commonOrigin[tag.id] = prio1;
            }
            else if (prio1 < prio0) {
                this.common[tag.id] = [tag.value];
                this.commonOrigin[tag.id] = prio1;
            }
            else {
                return debug(`Ignore native tag (list): ${tagType}.${tag.id} = ${tag.value}`);
            }
        }
        if (this.opts.observer) {
            this.opts.observer({ metadata: this, tag: { type: 'common', id: tag.id, value: tag.value } });
        }
        // ToDo: trigger metadata event
    }
}
exports.MetadataCollector = MetadataCollector;
function joinArtists(artists) {
    if (artists.length > 2) {
        return artists.slice(0, artists.length - 1).join(', ') + ' & ' + artists[artists.length - 1];
    }
    return artists.join(' & ');
}
exports.joinArtists = joinArtists;
//# sourceMappingURL=MetadataCollector.js.map

/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TrackType = void 0;
var types_1 = __webpack_require__(39);
Object.defineProperty(exports, "TrackType", ({ enumerable: true, get: function () { return types_1.TrackType; } }));
//# sourceMappingURL=type.js.map

/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TrackType = exports.TargetType = exports.DataType = void 0;
var DataType;
(function (DataType) {
    DataType[DataType["string"] = 0] = "string";
    DataType[DataType["uint"] = 1] = "uint";
    DataType[DataType["uid"] = 2] = "uid";
    DataType[DataType["bool"] = 3] = "bool";
    DataType[DataType["binary"] = 4] = "binary";
    DataType[DataType["float"] = 5] = "float";
})(DataType = exports.DataType || (exports.DataType = {}));
var TargetType;
(function (TargetType) {
    TargetType[TargetType["shot"] = 10] = "shot";
    TargetType[TargetType["scene"] = 20] = "scene";
    TargetType[TargetType["track"] = 30] = "track";
    TargetType[TargetType["part"] = 40] = "part";
    TargetType[TargetType["album"] = 50] = "album";
    TargetType[TargetType["edition"] = 60] = "edition";
    TargetType[TargetType["collection"] = 70] = "collection";
})(TargetType = exports.TargetType || (exports.TargetType = {}));
var TrackType;
(function (TrackType) {
    TrackType[TrackType["video"] = 1] = "video";
    TrackType[TrackType["audio"] = 2] = "audio";
    TrackType[TrackType["complex"] = 3] = "complex";
    TrackType[TrackType["logo"] = 4] = "logo";
    TrackType[TrackType["subtitle"] = 17] = "subtitle";
    TrackType[TrackType["button"] = 18] = "button";
    TrackType[TrackType["control"] = 32] = "control";
})(TrackType = exports.TrackType || (exports.TrackType = {}));
//# sourceMappingURL=types.js.map

/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isUnique = exports.isSingleton = exports.commonTags = void 0;
exports.commonTags = {
    year: { multiple: false },
    track: { multiple: false },
    disk: { multiple: false },
    title: { multiple: false },
    artist: { multiple: false },
    artists: { multiple: true, unique: true },
    albumartist: { multiple: false },
    album: { multiple: false },
    date: { multiple: false },
    originaldate: { multiple: false },
    originalyear: { multiple: false },
    comment: { multiple: true, unique: false },
    genre: { multiple: true, unique: true },
    picture: { multiple: true, unique: true },
    composer: { multiple: true, unique: true },
    lyrics: { multiple: true, unique: false },
    albumsort: { multiple: false, unique: true },
    titlesort: { multiple: false, unique: true },
    work: { multiple: false, unique: true },
    artistsort: { multiple: false, unique: true },
    albumartistsort: { multiple: false, unique: true },
    composersort: { multiple: false, unique: true },
    lyricist: { multiple: true, unique: true },
    writer: { multiple: true, unique: true },
    conductor: { multiple: true, unique: true },
    remixer: { multiple: true, unique: true },
    arranger: { multiple: true, unique: true },
    engineer: { multiple: true, unique: true },
    producer: { multiple: true, unique: true },
    technician: { multiple: true, unique: true },
    djmixer: { multiple: true, unique: true },
    mixer: { multiple: true, unique: true },
    label: { multiple: true, unique: true },
    grouping: { multiple: false },
    subtitle: { multiple: true },
    discsubtitle: { multiple: false },
    totaltracks: { multiple: false },
    totaldiscs: { multiple: false },
    compilation: { multiple: false },
    rating: { multiple: true },
    bpm: { multiple: false },
    mood: { multiple: false },
    media: { multiple: false },
    catalognumber: { multiple: true, unique: true },
    tvShow: { multiple: false },
    tvShowSort: { multiple: false },
    tvSeason: { multiple: false },
    tvEpisode: { multiple: false },
    tvEpisodeId: { multiple: false },
    tvNetwork: { multiple: false },
    podcast: { multiple: false },
    podcasturl: { multiple: false },
    releasestatus: { multiple: false },
    releasetype: { multiple: true },
    releasecountry: { multiple: false },
    script: { multiple: false },
    language: { multiple: false },
    copyright: { multiple: false },
    license: { multiple: false },
    encodedby: { multiple: false },
    encodersettings: { multiple: false },
    gapless: { multiple: false },
    barcode: { multiple: false },
    isrc: { multiple: true },
    asin: { multiple: false },
    musicbrainz_recordingid: { multiple: false },
    musicbrainz_trackid: { multiple: false },
    musicbrainz_albumid: { multiple: false },
    musicbrainz_artistid: { multiple: true },
    musicbrainz_albumartistid: { multiple: true },
    musicbrainz_releasegroupid: { multiple: false },
    musicbrainz_workid: { multiple: false },
    musicbrainz_trmid: { multiple: false },
    musicbrainz_discid: { multiple: false },
    acoustid_id: { multiple: false },
    acoustid_fingerprint: { multiple: false },
    musicip_puid: { multiple: false },
    musicip_fingerprint: { multiple: false },
    website: { multiple: false },
    'performer:instrument': { multiple: true, unique: true },
    averageLevel: { multiple: false },
    peakLevel: { multiple: false },
    notes: { multiple: true, unique: false },
    key: { multiple: false },
    originalalbum: { multiple: false },
    originalartist: { multiple: false },
    discogs_artist_id: { multiple: true, unique: true },
    discogs_release_id: { multiple: false },
    discogs_label_id: { multiple: false },
    discogs_master_release_id: { multiple: false },
    discogs_votes: { multiple: false },
    discogs_rating: { multiple: false },
    replaygain_track_peak: { multiple: false },
    replaygain_track_gain: { multiple: false },
    replaygain_album_peak: { multiple: false },
    replaygain_album_gain: { multiple: false },
    replaygain_track_minmax: { multiple: false },
    replaygain_album_minmax: { multiple: false },
    replaygain_undo: { multiple: false },
    description: { multiple: true },
    longDescription: { multiple: false },
    category: { multiple: true },
    hdVideo: { multiple: false },
    keywords: { multiple: true },
    movement: { multiple: false },
    movementIndex: { multiple: false },
    movementTotal: { multiple: false },
    podcastId: { multiple: false },
    showMovement: { multiple: false },
    stik: { multiple: false }
};
/**
 * @param alias Name of common tag
 * @returns {boolean|*} true if given alias is mapped as a singleton', otherwise false
 */
function isSingleton(alias) {
    return exports.commonTags.hasOwnProperty(alias) && !exports.commonTags[alias].multiple;
}
exports.isSingleton = isSingleton;
/**
 * @param alias Common (generic) tag
 * @returns {boolean|*} true if given alias is a singleton or explicitly marked as unique
 */
function isUnique(alias) {
    return !exports.commonTags[alias].multiple || exports.commonTags[alias].unique;
}
exports.isUnique = isUnique;
//# sourceMappingURL=GenericTagTypes.js.map

/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CombinedTagMapper = void 0;
const ID3v1TagMap_1 = __webpack_require__(42);
const ID3v24TagMapper_1 = __webpack_require__(44);
const AsfTagMapper_1 = __webpack_require__(47);
const ID3v22TagMapper_1 = __webpack_require__(48);
const APEv2TagMapper_1 = __webpack_require__(49);
const MP4TagMapper_1 = __webpack_require__(50);
const VorbisTagMapper_1 = __webpack_require__(51);
const RiffInfoTagMap_1 = __webpack_require__(52);
const MatroskaTagMapper_1 = __webpack_require__(53);
const AiffTagMap_1 = __webpack_require__(54);
class CombinedTagMapper {
    constructor() {
        this.tagMappers = {};
        [
            new ID3v1TagMap_1.ID3v1TagMapper(),
            new ID3v22TagMapper_1.ID3v22TagMapper(),
            new ID3v24TagMapper_1.ID3v24TagMapper(),
            new MP4TagMapper_1.MP4TagMapper(),
            new MP4TagMapper_1.MP4TagMapper(),
            new VorbisTagMapper_1.VorbisTagMapper(),
            new APEv2TagMapper_1.APEv2TagMapper(),
            new AsfTagMapper_1.AsfTagMapper(),
            new RiffInfoTagMap_1.RiffInfoTagMapper(),
            new MatroskaTagMapper_1.MatroskaTagMapper(),
            new AiffTagMap_1.AiffTagMapper()
        ].forEach(mapper => {
            this.registerTagMapper(mapper);
        });
    }
    /**
     * Convert native to generic (common) tags
     * @param tagType Originating tag format
     * @param tag     Native tag to map to a generic tag id
     * @param warnings
     * @return Generic tag result (output of this function)
     */
    mapTag(tagType, tag, warnings) {
        const tagMapper = this.tagMappers[tagType];
        if (tagMapper) {
            return this.tagMappers[tagType].mapGenericTag(tag, warnings);
        }
        throw new Error('No generic tag mapper defined for tag-format: ' + tagType);
    }
    registerTagMapper(genericTagMapper) {
        for (const tagType of genericTagMapper.tagTypes) {
            this.tagMappers[tagType] = genericTagMapper;
        }
    }
}
exports.CombinedTagMapper = CombinedTagMapper;
//# sourceMappingURL=CombinedTagMapper.js.map

/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ID3v1TagMapper = void 0;
const GenericTagMapper_1 = __webpack_require__(43);
/**
 * ID3v1 tag mappings
 */
const id3v1TagMap = {
    title: 'title',
    artist: 'artist',
    album: 'album',
    year: 'year',
    comment: 'comment',
    track: 'track',
    genre: 'genre'
};
class ID3v1TagMapper extends GenericTagMapper_1.CommonTagMapper {
    constructor() {
        super(['ID3v1'], id3v1TagMap);
    }
}
exports.ID3v1TagMapper = ID3v1TagMapper;
//# sourceMappingURL=ID3v1TagMap.js.map

/***/ }),
/* 43 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommonTagMapper = void 0;
class CommonTagMapper {
    static toIntOrNull(str) {
        const cleaned = parseInt(str, 10);
        return isNaN(cleaned) ? null : cleaned;
    }
    // TODO: a string of 1of1 would fail to be converted
    // converts 1/10 to no : 1, of : 10
    // or 1 to no : 1, of : 0
    static normalizeTrack(origVal) {
        const split = origVal.toString().split('/');
        return {
            no: parseInt(split[0], 10) || null,
            of: parseInt(split[1], 10) || null
        };
    }
    constructor(tagTypes, tagMap) {
        this.tagTypes = tagTypes;
        this.tagMap = tagMap;
    }
    /**
     * Process and set common tags
     * write common tags to
     * @param tag Native tag
     * @param warnings Register warnings
     * @return common name
     */
    mapGenericTag(tag, warnings) {
        tag = { id: tag.id, value: tag.value }; // clone object
        this.postMap(tag, warnings);
        // Convert native tag event to generic 'alias' tag
        const id = this.getCommonName(tag.id);
        return id ? { id, value: tag.value } : null;
    }
    /**
     * Convert native tag key to common tag key
     * @tag  Native header tag
     * @return common tag name (alias)
     */
    getCommonName(tag) {
        return this.tagMap[tag];
    }
    /**
     * Handle post mapping exceptions / correction
     * @param tag Tag e.g. {"©alb", "Buena Vista Social Club")
     * @param warnings Used to register warnings
     */
    postMap(tag, warnings) {
        return;
    }
}
CommonTagMapper.maxRatingScore = 1;
exports.CommonTagMapper = CommonTagMapper;
//# sourceMappingURL=GenericTagMapper.js.map

/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ID3v24TagMapper = void 0;
const GenericTagMapper_1 = __webpack_require__(43);
const CaseInsensitiveTagMap_1 = __webpack_require__(45);
const util = __webpack_require__(46);
/**
 * ID3v2.3/ID3v2.4 tag mappings
 */
const id3v24TagMap = {
    // id3v2.3
    TIT2: 'title',
    TPE1: 'artist',
    'TXXX:Artists': 'artists',
    TPE2: 'albumartist',
    TALB: 'album',
    TDRV: 'date',
    /**
     * Original release year
     */
    TORY: 'originalyear',
    TPOS: 'disk',
    TCON: 'genre',
    APIC: 'picture',
    TCOM: 'composer',
    'USLT:description': 'lyrics',
    TSOA: 'albumsort',
    TSOT: 'titlesort',
    TOAL: 'originalalbum',
    TSOP: 'artistsort',
    TSO2: 'albumartistsort',
    TSOC: 'composersort',
    TEXT: 'lyricist',
    'TXXX:Writer': 'writer',
    TPE3: 'conductor',
    // 'IPLS:instrument': 'performer:instrument', // ToDo
    TPE4: 'remixer',
    'IPLS:arranger': 'arranger',
    'IPLS:engineer': 'engineer',
    'IPLS:producer': 'producer',
    'IPLS:DJ-mix': 'djmixer',
    'IPLS:mix': 'mixer',
    TPUB: 'label',
    TIT1: 'grouping',
    TIT3: 'subtitle',
    TRCK: 'track',
    TCMP: 'compilation',
    POPM: 'rating',
    TBPM: 'bpm',
    TMED: 'media',
    'TXXX:CATALOGNUMBER': 'catalognumber',
    'TXXX:MusicBrainz Album Status': 'releasestatus',
    'TXXX:MusicBrainz Album Type': 'releasetype',
    /**
     * Release country as documented: https://picard.musicbrainz.org/docs/mappings/#cite_note-0
     */
    'TXXX:MusicBrainz Album Release Country': 'releasecountry',
    /**
     * Release country as implemented // ToDo: report
     */
    'TXXX:RELEASECOUNTRY': 'releasecountry',
    'TXXX:SCRIPT': 'script',
    TLAN: 'language',
    TCOP: 'copyright',
    WCOP: 'license',
    TENC: 'encodedby',
    TSSE: 'encodersettings',
    'TXXX:BARCODE': 'barcode',
    'TXXX:ISRC': 'isrc',
    TSRC: 'isrc',
    'TXXX:ASIN': 'asin',
    'TXXX:originalyear': 'originalyear',
    'UFID:http://musicbrainz.org': 'musicbrainz_recordingid',
    'TXXX:MusicBrainz Release Track Id': 'musicbrainz_trackid',
    'TXXX:MusicBrainz Album Id': 'musicbrainz_albumid',
    'TXXX:MusicBrainz Artist Id': 'musicbrainz_artistid',
    'TXXX:MusicBrainz Album Artist Id': 'musicbrainz_albumartistid',
    'TXXX:MusicBrainz Release Group Id': 'musicbrainz_releasegroupid',
    'TXXX:MusicBrainz Work Id': 'musicbrainz_workid',
    'TXXX:MusicBrainz TRM Id': 'musicbrainz_trmid',
    'TXXX:MusicBrainz Disc Id': 'musicbrainz_discid',
    'TXXX:ACOUSTID_ID': 'acoustid_id',
    'TXXX:Acoustid Id': 'acoustid_id',
    'TXXX:Acoustid Fingerprint': 'acoustid_fingerprint',
    'TXXX:MusicIP PUID': 'musicip_puid',
    'TXXX:MusicMagic Fingerprint': 'musicip_fingerprint',
    WOAR: 'website',
    // id3v2.4
    // ToDo: In same sequence as defined at http://id3.org/id3v2.4.0-frames
    TDRC: 'date',
    TYER: 'year',
    TDOR: 'originaldate',
    // 'TMCL:instrument': 'performer:instrument',
    'TIPL:arranger': 'arranger',
    'TIPL:engineer': 'engineer',
    'TIPL:producer': 'producer',
    'TIPL:DJ-mix': 'djmixer',
    'TIPL:mix': 'mixer',
    TMOO: 'mood',
    // additional mappings:
    SYLT: 'lyrics',
    TSST: 'discsubtitle',
    TKEY: 'key',
    COMM: 'comment',
    TOPE: 'originalartist',
    // Windows Media Player
    'PRIV:AverageLevel': 'averageLevel',
    'PRIV:PeakLevel': 'peakLevel',
    // Discogs
    'TXXX:DISCOGS_ARTIST_ID': 'discogs_artist_id',
    'TXXX:DISCOGS_ARTISTS': 'artists',
    'TXXX:DISCOGS_ARTIST_NAME': 'artists',
    'TXXX:DISCOGS_ALBUM_ARTISTS': 'albumartist',
    'TXXX:DISCOGS_CATALOG': 'catalognumber',
    'TXXX:DISCOGS_COUNTRY': 'releasecountry',
    'TXXX:DISCOGS_DATE': 'originaldate',
    'TXXX:DISCOGS_LABEL': 'label',
    'TXXX:DISCOGS_LABEL_ID': 'discogs_label_id',
    'TXXX:DISCOGS_MASTER_RELEASE_ID': 'discogs_master_release_id',
    'TXXX:DISCOGS_RATING': 'discogs_rating',
    'TXXX:DISCOGS_RELEASED': 'date',
    'TXXX:DISCOGS_RELEASE_ID': 'discogs_release_id',
    'TXXX:DISCOGS_VOTES': 'discogs_votes',
    'TXXX:CATALOGID': 'catalognumber',
    'TXXX:STYLE': 'genre',
    'TXXX:REPLAYGAIN_TRACK_PEAK': 'replaygain_track_peak',
    'TXXX:REPLAYGAIN_TRACK_GAIN': 'replaygain_track_gain',
    'TXXX:REPLAYGAIN_ALBUM_PEAK': 'replaygain_album_peak',
    'TXXX:REPLAYGAIN_ALBUM_GAIN': 'replaygain_album_gain',
    'TXXX:MP3GAIN_MINMAX': 'replaygain_track_minmax',
    'TXXX:MP3GAIN_ALBUM_MINMAX': 'replaygain_album_minmax',
    'TXXX:MP3GAIN_UNDO': 'replaygain_undo',
    MVNM: 'movement',
    MVIN: 'movementIndex',
    PCST: 'podcast',
    TCAT: 'category',
    TDES: 'description',
    TDRL: 'date',
    TGID: 'podcastId',
    TKWD: 'keywords',
    WFED: 'podcasturl'
};
class ID3v24TagMapper extends CaseInsensitiveTagMap_1.CaseInsensitiveTagMap {
    static toRating(popm) {
        return {
            source: popm.email,
            rating: popm.rating > 0 ? (popm.rating - 1) / 254 * GenericTagMapper_1.CommonTagMapper.maxRatingScore : undefined
        };
    }
    constructor() {
        super(['ID3v2.3', 'ID3v2.4'], id3v24TagMap);
    }
    /**
     * Handle post mapping exceptions / correction
     * @param tag to post map
     * @param warnings Wil be used to register (collect) warnings
     * @return Common value e.g. "Buena Vista Social Club"
     */
    postMap(tag, warnings) {
        switch (tag.id) {
            case 'UFID': // decode MusicBrainz Recording Id
                if (tag.value.owner_identifier === 'http://musicbrainz.org') {
                    tag.id += ':' + tag.value.owner_identifier;
                    tag.value = util.decodeString(tag.value.identifier, 'latin1'); // latin1 == iso-8859-1
                }
                break;
            case 'PRIV':
                switch (tag.value.owner_identifier) {
                    // decode Windows Media Player
                    case 'AverageLevel':
                    case 'PeakValue':
                        tag.id += ':' + tag.value.owner_identifier;
                        tag.value = tag.value.data.length === 4 ? tag.value.data.readUInt32LE(0) : null;
                        if (tag.value === null) {
                            warnings.addWarning(`Failed to parse PRIV:PeakValue`);
                        }
                        break;
                    default:
                        warnings.addWarning(`Unknown PRIV owner-identifier: ${tag.value.owner_identifier}`);
                }
                break;
            case 'COMM':
                tag.value = tag.value ? tag.value.text : null;
                break;
            case 'POPM':
                tag.value = ID3v24TagMapper.toRating(tag.value);
                break;
            default:
                break;
        }
    }
}
exports.ID3v24TagMapper = ID3v24TagMapper;
//# sourceMappingURL=ID3v24TagMapper.js.map

/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CaseInsensitiveTagMap = void 0;
const GenericTagMapper_1 = __webpack_require__(43);
class CaseInsensitiveTagMap extends GenericTagMapper_1.CommonTagMapper {
    constructor(tagTypes, tagMap) {
        const upperCaseMap = {};
        for (const tag of Object.keys(tagMap)) {
            upperCaseMap[tag.toUpperCase()] = tagMap[tag];
        }
        super(tagTypes, upperCaseMap);
    }
    /**
     * @tag  Native header tag
     * @return common tag name (alias)
     */
    getCommonName(tag) {
        return this.tagMap[tag.toUpperCase()];
    }
}
exports.CaseInsensitiveTagMap = CaseInsensitiveTagMap;
//# sourceMappingURL=CaseInsensitiveTagMap.js.map

/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toRatio = exports.dbToRatio = exports.ratioToDb = exports.a2hex = exports.isBitSet = exports.getBitAllignedNumber = exports.stripNulls = exports.decodeString = exports.trimRightNull = exports.findZero = exports.getBit = void 0;
function getBit(buf, off, bit) {
    return (buf[off] & (1 << bit)) !== 0;
}
exports.getBit = getBit;
/**
 * Found delimiting zero in uint8Array
 * @param uint8Array Uint8Array to find the zero delimiter in
 * @param start Offset in uint8Array
 * @param end Last position to parse in uint8Array
 * @param encoding The string encoding used
 * @return Absolute position on uint8Array where zero found
 */
function findZero(uint8Array, start, end, encoding) {
    let i = start;
    if (encoding === 'utf16le') {
        while (uint8Array[i] !== 0 || uint8Array[i + 1] !== 0) {
            if (i >= end)
                return end;
            i += 2;
        }
        return i;
    }
    else {
        while (uint8Array[i] !== 0) {
            if (i >= end)
                return end;
            i++;
        }
        return i;
    }
}
exports.findZero = findZero;
function trimRightNull(x) {
    const pos0 = x.indexOf('\0');
    return pos0 === -1 ? x : x.substr(0, pos0);
}
exports.trimRightNull = trimRightNull;
function swapBytes(uint8Array) {
    const l = uint8Array.length;
    if ((l & 1) !== 0)
        throw new Error('Buffer length must be even');
    for (let i = 0; i < l; i += 2) {
        const a = uint8Array[i];
        uint8Array[i] = uint8Array[i + 1];
        uint8Array[i + 1] = a;
    }
    return uint8Array;
}
/**
 * Decode string
 */
function decodeString(uint8Array, encoding) {
    // annoying workaround for a double BOM issue
    // https://github.com/leetreveil/musicmetadata/issues/84
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) { // little endian
        return decodeString(uint8Array.subarray(2), encoding);
    }
    else if (encoding === 'utf16le' && uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
        // BOM, indicating big endian decoding
        if ((uint8Array.length & 1) !== 0)
            throw new Error('Expected even number of octets for 16-bit unicode string');
        return decodeString(swapBytes(uint8Array), encoding);
    }
    return Buffer.from(uint8Array).toString(encoding);
}
exports.decodeString = decodeString;
function stripNulls(str) {
    str = str.replace(/^\x00+/g, '');
    str = str.replace(/\x00+$/g, '');
    return str;
}
exports.stripNulls = stripNulls;
/**
 * Read bit-aligned number start from buffer
 * Total offset in bits = byteOffset * 8 + bitOffset
 * @param source Byte buffer
 * @param byteOffset Starting offset in bytes
 * @param bitOffset Starting offset in bits: 0 = lsb
 * @param len Length of number in bits
 * @return Decoded bit aligned number
 */
function getBitAllignedNumber(source, byteOffset, bitOffset, len) {
    const byteOff = byteOffset + ~~(bitOffset / 8);
    const bitOff = bitOffset % 8;
    let value = source[byteOff];
    value &= 0xff >> bitOff;
    const bitsRead = 8 - bitOff;
    const bitsLeft = len - bitsRead;
    if (bitsLeft < 0) {
        value >>= (8 - bitOff - len);
    }
    else if (bitsLeft > 0) {
        value <<= bitsLeft;
        value |= getBitAllignedNumber(source, byteOffset, bitOffset + bitsRead, bitsLeft);
    }
    return value;
}
exports.getBitAllignedNumber = getBitAllignedNumber;
/**
 * Read bit-aligned number start from buffer
 * Total offset in bits = byteOffset * 8 + bitOffset
 * @param source Byte Uint8Array
 * @param byteOffset Starting offset in bytes
 * @param bitOffset Starting offset in bits: 0 = most significant bit, 7 is the least significant bit
 * @return True if bit is set
 */
function isBitSet(source, byteOffset, bitOffset) {
    return getBitAllignedNumber(source, byteOffset, bitOffset, 1) === 1;
}
exports.isBitSet = isBitSet;
function a2hex(str) {
    const arr = [];
    for (let i = 0, l = str.length; i < l; i++) {
        const hex = Number(str.charCodeAt(i)).toString(16);
        arr.push(hex.length === 1 ? '0' + hex : hex);
    }
    return arr.join(' ');
}
exports.a2hex = a2hex;
/**
 * Convert power ratio to DB
 * ratio: [0..1]
 */
function ratioToDb(ratio) {
    return 10 * Math.log10(ratio);
}
exports.ratioToDb = ratioToDb;
/**
 * Convert dB to ratio
 * db Decibels
 */
function dbToRatio(dB) {
    return Math.pow(10, dB / 10);
}
exports.dbToRatio = dbToRatio;
/**
 * Convert replay gain to ratio and Decibel
 * @param value string holding a ratio like '0.034' or '-7.54 dB'
 */
function toRatio(value) {
    const ps = value.split(' ').map(p => p.trim().toLowerCase());
    // @ts-ignore
    if (ps.length >= 1) {
        const v = parseFloat(ps[0]);
        return ps.length === 2 && ps[1] === 'db' ? {
            dB: v,
            ratio: dbToRatio(v)
        } : {
            dB: ratioToDb(v),
            ratio: v
        };
    }
}
exports.toRatio = toRatio;
//# sourceMappingURL=Util.js.map

/***/ }),
/* 47 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AsfTagMapper = void 0;
const GenericTagMapper_1 = __webpack_require__(43);
/**
 * ASF Metadata tag mappings.
 * See http://msdn.microsoft.com/en-us/library/ms867702.aspx
 */
const asfTagMap = {
    Title: 'title',
    Author: 'artist',
    'WM/AlbumArtist': 'albumartist',
    'WM/AlbumTitle': 'album',
    'WM/Year': 'date',
    'WM/OriginalReleaseTime': 'originaldate',
    'WM/OriginalReleaseYear': 'originalyear',
    Description: 'comment',
    'WM/TrackNumber': 'track',
    'WM/PartOfSet': 'disk',
    'WM/Genre': 'genre',
    'WM/Composer': 'composer',
    'WM/Lyrics': 'lyrics',
    'WM/AlbumSortOrder': 'albumsort',
    'WM/TitleSortOrder': 'titlesort',
    'WM/ArtistSortOrder': 'artistsort',
    'WM/AlbumArtistSortOrder': 'albumartistsort',
    'WM/ComposerSortOrder': 'composersort',
    'WM/Writer': 'lyricist',
    'WM/Conductor': 'conductor',
    'WM/ModifiedBy': 'remixer',
    'WM/Engineer': 'engineer',
    'WM/Producer': 'producer',
    'WM/DJMixer': 'djmixer',
    'WM/Mixer': 'mixer',
    'WM/Publisher': 'label',
    'WM/ContentGroupDescription': 'grouping',
    'WM/SubTitle': 'subtitle',
    'WM/SetSubTitle': 'discsubtitle',
    // 'WM/PartOfSet': 'totaldiscs',
    'WM/IsCompilation': 'compilation',
    'WM/SharedUserRating': 'rating',
    'WM/BeatsPerMinute': 'bpm',
    'WM/Mood': 'mood',
    'WM/Media': 'media',
    'WM/CatalogNo': 'catalognumber',
    'MusicBrainz/Album Status': 'releasestatus',
    'MusicBrainz/Album Type': 'releasetype',
    'MusicBrainz/Album Release Country': 'releasecountry',
    'WM/Script': 'script',
    'WM/Language': 'language',
    Copyright: 'copyright',
    LICENSE: 'license',
    'WM/EncodedBy': 'encodedby',
    'WM/EncodingSettings': 'encodersettings',
    'WM/Barcode': 'barcode',
    'WM/ISRC': 'isrc',
    'MusicBrainz/Track Id': 'musicbrainz_recordingid',
    'MusicBrainz/Release Track Id': 'musicbrainz_trackid',
    'MusicBrainz/Album Id': 'musicbrainz_albumid',
    'MusicBrainz/Artist Id': 'musicbrainz_artistid',
    'MusicBrainz/Album Artist Id': 'musicbrainz_albumartistid',
    'MusicBrainz/Release Group Id': 'musicbrainz_releasegroupid',
    'MusicBrainz/Work Id': 'musicbrainz_workid',
    'MusicBrainz/TRM Id': 'musicbrainz_trmid',
    'MusicBrainz/Disc Id': 'musicbrainz_discid',
    'Acoustid/Id': 'acoustid_id',
    'Acoustid/Fingerprint': 'acoustid_fingerprint',
    'MusicIP/PUID': 'musicip_puid',
    'WM/ARTISTS': 'artists',
    'WM/InitialKey': 'key',
    ASIN: 'asin',
    'WM/Work': 'work',
    'WM/AuthorURL': 'website',
    'WM/Picture': 'picture'
};
class AsfTagMapper extends GenericTagMapper_1.CommonTagMapper {
    static toRating(rating) {
        return {
            rating: parseFloat(rating + 1) / 5
        };
    }
    constructor() {
        super(['asf'], asfTagMap);
    }
    postMap(tag) {
        switch (tag.id) {
            case 'WM/SharedUserRating':
                const keys = tag.id.split(':');
                tag.value = AsfTagMapper.toRating(tag.value);
                tag.id = keys[0];
                break;
        }
    }
}
exports.AsfTagMapper = AsfTagMapper;
//# sourceMappingURL=AsfTagMapper.js.map

/***/ }),
/* 48 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ID3v22TagMapper = exports.id3v22TagMap = void 0;
const CaseInsensitiveTagMap_1 = __webpack_require__(45);
/**
 * ID3v2.2 tag mappings
 */
exports.id3v22TagMap = {
    TT2: 'title',
    TP1: 'artist',
    TP2: 'albumartist',
    TAL: 'album',
    TYE: 'year',
    COM: 'comment',
    TRK: 'track',
    TPA: 'disk',
    TCO: 'genre',
    PIC: 'picture',
    TCM: 'composer',
    TOR: 'originaldate',
    TOT: 'originalalbum',
    TXT: 'lyricist',
    TP3: 'conductor',
    TPB: 'label',
    TT1: 'grouping',
    TT3: 'subtitle',
    TLA: 'language',
    TCR: 'copyright',
    WCP: 'license',
    TEN: 'encodedby',
    TSS: 'encodersettings',
    WAR: 'website',
    'COM:iTunPGAP': 'gapless'
    /* ToDo: iTunes tags:
    'COM:iTunNORM': ,
    'COM:iTunSMPB': 'encoder delay',
    'COM:iTunes_CDDB_IDs'
    */ ,
    PCS: 'podcast',
    TCP: "compilation",
    TDR: 'date',
    TS2: 'albumartistsort',
    TSA: 'albumsort',
    TSC: 'composersort',
    TSP: 'artistsort',
    TST: 'titlesort',
    WFD: 'podcasturl',
    TBP: 'bpm'
};
class ID3v22TagMapper extends CaseInsensitiveTagMap_1.CaseInsensitiveTagMap {
    constructor() {
        super(['ID3v2.2'], exports.id3v22TagMap);
    }
}
exports.ID3v22TagMapper = ID3v22TagMapper;
//# sourceMappingURL=ID3v22TagMapper.js.map

/***/ }),
/* 49 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.APEv2TagMapper = void 0;
const CaseInsensitiveTagMap_1 = __webpack_require__(45);
/**
 * ID3v2.2 tag mappings
 */
const apev2TagMap = {
    Title: 'title',
    Artist: 'artist',
    Artists: 'artists',
    'Album Artist': 'albumartist',
    Album: 'album',
    Year: 'date',
    Originalyear: 'originalyear',
    Originaldate: 'originaldate',
    Comment: 'comment',
    Track: 'track',
    Disc: 'disk',
    DISCNUMBER: 'disk',
    Genre: 'genre',
    'Cover Art (Front)': 'picture',
    'Cover Art (Back)': 'picture',
    Composer: 'composer',
    Lyrics: 'lyrics',
    ALBUMSORT: 'albumsort',
    TITLESORT: 'titlesort',
    WORK: 'work',
    ARTISTSORT: 'artistsort',
    ALBUMARTISTSORT: 'albumartistsort',
    COMPOSERSORT: 'composersort',
    Lyricist: 'lyricist',
    Writer: 'writer',
    Conductor: 'conductor',
    // 'Performer=artist (instrument)': 'performer:instrument',
    MixArtist: 'remixer',
    Arranger: 'arranger',
    Engineer: 'engineer',
    Producer: 'producer',
    DJMixer: 'djmixer',
    Mixer: 'mixer',
    Label: 'label',
    Grouping: 'grouping',
    Subtitle: 'subtitle',
    DiscSubtitle: 'discsubtitle',
    Compilation: 'compilation',
    BPM: 'bpm',
    Mood: 'mood',
    Media: 'media',
    CatalogNumber: 'catalognumber',
    MUSICBRAINZ_ALBUMSTATUS: 'releasestatus',
    MUSICBRAINZ_ALBUMTYPE: 'releasetype',
    RELEASECOUNTRY: 'releasecountry',
    Script: 'script',
    Language: 'language',
    Copyright: 'copyright',
    LICENSE: 'license',
    EncodedBy: 'encodedby',
    EncoderSettings: 'encodersettings',
    Barcode: 'barcode',
    ISRC: 'isrc',
    ASIN: 'asin',
    musicbrainz_trackid: 'musicbrainz_recordingid',
    musicbrainz_releasetrackid: 'musicbrainz_trackid',
    MUSICBRAINZ_ALBUMID: 'musicbrainz_albumid',
    MUSICBRAINZ_ARTISTID: 'musicbrainz_artistid',
    MUSICBRAINZ_ALBUMARTISTID: 'musicbrainz_albumartistid',
    MUSICBRAINZ_RELEASEGROUPID: 'musicbrainz_releasegroupid',
    MUSICBRAINZ_WORKID: 'musicbrainz_workid',
    MUSICBRAINZ_TRMID: 'musicbrainz_trmid',
    MUSICBRAINZ_DISCID: 'musicbrainz_discid',
    Acoustid_Id: 'acoustid_id',
    ACOUSTID_FINGERPRINT: 'acoustid_fingerprint',
    MUSICIP_PUID: 'musicip_puid',
    Weblink: 'website',
    REPLAYGAIN_TRACK_GAIN: 'replaygain_track_gain',
    REPLAYGAIN_TRACK_PEAK: 'replaygain_track_peak',
    MP3GAIN_MINMAX: 'replaygain_track_minmax',
    MP3GAIN_UNDO: 'replaygain_undo'
};
class APEv2TagMapper extends CaseInsensitiveTagMap_1.CaseInsensitiveTagMap {
    constructor() {
        super(['APEv2'], apev2TagMap);
    }
}
exports.APEv2TagMapper = APEv2TagMapper;
//# sourceMappingURL=APEv2TagMapper.js.map

/***/ }),
/* 50 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MP4TagMapper = exports.tagType = void 0;
const CaseInsensitiveTagMap_1 = __webpack_require__(45);
/**
 * Ref: https://github.com/sergiomb2/libmp4v2/wiki/iTunesMetadata
 */
const mp4TagMap = {
    '©nam': 'title',
    '©ART': 'artist',
    aART: 'albumartist',
    /**
     * ToDo: Album artist seems to be stored here while Picard documentation says: aART
     */
    '----:com.apple.iTunes:Band': 'albumartist',
    '©alb': 'album',
    '©day': 'date',
    '©cmt': 'comment',
    '©com': 'comment',
    trkn: 'track',
    disk: 'disk',
    '©gen': 'genre',
    covr: 'picture',
    '©wrt': 'composer',
    '©lyr': 'lyrics',
    soal: 'albumsort',
    sonm: 'titlesort',
    soar: 'artistsort',
    soaa: 'albumartistsort',
    soco: 'composersort',
    '----:com.apple.iTunes:LYRICIST': 'lyricist',
    '----:com.apple.iTunes:CONDUCTOR': 'conductor',
    '----:com.apple.iTunes:REMIXER': 'remixer',
    '----:com.apple.iTunes:ENGINEER': 'engineer',
    '----:com.apple.iTunes:PRODUCER': 'producer',
    '----:com.apple.iTunes:DJMIXER': 'djmixer',
    '----:com.apple.iTunes:MIXER': 'mixer',
    '----:com.apple.iTunes:LABEL': 'label',
    '©grp': 'grouping',
    '----:com.apple.iTunes:SUBTITLE': 'subtitle',
    '----:com.apple.iTunes:DISCSUBTITLE': 'discsubtitle',
    cpil: 'compilation',
    tmpo: 'bpm',
    '----:com.apple.iTunes:MOOD': 'mood',
    '----:com.apple.iTunes:MEDIA': 'media',
    '----:com.apple.iTunes:CATALOGNUMBER': 'catalognumber',
    tvsh: 'tvShow',
    tvsn: 'tvSeason',
    tves: 'tvEpisode',
    sosn: 'tvShowSort',
    tven: 'tvEpisodeId',
    tvnn: 'tvNetwork',
    pcst: 'podcast',
    purl: 'podcasturl',
    '----:com.apple.iTunes:MusicBrainz Album Status': 'releasestatus',
    '----:com.apple.iTunes:MusicBrainz Album Type': 'releasetype',
    '----:com.apple.iTunes:MusicBrainz Album Release Country': 'releasecountry',
    '----:com.apple.iTunes:SCRIPT': 'script',
    '----:com.apple.iTunes:LANGUAGE': 'language',
    cprt: 'copyright',
    '©cpy': 'copyright',
    '----:com.apple.iTunes:LICENSE': 'license',
    '©too': 'encodedby',
    pgap: 'gapless',
    '----:com.apple.iTunes:BARCODE': 'barcode',
    '----:com.apple.iTunes:ISRC': 'isrc',
    '----:com.apple.iTunes:ASIN': 'asin',
    '----:com.apple.iTunes:NOTES': 'comment',
    '----:com.apple.iTunes:MusicBrainz Track Id': 'musicbrainz_recordingid',
    '----:com.apple.iTunes:MusicBrainz Release Track Id': 'musicbrainz_trackid',
    '----:com.apple.iTunes:MusicBrainz Album Id': 'musicbrainz_albumid',
    '----:com.apple.iTunes:MusicBrainz Artist Id': 'musicbrainz_artistid',
    '----:com.apple.iTunes:MusicBrainz Album Artist Id': 'musicbrainz_albumartistid',
    '----:com.apple.iTunes:MusicBrainz Release Group Id': 'musicbrainz_releasegroupid',
    '----:com.apple.iTunes:MusicBrainz Work Id': 'musicbrainz_workid',
    '----:com.apple.iTunes:MusicBrainz TRM Id': 'musicbrainz_trmid',
    '----:com.apple.iTunes:MusicBrainz Disc Id': 'musicbrainz_discid',
    '----:com.apple.iTunes:Acoustid Id': 'acoustid_id',
    '----:com.apple.iTunes:Acoustid Fingerprint': 'acoustid_fingerprint',
    '----:com.apple.iTunes:MusicIP PUID': 'musicip_puid',
    '----:com.apple.iTunes:fingerprint': 'musicip_fingerprint',
    '----:com.apple.iTunes:replaygain_track_gain': 'replaygain_track_gain',
    '----:com.apple.iTunes:replaygain_track_peak': 'replaygain_track_peak',
    '----:com.apple.iTunes:replaygain_album_gain': 'replaygain_album_gain',
    '----:com.apple.iTunes:replaygain_album_peak': 'replaygain_album_peak',
    '----:com.apple.iTunes:replaygain_track_minmax': 'replaygain_track_minmax',
    '----:com.apple.iTunes:replaygain_album_minmax': 'replaygain_album_minmax',
    '----:com.apple.iTunes:replaygain_undo': 'replaygain_undo',
    // Additional mappings:
    gnre: 'genre',
    '----:com.apple.iTunes:ALBUMARTISTSORT': 'albumartistsort',
    '----:com.apple.iTunes:ARTISTS': 'artists',
    '----:com.apple.iTunes:ORIGINALDATE': 'originaldate',
    '----:com.apple.iTunes:ORIGINALYEAR': 'originalyear',
    // '----:com.apple.iTunes:PERFORMER': 'performer'
    desc: 'description',
    ldes: 'longDescription',
    '©mvn': 'movement',
    '©mvi': 'movementIndex',
    '©mvc': 'movementTotal',
    '©wrk': 'work',
    catg: 'category',
    egid: 'podcastId',
    hdvd: 'hdVideo',
    keyw: 'keywords',
    shwm: 'showMovement',
    stik: 'stik',
    rate: 'rating'
};
exports.tagType = 'iTunes';
class MP4TagMapper extends CaseInsensitiveTagMap_1.CaseInsensitiveTagMap {
    constructor() {
        super([exports.tagType], mp4TagMap);
    }
    postMap(tag, warnings) {
        switch (tag.id) {
            case 'rate':
                tag.value = {
                    source: undefined,
                    rating: parseFloat(tag.value) / 100
                };
                break;
        }
    }
}
exports.MP4TagMapper = MP4TagMapper;
//# sourceMappingURL=MP4TagMapper.js.map

/***/ }),
/* 51 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VorbisTagMapper = void 0;
const GenericTagMapper_1 = __webpack_require__(43);
/**
 * Vorbis tag mappings
 *
 * Mapping from native header format to one or possibly more 'common' entries
 * The common entries aim to read the same information from different media files
 * independent of the underlying format
 */
const vorbisTagMap = {
    TITLE: 'title',
    ARTIST: 'artist',
    ARTISTS: 'artists',
    ALBUMARTIST: 'albumartist',
    'ALBUM ARTIST': 'albumartist',
    ALBUM: 'album',
    DATE: 'date',
    ORIGINALDATE: 'originaldate',
    ORIGINALYEAR: 'originalyear',
    COMMENT: 'comment',
    TRACKNUMBER: 'track',
    DISCNUMBER: 'disk',
    GENRE: 'genre',
    METADATA_BLOCK_PICTURE: 'picture',
    COMPOSER: 'composer',
    LYRICS: 'lyrics',
    ALBUMSORT: 'albumsort',
    TITLESORT: 'titlesort',
    WORK: 'work',
    ARTISTSORT: 'artistsort',
    ALBUMARTISTSORT: 'albumartistsort',
    COMPOSERSORT: 'composersort',
    LYRICIST: 'lyricist',
    WRITER: 'writer',
    CONDUCTOR: 'conductor',
    // 'PERFORMER=artist (instrument)': 'performer:instrument', // ToDo
    REMIXER: 'remixer',
    ARRANGER: 'arranger',
    ENGINEER: 'engineer',
    PRODUCER: 'producer',
    DJMIXER: 'djmixer',
    MIXER: 'mixer',
    LABEL: 'label',
    GROUPING: 'grouping',
    SUBTITLE: 'subtitle',
    DISCSUBTITLE: 'discsubtitle',
    TRACKTOTAL: 'totaltracks',
    DISCTOTAL: 'totaldiscs',
    COMPILATION: 'compilation',
    RATING: 'rating',
    BPM: 'bpm',
    KEY: 'key',
    MOOD: 'mood',
    MEDIA: 'media',
    CATALOGNUMBER: 'catalognumber',
    RELEASESTATUS: 'releasestatus',
    RELEASETYPE: 'releasetype',
    RELEASECOUNTRY: 'releasecountry',
    SCRIPT: 'script',
    LANGUAGE: 'language',
    COPYRIGHT: 'copyright',
    LICENSE: 'license',
    ENCODEDBY: 'encodedby',
    ENCODERSETTINGS: 'encodersettings',
    BARCODE: 'barcode',
    ISRC: 'isrc',
    ASIN: 'asin',
    MUSICBRAINZ_TRACKID: 'musicbrainz_recordingid',
    MUSICBRAINZ_RELEASETRACKID: 'musicbrainz_trackid',
    MUSICBRAINZ_ALBUMID: 'musicbrainz_albumid',
    MUSICBRAINZ_ARTISTID: 'musicbrainz_artistid',
    MUSICBRAINZ_ALBUMARTISTID: 'musicbrainz_albumartistid',
    MUSICBRAINZ_RELEASEGROUPID: 'musicbrainz_releasegroupid',
    MUSICBRAINZ_WORKID: 'musicbrainz_workid',
    MUSICBRAINZ_TRMID: 'musicbrainz_trmid',
    MUSICBRAINZ_DISCID: 'musicbrainz_discid',
    ACOUSTID_ID: 'acoustid_id',
    ACOUSTID_ID_FINGERPRINT: 'acoustid_fingerprint',
    MUSICIP_PUID: 'musicip_puid',
    // 'FINGERPRINT=MusicMagic Fingerprint {fingerprint}': 'musicip_fingerprint', // ToDo
    WEBSITE: 'website',
    NOTES: 'notes',
    TOTALTRACKS: 'totaltracks',
    TOTALDISCS: 'totaldiscs',
    // Discogs
    DISCOGS_ARTIST_ID: 'discogs_artist_id',
    DISCOGS_ARTISTS: 'artists',
    DISCOGS_ARTIST_NAME: 'artists',
    DISCOGS_ALBUM_ARTISTS: 'albumartist',
    DISCOGS_CATALOG: 'catalognumber',
    DISCOGS_COUNTRY: 'releasecountry',
    DISCOGS_DATE: 'originaldate',
    DISCOGS_LABEL: 'label',
    DISCOGS_LABEL_ID: 'discogs_label_id',
    DISCOGS_MASTER_RELEASE_ID: 'discogs_master_release_id',
    DISCOGS_RATING: 'discogs_rating',
    DISCOGS_RELEASED: 'date',
    DISCOGS_RELEASE_ID: 'discogs_release_id',
    DISCOGS_VOTES: 'discogs_votes',
    CATALOGID: 'catalognumber',
    STYLE: 'genre',
    //
    REPLAYGAIN_TRACK_GAIN: 'replaygain_track_gain',
    REPLAYGAIN_TRACK_PEAK: 'replaygain_track_peak',
    REPLAYGAIN_ALBUM_GAIN: 'replaygain_album_gain',
    REPLAYGAIN_ALBUM_PEAK: 'replaygain_album_peak',
    // To Sure if these (REPLAYGAIN_MINMAX, REPLAYGAIN_ALBUM_MINMAX & REPLAYGAIN_UNDO) are used for Vorbis:
    REPLAYGAIN_MINMAX: 'replaygain_track_minmax',
    REPLAYGAIN_ALBUM_MINMAX: 'replaygain_album_minmax',
    REPLAYGAIN_UNDO: 'replaygain_undo'
};
class VorbisTagMapper extends GenericTagMapper_1.CommonTagMapper {
    static toRating(email, rating, maxScore) {
        return {
            source: email ? email.toLowerCase() : email,
            rating: (parseFloat(rating) / maxScore) * GenericTagMapper_1.CommonTagMapper.maxRatingScore
        };
    }
    constructor() {
        super(['vorbis'], vorbisTagMap);
    }
    postMap(tag) {
        if (tag.id === 'RATING') {
            // The way Winamp 5.666 assigns rating
            tag.value = VorbisTagMapper.toRating(undefined, tag.value, 100);
        }
        else if (tag.id.indexOf('RATING:') === 0) {
            const keys = tag.id.split(':');
            tag.value = VorbisTagMapper.toRating(keys[1], tag.value, 1);
            tag.id = keys[0];
        }
    }
}
exports.VorbisTagMapper = VorbisTagMapper;
//# sourceMappingURL=VorbisTagMapper.js.map

/***/ }),
/* 52 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RiffInfoTagMapper = exports.riffInfoTagMap = void 0;
const GenericTagMapper_1 = __webpack_require__(43);
/**
 * RIFF Info Tags; part of the EXIF 2.3
 * Ref: http://owl.phy.queensu.ca/~phil/exiftool/TagNames/RIFF.html#Info
 */
exports.riffInfoTagMap = {
    IART: 'artist',
    ICRD: 'date',
    INAM: 'title',
    TITL: 'title',
    IPRD: 'album',
    ITRK: 'track',
    IPRT: 'track',
    COMM: 'comment',
    ICMT: 'comment',
    ICNT: 'releasecountry',
    GNRE: 'genre',
    IWRI: 'writer',
    RATE: 'rating',
    YEAR: 'year',
    ISFT: 'encodedby',
    CODE: 'encodedby',
    TURL: 'website',
    IGNR: 'genre',
    IENG: 'engineer',
    ITCH: 'technician',
    IMED: 'media',
    IRPD: 'album' // Product, where the file was intended for
};
class RiffInfoTagMapper extends GenericTagMapper_1.CommonTagMapper {
    constructor() {
        super(['exif'], exports.riffInfoTagMap);
    }
}
exports.RiffInfoTagMapper = RiffInfoTagMapper;
//# sourceMappingURL=RiffInfoTagMap.js.map

/***/ }),
/* 53 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MatroskaTagMapper = void 0;
const CaseInsensitiveTagMap_1 = __webpack_require__(45);
/**
 * EBML Tag map
 */
const ebmlTagMap = {
    'segment:title': 'title',
    'album:ARTIST': 'albumartist',
    'album:ARTISTSORT': 'albumartistsort',
    'album:TITLE': 'album',
    'album:DATE_RECORDED': 'originaldate',
    'album:PART_NUMBER': 'disk',
    'album:TOTAL_PARTS': 'totaltracks',
    'track:ARTIST': 'artist',
    'track:ARTISTSORT': 'artistsort',
    'track:TITLE': 'title',
    'track:PART_NUMBER': 'track',
    'track:MUSICBRAINZ_TRACKID': 'musicbrainz_recordingid',
    'track:MUSICBRAINZ_ALBUMID': 'musicbrainz_albumid',
    'track:MUSICBRAINZ_ARTISTID': 'musicbrainz_artistid',
    'track:PUBLISHER': 'label',
    'track:GENRE': 'genre',
    'track:ENCODER': 'encodedby',
    'track:ENCODER_OPTIONS': 'encodersettings',
    'edition:TOTAL_PARTS': 'totaldiscs',
    picture: 'picture'
};
class MatroskaTagMapper extends CaseInsensitiveTagMap_1.CaseInsensitiveTagMap {
    constructor() {
        super(['matroska'], ebmlTagMap);
    }
}
exports.MatroskaTagMapper = MatroskaTagMapper;
//# sourceMappingURL=MatroskaTagMapper.js.map

/***/ }),
/* 54 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiffTagMapper = void 0;
const GenericTagMapper_1 = __webpack_require__(43);
/**
 * ID3v1 tag mappings
 */
const tagMap = {
    NAME: 'title',
    AUTH: 'artist',
    '(c) ': 'copyright',
    ANNO: 'comment'
};
class AiffTagMapper extends GenericTagMapper_1.CommonTagMapper {
    constructor() {
        super(['AIFF'], tagMap);
    }
}
exports.AiffTagMapper = AiffTagMapper;
//# sourceMappingURL=AiffTagMap.js.map

/***/ }),
/* 55 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AIFFParser = void 0;
const Token = __webpack_require__(21);
const debug_1 = __webpack_require__(27);
const strtok3 = __webpack_require__(9);
const ID3v2Parser_1 = __webpack_require__(56);
const FourCC_1 = __webpack_require__(63);
const BasicParser_1 = __webpack_require__(60);
const AiffToken = __webpack_require__(64);
const iff = __webpack_require__(65);
const debug = (0, debug_1.default)('music-metadata:parser:aiff');
const compressionTypes = {
    NONE: 'not compressed	PCM	Apple Computer',
    sowt: 'PCM (byte swapped)',
    fl32: '32-bit floating point IEEE 32-bit float',
    fl64: '64-bit floating point IEEE 64-bit float	Apple Computer',
    alaw: 'ALaw 2:1	8-bit ITU-T G.711 A-law',
    ulaw: 'µLaw 2:1	8-bit ITU-T G.711 µ-law	Apple Computer',
    ULAW: 'CCITT G.711 u-law 8-bit ITU-T G.711 µ-law',
    ALAW: 'CCITT G.711 A-law 8-bit ITU-T G.711 A-law',
    FL32: 'Float 32	IEEE 32-bit float '
};
/**
 * AIFF - Audio Interchange File Format
 *
 * Ref:
 * - http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html
 * - http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Docs/AIFF-1.3.pdf
 */
class AIFFParser extends BasicParser_1.BasicParser {
    async parse() {
        const header = await this.tokenizer.readToken(iff.Header);
        if (header.chunkID !== 'FORM')
            throw new Error('Invalid Chunk-ID, expected \'FORM\''); // Not AIFF format
        const type = await this.tokenizer.readToken(FourCC_1.FourCcToken);
        switch (type) {
            case 'AIFF':
                this.metadata.setFormat('container', type);
                this.isCompressed = false;
                break;
            case 'AIFC':
                this.metadata.setFormat('container', 'AIFF-C');
                this.isCompressed = true;
                break;
            default:
                throw Error('Unsupported AIFF type: ' + type);
        }
        this.metadata.setFormat('lossless', !this.isCompressed);
        try {
            while (!this.tokenizer.fileInfo.size || this.tokenizer.fileInfo.size - this.tokenizer.position >= iff.Header.len) {
                debug('Reading AIFF chunk at offset=' + this.tokenizer.position);
                const chunkHeader = await this.tokenizer.readToken(iff.Header);
                const nextChunk = 2 * Math.round(chunkHeader.chunkSize / 2);
                const bytesRead = await this.readData(chunkHeader);
                await this.tokenizer.ignore(nextChunk - bytesRead);
            }
        }
        catch (err) {
            if (err instanceof strtok3.EndOfStreamError) {
                debug(`End-of-stream`);
            }
            else {
                throw err;
            }
        }
    }
    async readData(header) {
        var _a;
        switch (header.chunkID) {
            case 'COMM': // The Common Chunk
                const common = await this.tokenizer.readToken(new AiffToken.Common(header, this.isCompressed));
                this.metadata.setFormat('bitsPerSample', common.sampleSize);
                this.metadata.setFormat('sampleRate', common.sampleRate);
                this.metadata.setFormat('numberOfChannels', common.numChannels);
                this.metadata.setFormat('numberOfSamples', common.numSampleFrames);
                this.metadata.setFormat('duration', common.numSampleFrames / common.sampleRate);
                this.metadata.setFormat('codec', (_a = common.compressionName) !== null && _a !== void 0 ? _a : compressionTypes[common.compressionType]);
                return header.chunkSize;
            case 'ID3 ': // ID3-meta-data
                const id3_data = await this.tokenizer.readToken(new Token.Uint8ArrayType(header.chunkSize));
                const rst = strtok3.fromBuffer(id3_data);
                await new ID3v2Parser_1.ID3v2Parser().parse(this.metadata, rst, this.options);
                return header.chunkSize;
            case 'SSND': // Sound Data Chunk
                if (this.metadata.format.duration) {
                    this.metadata.setFormat('bitrate', 8 * header.chunkSize / this.metadata.format.duration);
                }
                return 0;
            case 'NAME': // Sample name chunk
            case 'AUTH': // Author chunk
            case '(c) ': // Copyright chunk
            case 'ANNO': // Annotation chunk
                return this.readTextChunk(header);
            default:
                debug(`Ignore chunk id=${header.chunkID}, size=${header.chunkSize}`);
                return 0;
        }
    }
    async readTextChunk(header) {
        const value = await this.tokenizer.readToken(new Token.StringType(header.chunkSize, 'ascii'));
        value.split('\0').map(v => v.trim()).filter(v => v && v.length > 0).forEach(v => {
            this.metadata.addTag('AIFF', header.chunkID, v.trim());
        });
        return header.chunkSize;
    }
}
exports.AIFFParser = AIFFParser;


/***/ }),
/* 56 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ID3v2Parser = void 0;
const Token = __webpack_require__(21);
const util = __webpack_require__(46);
const FrameParser_1 = __webpack_require__(57);
const ID3v2Token_1 = __webpack_require__(58);
class ID3v2Parser {
    static removeUnsyncBytes(buffer) {
        let readI = 0;
        let writeI = 0;
        while (readI < buffer.length - 1) {
            if (readI !== writeI) {
                buffer[writeI] = buffer[readI];
            }
            readI += (buffer[readI] === 0xFF && buffer[readI + 1] === 0) ? 2 : 1;
            writeI++;
        }
        if (readI < buffer.length) {
            buffer[writeI++] = buffer[readI];
        }
        return buffer.slice(0, writeI);
    }
    static getFrameHeaderLength(majorVer) {
        switch (majorVer) {
            case 2:
                return 6;
            case 3:
            case 4:
                return 10;
            default:
                throw new Error('header versionIndex is incorrect');
        }
    }
    static readFrameFlags(b) {
        return {
            status: {
                tag_alter_preservation: util.getBit(b, 0, 6),
                file_alter_preservation: util.getBit(b, 0, 5),
                read_only: util.getBit(b, 0, 4)
            },
            format: {
                grouping_identity: util.getBit(b, 1, 7),
                compression: util.getBit(b, 1, 3),
                encryption: util.getBit(b, 1, 2),
                unsynchronisation: util.getBit(b, 1, 1),
                data_length_indicator: util.getBit(b, 1, 0)
            }
        };
    }
    static readFrameData(uint8Array, frameHeader, majorVer, includeCovers, warningCollector) {
        const frameParser = new FrameParser_1.FrameParser(majorVer, warningCollector);
        switch (majorVer) {
            case 2:
                return frameParser.readData(uint8Array, frameHeader.id, includeCovers);
            case 3:
            case 4:
                if (frameHeader.flags.format.unsynchronisation) {
                    uint8Array = ID3v2Parser.removeUnsyncBytes(uint8Array);
                }
                if (frameHeader.flags.format.data_length_indicator) {
                    uint8Array = uint8Array.slice(4, uint8Array.length);
                }
                return frameParser.readData(uint8Array, frameHeader.id, includeCovers);
            default:
                throw new Error('Unexpected majorVer: ' + majorVer);
        }
    }
    /**
     * Create a combined tag key, of tag & description
     * @param tag e.g.: COM
     * @param description e.g. iTunPGAP
     * @returns string e.g. COM:iTunPGAP
     */
    static makeDescriptionTagName(tag, description) {
        return tag + (description ? ':' + description : '');
    }
    async parse(metadata, tokenizer, options) {
        this.tokenizer = tokenizer;
        this.metadata = metadata;
        this.options = options;
        const id3Header = await this.tokenizer.readToken(ID3v2Token_1.ID3v2Header);
        if (id3Header.fileIdentifier !== 'ID3') {
            throw new Error('expected ID3-header file-identifier \'ID3\' was not found');
        }
        this.id3Header = id3Header;
        this.headerType = ('ID3v2.' + id3Header.version.major);
        return id3Header.flags.isExtendedHeader ? this.parseExtendedHeader() : this.parseId3Data(id3Header.size);
    }
    async parseExtendedHeader() {
        const extendedHeader = await this.tokenizer.readToken(ID3v2Token_1.ExtendedHeader);
        const dataRemaining = extendedHeader.size - ID3v2Token_1.ExtendedHeader.len;
        return dataRemaining > 0 ? this.parseExtendedHeaderData(dataRemaining, extendedHeader.size) : this.parseId3Data(this.id3Header.size - extendedHeader.size);
    }
    async parseExtendedHeaderData(dataRemaining, extendedHeaderSize) {
        await this.tokenizer.ignore(dataRemaining);
        return this.parseId3Data(this.id3Header.size - extendedHeaderSize);
    }
    async parseId3Data(dataLen) {
        const uint8Array = await this.tokenizer.readToken(new Token.Uint8ArrayType(dataLen));
        for (const tag of this.parseMetadata(uint8Array)) {
            if (tag.id === 'TXXX') {
                if (tag.value) {
                    for (const text of tag.value.text) {
                        this.addTag(ID3v2Parser.makeDescriptionTagName(tag.id, tag.value.description), text);
                    }
                }
            }
            else if (tag.id === 'COM') {
                for (const value of tag.value) {
                    this.addTag(ID3v2Parser.makeDescriptionTagName(tag.id, value.description), value.text);
                }
            }
            else if (tag.id === 'COMM') {
                for (const value of tag.value) {
                    this.addTag(ID3v2Parser.makeDescriptionTagName(tag.id, value.description), value);
                }
            }
            else if (Array.isArray(tag.value)) {
                for (const value of tag.value) {
                    this.addTag(tag.id, value);
                }
            }
            else {
                this.addTag(tag.id, tag.value);
            }
        }
    }
    addTag(id, value) {
        this.metadata.addTag(this.headerType, id, value);
    }
    parseMetadata(data) {
        let offset = 0;
        const tags = [];
        while (true) {
            if (offset === data.length)
                break;
            const frameHeaderLength = ID3v2Parser.getFrameHeaderLength(this.id3Header.version.major);
            if (offset + frameHeaderLength > data.length) {
                this.metadata.addWarning('Illegal ID3v2 tag length');
                break;
            }
            const frameHeaderBytes = data.slice(offset, offset += frameHeaderLength);
            const frameHeader = this.readFrameHeader(frameHeaderBytes, this.id3Header.version.major);
            const frameDataBytes = data.slice(offset, offset += frameHeader.length);
            const values = ID3v2Parser.readFrameData(frameDataBytes, frameHeader, this.id3Header.version.major, !this.options.skipCovers, this.metadata);
            if (values) {
                tags.push({ id: frameHeader.id, value: values });
            }
        }
        return tags;
    }
    readFrameHeader(uint8Array, majorVer) {
        let header;
        switch (majorVer) {
            case 2:
                header = {
                    id: Buffer.from(uint8Array.slice(0, 3)).toString('ascii'),
                    length: Token.UINT24_BE.get(uint8Array, 3)
                };
                if (!header.id.match(/[A-Z0-9]{3}/g)) {
                    this.metadata.addWarning(`Invalid ID3v2.${this.id3Header.version.major} frame-header-ID: ${header.id}`);
                }
                break;
            case 3:
            case 4:
                header = {
                    id: Buffer.from(uint8Array.slice(0, 4)).toString('ascii'),
                    length: (majorVer === 4 ? ID3v2Token_1.UINT32SYNCSAFE : Token.UINT32_BE).get(uint8Array, 4),
                    flags: ID3v2Parser.readFrameFlags(uint8Array.slice(8, 10))
                };
                if (!header.id.match(/[A-Z0-9]{4}/g)) {
                    this.metadata.addWarning(`Invalid ID3v2.${this.id3Header.version.major} frame-header-ID: ${header.id}`);
                }
                break;
            default:
                throw new Error('Unexpected majorVer: ' + majorVer);
        }
        return header;
    }
}
exports.ID3v2Parser = ID3v2Parser;


/***/ }),
/* 57 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FrameParser = exports.parseGenre = void 0;
const debug_1 = __webpack_require__(27);
const Token = __webpack_require__(21);
const util = __webpack_require__(46);
const ID3v2Token_1 = __webpack_require__(58);
const ID3v1Parser_1 = __webpack_require__(59);
const debug = (0, debug_1.default)('music-metadata:id3v2:frame-parser');
const defaultEnc = 'latin1'; // latin1 == iso-8859-1;
function parseGenre(origVal) {
    // match everything inside parentheses
    const genres = [];
    let code;
    let word = '';
    for (const c of origVal) {
        if (typeof code === 'string') {
            if (c === '(' && code === '') {
                word += '(';
                code = undefined;
            }
            else if (c === ')') {
                if (word !== '') {
                    genres.push(word);
                    word = '';
                }
                const genre = parseGenreCode(code);
                if (genre) {
                    genres.push(genre);
                }
                code = undefined;
            }
            else
                code += c;
        }
        else if (c === '(') {
            code = '';
        }
        else {
            word += c;
        }
    }
    if (word) {
        if (genres.length === 0 && word.match(/^\d*$/)) {
            word = ID3v1Parser_1.Genres[word];
        }
        genres.push(word);
    }
    return genres;
}
exports.parseGenre = parseGenre;
function parseGenreCode(code) {
    if (code === 'RX')
        return 'Remix';
    if (code === 'CR')
        return 'Cover';
    if (code.match(/^\d*$/)) {
        return ID3v1Parser_1.Genres[code];
    }
}
class FrameParser {
    /**
     * Create id3v2 frame parser
     * @param major - Major version, e.g. (4) for  id3v2.4
     * @param warningCollector - Used to collect decode issue
     */
    constructor(major, warningCollector) {
        this.major = major;
        this.warningCollector = warningCollector;
    }
    readData(uint8Array, type, includeCovers) {
        if (uint8Array.length === 0) {
            this.warningCollector.addWarning(`id3v2.${this.major} header has empty tag type=${type}`);
            return;
        }
        const { encoding, bom } = ID3v2Token_1.TextEncodingToken.get(uint8Array, 0);
        const length = uint8Array.length;
        let offset = 0;
        let output = []; // ToDo
        const nullTerminatorLength = FrameParser.getNullTerminatorLength(encoding);
        let fzero;
        const out = {};
        debug(`Parsing tag type=${type}, encoding=${encoding}, bom=${bom}`);
        switch (type !== 'TXXX' && type[0] === 'T' ? 'T*' : type) {
            case 'T*': // 4.2.1. Text information frames - details
            case 'IPLS': // v2.3: Involved people list
            case 'MVIN':
            case 'MVNM':
            case 'PCS':
            case 'PCST':
                let text;
                try {
                    text = util.decodeString(uint8Array.slice(1), encoding).replace(/\x00+$/, '');
                }
                catch (error) {
                    this.warningCollector.addWarning(`id3v2.${this.major} type=${type} header has invalid string value: ${error.message}`);
                }
                switch (type) {
                    case 'TMCL': // Musician credits list
                    case 'TIPL': // Involved people list
                    case 'IPLS': // Involved people list
                        output = this.splitValue(type, text);
                        output = FrameParser.functionList(output);
                        break;
                    case 'TRK':
                    case 'TRCK':
                    case 'TPOS':
                        output = text;
                        break;
                    case 'TCOM':
                    case 'TEXT':
                    case 'TOLY':
                    case 'TOPE':
                    case 'TPE1':
                    case 'TSRC':
                        // id3v2.3 defines that TCOM, TEXT, TOLY, TOPE & TPE1 values are separated by /
                        output = this.splitValue(type, text);
                        break;
                    case 'TCO':
                    case 'TCON':
                        output = this.splitValue(type, text).map(v => parseGenre(v)).reduce((acc, val) => acc.concat(val), []);
                        break;
                    case 'PCS':
                    case 'PCST':
                        // TODO: Why `default` not results `1` but `''`?
                        output = this.major >= 4 ? this.splitValue(type, text) : [text];
                        output = (Array.isArray(output) && output[0] === '') ? 1 : 0;
                        break;
                    default:
                        output = this.major >= 4 ? this.splitValue(type, text) : [text];
                }
                break;
            case 'TXXX':
                output = FrameParser.readIdentifierAndData(uint8Array, offset + 1, length, encoding);
                output = {
                    description: output.id,
                    text: this.splitValue(type, util.decodeString(output.data, encoding).replace(/\x00+$/, ''))
                };
                break;
            case 'PIC':
            case 'APIC':
                if (includeCovers) {
                    const pic = {};
                    offset += 1;
                    switch (this.major) {
                        case 2:
                            pic.format = util.decodeString(uint8Array.slice(offset, offset + 3), 'latin1'); // 'latin1'; // latin1 == iso-8859-1;
                            offset += 3;
                            break;
                        case 3:
                        case 4:
                            fzero = util.findZero(uint8Array, offset, length, defaultEnc);
                            pic.format = util.decodeString(uint8Array.slice(offset, fzero), defaultEnc);
                            offset = fzero + 1;
                            break;
                        default:
                            throw new Error('Warning: unexpected major versionIndex: ' + this.major);
                    }
                    pic.format = FrameParser.fixPictureMimeType(pic.format);
                    pic.type = ID3v2Token_1.AttachedPictureType[uint8Array[offset]];
                    offset += 1;
                    fzero = util.findZero(uint8Array, offset, length, encoding);
                    pic.description = util.decodeString(uint8Array.slice(offset, fzero), encoding);
                    offset = fzero + nullTerminatorLength;
                    pic.data = Buffer.from(uint8Array.slice(offset, length));
                    output = pic;
                }
                break;
            case 'CNT':
            case 'PCNT':
                output = Token.UINT32_BE.get(uint8Array, 0);
                break;
            case 'SYLT':
                // skip text encoding (1 byte),
                //      language (3 bytes),
                //      time stamp format (1 byte),
                //      content tagTypes (1 byte),
                //      content descriptor (1 byte)
                offset += 7;
                output = [];
                while (offset < length) {
                    const txt = uint8Array.slice(offset, offset = util.findZero(uint8Array, offset, length, encoding));
                    offset += 5; // push offset forward one +  4 byte timestamp
                    output.push(util.decodeString(txt, encoding));
                }
                break;
            case 'ULT':
            case 'USLT':
            case 'COM':
            case 'COMM':
                offset += 1;
                out.language = util.decodeString(uint8Array.slice(offset, offset + 3), defaultEnc);
                offset += 3;
                fzero = util.findZero(uint8Array, offset, length, encoding);
                out.description = util.decodeString(uint8Array.slice(offset, fzero), encoding);
                offset = fzero + nullTerminatorLength;
                out.text = util.decodeString(uint8Array.slice(offset, length), encoding).replace(/\x00+$/, '');
                output = [out];
                break;
            case 'UFID':
                output = FrameParser.readIdentifierAndData(uint8Array, offset, length, defaultEnc);
                output = { owner_identifier: output.id, identifier: output.data };
                break;
            case 'PRIV': // private frame
                output = FrameParser.readIdentifierAndData(uint8Array, offset, length, defaultEnc);
                output = { owner_identifier: output.id, data: output.data };
                break;
            case 'POPM': // Popularimeter
                fzero = util.findZero(uint8Array, offset, length, defaultEnc);
                const email = util.decodeString(uint8Array.slice(offset, fzero), defaultEnc);
                offset = fzero + 1;
                const dataLen = length - offset;
                output = {
                    email,
                    rating: Token.UINT8.get(uint8Array, offset),
                    counter: dataLen >= 5 ? Token.UINT32_BE.get(uint8Array, offset + 1) : undefined
                };
                break;
            case 'GEOB': { // General encapsulated object
                fzero = util.findZero(uint8Array, offset + 1, length, encoding);
                const mimeType = util.decodeString(uint8Array.slice(offset + 1, fzero), defaultEnc);
                offset = fzero + 1;
                fzero = util.findZero(uint8Array, offset, length - offset, encoding);
                const filename = util.decodeString(uint8Array.slice(offset, fzero), defaultEnc);
                offset = fzero + 1;
                fzero = util.findZero(uint8Array, offset, length - offset, encoding);
                const description = util.decodeString(uint8Array.slice(offset, fzero), defaultEnc);
                output = {
                    type: mimeType,
                    filename,
                    description,
                    data: uint8Array.slice(offset + 1, length)
                };
                break;
            }
            // W-Frames:
            case 'WCOM':
            case 'WCOP':
            case 'WOAF':
            case 'WOAR':
            case 'WOAS':
            case 'WORS':
            case 'WPAY':
            case 'WPUB':
                // Decode URL
                output = util.decodeString(uint8Array.slice(offset, fzero), defaultEnc);
                break;
            case 'WXXX': {
                // Decode URL
                fzero = util.findZero(uint8Array, offset + 1, length, encoding);
                const description = util.decodeString(uint8Array.slice(offset + 1, fzero), encoding);
                offset = fzero + (encoding === 'utf16le' ? 2 : 1);
                output = { description, url: util.decodeString(uint8Array.slice(offset, length), defaultEnc) };
                break;
            }
            case 'WFD':
            case 'WFED':
                output = util.decodeString(uint8Array.slice(offset + 1, util.findZero(uint8Array, offset + 1, length, encoding)), encoding);
                break;
            case 'MCDI': {
                // Music CD identifier
                output = uint8Array.slice(0, length);
                break;
            }
            default:
                debug('Warning: unsupported id3v2-tag-type: ' + type);
                break;
        }
        return output;
    }
    static fixPictureMimeType(pictureType) {
        pictureType = pictureType.toLocaleLowerCase();
        switch (pictureType) {
            case 'jpg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
        }
        return pictureType;
    }
    /**
     * Converts TMCL (Musician credits list) or TIPL (Involved people list)
     * @param entries
     */
    static functionList(entries) {
        const res = {};
        for (let i = 0; i + 1 < entries.length; i += 2) {
            const names = entries[i + 1].split(',');
            res[entries[i]] = res.hasOwnProperty(entries[i]) ? res[entries[i]].concat(names) : names;
        }
        return res;
    }
    /**
     * id3v2.4 defines that multiple T* values are separated by 0x00
     * id3v2.3 defines that TCOM, TEXT, TOLY, TOPE & TPE1 values are separated by /
     * @param tag - Tag name
     * @param text - Concatenated tag value
     * @returns Split tag value
     */
    splitValue(tag, text) {
        let values;
        if (this.major < 4) {
            values = text.split(/\x00/g);
            if (values.length > 1) {
                this.warningCollector.addWarning(`ID3v2.${this.major} ${tag} uses non standard null-separator.`);
            }
            else {
                values = text.split(/\//g);
            }
        }
        else {
            values = text.split(/\x00/g);
        }
        return FrameParser.trimArray(values);
    }
    static trimArray(values) {
        return values.map(value => value.replace(/\x00+$/, '').trim());
    }
    static readIdentifierAndData(uint8Array, offset, length, encoding) {
        const fzero = util.findZero(uint8Array, offset, length, encoding);
        const id = util.decodeString(uint8Array.slice(offset, fzero), encoding);
        offset = fzero + FrameParser.getNullTerminatorLength(encoding);
        return { id, data: uint8Array.slice(offset, length) };
    }
    static getNullTerminatorLength(enc) {
        return enc === 'utf16le' ? 2 : 1;
    }
}
exports.FrameParser = FrameParser;


/***/ }),
/* 58 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TextEncodingToken = exports.ExtendedHeader = exports.ID3v2Header = exports.UINT32SYNCSAFE = exports.AttachedPictureType = void 0;
const Token = __webpack_require__(21);
const util = __webpack_require__(46);
/**
 * The picture type according to the ID3v2 APIC frame
 * Ref: http://id3.org/id3v2.3.0#Attached_picture
 */
var AttachedPictureType;
(function (AttachedPictureType) {
    AttachedPictureType[AttachedPictureType["Other"] = 0] = "Other";
    AttachedPictureType[AttachedPictureType["32x32 pixels 'file icon' (PNG only)"] = 1] = "32x32 pixels 'file icon' (PNG only)";
    AttachedPictureType[AttachedPictureType["Other file icon"] = 2] = "Other file icon";
    AttachedPictureType[AttachedPictureType["Cover (front)"] = 3] = "Cover (front)";
    AttachedPictureType[AttachedPictureType["Cover (back)"] = 4] = "Cover (back)";
    AttachedPictureType[AttachedPictureType["Leaflet page"] = 5] = "Leaflet page";
    AttachedPictureType[AttachedPictureType["Media (e.g. label side of CD)"] = 6] = "Media (e.g. label side of CD)";
    AttachedPictureType[AttachedPictureType["Lead artist/lead performer/soloist"] = 7] = "Lead artist/lead performer/soloist";
    AttachedPictureType[AttachedPictureType["Artist/performer"] = 8] = "Artist/performer";
    AttachedPictureType[AttachedPictureType["Conductor"] = 9] = "Conductor";
    AttachedPictureType[AttachedPictureType["Band/Orchestra"] = 10] = "Band/Orchestra";
    AttachedPictureType[AttachedPictureType["Composer"] = 11] = "Composer";
    AttachedPictureType[AttachedPictureType["Lyricist/text writer"] = 12] = "Lyricist/text writer";
    AttachedPictureType[AttachedPictureType["Recording Location"] = 13] = "Recording Location";
    AttachedPictureType[AttachedPictureType["During recording"] = 14] = "During recording";
    AttachedPictureType[AttachedPictureType["During performance"] = 15] = "During performance";
    AttachedPictureType[AttachedPictureType["Movie/video screen capture"] = 16] = "Movie/video screen capture";
    AttachedPictureType[AttachedPictureType["A bright coloured fish"] = 17] = "A bright coloured fish";
    AttachedPictureType[AttachedPictureType["Illustration"] = 18] = "Illustration";
    AttachedPictureType[AttachedPictureType["Band/artist logotype"] = 19] = "Band/artist logotype";
    AttachedPictureType[AttachedPictureType["Publisher/Studio logotype"] = 20] = "Publisher/Studio logotype";
})(AttachedPictureType = exports.AttachedPictureType || (exports.AttachedPictureType = {}));
/**
 * 28 bits (representing up to 256MB) integer, the msb is 0 to avoid 'false syncsignals'.
 * 4 * %0xxxxxxx
 */
exports.UINT32SYNCSAFE = {
    get: (buf, off) => {
        return buf[off + 3] & 0x7f | ((buf[off + 2]) << 7) |
            ((buf[off + 1]) << 14) | ((buf[off]) << 21);
    },
    len: 4
};
/**
 * ID3v2 header
 * Ref: http://id3.org/id3v2.3.0#ID3v2_header
 * ToDo
 */
exports.ID3v2Header = {
    len: 10,
    get: (buf, off) => {
        return {
            // ID3v2/file identifier   "ID3"
            fileIdentifier: new Token.StringType(3, 'ascii').get(buf, off),
            // ID3v2 versionIndex
            version: {
                major: Token.INT8.get(buf, off + 3),
                revision: Token.INT8.get(buf, off + 4)
            },
            // ID3v2 flags
            flags: {
                // Unsynchronisation
                unsynchronisation: util.getBit(buf, off + 5, 7),
                // Extended header
                isExtendedHeader: util.getBit(buf, off + 5, 6),
                // Experimental indicator
                expIndicator: util.getBit(buf, off + 5, 5),
                footer: util.getBit(buf, off + 5, 4)
            },
            size: exports.UINT32SYNCSAFE.get(buf, off + 6)
        };
    }
};
exports.ExtendedHeader = {
    len: 10,
    get: (buf, off) => {
        return {
            // Extended header size
            size: Token.UINT32_BE.get(buf, off),
            // Extended Flags
            extendedFlags: Token.UINT16_BE.get(buf, off + 4),
            // Size of padding
            sizeOfPadding: Token.UINT32_BE.get(buf, off + 6),
            // CRC data present
            crcDataPresent: util.getBit(buf, off + 4, 31)
        };
    }
};
exports.TextEncodingToken = {
    len: 1,
    get: (uint8Array, off) => {
        switch (uint8Array[off]) {
            case 0x00:
                return { encoding: 'latin1' }; // binary
            case 0x01:
                return { encoding: 'utf16le', bom: true };
            case 0x02:
                return { encoding: 'utf16le', bom: false };
            case 0x03:
                return { encoding: 'utf8', bom: false };
            default:
                return { encoding: 'utf8', bom: false };
        }
    }
};


/***/ }),
/* 59 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.hasID3v1Header = exports.ID3v1Parser = exports.Genres = void 0;
const debug_1 = __webpack_require__(27);
const token_types_1 = __webpack_require__(21);
const util = __webpack_require__(46);
const BasicParser_1 = __webpack_require__(60);
const APEv2Parser_1 = __webpack_require__(61);
const debug = (0, debug_1.default)('music-metadata:parser:ID3v1');
/**
 * ID3v1 Genre mappings
 * Ref: https://de.wikipedia.org/wiki/Liste_der_ID3v1-Genres
 */
exports.Genres = [
    'Blues', 'Classic Rock', 'Country', 'Dance', 'Disco', 'Funk', 'Grunge', 'Hip-Hop',
    'Jazz', 'Metal', 'New Age', 'Oldies', 'Other', 'Pop', 'R&B', 'Rap', 'Reggae', 'Rock',
    'Techno', 'Industrial', 'Alternative', 'Ska', 'Death Metal', 'Pranks', 'Soundtrack',
    'Euro-Techno', 'Ambient', 'Trip-Hop', 'Vocal', 'Jazz+Funk', 'Fusion', 'Trance',
    'Classical', 'Instrumental', 'Acid', 'House', 'Game', 'Sound Clip', 'Gospel', 'Noise',
    'Alt. Rock', 'Bass', 'Soul', 'Punk', 'Space', 'Meditative', 'Instrumental Pop',
    'Instrumental Rock', 'Ethnic', 'Gothic', 'Darkwave', 'Techno-Industrial',
    'Electronic', 'Pop-Folk', 'Eurodance', 'Dream', 'Southern Rock', 'Comedy', 'Cult',
    'Gangsta Rap', 'Top 40', 'Christian Rap', 'Pop/Funk', 'Jungle', 'Native American',
    'Cabaret', 'New Wave', 'Psychedelic', 'Rave', 'Showtunes', 'Trailer', 'Lo-Fi', 'Tribal',
    'Acid Punk', 'Acid Jazz', 'Polka', 'Retro', 'Musical', 'Rock & Roll', 'Hard Rock',
    'Folk', 'Folk/Rock', 'National Folk', 'Swing', 'Fast-Fusion', 'Bebob', 'Latin', 'Revival',
    'Celtic', 'Bluegrass', 'Avantgarde', 'Gothic Rock', 'Progressive Rock', 'Psychedelic Rock',
    'Symphonic Rock', 'Slow Rock', 'Big Band', 'Chorus', 'Easy Listening', 'Acoustic', 'Humour',
    'Speech', 'Chanson', 'Opera', 'Chamber Music', 'Sonata', 'Symphony', 'Booty Bass', 'Primus',
    'Porn Groove', 'Satire', 'Slow Jam', 'Club', 'Tango', 'Samba', 'Folklore',
    'Ballad', 'Power Ballad', 'Rhythmic Soul', 'Freestyle', 'Duet', 'Punk Rock', 'Drum Solo',
    'A Cappella', 'Euro-House', 'Dance Hall', 'Goa', 'Drum & Bass', 'Club-House',
    'Hardcore', 'Terror', 'Indie', 'BritPop', 'Negerpunk', 'Polsk Punk', 'Beat',
    'Christian Gangsta Rap', 'Heavy Metal', 'Black Metal', 'Crossover', 'Contemporary Christian',
    'Christian Rock', 'Merengue', 'Salsa', 'Thrash Metal', 'Anime', 'JPop', 'Synthpop',
    'Abstract', 'Art Rock', 'Baroque', 'Bhangra', 'Big Beat', 'Breakbeat', 'Chillout',
    'Downtempo', 'Dub', 'EBM', 'Eclectic', 'Electro', 'Electroclash', 'Emo', 'Experimental',
    'Garage', 'Global', 'IDM', 'Illbient', 'Industro-Goth', 'Jam Band', 'Krautrock',
    'Leftfield', 'Lounge', 'Math Rock', 'New Romantic', 'Nu-Breakz', 'Post-Punk', 'Post-Rock',
    'Psytrance', 'Shoegaze', 'Space Rock', 'Trop Rock', 'World Music', 'Neoclassical', 'Audiobook',
    'Audio Theatre', 'Neue Deutsche Welle', 'Podcast', 'Indie Rock', 'G-Funk', 'Dubstep',
    'Garage Rock', 'Psybient'
];
/**
 * Spec: http://id3.org/ID3v1
 * Wiki: https://en.wikipedia.org/wiki/ID3
 */
const Iid3v1Token = {
    len: 128,
    /**
     * @param buf Buffer possibly holding the 128 bytes ID3v1.1 metadata header
     * @param off Offset in buffer in bytes
     * @returns ID3v1.1 header if first 3 bytes equals 'TAG', otherwise null is returned
     */
    get: (buf, off) => {
        const header = new Id3v1StringType(3).get(buf, off);
        return header === 'TAG' ? {
            header,
            title: new Id3v1StringType(30).get(buf, off + 3),
            artist: new Id3v1StringType(30).get(buf, off + 33),
            album: new Id3v1StringType(30).get(buf, off + 63),
            year: new Id3v1StringType(4).get(buf, off + 93),
            comment: new Id3v1StringType(28).get(buf, off + 97),
            // ID3v1.1 separator for track
            zeroByte: token_types_1.UINT8.get(buf, off + 127),
            // track: ID3v1.1 field added by Michael Mutschler
            track: token_types_1.UINT8.get(buf, off + 126),
            genre: token_types_1.UINT8.get(buf, off + 127)
        } : null;
    }
};
class Id3v1StringType extends token_types_1.StringType {
    constructor(len) {
        super(len, 'binary');
    }
    get(buf, off) {
        let value = super.get(buf, off);
        value = util.trimRightNull(value);
        value = value.trim();
        return value.length > 0 ? value : undefined;
    }
}
class ID3v1Parser extends BasicParser_1.BasicParser {
    static getGenre(genreIndex) {
        if (genreIndex < exports.Genres.length) {
            return exports.Genres[genreIndex];
        }
        return undefined; // ToDO: generate warning
    }
    async parse() {
        if (!this.tokenizer.fileInfo.size) {
            debug('Skip checking for ID3v1 because the file-size is unknown');
            return;
        }
        if (this.options.apeHeader) {
            this.tokenizer.ignore(this.options.apeHeader.offset - this.tokenizer.position);
            const apeParser = new APEv2Parser_1.APEv2Parser();
            apeParser.init(this.metadata, this.tokenizer, this.options);
            await apeParser.parseTags(this.options.apeHeader.footer);
        }
        const offset = this.tokenizer.fileInfo.size - Iid3v1Token.len;
        if (this.tokenizer.position > offset) {
            debug('Already consumed the last 128 bytes');
            return;
        }
        const header = await this.tokenizer.readToken(Iid3v1Token, offset);
        if (header) {
            debug('ID3v1 header found at: pos=%s', this.tokenizer.fileInfo.size - Iid3v1Token.len);
            for (const id of ['title', 'artist', 'album', 'comment', 'track', 'year']) {
                if (header[id] && header[id] !== '')
                    this.addTag(id, header[id]);
            }
            const genre = ID3v1Parser.getGenre(header.genre);
            if (genre)
                this.addTag('genre', genre);
        }
        else {
            debug('ID3v1 header not found at: pos=%s', this.tokenizer.fileInfo.size - Iid3v1Token.len);
        }
    }
    addTag(id, value) {
        this.metadata.addTag('ID3v1', id, value);
    }
}
exports.ID3v1Parser = ID3v1Parser;
async function hasID3v1Header(reader) {
    if (reader.fileSize >= 128) {
        const tag = Buffer.alloc(3);
        await reader.randomRead(tag, 0, tag.length, reader.fileSize - 128);
        return tag.toString('binary') === 'TAG';
    }
    return false;
}
exports.hasID3v1Header = hasID3v1Header;


/***/ }),
/* 60 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BasicParser = void 0;
class BasicParser {
    /**
     * Initialize parser with output (metadata), input (tokenizer) & parsing options (options).
     * @param {INativeMetadataCollector} metadata Output
     * @param {ITokenizer} tokenizer Input
     * @param {IOptions} options Parsing options
     */
    init(metadata, tokenizer, options) {
        this.metadata = metadata;
        this.tokenizer = tokenizer;
        this.options = options;
        return this;
    }
}
exports.BasicParser = BasicParser;


/***/ }),
/* 61 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.APEv2Parser = void 0;
const debug_1 = __webpack_require__(27);
const strtok3 = __webpack_require__(9);
const token_types_1 = __webpack_require__(21);
const util = __webpack_require__(46);
const BasicParser_1 = __webpack_require__(60);
const APEv2Token_1 = __webpack_require__(62);
const debug = (0, debug_1.default)('music-metadata:parser:APEv2');
const tagFormat = 'APEv2';
const preamble = 'APETAGEX';
class APEv2Parser extends BasicParser_1.BasicParser {
    constructor() {
        super(...arguments);
        this.ape = {};
    }
    static tryParseApeHeader(metadata, tokenizer, options) {
        const apeParser = new APEv2Parser();
        apeParser.init(metadata, tokenizer, options);
        return apeParser.tryParseApeHeader();
    }
    /**
     * Calculate the media file duration
     * @param ah ApeHeader
     * @return {number} duration in seconds
     */
    static calculateDuration(ah) {
        let duration = ah.totalFrames > 1 ? ah.blocksPerFrame * (ah.totalFrames - 1) : 0;
        duration += ah.finalFrameBlocks;
        return duration / ah.sampleRate;
    }
    /**
     * Calculates the APEv1 / APEv2 first field offset
     * @param reader
     * @param offset
     */
    static async findApeFooterOffset(reader, offset) {
        // Search for APE footer header at the end of the file
        const apeBuf = Buffer.alloc(APEv2Token_1.TagFooter.len);
        await reader.randomRead(apeBuf, 0, APEv2Token_1.TagFooter.len, offset - APEv2Token_1.TagFooter.len);
        const tagFooter = APEv2Token_1.TagFooter.get(apeBuf, 0);
        if (tagFooter.ID === 'APETAGEX') {
            debug(`APE footer header at offset=${offset}`);
            return { footer: tagFooter, offset: offset - tagFooter.size };
        }
    }
    static parseTagFooter(metadata, buffer, options) {
        const footer = APEv2Token_1.TagFooter.get(buffer, buffer.length - APEv2Token_1.TagFooter.len);
        if (footer.ID !== preamble)
            throw new Error('Unexpected APEv2 Footer ID preamble value.');
        strtok3.fromBuffer(buffer);
        const apeParser = new APEv2Parser();
        apeParser.init(metadata, strtok3.fromBuffer(buffer), options);
        return apeParser.parseTags(footer);
    }
    /**
     * Parse APEv1 / APEv2 header if header signature found
     */
    async tryParseApeHeader() {
        if (this.tokenizer.fileInfo.size && this.tokenizer.fileInfo.size - this.tokenizer.position < APEv2Token_1.TagFooter.len) {
            debug(`No APEv2 header found, end-of-file reached`);
            return;
        }
        const footer = await this.tokenizer.peekToken(APEv2Token_1.TagFooter);
        if (footer.ID === preamble) {
            await this.tokenizer.ignore(APEv2Token_1.TagFooter.len);
            return this.parseTags(footer);
        }
        else {
            debug(`APEv2 header not found at offset=${this.tokenizer.position}`);
            if (this.tokenizer.fileInfo.size) {
                // Try to read the APEv2 header using just the footer-header
                const remaining = this.tokenizer.fileInfo.size - this.tokenizer.position; // ToDo: take ID3v1 into account
                const buffer = Buffer.alloc(remaining);
                await this.tokenizer.readBuffer(buffer);
                return APEv2Parser.parseTagFooter(this.metadata, buffer, this.options);
            }
        }
    }
    async parse() {
        const descriptor = await this.tokenizer.readToken(APEv2Token_1.DescriptorParser);
        if (descriptor.ID !== 'MAC ')
            throw new Error('Unexpected descriptor ID');
        this.ape.descriptor = descriptor;
        const lenExp = descriptor.descriptorBytes - APEv2Token_1.DescriptorParser.len;
        const header = await (lenExp > 0 ? this.parseDescriptorExpansion(lenExp) : this.parseHeader());
        await this.tokenizer.ignore(header.forwardBytes);
        return this.tryParseApeHeader();
    }
    async parseTags(footer) {
        const keyBuffer = Buffer.alloc(256); // maximum tag key length
        let bytesRemaining = footer.size - APEv2Token_1.TagFooter.len;
        debug(`Parse APE tags at offset=${this.tokenizer.position}, size=${bytesRemaining}`);
        for (let i = 0; i < footer.fields; i++) {
            if (bytesRemaining < APEv2Token_1.TagItemHeader.len) {
                this.metadata.addWarning(`APEv2 Tag-header: ${footer.fields - i} items remaining, but no more tag data to read.`);
                break;
            }
            // Only APEv2 tag has tag item headers
            const tagItemHeader = await this.tokenizer.readToken(APEv2Token_1.TagItemHeader);
            bytesRemaining -= APEv2Token_1.TagItemHeader.len + tagItemHeader.size;
            await this.tokenizer.peekBuffer(keyBuffer, { length: Math.min(keyBuffer.length, bytesRemaining) });
            let zero = util.findZero(keyBuffer, 0, keyBuffer.length);
            const key = await this.tokenizer.readToken(new token_types_1.StringType(zero, 'ascii'));
            await this.tokenizer.ignore(1);
            bytesRemaining -= key.length + 1;
            switch (tagItemHeader.flags.dataType) {
                case APEv2Token_1.DataType.text_utf8: { // utf-8 text-string
                    const value = await this.tokenizer.readToken(new token_types_1.StringType(tagItemHeader.size, 'utf8'));
                    const values = value.split(/\x00/g);
                    for (const val of values) {
                        this.metadata.addTag(tagFormat, key, val);
                    }
                    break;
                }
                case APEv2Token_1.DataType.binary: // binary (probably artwork)
                    if (this.options.skipCovers) {
                        await this.tokenizer.ignore(tagItemHeader.size);
                    }
                    else {
                        const picData = Buffer.alloc(tagItemHeader.size);
                        await this.tokenizer.readBuffer(picData);
                        zero = util.findZero(picData, 0, picData.length);
                        const description = picData.toString('utf8', 0, zero);
                        const data = Buffer.from(picData.slice(zero + 1));
                        this.metadata.addTag(tagFormat, key, {
                            description,
                            data
                        });
                    }
                    break;
                case APEv2Token_1.DataType.external_info:
                    debug(`Ignore external info ${key}`);
                    await this.tokenizer.ignore(tagItemHeader.size);
                    break;
                case APEv2Token_1.DataType.reserved:
                    debug(`Ignore external info ${key}`);
                    this.metadata.addWarning(`APEv2 header declares a reserved datatype for "${key}"`);
                    await this.tokenizer.ignore(tagItemHeader.size);
                    break;
            }
        }
    }
    async parseDescriptorExpansion(lenExp) {
        await this.tokenizer.ignore(lenExp);
        return this.parseHeader();
    }
    async parseHeader() {
        const header = await this.tokenizer.readToken(APEv2Token_1.Header);
        // ToDo before
        this.metadata.setFormat('lossless', true);
        this.metadata.setFormat('container', 'Monkey\'s Audio');
        this.metadata.setFormat('bitsPerSample', header.bitsPerSample);
        this.metadata.setFormat('sampleRate', header.sampleRate);
        this.metadata.setFormat('numberOfChannels', header.channel);
        this.metadata.setFormat('duration', APEv2Parser.calculateDuration(header));
        return {
            forwardBytes: this.ape.descriptor.seekTableBytes + this.ape.descriptor.headerDataBytes +
                this.ape.descriptor.apeFrameDataBytes + this.ape.descriptor.terminatingDataBytes
        };
    }
}
exports.APEv2Parser = APEv2Parser;


/***/ }),
/* 62 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isBitSet = exports.parseTagFlags = exports.TagField = exports.TagItemHeader = exports.TagFooter = exports.Header = exports.DescriptorParser = exports.DataType = void 0;
const Token = __webpack_require__(21);
const FourCC_1 = __webpack_require__(63);
var DataType;
(function (DataType) {
    DataType[DataType["text_utf8"] = 0] = "text_utf8";
    DataType[DataType["binary"] = 1] = "binary";
    DataType[DataType["external_info"] = 2] = "external_info";
    DataType[DataType["reserved"] = 3] = "reserved";
})(DataType = exports.DataType || (exports.DataType = {}));
/**
 * APE_DESCRIPTOR: defines the sizes (and offsets) of all the pieces, as well as the MD5 checksum
 */
exports.DescriptorParser = {
    len: 52,
    get: (buf, off) => {
        return {
            // should equal 'MAC '
            ID: FourCC_1.FourCcToken.get(buf, off),
            // versionIndex number * 1000 (3.81 = 3810) (remember that 4-byte alignment causes this to take 4-bytes)
            version: Token.UINT32_LE.get(buf, off + 4) / 1000,
            // the number of descriptor bytes (allows later expansion of this header)
            descriptorBytes: Token.UINT32_LE.get(buf, off + 8),
            // the number of header APE_HEADER bytes
            headerBytes: Token.UINT32_LE.get(buf, off + 12),
            // the number of header APE_HEADER bytes
            seekTableBytes: Token.UINT32_LE.get(buf, off + 16),
            // the number of header data bytes (from original file)
            headerDataBytes: Token.UINT32_LE.get(buf, off + 20),
            // the number of bytes of APE frame data
            apeFrameDataBytes: Token.UINT32_LE.get(buf, off + 24),
            // the high order number of APE frame data bytes
            apeFrameDataBytesHigh: Token.UINT32_LE.get(buf, off + 28),
            // the terminating data of the file (not including tag data)
            terminatingDataBytes: Token.UINT32_LE.get(buf, off + 32),
            // the MD5 hash of the file (see notes for usage... it's a little tricky)
            fileMD5: new Token.Uint8ArrayType(16).get(buf, off + 36)
        };
    }
};
/**
 * APE_HEADER: describes all of the necessary information about the APE file
 */
exports.Header = {
    len: 24,
    get: (buf, off) => {
        return {
            // the compression level (see defines I.E. COMPRESSION_LEVEL_FAST)
            compressionLevel: Token.UINT16_LE.get(buf, off),
            // any format flags (for future use)
            formatFlags: Token.UINT16_LE.get(buf, off + 2),
            // the number of audio blocks in one frame
            blocksPerFrame: Token.UINT32_LE.get(buf, off + 4),
            // the number of audio blocks in the final frame
            finalFrameBlocks: Token.UINT32_LE.get(buf, off + 8),
            // the total number of frames
            totalFrames: Token.UINT32_LE.get(buf, off + 12),
            // the bits per sample (typically 16)
            bitsPerSample: Token.UINT16_LE.get(buf, off + 16),
            // the number of channels (1 or 2)
            channel: Token.UINT16_LE.get(buf, off + 18),
            // the sample rate (typically 44100)
            sampleRate: Token.UINT32_LE.get(buf, off + 20)
        };
    }
};
/**
 * APE Tag Header/Footer Version 2.0
 * TAG: describes all the properties of the file [optional]
 */
exports.TagFooter = {
    len: 32,
    get: (buf, off) => {
        return {
            // should equal 'APETAGEX'
            ID: new Token.StringType(8, 'ascii').get(buf, off),
            // equals CURRENT_APE_TAG_VERSION
            version: Token.UINT32_LE.get(buf, off + 8),
            // the complete size of the tag, including this footer (excludes header)
            size: Token.UINT32_LE.get(buf, off + 12),
            // the number of fields in the tag
            fields: Token.UINT32_LE.get(buf, off + 16),
            // reserved for later use (must be zero),
            flags: parseTagFlags(Token.UINT32_LE.get(buf, off + 20))
        };
    }
};
/**
 * APE Tag v2.0 Item Header
 */
exports.TagItemHeader = {
    len: 8,
    get: (buf, off) => {
        return {
            // Length of assigned value in bytes
            size: Token.UINT32_LE.get(buf, off),
            // reserved for later use (must be zero),
            flags: parseTagFlags(Token.UINT32_LE.get(buf, off + 4))
        };
    }
};
const TagField = footer => {
    return new Token.Uint8ArrayType(footer.size - exports.TagFooter.len);
};
exports.TagField = TagField;
function parseTagFlags(flags) {
    return {
        containsHeader: isBitSet(flags, 31),
        containsFooter: isBitSet(flags, 30),
        isHeader: isBitSet(flags, 31),
        readOnly: isBitSet(flags, 0),
        dataType: (flags & 6) >> 1
    };
}
exports.parseTagFlags = parseTagFlags;
/**
 * @param num {number}
 * @param bit 0 is least significant bit (LSB)
 * @return {boolean} true if bit is 1; otherwise false
 */
function isBitSet(num, bit) {
    return (num & 1 << bit) !== 0;
}
exports.isBitSet = isBitSet;
//# sourceMappingURL=APEv2Token.js.map

/***/ }),
/* 63 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FourCcToken = void 0;
const util = __webpack_require__(46);
const validFourCC = /^[\x21-\x7e©][\x20-\x7e\x00()]{3}/;
/**
 * Token for read FourCC
 * Ref: https://en.wikipedia.org/wiki/FourCC
 */
exports.FourCcToken = {
    len: 4,
    get: (buf, off) => {
        const id = buf.toString('binary', off, off + exports.FourCcToken.len);
        if (!id.match(validFourCC)) {
            throw new Error(`FourCC contains invalid characters: ${util.a2hex(id)} "${id}"`);
        }
        return id;
    },
    put: (buffer, offset, id) => {
        const str = Buffer.from(id, 'binary');
        if (str.length !== 4)
            throw new Error('Invalid length');
        return str.copy(buffer, offset);
    }
};
//# sourceMappingURL=FourCC.js.map

/***/ }),
/* 64 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Common = void 0;
const Token = __webpack_require__(21);
const FourCC_1 = __webpack_require__(63);
class Common {
    constructor(header, isAifc) {
        this.isAifc = isAifc;
        const minimumChunkSize = isAifc ? 22 : 18;
        if (header.chunkSize < minimumChunkSize)
            throw new Error(`COMMON CHUNK size should always be at least ${minimumChunkSize}`);
        this.len = header.chunkSize;
    }
    get(buf, off) {
        // see: https://cycling74.com/forums/aiffs-80-bit-sample-rate-value
        const shift = buf.readUInt16BE(off + 8) - 16398;
        const baseSampleRate = buf.readUInt16BE(off + 8 + 2);
        const res = {
            numChannels: buf.readUInt16BE(off),
            numSampleFrames: buf.readUInt32BE(off + 2),
            sampleSize: buf.readUInt16BE(off + 6),
            sampleRate: shift < 0 ? baseSampleRate >> Math.abs(shift) : baseSampleRate << shift
        };
        if (this.isAifc) {
            res.compressionType = FourCC_1.FourCcToken.get(buf, off + 18);
            if (this.len > 22) {
                const strLen = buf.readInt8(off + 22);
                if (strLen > 0) {
                    const padding = (strLen + 1) % 2;
                    if (23 + strLen + padding === this.len) {
                        res.compressionName = new Token.StringType(strLen, 'binary').get(buf, off + 23);
                    }
                    else {
                        throw new Error('Illegal pstring length');
                    }
                }
                else {
                    res.compressionName = undefined;
                }
            }
        }
        else {
            res.compressionName = 'PCM';
        }
        return res;
    }
}
exports.Common = Common;


/***/ }),
/* 65 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Header = void 0;
const Token = __webpack_require__(21);
const FourCC_1 = __webpack_require__(63);
/**
 * Common AIFF chunk header
 */
exports.Header = {
    len: 8,
    get: (buf, off) => {
        return {
            // Chunk type ID
            chunkID: FourCC_1.FourCcToken.get(buf, off),
            // Chunk size
            chunkSize: Number(BigInt(Token.UINT32_BE.get(buf, off + 4)))
        };
    }
};


/***/ }),
/* 66 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AsfParser = void 0;
const debug_1 = __webpack_require__(27);
const type_1 = __webpack_require__(38);
const GUID_1 = __webpack_require__(67);
const AsfObject = __webpack_require__(68);
const BasicParser_1 = __webpack_require__(60);
const debug = (0, debug_1.default)('music-metadata:parser:ASF');
const headerType = 'asf';
/**
 * Windows Media Metadata Usage Guidelines
 * - Ref: https://msdn.microsoft.com/en-us/library/ms867702.aspx
 *
 * Ref:
 * - https://tools.ietf.org/html/draft-fleischman-asf-01
 * - https://hwiegman.home.xs4all.nl/fileformats/asf/ASF_Specification.pdf
 * - http://drang.s4.xrea.com/program/tips/id3tag/wmp/index.html
 * - https://msdn.microsoft.com/en-us/library/windows/desktop/ee663575(v=vs.85).aspx
 */
class AsfParser extends BasicParser_1.BasicParser {
    async parse() {
        const header = await this.tokenizer.readToken(AsfObject.TopLevelHeaderObjectToken);
        if (!header.objectId.equals(GUID_1.default.HeaderObject)) {
            throw new Error('expected asf header; but was not found; got: ' + header.objectId.str);
        }
        try {
            await this.parseObjectHeader(header.numberOfHeaderObjects);
        }
        catch (err) {
            debug('Error while parsing ASF: %s', err);
        }
    }
    async parseObjectHeader(numberOfObjectHeaders) {
        let tags;
        do {
            // Parse common header of the ASF Object (3.1)
            const header = await this.tokenizer.readToken(AsfObject.HeaderObjectToken);
            // Parse data part of the ASF Object
            debug('header GUID=%s', header.objectId.str);
            switch (header.objectId.str) {
                case AsfObject.FilePropertiesObject.guid.str: // 3.2
                    const fpo = await this.tokenizer.readToken(new AsfObject.FilePropertiesObject(header));
                    this.metadata.setFormat('duration', Number(fpo.playDuration / BigInt(1000)) / 10000 - Number(fpo.preroll) / 1000);
                    this.metadata.setFormat('bitrate', fpo.maximumBitrate);
                    break;
                case AsfObject.StreamPropertiesObject.guid.str: // 3.3
                    const spo = await this.tokenizer.readToken(new AsfObject.StreamPropertiesObject(header));
                    this.metadata.setFormat('container', 'ASF/' + spo.streamType);
                    break;
                case AsfObject.HeaderExtensionObject.guid.str: // 3.4
                    const extHeader = await this.tokenizer.readToken(new AsfObject.HeaderExtensionObject());
                    await this.parseExtensionObject(extHeader.extensionDataSize);
                    break;
                case AsfObject.ContentDescriptionObjectState.guid.str: // 3.10
                    tags = await this.tokenizer.readToken(new AsfObject.ContentDescriptionObjectState(header));
                    this.addTags(tags);
                    break;
                case AsfObject.ExtendedContentDescriptionObjectState.guid.str: // 3.11
                    tags = await this.tokenizer.readToken(new AsfObject.ExtendedContentDescriptionObjectState(header));
                    this.addTags(tags);
                    break;
                case GUID_1.default.CodecListObject.str:
                    const codecs = await AsfObject.readCodecEntries(this.tokenizer);
                    codecs.forEach(codec => {
                        this.metadata.addStreamInfo({
                            type: codec.type.videoCodec ? type_1.TrackType.video : type_1.TrackType.audio,
                            codecName: codec.codecName
                        });
                    });
                    const audioCodecs = codecs.filter(codec => codec.type.audioCodec).map(codec => codec.codecName).join('/');
                    this.metadata.setFormat('codec', audioCodecs);
                    break;
                case GUID_1.default.StreamBitratePropertiesObject.str:
                    // ToDo?
                    await this.tokenizer.ignore(header.objectSize - AsfObject.HeaderObjectToken.len);
                    break;
                case GUID_1.default.PaddingObject.str:
                    // ToDo: register bytes pad
                    debug('Padding: %s bytes', header.objectSize - AsfObject.HeaderObjectToken.len);
                    await this.tokenizer.ignore(header.objectSize - AsfObject.HeaderObjectToken.len);
                    break;
                default:
                    this.metadata.addWarning('Ignore ASF-Object-GUID: ' + header.objectId.str);
                    debug('Ignore ASF-Object-GUID: %s', header.objectId.str);
                    await this.tokenizer.readToken(new AsfObject.IgnoreObjectState(header));
            }
        } while (--numberOfObjectHeaders);
        // done
    }
    addTags(tags) {
        tags.forEach(tag => {
            this.metadata.addTag(headerType, tag.id, tag.value);
        });
    }
    async parseExtensionObject(extensionSize) {
        do {
            // Parse common header of the ASF Object (3.1)
            const header = await this.tokenizer.readToken(AsfObject.HeaderObjectToken);
            const remaining = header.objectSize - AsfObject.HeaderObjectToken.len;
            // Parse data part of the ASF Object
            switch (header.objectId.str) {
                case AsfObject.ExtendedStreamPropertiesObjectState.guid.str: // 4.1
                    // ToDo: extended stream header properties are ignored
                    await this.tokenizer.readToken(new AsfObject.ExtendedStreamPropertiesObjectState(header));
                    break;
                case AsfObject.MetadataObjectState.guid.str: // 4.7
                    const moTags = await this.tokenizer.readToken(new AsfObject.MetadataObjectState(header));
                    this.addTags(moTags);
                    break;
                case AsfObject.MetadataLibraryObjectState.guid.str: // 4.8
                    const mlTags = await this.tokenizer.readToken(new AsfObject.MetadataLibraryObjectState(header));
                    this.addTags(mlTags);
                    break;
                case GUID_1.default.PaddingObject.str:
                    // ToDo: register bytes pad
                    await this.tokenizer.ignore(remaining);
                    break;
                case GUID_1.default.CompatibilityObject.str:
                    this.tokenizer.ignore(remaining);
                    break;
                case GUID_1.default.ASF_Index_Placeholder_Object.str:
                    await this.tokenizer.ignore(remaining);
                    break;
                default:
                    this.metadata.addWarning('Ignore ASF-Object-GUID: ' + header.objectId.str);
                    // console.log("Ignore ASF-Object-GUID: %s", header.objectId.str);
                    await this.tokenizer.readToken(new AsfObject.IgnoreObjectState(header));
                    break;
            }
            extensionSize -= header.objectSize;
        } while (extensionSize > 0);
    }
}
exports.AsfParser = AsfParser;


/***/ }),
/* 67 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Ref:
 * - https://tools.ietf.org/html/draft-fleischman-asf-01, Appendix A: ASF GUIDs
 * - http://drang.s4.xrea.com/program/tips/id3tag/wmp/10_asf_guids.html
 * - http://drang.s4.xrea.com/program/tips/id3tag/wmp/index.html
 * - http://drang.s4.xrea.com/program/tips/id3tag/wmp/10_asf_guids.html
 *
 * ASF File Structure:
 * - https://msdn.microsoft.com/en-us/library/windows/desktop/ee663575(v=vs.85).aspx
 *
 * ASF GUIDs:
 * - http://drang.s4.xrea.com/program/tips/id3tag/wmp/10_asf_guids.html
 * - https://github.com/dji-sdk/FFmpeg/blob/master/libavformat/asf.c
 */
class GUID {
    static fromBin(bin, offset = 0) {
        return new GUID(this.decode(bin, offset));
    }
    /**
     * Decode GUID in format like "B503BF5F-2EA9-CF11-8EE3-00C00C205365"
     * @param objectId Binary GUID
     * @param offset Read offset in bytes, default 0
     * @returns GUID as dashed hexadecimal representation
     */
    static decode(objectId, offset = 0) {
        const guid = objectId.readUInt32LE(offset).toString(16) + "-" +
            objectId.readUInt16LE(offset + 4).toString(16) + "-" +
            objectId.readUInt16LE(offset + 6).toString(16) + "-" +
            objectId.readUInt16BE(offset + 8).toString(16) + "-" +
            objectId.slice(offset + 10, offset + 16).toString('hex');
        return guid.toUpperCase();
    }
    /**
     * Decode stream type
     * @param mediaType Media type GUID
     * @returns Media type
     */
    static decodeMediaType(mediaType) {
        switch (mediaType.str) {
            case GUID.AudioMedia.str: return 'audio';
            case GUID.VideoMedia.str: return 'video';
            case GUID.CommandMedia.str: return 'command';
            case GUID.Degradable_JPEG_Media.str: return 'degradable-jpeg';
            case GUID.FileTransferMedia.str: return 'file-transfer';
            case GUID.BinaryMedia.str: return 'binary';
        }
    }
    /**
     * Encode GUID
     * @param guid GUID like: "B503BF5F-2EA9-CF11-8EE3-00C00C205365"
     * @returns Encoded Binary GUID
     */
    static encode(str) {
        const bin = Buffer.alloc(16);
        bin.writeUInt32LE(parseInt(str.slice(0, 8), 16), 0);
        bin.writeUInt16LE(parseInt(str.slice(9, 13), 16), 4);
        bin.writeUInt16LE(parseInt(str.slice(14, 18), 16), 6);
        Buffer.from(str.slice(19, 23), "hex").copy(bin, 8);
        Buffer.from(str.slice(24), "hex").copy(bin, 10);
        return bin;
    }
    constructor(str) {
        this.str = str;
    }
    equals(guid) {
        return this.str === guid.str;
    }
    toBin() {
        return GUID.encode(this.str);
    }
}
// 10.1 Top-level ASF object GUIDs
GUID.HeaderObject = new GUID("75B22630-668E-11CF-A6D9-00AA0062CE6C");
GUID.DataObject = new GUID("75B22636-668E-11CF-A6D9-00AA0062CE6C");
GUID.SimpleIndexObject = new GUID("33000890-E5B1-11CF-89F4-00A0C90349CB");
GUID.IndexObject = new GUID("D6E229D3-35DA-11D1-9034-00A0C90349BE");
GUID.MediaObjectIndexObject = new GUID("FEB103F8-12AD-4C64-840F-2A1D2F7AD48C");
GUID.TimecodeIndexObject = new GUID("3CB73FD0-0C4A-4803-953D-EDF7B6228F0C");
// 10.2 Header Object GUIDs
GUID.FilePropertiesObject = new GUID("8CABDCA1-A947-11CF-8EE4-00C00C205365");
GUID.StreamPropertiesObject = new GUID("B7DC0791-A9B7-11CF-8EE6-00C00C205365");
GUID.HeaderExtensionObject = new GUID("5FBF03B5-A92E-11CF-8EE3-00C00C205365");
GUID.CodecListObject = new GUID("86D15240-311D-11D0-A3A4-00A0C90348F6");
GUID.ScriptCommandObject = new GUID("1EFB1A30-0B62-11D0-A39B-00A0C90348F6");
GUID.MarkerObject = new GUID("F487CD01-A951-11CF-8EE6-00C00C205365");
GUID.BitrateMutualExclusionObject = new GUID("D6E229DC-35DA-11D1-9034-00A0C90349BE");
GUID.ErrorCorrectionObject = new GUID("75B22635-668E-11CF-A6D9-00AA0062CE6C");
GUID.ContentDescriptionObject = new GUID("75B22633-668E-11CF-A6D9-00AA0062CE6C");
GUID.ExtendedContentDescriptionObject = new GUID("D2D0A440-E307-11D2-97F0-00A0C95EA850");
GUID.ContentBrandingObject = new GUID("2211B3FA-BD23-11D2-B4B7-00A0C955FC6E");
GUID.StreamBitratePropertiesObject = new GUID("7BF875CE-468D-11D1-8D82-006097C9A2B2");
GUID.ContentEncryptionObject = new GUID("2211B3FB-BD23-11D2-B4B7-00A0C955FC6E");
GUID.ExtendedContentEncryptionObject = new GUID("298AE614-2622-4C17-B935-DAE07EE9289C");
GUID.DigitalSignatureObject = new GUID("2211B3FC-BD23-11D2-B4B7-00A0C955FC6E");
GUID.PaddingObject = new GUID("1806D474-CADF-4509-A4BA-9AABCB96AAE8");
// 10.3 Header Extension Object GUIDs
GUID.ExtendedStreamPropertiesObject = new GUID("14E6A5CB-C672-4332-8399-A96952065B5A");
GUID.AdvancedMutualExclusionObject = new GUID("A08649CF-4775-4670-8A16-6E35357566CD");
GUID.GroupMutualExclusionObject = new GUID("D1465A40-5A79-4338-B71B-E36B8FD6C249");
GUID.StreamPrioritizationObject = new GUID("D4FED15B-88D3-454F-81F0-ED5C45999E24");
GUID.BandwidthSharingObject = new GUID("A69609E6-517B-11D2-B6AF-00C04FD908E9");
GUID.LanguageListObject = new GUID("7C4346A9-EFE0-4BFC-B229-393EDE415C85");
GUID.MetadataObject = new GUID("C5F8CBEA-5BAF-4877-8467-AA8C44FA4CCA");
GUID.MetadataLibraryObject = new GUID("44231C94-9498-49D1-A141-1D134E457054");
GUID.IndexParametersObject = new GUID("D6E229DF-35DA-11D1-9034-00A0C90349BE");
GUID.MediaObjectIndexParametersObject = new GUID("6B203BAD-3F11-48E4-ACA8-D7613DE2CFA7");
GUID.TimecodeIndexParametersObject = new GUID("F55E496D-9797-4B5D-8C8B-604DFE9BFB24");
GUID.CompatibilityObject = new GUID("26F18B5D-4584-47EC-9F5F-0E651F0452C9");
GUID.AdvancedContentEncryptionObject = new GUID("43058533-6981-49E6-9B74-AD12CB86D58C");
// 10.4 Stream Properties Object Stream Type GUIDs
GUID.AudioMedia = new GUID("F8699E40-5B4D-11CF-A8FD-00805F5C442B");
GUID.VideoMedia = new GUID("BC19EFC0-5B4D-11CF-A8FD-00805F5C442B");
GUID.CommandMedia = new GUID("59DACFC0-59E6-11D0-A3AC-00A0C90348F6");
GUID.JFIF_Media = new GUID("B61BE100-5B4E-11CF-A8FD-00805F5C442B");
GUID.Degradable_JPEG_Media = new GUID("35907DE0-E415-11CF-A917-00805F5C442B");
GUID.FileTransferMedia = new GUID("91BD222C-F21C-497A-8B6D-5AA86BFC0185");
GUID.BinaryMedia = new GUID("3AFB65E2-47EF-40F2-AC2C-70A90D71D343");
GUID.ASF_Index_Placeholder_Object = new GUID("D9AADE20-7C17-4F9C-BC28-8555DD98E2A2");
exports["default"] = GUID;


/***/ }),
/* 68 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

// ASF Objects
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WmPictureToken = exports.MetadataLibraryObjectState = exports.MetadataObjectState = exports.ExtendedStreamPropertiesObjectState = exports.ExtendedContentDescriptionObjectState = exports.ContentDescriptionObjectState = exports.readCodecEntries = exports.HeaderExtensionObject = exports.StreamPropertiesObject = exports.FilePropertiesObject = exports.IgnoreObjectState = exports.State = exports.HeaderObjectToken = exports.TopLevelHeaderObjectToken = exports.DataType = void 0;
const util = __webpack_require__(46);
const Token = __webpack_require__(21);
const GUID_1 = __webpack_require__(67);
const AsfUtil_1 = __webpack_require__(69);
const ID3v2Token_1 = __webpack_require__(58);
/**
 * Data Type: Specifies the type of information being stored. The following values are recognized.
 */
var DataType;
(function (DataType) {
    /**
     * Unicode string. The data consists of a sequence of Unicode characters.
     */
    DataType[DataType["UnicodeString"] = 0] = "UnicodeString";
    /**
     * BYTE array. The type of data is implementation-specific.
     */
    DataType[DataType["ByteArray"] = 1] = "ByteArray";
    /**
     * BOOL. The data is 2 bytes long and should be interpreted as a 16-bit unsigned integer. Only 0x0000 or 0x0001 are permitted values.
     */
    DataType[DataType["Bool"] = 2] = "Bool";
    /**
     * DWORD. The data is 4 bytes long and should be interpreted as a 32-bit unsigned integer.
     */
    DataType[DataType["DWord"] = 3] = "DWord";
    /**
     * QWORD. The data is 8 bytes long and should be interpreted as a 64-bit unsigned integer.
     */
    DataType[DataType["QWord"] = 4] = "QWord";
    /**
     * WORD. The data is 2 bytes long and should be interpreted as a 16-bit unsigned integer.
     */
    DataType[DataType["Word"] = 5] = "Word";
})(DataType = exports.DataType || (exports.DataType = {}));
/**
 * Token for: 3. ASF top-level Header Object
 * Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3
 */
exports.TopLevelHeaderObjectToken = {
    len: 30,
    get: (buf, off) => {
        return {
            objectId: GUID_1.default.fromBin(new Token.BufferType(16).get(buf, off)),
            objectSize: Number(Token.UINT64_LE.get(buf, off + 16)),
            numberOfHeaderObjects: Token.UINT32_LE.get(buf, off + 24)
            // Reserved: 2 bytes
        };
    }
};
/**
 * Token for: 3.1 Header Object (mandatory, one only)
 * Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_1
 */
exports.HeaderObjectToken = {
    len: 24,
    get: (buf, off) => {
        return {
            objectId: GUID_1.default.fromBin(new Token.BufferType(16).get(buf, off)),
            objectSize: Number(Token.UINT64_LE.get(buf, off + 16))
        };
    }
};
class State {
    constructor(header) {
        this.len = Number(header.objectSize) - exports.HeaderObjectToken.len;
    }
    postProcessTag(tags, name, valueType, data) {
        if (name === 'WM/Picture') {
            tags.push({ id: name, value: WmPictureToken.fromBuffer(data) });
        }
        else {
            const parseAttr = AsfUtil_1.AsfUtil.getParserForAttr(valueType);
            if (!parseAttr) {
                throw new Error('unexpected value headerType: ' + valueType);
            }
            tags.push({ id: name, value: parseAttr(data) });
        }
    }
}
exports.State = State;
// ToDo: use ignore type
class IgnoreObjectState extends State {
    constructor(header) {
        super(header);
    }
    get(buf, off) {
        return null;
    }
}
exports.IgnoreObjectState = IgnoreObjectState;
/**
 * Token for: 3.2: File Properties Object (mandatory, one only)
 * Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_2
 */
class FilePropertiesObject extends State {
    constructor(header) {
        super(header);
    }
    get(buf, off) {
        return {
            fileId: GUID_1.default.fromBin(buf, off),
            fileSize: Token.UINT64_LE.get(buf, off + 16),
            creationDate: Token.UINT64_LE.get(buf, off + 24),
            dataPacketsCount: Token.UINT64_LE.get(buf, off + 32),
            playDuration: Token.UINT64_LE.get(buf, off + 40),
            sendDuration: Token.UINT64_LE.get(buf, off + 48),
            preroll: Token.UINT64_LE.get(buf, off + 56),
            flags: {
                broadcast: util.getBit(buf, off + 64, 24),
                seekable: util.getBit(buf, off + 64, 25)
            },
            // flagsNumeric: Token.UINT32_LE.get(buf, off + 64),
            minimumDataPacketSize: Token.UINT32_LE.get(buf, off + 68),
            maximumDataPacketSize: Token.UINT32_LE.get(buf, off + 72),
            maximumBitrate: Token.UINT32_LE.get(buf, off + 76)
        };
    }
}
FilePropertiesObject.guid = GUID_1.default.FilePropertiesObject;
exports.FilePropertiesObject = FilePropertiesObject;
/**
 * Token for: 3.3 Stream Properties Object (mandatory, one per stream)
 * Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_3
 */
class StreamPropertiesObject extends State {
    constructor(header) {
        super(header);
    }
    get(buf, off) {
        return {
            streamType: GUID_1.default.decodeMediaType(GUID_1.default.fromBin(buf, off)),
            errorCorrectionType: GUID_1.default.fromBin(buf, off + 8)
            // ToDo
        };
    }
}
StreamPropertiesObject.guid = GUID_1.default.StreamPropertiesObject;
exports.StreamPropertiesObject = StreamPropertiesObject;
/**
 * 3.4: Header Extension Object (mandatory, one only)
 * Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_4
 */
class HeaderExtensionObject {
    constructor() {
        this.len = 22;
    }
    get(buf, off) {
        return {
            reserved1: GUID_1.default.fromBin(buf, off),
            reserved2: buf.readUInt16LE(off + 16),
            extensionDataSize: buf.readUInt32LE(off + 18)
        };
    }
}
HeaderExtensionObject.guid = GUID_1.default.HeaderExtensionObject;
exports.HeaderExtensionObject = HeaderExtensionObject;
/**
 * 3.5: The Codec List Object provides user-friendly information about the codecs and formats used to encode the content found in the ASF file.
 * Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_5
 */
const CodecListObjectHeader = {
    len: 20,
    get: (buf, off) => {
        return {
            entryCount: buf.readUInt16LE(off + 16)
        };
    }
};
async function readString(tokenizer) {
    const length = await tokenizer.readNumber(Token.UINT16_LE);
    return (await tokenizer.readToken(new Token.StringType(length * 2, 'utf16le'))).replace('\0', '');
}
/**
 * 3.5: Read the Codec-List-Object, which provides user-friendly information about the codecs and formats used to encode the content found in the ASF file.
 * Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_5
 */
async function readCodecEntries(tokenizer) {
    const codecHeader = await tokenizer.readToken(CodecListObjectHeader);
    const entries = [];
    for (let i = 0; i < codecHeader.entryCount; ++i) {
        entries.push(await readCodecEntry(tokenizer));
    }
    return entries;
}
exports.readCodecEntries = readCodecEntries;
async function readInformation(tokenizer) {
    const length = await tokenizer.readNumber(Token.UINT16_LE);
    const buf = Buffer.alloc(length);
    await tokenizer.readBuffer(buf);
    return buf;
}
/**
 * Read Codec-Entries
 * @param tokenizer
 */
async function readCodecEntry(tokenizer) {
    const type = await tokenizer.readNumber(Token.UINT16_LE);
    return {
        type: {
            videoCodec: (type & 0x0001) === 0x0001,
            audioCodec: (type & 0x0002) === 0x0002
        },
        codecName: await readString(tokenizer),
        description: await readString(tokenizer),
        information: await readInformation(tokenizer)
    };
}
/**
 * 3.10 Content Description Object (optional, one only)
 * Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_10
 */
class ContentDescriptionObjectState extends State {
    constructor(header) {
        super(header);
    }
    get(buf, off) {
        const tags = [];
        let pos = off + 10;
        for (let i = 0; i < ContentDescriptionObjectState.contentDescTags.length; ++i) {
            const length = buf.readUInt16LE(off + i * 2);
            if (length > 0) {
                const tagName = ContentDescriptionObjectState.contentDescTags[i];
                const end = pos + length;
                tags.push({ id: tagName, value: AsfUtil_1.AsfUtil.parseUnicodeAttr(buf.slice(pos, end)) });
                pos = end;
            }
        }
        return tags;
    }
}
ContentDescriptionObjectState.guid = GUID_1.default.ContentDescriptionObject;
ContentDescriptionObjectState.contentDescTags = ['Title', 'Author', 'Copyright', 'Description', 'Rating'];
exports.ContentDescriptionObjectState = ContentDescriptionObjectState;
/**
 * 3.11 Extended Content Description Object (optional, one only)
 * Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_11
 */
class ExtendedContentDescriptionObjectState extends State {
    constructor(header) {
        super(header);
    }
    get(buf, off) {
        const tags = [];
        const attrCount = buf.readUInt16LE(off);
        let pos = off + 2;
        for (let i = 0; i < attrCount; i += 1) {
            const nameLen = buf.readUInt16LE(pos);
            pos += 2;
            const name = AsfUtil_1.AsfUtil.parseUnicodeAttr(buf.slice(pos, pos + nameLen));
            pos += nameLen;
            const valueType = buf.readUInt16LE(pos);
            pos += 2;
            const valueLen = buf.readUInt16LE(pos);
            pos += 2;
            const value = buf.slice(pos, pos + valueLen);
            pos += valueLen;
            this.postProcessTag(tags, name, valueType, value);
        }
        return tags;
    }
}
ExtendedContentDescriptionObjectState.guid = GUID_1.default.ExtendedContentDescriptionObject;
exports.ExtendedContentDescriptionObjectState = ExtendedContentDescriptionObjectState;
/**
 * 4.1 Extended Stream Properties Object (optional, 1 per media stream)
 * Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/04_objects_in_the_asf_header_extension_object.html#4_1
 */
class ExtendedStreamPropertiesObjectState extends State {
    constructor(header) {
        super(header);
    }
    get(buf, off) {
        return {
            startTime: Token.UINT64_LE.get(buf, off),
            endTime: Token.UINT64_LE.get(buf, off + 8),
            dataBitrate: buf.readInt32LE(off + 12),
            bufferSize: buf.readInt32LE(off + 16),
            initialBufferFullness: buf.readInt32LE(off + 20),
            alternateDataBitrate: buf.readInt32LE(off + 24),
            alternateBufferSize: buf.readInt32LE(off + 28),
            alternateInitialBufferFullness: buf.readInt32LE(off + 32),
            maximumObjectSize: buf.readInt32LE(off + 36),
            flags: {
                reliableFlag: util.getBit(buf, off + 40, 0),
                seekableFlag: util.getBit(buf, off + 40, 1),
                resendLiveCleanpointsFlag: util.getBit(buf, off + 40, 2)
            },
            // flagsNumeric: Token.UINT32_LE.get(buf, off + 64),
            streamNumber: buf.readInt16LE(off + 42),
            streamLanguageId: buf.readInt16LE(off + 44),
            averageTimePerFrame: buf.readInt32LE(off + 52),
            streamNameCount: buf.readInt32LE(off + 54),
            payloadExtensionSystems: buf.readInt32LE(off + 56),
            streamNames: [],
            streamPropertiesObject: null
        };
    }
}
ExtendedStreamPropertiesObjectState.guid = GUID_1.default.ExtendedStreamPropertiesObject;
exports.ExtendedStreamPropertiesObjectState = ExtendedStreamPropertiesObjectState;
/**
 * 4.7  Metadata Object (optional, 0 or 1)
 * Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/04_objects_in_the_asf_header_extension_object.html#4_7
 */
class MetadataObjectState extends State {
    constructor(header) {
        super(header);
    }
    get(uint8Array, off) {
        const tags = [];
        const buf = Buffer.from(uint8Array);
        const descriptionRecordsCount = buf.readUInt16LE(off);
        let pos = off + 2;
        for (let i = 0; i < descriptionRecordsCount; i += 1) {
            pos += 4;
            const nameLen = buf.readUInt16LE(pos);
            pos += 2;
            const dataType = buf.readUInt16LE(pos);
            pos += 2;
            const dataLen = buf.readUInt32LE(pos);
            pos += 4;
            const name = AsfUtil_1.AsfUtil.parseUnicodeAttr(buf.slice(pos, pos + nameLen));
            pos += nameLen;
            const data = buf.slice(pos, pos + dataLen);
            pos += dataLen;
            this.postProcessTag(tags, name, dataType, data);
        }
        return tags;
    }
}
MetadataObjectState.guid = GUID_1.default.MetadataObject;
exports.MetadataObjectState = MetadataObjectState;
// 4.8	Metadata Library Object (optional, 0 or 1)
class MetadataLibraryObjectState extends MetadataObjectState {
    constructor(header) {
        super(header);
    }
}
MetadataLibraryObjectState.guid = GUID_1.default.MetadataLibraryObject;
exports.MetadataLibraryObjectState = MetadataLibraryObjectState;
/**
 * Ref: https://msdn.microsoft.com/en-us/library/windows/desktop/dd757977(v=vs.85).aspx
 */
class WmPictureToken {
    static fromBase64(base64str) {
        return this.fromBuffer(Buffer.from(base64str, 'base64'));
    }
    static fromBuffer(buffer) {
        const pic = new WmPictureToken(buffer.length);
        return pic.get(buffer, 0);
    }
    constructor(len) {
        this.len = len;
    }
    get(buffer, offset) {
        const typeId = buffer.readUInt8(offset++);
        const size = buffer.readInt32LE(offset);
        let index = 5;
        while (buffer.readUInt16BE(index) !== 0) {
            index += 2;
        }
        const format = buffer.slice(5, index).toString('utf16le');
        while (buffer.readUInt16BE(index) !== 0) {
            index += 2;
        }
        const description = buffer.slice(5, index).toString('utf16le');
        return {
            type: ID3v2Token_1.AttachedPictureType[typeId],
            format,
            description,
            size,
            data: buffer.slice(index + 4)
        };
    }
}
exports.WmPictureToken = WmPictureToken;


/***/ }),
/* 69 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AsfUtil = void 0;
const Token = __webpack_require__(21);
const util = __webpack_require__(46);
class AsfUtil {
    static getParserForAttr(i) {
        return AsfUtil.attributeParsers[i];
    }
    static parseUnicodeAttr(uint8Array) {
        return util.stripNulls(util.decodeString(uint8Array, 'utf16le'));
    }
    static parseByteArrayAttr(buf) {
        return Buffer.from(buf);
    }
    static parseBoolAttr(buf, offset = 0) {
        return AsfUtil.parseWordAttr(buf, offset) === 1;
    }
    static parseDWordAttr(buf, offset = 0) {
        return buf.readUInt32LE(offset);
    }
    static parseQWordAttr(buf, offset = 0) {
        return Token.UINT64_LE.get(buf, offset);
    }
    static parseWordAttr(buf, offset = 0) {
        return buf.readUInt16LE(offset);
    }
}
AsfUtil.attributeParsers = [
    AsfUtil.parseUnicodeAttr,
    AsfUtil.parseByteArrayAttr,
    AsfUtil.parseBoolAttr,
    AsfUtil.parseDWordAttr,
    AsfUtil.parseQWordAttr,
    AsfUtil.parseWordAttr,
    AsfUtil.parseByteArrayAttr
];
exports.AsfUtil = AsfUtil;


/***/ }),
/* 70 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FlacParser = void 0;
const token_types_1 = __webpack_require__(21);
const debug_1 = __webpack_require__(27);
const util = __webpack_require__(46);
const Vorbis_1 = __webpack_require__(71);
const AbstractID3Parser_1 = __webpack_require__(72);
const FourCC_1 = __webpack_require__(63);
const VorbisParser_1 = __webpack_require__(73);
const VorbisDecoder_1 = __webpack_require__(74);
const debug = (0, debug_1.default)('music-metadata:parser:FLAC');
/**
 * FLAC supports up to 128 kinds of metadata blocks; currently the following are defined:
 * ref: https://xiph.org/flac/format.html#metadata_block
 */
var BlockType;
(function (BlockType) {
    BlockType[BlockType["STREAMINFO"] = 0] = "STREAMINFO";
    BlockType[BlockType["PADDING"] = 1] = "PADDING";
    BlockType[BlockType["APPLICATION"] = 2] = "APPLICATION";
    BlockType[BlockType["SEEKTABLE"] = 3] = "SEEKTABLE";
    BlockType[BlockType["VORBIS_COMMENT"] = 4] = "VORBIS_COMMENT";
    BlockType[BlockType["CUESHEET"] = 5] = "CUESHEET";
    BlockType[BlockType["PICTURE"] = 6] = "PICTURE";
})(BlockType || (BlockType = {}));
class FlacParser extends AbstractID3Parser_1.AbstractID3Parser {
    constructor() {
        super(...arguments);
        this.padding = 0;
    }
    /**
     * Initialize parser with output (metadata), input (tokenizer) & parsing options (options).
     * @param {INativeMetadataCollector} metadata Output
     * @param {ITokenizer} tokenizer Input
     * @param {IOptions} options Parsing options
     */
    init(metadata, tokenizer, options) {
        super.init(metadata, tokenizer, options);
        this.vorbisParser = new VorbisParser_1.VorbisParser(metadata, options);
        return this;
    }
    async postId3v2Parse() {
        const fourCC = await this.tokenizer.readToken(FourCC_1.FourCcToken);
        if (fourCC.toString() !== 'fLaC') {
            throw new Error('Invalid FLAC preamble');
        }
        let blockHeader;
        do {
            // Read block header
            blockHeader = await this.tokenizer.readToken(Metadata.BlockHeader);
            // Parse block data
            await this.parseDataBlock(blockHeader);
        } while (!blockHeader.lastBlock);
        if (this.tokenizer.fileInfo.size && this.metadata.format.duration) {
            const dataSize = this.tokenizer.fileInfo.size - this.tokenizer.position;
            this.metadata.setFormat('bitrate', 8 * dataSize / this.metadata.format.duration);
        }
    }
    parseDataBlock(blockHeader) {
        debug(`blockHeader type=${blockHeader.type}, length=${blockHeader.length}`);
        switch (blockHeader.type) {
            case BlockType.STREAMINFO:
                return this.parseBlockStreamInfo(blockHeader.length);
            case BlockType.PADDING:
                this.padding += blockHeader.length;
                break;
            case BlockType.APPLICATION:
                break;
            case BlockType.SEEKTABLE:
                break;
            case BlockType.VORBIS_COMMENT:
                return this.parseComment(blockHeader.length);
            case BlockType.CUESHEET:
                break;
            case BlockType.PICTURE:
                return this.parsePicture(blockHeader.length).then();
            default:
                this.metadata.addWarning('Unknown block type: ' + blockHeader.type);
        }
        // Ignore data block
        return this.tokenizer.ignore(blockHeader.length).then();
    }
    /**
     * Parse STREAMINFO
     */
    async parseBlockStreamInfo(dataLen) {
        if (dataLen !== Metadata.BlockStreamInfo.len)
            throw new Error('Unexpected block-stream-info length');
        const streamInfo = await this.tokenizer.readToken(Metadata.BlockStreamInfo);
        this.metadata.setFormat('container', 'FLAC');
        this.metadata.setFormat('codec', 'FLAC');
        this.metadata.setFormat('lossless', true);
        this.metadata.setFormat('numberOfChannels', streamInfo.channels);
        this.metadata.setFormat('bitsPerSample', streamInfo.bitsPerSample);
        this.metadata.setFormat('sampleRate', streamInfo.sampleRate);
        if (streamInfo.totalSamples > 0) {
            this.metadata.setFormat('duration', streamInfo.totalSamples / streamInfo.sampleRate);
        }
    }
    /**
     * Parse VORBIS_COMMENT
     * Ref: https://www.xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-640004.2.3
     */
    async parseComment(dataLen) {
        const data = await this.tokenizer.readToken(new token_types_1.Uint8ArrayType(dataLen));
        const decoder = new VorbisDecoder_1.VorbisDecoder(data, 0);
        decoder.readStringUtf8(); // vendor (skip)
        const commentListLength = decoder.readInt32();
        for (let i = 0; i < commentListLength; i++) {
            const tag = decoder.parseUserComment();
            this.vorbisParser.addTag(tag.key, tag.value);
        }
    }
    async parsePicture(dataLen) {
        if (this.options.skipCovers) {
            return this.tokenizer.ignore(dataLen);
        }
        else {
            const picture = await this.tokenizer.readToken(new Vorbis_1.VorbisPictureToken(dataLen));
            this.vorbisParser.addTag('METADATA_BLOCK_PICTURE', picture);
        }
    }
}
exports.FlacParser = FlacParser;
class Metadata {
}
Metadata.BlockHeader = {
    len: 4,
    get: (buf, off) => {
        return {
            lastBlock: util.getBit(buf, off, 7),
            type: util.getBitAllignedNumber(buf, off, 1, 7),
            length: token_types_1.UINT24_BE.get(buf, off + 1)
        };
    }
};
/**
 * METADATA_BLOCK_DATA
 * Ref: https://xiph.org/flac/format.html#metadata_block_streaminfo
 */
Metadata.BlockStreamInfo = {
    len: 34,
    get: (buf, off) => {
        return {
            // The minimum block size (in samples) used in the stream.
            minimumBlockSize: token_types_1.UINT16_BE.get(buf, off),
            // The maximum block size (in samples) used in the stream.
            // (Minimum blocksize == maximum blocksize) implies a fixed-blocksize stream.
            maximumBlockSize: token_types_1.UINT16_BE.get(buf, off + 2) / 1000,
            // The minimum frame size (in bytes) used in the stream.
            // May be 0 to imply the value is not known.
            minimumFrameSize: token_types_1.UINT24_BE.get(buf, off + 4),
            // The maximum frame size (in bytes) used in the stream.
            // May be 0 to imply the value is not known.
            maximumFrameSize: token_types_1.UINT24_BE.get(buf, off + 7),
            // Sample rate in Hz. Though 20 bits are available,
            // the maximum sample rate is limited by the structure of frame headers to 655350Hz.
            // Also, a value of 0 is invalid.
            sampleRate: token_types_1.UINT24_BE.get(buf, off + 10) >> 4,
            // probably slower: sampleRate: common.getBitAllignedNumber(buf, off + 10, 0, 20),
            // (number of channels)-1. FLAC supports from 1 to 8 channels
            channels: util.getBitAllignedNumber(buf, off + 12, 4, 3) + 1,
            // bits per sample)-1.
            // FLAC supports from 4 to 32 bits per sample. Currently the reference encoder and decoders only support up to 24 bits per sample.
            bitsPerSample: util.getBitAllignedNumber(buf, off + 12, 7, 5) + 1,
            // Total samples in stream.
            // 'Samples' means inter-channel sample, i.e. one second of 44.1Khz audio will have 44100 samples regardless of the number of channels.
            // A value of zero here means the number of total samples is unknown.
            totalSamples: util.getBitAllignedNumber(buf, off + 13, 4, 36),
            // the MD5 hash of the file (see notes for usage... it's a littly tricky)
            fileMD5: new token_types_1.Uint8ArrayType(16).get(buf, off + 18)
        };
    }
};


/***/ }),
/* 71 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IdentificationHeader = exports.CommonHeader = exports.VorbisPictureToken = void 0;
const Token = __webpack_require__(21);
const ID3v2Token_1 = __webpack_require__(58);
/**
 * Parse the METADATA_BLOCK_PICTURE
 * Ref: https://wiki.xiph.org/VorbisComment#METADATA_BLOCK_PICTURE
 * Ref: https://xiph.org/flac/format.html#metadata_block_picture
 * // ToDo: move to ID3 / APIC?
 */
class VorbisPictureToken {
    static fromBase64(base64str) {
        return this.fromBuffer(Buffer.from(base64str, 'base64'));
    }
    static fromBuffer(buffer) {
        const pic = new VorbisPictureToken(buffer.length);
        return pic.get(buffer, 0);
    }
    constructor(len) {
        this.len = len;
    }
    get(buffer, offset) {
        const type = ID3v2Token_1.AttachedPictureType[Token.UINT32_BE.get(buffer, offset)];
        const mimeLen = Token.UINT32_BE.get(buffer, offset += 4);
        const format = buffer.toString('utf-8', offset += 4, offset + mimeLen);
        const descLen = Token.UINT32_BE.get(buffer, offset += mimeLen);
        const description = buffer.toString('utf-8', offset += 4, offset + descLen);
        const width = Token.UINT32_BE.get(buffer, offset += descLen);
        const height = Token.UINT32_BE.get(buffer, offset += 4);
        const colour_depth = Token.UINT32_BE.get(buffer, offset += 4);
        const indexed_color = Token.UINT32_BE.get(buffer, offset += 4);
        const picDataLen = Token.UINT32_BE.get(buffer, offset += 4);
        const data = Buffer.from(buffer.slice(offset += 4, offset + picDataLen));
        return {
            type,
            format,
            description,
            width,
            height,
            colour_depth,
            indexed_color,
            data
        };
    }
}
exports.VorbisPictureToken = VorbisPictureToken;
/**
 * Comment header decoder
 * Ref: https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-620004.2.1
 */
exports.CommonHeader = {
    len: 7,
    get: (buf, off) => {
        return {
            packetType: buf.readUInt8(off),
            vorbis: new Token.StringType(6, 'ascii').get(buf, off + 1)
        };
    }
};
/**
 * Identification header decoder
 * Ref: https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-630004.2.2
 */
exports.IdentificationHeader = {
    len: 23,
    get: (uint8Array, off) => {
        const dataView = new DataView(uint8Array.buffer, uint8Array.byteOffset);
        return {
            version: dataView.getUint32(off + 0, true),
            channelMode: dataView.getUint8(off + 4),
            sampleRate: dataView.getUint32(off + 5, true),
            bitrateMax: dataView.getUint32(off + 9, true),
            bitrateNominal: dataView.getUint32(off + 13, true),
            bitrateMin: dataView.getUint32(off + 17, true)
        };
    }
};


/***/ }),
/* 72 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbstractID3Parser = void 0;
const core_1 = __webpack_require__(9);
const debug_1 = __webpack_require__(27);
const ID3v2Token_1 = __webpack_require__(58);
const ID3v2Parser_1 = __webpack_require__(56);
const ID3v1Parser_1 = __webpack_require__(59);
const BasicParser_1 = __webpack_require__(60);
const debug = (0, debug_1.default)('music-metadata:parser:ID3');
/**
 * Abstract parser which tries take ID3v2 and ID3v1 headers.
 */
class AbstractID3Parser extends BasicParser_1.BasicParser {
    constructor() {
        super(...arguments);
        this.id3parser = new ID3v2Parser_1.ID3v2Parser();
    }
    static async startsWithID3v2Header(tokenizer) {
        return (await tokenizer.peekToken(ID3v2Token_1.ID3v2Header)).fileIdentifier === 'ID3';
    }
    async parse() {
        try {
            await this.parseID3v2();
        }
        catch (err) {
            if (err instanceof core_1.EndOfStreamError) {
                debug(`End-of-stream`);
            }
            else {
                throw err;
            }
        }
    }
    finalize() {
        return;
    }
    async parseID3v2() {
        await this.tryReadId3v2Headers();
        debug('End of ID3v2 header, go to MPEG-parser: pos=%s', this.tokenizer.position);
        await this.postId3v2Parse();
        if (this.options.skipPostHeaders && this.metadata.hasAny()) {
            this.finalize();
        }
        else {
            const id3v1parser = new ID3v1Parser_1.ID3v1Parser();
            await id3v1parser.init(this.metadata, this.tokenizer, this.options).parse();
            this.finalize();
        }
    }
    async tryReadId3v2Headers() {
        const id3Header = await this.tokenizer.peekToken(ID3v2Token_1.ID3v2Header);
        if (id3Header.fileIdentifier === 'ID3') {
            debug('Found ID3v2 header, pos=%s', this.tokenizer.position);
            await this.id3parser.parse(this.metadata, this.tokenizer, this.options);
            return this.tryReadId3v2Headers();
        }
    }
}
exports.AbstractID3Parser = AbstractID3Parser;


/***/ }),
/* 73 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VorbisParser = void 0;
const Token = __webpack_require__(21);
const debug_1 = __webpack_require__(27);
const VorbisDecoder_1 = __webpack_require__(74);
const Vorbis_1 = __webpack_require__(71);
const debug = (0, debug_1.default)('music-metadata:parser:ogg:vorbis1');
/**
 * Vorbis 1 Parser.
 * Used by OggParser
 */
class VorbisParser {
    constructor(metadata, options) {
        this.metadata = metadata;
        this.options = options;
        this.pageSegments = [];
    }
    /**
     * Vorbis 1 parser
     * @param header Ogg Page Header
     * @param pageData Page data
     */
    parsePage(header, pageData) {
        if (header.headerType.firstPage) {
            this.parseFirstPage(header, pageData);
        }
        else {
            if (header.headerType.continued) {
                if (this.pageSegments.length === 0) {
                    throw new Error("Cannot continue on previous page");
                }
                this.pageSegments.push(pageData);
            }
            if (header.headerType.lastPage || !header.headerType.continued) {
                // Flush page segments
                if (this.pageSegments.length > 0) {
                    const fullPage = Buffer.concat(this.pageSegments);
                    this.parseFullPage(fullPage);
                }
                // Reset page segments
                this.pageSegments = header.headerType.lastPage ? [] : [pageData];
            }
        }
        if (header.headerType.lastPage) {
            this.calculateDuration(header);
        }
    }
    flush() {
        this.parseFullPage(Buffer.concat(this.pageSegments));
    }
    parseUserComment(pageData, offset) {
        const decoder = new VorbisDecoder_1.VorbisDecoder(pageData, offset);
        const tag = decoder.parseUserComment();
        this.addTag(tag.key, tag.value);
        return tag.len;
    }
    addTag(id, value) {
        if (id === 'METADATA_BLOCK_PICTURE' && (typeof value === 'string')) {
            if (this.options.skipCovers) {
                debug(`Ignore picture`);
                return;
            }
            value = Vorbis_1.VorbisPictureToken.fromBase64(value);
            debug(`Push picture: id=${id}, format=${value.format}`);
        }
        else {
            debug(`Push tag: id=${id}, value=${value}`);
        }
        this.metadata.addTag('vorbis', id, value);
    }
    calculateDuration(header) {
        if (this.metadata.format.sampleRate && header.absoluteGranulePosition >= 0) {
            // Calculate duration
            this.metadata.setFormat('numberOfSamples', header.absoluteGranulePosition);
            this.metadata.setFormat('duration', this.metadata.format.numberOfSamples / this.metadata.format.sampleRate);
        }
    }
    /**
     * Parse first Ogg/Vorbis page
     * @param {IPageHeader} header
     * @param {Buffer} pageData
     */
    parseFirstPage(header, pageData) {
        this.metadata.setFormat('codec', 'Vorbis I');
        debug("Parse first page");
        // Parse  Vorbis common header
        const commonHeader = Vorbis_1.CommonHeader.get(pageData, 0);
        if (commonHeader.vorbis !== 'vorbis')
            throw new Error('Metadata does not look like Vorbis');
        if (commonHeader.packetType === 1) {
            const idHeader = Vorbis_1.IdentificationHeader.get(pageData, Vorbis_1.CommonHeader.len);
            this.metadata.setFormat('sampleRate', idHeader.sampleRate);
            this.metadata.setFormat('bitrate', idHeader.bitrateNominal);
            this.metadata.setFormat('numberOfChannels', idHeader.channelMode);
            debug("sample-rate=%s[hz], bitrate=%s[b/s], channel-mode=%s", idHeader.sampleRate, idHeader.bitrateNominal, idHeader.channelMode);
        }
        else
            throw new Error('First Ogg page should be type 1: the identification header');
    }
    parseFullPage(pageData) {
        // New page
        const commonHeader = Vorbis_1.CommonHeader.get(pageData, 0);
        debug("Parse full page: type=%s, byteLength=%s", commonHeader.packetType, pageData.byteLength);
        switch (commonHeader.packetType) {
            case 3: //  type 3: comment header
                return this.parseUserCommentList(pageData, Vorbis_1.CommonHeader.len);
            case 1: // type 1: the identification header
            case 5: // type 5: setup header type
                break; // ignore
        }
    }
    /**
     * Ref: https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-840005.2
     */
    parseUserCommentList(pageData, offset) {
        const strLen = Token.UINT32_LE.get(pageData, offset);
        offset += 4;
        // const vendorString = new Token.StringType(strLen, 'utf-8').get(pageData, offset);
        offset += strLen;
        let userCommentListLength = Token.UINT32_LE.get(pageData, offset);
        offset += 4;
        while (userCommentListLength-- > 0) {
            offset += this.parseUserComment(pageData, offset);
        }
    }
}
exports.VorbisParser = VorbisParser;


/***/ }),
/* 74 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VorbisDecoder = void 0;
const Token = __webpack_require__(21);
class VorbisDecoder {
    constructor(data, offset) {
        this.data = data;
        this.offset = offset;
    }
    readInt32() {
        const value = Token.UINT32_LE.get(this.data, this.offset);
        this.offset += 4;
        return value;
    }
    readStringUtf8() {
        const len = this.readInt32();
        const value = Buffer.from(this.data).toString('utf-8', this.offset, this.offset + len);
        this.offset += len;
        return value;
    }
    parseUserComment() {
        const offset0 = this.offset;
        const v = this.readStringUtf8();
        const idx = v.indexOf('=');
        return {
            key: v.slice(0, idx).toUpperCase(),
            value: v.slice(idx + 1),
            len: this.offset - offset0
        };
    }
}
exports.VorbisDecoder = VorbisDecoder;


/***/ }),
/* 75 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MP4Parser = void 0;
const debug_1 = __webpack_require__(27);
const Token = __webpack_require__(21);
const BasicParser_1 = __webpack_require__(60);
const ID3v1Parser_1 = __webpack_require__(59);
const type_1 = __webpack_require__(38);
const Atom_1 = __webpack_require__(76);
const AtomToken = __webpack_require__(77);
const debug = (0, debug_1.default)('music-metadata:parser:MP4');
const tagFormat = 'iTunes';
const encoderDict = {
    raw: {
        lossy: false,
        format: 'raw'
    },
    MAC3: {
        lossy: true,
        format: 'MACE 3:1'
    },
    MAC6: {
        lossy: true,
        format: 'MACE 6:1'
    },
    ima4: {
        lossy: true,
        format: 'IMA 4:1'
    },
    ulaw: {
        lossy: true,
        format: 'uLaw 2:1'
    },
    alaw: {
        lossy: true,
        format: 'uLaw 2:1'
    },
    Qclp: {
        lossy: true,
        format: 'QUALCOMM PureVoice'
    },
    '.mp3': {
        lossy: true,
        format: 'MPEG-1 layer 3'
    },
    alac: {
        lossy: false,
        format: 'ALAC'
    },
    'ac-3': {
        lossy: true,
        format: 'AC-3'
    },
    mp4a: {
        lossy: true,
        format: 'MPEG-4/AAC'
    },
    mp4s: {
        lossy: true,
        format: 'MP4S'
    },
    // Closed Captioning Media, https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-SW87
    c608: {
        lossy: true,
        format: 'CEA-608'
    },
    c708: {
        lossy: true,
        format: 'CEA-708'
    }
};
function distinct(value, index, self) {
    return self.indexOf(value) === index;
}
/*
 * Parser for the MP4 (MPEG-4 Part 14) container format
 * Standard: ISO/IEC 14496-14
 * supporting:
 * - QuickTime container
 * - MP4 File Format
 * - 3GPP file format
 * - 3GPP2 file format
 *
 * MPEG-4 Audio / Part 3 (.m4a)& MPEG 4 Video (m4v, mp4) extension.
 * Support for Apple iTunes tags as found in a M4A/M4V files.
 * Ref:
 *   https://en.wikipedia.org/wiki/ISO_base_media_file_format
 *   https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/Metadata/Metadata.html
 *   http://atomicparsley.sourceforge.net/mpeg-4files.html
 *   https://github.com/sergiomb2/libmp4v2/wiki/iTunesMetadata
 *   https://wiki.multimedia.cx/index.php/QuickTime_container
 */
class MP4Parser extends BasicParser_1.BasicParser {
    constructor() {
        super(...arguments);
        this.atomParsers = {
            /**
             * Parse movie header (mvhd) atom
             * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-56313
             */
            mvhd: async (len) => {
                const mvhd = await this.tokenizer.readToken(new AtomToken.MvhdAtom(len));
                this.metadata.setFormat('creationTime', mvhd.creationTime);
                this.metadata.setFormat('modificationTime', mvhd.modificationTime);
            },
            /**
             * Parse media header (mdhd) atom
             * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25615
             */
            mdhd: async (len) => {
                const mdhd_data = await this.tokenizer.readToken(new AtomToken.MdhdAtom(len));
                // this.parse_mxhd(mdhd_data, this.currentTrack);
                const td = this.getTrackDescription();
                td.creationTime = mdhd_data.creationTime;
                td.modificationTime = mdhd_data.modificationTime;
                td.timeScale = mdhd_data.timeScale;
                td.duration = mdhd_data.duration;
            },
            chap: async (len) => {
                const td = this.getTrackDescription();
                const trackIds = [];
                while (len >= Token.UINT32_BE.len) {
                    trackIds.push(await this.tokenizer.readNumber(Token.UINT32_BE));
                    len -= Token.UINT32_BE.len;
                }
                td.chapterList = trackIds;
            },
            tkhd: async (len) => {
                const track = (await this.tokenizer.readToken(new AtomToken.TrackHeaderAtom(len)));
                this.tracks.push(track);
            },
            /**
             * Parse mdat atom.
             * Will scan for chapters
             */
            mdat: async (len) => {
                this.audioLengthInBytes = len;
                this.calculateBitRate();
                if (this.options.includeChapters) {
                    const trackWithChapters = this.tracks.filter(track => track.chapterList);
                    if (trackWithChapters.length === 1) {
                        const chapterTrackIds = trackWithChapters[0].chapterList;
                        const chapterTracks = this.tracks.filter(track => chapterTrackIds.indexOf(track.trackId) !== -1);
                        if (chapterTracks.length === 1) {
                            return this.parseChapterTrack(chapterTracks[0], trackWithChapters[0], len);
                        }
                    }
                }
                await this.tokenizer.ignore(len);
            },
            ftyp: async (len) => {
                const types = [];
                while (len > 0) {
                    const ftype = await this.tokenizer.readToken(AtomToken.ftyp);
                    len -= AtomToken.ftyp.len;
                    const value = ftype.type.replace(/\W/g, '');
                    if (value.length > 0) {
                        types.push(value); // unshift for backward compatibility
                    }
                }
                debug(`ftyp: ${types.join('/')}`);
                const x = types.filter(distinct).join('/');
                this.metadata.setFormat('container', x);
            },
            /**
             * Parse sample description atom
             */
            stsd: async (len) => {
                const stsd = await this.tokenizer.readToken(new AtomToken.StsdAtom(len));
                const trackDescription = this.getTrackDescription();
                trackDescription.soundSampleDescription = stsd.table.map(dfEntry => this.parseSoundSampleDescription(dfEntry));
            },
            /**
             * sample-to-Chunk Atoms
             */
            stsc: async (len) => {
                const stsc = await this.tokenizer.readToken(new AtomToken.StscAtom(len));
                this.getTrackDescription().sampleToChunkTable = stsc.entries;
            },
            /**
             * time-to-sample table
             */
            stts: async (len) => {
                const stts = await this.tokenizer.readToken(new AtomToken.SttsAtom(len));
                this.getTrackDescription().timeToSampleTable = stts.entries;
            },
            /**
             * Parse sample-sizes atom ('stsz')
             */
            stsz: async (len) => {
                const stsz = await this.tokenizer.readToken(new AtomToken.StszAtom(len));
                const td = this.getTrackDescription();
                td.sampleSize = stsz.sampleSize;
                td.sampleSizeTable = stsz.entries;
            },
            /**
             * Parse chunk-offset atom ('stco')
             */
            stco: async (len) => {
                const stco = await this.tokenizer.readToken(new AtomToken.StcoAtom(len));
                this.getTrackDescription().chunkOffsetTable = stco.entries; // remember chunk offsets
            },
            date: async (len) => {
                const date = await this.tokenizer.readToken(new Token.StringType(len, 'utf-8'));
                this.addTag('date', date);
            }
        };
    }
    static read_BE_Integer(array, signed) {
        const integerType = (signed ? 'INT' : 'UINT') + array.length * 8 + (array.length > 1 ? '_BE' : '');
        const token = Token[integerType];
        if (!token) {
            throw new Error('Token for integer type not found: "' + integerType + '"');
        }
        return Number(token.get(array, 0));
    }
    async parse() {
        this.tracks = [];
        let remainingFileSize = this.tokenizer.fileInfo.size;
        while (!this.tokenizer.fileInfo.size || remainingFileSize > 0) {
            try {
                const token = await this.tokenizer.peekToken(AtomToken.Header);
                if (token.name === '\0\0\0\0') {
                    const errMsg = `Error at offset=${this.tokenizer.position}: box.id=0`;
                    debug(errMsg);
                    this.addWarning(errMsg);
                    break;
                }
            }
            catch (error) {
                const errMsg = `Error at offset=${this.tokenizer.position}: ${error.message}`;
                debug(errMsg);
                this.addWarning(errMsg);
                break;
            }
            const rootAtom = await Atom_1.Atom.readAtom(this.tokenizer, (atom, remaining) => this.handleAtom(atom, remaining), null, remainingFileSize);
            remainingFileSize -= rootAtom.header.length === BigInt(0) ? remainingFileSize : Number(rootAtom.header.length);
        }
        // Post process metadata
        const formatList = [];
        this.tracks.forEach(track => {
            const trackFormats = [];
            track.soundSampleDescription.forEach(ssd => {
                const streamInfo = {};
                const encoderInfo = encoderDict[ssd.dataFormat];
                if (encoderInfo) {
                    trackFormats.push(encoderInfo.format);
                    streamInfo.codecName = encoderInfo.format;
                }
                else {
                    streamInfo.codecName = `<${ssd.dataFormat}>`;
                }
                if (ssd.description) {
                    const { description } = ssd;
                    if (description.sampleRate > 0) {
                        streamInfo.type = type_1.TrackType.audio;
                        streamInfo.audio = {
                            samplingFrequency: description.sampleRate,
                            bitDepth: description.sampleSize,
                            channels: description.numAudioChannels
                        };
                    }
                }
                this.metadata.addStreamInfo(streamInfo);
            });
            if (trackFormats.length >= 1) {
                formatList.push(trackFormats.join('/'));
            }
        });
        if (formatList.length > 0) {
            this.metadata.setFormat('codec', formatList.filter(distinct).join('+'));
        }
        const audioTracks = this.tracks.filter(track => {
            return track.soundSampleDescription.length >= 1 && track.soundSampleDescription[0].description && track.soundSampleDescription[0].description.numAudioChannels > 0;
        });
        if (audioTracks.length >= 1) {
            const audioTrack = audioTracks[0];
            if (audioTrack.timeScale > 0) {
                const duration = audioTrack.duration / audioTrack.timeScale; // calculate duration in seconds
                this.metadata.setFormat('duration', duration);
            }
            const ssd = audioTrack.soundSampleDescription[0];
            if (ssd.description) {
                this.metadata.setFormat('sampleRate', ssd.description.sampleRate);
                this.metadata.setFormat('bitsPerSample', ssd.description.sampleSize);
                this.metadata.setFormat('numberOfChannels', ssd.description.numAudioChannels);
                if (audioTrack.timeScale === 0 && audioTrack.timeToSampleTable.length > 0) {
                    const totalSampleSize = audioTrack.timeToSampleTable
                        .map(ttstEntry => ttstEntry.count * ttstEntry.duration)
                        .reduce((total, sampleSize) => total + sampleSize);
                    const duration = totalSampleSize / ssd.description.sampleRate;
                    this.metadata.setFormat('duration', duration);
                }
            }
            const encoderInfo = encoderDict[ssd.dataFormat];
            if (encoderInfo) {
                this.metadata.setFormat('lossless', !encoderInfo.lossy);
            }
            this.calculateBitRate();
        }
    }
    async handleAtom(atom, remaining) {
        if (atom.parent) {
            switch (atom.parent.header.name) {
                case 'ilst':
                case '<id>':
                    return this.parseMetadataItemData(atom);
            }
        }
        // const payloadLength = atom.getPayloadLength(remaining);
        if (this.atomParsers[atom.header.name]) {
            return this.atomParsers[atom.header.name](remaining);
        }
        else {
            debug(`No parser for atom path=${atom.atomPath}, payload-len=${remaining}, ignoring atom`);
            await this.tokenizer.ignore(remaining);
        }
    }
    getTrackDescription() {
        return this.tracks[this.tracks.length - 1];
    }
    calculateBitRate() {
        if (this.audioLengthInBytes && this.metadata.format.duration) {
            this.metadata.setFormat('bitrate', 8 * this.audioLengthInBytes / this.metadata.format.duration);
        }
    }
    addTag(id, value) {
        this.metadata.addTag(tagFormat, id, value);
    }
    addWarning(message) {
        debug('Warning: ' + message);
        this.metadata.addWarning(message);
    }
    /**
     * Parse data of Meta-item-list-atom (item of 'ilst' atom)
     * @param metaAtom
     * Ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/Metadata/Metadata.html#//apple_ref/doc/uid/TP40000939-CH1-SW8
     */
    parseMetadataItemData(metaAtom) {
        let tagKey = metaAtom.header.name;
        return metaAtom.readAtoms(this.tokenizer, async (child, remaining) => {
            const payLoadLength = child.getPayloadLength(remaining);
            switch (child.header.name) {
                case 'data': // value atom
                    return this.parseValueAtom(tagKey, child);
                case 'name': // name atom (optional)
                case 'mean':
                case 'rate':
                    const name = await this.tokenizer.readToken(new AtomToken.NameAtom(payLoadLength));
                    tagKey += ':' + name.name;
                    break;
                default:
                    const dataAtom = await this.tokenizer.readToken(new Token.BufferType(payLoadLength));
                    this.addWarning('Unsupported meta-item: ' + tagKey + '[' + child.header.name + '] => value=' + dataAtom.toString('hex') + ' ascii=' + dataAtom.toString('ascii'));
            }
        }, metaAtom.getPayloadLength(0));
    }
    async parseValueAtom(tagKey, metaAtom) {
        const dataAtom = await this.tokenizer.readToken(new AtomToken.DataAtom(Number(metaAtom.header.length) - AtomToken.Header.len));
        if (dataAtom.type.set !== 0) {
            throw new Error('Unsupported type-set != 0: ' + dataAtom.type.set);
        }
        // Use well-known-type table
        // Ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/Metadata/Metadata.html#//apple_ref/doc/uid/TP40000939-CH1-SW35
        switch (dataAtom.type.type) {
            case 0: // reserved: Reserved for use where no type needs to be indicated
                switch (tagKey) {
                    case 'trkn':
                    case 'disk':
                        const num = Token.UINT8.get(dataAtom.value, 3);
                        const of = Token.UINT8.get(dataAtom.value, 5);
                        // console.log("  %s[data] = %s/%s", tagKey, num, of);
                        this.addTag(tagKey, num + '/' + of);
                        break;
                    case 'gnre':
                        const genreInt = Token.UINT8.get(dataAtom.value, 1);
                        const genreStr = ID3v1Parser_1.Genres[genreInt - 1];
                        // console.log("  %s[data] = %s", tagKey, genreStr);
                        this.addTag(tagKey, genreStr);
                        break;
                    case 'rate':
                        const rate = dataAtom.value.toString('ascii');
                        this.addTag(tagKey, rate);
                        break;
                    default:
                        debug('unknown proprietary value type for: ' + metaAtom.atomPath);
                }
                break;
            case 1: // UTF-8: Without any count or NULL terminator
            case 18: // Unknown: Found in m4b in combination with a '©gen' tag
                this.addTag(tagKey, dataAtom.value.toString('utf-8'));
                break;
            case 13: // JPEG
                if (this.options.skipCovers)
                    break;
                this.addTag(tagKey, {
                    format: 'image/jpeg',
                    data: Buffer.from(dataAtom.value)
                });
                break;
            case 14: // PNG
                if (this.options.skipCovers)
                    break;
                this.addTag(tagKey, {
                    format: 'image/png',
                    data: Buffer.from(dataAtom.value)
                });
                break;
            case 21: // BE Signed Integer
                this.addTag(tagKey, MP4Parser.read_BE_Integer(dataAtom.value, true));
                break;
            case 22: // BE Unsigned Integer
                this.addTag(tagKey, MP4Parser.read_BE_Integer(dataAtom.value, false));
                break;
            case 65: // An 8-bit signed integer
                this.addTag(tagKey, dataAtom.value.readInt8(0));
                break;
            case 66: // A big-endian 16-bit signed integer
                this.addTag(tagKey, dataAtom.value.readInt16BE(0));
                break;
            case 67: // A big-endian 32-bit signed integer
                this.addTag(tagKey, dataAtom.value.readInt32BE(0));
                break;
            default:
                this.addWarning(`atom key=${tagKey}, has unknown well-known-type (data-type): ${dataAtom.type.type}`);
        }
    }
    /**
     * @param sampleDescription
     * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-128916
     */
    parseSoundSampleDescription(sampleDescription) {
        const ssd = {
            dataFormat: sampleDescription.dataFormat,
            dataReferenceIndex: sampleDescription.dataReferenceIndex
        };
        let offset = 0;
        const version = AtomToken.SoundSampleDescriptionVersion.get(sampleDescription.description, offset);
        offset += AtomToken.SoundSampleDescriptionVersion.len;
        if (version.version === 0 || version.version === 1) {
            // Sound Sample Description (Version 0)
            ssd.description = AtomToken.SoundSampleDescriptionV0.get(sampleDescription.description, offset);
        }
        else {
            debug(`Warning: sound-sample-description ${version} not implemented`);
        }
        return ssd;
    }
    async parseChapterTrack(chapterTrack, track, len) {
        if (!chapterTrack.sampleSize) {
            if (chapterTrack.chunkOffsetTable.length !== chapterTrack.sampleSizeTable.length)
                throw new Error('Expected equal chunk-offset-table & sample-size-table length.');
        }
        const chapters = [];
        for (let i = 0; i < chapterTrack.chunkOffsetTable.length && len > 0; ++i) {
            const chunkOffset = chapterTrack.chunkOffsetTable[i];
            const nextChunkLen = chunkOffset - this.tokenizer.position;
            const sampleSize = chapterTrack.sampleSize > 0 ? chapterTrack.sampleSize : chapterTrack.sampleSizeTable[i];
            len -= nextChunkLen + sampleSize;
            if (len < 0)
                throw new Error('Chapter chunk exceeding token length');
            await this.tokenizer.ignore(nextChunkLen);
            const title = await this.tokenizer.readToken(new AtomToken.ChapterText(sampleSize));
            debug(`Chapter ${i + 1}: ${title}`);
            const chapter = {
                title,
                sampleOffset: this.findSampleOffset(track, this.tokenizer.position)
            };
            debug(`Chapter title=${chapter.title}, offset=${chapter.sampleOffset}/${this.tracks[0].duration}`);
            chapters.push(chapter);
        }
        this.metadata.setFormat('chapters', chapters);
        await this.tokenizer.ignore(len);
    }
    findSampleOffset(track, chapterOffset) {
        let totalDuration = 0;
        track.timeToSampleTable.forEach(e => {
            totalDuration += e.count * e.duration;
        });
        debug(`Total duration=${totalDuration}`);
        let chunkIndex = 0;
        while (chunkIndex < track.chunkOffsetTable.length && track.chunkOffsetTable[chunkIndex] < chapterOffset) {
            ++chunkIndex;
        }
        return this.getChunkDuration(chunkIndex + 1, track);
    }
    getChunkDuration(chunkId, track) {
        let ttsi = 0;
        let ttsc = track.timeToSampleTable[ttsi].count;
        let ttsd = track.timeToSampleTable[ttsi].duration;
        let curChunkId = 1;
        let samplesPerChunk = this.getSamplesPerChunk(curChunkId, track.sampleToChunkTable);
        let totalDuration = 0;
        while (curChunkId < chunkId) {
            const nrOfSamples = Math.min(ttsc, samplesPerChunk);
            totalDuration += nrOfSamples * ttsd;
            ttsc -= nrOfSamples;
            samplesPerChunk -= nrOfSamples;
            if (samplesPerChunk === 0) {
                ++curChunkId;
                samplesPerChunk = this.getSamplesPerChunk(curChunkId, track.sampleToChunkTable);
            }
            else {
                ++ttsi;
                ttsc = track.timeToSampleTable[ttsi].count;
                ttsd = track.timeToSampleTable[ttsi].duration;
            }
        }
        return totalDuration;
    }
    getSamplesPerChunk(chunkId, stcTable) {
        for (let i = 0; i < stcTable.length - 1; ++i) {
            if (chunkId >= stcTable[i].firstChunk && chunkId < stcTable[i + 1].firstChunk) {
                return stcTable[i].samplesPerChunk;
            }
        }
        return stcTable[stcTable.length - 1].samplesPerChunk;
    }
}
exports.MP4Parser = MP4Parser;


/***/ }),
/* 76 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Atom = void 0;
const debug_1 = __webpack_require__(27);
const AtomToken = __webpack_require__(77);
const debug = (0, debug_1.default)('music-metadata:parser:MP4:Atom');
class Atom {
    static async readAtom(tokenizer, dataHandler, parent, remaining) {
        // Parse atom header
        const offset = tokenizer.position;
        // debug(`Reading next token on offset=${offset}...`); //  buf.toString('ascii')
        const header = await tokenizer.readToken(AtomToken.Header);
        const extended = header.length === BigInt(1);
        if (extended) {
            header.length = await tokenizer.readToken(AtomToken.ExtendedSize);
        }
        const atomBean = new Atom(header, header.length === BigInt(1), parent);
        const payloadLength = atomBean.getPayloadLength(remaining);
        debug(`parse atom name=${atomBean.atomPath}, extended=${atomBean.extended}, offset=${offset}, len=${atomBean.header.length}`); //  buf.toString('ascii')
        await atomBean.readData(tokenizer, dataHandler, payloadLength);
        return atomBean;
    }
    constructor(header, extended, parent) {
        this.header = header;
        this.extended = extended;
        this.parent = parent;
        this.children = [];
        this.atomPath = (this.parent ? this.parent.atomPath + '.' : '') + this.header.name;
    }
    getHeaderLength() {
        return this.extended ? 16 : 8;
    }
    getPayloadLength(remaining) {
        return (this.header.length === BigInt(0) ? remaining : Number(this.header.length)) - this.getHeaderLength();
    }
    async readAtoms(tokenizer, dataHandler, size) {
        while (size > 0) {
            const atomBean = await Atom.readAtom(tokenizer, dataHandler, this, size);
            this.children.push(atomBean);
            size -= atomBean.header.length === BigInt(0) ? size : Number(atomBean.header.length);
        }
    }
    async readData(tokenizer, dataHandler, remaining) {
        switch (this.header.name) {
            // "Container" atoms, contains nested atoms
            case 'moov': // The Movie Atom: contains other atoms
            case 'udta': // User defined atom
            case 'trak':
            case 'mdia': // Media atom
            case 'minf': // Media Information Atom
            case 'stbl': // The Sample Table Atom
            case '<id>':
            case 'ilst':
            case 'tref':
                return this.readAtoms(tokenizer, dataHandler, this.getPayloadLength(remaining));
            case 'meta': // Metadata Atom, ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/Metadata/Metadata.html#//apple_ref/doc/uid/TP40000939-CH1-SW8
                // meta has 4 bytes of padding, ignore
                const peekHeader = await tokenizer.peekToken(AtomToken.Header);
                const paddingLength = peekHeader.name === 'hdlr' ? 0 : 4;
                await tokenizer.ignore(paddingLength);
                return this.readAtoms(tokenizer, dataHandler, this.getPayloadLength(remaining) - paddingLength);
            case 'mdhd': // Media header atom
            case 'mvhd': // 'movie' => 'mvhd': movie header atom; child of Movie Atom
            case 'tkhd':
            case 'stsz':
            case 'mdat':
            default:
                return dataHandler(this, remaining);
        }
    }
}
exports.Atom = Atom;


/***/ }),
/* 77 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChapterText = exports.StcoAtom = exports.StszAtom = exports.StscAtom = exports.SampleToChunkToken = exports.SttsAtom = exports.TimeToSampleToken = exports.SoundSampleDescriptionV0 = exports.SoundSampleDescriptionVersion = exports.StsdAtom = exports.TrackHeaderAtom = exports.NameAtom = exports.DataAtom = exports.MvhdAtom = exports.MdhdAtom = exports.FixedLengthAtom = exports.mhdr = exports.tkhd = exports.ftyp = exports.ExtendedSize = exports.Header = void 0;
const Token = __webpack_require__(21);
const debug_1 = __webpack_require__(27);
const FourCC_1 = __webpack_require__(63);
const debug = (0, debug_1.default)('music-metadata:parser:MP4:atom');
exports.Header = {
    len: 8,
    get: (buf, off) => {
        const length = Token.UINT32_BE.get(buf, off);
        if (length < 0)
            throw new Error('Invalid atom header length');
        return {
            length: BigInt(length),
            name: new Token.StringType(4, 'binary').get(buf, off + 4)
        };
    },
    put: (buf, off, hdr) => {
        Token.UINT32_BE.put(buf, off, Number(hdr.length));
        return FourCC_1.FourCcToken.put(buf, off + 4, hdr.name);
    }
};
/**
 * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap1/qtff1.html#//apple_ref/doc/uid/TP40000939-CH203-38190
 */
exports.ExtendedSize = Token.UINT64_BE;
exports.ftyp = {
    len: 4,
    get: (buf, off) => {
        return {
            type: new Token.StringType(4, 'ascii').get(buf, off)
        };
    }
};
exports.tkhd = {
    len: 4,
    get: (buf, off) => {
        return {
            type: new Token.StringType(4, 'ascii').get(buf, off)
        };
    }
};
/**
 * Token: Movie Header Atom
 */
exports.mhdr = {
    len: 8,
    get: (buf, off) => {
        return {
            version: Token.UINT8.get(buf, off),
            flags: Token.UINT24_BE.get(buf, off + 1),
            nextItemID: Token.UINT32_BE.get(buf, off + 4)
        };
    }
};
/**
 * Base class for 'fixed' length atoms.
 * In some cases these atoms are longer then the sum of the described fields.
 * Issue: https://github.com/Borewit/music-metadata/issues/120
 */
class FixedLengthAtom {
    /**
     *
     * @param {number} len Length as specified in the size field
     * @param {number} expLen Total length of sum of specified fields in the standard
     */
    constructor(len, expLen, atomId) {
        this.len = len;
        if (len < expLen) {
            throw new Error(`Atom ${atomId} expected to be ${expLen}, but specifies ${len} bytes long.`);
        }
        else if (len > expLen) {
            debug(`Warning: atom ${atomId} expected to be ${expLen}, but was actually ${len} bytes long.`);
        }
    }
}
exports.FixedLengthAtom = FixedLengthAtom;
/**
 * Timestamp stored in seconds since Mac Epoch (1 January 1904)
 */
const SecondsSinceMacEpoch = {
    len: 4,
    get: (buf, off) => {
        const secondsSinceUnixEpoch = Token.UINT32_BE.get(buf, off) - 2082844800;
        return new Date(secondsSinceUnixEpoch * 1000);
    }
};
/**
 * Token: Media Header Atom
 * Ref:
 * - https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-SW34
 * - https://wiki.multimedia.cx/index.php/QuickTime_container#mdhd
 */
class MdhdAtom extends FixedLengthAtom {
    constructor(len) {
        super(len, 24, 'mdhd');
        this.len = len;
    }
    get(buf, off) {
        return {
            version: Token.UINT8.get(buf, off + 0),
            flags: Token.UINT24_BE.get(buf, off + 1),
            creationTime: SecondsSinceMacEpoch.get(buf, off + 4),
            modificationTime: SecondsSinceMacEpoch.get(buf, off + 8),
            timeScale: Token.UINT32_BE.get(buf, off + 12),
            duration: Token.UINT32_BE.get(buf, off + 16),
            language: Token.UINT16_BE.get(buf, off + 20),
            quality: Token.UINT16_BE.get(buf, off + 22)
        };
    }
}
exports.MdhdAtom = MdhdAtom;
/**
 * Token: Movie Header Atom
 */
class MvhdAtom extends FixedLengthAtom {
    constructor(len) {
        super(len, 100, 'mvhd');
        this.len = len;
    }
    get(buf, off) {
        return {
            version: Token.UINT8.get(buf, off),
            flags: Token.UINT24_BE.get(buf, off + 1),
            creationTime: SecondsSinceMacEpoch.get(buf, off + 4),
            modificationTime: SecondsSinceMacEpoch.get(buf, off + 8),
            timeScale: Token.UINT32_BE.get(buf, off + 12),
            duration: Token.UINT32_BE.get(buf, off + 16),
            preferredRate: Token.UINT32_BE.get(buf, off + 20),
            preferredVolume: Token.UINT16_BE.get(buf, off + 24),
            // ignore reserver: 10 bytes
            // ignore matrix structure: 36 bytes
            previewTime: Token.UINT32_BE.get(buf, off + 72),
            previewDuration: Token.UINT32_BE.get(buf, off + 76),
            posterTime: Token.UINT32_BE.get(buf, off + 80),
            selectionTime: Token.UINT32_BE.get(buf, off + 84),
            selectionDuration: Token.UINT32_BE.get(buf, off + 88),
            currentTime: Token.UINT32_BE.get(buf, off + 92),
            nextTrackID: Token.UINT32_BE.get(buf, off + 96)
        };
    }
}
exports.MvhdAtom = MvhdAtom;
/**
 * Data Atom Structure
 */
class DataAtom {
    constructor(len) {
        this.len = len;
    }
    get(buf, off) {
        return {
            type: {
                set: Token.UINT8.get(buf, off + 0),
                type: Token.UINT24_BE.get(buf, off + 1)
            },
            locale: Token.UINT24_BE.get(buf, off + 4),
            value: Buffer.from(new Token.Uint8ArrayType(this.len - 8).get(buf, off + 8))
        };
    }
}
exports.DataAtom = DataAtom;
/**
 * Data Atom Structure
 * Ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/Metadata/Metadata.html#//apple_ref/doc/uid/TP40000939-CH1-SW31
 */
class NameAtom {
    constructor(len) {
        this.len = len;
    }
    get(buf, off) {
        return {
            version: Token.UINT8.get(buf, off),
            flags: Token.UINT24_BE.get(buf, off + 1),
            name: new Token.StringType(this.len - 4, 'utf-8').get(buf, off + 4)
        };
    }
}
exports.NameAtom = NameAtom;
/**
 * Track Header Atoms structure
 * Ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25550
 */
class TrackHeaderAtom {
    constructor(len) {
        this.len = len;
    }
    get(buf, off) {
        return {
            version: Token.UINT8.get(buf, off),
            flags: Token.UINT24_BE.get(buf, off + 1),
            creationTime: SecondsSinceMacEpoch.get(buf, off + 4),
            modificationTime: SecondsSinceMacEpoch.get(buf, off + 8),
            trackId: Token.UINT32_BE.get(buf, off + 12),
            // reserved 4 bytes
            duration: Token.UINT32_BE.get(buf, off + 20),
            layer: Token.UINT16_BE.get(buf, off + 24),
            alternateGroup: Token.UINT16_BE.get(buf, off + 26),
            volume: Token.UINT16_BE.get(buf, off + 28) // ToDo: fixed point
            // ToDo: add remaining fields
        };
    }
}
exports.TrackHeaderAtom = TrackHeaderAtom;
/**
 * Atom: Sample Description Atom ('stsd')
 * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25691
 */
const stsdHeader = {
    len: 8,
    get: (buf, off) => {
        return {
            version: Token.UINT8.get(buf, off),
            flags: Token.UINT24_BE.get(buf, off + 1),
            numberOfEntries: Token.UINT32_BE.get(buf, off + 4)
        };
    }
};
/**
 * Atom: Sample Description Atom ('stsd')
 * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25691
 */
class SampleDescriptionTable {
    constructor(len) {
        this.len = len;
    }
    get(buf, off) {
        return {
            dataFormat: FourCC_1.FourCcToken.get(buf, off),
            dataReferenceIndex: Token.UINT16_BE.get(buf, off + 10),
            description: new Token.Uint8ArrayType(this.len - 12).get(buf, off + 12)
        };
    }
}
/**
 * Atom: Sample-description Atom ('stsd')
 * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25691
 */
class StsdAtom {
    constructor(len) {
        this.len = len;
    }
    get(buf, off) {
        const header = stsdHeader.get(buf, off);
        off += stsdHeader.len;
        const table = [];
        for (let n = 0; n < header.numberOfEntries; ++n) {
            const size = Token.UINT32_BE.get(buf, off); // Sample description size
            off += Token.UINT32_BE.len;
            table.push(new SampleDescriptionTable(size).get(buf, off));
            off += size;
        }
        return {
            header,
            table
        };
    }
}
exports.StsdAtom = StsdAtom;
/**
 * Common Sound Sample Description (version & revision)
 * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-57317
 */
exports.SoundSampleDescriptionVersion = {
    len: 8,
    get(buf, off) {
        return {
            version: Token.INT16_BE.get(buf, off),
            revision: Token.INT16_BE.get(buf, off + 2),
            vendor: Token.INT32_BE.get(buf, off + 4)
        };
    }
};
/**
 * Sound Sample Description (Version 0)
 * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-130736
 */
exports.SoundSampleDescriptionV0 = {
    len: 12,
    get(buf, off) {
        return {
            numAudioChannels: Token.INT16_BE.get(buf, off + 0),
            sampleSize: Token.INT16_BE.get(buf, off + 2),
            compressionId: Token.INT16_BE.get(buf, off + 4),
            packetSize: Token.INT16_BE.get(buf, off + 6),
            sampleRate: Token.UINT16_BE.get(buf, off + 8) + Token.UINT16_BE.get(buf, off + 10) / 10000
        };
    }
};
class SimpleTableAtom {
    constructor(len, token) {
        this.len = len;
        this.token = token;
    }
    get(buf, off) {
        const nrOfEntries = Token.INT32_BE.get(buf, off + 4);
        return {
            version: Token.INT8.get(buf, off + 0),
            flags: Token.INT24_BE.get(buf, off + 1),
            numberOfEntries: nrOfEntries,
            entries: readTokenTable(buf, this.token, off + 8, this.len - 8, nrOfEntries)
        };
    }
}
exports.TimeToSampleToken = {
    len: 8,
    get(buf, off) {
        return {
            count: Token.INT32_BE.get(buf, off + 0),
            duration: Token.INT32_BE.get(buf, off + 4)
        };
    }
};
/**
 * Time-to-sample('stts') atom.
 * Store duration information for a media’s samples.
 * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25696
 */
class SttsAtom extends SimpleTableAtom {
    constructor(len) {
        super(len, exports.TimeToSampleToken);
        this.len = len;
    }
}
exports.SttsAtom = SttsAtom;
exports.SampleToChunkToken = {
    len: 12,
    get(buf, off) {
        return {
            firstChunk: Token.INT32_BE.get(buf, off),
            samplesPerChunk: Token.INT32_BE.get(buf, off + 4),
            sampleDescriptionId: Token.INT32_BE.get(buf, off + 8)
        };
    }
};
/**
 * Sample-to-Chunk ('stsc') atom interface
 * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25706
 */
class StscAtom extends SimpleTableAtom {
    constructor(len) {
        super(len, exports.SampleToChunkToken);
        this.len = len;
    }
}
exports.StscAtom = StscAtom;
/**
 * Sample-size ('stsz') atom
 * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25710
 */
class StszAtom {
    constructor(len) {
        this.len = len;
    }
    get(buf, off) {
        const nrOfEntries = Token.INT32_BE.get(buf, off + 8);
        return {
            version: Token.INT8.get(buf, off),
            flags: Token.INT24_BE.get(buf, off + 1),
            sampleSize: Token.INT32_BE.get(buf, off + 4),
            numberOfEntries: nrOfEntries,
            entries: readTokenTable(buf, Token.INT32_BE, off + 12, this.len - 12, nrOfEntries)
        };
    }
}
exports.StszAtom = StszAtom;
/**
 * Chunk offset atom, 'stco'
 * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25715
 */
class StcoAtom extends SimpleTableAtom {
    constructor(len) {
        super(len, Token.INT32_BE);
        this.len = len;
    }
}
exports.StcoAtom = StcoAtom;
/**
 * Token used to decode text-track from 'mdat' atom (raw data stream)
 */
class ChapterText {
    constructor(len) {
        this.len = len;
    }
    get(buf, off) {
        const titleLen = Token.INT16_BE.get(buf, off + 0);
        const str = new Token.StringType(titleLen, 'utf-8');
        return str.get(buf, off + 2);
    }
}
exports.ChapterText = ChapterText;
function readTokenTable(buf, token, off, remainingLen, numberOfEntries) {
    debug(`remainingLen=${remainingLen}, numberOfEntries=${numberOfEntries} * token-len=${token.len}`);
    if (remainingLen === 0)
        return [];
    if (remainingLen !== numberOfEntries * token.len)
        throw new Error('mismatch number-of-entries with remaining atom-length');
    const entries = [];
    // parse offset-table
    for (let n = 0; n < numberOfEntries; ++n) {
        entries.push(token.get(buf, off));
        off += token.len;
    }
    return entries;
}


/***/ }),
/* 78 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MpegParser = void 0;
const Token = __webpack_require__(21);
const core_1 = __webpack_require__(9);
const debug_1 = __webpack_require__(27);
const common = __webpack_require__(46);
const AbstractID3Parser_1 = __webpack_require__(72);
const XingTag_1 = __webpack_require__(79);
const debug = (0, debug_1.default)('music-metadata:parser:mpeg');
/**
 * Cache buffer size used for searching synchronization preabmle
 */
const maxPeekLen = 1024;
/**
 * MPEG-4 Audio definitions
 * Ref:  https://wiki.multimedia.cx/index.php/MPEG-4_Audio
 */
const MPEG4 = {
    /**
     * Audio Object Types
     */
    AudioObjectTypes: [
        'AAC Main',
        'AAC LC',
        'AAC SSR',
        'AAC LTP' // Long Term Prediction
    ],
    /**
     * Sampling Frequencies
     * https://wiki.multimedia.cx/index.php/MPEG-4_Audio#Sampling_Frequencies
     */
    SamplingFrequencies: [
        96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350, undefined, undefined, -1
    ]
    /**
     * Channel Configurations
     */
};
const MPEG4_ChannelConfigurations = [
    undefined,
    ['front-center'],
    ['front-left', 'front-right'],
    ['front-center', 'front-left', 'front-right'],
    ['front-center', 'front-left', 'front-right', 'back-center'],
    ['front-center', 'front-left', 'front-right', 'back-left', 'back-right'],
    ['front-center', 'front-left', 'front-right', 'back-left', 'back-right', 'LFE-channel'],
    ['front-center', 'front-left', 'front-right', 'side-left', 'side-right', 'back-left', 'back-right', 'LFE-channel']
];
/**
 * MPEG Audio Layer I/II/III frame header
 * Ref: https://www.mp3-tech.org/programmer/frame_header.html
 * Bit layout: AAAAAAAA AAABBCCD EEEEFFGH IIJJKLMM
 * Ref: https://wiki.multimedia.cx/index.php/ADTS
 */
class MpegFrameHeader {
    constructor(buf, off) {
        // B(20,19): MPEG Audio versionIndex ID
        this.versionIndex = common.getBitAllignedNumber(buf, off + 1, 3, 2);
        // C(18,17): Layer description
        this.layer = MpegFrameHeader.LayerDescription[common.getBitAllignedNumber(buf, off + 1, 5, 2)];
        if (this.versionIndex > 1 && this.layer === 0) {
            this.parseAdtsHeader(buf, off); // Audio Data Transport Stream (ADTS)
        }
        else {
            this.parseMpegHeader(buf, off); // Conventional MPEG header
        }
        // D(16): Protection bit (if true 16-bit CRC follows header)
        this.isProtectedByCRC = !common.isBitSet(buf, off + 1, 7);
    }
    calcDuration(numFrames) {
        return numFrames * this.calcSamplesPerFrame() / this.samplingRate;
    }
    calcSamplesPerFrame() {
        return MpegFrameHeader.samplesInFrameTable[this.version === 1 ? 0 : 1][this.layer];
    }
    calculateSideInfoLength() {
        if (this.layer !== 3)
            return 2;
        if (this.channelModeIndex === 3) {
            // mono
            if (this.version === 1) {
                return 17;
            }
            else if (this.version === 2 || this.version === 2.5) {
                return 9;
            }
        }
        else {
            if (this.version === 1) {
                return 32;
            }
            else if (this.version === 2 || this.version === 2.5) {
                return 17;
            }
        }
    }
    calcSlotSize() {
        return [null, 4, 1, 1][this.layer];
    }
    parseMpegHeader(buf, off) {
        this.container = 'MPEG';
        // E(15,12): Bitrate index
        this.bitrateIndex = common.getBitAllignedNumber(buf, off + 2, 0, 4);
        // F(11,10): Sampling rate frequency index
        this.sampRateFreqIndex = common.getBitAllignedNumber(buf, off + 2, 4, 2);
        // G(9): Padding bit
        this.padding = common.isBitSet(buf, off + 2, 6);
        // H(8): Private bit
        this.privateBit = common.isBitSet(buf, off + 2, 7);
        // I(7,6): Channel Mode
        this.channelModeIndex = common.getBitAllignedNumber(buf, off + 3, 0, 2);
        // J(5,4): Mode extension (Only used in Joint stereo)
        this.modeExtension = common.getBitAllignedNumber(buf, off + 3, 2, 2);
        // K(3): Copyright
        this.isCopyrighted = common.isBitSet(buf, off + 3, 4);
        // L(2): Original
        this.isOriginalMedia = common.isBitSet(buf, off + 3, 5);
        // M(3): The original bit indicates, if it is set, that the frame is located on its original media.
        this.emphasis = common.getBitAllignedNumber(buf, off + 3, 7, 2);
        this.version = MpegFrameHeader.VersionID[this.versionIndex];
        this.channelMode = MpegFrameHeader.ChannelMode[this.channelModeIndex];
        this.codec = `MPEG ${this.version} Layer ${this.layer}`;
        // Calculate bitrate
        const bitrateInKbps = this.calcBitrate();
        if (!bitrateInKbps) {
            throw new Error('Cannot determine bit-rate');
        }
        this.bitrate = bitrateInKbps * 1000;
        // Calculate sampling rate
        this.samplingRate = this.calcSamplingRate();
        if (this.samplingRate == null) {
            throw new Error('Cannot determine sampling-rate');
        }
    }
    parseAdtsHeader(buf, off) {
        debug(`layer=0 => ADTS`);
        this.version = this.versionIndex === 2 ? 4 : 2;
        this.container = 'ADTS/MPEG-' + this.version;
        const profileIndex = common.getBitAllignedNumber(buf, off + 2, 0, 2);
        this.codec = 'AAC';
        this.codecProfile = MPEG4.AudioObjectTypes[profileIndex];
        debug(`MPEG-4 audio-codec=${this.codec}`);
        const samplingFrequencyIndex = common.getBitAllignedNumber(buf, off + 2, 2, 4);
        this.samplingRate = MPEG4.SamplingFrequencies[samplingFrequencyIndex];
        debug(`sampling-rate=${this.samplingRate}`);
        const channelIndex = common.getBitAllignedNumber(buf, off + 2, 7, 3);
        this.mp4ChannelConfig = MPEG4_ChannelConfigurations[channelIndex];
        debug(`channel-config=${this.mp4ChannelConfig.join('+')}`);
        this.frameLength = common.getBitAllignedNumber(buf, off + 3, 6, 2) << 11;
    }
    calcBitrate() {
        if (this.bitrateIndex === 0x00 || // free
            this.bitrateIndex === 0x0F) { // reserved
            return;
        }
        const codecIndex = `${Math.floor(this.version)}${this.layer}`;
        return MpegFrameHeader.bitrate_index[this.bitrateIndex][codecIndex];
    }
    calcSamplingRate() {
        if (this.sampRateFreqIndex === 0x03)
            return null; // 'reserved'
        return MpegFrameHeader.sampling_rate_freq_index[this.version][this.sampRateFreqIndex];
    }
}
MpegFrameHeader.SyncByte1 = 0xFF;
MpegFrameHeader.SyncByte2 = 0xE0;
MpegFrameHeader.VersionID = [2.5, null, 2, 1];
MpegFrameHeader.LayerDescription = [0, 3, 2, 1];
MpegFrameHeader.ChannelMode = ['stereo', 'joint_stereo', 'dual_channel', 'mono'];
MpegFrameHeader.bitrate_index = {
    0x01: { 11: 32, 12: 32, 13: 32, 21: 32, 22: 8, 23: 8 },
    0x02: { 11: 64, 12: 48, 13: 40, 21: 48, 22: 16, 23: 16 },
    0x03: { 11: 96, 12: 56, 13: 48, 21: 56, 22: 24, 23: 24 },
    0x04: { 11: 128, 12: 64, 13: 56, 21: 64, 22: 32, 23: 32 },
    0x05: { 11: 160, 12: 80, 13: 64, 21: 80, 22: 40, 23: 40 },
    0x06: { 11: 192, 12: 96, 13: 80, 21: 96, 22: 48, 23: 48 },
    0x07: { 11: 224, 12: 112, 13: 96, 21: 112, 22: 56, 23: 56 },
    0x08: { 11: 256, 12: 128, 13: 112, 21: 128, 22: 64, 23: 64 },
    0x09: { 11: 288, 12: 160, 13: 128, 21: 144, 22: 80, 23: 80 },
    0x0A: { 11: 320, 12: 192, 13: 160, 21: 160, 22: 96, 23: 96 },
    0x0B: { 11: 352, 12: 224, 13: 192, 21: 176, 22: 112, 23: 112 },
    0x0C: { 11: 384, 12: 256, 13: 224, 21: 192, 22: 128, 23: 128 },
    0x0D: { 11: 416, 12: 320, 13: 256, 21: 224, 22: 144, 23: 144 },
    0x0E: { 11: 448, 12: 384, 13: 320, 21: 256, 22: 160, 23: 160 }
};
MpegFrameHeader.sampling_rate_freq_index = {
    1: { 0x00: 44100, 0x01: 48000, 0x02: 32000 },
    2: { 0x00: 22050, 0x01: 24000, 0x02: 16000 },
    2.5: { 0x00: 11025, 0x01: 12000, 0x02: 8000 }
};
MpegFrameHeader.samplesInFrameTable = [
    /* Layer   I    II   III */
    [0, 384, 1152, 1152],
    [0, 384, 1152, 576] // MPEG-2(.5
];
/**
 * MPEG Audio Layer I/II/III
 */
const FrameHeader = {
    len: 4,
    get: (buf, off) => {
        return new MpegFrameHeader(buf, off);
    }
};
function getVbrCodecProfile(vbrScale) {
    return 'V' + Math.floor((100 - vbrScale) / 10);
}
class MpegParser extends AbstractID3Parser_1.AbstractID3Parser {
    constructor() {
        super(...arguments);
        this.frameCount = 0;
        this.syncFrameCount = -1;
        this.countSkipFrameData = 0;
        this.totalDataLength = 0;
        this.bitrates = [];
        this.calculateEofDuration = false;
        this.buf_frame_header = Buffer.alloc(4);
        this.syncPeek = {
            buf: Buffer.alloc(maxPeekLen),
            len: 0
        };
    }
    /**
     * Called after ID3 headers have been parsed
     */
    async postId3v2Parse() {
        this.metadata.setFormat('lossless', false);
        try {
            let quit = false;
            while (!quit) {
                await this.sync();
                quit = await this.parseCommonMpegHeader();
            }
        }
        catch (err) {
            if (err instanceof core_1.EndOfStreamError) {
                debug(`End-of-stream`);
                if (this.calculateEofDuration) {
                    const numberOfSamples = this.frameCount * this.samplesPerFrame;
                    this.metadata.setFormat('numberOfSamples', numberOfSamples);
                    const duration = numberOfSamples / this.metadata.format.sampleRate;
                    debug(`Calculate duration at EOF: ${duration} sec.`, duration);
                    this.metadata.setFormat('duration', duration);
                }
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Called after file has been fully parsed, this allows, if present, to exclude the ID3v1.1 header length
     */
    finalize() {
        const format = this.metadata.format;
        const hasID3v1 = this.metadata.native.hasOwnProperty('ID3v1');
        if (format.duration && this.tokenizer.fileInfo.size) {
            const mpegSize = this.tokenizer.fileInfo.size - this.mpegOffset - (hasID3v1 ? 128 : 0);
            if (format.codecProfile && format.codecProfile[0] === 'V') {
                this.metadata.setFormat('bitrate', mpegSize * 8 / format.duration);
            }
        }
        else if (this.tokenizer.fileInfo.size && format.codecProfile === 'CBR') {
            const mpegSize = this.tokenizer.fileInfo.size - this.mpegOffset - (hasID3v1 ? 128 : 0);
            const numberOfSamples = Math.round(mpegSize / this.frame_size) * this.samplesPerFrame;
            this.metadata.setFormat('numberOfSamples', numberOfSamples);
            const duration = numberOfSamples / format.sampleRate;
            debug("Calculate CBR duration based on file size: %s", duration);
            this.metadata.setFormat('duration', duration);
        }
    }
    async sync() {
        let gotFirstSync = false;
        while (true) {
            let bo = 0;
            this.syncPeek.len = await this.tokenizer.peekBuffer(this.syncPeek.buf, { length: maxPeekLen, mayBeLess: true });
            if (this.syncPeek.len <= 163) {
                throw new core_1.EndOfStreamError();
            }
            while (true) {
                if (gotFirstSync && (this.syncPeek.buf[bo] & 0xE0) === 0xE0) {
                    this.buf_frame_header[0] = MpegFrameHeader.SyncByte1;
                    this.buf_frame_header[1] = this.syncPeek.buf[bo];
                    await this.tokenizer.ignore(bo);
                    debug(`Sync at offset=${this.tokenizer.position - 1}, frameCount=${this.frameCount}`);
                    if (this.syncFrameCount === this.frameCount) {
                        debug(`Re-synced MPEG stream, frameCount=${this.frameCount}`);
                        this.frameCount = 0;
                        this.frame_size = 0;
                    }
                    this.syncFrameCount = this.frameCount;
                    return; // sync
                }
                else {
                    gotFirstSync = false;
                    bo = this.syncPeek.buf.indexOf(MpegFrameHeader.SyncByte1, bo);
                    if (bo === -1) {
                        if (this.syncPeek.len < this.syncPeek.buf.length) {
                            throw new core_1.EndOfStreamError();
                        }
                        await this.tokenizer.ignore(this.syncPeek.len);
                        break; // continue with next buffer
                    }
                    else {
                        ++bo;
                        gotFirstSync = true;
                    }
                }
            }
        }
    }
    /**
     * Combined ADTS & MPEG (MP2 & MP3) header handling
     * @return {Promise<boolean>} true if parser should quit
     */
    async parseCommonMpegHeader() {
        if (this.frameCount === 0) {
            this.mpegOffset = this.tokenizer.position - 1;
        }
        await this.tokenizer.peekBuffer(this.buf_frame_header, { offset: 1, length: 3 });
        let header;
        try {
            header = FrameHeader.get(this.buf_frame_header, 0);
        }
        catch (err) {
            await this.tokenizer.ignore(1);
            this.metadata.addWarning('Parse error: ' + err.message);
            return false; // sync
        }
        await this.tokenizer.ignore(3);
        this.metadata.setFormat('container', header.container);
        this.metadata.setFormat('codec', header.codec);
        this.metadata.setFormat('lossless', false);
        this.metadata.setFormat('sampleRate', header.samplingRate);
        this.frameCount++;
        return header.version >= 2 && header.layer === 0 ? this.parseAdts(header) : this.parseAudioFrameHeader(header);
    }
    /**
     * @return {Promise<boolean>} true if parser should quit
     */
    async parseAudioFrameHeader(header) {
        this.metadata.setFormat('numberOfChannels', header.channelMode === 'mono' ? 1 : 2);
        this.metadata.setFormat('bitrate', header.bitrate);
        if (this.frameCount < 20 * 10000) {
            debug('offset=%s MP%s bitrate=%s sample-rate=%s', this.tokenizer.position - 4, header.layer, header.bitrate, header.samplingRate);
        }
        const slot_size = header.calcSlotSize();
        if (slot_size === null) {
            throw new Error('invalid slot_size');
        }
        const samples_per_frame = header.calcSamplesPerFrame();
        debug(`samples_per_frame=${samples_per_frame}`);
        const bps = samples_per_frame / 8.0;
        const fsize = (bps * header.bitrate / header.samplingRate) +
            ((header.padding) ? slot_size : 0);
        this.frame_size = Math.floor(fsize);
        this.audioFrameHeader = header;
        this.bitrates.push(header.bitrate);
        // xtra header only exists in first frame
        if (this.frameCount === 1) {
            this.offset = FrameHeader.len;
            await this.skipSideInformation();
            return false;
        }
        if (this.frameCount === 3) {
            // the stream is CBR if the first 3 frame bitrates are the same
            if (this.areAllSame(this.bitrates)) {
                // Actual calculation will be done in finalize
                this.samplesPerFrame = samples_per_frame;
                this.metadata.setFormat('codecProfile', 'CBR');
                if (this.tokenizer.fileInfo.size)
                    return true; // Will calculate duration based on the file size
            }
            else if (this.metadata.format.duration) {
                return true; // We already got the duration, stop processing MPEG stream any further
            }
            if (!this.options.duration) {
                return true; // Enforce duration not enabled, stop processing entire stream
            }
        }
        // once we know the file is VBR attach listener to end of
        // stream so we can do the duration calculation when we
        // have counted all the frames
        if (this.options.duration && this.frameCount === 4) {
            this.samplesPerFrame = samples_per_frame;
            this.calculateEofDuration = true;
        }
        this.offset = 4;
        if (header.isProtectedByCRC) {
            await this.parseCrc();
            return false;
        }
        else {
            await this.skipSideInformation();
            return false;
        }
    }
    async parseAdts(header) {
        const buf = Buffer.alloc(3);
        await this.tokenizer.readBuffer(buf);
        header.frameLength += common.getBitAllignedNumber(buf, 0, 0, 11);
        this.totalDataLength += header.frameLength;
        this.samplesPerFrame = 1024;
        const framesPerSec = header.samplingRate / this.samplesPerFrame;
        const bytesPerFrame = this.frameCount === 0 ? 0 : this.totalDataLength / this.frameCount;
        const bitrate = 8 * bytesPerFrame * framesPerSec + 0.5;
        this.metadata.setFormat('bitrate', bitrate);
        debug(`frame-count=${this.frameCount}, size=${header.frameLength} bytes, bit-rate=${bitrate}`);
        await this.tokenizer.ignore(header.frameLength > 7 ? header.frameLength - 7 : 1);
        // Consume remaining header and frame data
        if (this.frameCount === 3) {
            this.metadata.setFormat('codecProfile', header.codecProfile);
            if (header.mp4ChannelConfig) {
                this.metadata.setFormat('numberOfChannels', header.mp4ChannelConfig.length);
            }
            if (this.options.duration) {
                this.calculateEofDuration = true;
            }
            else {
                return true; // Stop parsing after the third frame
            }
        }
        return false;
    }
    async parseCrc() {
        this.crc = await this.tokenizer.readNumber(Token.INT16_BE);
        this.offset += 2;
        return this.skipSideInformation();
    }
    async skipSideInformation() {
        const sideinfo_length = this.audioFrameHeader.calculateSideInfoLength();
        // side information
        await this.tokenizer.readToken(new Token.Uint8ArrayType(sideinfo_length));
        this.offset += sideinfo_length;
        await this.readXtraInfoHeader();
        return;
    }
    async readXtraInfoHeader() {
        const headerTag = await this.tokenizer.readToken(XingTag_1.InfoTagHeaderTag);
        this.offset += XingTag_1.InfoTagHeaderTag.len; // 12
        switch (headerTag) {
            case 'Info':
                this.metadata.setFormat('codecProfile', 'CBR');
                return this.readXingInfoHeader();
            case 'Xing':
                const infoTag = await this.readXingInfoHeader();
                const codecProfile = getVbrCodecProfile(infoTag.vbrScale);
                this.metadata.setFormat('codecProfile', codecProfile);
                return null;
            case 'Xtra':
                // ToDo: ???
                break;
            case 'LAME':
                const version = await this.tokenizer.readToken(XingTag_1.LameEncoderVersion);
                if (this.frame_size >= this.offset + XingTag_1.LameEncoderVersion.len) {
                    this.offset += XingTag_1.LameEncoderVersion.len;
                    this.metadata.setFormat('tool', 'LAME ' + version);
                    await this.skipFrameData(this.frame_size - this.offset);
                    return null;
                }
                else {
                    this.metadata.addWarning('Corrupt LAME header');
                    break;
                }
            // ToDo: ???
        }
        // ToDo: promise duration???
        const frameDataLeft = this.frame_size - this.offset;
        if (frameDataLeft < 0) {
            this.metadata.addWarning('Frame ' + this.frameCount + 'corrupt: negative frameDataLeft');
        }
        else {
            await this.skipFrameData(frameDataLeft);
        }
        return null;
    }
    /**
     * Ref: http://gabriel.mp3-tech.org/mp3infotag.html
     * @returns {Promise<string>}
     */
    async readXingInfoHeader() {
        const offset = this.tokenizer.position;
        const infoTag = await (0, XingTag_1.readXingHeader)(this.tokenizer);
        this.offset += this.tokenizer.position - offset;
        if (infoTag.lame) {
            this.metadata.setFormat('tool', 'LAME ' + common.stripNulls(infoTag.lame.version));
            if (infoTag.lame.extended) {
                // this.metadata.setFormat('trackGain', infoTag.lame.extended.track_gain);
                this.metadata.setFormat('trackPeakLevel', infoTag.lame.extended.track_peak);
                if (infoTag.lame.extended.track_gain) {
                    this.metadata.setFormat('trackGain', infoTag.lame.extended.track_gain.adjustment);
                }
                if (infoTag.lame.extended.album_gain) {
                    this.metadata.setFormat('albumGain', infoTag.lame.extended.album_gain.adjustment);
                }
                this.metadata.setFormat('duration', infoTag.lame.extended.music_length / 1000);
            }
        }
        if (infoTag.streamSize) {
            const duration = this.audioFrameHeader.calcDuration(infoTag.numFrames);
            this.metadata.setFormat('duration', duration);
            debug('Get duration from Xing header: %s', this.metadata.format.duration);
            return infoTag;
        }
        // frames field is not present
        const frameDataLeft = this.frame_size - this.offset;
        await this.skipFrameData(frameDataLeft);
        return infoTag;
    }
    async skipFrameData(frameDataLeft) {
        if (frameDataLeft < 0)
            throw new Error('frame-data-left cannot be negative');
        await this.tokenizer.ignore(frameDataLeft);
        this.countSkipFrameData += frameDataLeft;
    }
    areAllSame(array) {
        const first = array[0];
        return array.every(element => {
            return element === first;
        });
    }
}
exports.MpegParser = MpegParser;


/***/ }),
/* 79 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.readXingHeader = exports.XingHeaderFlags = exports.LameEncoderVersion = exports.InfoTagHeaderTag = void 0;
const Token = __webpack_require__(21);
const util = __webpack_require__(46);
const ExtendedLameHeader_1 = __webpack_require__(80);
/**
 * Info Tag: Xing, LAME
 */
exports.InfoTagHeaderTag = new Token.StringType(4, 'ascii');
/**
 * LAME TAG value
 * Did not find any official documentation for this
 * Value e.g.: "3.98.4"
 */
exports.LameEncoderVersion = new Token.StringType(6, 'ascii');
/**
 * Info Tag
 * Ref: http://gabriel.mp3-tech.org/mp3infotag.html
 */
exports.XingHeaderFlags = {
    len: 4,
    get: (buf, off) => {
        return {
            frames: util.isBitSet(buf, off, 31),
            bytes: util.isBitSet(buf, off, 30),
            toc: util.isBitSet(buf, off, 29),
            vbrScale: util.isBitSet(buf, off, 28)
        };
    }
};
// /**
//  * XING Header Tag
//  * Ref: http://gabriel.mp3-tech.org/mp3infotag.html
//  */
async function readXingHeader(tokenizer) {
    const flags = await tokenizer.readToken(exports.XingHeaderFlags);
    const xingInfoTag = {};
    if (flags.frames) {
        xingInfoTag.numFrames = await tokenizer.readToken(Token.UINT32_BE);
    }
    if (flags.bytes) {
        xingInfoTag.streamSize = await tokenizer.readToken(Token.UINT32_BE);
    }
    if (flags.toc) {
        xingInfoTag.toc = Buffer.alloc(100);
        await tokenizer.readBuffer(xingInfoTag.toc);
    }
    if (flags.vbrScale) {
        xingInfoTag.vbrScale = await tokenizer.readToken(Token.UINT32_BE);
    }
    const lameTag = await tokenizer.peekToken(new Token.StringType(4, 'ascii'));
    if (lameTag === 'LAME') {
        await tokenizer.ignore(4);
        xingInfoTag.lame = {
            version: await tokenizer.readToken(new Token.StringType(5, 'ascii'))
        };
        const match = xingInfoTag.lame.version.match(/\d+.\d+/g);
        if (match) {
            const majorMinorVersion = xingInfoTag.lame.version.match(/\d+.\d+/g)[0]; // e.g. 3.97
            const version = majorMinorVersion.split('.').map(n => parseInt(n, 10));
            if (version[0] >= 3 && version[1] >= 90) {
                xingInfoTag.lame.extended = await tokenizer.readToken(ExtendedLameHeader_1.ExtendedLameHeader);
            }
        }
    }
    return xingInfoTag;
}
exports.readXingHeader = readXingHeader;


/***/ }),
/* 80 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

/**
 * Extended Lame Header
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExtendedLameHeader = void 0;
const Token = __webpack_require__(21);
const common = __webpack_require__(46);
const ReplayGainDataFormat_1 = __webpack_require__(81);
/**
 * Info Tag
 * @link http://gabriel.mp3-tech.org/mp3infotag.html
 * @link https://github.com/quodlibet/mutagen/blob/abd58ee58772224334a18817c3fb31103572f70e/mutagen/mp3/_util.py#L112
 */
exports.ExtendedLameHeader = {
    len: 27,
    get: (buf, off) => {
        const track_peak = Token.UINT32_BE.get(buf, off + 2);
        return {
            revision: common.getBitAllignedNumber(buf, off, 0, 4),
            vbr_method: common.getBitAllignedNumber(buf, off, 4, 4),
            lowpass_filter: 100 * Token.UINT8.get(buf, off + 1),
            track_peak: track_peak === 0 ? undefined : track_peak / Math.pow(2, 23),
            track_gain: ReplayGainDataFormat_1.ReplayGain.get(buf, 6),
            album_gain: ReplayGainDataFormat_1.ReplayGain.get(buf, 8),
            music_length: Token.UINT32_BE.get(buf, off + 20),
            music_crc: Token.UINT8.get(buf, off + 24),
            header_crc: Token.UINT16_BE.get(buf, off + 24)
        };
    }
};


/***/ }),
/* 81 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReplayGain = void 0;
const common = __webpack_require__(46);
/**
 * https://github.com/Borewit/music-metadata/wiki/Replay-Gain-Data-Format#name-code
 */
var NameCode;
(function (NameCode) {
    /**
     * not set
     */
    NameCode[NameCode["not_set"] = 0] = "not_set";
    /**
     * Radio Gain Adjustment
     */
    NameCode[NameCode["radio"] = 1] = "radio";
    /**
     * Audiophile Gain Adjustment
     */
    NameCode[NameCode["audiophile"] = 2] = "audiophile";
})(NameCode || (NameCode = {}));
/**
 * https://github.com/Borewit/music-metadata/wiki/Replay-Gain-Data-Format#originator-code
 */
var ReplayGainOriginator;
(function (ReplayGainOriginator) {
    /**
     * Replay Gain unspecified
     */
    ReplayGainOriginator[ReplayGainOriginator["unspecified"] = 0] = "unspecified";
    /**
     * Replay Gain pre-set by artist/producer/mastering engineer
     */
    ReplayGainOriginator[ReplayGainOriginator["engineer"] = 1] = "engineer";
    /**
     * Replay Gain set by user
     */
    ReplayGainOriginator[ReplayGainOriginator["user"] = 2] = "user";
    /**
     * Replay Gain determined automatically, as described on this site
     */
    ReplayGainOriginator[ReplayGainOriginator["automatic"] = 3] = "automatic";
    /**
     * Set by simple RMS average
     */
    ReplayGainOriginator[ReplayGainOriginator["rms_average"] = 4] = "rms_average";
})(ReplayGainOriginator || (ReplayGainOriginator = {}));
/**
 * Replay Gain Data Format
 *
 * https://github.com/Borewit/music-metadata/wiki/Replay-Gain-Data-Format
 */
exports.ReplayGain = {
    len: 2,
    get: (buf, off) => {
        const gain_type = common.getBitAllignedNumber(buf, off, 0, 3);
        const sign = common.getBitAllignedNumber(buf, off, 6, 1);
        const gain_adj = common.getBitAllignedNumber(buf, off, 7, 9) / 10.0;
        if (gain_type > 0) {
            return {
                type: common.getBitAllignedNumber(buf, off, 0, 3),
                origin: common.getBitAllignedNumber(buf, off, 3, 3),
                adjustment: (sign ? -gain_adj : gain_adj)
            };
        }
        return undefined;
    }
};


/***/ }),
/* 82 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const debug_1 = __webpack_require__(27);
const Token = __webpack_require__(21);
const AbstractID3Parser_1 = __webpack_require__(72);
const MpcSv8Parser_1 = __webpack_require__(83);
const MpcSv7Parser_1 = __webpack_require__(85);
const debug = (0, debug_1.default)('music-metadata:parser:musepack');
class MusepackParser extends AbstractID3Parser_1.AbstractID3Parser {
    async postId3v2Parse() {
        const signature = await this.tokenizer.peekToken(new Token.StringType(3, 'binary'));
        let mpcParser;
        switch (signature) {
            case 'MP+': {
                debug('Musepack stream-version 7');
                mpcParser = new MpcSv7Parser_1.MpcSv7Parser();
                break;
            }
            case 'MPC': {
                debug('Musepack stream-version 8');
                mpcParser = new MpcSv8Parser_1.MpcSv8Parser();
                break;
            }
            default: {
                throw new Error('Invalid Musepack signature prefix');
            }
        }
        mpcParser.init(this.metadata, this.tokenizer, this.options);
        return mpcParser.parse();
    }
}
exports["default"] = MusepackParser;


/***/ }),
/* 83 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MpcSv8Parser = void 0;
const debug_1 = __webpack_require__(27);
const BasicParser_1 = __webpack_require__(60);
const APEv2Parser_1 = __webpack_require__(61);
const FourCC_1 = __webpack_require__(63);
const SV8 = __webpack_require__(84);
const debug = (0, debug_1.default)('music-metadata:parser:musepack');
class MpcSv8Parser extends BasicParser_1.BasicParser {
    constructor() {
        super(...arguments);
        this.audioLength = 0;
    }
    async parse() {
        const signature = await this.tokenizer.readToken(FourCC_1.FourCcToken);
        if (signature !== 'MPCK')
            throw new Error('Invalid Magic number');
        this.metadata.setFormat('container', 'Musepack, SV8');
        return this.parsePacket();
    }
    async parsePacket() {
        const sv8reader = new SV8.StreamReader(this.tokenizer);
        do {
            const header = await sv8reader.readPacketHeader();
            debug(`packet-header key=${header.key}, payloadLength=${header.payloadLength}`);
            switch (header.key) {
                case 'SH': // Stream Header
                    const sh = await sv8reader.readStreamHeader(header.payloadLength);
                    this.metadata.setFormat('numberOfSamples', sh.sampleCount);
                    this.metadata.setFormat('sampleRate', sh.sampleFrequency);
                    this.metadata.setFormat('duration', sh.sampleCount / sh.sampleFrequency);
                    this.metadata.setFormat('numberOfChannels', sh.channelCount);
                    break;
                case 'AP': // Audio Packet
                    this.audioLength += header.payloadLength;
                    await this.tokenizer.ignore(header.payloadLength);
                    break;
                case 'RG': // Replaygain
                case 'EI': // Encoder Info
                case 'SO': // Seek Table Offset
                case 'ST': // Seek Table
                case 'CT': // Chapter-Tag
                    await this.tokenizer.ignore(header.payloadLength);
                    break;
                case 'SE': // Stream End
                    this.metadata.setFormat('bitrate', this.audioLength * 8 / this.metadata.format.duration);
                    return APEv2Parser_1.APEv2Parser.tryParseApeHeader(this.metadata, this.tokenizer, this.options);
                default:
                    throw new Error(`Unexpected header: ${header.key}`);
            }
        } while (true);
    }
}
exports.MpcSv8Parser = MpcSv8Parser;


/***/ }),
/* 84 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamReader = void 0;
const Token = __webpack_require__(21);
const debug_1 = __webpack_require__(27);
const util = __webpack_require__(46);
const debug = (0, debug_1.default)('music-metadata:parser:musepack:sv8');
const PacketKey = new Token.StringType(2, 'binary');
/**
 * Stream Header Packet part 1
 * Ref: http://trac.musepack.net/musepack/wiki/SV8Specification#StreamHeaderPacket
 */
const SH_part1 = {
    len: 5,
    get: (buf, off) => {
        return {
            crc: Token.UINT32_LE.get(buf, off),
            streamVersion: Token.UINT8.get(buf, off + 4)
        };
    }
};
/**
 * Stream Header Packet part 3
 * Ref: http://trac.musepack.net/musepack/wiki/SV8Specification#StreamHeaderPacket
 */
const SH_part3 = {
    len: 2,
    get: (buf, off) => {
        return {
            sampleFrequency: [44100, 48000, 37800, 32000][util.getBitAllignedNumber(buf, off, 0, 3)],
            maxUsedBands: util.getBitAllignedNumber(buf, off, 3, 5),
            channelCount: util.getBitAllignedNumber(buf, off + 1, 0, 4) + 1,
            msUsed: util.isBitSet(buf, off + 1, 4),
            audioBlockFrames: util.getBitAllignedNumber(buf, off + 1, 5, 3)
        };
    }
};
class StreamReader {
    constructor(tokenizer) {
        this.tokenizer = tokenizer;
    }
    async readPacketHeader() {
        const key = await this.tokenizer.readToken(PacketKey);
        const size = await this.readVariableSizeField();
        return {
            key,
            payloadLength: size.value - 2 - size.len
        };
    }
    async readStreamHeader(size) {
        const streamHeader = {};
        debug(`Reading SH at offset=${this.tokenizer.position}`);
        const part1 = await this.tokenizer.readToken(SH_part1);
        size -= SH_part1.len;
        Object.assign(streamHeader, part1);
        debug(`SH.streamVersion = ${part1.streamVersion}`);
        const sampleCount = await this.readVariableSizeField();
        size -= sampleCount.len;
        streamHeader.sampleCount = sampleCount.value;
        const bs = await this.readVariableSizeField();
        size -= bs.len;
        streamHeader.beginningOfSilence = bs.value;
        const part3 = await this.tokenizer.readToken(SH_part3);
        size -= SH_part3.len;
        Object.assign(streamHeader, part3);
        // assert.equal(size, 0);
        await this.tokenizer.ignore(size);
        return streamHeader;
    }
    async readVariableSizeField(len = 1, hb = 0) {
        let n = await this.tokenizer.readNumber(Token.UINT8);
        if ((n & 0x80) === 0) {
            return { len, value: hb + n };
        }
        n &= 0x7F;
        n += hb;
        return this.readVariableSizeField(len + 1, n << 7);
    }
}
exports.StreamReader = StreamReader;


/***/ }),
/* 85 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MpcSv7Parser = void 0;
const debug_1 = __webpack_require__(27);
const BasicParser_1 = __webpack_require__(60);
const APEv2Parser_1 = __webpack_require__(61);
const BitReader_1 = __webpack_require__(86);
const SV7 = __webpack_require__(87);
const debug = (0, debug_1.default)('music-metadata:parser:musepack');
class MpcSv7Parser extends BasicParser_1.BasicParser {
    constructor() {
        super(...arguments);
        this.audioLength = 0;
    }
    async parse() {
        const header = await this.tokenizer.readToken(SV7.Header);
        if (header.signature !== 'MP+')
            throw new Error('Unexpected magic number');
        debug(`stream-version=${header.streamMajorVersion}.${header.streamMinorVersion}`);
        this.metadata.setFormat('container', 'Musepack, SV7');
        this.metadata.setFormat('sampleRate', header.sampleFrequency);
        const numberOfSamples = 1152 * (header.frameCount - 1) + header.lastFrameLength;
        this.metadata.setFormat('numberOfSamples', numberOfSamples);
        this.duration = numberOfSamples / header.sampleFrequency;
        this.metadata.setFormat('duration', this.duration);
        this.bitreader = new BitReader_1.BitReader(this.tokenizer);
        this.metadata.setFormat('numberOfChannels', header.midSideStereo || header.intensityStereo ? 2 : 1);
        const version = await this.bitreader.read(8);
        this.metadata.setFormat('codec', (version / 100).toFixed(2));
        await this.skipAudioData(header.frameCount);
        debug(`End of audio stream, switching to APEv2, offset=${this.tokenizer.position}`);
        return APEv2Parser_1.APEv2Parser.tryParseApeHeader(this.metadata, this.tokenizer, this.options);
    }
    async skipAudioData(frameCount) {
        while (frameCount-- > 0) {
            const frameLength = await this.bitreader.read(20);
            this.audioLength += 20 + frameLength;
            await this.bitreader.ignore(frameLength);
        }
        // last frame
        const lastFrameLength = await this.bitreader.read(11);
        this.audioLength += lastFrameLength;
        this.metadata.setFormat('bitrate', this.audioLength / this.duration);
    }
}
exports.MpcSv7Parser = MpcSv7Parser;


/***/ }),
/* 86 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BitReader = void 0;
const Token = __webpack_require__(21);
class BitReader {
    constructor(tokenizer) {
        this.tokenizer = tokenizer;
        this.pos = 0;
        this.dword = undefined;
    }
    /**
     *
     * @param bits 1..30 bits
     */
    async read(bits) {
        while (this.dword === undefined) {
            this.dword = await this.tokenizer.readToken(Token.UINT32_LE);
        }
        let out = this.dword;
        this.pos += bits;
        if (this.pos < 32) {
            out >>>= (32 - this.pos);
            return out & ((1 << bits) - 1);
        }
        else {
            this.pos -= 32;
            if (this.pos === 0) {
                this.dword = undefined;
                return out & ((1 << bits) - 1);
            }
            else {
                this.dword = await this.tokenizer.readToken(Token.UINT32_LE);
                if (this.pos) {
                    out <<= this.pos;
                    out |= this.dword >>> (32 - this.pos);
                }
                return out & ((1 << bits) - 1);
            }
        }
    }
    async ignore(bits) {
        if (this.pos > 0) {
            const remaining = 32 - this.pos;
            this.dword = undefined;
            bits -= remaining;
            this.pos = 0;
        }
        const remainder = bits % 32;
        const numOfWords = (bits - remainder) / 32;
        await this.tokenizer.ignore(numOfWords * 4);
        return this.read(remainder);
    }
}
exports.BitReader = BitReader;


/***/ }),
/* 87 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Header = void 0;
const Token = __webpack_require__(21);
const util = __webpack_require__(46);
/**
 * BASIC STRUCTURE
 */
exports.Header = {
    len: 6 * 4,
    get: (buf, off) => {
        const header = {
            // word 0
            signature: Buffer.from(buf).toString('latin1', off, off + 3),
            // versionIndex number * 1000 (3.81 = 3810) (remember that 4-byte alignment causes this to take 4-bytes)
            streamMinorVersion: util.getBitAllignedNumber(buf, off + 3, 0, 4),
            streamMajorVersion: util.getBitAllignedNumber(buf, off + 3, 4, 4),
            // word 1
            frameCount: Token.UINT32_LE.get(buf, off + 4),
            // word 2
            maxLevel: Token.UINT16_LE.get(buf, off + 8),
            sampleFrequency: [44100, 48000, 37800, 32000][util.getBitAllignedNumber(buf, off + 10, 0, 2)],
            link: util.getBitAllignedNumber(buf, off + 10, 2, 2),
            profile: util.getBitAllignedNumber(buf, off + 10, 4, 4),
            maxBand: util.getBitAllignedNumber(buf, off + 11, 0, 6),
            intensityStereo: util.isBitSet(buf, off + 11, 6),
            midSideStereo: util.isBitSet(buf, off + 11, 7),
            // word 3
            titlePeak: Token.UINT16_LE.get(buf, off + 12),
            titleGain: Token.UINT16_LE.get(buf, off + 14),
            // word 4
            albumPeak: Token.UINT16_LE.get(buf, off + 16),
            albumGain: Token.UINT16_LE.get(buf, off + 18),
            // word
            lastFrameLength: (Token.UINT32_LE.get(buf, off + 20) >>> 20) & 0x7FF,
            trueGapless: util.isBitSet(buf, off + 23, 0)
        };
        header.lastFrameLength = header.trueGapless ? (Token.UINT32_LE.get(buf, 20) >>> 20) & 0x7FF : 0;
        return header;
    }
};


/***/ }),
/* 88 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OggParser = exports.SegmentTable = void 0;
const Token = __webpack_require__(21);
const core_1 = __webpack_require__(9);
const debug_1 = __webpack_require__(27);
const util = __webpack_require__(46);
const FourCC_1 = __webpack_require__(63);
const BasicParser_1 = __webpack_require__(60);
const VorbisParser_1 = __webpack_require__(73);
const OpusParser_1 = __webpack_require__(89);
const SpeexParser_1 = __webpack_require__(91);
const TheoraParser_1 = __webpack_require__(93);
const debug = (0, debug_1.default)('music-metadata:parser:ogg');
class SegmentTable {
    static sum(buf, off, len) {
        let s = 0;
        for (let i = off; i < off + len; ++i) {
            s += buf[i];
        }
        return s;
    }
    constructor(header) {
        this.len = header.page_segments;
    }
    get(buf, off) {
        return {
            totalPageSize: SegmentTable.sum(buf, off, this.len)
        };
    }
}
exports.SegmentTable = SegmentTable;
/**
 * Parser for Ogg logical bitstream framing
 */
class OggParser extends BasicParser_1.BasicParser {
    /**
     * Parse page
     * @returns {Promise<void>}
     */
    async parse() {
        debug('pos=%s, parsePage()', this.tokenizer.position);
        try {
            let header;
            do {
                header = await this.tokenizer.readToken(OggParser.Header);
                if (header.capturePattern !== 'OggS')
                    throw new Error('Invalid Ogg capture pattern');
                this.metadata.setFormat('container', 'Ogg');
                this.header = header;
                this.pageNumber = header.pageSequenceNo;
                debug('page#=%s, Ogg.id=%s', header.pageSequenceNo, header.capturePattern);
                const segmentTable = await this.tokenizer.readToken(new SegmentTable(header));
                debug('totalPageSize=%s', segmentTable.totalPageSize);
                const pageData = await this.tokenizer.readToken(new Token.Uint8ArrayType(segmentTable.totalPageSize));
                debug('firstPage=%s, lastPage=%s, continued=%s', header.headerType.firstPage, header.headerType.lastPage, header.headerType.continued);
                if (header.headerType.firstPage) {
                    const id = new Token.StringType(7, 'ascii').get(Buffer.from(pageData), 0);
                    switch (id) {
                        case '\x01vorbis': // Ogg/Vorbis
                            debug('Set page consumer to Ogg/Vorbis');
                            this.pageConsumer = new VorbisParser_1.VorbisParser(this.metadata, this.options);
                            break;
                        case 'OpusHea': // Ogg/Opus
                            debug('Set page consumer to Ogg/Opus');
                            this.pageConsumer = new OpusParser_1.OpusParser(this.metadata, this.options, this.tokenizer);
                            break;
                        case 'Speex  ': // Ogg/Speex
                            debug('Set page consumer to Ogg/Speex');
                            this.pageConsumer = new SpeexParser_1.SpeexParser(this.metadata, this.options, this.tokenizer);
                            break;
                        case 'fishead':
                        case '\x00theora': // Ogg/Theora
                            debug('Set page consumer to Ogg/Theora');
                            this.pageConsumer = new TheoraParser_1.TheoraParser(this.metadata, this.options, this.tokenizer);
                            break;
                        default:
                            throw new Error('gg audio-codec not recognized (id=' + id + ')');
                    }
                }
                this.pageConsumer.parsePage(header, pageData);
            } while (!header.headerType.lastPage);
        }
        catch (err) {
            if (err instanceof core_1.EndOfStreamError) {
                this.metadata.addWarning('Last OGG-page is not marked with last-page flag');
                debug(`End-of-stream`);
                this.metadata.addWarning('Last OGG-page is not marked with last-page flag');
                if (this.header) {
                    this.pageConsumer.calculateDuration(this.header);
                }
            }
            else if (err.message.startsWith('FourCC')) {
                if (this.pageNumber > 0) {
                    // ignore this error: work-around if last OGG-page is not marked with last-page flag
                    this.metadata.addWarning('Invalid FourCC ID, maybe last OGG-page is not marked with last-page flag');
                    this.pageConsumer.flush();
                }
            }
            else {
                throw err;
            }
        }
    }
}
OggParser.Header = {
    len: 27,
    get: (buf, off) => {
        return {
            capturePattern: FourCC_1.FourCcToken.get(buf, off),
            version: Token.UINT8.get(buf, off + 4),
            headerType: {
                continued: util.getBit(buf, off + 5, 0),
                firstPage: util.getBit(buf, off + 5, 1),
                lastPage: util.getBit(buf, off + 5, 2)
            },
            // packet_flag: buf.readUInt8(off + 5),
            absoluteGranulePosition: Number(Token.UINT64_LE.get(buf, off + 6)),
            streamSerialNumber: Token.UINT32_LE.get(buf, off + 14),
            pageSequenceNo: Token.UINT32_LE.get(buf, off + 18),
            pageChecksum: Token.UINT32_LE.get(buf, off + 22),
            page_segments: Token.UINT8.get(buf, off + 26)
        };
    }
};
exports.OggParser = OggParser;


/***/ }),
/* 89 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OpusParser = void 0;
const Token = __webpack_require__(21);
const VorbisParser_1 = __webpack_require__(73);
const Opus = __webpack_require__(90);
/**
 * Opus parser
 * Internet Engineering Task Force (IETF) - RFC 6716
 * Used by OggParser
 */
class OpusParser extends VorbisParser_1.VorbisParser {
    constructor(metadata, options, tokenizer) {
        super(metadata, options);
        this.tokenizer = tokenizer;
        this.lastPos = -1;
    }
    /**
     * Parse first Opus Ogg page
     * @param {IPageHeader} header
     * @param {Buffer} pageData
     */
    parseFirstPage(header, pageData) {
        this.metadata.setFormat('codec', 'Opus');
        // Parse Opus ID Header
        this.idHeader = new Opus.IdHeader(pageData.length).get(pageData, 0);
        if (this.idHeader.magicSignature !== "OpusHead")
            throw new Error("Illegal ogg/Opus magic-signature");
        this.metadata.setFormat('sampleRate', this.idHeader.inputSampleRate);
        this.metadata.setFormat('numberOfChannels', this.idHeader.channelCount);
    }
    parseFullPage(pageData) {
        const magicSignature = new Token.StringType(8, 'ascii').get(pageData, 0);
        switch (magicSignature) {
            case 'OpusTags':
                this.parseUserCommentList(pageData, 8);
                this.lastPos = this.tokenizer.position - pageData.length;
                break;
            default:
                break;
        }
    }
    calculateDuration(header) {
        if (this.metadata.format.sampleRate && header.absoluteGranulePosition >= 0) {
            // Calculate duration
            const pos_48bit = header.absoluteGranulePosition - this.idHeader.preSkip;
            this.metadata.setFormat('numberOfSamples', pos_48bit);
            this.metadata.setFormat('duration', pos_48bit / 48000);
            if (this.lastPos !== -1 && this.tokenizer.fileInfo.size && this.metadata.format.duration) {
                const dataSize = this.tokenizer.fileInfo.size - this.lastPos;
                this.metadata.setFormat('bitrate', 8 * dataSize / this.metadata.format.duration);
            }
        }
    }
}
exports.OpusParser = OpusParser;


/***/ }),
/* 90 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IdHeader = void 0;
const Token = __webpack_require__(21);
/**
 * Opus ID Header parser
 * Ref: https://wiki.xiph.org/OggOpus#ID_Header
 */
class IdHeader {
    constructor(len) {
        this.len = len;
        if (len < 19) {
            throw new Error("ID-header-page 0 should be at least 19 bytes long");
        }
    }
    get(buf, off) {
        return {
            magicSignature: new Token.StringType(8, 'ascii').get(buf, off + 0),
            version: buf.readUInt8(off + 8),
            channelCount: buf.readUInt8(off + 9),
            preSkip: buf.readInt16LE(off + 10),
            inputSampleRate: buf.readInt32LE(off + 12),
            outputGain: buf.readInt16LE(off + 16),
            channelMapping: buf.readUInt8(off + 18)
        };
    }
}
exports.IdHeader = IdHeader;


/***/ }),
/* 91 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SpeexParser = void 0;
const debug_1 = __webpack_require__(27);
const VorbisParser_1 = __webpack_require__(73);
const Speex = __webpack_require__(92);
const debug = (0, debug_1.default)('music-metadata:parser:ogg:speex');
/**
 * Speex, RFC 5574
 * Ref:
 * - https://www.speex.org/docs/manual/speex-manual/
 * - https://tools.ietf.org/html/rfc5574
 */
class SpeexParser extends VorbisParser_1.VorbisParser {
    constructor(metadata, options, tokenizer) {
        super(metadata, options);
        this.tokenizer = tokenizer;
    }
    /**
     * Parse first Speex Ogg page
     * @param {IPageHeader} header
     * @param {Buffer} pageData
     */
    parseFirstPage(header, pageData) {
        debug('First Ogg/Speex page');
        const speexHeader = Speex.Header.get(pageData, 0);
        this.metadata.setFormat('codec', `Speex ${speexHeader.version}`);
        this.metadata.setFormat('numberOfChannels', speexHeader.nb_channels);
        this.metadata.setFormat('sampleRate', speexHeader.rate);
        if (speexHeader.bitrate !== -1) {
            this.metadata.setFormat('bitrate', speexHeader.bitrate);
        }
    }
}
exports.SpeexParser = SpeexParser;


/***/ }),
/* 92 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Header = void 0;
const Token = __webpack_require__(21);
const util = __webpack_require__(46);
/**
 * Speex Header Packet
 * Ref: https://www.speex.org/docs/manual/speex-manual/node8.html#SECTION00830000000000000000
 */
exports.Header = {
    len: 80,
    get: (buf, off) => {
        return {
            speex: new Token.StringType(8, 'ascii').get(buf, off + 0),
            version: util.trimRightNull(new Token.StringType(20, 'ascii').get(buf, off + 8)),
            version_id: buf.readInt32LE(off + 28),
            header_size: buf.readInt32LE(off + 32),
            rate: buf.readInt32LE(off + 36),
            mode: buf.readInt32LE(off + 40),
            mode_bitstream_version: buf.readInt32LE(off + 44),
            nb_channels: buf.readInt32LE(off + 48),
            bitrate: buf.readInt32LE(off + 52),
            frame_size: buf.readInt32LE(off + 56),
            vbr: buf.readInt32LE(off + 60),
            frames_per_packet: buf.readInt32LE(off + 64),
            extra_headers: buf.readInt32LE(off + 68),
            reserved1: buf.readInt32LE(off + 72),
            reserved2: buf.readInt32LE(off + 76)
        };
    }
};


/***/ }),
/* 93 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TheoraParser = void 0;
const debug_1 = __webpack_require__(27);
const Theora_1 = __webpack_require__(94);
const debug = (0, debug_1.default)('music-metadata:parser:ogg:theora');
/**
 * Ref:
 * - https://theora.org/doc/Theora.pdf
 */
class TheoraParser {
    constructor(metadata, options, tokenizer) {
        this.metadata = metadata;
        this.tokenizer = tokenizer;
    }
    /**
     * Vorbis 1 parser
     * @param header Ogg Page Header
     * @param pageData Page data
     */
    parsePage(header, pageData) {
        if (header.headerType.firstPage) {
            this.parseFirstPage(header, pageData);
        }
    }
    flush() {
        debug('flush');
    }
    calculateDuration(header) {
        debug('duration calculation not implemented');
    }
    /**
     * Parse first Theora Ogg page. the initial identification header packet
     * @param {IPageHeader} header
     * @param {Buffer} pageData
     */
    parseFirstPage(header, pageData) {
        debug('First Ogg/Theora page');
        this.metadata.setFormat('codec', 'Theora');
        const idHeader = Theora_1.IdentificationHeader.get(pageData, 0);
        this.metadata.setFormat('bitrate', idHeader.nombr);
    }
}
exports.TheoraParser = TheoraParser;


/***/ }),
/* 94 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IdentificationHeader = void 0;
const Token = __webpack_require__(21);
/**
 * 6.2 Identification Header
 * Ref: https://theora.org/doc/Theora.pdf: 6.2 Identification Header Decode
 */
exports.IdentificationHeader = {
    len: 42,
    get: (buf, off) => {
        return {
            id: new Token.StringType(7, 'ascii').get(buf, off),
            vmaj: buf.readUInt8(off + 7),
            vmin: buf.readUInt8(off + 8),
            vrev: buf.readUInt8(off + 9),
            vmbw: buf.readUInt16BE(off + 10),
            vmbh: buf.readUInt16BE(off + 17),
            nombr: Token.UINT24_BE.get(buf, off + 37),
            nqual: buf.readUInt8(off + 40)
        };
    }
};


/***/ }),
/* 95 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WaveParser = void 0;
const strtok3 = __webpack_require__(9);
const Token = __webpack_require__(21);
const debug_1 = __webpack_require__(27);
const riff = __webpack_require__(96);
const WaveChunk = __webpack_require__(97);
const ID3v2Parser_1 = __webpack_require__(56);
const util = __webpack_require__(46);
const FourCC_1 = __webpack_require__(63);
const BasicParser_1 = __webpack_require__(60);
const BwfChunk_1 = __webpack_require__(98);
const debug = (0, debug_1.default)('music-metadata:parser:RIFF');
/**
 * Resource Interchange File Format (RIFF) Parser
 *
 * WAVE PCM soundfile format
 *
 * Ref:
 * - http://www.johnloomis.org/cpe102/asgn/asgn1/riff.html
 * - http://soundfile.sapp.org/doc/WaveFormat
 *
 * ToDo: Split WAVE part from RIFF parser
 */
class WaveParser extends BasicParser_1.BasicParser {
    async parse() {
        const riffHeader = await this.tokenizer.readToken(riff.Header);
        debug(`pos=${this.tokenizer.position}, parse: chunkID=${riffHeader.chunkID}`);
        if (riffHeader.chunkID !== 'RIFF')
            return; // Not RIFF format
        return this.parseRiffChunk(riffHeader.chunkSize).catch(err => {
            if (!(err instanceof strtok3.EndOfStreamError)) {
                throw err;
            }
        });
    }
    async parseRiffChunk(chunkSize) {
        const type = await this.tokenizer.readToken(FourCC_1.FourCcToken);
        this.metadata.setFormat('container', type);
        switch (type) {
            case 'WAVE':
                return this.readWaveChunk(chunkSize - FourCC_1.FourCcToken.len);
            default:
                throw new Error(`Unsupported RIFF format: RIFF/${type}`);
        }
    }
    async readWaveChunk(remaining) {
        while (remaining >= riff.Header.len) {
            const header = await this.tokenizer.readToken(riff.Header);
            remaining -= riff.Header.len + header.chunkSize;
            if (header.chunkSize > remaining) {
                this.metadata.addWarning('Data chunk size exceeds file size');
            }
            this.header = header;
            debug(`pos=${this.tokenizer.position}, readChunk: chunkID=RIFF/WAVE/${header.chunkID}`);
            switch (header.chunkID) {
                case 'LIST':
                    await this.parseListTag(header);
                    break;
                case 'fact': // extended Format chunk,
                    this.metadata.setFormat('lossless', false);
                    this.fact = await this.tokenizer.readToken(new WaveChunk.FactChunk(header));
                    break;
                case 'fmt ': // The Util Chunk, non-PCM Formats
                    const fmt = await this.tokenizer.readToken(new WaveChunk.Format(header));
                    let subFormat = WaveChunk.WaveFormat[fmt.wFormatTag];
                    if (!subFormat) {
                        debug('WAVE/non-PCM format=' + fmt.wFormatTag);
                        subFormat = 'non-PCM (' + fmt.wFormatTag + ')';
                    }
                    this.metadata.setFormat('codec', subFormat);
                    this.metadata.setFormat('bitsPerSample', fmt.wBitsPerSample);
                    this.metadata.setFormat('sampleRate', fmt.nSamplesPerSec);
                    this.metadata.setFormat('numberOfChannels', fmt.nChannels);
                    this.metadata.setFormat('bitrate', fmt.nBlockAlign * fmt.nSamplesPerSec * 8);
                    this.blockAlign = fmt.nBlockAlign;
                    break;
                case 'id3 ': // The way Picard, FooBar currently stores, ID3 meta-data
                case 'ID3 ': // The way Mp3Tags stores ID3 meta-data
                    const id3_data = await this.tokenizer.readToken(new Token.Uint8ArrayType(header.chunkSize));
                    const rst = strtok3.fromBuffer(id3_data);
                    await new ID3v2Parser_1.ID3v2Parser().parse(this.metadata, rst, this.options);
                    break;
                case 'data': // PCM-data
                    if (this.metadata.format.lossless !== false) {
                        this.metadata.setFormat('lossless', true);
                    }
                    let chunkSize = header.chunkSize;
                    if (this.tokenizer.fileInfo.size) {
                        const calcRemaining = this.tokenizer.fileInfo.size - this.tokenizer.position;
                        if (calcRemaining < chunkSize) {
                            this.metadata.addWarning('data chunk length exceeding file length');
                            chunkSize = calcRemaining;
                        }
                    }
                    const numberOfSamples = this.fact ? this.fact.dwSampleLength : (chunkSize === 0xffffffff ? undefined : chunkSize / this.blockAlign);
                    if (numberOfSamples) {
                        this.metadata.setFormat('numberOfSamples', numberOfSamples);
                        this.metadata.setFormat('duration', numberOfSamples / this.metadata.format.sampleRate);
                    }
                    if (this.metadata.format.codec === 'ADPCM') { // ADPCM is 4 bits lossy encoding resulting in 352kbps
                        this.metadata.setFormat('bitrate', 352000);
                    }
                    else {
                        this.metadata.setFormat('bitrate', this.blockAlign * this.metadata.format.sampleRate * 8);
                    }
                    await this.tokenizer.ignore(header.chunkSize);
                    break;
                case 'bext': // Broadcast Audio Extension chunk	https://tech.ebu.ch/docs/tech/tech3285.pdf
                    const bext = await this.tokenizer.readToken(BwfChunk_1.BroadcastAudioExtensionChunk);
                    Object.keys(bext).forEach(key => {
                        this.metadata.addTag('exif', 'bext.' + key, bext[key]);
                    });
                    const bextRemaining = header.chunkSize - BwfChunk_1.BroadcastAudioExtensionChunk.len;
                    await this.tokenizer.ignore(bextRemaining);
                    break;
                case '\x00\x00\x00\x00': // padding ??
                    debug(`Ignore padding chunk: RIFF/${header.chunkID} of ${header.chunkSize} bytes`);
                    this.metadata.addWarning('Ignore chunk: RIFF/' + header.chunkID);
                    await this.tokenizer.ignore(header.chunkSize);
                    break;
                default:
                    debug(`Ignore chunk: RIFF/${header.chunkID} of ${header.chunkSize} bytes`);
                    this.metadata.addWarning('Ignore chunk: RIFF/' + header.chunkID);
                    await this.tokenizer.ignore(header.chunkSize);
            }
            if (this.header.chunkSize % 2 === 1) {
                debug('Read odd padding byte'); // https://wiki.multimedia.cx/index.php/RIFF
                await this.tokenizer.ignore(1);
            }
        }
    }
    async parseListTag(listHeader) {
        const listType = await this.tokenizer.readToken(new Token.StringType(4, 'binary'));
        debug('pos=%s, parseListTag: chunkID=RIFF/WAVE/LIST/%s', this.tokenizer.position, listType);
        switch (listType) {
            case 'INFO':
                return this.parseRiffInfoTags(listHeader.chunkSize - 4);
            case 'adtl':
            default:
                this.metadata.addWarning('Ignore chunk: RIFF/WAVE/LIST/' + listType);
                debug('Ignoring chunkID=RIFF/WAVE/LIST/' + listType);
                return this.tokenizer.ignore(listHeader.chunkSize - 4).then();
        }
    }
    async parseRiffInfoTags(chunkSize) {
        while (chunkSize >= 8) {
            const header = await this.tokenizer.readToken(riff.Header);
            const valueToken = new riff.ListInfoTagValue(header);
            const value = await this.tokenizer.readToken(valueToken);
            this.addTag(header.chunkID, util.stripNulls(value));
            chunkSize -= (8 + valueToken.len);
        }
        if (chunkSize !== 0) {
            throw Error('Illegal remaining size: ' + chunkSize);
        }
    }
    addTag(id, value) {
        this.metadata.addTag('exif', id, value);
    }
}
exports.WaveParser = WaveParser;


/***/ }),
/* 96 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListInfoTagValue = exports.Header = void 0;
const Token = __webpack_require__(21);
/**
 * Common RIFF chunk header
 */
exports.Header = {
    len: 8,
    get: (buf, off) => {
        return {
            // Group-ID
            chunkID: buf.toString('binary', off, off + 4),
            // Size
            chunkSize: Token.UINT32_LE.get(buf, 4)
        };
    }
};
/**
 * Token to parse RIFF-INFO tag value
 */
class ListInfoTagValue {
    constructor(tagHeader) {
        this.tagHeader = tagHeader;
        this.len = tagHeader.chunkSize;
        this.len += this.len & 1; // if it is an odd length, round up to even
    }
    get(buf, off) {
        return new Token.StringType(this.tagHeader.chunkSize, 'ascii').get(buf, off);
    }
}
exports.ListInfoTagValue = ListInfoTagValue;


/***/ }),
/* 97 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FactChunk = exports.Format = exports.WaveFormat = void 0;
/**
 * Ref: https://msdn.microsoft.com/en-us/library/windows/desktop/dd317599(v=vs.85).aspx
 */
var WaveFormat;
(function (WaveFormat) {
    WaveFormat[WaveFormat["PCM"] = 1] = "PCM";
    // MPEG-4 and AAC Audio Types
    WaveFormat[WaveFormat["ADPCM"] = 2] = "ADPCM";
    WaveFormat[WaveFormat["IEEE_FLOAT"] = 3] = "IEEE_FLOAT";
    WaveFormat[WaveFormat["MPEG_ADTS_AAC"] = 5632] = "MPEG_ADTS_AAC";
    WaveFormat[WaveFormat["MPEG_LOAS"] = 5634] = "MPEG_LOAS";
    WaveFormat[WaveFormat["RAW_AAC1"] = 255] = "RAW_AAC1";
    // Dolby Audio Types
    WaveFormat[WaveFormat["DOLBY_AC3_SPDIF"] = 146] = "DOLBY_AC3_SPDIF";
    WaveFormat[WaveFormat["DVM"] = 8192] = "DVM";
    WaveFormat[WaveFormat["RAW_SPORT"] = 576] = "RAW_SPORT";
    WaveFormat[WaveFormat["ESST_AC3"] = 577] = "ESST_AC3";
    WaveFormat[WaveFormat["DRM"] = 9] = "DRM";
    WaveFormat[WaveFormat["DTS2"] = 8193] = "DTS2";
    WaveFormat[WaveFormat["MPEG"] = 80] = "MPEG";
})(WaveFormat = exports.WaveFormat || (exports.WaveFormat = {}));
/**
 * format chunk; chunk-id is "fmt "
 * http://soundfile.sapp.org/doc/WaveFormat/
 */
class Format {
    constructor(header) {
        if (header.chunkSize < 16)
            throw new Error('Invalid chunk size');
        this.len = header.chunkSize;
    }
    get(buf, off) {
        return {
            wFormatTag: buf.readUInt16LE(off),
            nChannels: buf.readUInt16LE(off + 2),
            nSamplesPerSec: buf.readUInt32LE(off + 4),
            nAvgBytesPerSec: buf.readUInt32LE(off + 8),
            nBlockAlign: buf.readUInt16LE(off + 12),
            wBitsPerSample: buf.readUInt16LE(off + 14)
        };
    }
}
exports.Format = Format;
/**
 * Fact chunk; chunk-id is "fact"
 * http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
 * http://www.recordingblogs.com/wiki/fact-chunk-of-a-wave-file
 */
class FactChunk {
    constructor(header) {
        if (header.chunkSize < 4) {
            throw new Error('Invalid fact chunk size.');
        }
        this.len = header.chunkSize;
    }
    get(buf, off) {
        return {
            dwSampleLength: buf.readUInt32LE(off)
        };
    }
}
exports.FactChunk = FactChunk;


/***/ }),
/* 98 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BroadcastAudioExtensionChunk = void 0;
const Token = __webpack_require__(21);
const Util_1 = __webpack_require__(46);
/**
 * Broadcast Audio Extension Chunk
 * Ref: https://tech.ebu.ch/docs/tech/tech3285.pdf
 */
exports.BroadcastAudioExtensionChunk = {
    len: 420,
    get: (uint8array, off) => {
        return {
            description: (0, Util_1.stripNulls)(new Token.StringType(256, 'ascii').get(uint8array, off)).trim(),
            originator: (0, Util_1.stripNulls)(new Token.StringType(32, 'ascii').get(uint8array, off + 256)).trim(),
            originatorReference: (0, Util_1.stripNulls)(new Token.StringType(32, 'ascii').get(uint8array, off + 288)).trim(),
            originationDate: (0, Util_1.stripNulls)(new Token.StringType(10, 'ascii').get(uint8array, off + 320)).trim(),
            originationTime: (0, Util_1.stripNulls)(new Token.StringType(8, 'ascii').get(uint8array, off + 330)).trim(),
            timeReferenceLow: Token.UINT32_LE.get(uint8array, off + 338),
            timeReferenceHigh: Token.UINT32_LE.get(uint8array, off + 342),
            version: Token.UINT16_LE.get(uint8array, off + 346),
            umid: new Token.Uint8ArrayType(64).get(uint8array, off + 348),
            loudnessValue: Token.UINT16_LE.get(uint8array, off + 412),
            maxTruePeakLevel: Token.UINT16_LE.get(uint8array, off + 414),
            maxMomentaryLoudness: Token.UINT16_LE.get(uint8array, off + 416),
            maxShortTermLoudness: Token.UINT16_LE.get(uint8array, off + 418)
        };
    }
};


/***/ }),
/* 99 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WavPackParser = void 0;
const Token = __webpack_require__(21);
const APEv2Parser_1 = __webpack_require__(61);
const FourCC_1 = __webpack_require__(63);
const BasicParser_1 = __webpack_require__(60);
const WavPackToken_1 = __webpack_require__(100);
const debug_1 = __webpack_require__(27);
const debug = (0, debug_1.default)('music-metadata:parser:WavPack');
/**
 * WavPack Parser
 */
class WavPackParser extends BasicParser_1.BasicParser {
    async parse() {
        this.audioDataSize = 0;
        // First parse all WavPack blocks
        await this.parseWavPackBlocks();
        // try to parse APEv2 header
        return APEv2Parser_1.APEv2Parser.tryParseApeHeader(this.metadata, this.tokenizer, this.options);
    }
    async parseWavPackBlocks() {
        do {
            const blockId = await this.tokenizer.peekToken(FourCC_1.FourCcToken);
            if (blockId !== 'wvpk')
                break;
            const header = await this.tokenizer.readToken(WavPackToken_1.WavPack.BlockHeaderToken);
            if (header.BlockID !== 'wvpk')
                throw new Error('Invalid WavPack Block-ID');
            debug(`WavPack header blockIndex=${header.blockIndex}, len=${WavPackToken_1.WavPack.BlockHeaderToken.len}`);
            if (header.blockIndex === 0 && !this.metadata.format.container) {
                this.metadata.setFormat('container', 'WavPack');
                this.metadata.setFormat('lossless', !header.flags.isHybrid);
                // tagTypes: this.type,
                this.metadata.setFormat('bitsPerSample', header.flags.bitsPerSample);
                if (!header.flags.isDSD) {
                    // In case isDSD, these values will ne set in ID_DSD_BLOCK
                    this.metadata.setFormat('sampleRate', header.flags.samplingRate);
                    this.metadata.setFormat('duration', header.totalSamples / header.flags.samplingRate);
                }
                this.metadata.setFormat('numberOfChannels', header.flags.isMono ? 1 : 2);
                this.metadata.setFormat('numberOfSamples', header.totalSamples);
                this.metadata.setFormat('codec', header.flags.isDSD ? 'DSD' : 'PCM');
            }
            const ignoreBytes = header.blockSize - (WavPackToken_1.WavPack.BlockHeaderToken.len - 8);
            await (header.blockIndex === 0 ? this.parseMetadataSubBlock(header, ignoreBytes) : this.tokenizer.ignore(ignoreBytes));
            if (header.blockSamples > 0) {
                this.audioDataSize += header.blockSize; // Count audio data for bit-rate calculation
            }
        } while (!this.tokenizer.fileInfo.size || this.tokenizer.fileInfo.size - this.tokenizer.position >= WavPackToken_1.WavPack.BlockHeaderToken.len);
        this.metadata.setFormat('bitrate', this.audioDataSize * 8 / this.metadata.format.duration);
    }
    /**
     * Ref: http://www.wavpack.com/WavPack5FileFormat.pdf, 3.0 Metadata Sub-blocks
     * @param remainingLength
     */
    async parseMetadataSubBlock(header, remainingLength) {
        while (remainingLength > WavPackToken_1.WavPack.MetadataIdToken.len) {
            const id = await this.tokenizer.readToken(WavPackToken_1.WavPack.MetadataIdToken);
            const dataSizeInWords = await this.tokenizer.readNumber(id.largeBlock ? Token.UINT24_LE : Token.UINT8);
            const data = Buffer.alloc(dataSizeInWords * 2 - (id.isOddSize ? 1 : 0));
            await this.tokenizer.readBuffer(data);
            debug(`Metadata Sub-Blocks functionId=0x${id.functionId.toString(16)}, id.largeBlock=${id.largeBlock},data-size=${data.length}`);
            switch (id.functionId) {
                case 0x0: // ID_DUMMY: could be used to pad WavPack blocks
                    break;
                case 0xe: // ID_DSD_BLOCK
                    debug('ID_DSD_BLOCK');
                    // https://github.com/dbry/WavPack/issues/71#issuecomment-483094813
                    const mp = 1 << data.readUInt8(0);
                    const samplingRate = header.flags.samplingRate * mp * 8; // ToDo: second factor should be read from DSD-metadata block https://github.com/dbry/WavPack/issues/71#issuecomment-483094813
                    if (!header.flags.isDSD)
                        throw new Error('Only expect DSD block if DSD-flag is set');
                    this.metadata.setFormat('sampleRate', samplingRate);
                    this.metadata.setFormat('duration', header.totalSamples / samplingRate);
                    break;
                case 0x24: // ID_ALT_TRAILER: maybe used to embed original ID3 tag header
                    debug('ID_ALT_TRAILER: trailer for non-wav files');
                    break;
                case 0x26: // ID_MD5_CHECKSUM
                    this.metadata.setFormat('audioMD5', data);
                    break;
                case 0x2f: // ID_BLOCK_CHECKSUM
                    debug(`ID_BLOCK_CHECKSUM: checksum=${data.toString('hex')}`);
                    break;
                default:
                    debug(`Ignore unsupported meta-sub-block-id functionId=0x${id.functionId.toString(16)}`);
                    break;
            }
            remainingLength -= WavPackToken_1.WavPack.MetadataIdToken.len + (id.largeBlock ? Token.UINT24_LE.len : Token.UINT8.len) + dataSizeInWords * 2;
            debug(`remainingLength=${remainingLength}`);
            if (id.isOddSize)
                this.tokenizer.ignore(1);
        }
        if (remainingLength !== 0)
            throw new Error('metadata-sub-block should fit it remaining length');
    }
}
exports.WavPackParser = WavPackParser;


/***/ }),
/* 100 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WavPack = void 0;
const Token = __webpack_require__(21);
const FourCC_1 = __webpack_require__(63);
const SampleRates = [6000, 8000, 9600, 11025, 12000, 16000, 22050, 24000, 32000, 44100,
    48000, 64000, 88200, 96000, 192000, -1];
class WavPack {
    static isBitSet(flags, bitOffset) {
        return WavPack.getBitAllignedNumber(flags, bitOffset, 1) === 1;
    }
    static getBitAllignedNumber(flags, bitOffset, len) {
        return (flags >>> bitOffset) & (0xffffffff >>> (32 - len));
    }
}
/**
 * WavPack Block Header
 *
 * 32-byte little-endian header at the front of every WavPack block
 *
 * Ref: http://www.wavpack.com/WavPack5FileFormat.pdf (page 2/6: 2.0 "Block Header")
 */
WavPack.BlockHeaderToken = {
    len: 32,
    get: (buf, off) => {
        const flags = Token.UINT32_LE.get(buf, off + 24);
        const res = {
            // should equal 'wvpk'
            BlockID: FourCC_1.FourCcToken.get(buf, off),
            //  0x402 to 0x410 are valid for decode
            blockSize: Token.UINT32_LE.get(buf, off + 4),
            //  0x402 (1026) to 0x410 are valid for decode
            version: Token.UINT16_LE.get(buf, off + 8),
            //  40-bit total samples for entire file (if block_index == 0 and a value of -1 indicates an unknown length)
            totalSamples: /* replace with bigint? (Token.UINT8.get(buf, off + 11) << 32) + */ Token.UINT32_LE.get(buf, off + 12),
            // 40-bit block_index
            blockIndex: /* replace with bigint? (Token.UINT8.get(buf, off + 10) << 32) + */ Token.UINT32_LE.get(buf, off + 16),
            // 40-bit total samples for entire file (if block_index == 0 and a value of -1 indicates an unknown length)
            blockSamples: Token.UINT32_LE.get(buf, off + 20),
            // various flags for id and decoding
            flags: {
                bitsPerSample: (1 + WavPack.getBitAllignedNumber(flags, 0, 2)) * 8,
                isMono: WavPack.isBitSet(flags, 2),
                isHybrid: WavPack.isBitSet(flags, 3),
                isJointStereo: WavPack.isBitSet(flags, 4),
                crossChannel: WavPack.isBitSet(flags, 5),
                hybridNoiseShaping: WavPack.isBitSet(flags, 6),
                floatingPoint: WavPack.isBitSet(flags, 7),
                samplingRate: SampleRates[WavPack.getBitAllignedNumber(flags, 23, 4)],
                isDSD: WavPack.isBitSet(flags, 31)
            },
            // crc for actual decoded data
            crc: new Token.Uint8ArrayType(4).get(buf, off + 28)
        };
        if (res.flags.isDSD) {
            res.totalSamples *= 8;
        }
        return res;
    }
};
/**
 * 3.0 Metadata Sub-Blocks
 * Ref: http://www.wavpack.com/WavPack5FileFormat.pdf (page 4/6: 3.0 "Metadata Sub-Block")
 */
WavPack.MetadataIdToken = {
    len: 1,
    get: (buf, off) => {
        return {
            functionId: WavPack.getBitAllignedNumber(buf[off], 0, 6),
            isOptional: WavPack.isBitSet(buf[off], 5),
            isOddSize: WavPack.isBitSet(buf[off], 6),
            largeBlock: WavPack.isBitSet(buf[off], 7)
        };
    }
};
exports.WavPack = WavPack;


/***/ }),
/* 101 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DsfParser = void 0;
const debug_1 = __webpack_require__(27);
const AbstractID3Parser_1 = __webpack_require__(72);
const DsfChunk_1 = __webpack_require__(102);
const ID3v2Parser_1 = __webpack_require__(56);
const debug = (0, debug_1.default)('music-metadata:parser:DSF');
/**
 * DSF (dsd stream file) File Parser
 * Ref: https://dsd-guide.com/sites/default/files/white-papers/DSFFileFormatSpec_E.pdf
 */
class DsfParser extends AbstractID3Parser_1.AbstractID3Parser {
    async postId3v2Parse() {
        const p0 = this.tokenizer.position; // mark start position, normally 0
        const chunkHeader = await this.tokenizer.readToken(DsfChunk_1.ChunkHeader);
        if (chunkHeader.id !== 'DSD ')
            throw new Error('Invalid chunk signature');
        this.metadata.setFormat('container', 'DSF');
        this.metadata.setFormat('lossless', true);
        const dsdChunk = await this.tokenizer.readToken(DsfChunk_1.DsdChunk);
        if (dsdChunk.metadataPointer === BigInt(0)) {
            debug(`No ID3v2 tag present`);
        }
        else {
            debug(`expect ID3v2 at offset=${dsdChunk.metadataPointer}`);
            await this.parseChunks(dsdChunk.fileSize - chunkHeader.size);
            // Jump to ID3 header
            await this.tokenizer.ignore(Number(dsdChunk.metadataPointer) - this.tokenizer.position - p0);
            return new ID3v2Parser_1.ID3v2Parser().parse(this.metadata, this.tokenizer, this.options);
        }
    }
    async parseChunks(bytesRemaining) {
        while (bytesRemaining >= DsfChunk_1.ChunkHeader.len) {
            const chunkHeader = await this.tokenizer.readToken(DsfChunk_1.ChunkHeader);
            debug(`Parsing chunk name=${chunkHeader.id} size=${chunkHeader.size}`);
            switch (chunkHeader.id) {
                case 'fmt ':
                    const formatChunk = await this.tokenizer.readToken(DsfChunk_1.FormatChunk);
                    this.metadata.setFormat('numberOfChannels', formatChunk.channelNum);
                    this.metadata.setFormat('sampleRate', formatChunk.samplingFrequency);
                    this.metadata.setFormat('bitsPerSample', formatChunk.bitsPerSample);
                    this.metadata.setFormat('numberOfSamples', formatChunk.sampleCount);
                    this.metadata.setFormat('duration', Number(formatChunk.sampleCount) / formatChunk.samplingFrequency);
                    const bitrate = formatChunk.bitsPerSample * formatChunk.samplingFrequency * formatChunk.channelNum;
                    this.metadata.setFormat('bitrate', bitrate);
                    return; // We got what we want, stop further processing of chunks
                default:
                    this.tokenizer.ignore(Number(chunkHeader.size) - DsfChunk_1.ChunkHeader.len);
                    break;
            }
            bytesRemaining -= chunkHeader.size;
        }
    }
}
exports.DsfParser = DsfParser;


/***/ }),
/* 102 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FormatChunk = exports.ChannelType = exports.DsdChunk = exports.ChunkHeader = void 0;
const Token = __webpack_require__(21);
const FourCC_1 = __webpack_require__(63);
/**
 * Common chunk DSD header: the 'chunk name (Four-CC)' & chunk size
 */
exports.ChunkHeader = {
    len: 12,
    get: (buf, off) => {
        return { id: FourCC_1.FourCcToken.get(buf, off), size: Token.UINT64_LE.get(buf, off + 4) };
    }
};
/**
 * Common chunk DSD header: the 'chunk name (Four-CC)' & chunk size
 */
exports.DsdChunk = {
    len: 16,
    get: (buf, off) => {
        return {
            fileSize: Token.INT64_LE.get(buf, off),
            metadataPointer: Token.INT64_LE.get(buf, off + 8)
        };
    }
};
var ChannelType;
(function (ChannelType) {
    ChannelType[ChannelType["mono"] = 1] = "mono";
    ChannelType[ChannelType["stereo"] = 2] = "stereo";
    ChannelType[ChannelType["channels"] = 3] = "channels";
    ChannelType[ChannelType["quad"] = 4] = "quad";
    ChannelType[ChannelType["4 channels"] = 5] = "4 channels";
    ChannelType[ChannelType["5 channels"] = 6] = "5 channels";
    ChannelType[ChannelType["5.1 channels"] = 7] = "5.1 channels";
})(ChannelType = exports.ChannelType || (exports.ChannelType = {}));
/**
 * Common chunk DSD header: the 'chunk name (Four-CC)' & chunk size
 */
exports.FormatChunk = {
    len: 40,
    get: (buf, off) => {
        return {
            formatVersion: Token.INT32_LE.get(buf, off),
            formatID: Token.INT32_LE.get(buf, off + 4),
            channelType: Token.INT32_LE.get(buf, off + 8),
            channelNum: Token.INT32_LE.get(buf, off + 12),
            samplingFrequency: Token.INT32_LE.get(buf, off + 16),
            bitsPerSample: Token.INT32_LE.get(buf, off + 20),
            sampleCount: Token.INT64_LE.get(buf, off + 24),
            blockSizePerChannel: Token.INT32_LE.get(buf, off + 32)
        };
    }
};


/***/ }),
/* 103 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DsdiffParser = void 0;
const Token = __webpack_require__(21);
const debug_1 = __webpack_require__(27);
const strtok3 = __webpack_require__(9);
const FourCC_1 = __webpack_require__(63);
const BasicParser_1 = __webpack_require__(60);
const ID3v2Parser_1 = __webpack_require__(56);
const DsdiffToken_1 = __webpack_require__(104);
const debug = (0, debug_1.default)('music-metadata:parser:aiff');
/**
 * DSDIFF - Direct Stream Digital Interchange File Format (Phillips)
 *
 * Ref:
 * - http://www.sonicstudio.com/pdf/dsd/DSDIFF_1.5_Spec.pdf
 */
class DsdiffParser extends BasicParser_1.BasicParser {
    async parse() {
        const header = await this.tokenizer.readToken(DsdiffToken_1.ChunkHeader64);
        if (header.chunkID !== 'FRM8')
            throw new Error('Unexpected chunk-ID');
        const type = (await this.tokenizer.readToken(FourCC_1.FourCcToken)).trim();
        switch (type) {
            case 'DSD':
                this.metadata.setFormat('container', `DSDIFF/${type}`);
                this.metadata.setFormat('lossless', true);
                return this.readFmt8Chunks(header.chunkSize - BigInt(FourCC_1.FourCcToken.len));
            default:
                throw Error(`Unsupported DSDIFF type: ${type}`);
        }
    }
    async readFmt8Chunks(remainingSize) {
        while (remainingSize >= DsdiffToken_1.ChunkHeader64.len) {
            const chunkHeader = await this.tokenizer.readToken(DsdiffToken_1.ChunkHeader64);
            //  If the data is an odd number of bytes in length, a pad byte must be added at the end
            debug(`Chunk id=${chunkHeader.chunkID}`);
            await this.readData(chunkHeader);
            remainingSize -= (BigInt(DsdiffToken_1.ChunkHeader64.len) + chunkHeader.chunkSize);
        }
    }
    async readData(header) {
        debug(`Reading data of chunk[ID=${header.chunkID}, size=${header.chunkSize}]`);
        const p0 = this.tokenizer.position;
        switch (header.chunkID.trim()) {
            case 'FVER': // 3.1 FORMAT VERSION CHUNK
                const version = await this.tokenizer.readToken(Token.UINT32_LE);
                debug(`DSDIFF version=${version}`);
                break;
            case 'PROP': // 3.2 PROPERTY CHUNK
                const propType = await this.tokenizer.readToken(FourCC_1.FourCcToken);
                if (propType !== 'SND ')
                    throw new Error('Unexpected PROP-chunk ID');
                await this.handleSoundPropertyChunks(header.chunkSize - BigInt(FourCC_1.FourCcToken.len));
                break;
            case 'ID3': // Unofficial ID3 tag support
                const id3_data = await this.tokenizer.readToken(new Token.Uint8ArrayType(Number(header.chunkSize)));
                const rst = strtok3.fromBuffer(id3_data);
                await new ID3v2Parser_1.ID3v2Parser().parse(this.metadata, rst, this.options);
                break;
            default:
                debug(`Ignore chunk[ID=${header.chunkID}, size=${header.chunkSize}]`);
                break;
            case 'DSD':
                this.metadata.setFormat('numberOfSamples', Number(header.chunkSize * BigInt(8) / BigInt(this.metadata.format.numberOfChannels)));
                this.metadata.setFormat('duration', this.metadata.format.numberOfSamples / this.metadata.format.sampleRate);
                break;
        }
        const remaining = header.chunkSize - BigInt(this.tokenizer.position - p0);
        if (remaining > 0) {
            debug(`After Parsing chunk, remaining ${remaining} bytes`);
            await this.tokenizer.ignore(Number(remaining));
        }
    }
    async handleSoundPropertyChunks(remainingSize) {
        debug(`Parsing sound-property-chunks, remainingSize=${remainingSize}`);
        while (remainingSize > 0) {
            const sndPropHeader = await this.tokenizer.readToken(DsdiffToken_1.ChunkHeader64);
            debug(`Sound-property-chunk[ID=${sndPropHeader.chunkID}, size=${sndPropHeader.chunkSize}]`);
            const p0 = this.tokenizer.position;
            switch (sndPropHeader.chunkID.trim()) {
                case 'FS': // 3.2.1 Sample Rate Chunk
                    const sampleRate = await this.tokenizer.readToken(Token.UINT32_BE);
                    this.metadata.setFormat('sampleRate', sampleRate);
                    break;
                case 'CHNL': // 3.2.2 Channels Chunk
                    const numChannels = await this.tokenizer.readToken(Token.UINT16_BE);
                    this.metadata.setFormat('numberOfChannels', numChannels);
                    await this.handleChannelChunks(sndPropHeader.chunkSize - BigInt(Token.UINT16_BE.len));
                    break;
                case 'CMPR': // 3.2.3 Compression Type Chunk
                    const compressionIdCode = (await this.tokenizer.readToken(FourCC_1.FourCcToken)).trim();
                    const count = await this.tokenizer.readToken(Token.UINT8);
                    const compressionName = await this.tokenizer.readToken(new Token.StringType(count, 'ascii'));
                    if (compressionIdCode === 'DSD') {
                        this.metadata.setFormat('lossless', true);
                        this.metadata.setFormat('bitsPerSample', 1);
                    }
                    this.metadata.setFormat('codec', `${compressionIdCode} (${compressionName})`);
                    break;
                case 'ABSS': // 3.2.4 Absolute Start Time Chunk
                    const hours = await this.tokenizer.readToken(Token.UINT16_BE);
                    const minutes = await this.tokenizer.readToken(Token.UINT8);
                    const seconds = await this.tokenizer.readToken(Token.UINT8);
                    const samples = await this.tokenizer.readToken(Token.UINT32_BE);
                    debug(`ABSS ${hours}:${minutes}:${seconds}.${samples}`);
                    break;
                case 'LSCO': // 3.2.5 Loudspeaker Configuration Chunk
                    const lsConfig = await this.tokenizer.readToken(Token.UINT16_BE);
                    debug(`LSCO lsConfig=${lsConfig}`);
                    break;
                case 'COMT':
                default:
                    debug(`Unknown sound-property-chunk[ID=${sndPropHeader.chunkID}, size=${sndPropHeader.chunkSize}]`);
                    await this.tokenizer.ignore(Number(sndPropHeader.chunkSize));
            }
            const remaining = sndPropHeader.chunkSize - BigInt(this.tokenizer.position - p0);
            if (remaining > 0) {
                debug(`After Parsing sound-property-chunk ${sndPropHeader.chunkSize}, remaining ${remaining} bytes`);
                await this.tokenizer.ignore(Number(remaining));
            }
            remainingSize -= BigInt(DsdiffToken_1.ChunkHeader64.len) + sndPropHeader.chunkSize;
            debug(`Parsing sound-property-chunks, remainingSize=${remainingSize}`);
        }
        if (this.metadata.format.lossless && this.metadata.format.sampleRate && this.metadata.format.numberOfChannels && this.metadata.format.bitsPerSample) {
            const bitrate = this.metadata.format.sampleRate * this.metadata.format.numberOfChannels * this.metadata.format.bitsPerSample;
            this.metadata.setFormat('bitrate', bitrate);
        }
    }
    async handleChannelChunks(remainingSize) {
        debug(`Parsing channel-chunks, remainingSize=${remainingSize}`);
        const channels = [];
        while (remainingSize >= FourCC_1.FourCcToken.len) {
            const channelId = await this.tokenizer.readToken(FourCC_1.FourCcToken);
            debug(`Channel[ID=${channelId}]`);
            channels.push(channelId);
            remainingSize -= BigInt(FourCC_1.FourCcToken.len);
        }
        debug(`Channels: ${channels.join(', ')}`);
        return channels;
    }
}
exports.DsdiffParser = DsdiffParser;


/***/ }),
/* 104 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChunkHeader64 = void 0;
const Token = __webpack_require__(21);
const FourCC_1 = __webpack_require__(63);
/**
 * DSDIFF chunk header
 * The data-size encoding is deviating from EA-IFF 85
 * Ref: http://www.sonicstudio.com/pdf/dsd/DSDIFF_1.5_Spec.pdf
 */
exports.ChunkHeader64 = {
    len: 12,
    get: (buf, off) => {
        return {
            // Group-ID
            chunkID: FourCC_1.FourCcToken.get(buf, off),
            // Size
            chunkSize: Token.INT64_BE.get(buf, off + 4)
        };
    }
};


/***/ }),
/* 105 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MatroskaParser = void 0;
const token_types_1 = __webpack_require__(21);
const debug_1 = __webpack_require__(27);
const BasicParser_1 = __webpack_require__(60);
const types_1 = __webpack_require__(39);
const matroskaDtd = __webpack_require__(106);
const debug = (0, debug_1.default)('music-metadata:parser:matroska');
/**
 * Extensible Binary Meta Language (EBML) parser
 * https://en.wikipedia.org/wiki/Extensible_Binary_Meta_Language
 * http://matroska.sourceforge.net/technical/specs/rfc/index.html
 *
 * WEBM VP8 AUDIO FILE
 */
class MatroskaParser extends BasicParser_1.BasicParser {
    constructor() {
        super();
        this.padding = 0;
        this.parserMap = new Map();
        this.ebmlMaxIDLength = 4;
        this.ebmlMaxSizeLength = 8;
        this.parserMap.set(types_1.DataType.uint, e => this.readUint(e));
        this.parserMap.set(types_1.DataType.string, e => this.readString(e));
        this.parserMap.set(types_1.DataType.binary, e => this.readBuffer(e));
        this.parserMap.set(types_1.DataType.uid, async (e) => await this.readUint(e) === 1);
        this.parserMap.set(types_1.DataType.bool, e => this.readFlag(e));
        this.parserMap.set(types_1.DataType.float, e => this.readFloat(e));
    }
    /**
     * Initialize parser with output (metadata), input (tokenizer) & parsing options (options).
     * @param {INativeMetadataCollector} metadata Output
     * @param {ITokenizer} tokenizer Input
     * @param {IOptions} options Parsing options
     */
    init(metadata, tokenizer, options) {
        super.init(metadata, tokenizer, options);
        return this;
    }
    async parse() {
        const matroska = await this.parseContainer(matroskaDtd.elements, this.tokenizer.fileInfo.size, []);
        this.metadata.setFormat('container', `EBML/${matroska.ebml.docType}`);
        if (matroska.segment) {
            const info = matroska.segment.info;
            if (info) {
                const timecodeScale = info.timecodeScale ? info.timecodeScale : 1000000;
                if (typeof info.duration === 'number') {
                    const duration = info.duration * timecodeScale / 1000000000;
                    this.addTag('segment:title', info.title);
                    this.metadata.setFormat('duration', duration);
                }
            }
            const audioTracks = matroska.segment.tracks;
            if (audioTracks && audioTracks.entries) {
                audioTracks.entries.forEach(entry => {
                    const stream = {
                        codecName: entry.codecID.replace('A_', '').replace('V_', ''),
                        codecSettings: entry.codecSettings,
                        flagDefault: entry.flagDefault,
                        flagLacing: entry.flagLacing,
                        flagEnabled: entry.flagEnabled,
                        language: entry.language,
                        name: entry.name,
                        type: entry.trackType,
                        audio: entry.audio,
                        video: entry.video
                    };
                    this.metadata.addStreamInfo(stream);
                });
                const audioTrack = audioTracks.entries
                    .filter(entry => {
                    return entry.trackType === types_1.TrackType.audio.valueOf();
                })
                    .reduce((acc, cur) => {
                    if (!acc) {
                        return cur;
                    }
                    if (!acc.flagDefault && cur.flagDefault) {
                        return cur;
                    }
                    if (cur.trackNumber && cur.trackNumber < acc.trackNumber) {
                        return cur;
                    }
                    return acc;
                }, null);
                if (audioTrack) {
                    this.metadata.setFormat('codec', audioTrack.codecID.replace('A_', ''));
                    this.metadata.setFormat('sampleRate', audioTrack.audio.samplingFrequency);
                    this.metadata.setFormat('numberOfChannels', audioTrack.audio.channels);
                }
                if (matroska.segment.tags) {
                    matroska.segment.tags.tag.forEach(tag => {
                        const target = tag.target;
                        const targetType = (target === null || target === void 0 ? void 0 : target.targetTypeValue) ? types_1.TargetType[target.targetTypeValue] : ((target === null || target === void 0 ? void 0 : target.targetType) ? target.targetType : 'track');
                        tag.simpleTags.forEach(simpleTag => {
                            const value = simpleTag.string ? simpleTag.string : simpleTag.binary;
                            this.addTag(`${targetType}:${simpleTag.name}`, value);
                        });
                    });
                }
                if (matroska.segment.attachments) {
                    matroska.segment.attachments.attachedFiles
                        .filter(file => file.mimeType.startsWith('image/'))
                        .map(file => {
                        return {
                            data: file.data,
                            format: file.mimeType,
                            description: file.description,
                            name: file.name
                        };
                    }).forEach(picture => {
                        this.addTag('picture', picture);
                    });
                }
            }
        }
    }
    async parseContainer(container, posDone, path) {
        const tree = {};
        while (this.tokenizer.position < posDone) {
            let element;
            try {
                element = await this.readElement();
            }
            catch (error) {
                if (error.message === 'End-Of-Stream') {
                    break;
                }
                throw error;
            }
            const type = container[element.id];
            if (type) {
                debug(`Element: name=${type.name}, container=${!!type.container}`);
                if (type.container) {
                    const res = await this.parseContainer(type.container, element.len >= 0 ? this.tokenizer.position + element.len : -1, path.concat([type.name]));
                    if (type.multiple) {
                        if (!tree[type.name]) {
                            tree[type.name] = [];
                        }
                        tree[type.name].push(res);
                    }
                    else {
                        tree[type.name] = res;
                    }
                }
                else {
                    tree[type.name] = await this.parserMap.get(type.value)(element);
                }
            }
            else {
                switch (element.id) {
                    case 0xec: // void
                        this.padding += element.len;
                        await this.tokenizer.ignore(element.len);
                        break;
                    default:
                        debug(`parseEbml: path=${path.join('/')}, unknown element: id=${element.id.toString(16)}`);
                        this.padding += element.len;
                        await this.tokenizer.ignore(element.len);
                }
            }
        }
        return tree;
    }
    async readVintData(maxLength) {
        const msb = await this.tokenizer.peekNumber(token_types_1.UINT8);
        let mask = 0x80;
        let oc = 1;
        // Calculate VINT_WIDTH
        while ((msb & mask) === 0) {
            if (oc > maxLength) {
                throw new Error('VINT value exceeding maximum size');
            }
            ++oc;
            mask >>= 1;
        }
        const id = Buffer.alloc(oc);
        await this.tokenizer.readBuffer(id);
        return id;
    }
    async readElement() {
        const id = await this.readVintData(this.ebmlMaxIDLength);
        const lenField = await this.readVintData(this.ebmlMaxSizeLength);
        lenField[0] ^= 0x80 >> (lenField.length - 1);
        const nrLen = Math.min(6, lenField.length); // JavaScript can max read 6 bytes integer
        return {
            id: id.readUIntBE(0, id.length),
            len: lenField.readUIntBE(lenField.length - nrLen, nrLen)
        };
    }
    isMaxValue(vintData) {
        if (vintData.length === this.ebmlMaxSizeLength) {
            for (let n = 1; n < this.ebmlMaxSizeLength; ++n) {
                if (vintData[n] !== 0xff)
                    return false;
            }
            return true;
        }
        return false;
    }
    async readFloat(e) {
        switch (e.len) {
            case 0:
                return 0.0;
            case 4:
                return this.tokenizer.readNumber(token_types_1.Float32_BE);
            case 8:
                return this.tokenizer.readNumber(token_types_1.Float64_BE);
            case 10:
                return this.tokenizer.readNumber(token_types_1.Float64_BE);
            default:
                throw new Error(`Invalid IEEE-754 float length: ${e.len}`);
        }
    }
    async readFlag(e) {
        return (await this.readUint(e)) === 1;
    }
    async readUint(e) {
        const buf = await this.readBuffer(e);
        const nrLen = Math.min(6, e.len); // JavaScript can max read 6 bytes integer
        return buf.readUIntBE(e.len - nrLen, nrLen);
    }
    async readString(e) {
        const rawString = await this.tokenizer.readToken(new token_types_1.StringType(e.len, 'utf-8'));
        return rawString.replace(/\00.*$/g, '');
    }
    async readBuffer(e) {
        const buf = Buffer.alloc(e.len);
        await this.tokenizer.readBuffer(buf);
        return buf;
    }
    addTag(tagId, value) {
        this.metadata.addTag('matroska', tagId, value);
    }
}
exports.MatroskaParser = MatroskaParser;


/***/ }),
/* 106 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.elements = void 0;
const types_1 = __webpack_require__(39);
/**
 * Elements of document type description
 * Derived from https://github.com/tungol/EBML/blob/master/doctypes/matroska.dtd
 * Extended with:
 * - https://www.matroska.org/technical/specs/index.html
 */
exports.elements = {
    0x1a45dfa3: {
        name: 'ebml',
        container: {
            0x4286: { name: 'ebmlVersion', value: types_1.DataType.uint },
            0x42f7: { name: 'ebmlReadVersion', value: types_1.DataType.uint },
            0x42f2: { name: 'ebmlMaxIDWidth', value: types_1.DataType.uint },
            0x42f3: { name: 'ebmlMaxSizeWidth', value: types_1.DataType.uint },
            0x4282: { name: 'docType', value: types_1.DataType.string },
            0x4287: { name: 'docTypeVersion', value: types_1.DataType.uint },
            0x4285: { name: 'docTypeReadVersion', value: types_1.DataType.uint } // 5.1.7
        }
    },
    // Matroska segments
    0x18538067: {
        name: 'segment',
        container: {
            // Meta Seek Information
            0x114d9b74: {
                name: 'seekHead',
                container: {
                    0x4dbb: {
                        name: 'seek',
                        container: {
                            0x53ab: { name: 'seekId', value: types_1.DataType.binary },
                            0x53ac: { name: 'seekPosition', value: types_1.DataType.uint }
                        }
                    }
                }
            },
            // Segment Information
            0x1549a966: {
                name: 'info',
                container: {
                    0x73a4: { name: 'uid', value: types_1.DataType.uid },
                    0x7384: { name: 'filename', value: types_1.DataType.string },
                    0x3cb923: { name: 'prevUID', value: types_1.DataType.uid },
                    0x3c83ab: { name: 'prevFilename', value: types_1.DataType.string },
                    0x3eb923: { name: 'nextUID', value: types_1.DataType.uid },
                    0x3e83bb: { name: 'nextFilename', value: types_1.DataType.string },
                    0x2ad7b1: { name: 'timecodeScale', value: types_1.DataType.uint },
                    0x4489: { name: 'duration', value: types_1.DataType.float },
                    0x4461: { name: 'dateUTC', value: types_1.DataType.uint },
                    0x7ba9: { name: 'title', value: types_1.DataType.string },
                    0x4d80: { name: 'muxingApp', value: types_1.DataType.string },
                    0x5741: { name: 'writingApp', value: types_1.DataType.string }
                }
            },
            // Cluster
            0x1f43b675: {
                name: 'cluster',
                multiple: true,
                container: {
                    0xe7: { name: 'timecode', value: types_1.DataType.uid },
                    0xa3: { name: 'unknown', value: types_1.DataType.binary },
                    0xa7: { name: 'position', value: types_1.DataType.uid },
                    0xab: { name: 'prevSize', value: types_1.DataType.uid }
                }
            },
            // Track
            0x1654ae6b: {
                name: 'tracks',
                container: {
                    0xae: {
                        name: 'entries',
                        multiple: true,
                        container: {
                            0xd7: { name: 'trackNumber', value: types_1.DataType.uint },
                            0x73c5: { name: 'uid', value: types_1.DataType.uid },
                            0x83: { name: 'trackType', value: types_1.DataType.uint },
                            0xb9: { name: 'flagEnabled', value: types_1.DataType.bool },
                            0x88: { name: 'flagDefault', value: types_1.DataType.bool },
                            0x55aa: { name: 'flagForced', value: types_1.DataType.bool },
                            0x9c: { name: 'flagLacing', value: types_1.DataType.bool },
                            0x6de7: { name: 'minCache', value: types_1.DataType.uint },
                            0x6de8: { name: 'maxCache', value: types_1.DataType.uint },
                            0x23e383: { name: 'defaultDuration', value: types_1.DataType.uint },
                            0x23314f: { name: 'timecodeScale', value: types_1.DataType.float },
                            0x536e: { name: 'name', value: types_1.DataType.string },
                            0x22b59c: { name: 'language', value: types_1.DataType.string },
                            0x86: { name: 'codecID', value: types_1.DataType.string },
                            0x63a2: { name: 'codecPrivate', value: types_1.DataType.binary },
                            0x258688: { name: 'codecName', value: types_1.DataType.string },
                            0x3a9697: { name: 'codecSettings', value: types_1.DataType.string },
                            0x3b4040: { name: 'codecInfoUrl', value: types_1.DataType.string },
                            0x26b240: { name: 'codecDownloadUrl', value: types_1.DataType.string },
                            0xaa: { name: 'codecDecodeAll', value: types_1.DataType.bool },
                            0x6fab: { name: 'trackOverlay', value: types_1.DataType.uint },
                            // Video
                            0xe0: {
                                name: 'video',
                                container: {
                                    0x9a: { name: 'flagInterlaced', value: types_1.DataType.bool },
                                    0x53b8: { name: 'stereoMode', value: types_1.DataType.uint },
                                    0xb0: { name: 'pixelWidth', value: types_1.DataType.uint },
                                    0xba: { name: 'pixelHeight', value: types_1.DataType.uint },
                                    0x54b0: { name: 'displayWidth', value: types_1.DataType.uint },
                                    0x54ba: { name: 'displayHeight', value: types_1.DataType.uint },
                                    0x54b3: { name: 'aspectRatioType', value: types_1.DataType.uint },
                                    0x2eb524: { name: 'colourSpace', value: types_1.DataType.uint },
                                    0x2fb523: { name: 'gammaValue', value: types_1.DataType.float }
                                }
                            },
                            // Audio
                            0xe1: {
                                name: 'audio',
                                container: {
                                    0xb5: { name: 'samplingFrequency', value: types_1.DataType.float },
                                    0x78b5: { name: 'outputSamplingFrequency', value: types_1.DataType.float },
                                    0x9f: { name: 'channels', value: types_1.DataType.uint },
                                    0x94: { name: 'channels', value: types_1.DataType.uint },
                                    0x7d7b: { name: 'channelPositions', value: types_1.DataType.binary },
                                    0x6264: { name: 'bitDepth', value: types_1.DataType.uint }
                                }
                            },
                            // Content Encoding
                            0x6d80: {
                                name: 'contentEncodings',
                                container: {
                                    0x6240: {
                                        name: 'contentEncoding',
                                        container: {
                                            0x5031: { name: 'order', value: types_1.DataType.uint },
                                            0x5032: { name: 'scope', value: types_1.DataType.bool },
                                            0x5033: { name: 'type', value: types_1.DataType.uint },
                                            0x5034: {
                                                name: 'contentEncoding',
                                                container: {
                                                    0x4254: { name: 'contentCompAlgo', value: types_1.DataType.uint },
                                                    0x4255: { name: 'contentCompSettings', value: types_1.DataType.binary }
                                                }
                                            },
                                            0x5035: {
                                                name: 'contentEncoding',
                                                container: {
                                                    0x47e1: { name: 'contentEncAlgo', value: types_1.DataType.uint },
                                                    0x47e2: { name: 'contentEncKeyID', value: types_1.DataType.binary },
                                                    0x47e3: { name: 'contentSignature ', value: types_1.DataType.binary },
                                                    0x47e4: { name: 'ContentSigKeyID  ', value: types_1.DataType.binary },
                                                    0x47e5: { name: 'contentSigAlgo ', value: types_1.DataType.uint },
                                                    0x47e6: { name: 'contentSigHashAlgo ', value: types_1.DataType.uint }
                                                }
                                            },
                                            0x6264: { name: 'bitDepth', value: types_1.DataType.uint }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            // Cueing Data
            0x1c53bb6b: {
                name: 'cues',
                container: {
                    0xbb: {
                        name: 'cuePoint',
                        container: {
                            0xb3: { name: 'cueTime', value: types_1.DataType.uid },
                            0xb7: {
                                name: 'positions',
                                container: {
                                    0xf7: { name: 'track', value: types_1.DataType.uint },
                                    0xf1: { name: 'clusterPosition', value: types_1.DataType.uint },
                                    0x5378: { name: 'blockNumber', value: types_1.DataType.uint },
                                    0xea: { name: 'codecState', value: types_1.DataType.uint },
                                    0xdb: {
                                        name: 'reference', container: {
                                            0x96: { name: 'time', value: types_1.DataType.uint },
                                            0x97: { name: 'cluster', value: types_1.DataType.uint },
                                            0x535f: { name: 'number', value: types_1.DataType.uint },
                                            0xeb: { name: 'codecState', value: types_1.DataType.uint }
                                        }
                                    },
                                    0xf0: { name: 'relativePosition', value: types_1.DataType.uint } // extended
                                }
                            }
                        }
                    }
                }
            },
            // Attachment
            0x1941a469: {
                name: 'attachments',
                container: {
                    0x61a7: {
                        name: 'attachedFiles',
                        multiple: true,
                        container: {
                            0x467e: { name: 'description', value: types_1.DataType.string },
                            0x466e: { name: 'name', value: types_1.DataType.string },
                            0x4660: { name: 'mimeType', value: types_1.DataType.string },
                            0x465c: { name: 'data', value: types_1.DataType.binary },
                            0x46ae: { name: 'uid', value: types_1.DataType.uid }
                        }
                    }
                }
            },
            // Chapters
            0x1043a770: {
                name: 'chapters',
                container: {
                    0x45b9: {
                        name: 'editionEntry',
                        container: {
                            0xb6: {
                                name: 'chapterAtom',
                                container: {
                                    0x73c4: { name: 'uid', value: types_1.DataType.uid },
                                    0x91: { name: 'timeStart', value: types_1.DataType.uint },
                                    0x92: { name: 'timeEnd', value: types_1.DataType.uid },
                                    0x98: { name: 'hidden', value: types_1.DataType.bool },
                                    0x4598: { name: 'enabled', value: types_1.DataType.uid },
                                    0x8f: { name: 'track', container: {
                                            0x89: { name: 'trackNumber', value: types_1.DataType.uid },
                                            0x80: {
                                                name: 'display', container: {
                                                    0x85: { name: 'string', value: types_1.DataType.string },
                                                    0x437c: { name: 'language ', value: types_1.DataType.string },
                                                    0x437e: { name: 'country ', value: types_1.DataType.string }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            // Tagging
            0x1254c367: {
                name: 'tags',
                container: {
                    0x7373: {
                        name: 'tag',
                        multiple: true,
                        container: {
                            0x63c0: {
                                name: 'target',
                                container: {
                                    0x63c5: { name: 'tagTrackUID', value: types_1.DataType.uid },
                                    0x63c4: { name: 'tagChapterUID', value: types_1.DataType.uint },
                                    0x63c6: { name: 'tagAttachmentUID', value: types_1.DataType.uid },
                                    0x63ca: { name: 'targetType', value: types_1.DataType.string },
                                    0x68ca: { name: 'targetTypeValue', value: types_1.DataType.uint },
                                    0x63c9: { name: 'tagEditionUID', value: types_1.DataType.uid } // extended
                                }
                            },
                            0x67c8: {
                                name: 'simpleTags',
                                multiple: true,
                                container: {
                                    0x45a3: { name: 'name', value: types_1.DataType.string },
                                    0x4487: { name: 'string', value: types_1.DataType.string },
                                    0x4485: { name: 'binary', value: types_1.DataType.binary },
                                    0x447a: { name: 'language', value: types_1.DataType.string },
                                    0x447b: { name: 'languageIETF', value: types_1.DataType.string },
                                    0x4484: { name: 'default', value: types_1.DataType.bool } // extended
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};


/***/ }),
/* 107 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RandomUint8ArrayReader = void 0;
/**
 * Provides abstract Uint8Array access via the IRandomRead interface
 */
class RandomUint8ArrayReader {
    constructor(uint8Array) {
        this.uint8Array = uint8Array;
        this.fileSize = uint8Array.length;
    }
    /**
     * Read from a given position of an abstracted file or buffer.
     * @param uint8Array - Uint8Array that the data will be written to.
     * @param offset - Offset in the buffer to start writing at.
     * @param length - Integer specifying the number of bytes to read.
     * @param position - Specifies where to begin reading from in the file.
     * @return Promise providing bytes read
     */
    async randomRead(uint8Array, offset, length, position) {
        uint8Array.set(this.uint8Array.subarray(position, position + length), offset);
        return length;
    }
}
exports.RandomUint8ArrayReader = RandomUint8ArrayReader;


/***/ }),
/* 108 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getLyricsHeaderLength = exports.endTag2 = void 0;
exports.endTag2 = 'LYRICS200';
async function getLyricsHeaderLength(reader) {
    if (reader.fileSize >= 143) {
        const buf = Buffer.alloc(15);
        await reader.randomRead(buf, 0, buf.length, reader.fileSize - 143);
        const txt = buf.toString('binary');
        const tag = txt.substr(6);
        if (tag === exports.endTag2) {
            return parseInt(txt.substr(0, 6), 10) + 15;
        }
    }
    return 0;
}
exports.getLyricsHeaderLength = getLyricsHeaderLength;


/***/ }),
/* 109 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RandomFileReader = void 0;
const fs = __webpack_require__(5);
/**
 * Provides abstract file access via the IRandomRead interface
 */
class RandomFileReader {
    constructor(fileHandle, filePath, fileSize) {
        this.fileHandle = fileHandle;
        this.filePath = filePath;
        this.fileSize = fileSize;
    }
    /**
     * Read from a given position of an abstracted file or buffer.
     * @param buffer {Buffer} is the buffer that the data will be written to.
     * @param offset {number} is the offset in the buffer to start writing at.
     * @param length {number}is an integer specifying the number of bytes to read.
     * @param position {number} is an argument specifying where to begin reading from in the file.
     * @return {Promise<number>} bytes read
     */
    async randomRead(buffer, offset, length, position) {
        const result = await this.fileHandle.read(buffer, offset, length, position);
        return result.bytesRead;
    }
    async close() {
        return this.fileHandle.close();
    }
    static async init(filePath, fileSize) {
        const fileHandle = await fs.promises.open(filePath, 'r');
        return new RandomFileReader(fileHandle, filePath, fileSize);
    }
}
exports.RandomFileReader = RandomFileReader;


/***/ }),
/* 110 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CONSTANTS = void 0;
exports.CONSTANTS = {
    EXTENSION_ID: 'sonicflow',
    // Supported audio formats
    SUPPORTED_FORMATS: [
        '.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma', '.opus', '.webm'
    ],
    // Memory limits
    MAX_CACHE_ENTRIES: 100,
    MAX_QUEUE_SIZE: 500,
    MAX_PLAYLIST_SIZE: 1000,
    CACHE_TTL_SECONDS: 3600,
    // YouTube
    YT_MAX_RESULTS: 25,
    YT_SEARCH_DEBOUNCE_MS: 500,
    // UI
    STATUSBAR_PRIORITY: 100,
    TRACK_TITLE_MAX_LENGTH: 40,
    // Storage keys
    STORAGE_PLAYLISTS: 'sonicflow.playlists',
    STORAGE_LAST_PLAYED: 'sonicflow.lastPlayed',
    STORAGE_PLAY_HISTORY: 'sonicflow.playHistory',
    STORAGE_SETTINGS: 'sonicflow.settings',
    STORAGE_QUEUE: 'sonicflow.queue',
    // Themes
    THEMES: {
        'aurora': {
            primary: '#00E5A0',
            secondary: '#7B2FBE',
            accent: '#FF6B9D',
            background: '#0A0E1A',
            surface: '#131729',
            surfaceLight: '#1C2137',
            text: '#E8ECF4',
            textMuted: '#6B7394',
            gradient: 'linear-gradient(135deg, #00E5A0 0%, #7B2FBE 50%, #FF6B9D 100%)',
            glow: '0 0 20px rgba(0, 229, 160, 0.3)'
        },
        'neon-midnight': {
            primary: '#FF073A',
            secondary: '#00F0FF',
            accent: '#FFE600',
            background: '#05050F',
            surface: '#0D0D1A',
            surfaceLight: '#161628',
            text: '#F0F0FF',
            textMuted: '#5A5A7A',
            gradient: 'linear-gradient(135deg, #FF073A 0%, #00F0FF 100%)',
            glow: '0 0 20px rgba(255, 7, 58, 0.3)'
        },
        'cyber-sunset': {
            primary: '#FF6A00',
            secondary: '#FF0080',
            accent: '#7928CA',
            background: '#0F0A1A',
            surface: '#1A1228',
            surfaceLight: '#241A35',
            text: '#FFF0E5',
            textMuted: '#8A7A6A',
            gradient: 'linear-gradient(135deg, #FF6A00 0%, #FF0080 50%, #7928CA 100%)',
            glow: '0 0 20px rgba(255, 106, 0, 0.3)'
        },
        'deep-ocean': {
            primary: '#00B4D8',
            secondary: '#0077B6',
            accent: '#90E0EF',
            background: '#03071E',
            surface: '#0A1628',
            surfaceLight: '#122035',
            text: '#CAF0F8',
            textMuted: '#48738A',
            gradient: 'linear-gradient(135deg, #90E0EF 0%, #00B4D8 50%, #0077B6 100%)',
            glow: '0 0 20px rgba(0, 180, 216, 0.3)'
        }
    }
};


/***/ }),
/* 111 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MemoryManager = void 0;
const node_cache_1 = __importDefault(__webpack_require__(112));
const Constants_1 = __webpack_require__(110);
/**
 * Memory-efficient cache manager using LRU strategy.
 * Prevents excessive memory usage by limiting cache entries
 * and implementing automatic expiration.
 */
class MemoryManager {
    constructor() {
        this.memoryUsageLog = [];
        this.MAX_LOG_ENTRIES = 50;
        this.cache = new node_cache_1.default({
            stdTTL: Constants_1.CONSTANTS.CACHE_TTL_SECONDS,
            maxKeys: Constants_1.CONSTANTS.MAX_CACHE_ENTRIES,
            checkperiod: 120, // Check for expired keys every 2 minutes
            useClones: false, // Don't clone objects - saves memory
            deleteOnExpire: true
        });
        // Monitor cache events
        this.cache.on('del', (_key, _value) => {
            this.logMemoryUsage();
        });
    }
    static getInstance() {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }
    set(key, value, ttl) {
        try {
            // Check if we're approaching memory limit
            if (this.cache.keys().length >= Constants_1.CONSTANTS.MAX_CACHE_ENTRIES) {
                this.evictOldest();
            }
            return this.cache.set(key, value, ttl ?? Constants_1.CONSTANTS.CACHE_TTL_SECONDS);
        }
        catch (error) {
            console.error(`[SonicFlow] Cache set error for key ${key}:`, error);
            return false;
        }
    }
    get(key) {
        return this.cache.get(key);
    }
    has(key) {
        return this.cache.has(key);
    }
    delete(key) {
        return this.cache.del(key);
    }
    clear() {
        this.cache.flushAll();
        this.memoryUsageLog = [];
    }
    getStats() {
        const stats = this.cache.getStats();
        return {
            keys: this.cache.keys().length,
            hits: stats.hits,
            misses: stats.misses,
            memoryEstimate: this.getMemoryEstimate()
        };
    }
    evictOldest() {
        const keys = this.cache.keys();
        if (keys.length > 0) {
            // Remove the oldest 10% of entries
            const removeCount = Math.max(1, Math.floor(keys.length * 0.1));
            for (let i = 0; i < removeCount && i < keys.length; i++) {
                this.cache.del(keys[i]);
            }
        }
    }
    logMemoryUsage() {
        const usage = process.memoryUsage();
        this.memoryUsageLog.push(usage.heapUsed);
        if (this.memoryUsageLog.length > this.MAX_LOG_ENTRIES) {
            this.memoryUsageLog.shift();
        }
    }
    getMemoryEstimate() {
        const usage = process.memoryUsage();
        const mbUsed = (usage.heapUsed / 1024 / 1024).toFixed(2);
        return `${mbUsed} MB`;
    }
    dispose() {
        this.cache.flushAll();
        this.cache.close();
        this.memoryUsageLog = [];
    }
}
exports.MemoryManager = MemoryManager;


/***/ }),
/* 112 */
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/*
 * node-cache 5.1.2 ( 2020-07-01 )
 * https://github.com/node-cache/node-cache
 *
 * Released under the MIT license
 * https://github.com/node-cache/node-cache/blob/master/LICENSE
 *
 * Maintained by  (  )
*/
(function() {
  var exports;

  exports = module.exports = __webpack_require__(113);

  exports.version = '5.1.2';

}).call(this);


/***/ }),
/* 113 */
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/*
 * node-cache 5.1.2 ( 2020-07-01 )
 * https://github.com/node-cache/node-cache
 *
 * Released under the MIT license
 * https://github.com/node-cache/node-cache/blob/master/LICENSE
 *
 * Maintained by  (  )
*/
(function() {
  var EventEmitter, NodeCache, clone,
    splice = [].splice,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } },
    indexOf = [].indexOf;

  clone = __webpack_require__(114);

  EventEmitter = (__webpack_require__(115).EventEmitter);

  // generate superclass
  module.exports = NodeCache = (function() {
    class NodeCache extends EventEmitter {
      constructor(options = {}) {
        super();
        // ## get

        // get a cached key and change the stats

        // **Parameters:**

        // * `key` ( String | Number ): cache key

        // **Example:**

        //	myCache.get "myKey", ( err, val )

        this.get = this.get.bind(this);
        // ## mget

        // get multiple cached keys at once and change the stats

        // **Parameters:**

        // * `keys` ( String|Number[] ): an array of keys

        // **Example:**

        //	myCache.mget [ "foo", "bar" ]

        this.mget = this.mget.bind(this);
        // ## set

        // set a cached key and change the stats

        // **Parameters:**

        // * `key` ( String | Number ): cache key
        // * `value` ( Any ): A element to cache. If the option `option.forceString` is `true` the module trys to translate it to a serialized JSON
        // * `[ ttl ]` ( Number | String ): ( optional ) The time to live in seconds.

        // **Example:**

        //	myCache.set "myKey", "my_String Value"

        //	myCache.set "myKey", "my_String Value", 10

        this.set = this.set.bind(this);
        
        // ## mset

        // set multiple keys at once

        // **Parameters:**

        // * `keyValueSet` ( Object[] ): an array of object which includes key,value and ttl

        // **Example:**

        //	myCache.mset(
        //		[
        //			{
        //				key: "myKey",
        //				val: "myValue",
        //				ttl: [ttl in seconds]
        //			}
        //		])

        this.mset = this.mset.bind(this);
        // ## del

        // remove keys

        // **Parameters:**

        // * `keys` ( String | Number | String|Number[] ): cache key to delete or a array of cache keys

        // **Return**

        // ( Number ): Number of deleted keys

        // **Example:**

        //	myCache.del( "myKey" )

        this.del = this.del.bind(this);
        // ## take

        // get the cached value and remove the key from the cache.
        // Equivalent to calling `get(key)` + `del(key)`.
        // Useful for implementing `single use` mechanism such as OTP, where once a value is read it will become obsolete.

        // **Parameters:**

        // * `key` ( String | Number ): cache key

        // **Example:**

        //	myCache.take "myKey", ( err, val )

        this.take = this.take.bind(this);
        // ## ttl

        // reset or redefine the ttl of a key. `ttl` = 0 means infinite lifetime.
        // If `ttl` is not passed the default ttl is used.
        // If `ttl` < 0 the key will be deleted.

        // **Parameters:**

        // * `key` ( String | Number ): cache key to reset the ttl value
        // * `ttl` ( Number ): ( optional -> options.stdTTL || 0 ) The time to live in seconds

        // **Return**

        // ( Boolen ): key found and ttl set

        // **Example:**

        //	myCache.ttl( "myKey" ) // will set ttl to default ttl

        //	myCache.ttl( "myKey", 1000 )

        this.ttl = this.ttl.bind(this);
        // ## getTtl

        // receive the ttl of a key.

        // **Parameters:**

        // * `key` ( String | Number ): cache key to check the ttl value

        // **Return**

        // ( Number|undefined ): The timestamp in ms when the key will expire, 0 if it will never expire or undefined if it not exists

        // **Example:**

        //	myCache.getTtl( "myKey" )

        this.getTtl = this.getTtl.bind(this);
        // ## keys

        // list all keys within this cache

        // **Return**

        // ( Array ): An array of all keys

        // **Example:**

        //     _keys = myCache.keys()

        //     # [ "foo", "bar", "fizz", "buzz", "anotherKeys" ]

        this.keys = this.keys.bind(this);
        // ## has

        // Check if a key is cached

        // **Parameters:**

        // * `key` ( String | Number ): cache key to check the ttl value

        // **Return**

        // ( Boolean ): A boolean that indicates if the key is cached

        // **Example:**

        //     _exists = myCache.has('myKey')

        //     # true

        this.has = this.has.bind(this);
        // ## getStats

        // get the stats

        // **Parameters:**

        // -

        // **Return**

        // ( Object ): Stats data

        // **Example:**

        //     myCache.getStats()
        //     # {
        //     # hits: 0,
        //     # misses: 0,
        //     # keys: 0,
        //     # ksize: 0,
        //     # vsize: 0
        //     # }

        this.getStats = this.getStats.bind(this);
        // ## flushAll

        // flush the whole data and reset the stats

        // **Example:**

        //     myCache.flushAll()

        //     myCache.getStats()
        //     # {
        //     # hits: 0,
        //     # misses: 0,
        //     # keys: 0,
        //     # ksize: 0,
        //     # vsize: 0
        //     # }

        this.flushAll = this.flushAll.bind(this);
        
        // ## flushStats

        // flush the stats and reset all counters to 0

        // **Example:**

        //     myCache.flushStats()

        //     myCache.getStats()
        //     # {
        //     # hits: 0,
        //     # misses: 0,
        //     # keys: 0,
        //     # ksize: 0,
        //     # vsize: 0
        //     # }

        this.flushStats = this.flushStats.bind(this);
        // ## close

        // This will clear the interval timeout which is set on checkperiod option.

        // **Example:**

        //     myCache.close()

        this.close = this.close.bind(this);
        // ## _checkData

        // internal housekeeping method.
        // Check all the cached data and delete the invalid values
        this._checkData = this._checkData.bind(this);
        // ## _check

        // internal method the check the value. If it's not valid any more delete it
        this._check = this._check.bind(this);
        // ## _isInvalidKey

        // internal method to check if the type of a key is either `number` or `string`
        this._isInvalidKey = this._isInvalidKey.bind(this);
        // ## _wrap

        // internal method to wrap a value in an object with some metadata
        this._wrap = this._wrap.bind(this);
        // ## _getValLength

        // internal method to calculate the value length
        this._getValLength = this._getValLength.bind(this);
        // ## _error

        // internal method to handle an error message
        this._error = this._error.bind(this);
        // ## _initErrors

        // internal method to generate error message templates
        this._initErrors = this._initErrors.bind(this);
        this.options = options;
        this._initErrors();
        // container for cached data
        this.data = {};
        // module options
        this.options = Object.assign({
          // convert all elements to string
          forceString: false,
          // used standard size for calculating value size
          objectValueSize: 80,
          promiseValueSize: 80,
          arrayValueSize: 40,
          // standard time to live in seconds. 0 = infinity;
          stdTTL: 0,
          // time in seconds to check all data and delete expired keys
          checkperiod: 600,
          // en/disable cloning of variables. If `true` you'll get a copy of the cached variable. If `false` you'll save and get just the reference
          useClones: true,
          // whether values should be deleted automatically at expiration
          deleteOnExpire: true,
          // enable legacy callbacks
          enableLegacyCallbacks: false,
          // max amount of keys that are being stored
          maxKeys: -1
        }, this.options);
        // generate functions with callbacks (legacy)
        if (this.options.enableLegacyCallbacks) {
          console.warn("WARNING! node-cache legacy callback support will drop in v6.x");
          ["get", "mget", "set", "del", "ttl", "getTtl", "keys", "has"].forEach((methodKey) => {
            var oldMethod;
            // reference real function
            oldMethod = this[methodKey];
            this[methodKey] = function(...args) {
              var cb, err, ref, res;
              ref = args, [...args] = ref, [cb] = splice.call(args, -1);
              // return a callback if cb is defined and a function
              if (typeof cb === "function") {
                try {
                  res = oldMethod(...args);
                  cb(null, res);
                } catch (error1) {
                  err = error1;
                  cb(err);
                }
              } else {
                return oldMethod(...args, cb);
              }
            };
          });
        }
        // statistics container
        this.stats = {
          hits: 0,
          misses: 0,
          keys: 0,
          ksize: 0,
          vsize: 0
        };
        // pre allocate valid keytypes array
        this.validKeyTypes = ["string", "number"];
        // initalize checking period
        this._checkData();
        return;
      }

      get(key) {
        var _ret, err;
        boundMethodCheck(this, NodeCache);
        // handle invalid key types
        if ((err = this._isInvalidKey(key)) != null) {
          throw err;
        }
        // get data and incremet stats
        if ((this.data[key] != null) && this._check(key, this.data[key])) {
          this.stats.hits++;
          _ret = this._unwrap(this.data[key]);
          // return data
          return _ret;
        } else {
          // if not found return undefined
          this.stats.misses++;
          return void 0;
        }
      }

      mget(keys) {
        var _err, err, i, key, len, oRet;
        boundMethodCheck(this, NodeCache);
        // convert a string to an array of one key
        if (!Array.isArray(keys)) {
          _err = this._error("EKEYSTYPE");
          throw _err;
        }
        // define return
        oRet = {};
        for (i = 0, len = keys.length; i < len; i++) {
          key = keys[i];
          // handle invalid key types
          if ((err = this._isInvalidKey(key)) != null) {
            throw err;
          }
          // get data and increment stats
          if ((this.data[key] != null) && this._check(key, this.data[key])) {
            this.stats.hits++;
            oRet[key] = this._unwrap(this.data[key]);
          } else {
            // if not found return a error
            this.stats.misses++;
          }
        }
        // return all found keys
        return oRet;
      }

      set(key, value, ttl) {
        var _err, err, existent;
        boundMethodCheck(this, NodeCache);
        // check if cache is overflowing
        if (this.options.maxKeys > -1 && this.stats.keys >= this.options.maxKeys) {
          _err = this._error("ECACHEFULL");
          throw _err;
        }
        // force the data to string
        if (this.options.forceString && !typeof value === "string") {
          value = JSON.stringify(value);
        }
        // set default ttl if not passed
        if (ttl == null) {
          ttl = this.options.stdTTL;
        }
        // handle invalid key types
        if ((err = this._isInvalidKey(key)) != null) {
          throw err;
        }
        // internal helper variables
        existent = false;
        // remove existing data from stats
        if (this.data[key]) {
          existent = true;
          this.stats.vsize -= this._getValLength(this._unwrap(this.data[key], false));
        }
        // set the value
        this.data[key] = this._wrap(value, ttl);
        this.stats.vsize += this._getValLength(value);
        // only add the keys and key-size if the key is new
        if (!existent) {
          this.stats.ksize += this._getKeyLength(key);
          this.stats.keys++;
        }
        this.emit("set", key, value);
        // return true
        return true;
      }

      mset(keyValueSet) {
        var _err, err, i, j, key, keyValuePair, len, len1, ttl, val;
        boundMethodCheck(this, NodeCache);
        // check if cache is overflowing
        if (this.options.maxKeys > -1 && this.stats.keys + keyValueSet.length >= this.options.maxKeys) {
          _err = this._error("ECACHEFULL");
          throw _err;
        }

// loop over keyValueSet to validate key and ttl
        for (i = 0, len = keyValueSet.length; i < len; i++) {
          keyValuePair = keyValueSet[i];
          ({key, val, ttl} = keyValuePair);
          // check if there is ttl and it's a number
          if (ttl && typeof ttl !== "number") {
            _err = this._error("ETTLTYPE");
            throw _err;
          }
          // handle invalid key types
          if ((err = this._isInvalidKey(key)) != null) {
            throw err;
          }
        }
        for (j = 0, len1 = keyValueSet.length; j < len1; j++) {
          keyValuePair = keyValueSet[j];
          ({key, val, ttl} = keyValuePair);
          this.set(key, val, ttl);
        }
        return true;
      }

      del(keys) {
        var delCount, err, i, key, len, oldVal;
        boundMethodCheck(this, NodeCache);
        // convert keys to an array of itself
        if (!Array.isArray(keys)) {
          keys = [keys];
        }
        delCount = 0;
        for (i = 0, len = keys.length; i < len; i++) {
          key = keys[i];
          // handle invalid key types
          if ((err = this._isInvalidKey(key)) != null) {
            throw err;
          }
          // only delete if existent
          if (this.data[key] != null) {
            // calc the stats
            this.stats.vsize -= this._getValLength(this._unwrap(this.data[key], false));
            this.stats.ksize -= this._getKeyLength(key);
            this.stats.keys--;
            delCount++;
            // delete the value
            oldVal = this.data[key];
            delete this.data[key];
            // return true
            this.emit("del", key, oldVal.v);
          }
        }
        return delCount;
      }

      take(key) {
        var _ret;
        boundMethodCheck(this, NodeCache);
        _ret = this.get(key);
        if ((_ret != null)) {
          this.del(key);
        }
        return _ret;
      }

      ttl(key, ttl) {
        var err;
        boundMethodCheck(this, NodeCache);
        ttl || (ttl = this.options.stdTTL);
        if (!key) {
          return false;
        }
        // handle invalid key types
        if ((err = this._isInvalidKey(key)) != null) {
          throw err;
        }
        // check for existent data and update the ttl value
        if ((this.data[key] != null) && this._check(key, this.data[key])) {
          // if ttl < 0 delete the key. otherwise reset the value
          if (ttl >= 0) {
            this.data[key] = this._wrap(this.data[key].v, ttl, false);
          } else {
            this.del(key);
          }
          return true;
        } else {
          // return false if key has not been found
          return false;
        }
      }

      getTtl(key) {
        var _ttl, err;
        boundMethodCheck(this, NodeCache);
        if (!key) {
          return void 0;
        }
        // handle invalid key types
        if ((err = this._isInvalidKey(key)) != null) {
          throw err;
        }
        // check for existant data and update the ttl value
        if ((this.data[key] != null) && this._check(key, this.data[key])) {
          _ttl = this.data[key].t;
          return _ttl;
        } else {
          // return undefined if key has not been found
          return void 0;
        }
      }

      keys() {
        var _keys;
        boundMethodCheck(this, NodeCache);
        _keys = Object.keys(this.data);
        return _keys;
      }

      has(key) {
        var _exists;
        boundMethodCheck(this, NodeCache);
        _exists = (this.data[key] != null) && this._check(key, this.data[key]);
        return _exists;
      }

      getStats() {
        boundMethodCheck(this, NodeCache);
        return this.stats;
      }

      flushAll(_startPeriod = true) {
        boundMethodCheck(this, NodeCache);
        // parameter just for testing

        // set data empty
        this.data = {};
        // reset stats
        this.stats = {
          hits: 0,
          misses: 0,
          keys: 0,
          ksize: 0,
          vsize: 0
        };
        // reset check period
        this._killCheckPeriod();
        this._checkData(_startPeriod);
        this.emit("flush");
      }

      flushStats() {
        boundMethodCheck(this, NodeCache);
        // reset stats
        this.stats = {
          hits: 0,
          misses: 0,
          keys: 0,
          ksize: 0,
          vsize: 0
        };
        this.emit("flush_stats");
      }

      close() {
        boundMethodCheck(this, NodeCache);
        this._killCheckPeriod();
      }

      _checkData(startPeriod = true) {
        var key, ref, value;
        boundMethodCheck(this, NodeCache);
        ref = this.data;
        // run the housekeeping method
        for (key in ref) {
          value = ref[key];
          this._check(key, value);
        }
        if (startPeriod && this.options.checkperiod > 0) {
          this.checkTimeout = setTimeout(this._checkData, this.options.checkperiod * 1000, startPeriod);
          if ((this.checkTimeout != null) && (this.checkTimeout.unref != null)) {
            this.checkTimeout.unref();
          }
        }
      }

      // ## _killCheckPeriod

      // stop the checkdata period. Only needed to abort the script in testing mode.
      _killCheckPeriod() {
        if (this.checkTimeout != null) {
          return clearTimeout(this.checkTimeout);
        }
      }

      _check(key, data) {
        var _retval;
        boundMethodCheck(this, NodeCache);
        _retval = true;
        // data is invalid if the ttl is too old and is not 0
        // console.log data.t < Date.now(), data.t, Date.now()
        if (data.t !== 0 && data.t < Date.now()) {
          if (this.options.deleteOnExpire) {
            _retval = false;
            this.del(key);
          }
          this.emit("expired", key, this._unwrap(data));
        }
        return _retval;
      }

      _isInvalidKey(key) {
        var ref;
        boundMethodCheck(this, NodeCache);
        if (ref = typeof key, indexOf.call(this.validKeyTypes, ref) < 0) {
          return this._error("EKEYTYPE", {
            type: typeof key
          });
        }
      }

      _wrap(value, ttl, asClone = true) {
        var livetime, now, oReturn, ttlMultiplicator;
        boundMethodCheck(this, NodeCache);
        if (!this.options.useClones) {
          asClone = false;
        }
        // define the time to live
        now = Date.now();
        livetime = 0;
        ttlMultiplicator = 1000;
        // use given ttl
        if (ttl === 0) {
          livetime = 0;
        } else if (ttl) {
          livetime = now + (ttl * ttlMultiplicator);
        } else {
          // use standard ttl
          if (this.options.stdTTL === 0) {
            livetime = this.options.stdTTL;
          } else {
            livetime = now + (this.options.stdTTL * ttlMultiplicator);
          }
        }
        // return the wrapped value
        return oReturn = {
          t: livetime,
          v: asClone ? clone(value) : value
        };
      }

      // ## _unwrap

      // internal method to extract get the value out of the wrapped value
      _unwrap(value, asClone = true) {
        if (!this.options.useClones) {
          asClone = false;
        }
        if (value.v != null) {
          if (asClone) {
            return clone(value.v);
          } else {
            return value.v;
          }
        }
        return null;
      }

      // ## _getKeyLength

      // internal method the calculate the key length
      _getKeyLength(key) {
        return key.toString().length;
      }

      _getValLength(value) {
        boundMethodCheck(this, NodeCache);
        if (typeof value === "string") {
          // if the value is a String get the real length
          return value.length;
        } else if (this.options.forceString) {
          // force string if it's defined and not passed
          return JSON.stringify(value).length;
        } else if (Array.isArray(value)) {
          // if the data is an Array multiply each element with a defined default length
          return this.options.arrayValueSize * value.length;
        } else if (typeof value === "number") {
          return 8;
        } else if (typeof (value != null ? value.then : void 0) === "function") {
          // if the data is a Promise, use defined default
          // (can't calculate actual/resolved value size synchronously)
          return this.options.promiseValueSize;
        } else if (typeof Buffer !== "undefined" && Buffer !== null ? Buffer.isBuffer(value) : void 0) {
          return value.length;
        } else if ((value != null) && typeof value === "object") {
          // if the data is an Object multiply each element with a defined default length
          return this.options.objectValueSize * Object.keys(value).length;
        } else if (typeof value === "boolean") {
          return 8;
        } else {
          // default fallback
          return 0;
        }
      }

      _error(type, data = {}) {
        var error;
        boundMethodCheck(this, NodeCache);
        // generate the error object
        error = new Error();
        error.name = type;
        error.errorcode = type;
        error.message = this.ERRORS[type] != null ? this.ERRORS[type](data) : "-";
        error.data = data;
        // return the error object
        return error;
      }

      _initErrors() {
        var _errMsg, _errT, ref;
        boundMethodCheck(this, NodeCache);
        this.ERRORS = {};
        ref = this._ERRORS;
        for (_errT in ref) {
          _errMsg = ref[_errT];
          this.ERRORS[_errT] = this.createErrorMessage(_errMsg);
        }
      }

      createErrorMessage(errMsg) {
        return function(args) {
          return errMsg.replace("__key", args.type);
        };
      }

    };

    NodeCache.prototype._ERRORS = {
      "ENOTFOUND": "Key `__key` not found",
      "ECACHEFULL": "Cache max keys amount exceeded",
      "EKEYTYPE": "The key argument has to be of type `string` or `number`. Found: `__key`",
      "EKEYSTYPE": "The keys argument has to be an array.",
      "ETTLTYPE": "The ttl argument has to be a number."
    };

    return NodeCache;

  }).call(this);

}).call(this);


/***/ }),
/* 114 */
/***/ ((module) => {

var clone = (function() {
'use strict';

function _instanceof(obj, type) {
  return type != null && obj instanceof type;
}

var nativeMap;
try {
  nativeMap = Map;
} catch(_) {
  // maybe a reference error because no `Map`. Give it a dummy value that no
  // value will ever be an instanceof.
  nativeMap = function() {};
}

var nativeSet;
try {
  nativeSet = Set;
} catch(_) {
  nativeSet = function() {};
}

var nativePromise;
try {
  nativePromise = Promise;
} catch(_) {
  nativePromise = function() {};
}

/**
 * Clones (copies) an Object using deep copying.
 *
 * This function supports circular references by default, but if you are certain
 * there are no circular references in your object, you can save some CPU time
 * by calling clone(obj, false).
 *
 * Caution: if `circular` is false and `parent` contains circular references,
 * your program may enter an infinite loop and crash.
 *
 * @param `parent` - the object to be cloned
 * @param `circular` - set to true if the object to be cloned may contain
 *    circular references. (optional - true by default)
 * @param `depth` - set to a number if the object is only to be cloned to
 *    a particular depth. (optional - defaults to Infinity)
 * @param `prototype` - sets the prototype to be used when cloning an object.
 *    (optional - defaults to parent prototype).
 * @param `includeNonEnumerable` - set to true if the non-enumerable properties
 *    should be cloned as well. Non-enumerable properties on the prototype
 *    chain will be ignored. (optional - false by default)
*/
function clone(parent, circular, depth, prototype, includeNonEnumerable) {
  if (typeof circular === 'object') {
    depth = circular.depth;
    prototype = circular.prototype;
    includeNonEnumerable = circular.includeNonEnumerable;
    circular = circular.circular;
  }
  // maintain two arrays for circular references, where corresponding parents
  // and children have the same index
  var allParents = [];
  var allChildren = [];

  var useBuffer = typeof Buffer != 'undefined';

  if (typeof circular == 'undefined')
    circular = true;

  if (typeof depth == 'undefined')
    depth = Infinity;

  // recurse this function so we don't reset allParents and allChildren
  function _clone(parent, depth) {
    // cloning null always returns null
    if (parent === null)
      return null;

    if (depth === 0)
      return parent;

    var child;
    var proto;
    if (typeof parent != 'object') {
      return parent;
    }

    if (_instanceof(parent, nativeMap)) {
      child = new nativeMap();
    } else if (_instanceof(parent, nativeSet)) {
      child = new nativeSet();
    } else if (_instanceof(parent, nativePromise)) {
      child = new nativePromise(function (resolve, reject) {
        parent.then(function(value) {
          resolve(_clone(value, depth - 1));
        }, function(err) {
          reject(_clone(err, depth - 1));
        });
      });
    } else if (clone.__isArray(parent)) {
      child = [];
    } else if (clone.__isRegExp(parent)) {
      child = new RegExp(parent.source, __getRegExpFlags(parent));
      if (parent.lastIndex) child.lastIndex = parent.lastIndex;
    } else if (clone.__isDate(parent)) {
      child = new Date(parent.getTime());
    } else if (useBuffer && Buffer.isBuffer(parent)) {
      if (Buffer.allocUnsafe) {
        // Node.js >= 4.5.0
        child = Buffer.allocUnsafe(parent.length);
      } else {
        // Older Node.js versions
        child = new Buffer(parent.length);
      }
      parent.copy(child);
      return child;
    } else if (_instanceof(parent, Error)) {
      child = Object.create(parent);
    } else {
      if (typeof prototype == 'undefined') {
        proto = Object.getPrototypeOf(parent);
        child = Object.create(proto);
      }
      else {
        child = Object.create(prototype);
        proto = prototype;
      }
    }

    if (circular) {
      var index = allParents.indexOf(parent);

      if (index != -1) {
        return allChildren[index];
      }
      allParents.push(parent);
      allChildren.push(child);
    }

    if (_instanceof(parent, nativeMap)) {
      parent.forEach(function(value, key) {
        var keyChild = _clone(key, depth - 1);
        var valueChild = _clone(value, depth - 1);
        child.set(keyChild, valueChild);
      });
    }
    if (_instanceof(parent, nativeSet)) {
      parent.forEach(function(value) {
        var entryChild = _clone(value, depth - 1);
        child.add(entryChild);
      });
    }

    for (var i in parent) {
      var attrs;
      if (proto) {
        attrs = Object.getOwnPropertyDescriptor(proto, i);
      }

      if (attrs && attrs.set == null) {
        continue;
      }
      child[i] = _clone(parent[i], depth - 1);
    }

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(parent);
      for (var i = 0; i < symbols.length; i++) {
        // Don't need to worry about cloning a symbol because it is a primitive,
        // like a number or string.
        var symbol = symbols[i];
        var descriptor = Object.getOwnPropertyDescriptor(parent, symbol);
        if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
          continue;
        }
        child[symbol] = _clone(parent[symbol], depth - 1);
        if (!descriptor.enumerable) {
          Object.defineProperty(child, symbol, {
            enumerable: false
          });
        }
      }
    }

    if (includeNonEnumerable) {
      var allPropertyNames = Object.getOwnPropertyNames(parent);
      for (var i = 0; i < allPropertyNames.length; i++) {
        var propertyName = allPropertyNames[i];
        var descriptor = Object.getOwnPropertyDescriptor(parent, propertyName);
        if (descriptor && descriptor.enumerable) {
          continue;
        }
        child[propertyName] = _clone(parent[propertyName], depth - 1);
        Object.defineProperty(child, propertyName, {
          enumerable: false
        });
      }
    }

    return child;
  }

  return _clone(parent, depth);
}

/**
 * Simple flat clone using prototype, accepts only objects, usefull for property
 * override on FLAT configuration object (no nested props).
 *
 * USE WITH CAUTION! This may not behave as you wish if you do not know how this
 * works.
 */
clone.clonePrototype = function clonePrototype(parent) {
  if (parent === null)
    return null;

  var c = function () {};
  c.prototype = parent;
  return new c();
};

// private utility functions

function __objToStr(o) {
  return Object.prototype.toString.call(o);
}
clone.__objToStr = __objToStr;

function __isDate(o) {
  return typeof o === 'object' && __objToStr(o) === '[object Date]';
}
clone.__isDate = __isDate;

function __isArray(o) {
  return typeof o === 'object' && __objToStr(o) === '[object Array]';
}
clone.__isArray = __isArray;

function __isRegExp(o) {
  return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
}
clone.__isRegExp = __isRegExp;

function __getRegExpFlags(re) {
  var flags = '';
  if (re.global) flags += 'g';
  if (re.ignoreCase) flags += 'i';
  if (re.multiline) flags += 'm';
  return flags;
}
clone.__getRegExpFlags = __getRegExpFlags;

return clone;
})();

if ( true && module.exports) {
  module.exports = clone;
}


/***/ }),
/* 115 */
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),
/* 116 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.YouTubePlayer = void 0;
const vscode = __importStar(__webpack_require__(1));
const Constants_1 = __webpack_require__(110);
const MemoryManager_1 = __webpack_require__(111);
/**
 * YouTube music search and playback handler.
 * Uses ytsr for search and ytdl-core for stream URL extraction.
 */
class YouTubePlayer {
    constructor() {
        this.searchDebounceTimer = null;
        this.cache = MemoryManager_1.MemoryManager.getInstance();
    }
    /**
     * Search YouTube for music
     */
    async search(query, maxResults = Constants_1.CONSTANTS.YT_MAX_RESULTS) {
        const cacheKey = `ytsearch:${query}:${maxResults}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const ytsr = __webpack_require__(117);
            const filters = await ytsr.getFilters(query);
            const videoFilter = filters.get('Type')?.get('Video');
            const searchResults = await ytsr(videoFilter?.url || query, {
                limit: maxResults,
                pages: 1
            });
            const results = searchResults.items
                .filter((item) => item.type === 'video')
                .map((item) => ({
                id: item.id,
                title: this.cleanTitle(item.title),
                artist: item.author?.name || 'Unknown',
                duration: this.parseDuration(item.duration),
                thumbnailUri: item.bestThumbnail?.url || '',
                source: 'youtube',
                uri: item.url
            }));
            // Cache results
            this.cache.set(cacheKey, results, 1800); // 30 min TTL
            return results;
        }
        catch (error) {
            console.error('[SonicFlow] YouTube search error:', error);
            vscode.window.showErrorMessage('YouTube search failed. Check your internet connection.');
            return [];
        }
    }
    /**
     * Interactive search with QuickPick UI
     */
    async interactiveSearch() {
        const query = await vscode.window.showInputBox({
            prompt: '🔍 Search YouTube Music',
            placeHolder: 'Enter song name, artist, or paste YouTube URL...',
            title: 'SonicFlow - YouTube Search'
        });
        if (!query) {
            return null;
        }
        // Check if it's a direct YouTube URL
        if (this.isYouTubeUrl(query)) {
            return this.getTrackFromUrl(query);
        }
        const results = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'SonicFlow: Searching YouTube...',
            cancellable: true
        }, async (_progress, token) => {
            if (token.isCancellationRequested) {
                return [];
            }
            return this.search(query);
        });
        if (results.length === 0) {
            vscode.window.showInformationMessage('No results found.');
            return null;
        }
        const items = results.map(r => ({
            label: `$(play) ${r.title}`,
            description: r.artist,
            detail: `Duration: ${this.formatDuration(r.duration)}`,
            // Store reference
            picked: false
        }));
        const selected = await vscode.window.showQuickPick(items, {
            title: 'SonicFlow - Search Results',
            placeHolder: 'Select a track to play',
            matchOnDescription: true,
            matchOnDetail: true
        });
        if (!selected) {
            return null;
        }
        const selectedIndex = items.indexOf(selected);
        const result = results[selectedIndex];
        return this.searchResultToTrack(result);
    }
    /**
     * Get audio stream URL from a YouTube video
     */
    async getStreamUrl(videoUrl) {
        const cacheKey = `ytstream:${videoUrl}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const ytdl = __webpack_require__(127);
            const info = await ytdl.getInfo(videoUrl);
            // Get best audio-only format
            const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
            if (audioFormats.length === 0) {
                console.error('[SonicFlow] No audio formats available');
                return null;
            }
            // Sort by quality and pick the best one
            const bestFormat = audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
            const streamUrl = bestFormat.url;
            // Cache with shorter TTL since YouTube URLs expire
            this.cache.set(cacheKey, streamUrl, 3600); // 1 hour
            return streamUrl;
        }
        catch (error) {
            console.error('[SonicFlow] Stream URL extraction error:', error);
            return null;
        }
    }
    /**
     * Get track info from a YouTube URL
     */
    async getTrackFromUrl(url) {
        try {
            const ytdl = __webpack_require__(127);
            const info = await ytdl.getInfo(url);
            const videoDetails = info.videoDetails;
            return {
                id: `yt_${videoDetails.videoId}`,
                title: this.cleanTitle(videoDetails.title),
                artist: videoDetails.author.name,
                duration: parseInt(videoDetails.lengthSeconds) || 0,
                source: 'youtube',
                uri: url,
                thumbnailUri: videoDetails.thumbnails?.[0]?.url,
                addedAt: Date.now()
            };
        }
        catch (error) {
            console.error('[SonicFlow] Failed to get video info:', error);
            return null;
        }
    }
    /**
     * Search for related/similar videos (for Vibe Mode)
     */
    async getRelatedTracks(track, count = 10) {
        try {
            const searchQuery = `${track.artist} ${track.genre || ''} similar music`;
            const results = await this.search(searchQuery, count);
            return results
                .filter(r => r.id !== track.id)
                .map(r => this.searchResultToTrack(r));
        }
        catch (error) {
            console.error('[SonicFlow] Related tracks error:', error);
            return [];
        }
    }
    searchResultToTrack(result) {
        return {
            id: `yt_${result.id}`,
            title: result.title,
            artist: result.artist,
            duration: result.duration,
            source: 'youtube',
            uri: result.uri,
            thumbnailUri: result.thumbnailUri,
            addedAt: Date.now()
        };
    }
    isYouTubeUrl(text) {
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(text);
    }
    cleanTitle(title) {
        // Remove common YouTube title patterns
        return title
            .replace(/\(Official\s*(Music\s*)?Video\)/gi, '')
            .replace(/\[Official\s*(Music\s*)?Video\]/gi, '')
            .replace(/\(Lyrics?\)/gi, '')
            .replace(/\[Lyrics?\]/gi, '')
            .replace(/\(Audio\)/gi, '')
            .replace(/\[Audio\]/gi, '')
            .replace(/\s*\|\s*.*$/, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
    parseDuration(durationStr) {
        if (!durationStr) {
            return 0;
        }
        const parts = durationStr.split(':').reverse();
        let seconds = 0;
        for (let i = 0; i < parts.length; i++) {
            seconds += parseInt(parts[i]) * Math.pow(60, i);
        }
        return seconds;
    }
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    dispose() {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
    }
}
exports.YouTubePlayer = YouTubePlayer;


/***/ }),
/* 117 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PARSE_ITEM = __webpack_require__(118);
const MINIGET = __webpack_require__(120);
const UTIL = __webpack_require__(119);
const QS = __webpack_require__(126);

const BASE_SEARCH_URL = 'https://www.youtube.com/results?';
const BASE_API_URL = 'https://www.youtube.com/youtubei/v1/search?key=';

const main = module.exports = async(searchString, options, rt = 3) => {
  if (rt === 0) throw new Error('Unable to find JSON!');
  // Set default values
  const opts = UTIL.checkArgs(searchString, options);

  const ref = BASE_SEARCH_URL + QS.encode(opts.query);
  const body = await MINIGET(ref, opts.requestOptions).text();
  const parsed = UTIL.parseBody(body, opts);
  // Retry if unable to find json => most likely old response
  if (!parsed.json) return main(searchString, options, rt - 1);

  // Pass Errors from the API
  if (parsed.json.alerts && !parsed.json.contents) {
    let error = parsed.json.alerts.find(a => a.alertRenderer && a.alertRenderer.type === 'ERROR');
    if (error) throw new Error(`API-Error: ${UTIL.parseText(error.alertRenderer.text, '* no message *')}`);
  }

  const resp = {
    // Query that was searched
    originalQuery: opts.search,
    // Query that youtube shows results for
    correctedQuery: opts.search,
    results: Number(parsed.json.estimatedResults) || 0,
    activeFilters: [],
    refinements: [],
    items: [],
    continuation: null,
  };
  // Add refinements
  if (Array.isArray(parsed.json.refinements)) {
    parsed.json.refinements.map(r => ({
      q: r,
      url: new URL(r, BASE_SEARCH_URL).toString(),
      bestThumbnail: null,
      thumbnails: null,
    }));
  }

  // General wrapper
  const { rawItems, continuation } = UTIL.parseWrapper(
    parsed.json.contents.twoColumnSearchResultsRenderer.primaryContents,
  );

  // Parse items
  resp.items = rawItems.map(a => PARSE_ITEM(a, resp)).filter(a => a).filter((_, index) => index < opts.limit);

  // Adjust tracker
  opts.limit -= resp.items.length;
  opts.pages -= 1;

  // Get information about set filters
  const filters = UTIL.parseFilters(parsed.json);
  resp.activeFilters = Array.from(filters).map(a => a[1].active).filter(a => a);

  // Parse the nextpageToken
  let token = null;
  if (continuation) token = continuation.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
  // Only provide continuation if we're pulling all items or using paging
  if (token && opts.limit === Infinity) resp.continuation = [parsed.apiKey, token, parsed.context, opts];

  // We're already on last page or hit the limit
  if (!token || opts.limit < 1 || opts.pages < 1) return resp;

  // Recursively fetch more items
  const nestedResp = await parsePage2(parsed.apiKey, token, parsed.context, opts);

  // Merge the responses
  resp.items.push(...nestedResp.items);
  resp.continuation = nestedResp.continuation;
  return resp;
};
main.version = (__webpack_require__(125).version);

const parsePage2 = async(apiKey, token, context, opts) => {
  const json = await UTIL.doPost(BASE_API_URL + apiKey, { context, continuation: token }, opts.requestOptions);

  if (!Array.isArray(json.onResponseReceivedCommands)) {
    // No more content
    return { continuation: null, items: [] };
  }

  const { rawItems, continuation } = UTIL.parsePage2Wrapper(
    json.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems,
  );

  // Parse items
  const parsedItems = rawItems.map(a => PARSE_ITEM(a)).filter(a => a).filter((_, index) => index < opts.limit);

  // Adjust tracker
  opts.limit -= parsedItems.length;
  opts.pages -= 1;

  // Parse the nextpageToken
  let nextToken = null;
  if (continuation) nextToken = continuation.continuationItemRenderer.continuationEndpoint.continuationCommand.token;

  // We're already on last page or hit the limit
  if (!nextToken || opts.limit < 1 || opts.pages < 1) {
    return {
      continuation: nextToken && opts.limit === Infinity ? [apiKey, nextToken, context, opts] : null,
      items: parsedItems,
    };
  }

  // Recursively fetch more items
  const nestedResp = await parsePage2(apiKey, nextToken, context, opts);
  nestedResp.items.unshift(...parsedItems);
  return nestedResp;
};
// eslint-disable-next-line require-await
main.continueReq = async args => {
  // Check params
  if (!Array.isArray(args) || args.length !== 4) throw new Error('invalid continuation array');
  if (!args[0] || typeof args[0] !== 'string') throw new Error('invalid apiKey');
  if (!args[1] || typeof args[1] !== 'string') throw new Error('invalid token');
  if (!args[2] || typeof args[2] !== 'object') throw new Error('invalid context');
  if (!args[3] || typeof args[3] !== 'object') throw new Error('invalid opts');
  if (args[3].limit !== null && !isNaN(args[3].limit) && isFinite(args[3].limit)) {
    throw new Error('continueReq only allowed for paged requests');
  }
  // Enforce pagination information
  args[3].pages = 1;
  args[3].limit = Infinity;
  return parsePage2(...args);
};

main.getFilters = async(searchString, options) => {
  const opts = UTIL.checkArgs(searchString, options);

  const ref = BASE_SEARCH_URL + QS.encode(opts.query);
  const body = await MINIGET(ref, opts.requestOptions).text();
  const parsed = UTIL.parseBody(body);
  // Retry if old response
  if (!parsed.json) return main.getFilters(searchString, options);
  return UTIL.parseFilters(parsed.json);
};


/***/ }),
/* 118 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const UTIL = __webpack_require__(119);
const PATH = __webpack_require__(4);
const FS = __webpack_require__(5);

const BASE_VIDEO_URL = 'https://www.youtube.com/watch?v=';
const prepImg = UTIL.prepImg;

const parseItem = (item, resp) => {
  const type = Object.keys(item)[0];

  switch (type) {
    // Regular Content or Multi-Content
    case 'videoRenderer':
      return parseVideo(item[type]);
    case 'channelRenderer':
      return parseChannel(item[type]);
    case 'playlistRenderer':
      return parsePlaylist(item[type]);
    case 'radioRenderer':
      return parseMix(item[type]);
    case 'gridMovieRenderer':
      return parseGridMovie(item[type]);
    case 'gridVideoRenderer':
      return parseVideo(item[type]);
    case 'movieRenderer':
      return parseMovie(item[type]);
    case 'reelItemRenderer':
      return parseShort(item[type]);
    case 'shelfRenderer':
    case 'richShelfRenderer':
    case 'reelShelfRenderer':
      return parseShelf(item[type]);
    case 'showRenderer':
      return parseShow(item[type]);

    // Change resp#refinements or resp#resultsFor
    case 'didYouMeanRenderer':
      // YouTube advises another query
      return parseDidYouMeanRenderer(item[type], resp);
    case 'showingResultsForRenderer':
      // The results are for another query
      return parseShowingResultsFor(item, resp);
    case 'horizontalCardListRenderer':
      return parseHorizontalCardListRenderer(item[type], resp);
    case 'includingResultsForRenderer':
      //  Informational Item we can ignore
      return null;

    // Message-Types
    // Skip all messages, since "no more results" changes with the language
    case 'backgroundPromoRenderer':
    case 'messageRenderer':
    case 'infoPanelContainerRenderer':
      return null;
    case 'clarificationRenderer':
      return parseClarification(item[type]);

    // Skip Ads for now
    case 'reelPlayerHeaderRenderer':
    case 'adSlotRenderer':
    case 'carouselAdRenderer':
    case 'searchPyvRenderer':
    case 'promotedVideoRenderer':
    case 'promotedSparklesTextSearchRenderer':
    case 'compactPromotedItemRenderer':
    case 'promotedSparklesWebRenderer':
      return null;
    // Skip emergencyOneboxRenderer (for now?)
    case 'emergencyOneboxRenderer':
      // Emergency Notifications like: Thinking about suicide? Call xxxx
      return null;

    case 'chipCloudRenderer':
      // Chips are tags associated with a query - ignore for now
      return null;

    // For debugging purpose
    case 'debug#previewCardRenderer':
      return parseHorizontalChannelListItem(item[type]);

    // New type & file without json until now => save
    default:
      throw new Error(`type ${type} is not known`);
  }
};

const catchAndLogFunc = (func, params = []) => {
  if (!Array.isArray(params)) throw new Error('params has to be an (optionally empty) array');
  try {
    return func(...params);
  } catch (e) {
    const dir = PATH.resolve(__dirname, '../dumps/');
    const file = PATH.resolve(dir, `${Math.random().toString(36).substr(3)}-${Date.now()}.txt`);
    const cfg = PATH.resolve(__dirname, '../package.json');
    const bugsRef = __webpack_require__(124)(cfg).bugs.url;

    /* eslint-disable no-console */
    console.error(e.stack);
    console.error(`\n/${'*'.repeat(200)}`);
    console.error(`failed at func ${func.name}: ${e.message}`);
    console.error(`pls post the the files in ${dir} to ${bugsRef}`);
    let info = `os: ${process.platform}-${process.arch}, `;
    info += `node.js: ${process.version}, `;
    info += `ytsr: ${(__webpack_require__(125).version)}`;
    console.error(info);
    console.error(`${'*'.repeat(200)}\\`);
    /* eslint-enable no-console */

    try {
      if (!FS.existsSync(dir)) FS.mkdirSync(dir);
      FS.writeFileSync(file, JSON.stringify(params, null, 2));
    } catch (e2) {
      console.warn('Could not write dumps to file:', e2);
    }

    return null;
  }
};
const main = module.exports = (...params) => catchAndLogFunc(parseItem, params);
main._hidden = { catchAndLogFunc, parseItem };

// TYPES:
const parseVideo = obj => {
  const author = obj.ownerText && obj.ownerText.runs[0];
  let authorUrl = null;
  if (author) {
    authorUrl = author.navigationEndpoint.browseEndpoint.canonicalBaseUrl ||
      author.navigationEndpoint.commandMetadata.webCommandMetadata.url;
  }
  const badges = Array.isArray(obj.badges) ? obj.badges.map(a => a.metadataBadgeRenderer.label) : [];
  const isLive = badges.some(b => b === 'LIVE NOW');
  const upcoming = obj.upcomingEventData ? Number(`${obj.upcomingEventData.startTime}000`) : null;
  const ctsr = obj.channelThumbnailSupportedRenderers;
  const authorImg = !ctsr ? { thumbnail: { thumbnails: [] } } : ctsr.channelThumbnailWithLinkRenderer;
  const isOfficial = !!(obj.ownerBadges && JSON.stringify(obj.ownerBadges).includes('OFFICIAL'));
  const isVerified = !!(obj.ownerBadges && JSON.stringify(obj.ownerBadges).includes('VERIFIED'));
  const lengthFallback = obj.thumbnailOverlays.find(x => Object.keys(x)[0] === 'thumbnailOverlayTimeStatusRenderer');
  const length = obj.lengthText || (lengthFallback && lengthFallback.thumbnailOverlayTimeStatusRenderer.text);

  return {
    type: 'video',
    title: UTIL.parseText(obj.title, ''),
    id: obj.videoId,
    url: BASE_VIDEO_URL + obj.videoId,
    bestThumbnail: prepImg(obj.thumbnail.thumbnails)[0],
    thumbnails: prepImg(obj.thumbnail.thumbnails),
    isUpcoming: !!upcoming,
    upcoming,
    isLive,
    badges,

    // Author can be null for shows like whBqghP5Oow
    author: author ? {
      name: author.text,
      channelID: author.navigationEndpoint.browseEndpoint.browseId,
      url: new URL(authorUrl, BASE_VIDEO_URL).toString(),
      bestAvatar: prepImg(authorImg.thumbnail.thumbnails)[0] || null,
      avatars: prepImg(authorImg.thumbnail.thumbnails),
      ownerBadges: Array.isArray(obj.ownerBadges) ? obj.ownerBadges.map(a => a.metadataBadgeRenderer.tooltip) : [],
      verified: isOfficial || isVerified,
    } : null,

    description: UTIL.parseText(obj.descriptionSnippet),

    views: !obj.viewCountText ? null : UTIL.parseIntegerFromText(obj.viewCountText),
    // Duration not provided for live & sometimes with upcoming & sometimes randomly
    duration: UTIL.parseText(length),
    // UploadedAt not provided for live & upcoming & sometimes randomly
    uploadedAt: UTIL.parseText(obj.publishedTimeText),
  };
};

const parseChannel = obj => {
  const targetUrl = obj.navigationEndpoint.browseEndpoint.canonicalBaseUrl ||
    obj.navigationEndpoint.commandMetadata.webCommandMetadata.url;
  const isOfficial = !!(obj.ownerBadges && JSON.stringify(obj.ownerBadges).includes('OFFICIAL'));
  const isVerified = !!(obj.ownerBadges && JSON.stringify(obj.ownerBadges).includes('VERIFIED'));

  return {
    type: 'channel',
    name: UTIL.parseText(obj.title, ''),
    channelID: obj.channelId,
    url: new URL(targetUrl, BASE_VIDEO_URL).toString(),
    bestAvatar: prepImg(obj.thumbnail.thumbnails)[0],
    avatars: prepImg(obj.thumbnail.thumbnails),
    verified: isOfficial || isVerified,

    subscribers: UTIL.parseText(obj.subscriberCountText),
    descriptionShort: UTIL.parseText(obj.descriptionSnippet),
    videos: obj.videoCountText ? UTIL.parseIntegerFromText(obj.videoCountText) : null,
  };
};

const parsePlaylist = obj => ({
  type: 'playlist',
  title: UTIL.parseText(obj.title, ''),
  playlistID: obj.playlistId,
  url: `https://www.youtube.com/playlist?list=${obj.playlistId}`,
  firstVideo: Array.isArray(obj.videos) && obj.videos.length > 0 ? {
    id: obj.navigationEndpoint.watchEndpoint.videoId,
    shortURL: BASE_VIDEO_URL + obj.navigationEndpoint.watchEndpoint.videoId,
    url: new URL(obj.navigationEndpoint.commandMetadata.webCommandMetadata.url, BASE_VIDEO_URL).toString(),
    title: UTIL.parseText(obj.videos[0].childVideoRenderer.title, ''),
    length: UTIL.parseText(obj.videos[0].childVideoRenderer.lengthText, ''),
    thumbnails: prepImg(obj.thumbnails[0].thumbnails),
    bestThumbnail: prepImg(obj.thumbnails[0].thumbnails)[0],
  } : null,

  // Some Playlists starting with OL only provide a simple string
  owner: obj.shortBylineText.simpleText ? null : _parseOwner(obj),

  publishedAt: UTIL.parseText(obj.publishedTimeText),
  length: Number(obj.videoCount),
});

const parseMix = obj => ({
  type: 'mix',
  title: UTIL.parseText(obj.title, ''),
  url: new URL(obj.navigationEndpoint.commandMetadata.webCommandMetadata.url, BASE_VIDEO_URL).toString(),

  firstVideo: {
    id: obj.navigationEndpoint.watchEndpoint.videoId,
    shortURL: BASE_VIDEO_URL + obj.navigationEndpoint.watchEndpoint.videoId,
    url: new URL(obj.navigationEndpoint.commandMetadata.webCommandMetadata.url, BASE_VIDEO_URL).toString(),
    text: UTIL.parseText(obj.videos[0].childVideoRenderer.title, ''),
    length: UTIL.parseText(obj.videos[0].childVideoRenderer.lengthText, ''),
    thumbnails: prepImg(obj.thumbnail.thumbnails),
    bestThumbnail: prepImg(obj.thumbnail.thumbnails)[0],
  },
});

const parseDidYouMeanRenderer = (obj, resp) => {
  // Add as the first item in refinements
  if (resp && Array.isArray(resp.refinements)) {
    resp.refinements.unshift({
      q: UTIL.parseText(obj.correctedQuery, ''),
      url: new URL(obj.correctedQueryEndpoint.commandMetadata.webCommandMetadata.url, BASE_VIDEO_URL).toString(),
      bestThumbnail: null,
      thumbnails: null,
    });
  }
  return null;
};

const parseShowingResultsFor = (obj, resp) => {
  // Add as resultsFor
  const cor = obj.showingResultsForRenderer.correctedQuery || obj.correctedQuery;
  if (resp) resp.correctedQuery = UTIL.parseText(cor);
  return null;
};

const parseClarification = obj => ({
  type: 'clarification',
  title: UTIL.parseText(obj.contentTitle, ''),
  text: UTIL.parseText(obj.text, ''),
  sources: [
    {
      text: UTIL.parseText(obj.source, ''),
      url: new URL(obj.endpoint.urlEndpoint.url, BASE_VIDEO_URL).toString(),
    },
    !obj.secondarySource ? null : {
      text: UTIL.parseText(obj.secondarySource, ''),
      url: new URL(obj.secondaryEndpoint.urlEndpoint.url, BASE_VIDEO_URL).toString(),
    },
  ].filter(a => a),
});

const parseHorizontalCardListRenderer = (obj, resp) => {
  const subType = Object.keys(obj.cards[0])[0];

  switch (subType) {
    case 'searchRefinementCardRenderer':
      return parseHorizontalRefinements(obj, resp);
    case 'previewCardRenderer':
      return parseHorizontalChannelList(obj);
    default:
      throw new Error(`subType ${subType} of type horizontalCardListRenderer not known`);
  }
};

const parseHorizontalRefinements = (obj, resp) => {
  // Add to refinements
  if (resp && Array.isArray(resp.refinements)) {
    resp.refinements.push(...obj.cards.map(c => {
      const targetUrl = c.searchRefinementCardRenderer.searchEndpoint.commandMetadata.webCommandMetadata.url;
      return {
        q: UTIL.parseText(c.searchRefinementCardRenderer.query, ''),
        url: new URL(targetUrl, BASE_VIDEO_URL).toString(),
        bestThumbnail: prepImg(c.searchRefinementCardRenderer.thumbnail.thumbnails)[0],
        thumbnails: prepImg(c.searchRefinementCardRenderer.thumbnail.thumbnails),
      };
    }));
  }
  return null;
};

const parseHorizontalChannelList = obj => {
  if (!JSON.stringify(obj.style).includes('CHANNELS')) {
    // Not sure if this is always a channel + videos
    throw new Error(`unknown style in horizontalCardListRenderer`);
  }
  return {
    type: 'horizontalChannelList',
    title: UTIL.parseText(obj.header.richListHeaderRenderer.title, ''),
    channels: obj.cards.map(i => parseHorizontalChannelListItem(i.previewCardRenderer)).filter(a => a),
  };
};

const parseHorizontalChannelListItem = obj => {
  const thumbnailRenderer = obj.header.richListHeaderRenderer.channelThumbnail.channelThumbnailWithLinkRenderer;
  return {
    type: 'channelPreview',
    name: UTIL.parseText(obj.header.richListHeaderRenderer.title, ''),
    channelID: obj.header.richListHeaderRenderer.endpoint.browseEndpoint.browseId,
    url: new URL(
      obj.header.richListHeaderRenderer.endpoint.commandMetadata.webCommandMetadata.url,
      BASE_VIDEO_URL,
    ).toString(),
    bestAvatar: prepImg(thumbnailRenderer.thumbnail.thumbnails)[0],
    avatars: prepImg(thumbnailRenderer.thumbnail.thumbnails),
    subscribers: UTIL.parseText(obj.header.richListHeaderRenderer.subtitle, ''),
    // Type: gridVideoRenderer
    videos: obj.contents.map(i => parseVideo(i.gridVideoRenderer)).filter(a => a),
  };
};

const parseGridMovie = obj => ({
  // Movie which can be found in horizontalMovieListRenderer
  type: 'gridMovie',
  title: UTIL.parseText(obj.title),
  videoID: obj.videoId,
  url: new URL(obj.navigationEndpoint.commandMetadata.webCommandMetadata.url, BASE_VIDEO_URL).toString(),
  bestThumbnail: prepImg(obj.thumbnail.thumbnails)[0],
  thumbnails: prepImg(obj.thumbnail.thumbnails),
  duration: UTIL.parseText(obj.lengthText),
});

const parseMovie = obj => {
  // Normalize
  obj.bottomMetadataItems = (obj.bottomMetadataItems || []).map(x => UTIL.parseText(x));
  const actorsString = obj.bottomMetadataItems.find(x => x.startsWith('Actors'));
  const directorsString = obj.bottomMetadataItems.find(x => x.startsWith('Director'));

  return {
    type: 'movie',
    title: UTIL.parseText(obj.title, ''),
    videoID: obj.videoId,
    url: new URL(obj.navigationEndpoint.commandMetadata.webCommandMetadata.url, BASE_VIDEO_URL).toString(),
    bestThumbnail: prepImg(obj.thumbnail.thumbnails)[0],
    thumbnails: prepImg(obj.thumbnail.thumbnails),

    owner: _parseOwner(obj),
    description: UTIL.parseText(obj.descriptionSnippet),
    meta: UTIL.parseText(obj.topMetadataItems[0], '').split(' · '),
    actors: !actorsString ? [] : actorsString.split(': ')[1].split(', '),
    directors: !directorsString ? [] : directorsString.split(': ')[1].split(', '),
    duration: UTIL.parseText(obj.lengthText, ''),
  };
};

const parseShort = obj => {
  const core = {
    type: 'short',
    title: UTIL.parseText(obj.headline, ''),
    videoID: obj.videoId,
    url: new URL(obj.navigationEndpoint.commandMetadata.webCommandMetadata.url, BASE_VIDEO_URL).toString(),
    bestThumbnail: prepImg(obj.thumbnail.thumbnails)[0],
    thumbnails: prepImg(obj.thumbnail.thumbnails),
    views: UTIL.parseText(obj.viewCountText, ''),
    published: null,
    channel: null,
  };
  const reelPlayerOverlayRenderer = obj.navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer;
  if (reelPlayerOverlayRenderer.reelPlayerHeaderSupportedRenderers) {
    const playerHeader = reelPlayerOverlayRenderer.reelPlayerHeaderSupportedRenderers.reelPlayerHeaderRenderer;
    const channelNavEndpoint = playerHeader.channelTitleText.runs[0].navigationEndpoint;
    core.published = UTIL.parseText(playerHeader.timestampText, '');
    core.channel = {
      name: UTIL.parseText(playerHeader.channelTitleText, ''),
      channelID: channelNavEndpoint.browseEndpoint.browseId,
      url: new URL(channelNavEndpoint.commandMetadata.webCommandMetadata.url, BASE_VIDEO_URL).toString(),
      bestAvatar: prepImg(playerHeader.channelThumbnail.thumbnails)[0] || null,
      avatars: prepImg(playerHeader.channelThumbnail.thumbnails),
    };
  }
  return core;
};

const parseShow = obj => {
  const thumbnails = obj.thumbnailRenderer.showCustomThumbnailRenderer.thumbnail.thumbnails;
  const owner = _parseOwner(obj);
  delete owner.ownerBadges;
  delete owner.verified;

  return {
    type: 'show',
    title: UTIL.parseText(obj.title, ''),
    bestThumbnail: prepImg(thumbnails)[0],
    thumbnails: prepImg(thumbnails),
    url: new URL(obj.navigationEndpoint.commandMetadata.webCommandMetadata.url, BASE_VIDEO_URL).toString(),
    videoID: obj.navigationEndpoint.watchEndpoint.videoId,
    playlistID: obj.navigationEndpoint.watchEndpoint.playlistId,
    episodes: UTIL.parseIntegerFromText(obj.thumbnailOverlays[0].thumbnailOverlayBottomPanelRenderer.text),
    owner,
  };
};

const parseShelf = obj => {
  let rawItems = [];
  if (Array.isArray(obj.contents)) {
    rawItems = obj.contents.map(x => x.richItemRenderer.content);
  } else if (Array.isArray(obj.items)) {
    rawItems = obj.items;
  } else {
    rawItems = (obj.content.verticalListRenderer || obj.content.horizontalMovieListRenderer).items;
  }
  // Optional obj.thumbnail is ignored
  return {
    type: 'shelf',
    title: UTIL.parseText(obj.title, 'Show More'),
    items: rawItems.map(i => parseItem(i)).filter(a => a),
  };
};

/**
 * Generalised Method
 *
 * used in Playlist, Movie and Show
 * show does never provide badges thou
 *
 * @param {Object} obj the full Renderer Object provided by YouTube
 * @returns {Object} the parsed owner
 */
const _parseOwner = obj => {
  const owner = (obj.shortBylineText && obj.shortBylineText.runs[0]) ||
    (obj.longBylineText && obj.longBylineText.runs[0]);
  const ownerUrl = owner.navigationEndpoint.browseEndpoint.canonicalBaseUrl ||
    owner.navigationEndpoint.commandMetadata.webCommandMetadata.url;
  const isOfficial = !!(obj.ownerBadges && JSON.stringify(obj.ownerBadges).includes('OFFICIAL'));
  const isVerified = !!(obj.ownerBadges && JSON.stringify(obj.ownerBadges).includes('VERIFIED'));
  const fallbackURL = owner.navigationEndpoint.commandMetadata.webCommandMetadata.url;

  return {
    name: owner.text,
    channelID: owner.navigationEndpoint.browseEndpoint.browseId,
    url: new URL(ownerUrl || fallbackURL, BASE_VIDEO_URL).toString(),
    ownerBadges: Array.isArray(obj.ownerBadges) ? obj.ownerBadges.map(a => a.metadataBadgeRenderer.tooltip) : [],
    verified: isOfficial || isVerified,
  };
};


/***/ }),
/* 119 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const MINIGET = __webpack_require__(120);

const BASE_URL = 'https://www.youtube.com/';
const DEFAULT_OPTIONS = { limit: 100, safeSearch: false };
const DEFAULT_QUERY = { gl: 'US', hl: 'en' };
const DEFAULT_CONTEXT = {
  client: {
    utcOffsetMinutes: 0,
    gl: 'US',
    hl: 'en',
    clientName: 'WEB',
    clientVersion: '<important information>',
  },
  user: {},
  request: {},
};

exports.parseFilters = json => {
  const pc = json.contents.twoColumnSearchResultsRenderer.primaryContents;
  const wrapper = pc.sectionListRenderer || pc.richGridRenderer;
  const filterWrapper = (wrapper.subMenu || wrapper.submenu).searchSubMenuRenderer.groups ||
    json.header.searchHeaderRenderer.searchFilterButton.buttonRenderer.command.openPopupAction.popup
      .searchFilterOptionsDialogRenderer.groups || [];
  const parsedGroups = new Map();
  for (const filterGroup of filterWrapper) {
    const singleFilterGroup = new Map();
    singleFilterGroup.active = null;
    for (const filter of filterGroup.searchFilterGroupRenderer.filters) {
      const isSet = !filter.searchFilterRenderer.navigationEndpoint;
      let targetURL = null;
      if (!isSet) targetURL = filter.searchFilterRenderer.navigationEndpoint.commandMetadata.webCommandMetadata.url;
      const parsedFilter = {
        name: parseText(filter.searchFilterRenderer.label, ''),
        active: isSet,
        url: isSet ? null : new URL(targetURL, BASE_URL).toString(),
        description: filter.searchFilterRenderer.tooltip,
      };
      if (isSet) singleFilterGroup.active = parsedFilter;
      singleFilterGroup.set(parsedFilter.name, parsedFilter);
    }
    parsedGroups.set(parseText(filterGroup.searchFilterGroupRenderer.title, 'Unknown Category'), singleFilterGroup);
  }
  return parsedGroups;
};

exports.parseBody = (body, options = {}) => {
  let json = null;
  try {
    json = jsonAfter(body, 'var ytInitialData = ');
  } catch (e) {
    // Defaulting to null if failed to parse json => results in a retry in main
  }
  const apiKey = between(body, 'INNERTUBE_API_KEY":"', '"') || between(body, 'innertubeApiKey":"', '"');
  const clientVersion = between(body, 'INNERTUBE_CONTEXT_CLIENT_VERSION":"', '"') ||
    between(body, 'innertube_context_client_version":"', '"');
  // Make deep copy and set clientVersion
  const context = JSON.parse(JSON.stringify(DEFAULT_CONTEXT));
  context.client.clientVersion = clientVersion;
  // Add params to context
  if (options.gl) context.client.gl = options.gl;
  if (options.hl) context.client.hl = options.hl;
  if (options.utcOffsetMinutes) context.client.utcOffsetMinutes = options.utcOffsetMinutes;
  if (options.safeSearch) context.user.enableSafetyMode = true;
  // Return multiple values
  return { json, apiKey, context };
};

// Parsing utility
const parseText = exports.parseText = (txt, def = null) => {
  if (typeof txt !== 'object') return def;
  if (Object.prototype.hasOwnProperty.call(txt, 'simpleText')) return txt.simpleText;
  if (Array.isArray(txt.runs)) {
    return txt.runs.map(a => a.text).join('');
  }
  return def;
};

exports.parseIntegerFromText = txt => Number(parseText(txt).replace(/\D+/g, ''));

// Request Utility
exports.doPost = async(url, payload, reqOpts = {}) => {
  // Enforce POST-Request
  reqOpts.method = 'POST';
  const req = MINIGET(url, reqOpts);
  // Write request body
  if (payload) req.once('request', r => r.write(JSON.stringify(payload)));
  // Await response-text and parse json
  return JSON.parse(await req.text());
};

// Guarantee that all arguments are valid
exports.checkArgs = (searchString, options = {}) => {
  // Validation
  if (!searchString) {
    throw new Error('search string is mandatory');
  }
  if (typeof searchString !== 'string') {
    throw new Error('search string must be of type string');
  }

  // Normalisation
  let obj = Object.assign({}, DEFAULT_OPTIONS, options);
  // Other optional params
  if (!isNaN(obj.pages) && obj.pages > 0) {
    // Disable limit if pages is provided
    obj.limit = Infinity;
  } else if (isNaN(obj.limit) || obj.limit <= 0) {
    // Default limit
    obj.pages = Infinity;
    obj.limit = DEFAULT_OPTIONS.limit;
  }
  if (typeof obj.safeSearch !== 'boolean') obj.safeSearch = DEFAULT_OPTIONS.safeSearch;
  // Default requestOptions
  obj.requestOptions = Object.assign({}, options.requestOptions);
  // Unlink requestOptions#headers
  if (obj.requestOptions.headers) {
    obj.requestOptions.headers = JSON.parse(JSON.stringify(obj.requestOptions.headers));
  }
  // Setting cookie in request headers to get safe search results
  if (obj.safeSearch) {
    if (!obj.requestOptions.headers) obj.requestOptions.headers = {};
    if (!obj.requestOptions.headers.Cookie) obj.requestOptions.headers.Cookie = [];
    obj.requestOptions.headers.Cookie.push('PREF=f2=8000000');
  }
  // Set required parameter: query
  const inputURL = new URL(searchString, BASE_URL);
  if (searchString.startsWith(BASE_URL) && inputURL.pathname === '/results' && inputURL.searchParams.has('sp')) {
    // Watch out for requests with a set filter
    // in such a case searchString would be an url including `sp` & `search_query` querys
    if (!inputURL.searchParams.get('search_query')) {
      throw new Error('filter links have to include a "search_string" query');
    }
    // Object.fromEntries not supported in nodejs < v12
    obj.query = {};
    for (const key of inputURL.searchParams.keys()) {
      obj.query[key] = inputURL.searchParams.get(key);
    }
  } else {
    // If no filter-link default to passing it all as query
    obj.query = { search_query: searchString };
  }
  // Save the search term itself for potential later use
  obj.search = obj.query.search_query;

  // Add additional information
  obj.query = Object.assign({}, DEFAULT_QUERY, obj.query);
  if (options && options.gl) obj.query.gl = options.gl;
  if (options && options.hl) obj.query.hl = options.hl;
  return obj;
};

// Sorts Images in descending order & normalizes the url's
exports.prepImg = img => {
  // Resolve url
  img.forEach(x => x.url = x.url ? new URL(x.url, BASE_URL).toString() : null);
  // Sort
  return img.sort((a, b) => b.width - a.width);
};

exports.parseWrapper = primaryContents => {
  let rawItems = [];
  let continuation = null;

  // Older Format
  if (primaryContents.sectionListRenderer) {
    rawItems = primaryContents.sectionListRenderer.contents
      .find(x => Object.keys(x)[0] === 'itemSectionRenderer')
      .itemSectionRenderer.contents;
    continuation = primaryContents.sectionListRenderer.contents
      .find(x => Object.keys(x)[0] === 'continuationItemRenderer');
  // Newer Format
  } else if (primaryContents.richGridRenderer) {
    rawItems = primaryContents.richGridRenderer.contents
      .filter(x => !Object.prototype.hasOwnProperty.call(x, 'continuationItemRenderer'))
      .map(x => (x.richItemRenderer || x.richSectionRenderer).content);
    continuation = primaryContents.richGridRenderer.contents
      .find(x => Object.prototype.hasOwnProperty.call(x, 'continuationItemRenderer'));
  }

  return { rawItems, continuation };
};

exports.parsePage2Wrapper = continuationItems => {
  let rawItems = [];
  let continuation = null;

  for (const ci of continuationItems) {
    // Older Format
    if (Object.prototype.hasOwnProperty.call(ci, 'itemSectionRenderer')) {
      rawItems.push(...ci.itemSectionRenderer.contents);
    // Newer Format
    } else if (Object.prototype.hasOwnProperty.call(ci, 'richItemRenderer')) {
      rawItems.push(ci.richItemRenderer.content);
    } else if (Object.prototype.hasOwnProperty.call(ci, 'richSectionRenderer')) {
      rawItems.push(ci.richSectionRenderer.content);
    // Continuation
    } else if (Object.prototype.hasOwnProperty.call(ci, 'continuationItemRenderer')) {
      continuation = ci;
    }
  }

  return { rawItems, continuation };
};

/**
 * Extract json after given string.
 * loosely based on utils#between
 *
 * @param {string} haystack
 * @param {string} left
 * @returns {Object|null} the parsed json or null
 */
const jsonAfter = (haystack, left) => {
  const pos = haystack.indexOf(left);
  if (pos === -1) { return null; }
  haystack = haystack.slice(pos + left.length);
  try {
    return JSON.parse(cutAfterJSON(haystack));
  } catch (e) {
    return null;
  }
};

/**
 * Extract string inbetween another.
 * Property of https://github.com/fent/node-ytdl-core/blob/master/lib/utils.js
 *
 * @param {string} haystack
 * @param {string} left
 * @param {string} right
 * @returns {string}
 */
const between = (haystack, left, right) => {
  let pos;
  pos = haystack.indexOf(left);
  if (pos === -1) { return ''; }
  pos += left.length;
  haystack = haystack.slice(pos);
  pos = haystack.indexOf(right);
  if (pos === -1) { return ''; }
  haystack = haystack.slice(0, pos);
  return haystack;
};

/**
 * Match begin and end braces of input JSON, return only json
 * Property of https://github.com/fent/node-ytdl-core/blob/master/lib/utils.js
 *
 * @param {string} mixedJson
 * @returns {string}
 * @throws {Error} no json or invalid json
*/
const cutAfterJSON = exports.cutAfterJSON = mixedJson => {
  let open, close;
  if (mixedJson[0] === '[') {
    open = '[';
    close = ']';
  } else if (mixedJson[0] === '{') {
    open = '{';
    close = '}';
  }

  if (!open) {
    throw new Error(`Can't cut unsupported JSON (need to begin with [ or { ) but got: ${mixedJson[0]}`);
  }

  // States if the loop is currently in a string
  let isString = false;

  // States if the current character is treated as escaped or not
  let isEscaped = false;

  // Current open brackets to be closed
  let counter = 0;

  let i;
  for (i = 0; i < mixedJson.length; i++) {
    // Toggle the isString boolean when leaving/entering string
    if (mixedJson[i] === '"' && !isEscaped) {
      isString = !isString;
      continue;
    }

    // Toggle the isEscaped boolean for every backslash
    // Reset for every regular character
    isEscaped = mixedJson[i] === '\\' && !isEscaped;

    if (isString) continue;

    if (mixedJson[i] === open) {
      counter++;
    } else if (mixedJson[i] === close) {
      counter--;
    }

    // All brackets have been closed, thus end of JSON is reached
    if (counter === 0) {
      // Return the cut JSON
      return mixedJson.substr(0, i + 1);
    }
  }

  // We ran through the whole string and ended up with an unclosed bracket
  throw Error("Can't cut unsupported JSON (no matching closing bracket found)");
};

// Exports for testing
exports._hidden = {
  jsonAfter, between, cutAfterJSON,
};


/***/ }),
/* 120 */
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const http_1 = __importDefault(__webpack_require__(121));
const https_1 = __importDefault(__webpack_require__(122));
const stream_1 = __webpack_require__(123);
const httpLibs = { 'http:': http_1.default, 'https:': https_1.default };
const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);
const retryStatusCodes = new Set([429, 503]);
// `request`, `response`, `abort`, left out, miniget will emit these.
const requestEvents = ['connect', 'continue', 'information', 'socket', 'timeout', 'upgrade'];
const responseEvents = ['aborted'];
Miniget.MinigetError = class MinigetError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
};
Miniget.defaultOptions = {
    maxRedirects: 10,
    maxRetries: 2,
    maxReconnects: 0,
    backoff: { inc: 100, max: 10000 },
};
function Miniget(url, options = {}) {
    var _a;
    const opts = Object.assign({}, Miniget.defaultOptions, options);
    const stream = new stream_1.PassThrough({ highWaterMark: opts.highWaterMark });
    stream.destroyed = stream.aborted = false;
    let activeRequest;
    let activeResponse;
    let activeDecodedStream;
    let redirects = 0;
    let retries = 0;
    let retryTimeout;
    let reconnects = 0;
    let contentLength;
    let acceptRanges = false;
    let rangeStart = 0, rangeEnd;
    let downloaded = 0;
    // Check if this is a ranged request.
    if ((_a = opts.headers) === null || _a === void 0 ? void 0 : _a.Range) {
        let r = /bytes=(\d+)-(\d+)?/.exec(`${opts.headers.Range}`);
        if (r) {
            rangeStart = parseInt(r[1], 10);
            rangeEnd = parseInt(r[2], 10);
        }
    }
    // Add `Accept-Encoding` header.
    if (opts.acceptEncoding) {
        opts.headers = Object.assign({
            'Accept-Encoding': Object.keys(opts.acceptEncoding).join(', '),
        }, opts.headers);
    }
    const downloadHasStarted = () => activeDecodedStream && downloaded > 0;
    const downloadComplete = () => !acceptRanges || downloaded === contentLength;
    const reconnect = (err) => {
        activeDecodedStream = null;
        retries = 0;
        let inc = opts.backoff.inc;
        let ms = Math.min(inc, opts.backoff.max);
        retryTimeout = setTimeout(doDownload, ms);
        stream.emit('reconnect', reconnects, err);
    };
    const reconnectIfEndedEarly = (err) => {
        if (options.method !== 'HEAD' && !downloadComplete() && reconnects++ < opts.maxReconnects) {
            reconnect(err);
            return true;
        }
        return false;
    };
    const retryRequest = (retryOptions) => {
        if (stream.destroyed) {
            return false;
        }
        if (downloadHasStarted()) {
            return reconnectIfEndedEarly(retryOptions.err);
        }
        else if ((!retryOptions.err || retryOptions.err.message === 'ENOTFOUND') &&
            retries++ < opts.maxRetries) {
            let ms = retryOptions.retryAfter ||
                Math.min(retries * opts.backoff.inc, opts.backoff.max);
            retryTimeout = setTimeout(doDownload, ms);
            stream.emit('retry', retries, retryOptions.err);
            return true;
        }
        return false;
    };
    const forwardEvents = (ee, events) => {
        for (let event of events) {
            ee.on(event, stream.emit.bind(stream, event));
        }
    };
    const doDownload = () => {
        let parsed = {}, httpLib;
        try {
            let urlObj = typeof url === 'string' ? new URL(url) : url;
            parsed = Object.assign({}, {
                host: urlObj.host,
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search + urlObj.hash,
                port: urlObj.port,
                protocol: urlObj.protocol,
            });
            if (urlObj.username) {
                parsed.auth = `${urlObj.username}:${urlObj.password}`;
            }
            httpLib = httpLibs[String(parsed.protocol)];
        }
        catch (err) {
            // Let the error be caught by the if statement below.
        }
        if (!httpLib) {
            stream.emit('error', new Miniget.MinigetError(`Invalid URL: ${url}`));
            return;
        }
        Object.assign(parsed, opts);
        if (acceptRanges && downloaded > 0) {
            let start = downloaded + rangeStart;
            let end = rangeEnd || '';
            parsed.headers = Object.assign({}, parsed.headers, {
                Range: `bytes=${start}-${end}`,
            });
        }
        if (opts.transform) {
            try {
                parsed = opts.transform(parsed);
            }
            catch (err) {
                stream.emit('error', err);
                return;
            }
            if (!parsed || parsed.protocol) {
                httpLib = httpLibs[String(parsed === null || parsed === void 0 ? void 0 : parsed.protocol)];
                if (!httpLib) {
                    stream.emit('error', new Miniget.MinigetError('Invalid URL object from `transform` function'));
                    return;
                }
            }
        }
        const onError = (err) => {
            if (stream.destroyed || stream.readableEnded) {
                return;
            }
            cleanup();
            if (!retryRequest({ err })) {
                stream.emit('error', err);
            }
            else {
                activeRequest.removeListener('close', onRequestClose);
            }
        };
        const onRequestClose = () => {
            cleanup();
            retryRequest({});
        };
        const cleanup = () => {
            activeRequest.removeListener('close', onRequestClose);
            activeResponse === null || activeResponse === void 0 ? void 0 : activeResponse.removeListener('data', onData);
            activeDecodedStream === null || activeDecodedStream === void 0 ? void 0 : activeDecodedStream.removeListener('end', onEnd);
        };
        const onData = (chunk) => { downloaded += chunk.length; };
        const onEnd = () => {
            cleanup();
            if (!reconnectIfEndedEarly()) {
                stream.end();
            }
        };
        activeRequest = httpLib.request(parsed, (res) => {
            // Needed for node v10, v12.
            // istanbul ignore next
            if (stream.destroyed) {
                return;
            }
            if (redirectStatusCodes.has(res.statusCode)) {
                if (redirects++ >= opts.maxRedirects) {
                    stream.emit('error', new Miniget.MinigetError('Too many redirects'));
                }
                else {
                    if (res.headers.location) {
                        url = res.headers.location;
                    }
                    else {
                        let err = new Miniget.MinigetError('Redirect status code given with no location', res.statusCode);
                        stream.emit('error', err);
                        cleanup();
                        return;
                    }
                    setTimeout(doDownload, parseInt(res.headers['retry-after'] || '0', 10) * 1000);
                    stream.emit('redirect', url);
                }
                cleanup();
                return;
                // Check for rate limiting.
            }
            else if (retryStatusCodes.has(res.statusCode)) {
                if (!retryRequest({ retryAfter: parseInt(res.headers['retry-after'] || '0', 10) })) {
                    let err = new Miniget.MinigetError(`Status code: ${res.statusCode}`, res.statusCode);
                    stream.emit('error', err);
                }
                cleanup();
                return;
            }
            else if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 400)) {
                let err = new Miniget.MinigetError(`Status code: ${res.statusCode}`, res.statusCode);
                if (res.statusCode >= 500) {
                    onError(err);
                }
                else {
                    stream.emit('error', err);
                }
                cleanup();
                return;
            }
            activeDecodedStream = res;
            if (opts.acceptEncoding && res.headers['content-encoding']) {
                for (let enc of res.headers['content-encoding'].split(', ').reverse()) {
                    let fn = opts.acceptEncoding[enc];
                    if (fn) {
                        activeDecodedStream = activeDecodedStream.pipe(fn());
                        activeDecodedStream.on('error', onError);
                    }
                }
            }
            if (!contentLength) {
                contentLength = parseInt(`${res.headers['content-length']}`, 10);
                acceptRanges = res.headers['accept-ranges'] === 'bytes' &&
                    contentLength > 0 && opts.maxReconnects > 0;
            }
            res.on('data', onData);
            activeDecodedStream.on('end', onEnd);
            activeDecodedStream.pipe(stream, { end: !acceptRanges });
            activeResponse = res;
            stream.emit('response', res);
            res.on('error', onError);
            forwardEvents(res, responseEvents);
        });
        activeRequest.on('error', onError);
        activeRequest.on('close', onRequestClose);
        forwardEvents(activeRequest, requestEvents);
        if (stream.destroyed) {
            streamDestroy(...destroyArgs);
        }
        stream.emit('request', activeRequest);
        activeRequest.end();
    };
    stream.abort = (err) => {
        console.warn('`MinigetStream#abort()` has been deprecated in favor of `MinigetStream#destroy()`');
        stream.aborted = true;
        stream.emit('abort');
        stream.destroy(err);
    };
    let destroyArgs = [];
    const streamDestroy = (err) => {
        activeRequest.destroy(err);
        activeDecodedStream === null || activeDecodedStream === void 0 ? void 0 : activeDecodedStream.unpipe(stream);
        activeDecodedStream === null || activeDecodedStream === void 0 ? void 0 : activeDecodedStream.destroy();
        clearTimeout(retryTimeout);
    };
    stream._destroy = (...args) => {
        stream.destroyed = true;
        if (activeRequest) {
            streamDestroy(...args);
        }
        else {
            destroyArgs = args;
        }
    };
    stream.text = () => new Promise((resolve, reject) => {
        let body = '';
        stream.setEncoding('utf8');
        stream.on('data', chunk => body += chunk);
        stream.on('end', () => resolve(body));
        stream.on('error', reject);
    });
    process.nextTick(doDownload);
    return stream;
}
module.exports = Miniget;
//# sourceMappingURL=index.js.map

/***/ }),
/* 121 */
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),
/* 122 */
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),
/* 123 */
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),
/* 124 */
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = 124;
module.exports = webpackEmptyContext;

/***/ }),
/* 125 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"name":"ytsr","version":"3.8.4","description":"Simple package to search YouTube - no strings attached.","keywords":["youtube","search","yt","ytsearcher","api","playlist","channel","video","scrape","pagination","promise"],"homepage":"https://github.com/TimeForANinja/node-ytsr#readme","bugs":{"url":"https://github.com/TimeForANinja/node-ytsr/issues"},"repository":{"type":"git","url":"git://github.com/TimeForANinja/node-ytsr.git"},"license":"MIT","author":"Tobias Kutscha (https://github.com/TimeForANinja)","main":"./lib/main.js","types":"./typings/index.d.ts","files":["lib","typings"],"scripts":{"lint":"eslint ./","lint:fix":"eslint --fix ./","lint:typings":"tslint typings/index.d.ts","lint:typings:fix":"tslint --fix typings/index.d.ts","mocha":"mocha -- -t 16000 test/*-test.js","mocha:coverage":"mocha -- -t 16000 test/*-test.js --exclude test/e2e-test.js","nyc":"nyc --reporter=lcov npm run-script mocha","nyc:coverage":"nyc --reporter=lcov npm run-script mocha:coverage","test":"npm run-script nyc","test:coverage":"npm run-script nyc:coverage && codecov"},"dependencies":{"miniget":"^4.2.2"},"devDependencies":{"assert-diff":"^3.0.2","codecov":"^3.8.1","dtslint":"^4.0.8","eslint":"^7.23.0","mocha":"^10.2.0","nock":"^13.0.11","nyc":"^15.1.0","typescript":"^4.2.3"},"engines":{"node":">=8"}}');

/***/ }),
/* 126 */
/***/ ((module) => {

"use strict";
module.exports = require("querystring");

/***/ }),
/* 127 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PassThrough = (__webpack_require__(123).PassThrough);
const getInfo = __webpack_require__(128);
const utils = __webpack_require__(130);
const formatUtils = __webpack_require__(133);
const urlUtils = __webpack_require__(135);
const sig = __webpack_require__(142);
const miniget = __webpack_require__(120);
const m3u8stream = __webpack_require__(137);
const { parseTimestamp } = __webpack_require__(137);


/**
 * @param {string} link
 * @param {!Object} options
 * @returns {ReadableStream}
 */
const ytdl = (link, options) => {
  const stream = createStream(options);
  ytdl.getInfo(link, options).then(info => {
    downloadFromInfoCallback(stream, info, options);
  }, stream.emit.bind(stream, 'error'));
  return stream;
};
module.exports = ytdl;

ytdl.getBasicInfo = getInfo.getBasicInfo;
ytdl.getInfo = getInfo.getInfo;
ytdl.chooseFormat = formatUtils.chooseFormat;
ytdl.filterFormats = formatUtils.filterFormats;
ytdl.validateID = urlUtils.validateID;
ytdl.validateURL = urlUtils.validateURL;
ytdl.getURLVideoID = urlUtils.getURLVideoID;
ytdl.getVideoID = urlUtils.getVideoID;
ytdl.cache = {
  sig: sig.cache,
  info: getInfo.cache,
  watch: getInfo.watchPageCache,
  cookie: getInfo.cookieCache,
};
ytdl.version = (__webpack_require__(131).version);


const createStream = options => {
  const stream = new PassThrough({
    highWaterMark: (options && options.highWaterMark) || 1024 * 512,
  });
  stream._destroy = () => { stream.destroyed = true; };
  return stream;
};


const pipeAndSetEvents = (req, stream, end) => {
  // Forward events from the request to the stream.
  [
    'abort', 'request', 'response', 'error', 'redirect', 'retry', 'reconnect',
  ].forEach(event => {
    req.prependListener(event, stream.emit.bind(stream, event));
  });
  req.pipe(stream, { end });
};


/**
 * Chooses a format to download.
 *
 * @param {stream.Readable} stream
 * @param {Object} info
 * @param {Object} options
 */
const downloadFromInfoCallback = (stream, info, options) => {
  options = options || {};

  let err = utils.playError(info.player_response, ['UNPLAYABLE', 'LIVE_STREAM_OFFLINE', 'LOGIN_REQUIRED']);
  if (err) {
    stream.emit('error', err);
    return;
  }

  if (!info.formats.length) {
    stream.emit('error', Error('This video is unavailable'));
    return;
  }

  let format;
  try {
    format = formatUtils.chooseFormat(info.formats, options);
  } catch (e) {
    stream.emit('error', e);
    return;
  }
  stream.emit('info', info, format);
  if (stream.destroyed) { return; }

  let contentLength, downloaded = 0;
  const ondata = chunk => {
    downloaded += chunk.length;
    stream.emit('progress', chunk.length, downloaded, contentLength);
  };

  if (options.IPv6Block) {
    options.requestOptions = Object.assign({}, options.requestOptions, {
      family: 6,
      localAddress: utils.getRandomIPv6(options.IPv6Block),
    });
  }

  // Download the file in chunks, in this case the default is 10MB,
  // anything over this will cause youtube to throttle the download
  const dlChunkSize = options.dlChunkSize || 1024 * 1024 * 10;
  let req;
  let shouldEnd = true;

  if (format.isHLS || format.isDashMPD) {
    req = m3u8stream(format.url, {
      chunkReadahead: +info.live_chunk_readahead,
      begin: options.begin || (format.isLive && Date.now()),
      liveBuffer: options.liveBuffer,
      requestOptions: options.requestOptions,
      parser: format.isDashMPD ? 'dash-mpd' : 'm3u8',
      id: format.itag,
    });

    req.on('progress', (segment, totalSegments) => {
      stream.emit('progress', segment.size, segment.num, totalSegments);
    });
    pipeAndSetEvents(req, stream, shouldEnd);
  } else {
    const requestOptions = Object.assign({}, options.requestOptions, {
      maxReconnects: 6,
      maxRetries: 3,
      backoff: { inc: 500, max: 10000 },
    });

    let shouldBeChunked = dlChunkSize !== 0 && (!format.hasAudio || !format.hasVideo);

    if (shouldBeChunked) {
      let start = (options.range && options.range.start) || 0;
      let end = start + dlChunkSize;
      const rangeEnd = options.range && options.range.end;

      contentLength = options.range ?
        (rangeEnd ? rangeEnd + 1 : parseInt(format.contentLength)) - start :
        parseInt(format.contentLength);

      const getNextChunk = () => {
        if (!rangeEnd && end >= contentLength) end = 0;
        if (rangeEnd && end > rangeEnd) end = rangeEnd;
        shouldEnd = !end || end === rangeEnd;

        requestOptions.headers = Object.assign({}, requestOptions.headers, {
          Range: `bytes=${start}-${end || ''}`,
        });

        req = miniget(format.url, requestOptions);
        req.on('data', ondata);
        req.on('end', () => {
          if (stream.destroyed) { return; }
          if (end && end !== rangeEnd) {
            start = end + 1;
            end += dlChunkSize;
            getNextChunk();
          }
        });
        pipeAndSetEvents(req, stream, shouldEnd);
      };
      getNextChunk();
    } else {
      // Audio only and video only formats don't support begin
      if (options.begin) {
        format.url += `&begin=${parseTimestamp(options.begin)}`;
      }
      if (options.range && (options.range.start || options.range.end)) {
        requestOptions.headers = Object.assign({}, requestOptions.headers, {
          Range: `bytes=${options.range.start || '0'}-${options.range.end || ''}`,
        });
      }
      req = miniget(format.url, requestOptions);
      req.on('response', res => {
        if (stream.destroyed) { return; }
        contentLength = contentLength || parseInt(res.headers['content-length']);
      });
      req.on('data', ondata);
      pipeAndSetEvents(req, stream, shouldEnd);
    }
  }

  stream._destroy = () => {
    stream.destroyed = true;
    req.destroy();
    req.end();
  };
};


/**
 * Can be used to download video after its `info` is gotten through
 * `ytdl.getInfo()`. In case the user might want to look at the
 * `info` object before deciding to download.
 *
 * @param {Object} info
 * @param {!Object} options
 * @returns {ReadableStream}
 */
ytdl.downloadFromInfo = (info, options) => {
  const stream = createStream(options);
  if (!info.full) {
    throw Error('Cannot use `ytdl.downloadFromInfo()` when called ' +
      'with info from `ytdl.getBasicInfo()`');
  }
  setImmediate(() => {
    downloadFromInfoCallback(stream, info, options);
  });
  return stream;
};


/***/ }),
/* 128 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const querystring = __webpack_require__(126);
const sax = __webpack_require__(129);
const miniget = __webpack_require__(120);
const utils = __webpack_require__(130);
// Forces Node JS version of setTimeout for Electron based applications
const { setTimeout } = __webpack_require__(132);
const formatUtils = __webpack_require__(133);
const urlUtils = __webpack_require__(135);
const extras = __webpack_require__(136);
const sig = __webpack_require__(142);
const Cache = __webpack_require__(143);


const BASE_URL = 'https://www.youtube.com/watch?v=';


// Cached for storing basic/full info.
exports.cache = new Cache();
exports.cookieCache = new Cache(1000 * 60 * 60 * 24);
exports.watchPageCache = new Cache();
// Cache for cver used in getVideoInfoPage
let cver = '2.20210622.10.00';


// Special error class used to determine if an error is unrecoverable,
// as in, ytdl-core should not try again to fetch the video metadata.
// In this case, the video is usually unavailable in some way.
class UnrecoverableError extends Error {}


// List of URLs that show up in `notice_url` for age restricted videos.
const AGE_RESTRICTED_URLS = [
  'support.google.com/youtube/?p=age_restrictions',
  'youtube.com/t/community_guidelines',
];


/**
 * Gets info from a video without getting additional formats.
 *
 * @param {string} id
 * @param {Object} options
 * @returns {Promise<Object>}
*/
exports.getBasicInfo = async(id, options) => {
  if (options.IPv6Block) {
    options.requestOptions = Object.assign({}, options.requestOptions, {
      family: 6,
      localAddress: utils.getRandomIPv6(options.IPv6Block),
    });
  }
  const retryOptions = Object.assign({}, miniget.defaultOptions, options.requestOptions);
  options.requestOptions = Object.assign({}, options.requestOptions, {});
  options.requestOptions.headers = Object.assign({},
    {
      // eslint-disable-next-line max-len
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
    }, options.requestOptions.headers);
  const validate = info => {
    let playErr = utils.playError(info.player_response, ['ERROR'], UnrecoverableError);
    let privateErr = privateVideoError(info.player_response);
    if (playErr || privateErr) {
      throw playErr || privateErr;
    }
    return info && info.player_response && (
      info.player_response.streamingData || isRental(info.player_response) || isNotYetBroadcasted(info.player_response)
    );
  };
  let info = await pipeline([id, options], validate, retryOptions, [
    getWatchHTMLPage,
    getWatchJSONPage,
    getVideoInfoPage,
  ]);

  Object.assign(info, {
    formats: parseFormats(info.player_response),
    related_videos: extras.getRelatedVideos(info),
  });

  // Add additional properties to info.
  const media = extras.getMedia(info);
  const additional = {
    author: extras.getAuthor(info),
    media,
    likes: extras.getLikes(info),
    dislikes: extras.getDislikes(info),
    age_restricted: !!(media && AGE_RESTRICTED_URLS.some(url =>
      Object.values(media).some(v => typeof v === 'string' && v.includes(url)))
    ),

    // Give the standard link to the video.
    video_url: BASE_URL + id,
    storyboards: extras.getStoryboards(info),
    chapters: extras.getChapters(info),
  };

  info.videoDetails = extras.cleanVideoDetails(Object.assign({},
    info.player_response && info.player_response.microformat &&
    info.player_response.microformat.playerMicroformatRenderer,
    info.player_response && info.player_response.videoDetails, additional), info);

  return info;
};

const privateVideoError = player_response => {
  let playability = player_response && player_response.playabilityStatus;
  if (playability && playability.status === 'LOGIN_REQUIRED' && playability.messages &&
    playability.messages.filter(m => /This is a private video/.test(m)).length) {
    return new UnrecoverableError(playability.reason || (playability.messages && playability.messages[0]));
  } else {
    return null;
  }
};


const isRental = player_response => {
  let playability = player_response.playabilityStatus;
  return playability && playability.status === 'UNPLAYABLE' &&
    playability.errorScreen && playability.errorScreen.playerLegacyDesktopYpcOfferRenderer;
};


const isNotYetBroadcasted = player_response => {
  let playability = player_response.playabilityStatus;
  return playability && playability.status === 'LIVE_STREAM_OFFLINE';
};


const getWatchHTMLURL = (id, options) => `${BASE_URL + id}&hl=${options.lang || 'en'}`;
const getWatchHTMLPageBody = (id, options) => {
  const url = getWatchHTMLURL(id, options);
  return exports.watchPageCache.getOrSet(url, () => utils.exposedMiniget(url, options).text());
};


const EMBED_URL = 'https://www.youtube.com/embed/';
const getEmbedPageBody = (id, options) => {
  const embedUrl = `${EMBED_URL + id}?hl=${options.lang || 'en'}`;
  return utils.exposedMiniget(embedUrl, options).text();
};


const getHTML5player = body => {
  let html5playerRes =
    /<script\s+src="([^"]+)"(?:\s+type="text\/javascript")?\s+name="player_ias\/base"\s*>|"jsUrl":"([^"]+)"/
      .exec(body);
  return html5playerRes ? html5playerRes[1] || html5playerRes[2] : null;
};


const getIdentityToken = (id, options, key, throwIfNotFound) =>
  exports.cookieCache.getOrSet(key, async() => {
    let page = await getWatchHTMLPageBody(id, options);
    let match = page.match(/(["'])ID_TOKEN\1[:,]\s?"([^"]+)"/);
    if (!match && throwIfNotFound) {
      throw new UnrecoverableError('Cookie header used in request, but unable to find YouTube identity token');
    }
    return match && match[2];
  });


/**
 * Goes through each endpoint in the pipeline, retrying on failure if the error is recoverable.
 * If unable to succeed with one endpoint, moves onto the next one.
 *
 * @param {Array.<Object>} args
 * @param {Function} validate
 * @param {Object} retryOptions
 * @param {Array.<Function>} endpoints
 * @returns {[Object, Object, Object]}
 */
const pipeline = async(args, validate, retryOptions, endpoints) => {
  let info;
  for (let func of endpoints) {
    try {
      const newInfo = await retryFunc(func, args.concat([info]), retryOptions);
      if (newInfo.player_response) {
        newInfo.player_response.videoDetails = assign(
          info && info.player_response && info.player_response.videoDetails,
          newInfo.player_response.videoDetails);
        newInfo.player_response = assign(info && info.player_response, newInfo.player_response);
      }
      info = assign(info, newInfo);
      if (validate(info, false)) {
        break;
      }
    } catch (err) {
      if (err instanceof UnrecoverableError || func === endpoints[endpoints.length - 1]) {
        throw err;
      }
      // Unable to find video metadata... so try next endpoint.
    }
  }
  return info;
};


/**
 * Like Object.assign(), but ignores `null` and `undefined` from `source`.
 *
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
const assign = (target, source) => {
  if (!target || !source) { return target || source; }
  for (let [key, value] of Object.entries(source)) {
    if (value !== null && value !== undefined) {
      target[key] = value;
    }
  }
  return target;
};


/**
 * Given a function, calls it with `args` until it's successful,
 * or until it encounters an unrecoverable error.
 * Currently, any error from miniget is considered unrecoverable. Errors such as
 * too many redirects, invalid URL, status code 404, status code 502.
 *
 * @param {Function} func
 * @param {Array.<Object>} args
 * @param {Object} options
 * @param {number} options.maxRetries
 * @param {Object} options.backoff
 * @param {number} options.backoff.inc
 */
const retryFunc = async(func, args, options) => {
  let currentTry = 0, result;
  while (currentTry <= options.maxRetries) {
    try {
      result = await func(...args);
      break;
    } catch (err) {
      if (err instanceof UnrecoverableError ||
        (err instanceof miniget.MinigetError && err.statusCode < 500) || currentTry >= options.maxRetries) {
        throw err;
      }
      let wait = Math.min(++currentTry * options.backoff.inc, options.backoff.max);
      await new Promise(resolve => setTimeout(resolve, wait));
    }
  }
  return result;
};


const jsonClosingChars = /^[)\]}'\s]+/;
const parseJSON = (source, varName, json) => {
  if (!json || typeof json === 'object') {
    return json;
  } else {
    try {
      json = json.replace(jsonClosingChars, '');
      return JSON.parse(json);
    } catch (err) {
      throw Error(`Error parsing ${varName} in ${source}: ${err.message}`);
    }
  }
};


const findJSON = (source, varName, body, left, right, prependJSON) => {
  let jsonStr = utils.between(body, left, right);
  if (!jsonStr) {
    throw Error(`Could not find ${varName} in ${source}`);
  }
  return parseJSON(source, varName, utils.cutAfterJS(`${prependJSON}${jsonStr}`));
};


const findPlayerResponse = (source, info) => {
  const player_response = info && (
    (info.args && info.args.player_response) ||
    info.player_response || info.playerResponse || info.embedded_player_response);
  return parseJSON(source, 'player_response', player_response);
};


const getWatchJSONURL = (id, options) => `${getWatchHTMLURL(id, options)}&pbj=1`;
const getWatchJSONPage = async(id, options) => {
  const reqOptions = Object.assign({ headers: {} }, options.requestOptions);
  let cookie = reqOptions.headers.Cookie || reqOptions.headers.cookie;
  reqOptions.headers = Object.assign({
    'x-youtube-client-name': '1',
    'x-youtube-client-version': cver,
    'x-youtube-identity-token': exports.cookieCache.get(cookie || 'browser') || '',
  }, reqOptions.headers);

  const setIdentityToken = async(key, throwIfNotFound) => {
    if (reqOptions.headers['x-youtube-identity-token']) { return; }
    reqOptions.headers['x-youtube-identity-token'] = await getIdentityToken(id, options, key, throwIfNotFound);
  };

  if (cookie) {
    await setIdentityToken(cookie, true);
  }

  const jsonUrl = getWatchJSONURL(id, options);
  const body = await utils.exposedMiniget(jsonUrl, options, reqOptions).text();
  let parsedBody = parseJSON('watch.json', 'body', body);
  if (parsedBody.reload === 'now') {
    await setIdentityToken('browser', false);
  }
  if (parsedBody.reload === 'now' || !Array.isArray(parsedBody)) {
    throw Error('Unable to retrieve video metadata in watch.json');
  }
  let info = parsedBody.reduce((part, curr) => Object.assign(curr, part), {});
  info.player_response = findPlayerResponse('watch.json', info);
  info.html5player = info.player && info.player.assets && info.player.assets.js;

  return info;
};


const getWatchHTMLPage = async(id, options) => {
  let body = await getWatchHTMLPageBody(id, options);
  let info = { page: 'watch' };
  try {
    cver = utils.between(body, '{"key":"cver","value":"', '"}');
    info.player_response = findJSON('watch.html', 'player_response',
      body, /\bytInitialPlayerResponse\s*=\s*\{/i, '</script>', '{');
  } catch (err) {
    let args = findJSON('watch.html', 'player_response', body, /\bytplayer\.config\s*=\s*{/, '</script>', '{');
    info.player_response = findPlayerResponse('watch.html', args);
  }
  info.response = findJSON('watch.html', 'response', body, /\bytInitialData("\])?\s*=\s*\{/i, '</script>', '{');
  info.html5player = getHTML5player(body);
  return info;
};


const INFO_HOST = 'www.youtube.com';
const INFO_PATH = '/get_video_info';
const VIDEO_EURL = 'https://youtube.googleapis.com/v/';
const getVideoInfoPage = async(id, options) => {
  const url = new URL(`https://${INFO_HOST}${INFO_PATH}`);
  url.searchParams.set('video_id', id);
  url.searchParams.set('c', 'TVHTML5');
  url.searchParams.set('cver', `7${cver.substr(1)}`);
  url.searchParams.set('eurl', VIDEO_EURL + id);
  url.searchParams.set('ps', 'default');
  url.searchParams.set('gl', 'US');
  url.searchParams.set('hl', options.lang || 'en');
  url.searchParams.set('html5', '1');
  const body = await utils.exposedMiniget(url.toString(), options).text();
  let info = querystring.parse(body);
  info.player_response = findPlayerResponse('get_video_info', info);
  return info;
};


/**
 * @param {Object} player_response
 * @returns {Array.<Object>}
 */
const parseFormats = player_response => {
  let formats = [];
  if (player_response && player_response.streamingData) {
    formats = formats
      .concat(player_response.streamingData.formats || [])
      .concat(player_response.streamingData.adaptiveFormats || []);
  }
  return formats;
};


/**
 * Gets info from a video additional formats and deciphered URLs.
 *
 * @param {string} id
 * @param {Object} options
 * @returns {Promise<Object>}
 */
exports.getInfo = async(id, options) => {
  let info = await exports.getBasicInfo(id, options);
  const hasManifest =
    info.player_response && info.player_response.streamingData && (
      info.player_response.streamingData.dashManifestUrl ||
      info.player_response.streamingData.hlsManifestUrl
    );
  let funcs = [];
  if (info.formats.length) {
    info.html5player = info.html5player ||
      getHTML5player(await getWatchHTMLPageBody(id, options)) || getHTML5player(await getEmbedPageBody(id, options));
    if (!info.html5player) {
      throw Error('Unable to find html5player file');
    }
    const html5player = new URL(info.html5player, BASE_URL).toString();
    funcs.push(sig.decipherFormats(info.formats, html5player, options));
  }
  if (hasManifest && info.player_response.streamingData.dashManifestUrl) {
    let url = info.player_response.streamingData.dashManifestUrl;
    funcs.push(getDashManifest(url, options));
  }
  if (hasManifest && info.player_response.streamingData.hlsManifestUrl) {
    let url = info.player_response.streamingData.hlsManifestUrl;
    funcs.push(getM3U8(url, options));
  }

  let results = await Promise.all(funcs);
  info.formats = Object.values(Object.assign({}, ...results));
  info.formats = info.formats.map(formatUtils.addFormatMeta);
  info.formats.sort(formatUtils.sortFormats);
  info.full = true;
  return info;
};


/**
 * Gets additional DASH formats.
 *
 * @param {string} url
 * @param {Object} options
 * @returns {Promise<Array.<Object>>}
 */
const getDashManifest = (url, options) => new Promise((resolve, reject) => {
  let formats = {};
  const parser = sax.parser(false);
  parser.onerror = reject;
  let adaptationSet;
  parser.onopentag = node => {
    if (node.name === 'ADAPTATIONSET') {
      adaptationSet = node.attributes;
    } else if (node.name === 'REPRESENTATION') {
      const itag = parseInt(node.attributes.ID);
      if (!isNaN(itag)) {
        formats[url] = Object.assign({
          itag, url,
          bitrate: parseInt(node.attributes.BANDWIDTH),
          mimeType: `${adaptationSet.MIMETYPE}; codecs="${node.attributes.CODECS}"`,
        }, node.attributes.HEIGHT ? {
          width: parseInt(node.attributes.WIDTH),
          height: parseInt(node.attributes.HEIGHT),
          fps: parseInt(node.attributes.FRAMERATE),
        } : {
          audioSampleRate: node.attributes.AUDIOSAMPLINGRATE,
        });
      }
    }
  };
  parser.onend = () => { resolve(formats); };
  const req = utils.exposedMiniget(new URL(url, BASE_URL).toString(), options);
  req.setEncoding('utf8');
  req.on('error', reject);
  req.on('data', chunk => { parser.write(chunk); });
  req.on('end', parser.close.bind(parser));
});


/**
 * Gets additional formats.
 *
 * @param {string} url
 * @param {Object} options
 * @returns {Promise<Array.<Object>>}
 */
const getM3U8 = async(url, options) => {
  url = new URL(url, BASE_URL);
  const body = await utils.exposedMiniget(url.toString(), options).text();
  let formats = {};
  body
    .split('\n')
    .filter(line => /^https?:\/\//.test(line))
    .forEach(line => {
      const itag = parseInt(line.match(/\/itag\/(\d+)\//)[1]);
      formats[line] = { itag, url: line };
    });
  return formats;
};


// Cache get info functions.
// In case a user wants to get a video's info before downloading.
for (let funcName of ['getBasicInfo', 'getInfo']) {
  /**
   * @param {string} link
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  const func = exports[funcName];
  exports[funcName] = async(link, options = {}) => {
    utils.checkForUpdates();
    let id = await urlUtils.getVideoID(link);
    const key = [funcName, id, options.lang].join('-');
    return exports.cache.getOrSet(key, () => func(id, options));
  };
}


// Export a few helpers.
exports.validateID = urlUtils.validateID;
exports.validateURL = urlUtils.validateURL;
exports.getURLVideoID = urlUtils.getURLVideoID;
exports.getVideoID = urlUtils.getVideoID;


/***/ }),
/* 129 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

;(function (sax) {
  // wrapper for non-node envs
  sax.parser = function (strict, opt) {
    return new SAXParser(strict, opt)
  }
  sax.SAXParser = SAXParser
  sax.SAXStream = SAXStream
  sax.createStream = createStream

  // When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
  // When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
  // since that's the earliest that a buffer overrun could occur.  This way, checks are
  // as rare as required, but as often as necessary to ensure never crossing this bound.
  // Furthermore, buffers are only tested at most once per write(), so passing a very
  // large string into write() might have undesirable effects, but this is manageable by
  // the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
  // edge case, result in creating at most one complete copy of the string passed in.
  // Set to Infinity to have unlimited buffers.
  sax.MAX_BUFFER_LENGTH = 64 * 1024

  var buffers = [
    'comment',
    'sgmlDecl',
    'textNode',
    'tagName',
    'doctype',
    'procInstName',
    'procInstBody',
    'entity',
    'attribName',
    'attribValue',
    'cdata',
    'script',
  ]

  sax.EVENTS = [
    'text',
    'processinginstruction',
    'sgmldeclaration',
    'doctype',
    'comment',
    'opentagstart',
    'attribute',
    'opentag',
    'closetag',
    'opencdata',
    'cdata',
    'closecdata',
    'error',
    'end',
    'ready',
    'script',
    'opennamespace',
    'closenamespace',
  ]

  function SAXParser(strict, opt) {
    if (!(this instanceof SAXParser)) {
      return new SAXParser(strict, opt)
    }

    var parser = this
    clearBuffers(parser)
    parser.q = parser.c = ''
    parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH
    parser.opt = opt || {}
    parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags
    parser.looseCase = parser.opt.lowercase ? 'toLowerCase' : 'toUpperCase'
    parser.opt.maxEntityCount = parser.opt.maxEntityCount || 512
    parser.opt.maxEntityDepth = parser.opt.maxEntityDepth || 4
    parser.entityCount = parser.entityDepth = 0
    parser.tags = []
    parser.closed = parser.closedRoot = parser.sawRoot = false
    parser.tag = parser.error = null
    parser.strict = !!strict
    parser.noscript = !!(strict || parser.opt.noscript)
    parser.state = S.BEGIN
    parser.strictEntities = parser.opt.strictEntities
    parser.ENTITIES =
      parser.strictEntities ?
        Object.create(sax.XML_ENTITIES)
      : Object.create(sax.ENTITIES)
    parser.attribList = []

    // namespaces form a prototype chain.
    // it always points at the current tag,
    // which protos to its parent tag.
    if (parser.opt.xmlns) {
      parser.ns = Object.create(rootNS)
    }

    // disallow unquoted attribute values if not otherwise configured
    // and strict mode is true
    if (parser.opt.unquotedAttributeValues === undefined) {
      parser.opt.unquotedAttributeValues = !strict
    }

    // mostly just for error reporting
    parser.trackPosition = parser.opt.position !== false
    if (parser.trackPosition) {
      parser.position = parser.line = parser.column = 0
    }
    emit(parser, 'onready')
  }

  if (!Object.create) {
    Object.create = function (o) {
      function F() {}
      F.prototype = o
      var newf = new F()
      return newf
    }
  }

  if (!Object.keys) {
    Object.keys = function (o) {
      var a = []
      for (var i in o) if (o.hasOwnProperty(i)) a.push(i)
      return a
    }
  }

  function checkBufferLength(parser) {
    var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10)
    var maxActual = 0
    for (var i = 0, l = buffers.length; i < l; i++) {
      var len = parser[buffers[i]].length
      if (len > maxAllowed) {
        // Text/cdata nodes can get big, and since they're buffered,
        // we can get here under normal conditions.
        // Avoid issues by emitting the text node now,
        // so at least it won't get any bigger.
        switch (buffers[i]) {
          case 'textNode':
            closeText(parser)
            break

          case 'cdata':
            emitNode(parser, 'oncdata', parser.cdata)
            parser.cdata = ''
            break

          case 'script':
            emitNode(parser, 'onscript', parser.script)
            parser.script = ''
            break

          default:
            error(parser, 'Max buffer length exceeded: ' + buffers[i])
        }
      }
      maxActual = Math.max(maxActual, len)
    }
    // schedule the next check for the earliest possible buffer overrun.
    var m = sax.MAX_BUFFER_LENGTH - maxActual
    parser.bufferCheckPosition = m + parser.position
  }

  function clearBuffers(parser) {
    for (var i = 0, l = buffers.length; i < l; i++) {
      parser[buffers[i]] = ''
    }
  }

  function flushBuffers(parser) {
    closeText(parser)
    if (parser.cdata !== '') {
      emitNode(parser, 'oncdata', parser.cdata)
      parser.cdata = ''
    }
    if (parser.script !== '') {
      emitNode(parser, 'onscript', parser.script)
      parser.script = ''
    }
  }

  SAXParser.prototype = {
    end: function () {
      end(this)
    },
    write: write,
    resume: function () {
      this.error = null
      return this
    },
    close: function () {
      return this.write(null)
    },
    flush: function () {
      flushBuffers(this)
    },
  }

  var Stream
  try {
    Stream = (__webpack_require__(123).Stream)
  } catch (ex) {
    Stream = function () {}
  }
  if (!Stream) Stream = function () {}

  var streamWraps = sax.EVENTS.filter(function (ev) {
    return ev !== 'error' && ev !== 'end'
  })

  function createStream(strict, opt) {
    return new SAXStream(strict, opt)
  }

  function SAXStream(strict, opt) {
    if (!(this instanceof SAXStream)) {
      return new SAXStream(strict, opt)
    }

    Stream.apply(this)

    this._parser = new SAXParser(strict, opt)
    this.writable = true
    this.readable = true

    var me = this

    this._parser.onend = function () {
      me.emit('end')
    }

    this._parser.onerror = function (er) {
      me.emit('error', er)

      // if didn't throw, then means error was handled.
      // go ahead and clear error, so we can write again.
      me._parser.error = null
    }

    this._decoder = null

    streamWraps.forEach(function (ev) {
      Object.defineProperty(me, 'on' + ev, {
        get: function () {
          return me._parser['on' + ev]
        },
        set: function (h) {
          if (!h) {
            me.removeAllListeners(ev)
            me._parser['on' + ev] = h
            return h
          }
          me.on(ev, h)
        },
        enumerable: true,
        configurable: false,
      })
    })
  }

  SAXStream.prototype = Object.create(Stream.prototype, {
    constructor: {
      value: SAXStream,
    },
  })

  SAXStream.prototype.write = function (data) {
    if (
      typeof Buffer === 'function' &&
      typeof Buffer.isBuffer === 'function' &&
      Buffer.isBuffer(data)
    ) {
      if (!this._decoder) {
        this._decoder = new TextDecoder('utf8')
      }
      data = this._decoder.decode(data, { stream: true })
    }

    this._parser.write(data.toString())
    this.emit('data', data)
    return true
  }

  SAXStream.prototype.end = function (chunk) {
    if (chunk && chunk.length) {
      this.write(chunk)
    }
    // Flush any remaining decoded data from the TextDecoder
    if (this._decoder) {
      var remaining = this._decoder.decode()
      if (remaining) {
        this._parser.write(remaining)
        this.emit('data', remaining)
      }
    }
    this._parser.end()
    return true
  }

  SAXStream.prototype.on = function (ev, handler) {
    var me = this
    if (!me._parser['on' + ev] && streamWraps.indexOf(ev) !== -1) {
      me._parser['on' + ev] = function () {
        var args =
          arguments.length === 1 ?
            [arguments[0]]
          : Array.apply(null, arguments)
        args.splice(0, 0, ev)
        me.emit.apply(me, args)
      }
    }

    return Stream.prototype.on.call(me, ev, handler)
  }

  // this really needs to be replaced with character classes.
  // XML allows all manner of ridiculous numbers and digits.
  var CDATA = '[CDATA['
  var DOCTYPE = 'DOCTYPE'
  var XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace'
  var XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'
  var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE }

  // http://www.w3.org/TR/REC-xml/#NT-NameStartChar
  // This implementation works on strings, a single character at a time
  // as such, it cannot ever support astral-plane characters (10000-EFFFF)
  // without a significant breaking change to either this  parser, or the
  // JavaScript language.  Implementation of an emoji-capable xml parser
  // is left as an exercise for the reader.
  var nameStart =
    /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/

  var nameBody =
    /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/

  var entityStart =
    /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/
  var entityBody =
    /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/

  function isWhitespace(c) {
    return c === ' ' || c === '\n' || c === '\r' || c === '\t'
  }

  function isQuote(c) {
    return c === '"' || c === "'"
  }

  function isAttribEnd(c) {
    return c === '>' || isWhitespace(c)
  }

  function isMatch(regex, c) {
    return regex.test(c)
  }

  function notMatch(regex, c) {
    return !isMatch(regex, c)
  }

  var S = 0
  sax.STATE = {
    BEGIN: S++, // leading byte order mark or whitespace
    BEGIN_WHITESPACE: S++, // leading whitespace
    TEXT: S++, // general stuff
    TEXT_ENTITY: S++, // &amp and such.
    OPEN_WAKA: S++, // <
    SGML_DECL: S++, // <!BLARG
    SGML_DECL_QUOTED: S++, // <!BLARG foo "bar
    DOCTYPE: S++, // <!DOCTYPE
    DOCTYPE_QUOTED: S++, // <!DOCTYPE "//blah
    DOCTYPE_DTD: S++, // <!DOCTYPE "//blah" [ ...
    DOCTYPE_DTD_QUOTED: S++, // <!DOCTYPE "//blah" [ "foo
    COMMENT_STARTING: S++, // <!-
    COMMENT: S++, // <!--
    COMMENT_ENDING: S++, // <!-- blah -
    COMMENT_ENDED: S++, // <!-- blah --
    CDATA: S++, // <![CDATA[ something
    CDATA_ENDING: S++, // ]
    CDATA_ENDING_2: S++, // ]]
    PROC_INST: S++, // <?hi
    PROC_INST_BODY: S++, // <?hi there
    PROC_INST_ENDING: S++, // <?hi "there" ?
    OPEN_TAG: S++, // <strong
    OPEN_TAG_SLASH: S++, // <strong /
    ATTRIB: S++, // <a
    ATTRIB_NAME: S++, // <a foo
    ATTRIB_NAME_SAW_WHITE: S++, // <a foo _
    ATTRIB_VALUE: S++, // <a foo=
    ATTRIB_VALUE_QUOTED: S++, // <a foo="bar
    ATTRIB_VALUE_CLOSED: S++, // <a foo="bar"
    ATTRIB_VALUE_UNQUOTED: S++, // <a foo=bar
    ATTRIB_VALUE_ENTITY_Q: S++, // <foo bar="&quot;"
    ATTRIB_VALUE_ENTITY_U: S++, // <foo bar=&quot
    CLOSE_TAG: S++, // </a
    CLOSE_TAG_SAW_WHITE: S++, // </a   >
    SCRIPT: S++, // <script> ...
    SCRIPT_ENDING: S++, // <script> ... <
  }

  sax.XML_ENTITIES = {
    amp: '&',
    gt: '>',
    lt: '<',
    quot: '"',
    apos: "'",
  }

  sax.ENTITIES = {
    amp: '&',
    gt: '>',
    lt: '<',
    quot: '"',
    apos: "'",
    AElig: 198,
    Aacute: 193,
    Acirc: 194,
    Agrave: 192,
    Aring: 197,
    Atilde: 195,
    Auml: 196,
    Ccedil: 199,
    ETH: 208,
    Eacute: 201,
    Ecirc: 202,
    Egrave: 200,
    Euml: 203,
    Iacute: 205,
    Icirc: 206,
    Igrave: 204,
    Iuml: 207,
    Ntilde: 209,
    Oacute: 211,
    Ocirc: 212,
    Ograve: 210,
    Oslash: 216,
    Otilde: 213,
    Ouml: 214,
    THORN: 222,
    Uacute: 218,
    Ucirc: 219,
    Ugrave: 217,
    Uuml: 220,
    Yacute: 221,
    aacute: 225,
    acirc: 226,
    aelig: 230,
    agrave: 224,
    aring: 229,
    atilde: 227,
    auml: 228,
    ccedil: 231,
    eacute: 233,
    ecirc: 234,
    egrave: 232,
    eth: 240,
    euml: 235,
    iacute: 237,
    icirc: 238,
    igrave: 236,
    iuml: 239,
    ntilde: 241,
    oacute: 243,
    ocirc: 244,
    ograve: 242,
    oslash: 248,
    otilde: 245,
    ouml: 246,
    szlig: 223,
    thorn: 254,
    uacute: 250,
    ucirc: 251,
    ugrave: 249,
    uuml: 252,
    yacute: 253,
    yuml: 255,
    copy: 169,
    reg: 174,
    nbsp: 160,
    iexcl: 161,
    cent: 162,
    pound: 163,
    curren: 164,
    yen: 165,
    brvbar: 166,
    sect: 167,
    uml: 168,
    ordf: 170,
    laquo: 171,
    not: 172,
    shy: 173,
    macr: 175,
    deg: 176,
    plusmn: 177,
    sup1: 185,
    sup2: 178,
    sup3: 179,
    acute: 180,
    micro: 181,
    para: 182,
    middot: 183,
    cedil: 184,
    ordm: 186,
    raquo: 187,
    frac14: 188,
    frac12: 189,
    frac34: 190,
    iquest: 191,
    times: 215,
    divide: 247,
    OElig: 338,
    oelig: 339,
    Scaron: 352,
    scaron: 353,
    Yuml: 376,
    fnof: 402,
    circ: 710,
    tilde: 732,
    Alpha: 913,
    Beta: 914,
    Gamma: 915,
    Delta: 916,
    Epsilon: 917,
    Zeta: 918,
    Eta: 919,
    Theta: 920,
    Iota: 921,
    Kappa: 922,
    Lambda: 923,
    Mu: 924,
    Nu: 925,
    Xi: 926,
    Omicron: 927,
    Pi: 928,
    Rho: 929,
    Sigma: 931,
    Tau: 932,
    Upsilon: 933,
    Phi: 934,
    Chi: 935,
    Psi: 936,
    Omega: 937,
    alpha: 945,
    beta: 946,
    gamma: 947,
    delta: 948,
    epsilon: 949,
    zeta: 950,
    eta: 951,
    theta: 952,
    iota: 953,
    kappa: 954,
    lambda: 955,
    mu: 956,
    nu: 957,
    xi: 958,
    omicron: 959,
    pi: 960,
    rho: 961,
    sigmaf: 962,
    sigma: 963,
    tau: 964,
    upsilon: 965,
    phi: 966,
    chi: 967,
    psi: 968,
    omega: 969,
    thetasym: 977,
    upsih: 978,
    piv: 982,
    ensp: 8194,
    emsp: 8195,
    thinsp: 8201,
    zwnj: 8204,
    zwj: 8205,
    lrm: 8206,
    rlm: 8207,
    ndash: 8211,
    mdash: 8212,
    lsquo: 8216,
    rsquo: 8217,
    sbquo: 8218,
    ldquo: 8220,
    rdquo: 8221,
    bdquo: 8222,
    dagger: 8224,
    Dagger: 8225,
    bull: 8226,
    hellip: 8230,
    permil: 8240,
    prime: 8242,
    Prime: 8243,
    lsaquo: 8249,
    rsaquo: 8250,
    oline: 8254,
    frasl: 8260,
    euro: 8364,
    image: 8465,
    weierp: 8472,
    real: 8476,
    trade: 8482,
    alefsym: 8501,
    larr: 8592,
    uarr: 8593,
    rarr: 8594,
    darr: 8595,
    harr: 8596,
    crarr: 8629,
    lArr: 8656,
    uArr: 8657,
    rArr: 8658,
    dArr: 8659,
    hArr: 8660,
    forall: 8704,
    part: 8706,
    exist: 8707,
    empty: 8709,
    nabla: 8711,
    isin: 8712,
    notin: 8713,
    ni: 8715,
    prod: 8719,
    sum: 8721,
    minus: 8722,
    lowast: 8727,
    radic: 8730,
    prop: 8733,
    infin: 8734,
    ang: 8736,
    and: 8743,
    or: 8744,
    cap: 8745,
    cup: 8746,
    int: 8747,
    there4: 8756,
    sim: 8764,
    cong: 8773,
    asymp: 8776,
    ne: 8800,
    equiv: 8801,
    le: 8804,
    ge: 8805,
    sub: 8834,
    sup: 8835,
    nsub: 8836,
    sube: 8838,
    supe: 8839,
    oplus: 8853,
    otimes: 8855,
    perp: 8869,
    sdot: 8901,
    lceil: 8968,
    rceil: 8969,
    lfloor: 8970,
    rfloor: 8971,
    lang: 9001,
    rang: 9002,
    loz: 9674,
    spades: 9824,
    clubs: 9827,
    hearts: 9829,
    diams: 9830,
  }

  Object.keys(sax.ENTITIES).forEach(function (key) {
    var e = sax.ENTITIES[key]
    var s = typeof e === 'number' ? String.fromCharCode(e) : e
    sax.ENTITIES[key] = s
  })

  for (var s in sax.STATE) {
    sax.STATE[sax.STATE[s]] = s
  }

  // shorthand
  S = sax.STATE

  function emit(parser, event, data) {
    parser[event] && parser[event](data)
  }

  function emitNode(parser, nodeType, data) {
    if (parser.textNode) closeText(parser)
    emit(parser, nodeType, data)
  }

  function closeText(parser) {
    parser.textNode = textopts(parser.opt, parser.textNode)
    if (parser.textNode) emit(parser, 'ontext', parser.textNode)
    parser.textNode = ''
  }

  function textopts(opt, text) {
    if (opt.trim) text = text.trim()
    if (opt.normalize) text = text.replace(/\s+/g, ' ')
    return text
  }

  function error(parser, er) {
    closeText(parser)
    if (parser.trackPosition) {
      er +=
        '\nLine: ' +
        parser.line +
        '\nColumn: ' +
        parser.column +
        '\nChar: ' +
        parser.c
    }
    er = new Error(er)
    parser.error = er
    emit(parser, 'onerror', er)
    return parser
  }

  function end(parser) {
    if (parser.sawRoot && !parser.closedRoot)
      strictFail(parser, 'Unclosed root tag')
    if (
      parser.state !== S.BEGIN &&
      parser.state !== S.BEGIN_WHITESPACE &&
      parser.state !== S.TEXT
    ) {
      error(parser, 'Unexpected end')
    }
    closeText(parser)
    parser.c = ''
    parser.closed = true
    emit(parser, 'onend')
    SAXParser.call(parser, parser.strict, parser.opt)
    return parser
  }

  function strictFail(parser, message) {
    if (typeof parser !== 'object' || !(parser instanceof SAXParser)) {
      throw new Error('bad call to strictFail')
    }
    if (parser.strict) {
      error(parser, message)
    }
  }

  function newTag(parser) {
    if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]()
    var parent = parser.tags[parser.tags.length - 1] || parser
    var tag = (parser.tag = { name: parser.tagName, attributes: {} })

    // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
    if (parser.opt.xmlns) {
      tag.ns = parent.ns
    }
    parser.attribList.length = 0
    emitNode(parser, 'onopentagstart', tag)
  }

  function qname(name, attribute) {
    var i = name.indexOf(':')
    var qualName = i < 0 ? ['', name] : name.split(':')
    var prefix = qualName[0]
    var local = qualName[1]

    // <x "xmlns"="http://foo">
    if (attribute && name === 'xmlns') {
      prefix = 'xmlns'
      local = ''
    }

    return { prefix: prefix, local: local }
  }

  function attrib(parser) {
    if (!parser.strict) {
      parser.attribName = parser.attribName[parser.looseCase]()
    }

    if (
      parser.attribList.indexOf(parser.attribName) !== -1 ||
      parser.tag.attributes.hasOwnProperty(parser.attribName)
    ) {
      parser.attribName = parser.attribValue = ''
      return
    }

    if (parser.opt.xmlns) {
      var qn = qname(parser.attribName, true)
      var prefix = qn.prefix
      var local = qn.local

      if (prefix === 'xmlns') {
        // namespace binding attribute. push the binding into scope
        if (local === 'xml' && parser.attribValue !== XML_NAMESPACE) {
          strictFail(
            parser,
            'xml: prefix must be bound to ' +
              XML_NAMESPACE +
              '\n' +
              'Actual: ' +
              parser.attribValue
          )
        } else if (
          local === 'xmlns' &&
          parser.attribValue !== XMLNS_NAMESPACE
        ) {
          strictFail(
            parser,
            'xmlns: prefix must be bound to ' +
              XMLNS_NAMESPACE +
              '\n' +
              'Actual: ' +
              parser.attribValue
          )
        } else {
          var tag = parser.tag
          var parent = parser.tags[parser.tags.length - 1] || parser
          if (tag.ns === parent.ns) {
            tag.ns = Object.create(parent.ns)
          }
          tag.ns[local] = parser.attribValue
        }
      }

      // defer onattribute events until all attributes have been seen
      // so any new bindings can take effect. preserve attribute order
      // so deferred events can be emitted in document order
      parser.attribList.push([parser.attribName, parser.attribValue])
    } else {
      // in non-xmlns mode, we can emit the event right away
      parser.tag.attributes[parser.attribName] = parser.attribValue
      emitNode(parser, 'onattribute', {
        name: parser.attribName,
        value: parser.attribValue,
      })
    }

    parser.attribName = parser.attribValue = ''
  }

  function openTag(parser, selfClosing) {
    if (parser.opt.xmlns) {
      // emit namespace binding events
      var tag = parser.tag

      // add namespace info to tag
      var qn = qname(parser.tagName)
      tag.prefix = qn.prefix
      tag.local = qn.local
      tag.uri = tag.ns[qn.prefix] || ''

      if (tag.prefix && !tag.uri) {
        strictFail(
          parser,
          'Unbound namespace prefix: ' + JSON.stringify(parser.tagName)
        )
        tag.uri = qn.prefix
      }

      var parent = parser.tags[parser.tags.length - 1] || parser
      if (tag.ns && parent.ns !== tag.ns) {
        Object.keys(tag.ns).forEach(function (p) {
          emitNode(parser, 'onopennamespace', {
            prefix: p,
            uri: tag.ns[p],
          })
        })
      }

      // handle deferred onattribute events
      // Note: do not apply default ns to attributes:
      //   http://www.w3.org/TR/REC-xml-names/#defaulting
      for (var i = 0, l = parser.attribList.length; i < l; i++) {
        var nv = parser.attribList[i]
        var name = nv[0]
        var value = nv[1]
        var qualName = qname(name, true)
        var prefix = qualName.prefix
        var local = qualName.local
        var uri = prefix === '' ? '' : tag.ns[prefix] || ''
        var a = {
          name: name,
          value: value,
          prefix: prefix,
          local: local,
          uri: uri,
        }

        // if there's any attributes with an undefined namespace,
        // then fail on them now.
        if (prefix && prefix !== 'xmlns' && !uri) {
          strictFail(
            parser,
            'Unbound namespace prefix: ' + JSON.stringify(prefix)
          )
          a.uri = prefix
        }
        parser.tag.attributes[name] = a
        emitNode(parser, 'onattribute', a)
      }
      parser.attribList.length = 0
    }

    parser.tag.isSelfClosing = !!selfClosing

    // process the tag
    parser.sawRoot = true
    parser.tags.push(parser.tag)
    emitNode(parser, 'onopentag', parser.tag)
    if (!selfClosing) {
      // special case for <script> in non-strict mode.
      if (!parser.noscript && parser.tagName.toLowerCase() === 'script') {
        parser.state = S.SCRIPT
      } else {
        parser.state = S.TEXT
      }
      parser.tag = null
      parser.tagName = ''
    }
    parser.attribName = parser.attribValue = ''
    parser.attribList.length = 0
  }

  function closeTag(parser) {
    if (!parser.tagName) {
      strictFail(parser, 'Weird empty close tag.')
      parser.textNode += '</>'
      parser.state = S.TEXT
      return
    }

    if (parser.script) {
      if (parser.tagName !== 'script') {
        parser.script += '</' + parser.tagName + '>'
        parser.tagName = ''
        parser.state = S.SCRIPT
        return
      }
      emitNode(parser, 'onscript', parser.script)
      parser.script = ''
    }

    // first make sure that the closing tag actually exists.
    // <a><b></c></b></a> will close everything, otherwise.
    var t = parser.tags.length
    var tagName = parser.tagName
    if (!parser.strict) {
      tagName = tagName[parser.looseCase]()
    }
    var closeTo = tagName
    while (t--) {
      var close = parser.tags[t]
      if (close.name !== closeTo) {
        // fail the first time in strict mode
        strictFail(parser, 'Unexpected close tag')
      } else {
        break
      }
    }

    // didn't find it.  we already failed for strict, so just abort.
    if (t < 0) {
      strictFail(parser, 'Unmatched closing tag: ' + parser.tagName)
      parser.textNode += '</' + parser.tagName + '>'
      parser.state = S.TEXT
      return
    }
    parser.tagName = tagName
    var s = parser.tags.length
    while (s-- > t) {
      var tag = (parser.tag = parser.tags.pop())
      parser.tagName = parser.tag.name
      emitNode(parser, 'onclosetag', parser.tagName)

      var x = {}
      for (var i in tag.ns) {
        x[i] = tag.ns[i]
      }

      var parent = parser.tags[parser.tags.length - 1] || parser
      if (parser.opt.xmlns && tag.ns !== parent.ns) {
        // remove namespace bindings introduced by tag
        Object.keys(tag.ns).forEach(function (p) {
          var n = tag.ns[p]
          emitNode(parser, 'onclosenamespace', { prefix: p, uri: n })
        })
      }
    }
    if (t === 0) parser.closedRoot = true
    parser.tagName = parser.attribValue = parser.attribName = ''
    parser.attribList.length = 0
    parser.state = S.TEXT
  }

  function parseEntity(parser) {
    var entity = parser.entity
    var entityLC = entity.toLowerCase()
    var num
    var numStr = ''

    if (parser.ENTITIES[entity]) {
      return parser.ENTITIES[entity]
    }
    if (parser.ENTITIES[entityLC]) {
      return parser.ENTITIES[entityLC]
    }
    entity = entityLC
    if (entity.charAt(0) === '#') {
      if (entity.charAt(1) === 'x') {
        entity = entity.slice(2)
        num = parseInt(entity, 16)
        numStr = num.toString(16)
      } else {
        entity = entity.slice(1)
        num = parseInt(entity, 10)
        numStr = num.toString(10)
      }
    }
    entity = entity.replace(/^0+/, '')
    if (
      isNaN(num) ||
      numStr.toLowerCase() !== entity ||
      num < 0 ||
      num > 0x10ffff
    ) {
      strictFail(parser, 'Invalid character entity')
      return '&' + parser.entity + ';'
    }

    return String.fromCodePoint(num)
  }

  function beginWhiteSpace(parser, c) {
    if (c === '<') {
      parser.state = S.OPEN_WAKA
      parser.startTagPosition = parser.position
    } else if (!isWhitespace(c)) {
      // have to process this as a text node.
      // weird, but happens.
      strictFail(parser, 'Non-whitespace before first tag.')
      parser.textNode = c
      parser.state = S.TEXT
    }
  }

  function charAt(chunk, i) {
    var result = ''
    if (i < chunk.length) {
      result = chunk.charAt(i)
    }
    return result
  }

  function write(chunk) {
    var parser = this
    if (this.error) {
      throw this.error
    }
    if (parser.closed) {
      return error(
        parser,
        'Cannot write after close. Assign an onready handler.'
      )
    }
    if (chunk === null) {
      return end(parser)
    }
    if (typeof chunk === 'object') {
      chunk = chunk.toString()
    }
    var i = 0
    var c = ''
    while (true) {
      c = charAt(chunk, i++)
      parser.c = c

      if (!c) {
        break
      }

      if (parser.trackPosition) {
        parser.position++
        if (c === '\n') {
          parser.line++
          parser.column = 0
        } else {
          parser.column++
        }
      }

      switch (parser.state) {
        case S.BEGIN:
          parser.state = S.BEGIN_WHITESPACE
          if (c === '\uFEFF') {
            continue
          }
          beginWhiteSpace(parser, c)
          continue

        case S.BEGIN_WHITESPACE:
          beginWhiteSpace(parser, c)
          continue

        case S.TEXT:
          if (parser.sawRoot && !parser.closedRoot) {
            var starti = i - 1
            while (c && c !== '<' && c !== '&') {
              c = charAt(chunk, i++)
              if (c && parser.trackPosition) {
                parser.position++
                if (c === '\n') {
                  parser.line++
                  parser.column = 0
                } else {
                  parser.column++
                }
              }
            }
            parser.textNode += chunk.substring(starti, i - 1)
          }
          if (
            c === '<' &&
            !(parser.sawRoot && parser.closedRoot && !parser.strict)
          ) {
            parser.state = S.OPEN_WAKA
            parser.startTagPosition = parser.position
          } else {
            if (
              !isWhitespace(c) &&
              (!parser.sawRoot || parser.closedRoot)
            ) {
              strictFail(parser, 'Text data outside of root node.')
            }
            if (c === '&') {
              parser.state = S.TEXT_ENTITY
            } else {
              parser.textNode += c
            }
          }
          continue

        case S.SCRIPT:
          // only non-strict
          if (c === '<') {
            parser.state = S.SCRIPT_ENDING
          } else {
            parser.script += c
          }
          continue

        case S.SCRIPT_ENDING:
          if (c === '/') {
            parser.state = S.CLOSE_TAG
          } else {
            parser.script += '<' + c
            parser.state = S.SCRIPT
          }
          continue

        case S.OPEN_WAKA:
          // either a /, ?, !, or text is coming next.
          if (c === '!') {
            parser.state = S.SGML_DECL
            parser.sgmlDecl = ''
          } else if (isWhitespace(c)) {
            // wait for it...
          } else if (isMatch(nameStart, c)) {
            parser.state = S.OPEN_TAG
            parser.tagName = c
          } else if (c === '/') {
            parser.state = S.CLOSE_TAG
            parser.tagName = ''
          } else if (c === '?') {
            parser.state = S.PROC_INST
            parser.procInstName = parser.procInstBody = ''
          } else {
            strictFail(parser, 'Unencoded <')
            // if there was some whitespace, then add that in.
            if (parser.startTagPosition + 1 < parser.position) {
              var pad = parser.position - parser.startTagPosition
              c = new Array(pad).join(' ') + c
            }
            parser.textNode += '<' + c
            parser.state = S.TEXT
          }
          continue

        case S.SGML_DECL:
          if (parser.sgmlDecl + c === '--') {
            parser.state = S.COMMENT
            parser.comment = ''
            parser.sgmlDecl = ''
            continue
          }

          if (
            parser.doctype &&
            parser.doctype !== true &&
            parser.sgmlDecl
          ) {
            parser.state = S.DOCTYPE_DTD
            parser.doctype += '<!' + parser.sgmlDecl + c
            parser.sgmlDecl = ''
          } else if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
            emitNode(parser, 'onopencdata')
            parser.state = S.CDATA
            parser.sgmlDecl = ''
            parser.cdata = ''
          } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
            parser.state = S.DOCTYPE
            if (parser.doctype || parser.sawRoot) {
              strictFail(
                parser,
                'Inappropriately located doctype declaration'
              )
            }
            parser.doctype = ''
            parser.sgmlDecl = ''
          } else if (c === '>') {
            emitNode(parser, 'onsgmldeclaration', parser.sgmlDecl)
            parser.sgmlDecl = ''
            parser.state = S.TEXT
          } else if (isQuote(c)) {
            parser.state = S.SGML_DECL_QUOTED
            parser.sgmlDecl += c
          } else {
            parser.sgmlDecl += c
          }
          continue

        case S.SGML_DECL_QUOTED:
          if (c === parser.q) {
            parser.state = S.SGML_DECL
            parser.q = ''
          }
          parser.sgmlDecl += c
          continue

        case S.DOCTYPE:
          if (c === '>') {
            parser.state = S.TEXT
            emitNode(parser, 'ondoctype', parser.doctype)
            parser.doctype = true // just remember that we saw it.
          } else {
            parser.doctype += c
            if (c === '[') {
              parser.state = S.DOCTYPE_DTD
            } else if (isQuote(c)) {
              parser.state = S.DOCTYPE_QUOTED
              parser.q = c
            }
          }
          continue

        case S.DOCTYPE_QUOTED:
          parser.doctype += c
          if (c === parser.q) {
            parser.q = ''
            parser.state = S.DOCTYPE
          }
          continue

        case S.DOCTYPE_DTD:
          if (c === ']') {
            parser.doctype += c
            parser.state = S.DOCTYPE
          } else if (c === '<') {
            parser.state = S.OPEN_WAKA
            parser.startTagPosition = parser.position
          } else if (isQuote(c)) {
            parser.doctype += c
            parser.state = S.DOCTYPE_DTD_QUOTED
            parser.q = c
          } else {
            parser.doctype += c
          }
          continue

        case S.DOCTYPE_DTD_QUOTED:
          parser.doctype += c
          if (c === parser.q) {
            parser.state = S.DOCTYPE_DTD
            parser.q = ''
          }
          continue

        case S.COMMENT:
          if (c === '-') {
            parser.state = S.COMMENT_ENDING
          } else {
            parser.comment += c
          }
          continue

        case S.COMMENT_ENDING:
          if (c === '-') {
            parser.state = S.COMMENT_ENDED
            parser.comment = textopts(parser.opt, parser.comment)
            if (parser.comment) {
              emitNode(parser, 'oncomment', parser.comment)
            }
            parser.comment = ''
          } else {
            parser.comment += '-' + c
            parser.state = S.COMMENT
          }
          continue

        case S.COMMENT_ENDED:
          if (c !== '>') {
            strictFail(parser, 'Malformed comment')
            // allow <!-- blah -- bloo --> in non-strict mode,
            // which is a comment of " blah -- bloo "
            parser.comment += '--' + c
            parser.state = S.COMMENT
          } else if (parser.doctype && parser.doctype !== true) {
            parser.state = S.DOCTYPE_DTD
          } else {
            parser.state = S.TEXT
          }
          continue

        case S.CDATA:
          var starti = i - 1
          while (c && c !== ']') {
            c = charAt(chunk, i++)
            if (c && parser.trackPosition) {
              parser.position++
              if (c === '\n') {
                parser.line++
                parser.column = 0
              } else {
                parser.column++
              }
            }
          }
          parser.cdata += chunk.substring(starti, i - 1)
          if (c === ']') {
            parser.state = S.CDATA_ENDING
          }
          continue

        case S.CDATA_ENDING:
          if (c === ']') {
            parser.state = S.CDATA_ENDING_2
          } else {
            parser.cdata += ']' + c
            parser.state = S.CDATA
          }
          continue

        case S.CDATA_ENDING_2:
          if (c === '>') {
            if (parser.cdata) {
              emitNode(parser, 'oncdata', parser.cdata)
            }
            emitNode(parser, 'onclosecdata')
            parser.cdata = ''
            parser.state = S.TEXT
          } else if (c === ']') {
            parser.cdata += ']'
          } else {
            parser.cdata += ']]' + c
            parser.state = S.CDATA
          }
          continue

        case S.PROC_INST:
          if (c === '?') {
            parser.state = S.PROC_INST_ENDING
          } else if (isWhitespace(c)) {
            parser.state = S.PROC_INST_BODY
          } else {
            parser.procInstName += c
          }
          continue

        case S.PROC_INST_BODY:
          if (!parser.procInstBody && isWhitespace(c)) {
            continue
          } else if (c === '?') {
            parser.state = S.PROC_INST_ENDING
          } else {
            parser.procInstBody += c
          }
          continue

        case S.PROC_INST_ENDING:
          if (c === '>') {
            emitNode(parser, 'onprocessinginstruction', {
              name: parser.procInstName,
              body: parser.procInstBody,
            })
            parser.procInstName = parser.procInstBody = ''
            parser.state = S.TEXT
          } else {
            parser.procInstBody += '?' + c
            parser.state = S.PROC_INST_BODY
          }
          continue

        case S.OPEN_TAG:
          if (isMatch(nameBody, c)) {
            parser.tagName += c
          } else {
            newTag(parser)
            if (c === '>') {
              openTag(parser)
            } else if (c === '/') {
              parser.state = S.OPEN_TAG_SLASH
            } else {
              if (!isWhitespace(c)) {
                strictFail(parser, 'Invalid character in tag name')
              }
              parser.state = S.ATTRIB
            }
          }
          continue

        case S.OPEN_TAG_SLASH:
          if (c === '>') {
            openTag(parser, true)
            closeTag(parser)
          } else {
            strictFail(
              parser,
              'Forward-slash in opening tag not followed by >'
            )
            parser.state = S.ATTRIB
          }
          continue

        case S.ATTRIB:
          // haven't read the attribute name yet.
          if (isWhitespace(c)) {
            continue
          } else if (c === '>') {
            openTag(parser)
          } else if (c === '/') {
            parser.state = S.OPEN_TAG_SLASH
          } else if (isMatch(nameStart, c)) {
            parser.attribName = c
            parser.attribValue = ''
            parser.state = S.ATTRIB_NAME
          } else {
            strictFail(parser, 'Invalid attribute name')
          }
          continue

        case S.ATTRIB_NAME:
          if (c === '=') {
            parser.state = S.ATTRIB_VALUE
          } else if (c === '>') {
            strictFail(parser, 'Attribute without value')
            parser.attribValue = parser.attribName
            attrib(parser)
            openTag(parser)
          } else if (isWhitespace(c)) {
            parser.state = S.ATTRIB_NAME_SAW_WHITE
          } else if (isMatch(nameBody, c)) {
            parser.attribName += c
          } else {
            strictFail(parser, 'Invalid attribute name')
          }
          continue

        case S.ATTRIB_NAME_SAW_WHITE:
          if (c === '=') {
            parser.state = S.ATTRIB_VALUE
          } else if (isWhitespace(c)) {
            continue
          } else {
            strictFail(parser, 'Attribute without value')
            parser.tag.attributes[parser.attribName] = ''
            parser.attribValue = ''
            emitNode(parser, 'onattribute', {
              name: parser.attribName,
              value: '',
            })
            parser.attribName = ''
            if (c === '>') {
              openTag(parser)
            } else if (isMatch(nameStart, c)) {
              parser.attribName = c
              parser.state = S.ATTRIB_NAME
            } else {
              strictFail(parser, 'Invalid attribute name')
              parser.state = S.ATTRIB
            }
          }
          continue

        case S.ATTRIB_VALUE:
          if (isWhitespace(c)) {
            continue
          } else if (isQuote(c)) {
            parser.q = c
            parser.state = S.ATTRIB_VALUE_QUOTED
          } else {
            if (!parser.opt.unquotedAttributeValues) {
              error(parser, 'Unquoted attribute value')
            }
            parser.state = S.ATTRIB_VALUE_UNQUOTED
            parser.attribValue = c
          }
          continue

        case S.ATTRIB_VALUE_QUOTED:
          if (c !== parser.q) {
            if (c === '&') {
              parser.state = S.ATTRIB_VALUE_ENTITY_Q
            } else {
              parser.attribValue += c
            }
            continue
          }
          attrib(parser)
          parser.q = ''
          parser.state = S.ATTRIB_VALUE_CLOSED
          continue

        case S.ATTRIB_VALUE_CLOSED:
          if (isWhitespace(c)) {
            parser.state = S.ATTRIB
          } else if (c === '>') {
            openTag(parser)
          } else if (c === '/') {
            parser.state = S.OPEN_TAG_SLASH
          } else if (isMatch(nameStart, c)) {
            strictFail(parser, 'No whitespace between attributes')
            parser.attribName = c
            parser.attribValue = ''
            parser.state = S.ATTRIB_NAME
          } else {
            strictFail(parser, 'Invalid attribute name')
          }
          continue

        case S.ATTRIB_VALUE_UNQUOTED:
          if (!isAttribEnd(c)) {
            if (c === '&') {
              parser.state = S.ATTRIB_VALUE_ENTITY_U
            } else {
              parser.attribValue += c
            }
            continue
          }
          attrib(parser)
          if (c === '>') {
            openTag(parser)
          } else {
            parser.state = S.ATTRIB
          }
          continue

        case S.CLOSE_TAG:
          if (!parser.tagName) {
            if (isWhitespace(c)) {
              continue
            } else if (notMatch(nameStart, c)) {
              if (parser.script) {
                parser.script += '</' + c
                parser.state = S.SCRIPT
              } else {
                strictFail(parser, 'Invalid tagname in closing tag.')
              }
            } else {
              parser.tagName = c
            }
          } else if (c === '>') {
            closeTag(parser)
          } else if (isMatch(nameBody, c)) {
            parser.tagName += c
          } else if (parser.script) {
            parser.script += '</' + parser.tagName + c
            parser.tagName = ''
            parser.state = S.SCRIPT
          } else {
            if (!isWhitespace(c)) {
              strictFail(parser, 'Invalid tagname in closing tag')
            }
            parser.state = S.CLOSE_TAG_SAW_WHITE
          }
          continue

        case S.CLOSE_TAG_SAW_WHITE:
          if (isWhitespace(c)) {
            continue
          }
          if (c === '>') {
            closeTag(parser)
          } else {
            strictFail(parser, 'Invalid characters in closing tag')
          }
          continue

        case S.TEXT_ENTITY:
        case S.ATTRIB_VALUE_ENTITY_Q:
        case S.ATTRIB_VALUE_ENTITY_U:
          var returnState
          var buffer
          switch (parser.state) {
            case S.TEXT_ENTITY:
              returnState = S.TEXT
              buffer = 'textNode'
              break

            case S.ATTRIB_VALUE_ENTITY_Q:
              returnState = S.ATTRIB_VALUE_QUOTED
              buffer = 'attribValue'
              break

            case S.ATTRIB_VALUE_ENTITY_U:
              returnState = S.ATTRIB_VALUE_UNQUOTED
              buffer = 'attribValue'
              break
          }

          if (c === ';') {
            var parsedEntity = parseEntity(parser)
            if (
              parser.opt.unparsedEntities &&
              !Object.values(sax.XML_ENTITIES).includes(parsedEntity)
            ) {
              if ((parser.entityCount += 1) > parser.opt.maxEntityCount) {
                error(
                  parser,
                  'Parsed entity count exceeds max entity count'
                )
              }

              if ((parser.entityDepth += 1) > parser.opt.maxEntityDepth) {
                error(
                  parser,
                  'Parsed entity depth exceeds max entity depth'
                )
              }

              parser.entity = ''
              parser.state = returnState
              parser.write(parsedEntity)
              parser.entityDepth -= 1
            } else {
              parser[buffer] += parsedEntity
              parser.entity = ''
              parser.state = returnState
            }
          } else if (
            isMatch(parser.entity.length ? entityBody : entityStart, c)
          ) {
            parser.entity += c
          } else {
            strictFail(parser, 'Invalid character in entity name')
            parser[buffer] += '&' + parser.entity + c
            parser.entity = ''
            parser.state = returnState
          }

          continue

        default: /* istanbul ignore next */ {
          throw new Error(parser, 'Unknown state: ' + parser.state)
        }
      }
    } // while

    if (parser.position >= parser.bufferCheckPosition) {
      checkBufferLength(parser)
    }
    return parser
  }

  /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
  /* istanbul ignore next */
  if (!String.fromCodePoint) {
    ;(function () {
      var stringFromCharCode = String.fromCharCode
      var floor = Math.floor
      var fromCodePoint = function () {
        var MAX_SIZE = 0x4000
        var codeUnits = []
        var highSurrogate
        var lowSurrogate
        var index = -1
        var length = arguments.length
        if (!length) {
          return ''
        }
        var result = ''
        while (++index < length) {
          var codePoint = Number(arguments[index])
          if (
            !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
            codePoint < 0 || // not a valid Unicode code point
            codePoint > 0x10ffff || // not a valid Unicode code point
            floor(codePoint) !== codePoint // not an integer
          ) {
            throw RangeError('Invalid code point: ' + codePoint)
          }
          if (codePoint <= 0xffff) {
            // BMP code point
            codeUnits.push(codePoint)
          } else {
            // Astral code point; split in surrogate halves
            // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            codePoint -= 0x10000
            highSurrogate = (codePoint >> 10) + 0xd800
            lowSurrogate = (codePoint % 0x400) + 0xdc00
            codeUnits.push(highSurrogate, lowSurrogate)
          }
          if (index + 1 === length || codeUnits.length > MAX_SIZE) {
            result += stringFromCharCode.apply(null, codeUnits)
            codeUnits.length = 0
          }
        }
        return result
      }
      /* istanbul ignore next */
      if (Object.defineProperty) {
        Object.defineProperty(String, 'fromCodePoint', {
          value: fromCodePoint,
          configurable: true,
          writable: true,
        })
      } else {
        String.fromCodePoint = fromCodePoint
      }
    })()
  }
})( false ? (0) : exports)


/***/ }),
/* 130 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const miniget = __webpack_require__(120);


/**
 * Extract string inbetween another.
 *
 * @param {string} haystack
 * @param {string} left
 * @param {string} right
 * @returns {string}
 */
exports.between = (haystack, left, right) => {
  let pos;
  if (left instanceof RegExp) {
    const match = haystack.match(left);
    if (!match) { return ''; }
    pos = match.index + match[0].length;
  } else {
    pos = haystack.indexOf(left);
    if (pos === -1) { return ''; }
    pos += left.length;
  }
  haystack = haystack.slice(pos);
  pos = haystack.indexOf(right);
  if (pos === -1) { return ''; }
  haystack = haystack.slice(0, pos);
  return haystack;
};


/**
 * Get a number from an abbreviated number string.
 *
 * @param {string} string
 * @returns {number}
 */
exports.parseAbbreviatedNumber = string => {
  const match = string
    .replace(',', '.')
    .replace(' ', '')
    .match(/([\d,.]+)([MK]?)/);
  if (match) {
    let [, num, multi] = match;
    num = parseFloat(num);
    return Math.round(multi === 'M' ? num * 1000000 :
      multi === 'K' ? num * 1000 : num);
  }
  return null;
};

/**
 * Escape sequences for cutAfterJS
 * @param {string} start the character string the escape sequence
 * @param {string} end the character string to stop the escape seequence
 * @param {undefined|Regex} startPrefix a regex to check against the preceding 10 characters
 */
const ESCAPING_SEQUENZES = [
  // Strings
  { start: '"', end: '"' },
  { start: "'", end: "'" },
  { start: '`', end: '`' },
  // RegeEx
  { start: '/', end: '/', startPrefix: /(^|[[{:;,/])\s?$/ },
];

/**
 * Match begin and end braces of input JS, return only JS
 *
 * @param {string} mixedJson
 * @returns {string}
*/
exports.cutAfterJS = mixedJson => {
  // Define the general open and closing tag
  let open, close;
  if (mixedJson[0] === '[') {
    open = '[';
    close = ']';
  } else if (mixedJson[0] === '{') {
    open = '{';
    close = '}';
  }

  if (!open) {
    throw new Error(`Can't cut unsupported JSON (need to begin with [ or { ) but got: ${mixedJson[0]}`);
  }

  // States if the loop is currently inside an escaped js object
  let isEscapedObject = null;

  // States if the current character is treated as escaped or not
  let isEscaped = false;

  // Current open brackets to be closed
  let counter = 0;

  let i;
  // Go through all characters from the start
  for (i = 0; i < mixedJson.length; i++) {
    // End of current escaped object
    if (!isEscaped && isEscapedObject !== null && mixedJson[i] === isEscapedObject.end) {
      isEscapedObject = null;
      continue;
    // Might be the start of a new escaped object
    } else if (!isEscaped && isEscapedObject === null) {
      for (const escaped of ESCAPING_SEQUENZES) {
        if (mixedJson[i] !== escaped.start) continue;
        // Test startPrefix against last 10 characters
        if (!escaped.startPrefix || mixedJson.substring(i - 10, i).match(escaped.startPrefix)) {
          isEscapedObject = escaped;
          break;
        }
      }
      // Continue if we found a new escaped object
      if (isEscapedObject !== null) {
        continue;
      }
    }

    // Toggle the isEscaped boolean for every backslash
    // Reset for every regular character
    isEscaped = mixedJson[i] === '\\' && !isEscaped;

    if (isEscapedObject !== null) continue;

    if (mixedJson[i] === open) {
      counter++;
    } else if (mixedJson[i] === close) {
      counter--;
    }

    // All brackets have been closed, thus end of JSON is reached
    if (counter === 0) {
      // Return the cut JSON
      return mixedJson.substring(0, i + 1);
    }
  }

  // We ran through the whole string and ended up with an unclosed bracket
  throw Error("Can't cut unsupported JSON (no matching closing bracket found)");
};


/**
 * Checks if there is a playability error.
 *
 * @param {Object} player_response
 * @param {Array.<string>} statuses
 * @param {Error} ErrorType
 * @returns {!Error}
 */
exports.playError = (player_response, statuses, ErrorType = Error) => {
  let playability = player_response && player_response.playabilityStatus;
  if (playability && statuses.includes(playability.status)) {
    return new ErrorType(playability.reason || (playability.messages && playability.messages[0]));
  }
  return null;
};

/**
 * Does a miniget request and calls options.requestCallback if present
 *
 * @param {string} url the request url
 * @param {Object} options an object with optional requestOptions and requestCallback parameters
 * @param {Object} requestOptionsOverwrite overwrite of options.requestOptions
 * @returns {miniget.Stream}
 */
exports.exposedMiniget = (url, options = {}, requestOptionsOverwrite) => {
  const req = miniget(url, requestOptionsOverwrite || options.requestOptions);
  if (typeof options.requestCallback === 'function') options.requestCallback(req);
  return req;
};

/**
 * Temporary helper to help deprecating a few properties.
 *
 * @param {Object} obj
 * @param {string} prop
 * @param {Object} value
 * @param {string} oldPath
 * @param {string} newPath
 */
exports.deprecate = (obj, prop, value, oldPath, newPath) => {
  Object.defineProperty(obj, prop, {
    get: () => {
      console.warn(`\`${oldPath}\` will be removed in a near future release, ` +
        `use \`${newPath}\` instead.`);
      return value;
    },
  });
};


// Check for updates.
const pkg = __webpack_require__(131);
const UPDATE_INTERVAL = 1000 * 60 * 60 * 12;
exports.lastUpdateCheck = 0;
exports.checkForUpdates = () => {
  if (!process.env.YTDL_NO_UPDATE && !pkg.version.startsWith('0.0.0-') &&
    Date.now() - exports.lastUpdateCheck >= UPDATE_INTERVAL) {
    exports.lastUpdateCheck = Date.now();
    return miniget('https://api.github.com/repos/fent/node-ytdl-core/releases/latest', {
      headers: { 'User-Agent': 'ytdl-core' },
    }).text().then(response => {
      if (JSON.parse(response).tag_name !== `v${pkg.version}`) {
        console.warn('\x1b[33mWARNING:\x1B[0m ytdl-core is out of date! Update with "npm install ytdl-core@latest".');
      }
    }, err => {
      console.warn('Error checking for updates:', err.message);
      console.warn('You can disable this check by setting the `YTDL_NO_UPDATE` env variable.');
    });
  }
  return null;
};


/**
 * Gets random IPv6 Address from a block
 *
 * @param {string} ip the IPv6 block in CIDR-Notation
 * @returns {string}
 */
exports.getRandomIPv6 = ip => {
  // Start with a fast Regex-Check
  if (!isIPv6(ip)) throw Error('Invalid IPv6 format');
  // Start by splitting and normalizing addr and mask
  const [rawAddr, rawMask] = ip.split('/');
  let base10Mask = parseInt(rawMask);
  if (!base10Mask || base10Mask > 128 || base10Mask < 24) throw Error('Invalid IPv6 subnet');
  const base10addr = normalizeIP(rawAddr);
  // Get random addr to pad with
  // using Math.random since we're not requiring high level of randomness
  const randomAddr = new Array(8).fill(1).map(() => Math.floor(Math.random() * 0xffff));

  // Merge base10addr with randomAddr
  const mergedAddr = randomAddr.map((randomItem, idx) => {
    // Calculate the amount of static bits
    const staticBits = Math.min(base10Mask, 16);
    // Adjust the bitmask with the staticBits
    base10Mask -= staticBits;
    // Calculate the bitmask
    // lsb makes the calculation way more complicated
    const mask = 0xffff - ((2 ** (16 - staticBits)) - 1);
    // Combine base10addr and random
    return (base10addr[idx] & mask) + (randomItem & (mask ^ 0xffff));
  });
  // Return new addr
  return mergedAddr.map(x => x.toString('16')).join(':');
};


// eslint-disable-next-line max-len
const IPV6_REGEX = /^(([0-9a-f]{1,4}:)(:[0-9a-f]{1,4}){1,6}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,6}(:[0-9a-f]{1,4})|([0-9a-f]{1,4}:){1,7}(([0-9a-f]{1,4})|:))\/(1[0-1]\d|12[0-8]|\d{1,2})$/;
/**
 * Quick check for a valid IPv6
 * The Regex only accepts a subset of all IPv6 Addresses
 *
 * @param {string} ip the IPv6 block in CIDR-Notation to test
 * @returns {boolean} true if valid
 */
const isIPv6 = exports.isIPv6 = ip => IPV6_REGEX.test(ip);


/**
 * Normalise an IP Address
 *
 * @param {string} ip the IPv6 Addr
 * @returns {number[]} the 8 parts of the IPv6 as Integers
 */
const normalizeIP = exports.normalizeIP = ip => {
  // Split by fill position
  const parts = ip.split('::').map(x => x.split(':'));
  // Normalize start and end
  const partStart = parts[0] || [];
  const partEnd = parts[1] || [];
  partEnd.reverse();
  // Placeholder for full ip
  const fullIP = new Array(8).fill(0);
  // Fill in start and end parts
  for (let i = 0; i < Math.min(partStart.length, 8); i++) {
    fullIP[i] = parseInt(partStart[i], 16) || 0;
  }
  for (let i = 0; i < Math.min(partEnd.length, 8); i++) {
    fullIP[7 - i] = parseInt(partEnd[i], 16) || 0;
  }
  return fullIP;
};


/***/ }),
/* 131 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"name":"ytdl-core","description":"YouTube video downloader in pure javascript.","keywords":["youtube","video","download"],"version":"4.11.5","repository":{"type":"git","url":"git://github.com/fent/node-ytdl-core.git"},"author":"fent <fentbox@gmail.com> (https://github.com/fent)","contributors":["Tobias Kutscha (https://github.com/TimeForANinja)","Andrew Kelley (https://github.com/andrewrk)","Mauricio Allende (https://github.com/mallendeo)","Rodrigo Altamirano (https://github.com/raltamirano)","Jim Buck (https://github.com/JimmyBoh)","Paweł Ruciński (https://github.com/Roki100)","Alexander Paolini (https://github.com/Million900o)"],"main":"./lib/index.js","types":"./typings/index.d.ts","files":["lib","typings"],"scripts":{"test":"nyc --reporter=lcov --reporter=text-summary npm run test:unit","test:unit":"mocha --ignore test/irl-test.js test/*-test.js --timeout 4000","test:irl":"mocha --timeout 16000 test/irl-test.js","lint":"eslint ./","lint:fix":"eslint --fix ./","lint:typings":"tslint typings/index.d.ts","lint:typings:fix":"tslint --fix typings/index.d.ts"},"dependencies":{"m3u8stream":"^0.8.6","miniget":"^4.2.2","sax":"^1.1.3"},"devDependencies":{"@types/node":"^13.1.0","assert-diff":"^3.0.1","dtslint":"^3.6.14","eslint":"^6.8.0","mocha":"^7.0.0","muk-require":"^1.2.0","nock":"^13.0.4","nyc":"^15.0.0","sinon":"^9.0.0","stream-equal":"~1.1.0","typescript":"^3.9.7"},"engines":{"node":">=12"},"license":"MIT"}');

/***/ }),
/* 132 */
/***/ ((module) => {

"use strict";
module.exports = require("timers");

/***/ }),
/* 133 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const utils = __webpack_require__(130);
const FORMATS = __webpack_require__(134);


// Use these to help sort formats, higher index is better.
const audioEncodingRanks = [
  'mp4a',
  'mp3',
  'vorbis',
  'aac',
  'opus',
  'flac',
];
const videoEncodingRanks = [
  'mp4v',
  'avc1',
  'Sorenson H.283',
  'MPEG-4 Visual',
  'VP8',
  'VP9',
  'H.264',
];

const getVideoBitrate = format => format.bitrate || 0;
const getVideoEncodingRank = format =>
  videoEncodingRanks.findIndex(enc => format.codecs && format.codecs.includes(enc));
const getAudioBitrate = format => format.audioBitrate || 0;
const getAudioEncodingRank = format =>
  audioEncodingRanks.findIndex(enc => format.codecs && format.codecs.includes(enc));


/**
 * Sort formats by a list of functions.
 *
 * @param {Object} a
 * @param {Object} b
 * @param {Array.<Function>} sortBy
 * @returns {number}
 */
const sortFormatsBy = (a, b, sortBy) => {
  let res = 0;
  for (let fn of sortBy) {
    res = fn(b) - fn(a);
    if (res !== 0) {
      break;
    }
  }
  return res;
};


const sortFormatsByVideo = (a, b) => sortFormatsBy(a, b, [
  format => parseInt(format.qualityLabel),
  getVideoBitrate,
  getVideoEncodingRank,
]);


const sortFormatsByAudio = (a, b) => sortFormatsBy(a, b, [
  getAudioBitrate,
  getAudioEncodingRank,
]);


/**
 * Sort formats from highest quality to lowest.
 *
 * @param {Object} a
 * @param {Object} b
 * @returns {number}
 */
exports.sortFormats = (a, b) => sortFormatsBy(a, b, [
  // Formats with both video and audio are ranked highest.
  format => +!!format.isHLS,
  format => +!!format.isDashMPD,
  format => +(format.contentLength > 0),
  format => +(format.hasVideo && format.hasAudio),
  format => +format.hasVideo,
  format => parseInt(format.qualityLabel) || 0,
  getVideoBitrate,
  getAudioBitrate,
  getVideoEncodingRank,
  getAudioEncodingRank,
]);


/**
 * Choose a format depending on the given options.
 *
 * @param {Array.<Object>} formats
 * @param {Object} options
 * @returns {Object}
 * @throws {Error} when no format matches the filter/format rules
 */
exports.chooseFormat = (formats, options) => {
  if (typeof options.format === 'object') {
    if (!options.format.url) {
      throw Error('Invalid format given, did you use `ytdl.getInfo()`?');
    }
    return options.format;
  }

  if (options.filter) {
    formats = exports.filterFormats(formats, options.filter);
  }

  // We currently only support HLS-Formats for livestreams
  // So we (now) remove all non-HLS streams
  if (formats.some(fmt => fmt.isHLS)) {
    formats = formats.filter(fmt => fmt.isHLS || !fmt.isLive);
  }

  let format;
  const quality = options.quality || 'highest';
  switch (quality) {
    case 'highest':
      format = formats[0];
      break;

    case 'lowest':
      format = formats[formats.length - 1];
      break;

    case 'highestaudio': {
      formats = exports.filterFormats(formats, 'audio');
      formats.sort(sortFormatsByAudio);
      // Filter for only the best audio format
      const bestAudioFormat = formats[0];
      formats = formats.filter(f => sortFormatsByAudio(bestAudioFormat, f) === 0);
      // Check for the worst video quality for the best audio quality and pick according
      // This does not loose default sorting of video encoding and bitrate
      const worstVideoQuality = formats.map(f => parseInt(f.qualityLabel) || 0).sort((a, b) => a - b)[0];
      format = formats.find(f => (parseInt(f.qualityLabel) || 0) === worstVideoQuality);
      break;
    }

    case 'lowestaudio':
      formats = exports.filterFormats(formats, 'audio');
      formats.sort(sortFormatsByAudio);
      format = formats[formats.length - 1];
      break;

    case 'highestvideo': {
      formats = exports.filterFormats(formats, 'video');
      formats.sort(sortFormatsByVideo);
      // Filter for only the best video format
      const bestVideoFormat = formats[0];
      formats = formats.filter(f => sortFormatsByVideo(bestVideoFormat, f) === 0);
      // Check for the worst audio quality for the best video quality and pick according
      // This does not loose default sorting of audio encoding and bitrate
      const worstAudioQuality = formats.map(f => f.audioBitrate || 0).sort((a, b) => a - b)[0];
      format = formats.find(f => (f.audioBitrate || 0) === worstAudioQuality);
      break;
    }

    case 'lowestvideo':
      formats = exports.filterFormats(formats, 'video');
      formats.sort(sortFormatsByVideo);
      format = formats[formats.length - 1];
      break;

    default:
      format = getFormatByQuality(quality, formats);
      break;
  }

  if (!format) {
    throw Error(`No such format found: ${quality}`);
  }
  return format;
};

/**
 * Gets a format based on quality or array of quality's
 *
 * @param {string|[string]} quality
 * @param {[Object]} formats
 * @returns {Object}
 */
const getFormatByQuality = (quality, formats) => {
  let getFormat = itag => formats.find(format => `${format.itag}` === `${itag}`);
  if (Array.isArray(quality)) {
    return getFormat(quality.find(q => getFormat(q)));
  } else {
    return getFormat(quality);
  }
};


/**
 * @param {Array.<Object>} formats
 * @param {Function} filter
 * @returns {Array.<Object>}
 */
exports.filterFormats = (formats, filter) => {
  let fn;
  switch (filter) {
    case 'videoandaudio':
    case 'audioandvideo':
      fn = format => format.hasVideo && format.hasAudio;
      break;

    case 'video':
      fn = format => format.hasVideo;
      break;

    case 'videoonly':
      fn = format => format.hasVideo && !format.hasAudio;
      break;

    case 'audio':
      fn = format => format.hasAudio;
      break;

    case 'audioonly':
      fn = format => !format.hasVideo && format.hasAudio;
      break;

    default:
      if (typeof filter === 'function') {
        fn = filter;
      } else {
        throw TypeError(`Given filter (${filter}) is not supported`);
      }
  }
  return formats.filter(format => !!format.url && fn(format));
};


/**
 * @param {Object} format
 * @returns {Object}
 */
exports.addFormatMeta = format => {
  format = Object.assign({}, FORMATS[format.itag], format);
  format.hasVideo = !!format.qualityLabel;
  format.hasAudio = !!format.audioBitrate;
  format.container = format.mimeType ?
    format.mimeType.split(';')[0].split('/')[1] : null;
  format.codecs = format.mimeType ?
    utils.between(format.mimeType, 'codecs="', '"') : null;
  format.videoCodec = format.hasVideo && format.codecs ?
    format.codecs.split(', ')[0] : null;
  format.audioCodec = format.hasAudio && format.codecs ?
    format.codecs.split(', ').slice(-1)[0] : null;
  format.isLive = /\bsource[/=]yt_live_broadcast\b/.test(format.url);
  format.isHLS = /\/manifest\/hls_(variant|playlist)\//.test(format.url);
  format.isDashMPD = /\/manifest\/dash\//.test(format.url);
  return format;
};


/***/ }),
/* 134 */
/***/ ((module) => {

/**
 * http://en.wikipedia.org/wiki/YouTube#Quality_and_formats
 */
module.exports = {

  5: {
    mimeType: 'video/flv; codecs="Sorenson H.283, mp3"',
    qualityLabel: '240p',
    bitrate: 250000,
    audioBitrate: 64,
  },

  6: {
    mimeType: 'video/flv; codecs="Sorenson H.263, mp3"',
    qualityLabel: '270p',
    bitrate: 800000,
    audioBitrate: 64,
  },

  13: {
    mimeType: 'video/3gp; codecs="MPEG-4 Visual, aac"',
    qualityLabel: null,
    bitrate: 500000,
    audioBitrate: null,
  },

  17: {
    mimeType: 'video/3gp; codecs="MPEG-4 Visual, aac"',
    qualityLabel: '144p',
    bitrate: 50000,
    audioBitrate: 24,
  },

  18: {
    mimeType: 'video/mp4; codecs="H.264, aac"',
    qualityLabel: '360p',
    bitrate: 500000,
    audioBitrate: 96,
  },

  22: {
    mimeType: 'video/mp4; codecs="H.264, aac"',
    qualityLabel: '720p',
    bitrate: 2000000,
    audioBitrate: 192,
  },

  34: {
    mimeType: 'video/flv; codecs="H.264, aac"',
    qualityLabel: '360p',
    bitrate: 500000,
    audioBitrate: 128,
  },

  35: {
    mimeType: 'video/flv; codecs="H.264, aac"',
    qualityLabel: '480p',
    bitrate: 800000,
    audioBitrate: 128,
  },

  36: {
    mimeType: 'video/3gp; codecs="MPEG-4 Visual, aac"',
    qualityLabel: '240p',
    bitrate: 175000,
    audioBitrate: 32,
  },

  37: {
    mimeType: 'video/mp4; codecs="H.264, aac"',
    qualityLabel: '1080p',
    bitrate: 3000000,
    audioBitrate: 192,
  },

  38: {
    mimeType: 'video/mp4; codecs="H.264, aac"',
    qualityLabel: '3072p',
    bitrate: 3500000,
    audioBitrate: 192,
  },

  43: {
    mimeType: 'video/webm; codecs="VP8, vorbis"',
    qualityLabel: '360p',
    bitrate: 500000,
    audioBitrate: 128,
  },

  44: {
    mimeType: 'video/webm; codecs="VP8, vorbis"',
    qualityLabel: '480p',
    bitrate: 1000000,
    audioBitrate: 128,
  },

  45: {
    mimeType: 'video/webm; codecs="VP8, vorbis"',
    qualityLabel: '720p',
    bitrate: 2000000,
    audioBitrate: 192,
  },

  46: {
    mimeType: 'audio/webm; codecs="vp8, vorbis"',
    qualityLabel: '1080p',
    bitrate: null,
    audioBitrate: 192,
  },

  82: {
    mimeType: 'video/mp4; codecs="H.264, aac"',
    qualityLabel: '360p',
    bitrate: 500000,
    audioBitrate: 96,
  },

  83: {
    mimeType: 'video/mp4; codecs="H.264, aac"',
    qualityLabel: '240p',
    bitrate: 500000,
    audioBitrate: 96,
  },

  84: {
    mimeType: 'video/mp4; codecs="H.264, aac"',
    qualityLabel: '720p',
    bitrate: 2000000,
    audioBitrate: 192,
  },

  85: {
    mimeType: 'video/mp4; codecs="H.264, aac"',
    qualityLabel: '1080p',
    bitrate: 3000000,
    audioBitrate: 192,
  },

  91: {
    mimeType: 'video/ts; codecs="H.264, aac"',
    qualityLabel: '144p',
    bitrate: 100000,
    audioBitrate: 48,
  },

  92: {
    mimeType: 'video/ts; codecs="H.264, aac"',
    qualityLabel: '240p',
    bitrate: 150000,
    audioBitrate: 48,
  },

  93: {
    mimeType: 'video/ts; codecs="H.264, aac"',
    qualityLabel: '360p',
    bitrate: 500000,
    audioBitrate: 128,
  },

  94: {
    mimeType: 'video/ts; codecs="H.264, aac"',
    qualityLabel: '480p',
    bitrate: 800000,
    audioBitrate: 128,
  },

  95: {
    mimeType: 'video/ts; codecs="H.264, aac"',
    qualityLabel: '720p',
    bitrate: 1500000,
    audioBitrate: 256,
  },

  96: {
    mimeType: 'video/ts; codecs="H.264, aac"',
    qualityLabel: '1080p',
    bitrate: 2500000,
    audioBitrate: 256,
  },

  100: {
    mimeType: 'audio/webm; codecs="VP8, vorbis"',
    qualityLabel: '360p',
    bitrate: null,
    audioBitrate: 128,
  },

  101: {
    mimeType: 'audio/webm; codecs="VP8, vorbis"',
    qualityLabel: '360p',
    bitrate: null,
    audioBitrate: 192,
  },

  102: {
    mimeType: 'audio/webm; codecs="VP8, vorbis"',
    qualityLabel: '720p',
    bitrate: null,
    audioBitrate: 192,
  },

  120: {
    mimeType: 'video/flv; codecs="H.264, aac"',
    qualityLabel: '720p',
    bitrate: 2000000,
    audioBitrate: 128,
  },

  127: {
    mimeType: 'audio/ts; codecs="aac"',
    qualityLabel: null,
    bitrate: null,
    audioBitrate: 96,
  },

  128: {
    mimeType: 'audio/ts; codecs="aac"',
    qualityLabel: null,
    bitrate: null,
    audioBitrate: 96,
  },

  132: {
    mimeType: 'video/ts; codecs="H.264, aac"',
    qualityLabel: '240p',
    bitrate: 150000,
    audioBitrate: 48,
  },

  133: {
    mimeType: 'video/mp4; codecs="H.264"',
    qualityLabel: '240p',
    bitrate: 200000,
    audioBitrate: null,
  },

  134: {
    mimeType: 'video/mp4; codecs="H.264"',
    qualityLabel: '360p',
    bitrate: 300000,
    audioBitrate: null,
  },

  135: {
    mimeType: 'video/mp4; codecs="H.264"',
    qualityLabel: '480p',
    bitrate: 500000,
    audioBitrate: null,
  },

  136: {
    mimeType: 'video/mp4; codecs="H.264"',
    qualityLabel: '720p',
    bitrate: 1000000,
    audioBitrate: null,
  },

  137: {
    mimeType: 'video/mp4; codecs="H.264"',
    qualityLabel: '1080p',
    bitrate: 2500000,
    audioBitrate: null,
  },

  138: {
    mimeType: 'video/mp4; codecs="H.264"',
    qualityLabel: '4320p',
    bitrate: 13500000,
    audioBitrate: null,
  },

  139: {
    mimeType: 'audio/mp4; codecs="aac"',
    qualityLabel: null,
    bitrate: null,
    audioBitrate: 48,
  },

  140: {
    mimeType: 'audio/m4a; codecs="aac"',
    qualityLabel: null,
    bitrate: null,
    audioBitrate: 128,
  },

  141: {
    mimeType: 'audio/mp4; codecs="aac"',
    qualityLabel: null,
    bitrate: null,
    audioBitrate: 256,
  },

  151: {
    mimeType: 'video/ts; codecs="H.264, aac"',
    qualityLabel: '720p',
    bitrate: 50000,
    audioBitrate: 24,
  },

  160: {
    mimeType: 'video/mp4; codecs="H.264"',
    qualityLabel: '144p',
    bitrate: 100000,
    audioBitrate: null,
  },

  171: {
    mimeType: 'audio/webm; codecs="vorbis"',
    qualityLabel: null,
    bitrate: null,
    audioBitrate: 128,
  },

  172: {
    mimeType: 'audio/webm; codecs="vorbis"',
    qualityLabel: null,
    bitrate: null,
    audioBitrate: 192,
  },

  242: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '240p',
    bitrate: 100000,
    audioBitrate: null,
  },

  243: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '360p',
    bitrate: 250000,
    audioBitrate: null,
  },

  244: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '480p',
    bitrate: 500000,
    audioBitrate: null,
  },

  247: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '720p',
    bitrate: 700000,
    audioBitrate: null,
  },

  248: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '1080p',
    bitrate: 1500000,
    audioBitrate: null,
  },

  249: {
    mimeType: 'audio/webm; codecs="opus"',
    qualityLabel: null,
    bitrate: null,
    audioBitrate: 48,
  },

  250: {
    mimeType: 'audio/webm; codecs="opus"',
    qualityLabel: null,
    bitrate: null,
    audioBitrate: 64,
  },

  251: {
    mimeType: 'audio/webm; codecs="opus"',
    qualityLabel: null,
    bitrate: null,
    audioBitrate: 160,
  },

  264: {
    mimeType: 'video/mp4; codecs="H.264"',
    qualityLabel: '1440p',
    bitrate: 4000000,
    audioBitrate: null,
  },

  266: {
    mimeType: 'video/mp4; codecs="H.264"',
    qualityLabel: '2160p',
    bitrate: 12500000,
    audioBitrate: null,
  },

  271: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '1440p',
    bitrate: 9000000,
    audioBitrate: null,
  },

  272: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '4320p',
    bitrate: 20000000,
    audioBitrate: null,
  },

  278: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '144p 30fps',
    bitrate: 80000,
    audioBitrate: null,
  },

  298: {
    mimeType: 'video/mp4; codecs="H.264"',
    qualityLabel: '720p',
    bitrate: 3000000,
    audioBitrate: null,
  },

  299: {
    mimeType: 'video/mp4; codecs="H.264"',
    qualityLabel: '1080p',
    bitrate: 5500000,
    audioBitrate: null,
  },

  300: {
    mimeType: 'video/ts; codecs="H.264, aac"',
    qualityLabel: '720p',
    bitrate: 1318000,
    audioBitrate: 48,
  },

  302: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '720p HFR',
    bitrate: 2500000,
    audioBitrate: null,
  },

  303: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '1080p HFR',
    bitrate: 5000000,
    audioBitrate: null,
  },

  308: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '1440p HFR',
    bitrate: 10000000,
    audioBitrate: null,
  },

  313: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '2160p',
    bitrate: 13000000,
    audioBitrate: null,
  },

  315: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '2160p HFR',
    bitrate: 20000000,
    audioBitrate: null,
  },

  330: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '144p HDR, HFR',
    bitrate: 80000,
    audioBitrate: null,
  },

  331: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '240p HDR, HFR',
    bitrate: 100000,
    audioBitrate: null,
  },

  332: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '360p HDR, HFR',
    bitrate: 250000,
    audioBitrate: null,
  },

  333: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '240p HDR, HFR',
    bitrate: 500000,
    audioBitrate: null,
  },

  334: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '720p HDR, HFR',
    bitrate: 1000000,
    audioBitrate: null,
  },

  335: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '1080p HDR, HFR',
    bitrate: 1500000,
    audioBitrate: null,
  },

  336: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '1440p HDR, HFR',
    bitrate: 5000000,
    audioBitrate: null,
  },

  337: {
    mimeType: 'video/webm; codecs="VP9"',
    qualityLabel: '2160p HDR, HFR',
    bitrate: 12000000,
    audioBitrate: null,
  },

};


/***/ }),
/* 135 */
/***/ ((__unused_webpack_module, exports) => {

/**
 * Get video ID.
 *
 * There are a few type of video URL formats.
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://m.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/v/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://music.youtube.com/watch?v=VIDEO_ID
 *  - https://gaming.youtube.com/watch?v=VIDEO_ID
 *
 * @param {string} link
 * @return {string}
 * @throws {Error} If unable to find a id
 * @throws {TypeError} If videoid doesn't match specs
 */
const validQueryDomains = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'gaming.youtube.com',
]);
const validPathDomains = /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;
exports.getURLVideoID = link => {
  const parsed = new URL(link.trim());
  let id = parsed.searchParams.get('v');
  if (validPathDomains.test(link.trim()) && !id) {
    const paths = parsed.pathname.split('/');
    id = parsed.host === 'youtu.be' ? paths[1] : paths[2];
  } else if (parsed.hostname && !validQueryDomains.has(parsed.hostname)) {
    throw Error('Not a YouTube domain');
  }
  if (!id) {
    throw Error(`No video id found: "${link}"`);
  }
  id = id.substring(0, 11);
  if (!exports.validateID(id)) {
    throw TypeError(`Video id (${id}) does not match expected ` +
      `format (${idRegex.toString()})`);
  }
  return id;
};


/**
 * Gets video ID either from a url or by checking if the given string
 * matches the video ID format.
 *
 * @param {string} str
 * @returns {string}
 * @throws {Error} If unable to find a id
 * @throws {TypeError} If videoid doesn't match specs
 */
const urlRegex = /^https?:\/\//;
exports.getVideoID = str => {
  if (exports.validateID(str)) {
    return str;
  } else if (urlRegex.test(str.trim())) {
    return exports.getURLVideoID(str);
  } else {
    throw Error(`No video id found: ${str}`);
  }
};


/**
 * Returns true if given id satifies YouTube's id format.
 *
 * @param {string} id
 * @return {boolean}
 */
const idRegex = /^[a-zA-Z0-9-_]{11}$/;
exports.validateID = id => idRegex.test(id.trim());


/**
 * Checks wether the input string includes a valid id.
 *
 * @param {string} string
 * @returns {boolean}
 */
exports.validateURL = string => {
  try {
    exports.getURLVideoID(string);
    return true;
  } catch (e) {
    return false;
  }
};


/***/ }),
/* 136 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const utils = __webpack_require__(130);
const qs = __webpack_require__(126);
const { parseTimestamp } = __webpack_require__(137);


const BASE_URL = 'https://www.youtube.com/watch?v=';
const TITLE_TO_CATEGORY = {
  song: { name: 'Music', url: 'https://music.youtube.com/' },
};

const getText = obj => obj ? obj.runs ? obj.runs[0].text : obj.simpleText : null;


/**
 * Get video media.
 *
 * @param {Object} info
 * @returns {Object}
 */
exports.getMedia = info => {
  let media = {};
  let results = [];
  try {
    results = info.response.contents.twoColumnWatchNextResults.results.results.contents;
  } catch (err) {
    // Do nothing
  }

  let result = results.find(v => v.videoSecondaryInfoRenderer);
  if (!result) { return {}; }

  try {
    let metadataRows =
      (result.metadataRowContainer || result.videoSecondaryInfoRenderer.metadataRowContainer)
        .metadataRowContainerRenderer.rows;
    for (let row of metadataRows) {
      if (row.metadataRowRenderer) {
        let title = getText(row.metadataRowRenderer.title).toLowerCase();
        let contents = row.metadataRowRenderer.contents[0];
        media[title] = getText(contents);
        let runs = contents.runs;
        if (runs && runs[0].navigationEndpoint) {
          media[`${title}_url`] = new URL(
            runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url, BASE_URL).toString();
        }
        if (title in TITLE_TO_CATEGORY) {
          media.category = TITLE_TO_CATEGORY[title].name;
          media.category_url = TITLE_TO_CATEGORY[title].url;
        }
      } else if (row.richMetadataRowRenderer) {
        let contents = row.richMetadataRowRenderer.contents;
        let boxArt = contents
          .filter(meta => meta.richMetadataRenderer.style === 'RICH_METADATA_RENDERER_STYLE_BOX_ART');
        for (let { richMetadataRenderer } of boxArt) {
          let meta = richMetadataRenderer;
          media.year = getText(meta.subtitle);
          let type = getText(meta.callToAction).split(' ')[1];
          media[type] = getText(meta.title);
          media[`${type}_url`] = new URL(
            meta.endpoint.commandMetadata.webCommandMetadata.url, BASE_URL).toString();
          media.thumbnails = meta.thumbnail.thumbnails;
        }
        let topic = contents
          .filter(meta => meta.richMetadataRenderer.style === 'RICH_METADATA_RENDERER_STYLE_TOPIC');
        for (let { richMetadataRenderer } of topic) {
          let meta = richMetadataRenderer;
          media.category = getText(meta.title);
          media.category_url = new URL(
            meta.endpoint.commandMetadata.webCommandMetadata.url, BASE_URL).toString();
        }
      }
    }
  } catch (err) {
    // Do nothing.
  }

  return media;
};


const isVerified = badges => !!(badges && badges.find(b => b.metadataBadgeRenderer.tooltip === 'Verified'));


/**
 * Get video author.
 *
 * @param {Object} info
 * @returns {Object}
 */
exports.getAuthor = info => {
  let channelId, thumbnails = [], subscriberCount, verified = false;
  try {
    let results = info.response.contents.twoColumnWatchNextResults.results.results.contents;
    let v = results.find(v2 =>
      v2.videoSecondaryInfoRenderer &&
      v2.videoSecondaryInfoRenderer.owner &&
      v2.videoSecondaryInfoRenderer.owner.videoOwnerRenderer);
    let videoOwnerRenderer = v.videoSecondaryInfoRenderer.owner.videoOwnerRenderer;
    channelId = videoOwnerRenderer.navigationEndpoint.browseEndpoint.browseId;
    thumbnails = videoOwnerRenderer.thumbnail.thumbnails.map(thumbnail => {
      thumbnail.url = new URL(thumbnail.url, BASE_URL).toString();
      return thumbnail;
    });
    subscriberCount = utils.parseAbbreviatedNumber(getText(videoOwnerRenderer.subscriberCountText));
    verified = isVerified(videoOwnerRenderer.badges);
  } catch (err) {
    // Do nothing.
  }
  try {
    let videoDetails = info.player_response.microformat && info.player_response.microformat.playerMicroformatRenderer;
    let id = (videoDetails && videoDetails.channelId) || channelId || info.player_response.videoDetails.channelId;
    let author = {
      id: id,
      name: videoDetails ? videoDetails.ownerChannelName : info.player_response.videoDetails.author,
      user: videoDetails ? videoDetails.ownerProfileUrl.split('/').slice(-1)[0] : null,
      channel_url: `https://www.youtube.com/channel/${id}`,
      external_channel_url: videoDetails ? `https://www.youtube.com/channel/${videoDetails.externalChannelId}` : '',
      user_url: videoDetails ? new URL(videoDetails.ownerProfileUrl, BASE_URL).toString() : '',
      thumbnails,
      verified,
      subscriber_count: subscriberCount,
    };
    if (thumbnails.length) {
      utils.deprecate(author, 'avatar', author.thumbnails[0].url, 'author.avatar', 'author.thumbnails[0].url');
    }
    return author;
  } catch (err) {
    return {};
  }
};

const parseRelatedVideo = (details, rvsParams) => {
  if (!details) return;
  try {
    let viewCount = getText(details.viewCountText);
    let shortViewCount = getText(details.shortViewCountText);
    let rvsDetails = rvsParams.find(elem => elem.id === details.videoId);
    if (!/^\d/.test(shortViewCount)) {
      shortViewCount = (rvsDetails && rvsDetails.short_view_count_text) || '';
    }
    viewCount = (/^\d/.test(viewCount) ? viewCount : shortViewCount).split(' ')[0];
    let browseEndpoint = details.shortBylineText.runs[0].navigationEndpoint.browseEndpoint;
    let channelId = browseEndpoint.browseId;
    let name = getText(details.shortBylineText);
    let user = (browseEndpoint.canonicalBaseUrl || '').split('/').slice(-1)[0];
    let video = {
      id: details.videoId,
      title: getText(details.title),
      published: getText(details.publishedTimeText),
      author: {
        id: channelId,
        name,
        user,
        channel_url: `https://www.youtube.com/channel/${channelId}`,
        user_url: `https://www.youtube.com/user/${user}`,
        thumbnails: details.channelThumbnail.thumbnails.map(thumbnail => {
          thumbnail.url = new URL(thumbnail.url, BASE_URL).toString();
          return thumbnail;
        }),
        verified: isVerified(details.ownerBadges),

        [Symbol.toPrimitive]() {
          console.warn(`\`relatedVideo.author\` will be removed in a near future release, ` +
            `use \`relatedVideo.author.name\` instead.`);
          return video.author.name;
        },

      },
      short_view_count_text: shortViewCount.split(' ')[0],
      view_count: viewCount.replace(/,/g, ''),
      length_seconds: details.lengthText ?
        Math.floor(parseTimestamp(getText(details.lengthText)) / 1000) :
        rvsParams && `${rvsParams.length_seconds}`,
      thumbnails: details.thumbnail.thumbnails,
      richThumbnails:
        details.richThumbnail ?
          details.richThumbnail.movingThumbnailRenderer.movingThumbnailDetails.thumbnails : [],
      isLive: !!(details.badges && details.badges.find(b => b.metadataBadgeRenderer.label === 'LIVE NOW')),
    };

    utils.deprecate(video, 'author_thumbnail', video.author.thumbnails[0].url,
      'relatedVideo.author_thumbnail', 'relatedVideo.author.thumbnails[0].url');
    utils.deprecate(video, 'ucid', video.author.id, 'relatedVideo.ucid', 'relatedVideo.author.id');
    utils.deprecate(video, 'video_thumbnail', video.thumbnails[0].url,
      'relatedVideo.video_thumbnail', 'relatedVideo.thumbnails[0].url');
    return video;
  } catch (err) {
    // Skip.
  }
};

/**
 * Get related videos.
 *
 * @param {Object} info
 * @returns {Array.<Object>}
 */
exports.getRelatedVideos = info => {
  let rvsParams = [], secondaryResults = [];
  try {
    rvsParams = info.response.webWatchNextResponseExtensionData.relatedVideoArgs.split(',').map(e => qs.parse(e));
  } catch (err) {
    // Do nothing.
  }
  try {
    secondaryResults = info.response.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results;
  } catch (err) {
    return [];
  }
  let videos = [];
  for (let result of secondaryResults || []) {
    let details = result.compactVideoRenderer;
    if (details) {
      let video = parseRelatedVideo(details, rvsParams);
      if (video) videos.push(video);
    } else {
      let autoplay = result.compactAutoplayRenderer || result.itemSectionRenderer;
      if (!autoplay || !Array.isArray(autoplay.contents)) continue;
      for (let content of autoplay.contents) {
        let video = parseRelatedVideo(content.compactVideoRenderer, rvsParams);
        if (video) videos.push(video);
      }
    }
  }
  return videos;
};

/**
 * Get like count.
 *
 * @param {Object} info
 * @returns {number}
 */
exports.getLikes = info => {
  try {
    let contents = info.response.contents.twoColumnWatchNextResults.results.results.contents;
    let video = contents.find(r => r.videoPrimaryInfoRenderer);
    let buttons = video.videoPrimaryInfoRenderer.videoActions.menuRenderer.topLevelButtons;
    let like = buttons.find(b => b.toggleButtonRenderer &&
      b.toggleButtonRenderer.defaultIcon.iconType === 'LIKE');
    return parseInt(like.toggleButtonRenderer.defaultText.accessibility.accessibilityData.label.replace(/\D+/g, ''));
  } catch (err) {
    return null;
  }
};

/**
 * Get dislike count.
 *
 * @param {Object} info
 * @returns {number}
 */
exports.getDislikes = info => {
  try {
    let contents = info.response.contents.twoColumnWatchNextResults.results.results.contents;
    let video = contents.find(r => r.videoPrimaryInfoRenderer);
    let buttons = video.videoPrimaryInfoRenderer.videoActions.menuRenderer.topLevelButtons;
    let dislike = buttons.find(b => b.toggleButtonRenderer &&
      b.toggleButtonRenderer.defaultIcon.iconType === 'DISLIKE');
    return parseInt(dislike.toggleButtonRenderer.defaultText.accessibility.accessibilityData.label.replace(/\D+/g, ''));
  } catch (err) {
    return null;
  }
};

/**
 * Cleans up a few fields on `videoDetails`.
 *
 * @param {Object} videoDetails
 * @param {Object} info
 * @returns {Object}
 */
exports.cleanVideoDetails = (videoDetails, info) => {
  videoDetails.thumbnails = videoDetails.thumbnail.thumbnails;
  delete videoDetails.thumbnail;
  utils.deprecate(videoDetails, 'thumbnail', { thumbnails: videoDetails.thumbnails },
    'videoDetails.thumbnail.thumbnails', 'videoDetails.thumbnails');
  videoDetails.description = videoDetails.shortDescription || getText(videoDetails.description);
  delete videoDetails.shortDescription;
  utils.deprecate(videoDetails, 'shortDescription', videoDetails.description,
    'videoDetails.shortDescription', 'videoDetails.description');

  // Use more reliable `lengthSeconds` from `playerMicroformatRenderer`.
  videoDetails.lengthSeconds =
    (info.player_response.microformat &&
    info.player_response.microformat.playerMicroformatRenderer.lengthSeconds) ||
    info.player_response.videoDetails.lengthSeconds;
  return videoDetails;
};

/**
 * Get storyboards info.
 *
 * @param {Object} info
 * @returns {Array.<Object>}
 */
exports.getStoryboards = info => {
  const parts = info.player_response.storyboards &&
    info.player_response.storyboards.playerStoryboardSpecRenderer &&
    info.player_response.storyboards.playerStoryboardSpecRenderer.spec &&
    info.player_response.storyboards.playerStoryboardSpecRenderer.spec.split('|');

  if (!parts) return [];

  const url = new URL(parts.shift());

  return parts.map((part, i) => {
    let [
      thumbnailWidth,
      thumbnailHeight,
      thumbnailCount,
      columns,
      rows,
      interval,
      nameReplacement,
      sigh,
    ] = part.split('#');

    url.searchParams.set('sigh', sigh);

    thumbnailCount = parseInt(thumbnailCount, 10);
    columns = parseInt(columns, 10);
    rows = parseInt(rows, 10);

    const storyboardCount = Math.ceil(thumbnailCount / (columns * rows));

    return {
      templateUrl: url.toString().replace('$L', i).replace('$N', nameReplacement),
      thumbnailWidth: parseInt(thumbnailWidth, 10),
      thumbnailHeight: parseInt(thumbnailHeight, 10),
      thumbnailCount,
      interval: parseInt(interval, 10),
      columns,
      rows,
      storyboardCount,
    };
  });
};

/**
 * Get chapters info.
 *
 * @param {Object} info
 * @returns {Array.<Object>}
 */
exports.getChapters = info => {
  const playerOverlayRenderer = info.response &&
    info.response.playerOverlays &&
    info.response.playerOverlays.playerOverlayRenderer;
  const playerBar = playerOverlayRenderer &&
    playerOverlayRenderer.decoratedPlayerBarRenderer &&
    playerOverlayRenderer.decoratedPlayerBarRenderer.decoratedPlayerBarRenderer &&
    playerOverlayRenderer.decoratedPlayerBarRenderer.decoratedPlayerBarRenderer.playerBar;
  const markersMap = playerBar &&
    playerBar.multiMarkersPlayerBarRenderer &&
    playerBar.multiMarkersPlayerBarRenderer.markersMap;
  const marker = Array.isArray(markersMap) && markersMap.find(m => m.value && Array.isArray(m.value.chapters));
  if (!marker) return [];
  const chapters = marker.value.chapters;

  return chapters.map(chapter => ({
    title: getText(chapter.chapterRenderer.title),
    start_time: chapter.chapterRenderer.timeRangeStartMillis / 1000,
  }));
};


/***/ }),
/* 137 */
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const stream_1 = __webpack_require__(123);
const miniget_1 = __importDefault(__webpack_require__(120));
const m3u8_parser_1 = __importDefault(__webpack_require__(138));
const dash_mpd_parser_1 = __importDefault(__webpack_require__(139));
const queue_1 = __webpack_require__(141);
const parse_time_1 = __webpack_require__(140);
const supportedParsers = {
    m3u8: m3u8_parser_1.default,
    'dash-mpd': dash_mpd_parser_1.default,
};
let m3u8stream = ((playlistURL, options = {}) => {
    const stream = new stream_1.PassThrough({ highWaterMark: options.highWaterMark });
    const chunkReadahead = options.chunkReadahead || 3;
    // 20 seconds.
    const liveBuffer = options.liveBuffer || 20000;
    const requestOptions = options.requestOptions;
    const Parser = supportedParsers[options.parser || (/\.mpd$/.test(playlistURL) ? 'dash-mpd' : 'm3u8')];
    if (!Parser) {
        throw TypeError(`parser '${options.parser}' not supported`);
    }
    let begin = 0;
    if (typeof options.begin !== 'undefined') {
        begin = typeof options.begin === 'string' ?
            parse_time_1.humanStr(options.begin) :
            Math.max(options.begin - liveBuffer, 0);
    }
    const forwardEvents = (req) => {
        for (let event of ['abort', 'request', 'response', 'redirect', 'retry', 'reconnect']) {
            req.on(event, stream.emit.bind(stream, event));
        }
    };
    let currSegment;
    const streamQueue = new queue_1.Queue((req, callback) => {
        currSegment = req;
        // Count the size manually, since the `content-length` header is not
        // always there.
        let size = 0;
        req.on('data', (chunk) => size += chunk.length);
        req.pipe(stream, { end: false });
        req.on('end', () => callback(null, size));
    }, { concurrency: 1 });
    let segmentNumber = 0;
    let downloaded = 0;
    const requestQueue = new queue_1.Queue((segment, callback) => {
        let reqOptions = Object.assign({}, requestOptions);
        if (segment.range) {
            reqOptions.headers = Object.assign({}, reqOptions.headers, {
                Range: `bytes=${segment.range.start}-${segment.range.end}`,
            });
        }
        let req = miniget_1.default(new URL(segment.url, playlistURL).toString(), reqOptions);
        req.on('error', callback);
        forwardEvents(req);
        streamQueue.push(req, (_, size) => {
            downloaded += +size;
            stream.emit('progress', {
                num: ++segmentNumber,
                size: size,
                duration: segment.duration,
                url: segment.url,
            }, requestQueue.total, downloaded);
            callback(null);
        });
    }, { concurrency: chunkReadahead });
    const onError = (err) => {
        stream.emit('error', err);
        // Stop on any error.
        stream.end();
    };
    // When to look for items again.
    let refreshThreshold;
    let minRefreshTime;
    let refreshTimeout;
    let fetchingPlaylist = true;
    let ended = false;
    let isStatic = false;
    let lastRefresh;
    const onQueuedEnd = (err) => {
        currSegment = null;
        if (err) {
            onError(err);
        }
        else if (!fetchingPlaylist && !ended && !isStatic &&
            requestQueue.tasks.length + requestQueue.active <= refreshThreshold) {
            let ms = Math.max(0, minRefreshTime - (Date.now() - lastRefresh));
            fetchingPlaylist = true;
            refreshTimeout = setTimeout(refreshPlaylist, ms);
        }
        else if ((ended || isStatic) &&
            !requestQueue.tasks.length && !requestQueue.active) {
            stream.end();
        }
    };
    let currPlaylist;
    let lastSeq;
    let starttime = 0;
    const refreshPlaylist = () => {
        lastRefresh = Date.now();
        currPlaylist = miniget_1.default(playlistURL, requestOptions);
        currPlaylist.on('error', onError);
        forwardEvents(currPlaylist);
        const parser = currPlaylist.pipe(new Parser(options.id));
        parser.on('starttime', (a) => {
            if (starttime) {
                return;
            }
            starttime = a;
            if (typeof options.begin === 'string' && begin >= 0) {
                begin += starttime;
            }
        });
        parser.on('endlist', () => { isStatic = true; });
        parser.on('endearly', currPlaylist.unpipe.bind(currPlaylist, parser));
        let addedItems = [];
        const addItem = (item) => {
            if (!item.init) {
                if (item.seq <= lastSeq) {
                    return;
                }
                lastSeq = item.seq;
            }
            begin = item.time;
            requestQueue.push(item, onQueuedEnd);
            addedItems.push(item);
        };
        let tailedItems = [], tailedItemsDuration = 0;
        parser.on('item', (item) => {
            let timedItem = Object.assign({ time: starttime }, item);
            if (begin <= timedItem.time) {
                addItem(timedItem);
            }
            else {
                tailedItems.push(timedItem);
                tailedItemsDuration += timedItem.duration;
                // Only keep the last `liveBuffer` of items.
                while (tailedItems.length > 1 &&
                    tailedItemsDuration - tailedItems[0].duration > liveBuffer) {
                    const lastItem = tailedItems.shift();
                    tailedItemsDuration -= lastItem.duration;
                }
            }
            starttime += timedItem.duration;
        });
        parser.on('end', () => {
            currPlaylist = null;
            // If we are too ahead of the stream, make sure to get the
            // latest available items with a small buffer.
            if (!addedItems.length && tailedItems.length) {
                tailedItems.forEach(item => { addItem(item); });
            }
            // Refresh the playlist when remaining segments get low.
            refreshThreshold = Math.max(1, Math.ceil(addedItems.length * 0.01));
            // Throttle refreshing the playlist by looking at the duration
            // of live items added on this refresh.
            minRefreshTime =
                addedItems.reduce((total, item) => item.duration + total, 0);
            fetchingPlaylist = false;
            onQueuedEnd(null);
        });
    };
    refreshPlaylist();
    stream.end = () => {
        ended = true;
        streamQueue.die();
        requestQueue.die();
        clearTimeout(refreshTimeout);
        currPlaylist === null || currPlaylist === void 0 ? void 0 : currPlaylist.destroy();
        currSegment === null || currSegment === void 0 ? void 0 : currSegment.destroy();
        stream_1.PassThrough.prototype.end.call(stream, null);
        return stream;
    };
    return stream;
});
m3u8stream.parseTimestamp = parse_time_1.humanStr;
module.exports = m3u8stream;
//# sourceMappingURL=index.js.map

/***/ }),
/* 138 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const stream_1 = __webpack_require__(123);
/**
 * A very simple m3u8 playlist file parser that detects tags and segments.
 */
class m3u8Parser extends stream_1.Writable {
    constructor() {
        super();
        this._lastLine = '';
        this._seq = 0;
        this._nextItemDuration = null;
        this._nextItemRange = null;
        this._lastItemRangeEnd = 0;
        this.on('finish', () => {
            this._parseLine(this._lastLine);
            this.emit('end');
        });
    }
    _parseAttrList(value) {
        let attrs = {};
        let regex = /([A-Z0-9-]+)=(?:"([^"]*?)"|([^,]*?))/g;
        let match;
        while ((match = regex.exec(value)) !== null) {
            attrs[match[1]] = match[2] || match[3];
        }
        return attrs;
    }
    _parseRange(value) {
        if (!value)
            return null;
        let svalue = value.split('@');
        let start = svalue[1] ? parseInt(svalue[1]) : this._lastItemRangeEnd + 1;
        let end = start + parseInt(svalue[0]) - 1;
        let range = { start, end };
        this._lastItemRangeEnd = range.end;
        return range;
    }
    _parseLine(line) {
        let match = line.match(/^#(EXT[A-Z0-9-]+)(?::(.*))?/);
        if (match) {
            // This is a tag.
            const tag = match[1];
            const value = match[2] || '';
            switch (tag) {
                case 'EXT-X-PROGRAM-DATE-TIME':
                    this.emit('starttime', new Date(value).getTime());
                    break;
                case 'EXT-X-MEDIA-SEQUENCE':
                    this._seq = parseInt(value);
                    break;
                case 'EXT-X-MAP': {
                    let attrs = this._parseAttrList(value);
                    if (!attrs.URI) {
                        this.destroy(new Error('`EXT-X-MAP` found without required attribute `URI`'));
                        return;
                    }
                    this.emit('item', {
                        url: attrs.URI,
                        seq: this._seq,
                        init: true,
                        duration: 0,
                        range: this._parseRange(attrs.BYTERANGE),
                    });
                    break;
                }
                case 'EXT-X-BYTERANGE': {
                    this._nextItemRange = this._parseRange(value);
                    break;
                }
                case 'EXTINF':
                    this._nextItemDuration =
                        Math.round(parseFloat(value.split(',')[0]) * 1000);
                    break;
                case 'EXT-X-ENDLIST':
                    this.emit('endlist');
                    break;
            }
        }
        else if (!/^#/.test(line) && line.trim()) {
            // This is a segment
            this.emit('item', {
                url: line.trim(),
                seq: this._seq++,
                duration: this._nextItemDuration,
                range: this._nextItemRange,
            });
            this._nextItemRange = null;
        }
    }
    _write(chunk, encoding, callback) {
        let lines = chunk.toString('utf8').split('\n');
        if (this._lastLine) {
            lines[0] = this._lastLine + lines[0];
        }
        lines.forEach((line, i) => {
            if (this.destroyed)
                return;
            if (i < lines.length - 1) {
                this._parseLine(line);
            }
            else {
                // Save the last line in case it has been broken up.
                this._lastLine = line;
            }
        });
        callback();
    }
}
exports["default"] = m3u8Parser;
//# sourceMappingURL=m3u8-parser.js.map

/***/ }),
/* 139 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const stream_1 = __webpack_require__(123);
const sax_1 = __importDefault(__webpack_require__(129));
const parse_time_1 = __webpack_require__(140);
/**
 * A wrapper around sax that emits segments.
 */
class DashMPDParser extends stream_1.Writable {
    constructor(targetID) {
        super();
        this._parser = sax_1.default.createStream(false, { lowercase: true });
        this._parser.on('error', this.destroy.bind(this));
        let lastTag;
        let currtime = 0;
        let seq = 0;
        let segmentTemplate;
        let timescale, offset, duration, baseURL;
        let timeline = [];
        let getSegments = false;
        let gotSegments = false;
        let isStatic;
        let treeLevel;
        let periodStart;
        const tmpl = (str) => {
            const context = {
                RepresentationID: targetID,
                Number: seq,
                Time: currtime,
            };
            return str.replace(/\$(\w+)\$/g, (m, p1) => `${context[p1]}`);
        };
        this._parser.on('opentag', node => {
            switch (node.name) {
                case 'mpd':
                    currtime =
                        node.attributes.availabilitystarttime ?
                            new Date(node.attributes.availabilitystarttime).getTime() : 0;
                    isStatic = node.attributes.type !== 'dynamic';
                    break;
                case 'period':
                    // Reset everything on <Period> tag.
                    seq = 0;
                    timescale = 1000;
                    duration = 0;
                    offset = 0;
                    baseURL = [];
                    treeLevel = 0;
                    periodStart = parse_time_1.durationStr(node.attributes.start) || 0;
                    break;
                case 'segmentlist':
                    seq = parseInt(node.attributes.startnumber) || seq;
                    timescale = parseInt(node.attributes.timescale) || timescale;
                    duration = parseInt(node.attributes.duration) || duration;
                    offset = parseInt(node.attributes.presentationtimeoffset) || offset;
                    break;
                case 'segmenttemplate':
                    segmentTemplate = node.attributes;
                    seq = parseInt(node.attributes.startnumber) || seq;
                    timescale = parseInt(node.attributes.timescale) || timescale;
                    break;
                case 'segmenttimeline':
                case 'baseurl':
                    lastTag = node.name;
                    break;
                case 's':
                    timeline.push({
                        duration: parseInt(node.attributes.d),
                        repeat: parseInt(node.attributes.r),
                        time: parseInt(node.attributes.t),
                    });
                    break;
                case 'adaptationset':
                case 'representation':
                    treeLevel++;
                    if (!targetID) {
                        targetID = node.attributes.id;
                    }
                    getSegments = node.attributes.id === `${targetID}`;
                    if (getSegments) {
                        if (periodStart) {
                            currtime += periodStart;
                        }
                        if (offset) {
                            currtime -= offset / timescale * 1000;
                        }
                        this.emit('starttime', currtime);
                    }
                    break;
                case 'initialization':
                    if (getSegments) {
                        this.emit('item', {
                            url: baseURL.filter(s => !!s).join('') + node.attributes.sourceurl,
                            seq: seq,
                            init: true,
                            duration: 0,
                        });
                    }
                    break;
                case 'segmenturl':
                    if (getSegments) {
                        gotSegments = true;
                        let tl = timeline.shift();
                        let segmentDuration = ((tl === null || tl === void 0 ? void 0 : tl.duration) || duration) / timescale * 1000;
                        this.emit('item', {
                            url: baseURL.filter(s => !!s).join('') + node.attributes.media,
                            seq: seq++,
                            duration: segmentDuration,
                        });
                        currtime += segmentDuration;
                    }
                    break;
            }
        });
        const onEnd = () => {
            if (isStatic) {
                this.emit('endlist');
            }
            if (!getSegments) {
                this.destroy(Error(`Representation '${targetID}' not found`));
            }
            else {
                this.emit('end');
            }
        };
        this._parser.on('closetag', tagName => {
            switch (tagName) {
                case 'adaptationset':
                case 'representation':
                    treeLevel--;
                    if (segmentTemplate && timeline.length) {
                        gotSegments = true;
                        if (segmentTemplate.initialization) {
                            this.emit('item', {
                                url: baseURL.filter(s => !!s).join('') +
                                    tmpl(segmentTemplate.initialization),
                                seq: seq,
                                init: true,
                                duration: 0,
                            });
                        }
                        for (let { duration: itemDuration, repeat, time } of timeline) {
                            itemDuration = itemDuration / timescale * 1000;
                            repeat = repeat || 1;
                            currtime = time || currtime;
                            for (let i = 0; i < repeat; i++) {
                                this.emit('item', {
                                    url: baseURL.filter(s => !!s).join('') +
                                        tmpl(segmentTemplate.media),
                                    seq: seq++,
                                    duration: itemDuration,
                                });
                                currtime += itemDuration;
                            }
                        }
                    }
                    if (gotSegments) {
                        this.emit('endearly');
                        onEnd();
                        this._parser.removeAllListeners();
                        this.removeAllListeners('finish');
                    }
                    break;
            }
        });
        this._parser.on('text', text => {
            if (lastTag === 'baseurl') {
                baseURL[treeLevel] = text;
                lastTag = null;
            }
        });
        this.on('finish', onEnd);
    }
    _write(chunk, encoding, callback) {
        this._parser.write(chunk);
        callback();
    }
}
exports["default"] = DashMPDParser;
//# sourceMappingURL=dash-mpd-parser.js.map

/***/ }),
/* 140 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.durationStr = exports.humanStr = void 0;
const numberFormat = /^\d+$/;
const timeFormat = /^(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2})(?:\.(\d{3}))?$/;
const timeUnits = {
    ms: 1,
    s: 1000,
    m: 60000,
    h: 3600000,
};
/**
 * Converts human friendly time to milliseconds. Supports the format
 * 00:00:00.000 for hours, minutes, seconds, and milliseconds respectively.
 * And 0ms, 0s, 0m, 0h, and together 1m1s.
 *
 * @param {number|string} time
 * @returns {number}
 */
exports.humanStr = (time) => {
    if (typeof time === 'number') {
        return time;
    }
    if (numberFormat.test(time)) {
        return +time;
    }
    const firstFormat = timeFormat.exec(time);
    if (firstFormat) {
        return (+(firstFormat[1] || 0) * timeUnits.h) +
            (+(firstFormat[2] || 0) * timeUnits.m) +
            (+firstFormat[3] * timeUnits.s) +
            +(firstFormat[4] || 0);
    }
    else {
        let total = 0;
        const r = /(-?\d+)(ms|s|m|h)/g;
        let rs;
        while ((rs = r.exec(time)) !== null) {
            total += +rs[1] * timeUnits[rs[2]];
        }
        return total;
    }
};
/**
 * Parses a duration string in the form of "123.456S", returns milliseconds.
 *
 * @param {string} time
 * @returns {number}
 */
exports.durationStr = (time) => {
    let total = 0;
    const r = /(\d+(?:\.\d+)?)(S|M|H)/g;
    let rs;
    while ((rs = r.exec(time)) !== null) {
        total += +rs[1] * timeUnits[rs[2].toLowerCase()];
    }
    return total;
};
//# sourceMappingURL=parse-time.js.map

/***/ }),
/* 141 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Queue = void 0;
class Queue {
    /**
     * A really simple queue with concurrency.
     *
     * @param {Function} worker
     * @param {Object} options
     * @param {!number} options.concurrency
     */
    constructor(worker, options = {}) {
        this._worker = worker;
        this._concurrency = options.concurrency || 1;
        this.tasks = [];
        this.total = 0;
        this.active = 0;
    }
    /**
     * Push a task to the queue.
     *
     *  @param {T} item
     *  @param {!Function} callback
     */
    push(item, callback) {
        this.tasks.push({ item, callback });
        this.total++;
        this._next();
    }
    /**
     * Process next job in queue.
     */
    _next() {
        if (this.active >= this._concurrency || !this.tasks.length) {
            return;
        }
        const { item, callback } = this.tasks.shift();
        let callbackCalled = false;
        this.active++;
        this._worker(item, (err, result) => {
            if (callbackCalled) {
                return;
            }
            this.active--;
            callbackCalled = true;
            callback === null || callback === void 0 ? void 0 : callback(err, result);
            this._next();
        });
    }
    /**
     * Stops processing queued jobs.
     */
    die() {
        this.tasks = [];
    }
}
exports.Queue = Queue;
//# sourceMappingURL=queue.js.map

/***/ }),
/* 142 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const querystring = __webpack_require__(126);
const Cache = __webpack_require__(143);
const utils = __webpack_require__(130);
const vm = __webpack_require__(144);

// A shared cache to keep track of html5player js functions.
exports.cache = new Cache();

/**
 * Extract signature deciphering and n parameter transform functions from html5player file.
 *
 * @param {string} html5playerfile
 * @param {Object} options
 * @returns {Promise<Array.<string>>}
 */
exports.getFunctions = (html5playerfile, options) => exports.cache.getOrSet(html5playerfile, async() => {
  const body = await utils.exposedMiniget(html5playerfile, options).text();
  const functions = exports.extractFunctions(body);
  if (!functions || !functions.length) {
    throw Error('Could not extract functions');
  }
  exports.cache.set(html5playerfile, functions);
  return functions;
});

/**
 * Extracts the actions that should be taken to decipher a signature
 * and tranform the n parameter
 *
 * @param {string} body
 * @returns {Array.<string>}
 */
exports.extractFunctions = body => {
  const functions = [];
  const extractManipulations = caller => {
    const functionName = utils.between(caller, `a=a.split("");`, `.`);
    if (!functionName) return '';
    const functionStart = `var ${functionName}={`;
    const ndx = body.indexOf(functionStart);
    if (ndx < 0) return '';
    const subBody = body.slice(ndx + functionStart.length - 1);
    return `var ${functionName}=${utils.cutAfterJS(subBody)}`;
  };
  const extractDecipher = () => {
    const functionName = utils.between(body, `a.set("alr","yes");c&&(c=`, `(decodeURIC`);
    if (functionName && functionName.length) {
      const functionStart = `${functionName}=function(a)`;
      const ndx = body.indexOf(functionStart);
      if (ndx >= 0) {
        const subBody = body.slice(ndx + functionStart.length);
        let functionBody = `var ${functionStart}${utils.cutAfterJS(subBody)}`;
        functionBody = `${extractManipulations(functionBody)};${functionBody};${functionName}(sig);`;
        functions.push(functionBody);
      }
    }
  };
  const extractNCode = () => {
    let functionName = utils.between(body, `&&(b=a.get("n"))&&(b=`, `(b)`);
    if (functionName.includes('[')) functionName = utils.between(body, `var ${functionName.split('[')[0]}=[`, `]`);
    if (functionName && functionName.length) {
      const functionStart = `${functionName}=function(a)`;
      const ndx = body.indexOf(functionStart);
      if (ndx >= 0) {
        const subBody = body.slice(ndx + functionStart.length);
        const functionBody = `var ${functionStart}${utils.cutAfterJS(subBody)};${functionName}(ncode);`;
        functions.push(functionBody);
      }
    }
  };
  extractDecipher();
  extractNCode();
  return functions;
};

/**
 * Apply decipher and n-transform to individual format
 *
 * @param {Object} format
 * @param {vm.Script} decipherScript
 * @param {vm.Script} nTransformScript
 */
exports.setDownloadURL = (format, decipherScript, nTransformScript) => {
  const decipher = url => {
    const args = querystring.parse(url);
    if (!args.s || !decipherScript) return args.url;
    const components = new URL(decodeURIComponent(args.url));
    components.searchParams.set(args.sp ? args.sp : 'signature',
      decipherScript.runInNewContext({ sig: decodeURIComponent(args.s) }));
    return components.toString();
  };
  const ncode = url => {
    const components = new URL(decodeURIComponent(url));
    const n = components.searchParams.get('n');
    if (!n || !nTransformScript) return url;
    components.searchParams.set('n', nTransformScript.runInNewContext({ ncode: n }));
    return components.toString();
  };
  const cipher = !format.url;
  const url = format.url || format.signatureCipher || format.cipher;
  format.url = cipher ? ncode(decipher(url)) : ncode(url);
  delete format.signatureCipher;
  delete format.cipher;
};

/**
 * Applies decipher and n parameter transforms to all format URL's.
 *
 * @param {Array.<Object>} formats
 * @param {string} html5player
 * @param {Object} options
 */
exports.decipherFormats = async(formats, html5player, options) => {
  let decipheredFormats = {};
  let functions = await exports.getFunctions(html5player, options);
  const decipherScript = functions.length ? new vm.Script(functions[0]) : null;
  const nTransformScript = functions.length > 1 ? new vm.Script(functions[1]) : null;
  formats.forEach(format => {
    exports.setDownloadURL(format, decipherScript, nTransformScript);
    decipheredFormats[format.url] = format;
  });
  return decipheredFormats;
};


/***/ }),
/* 143 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { setTimeout } = __webpack_require__(132);

// A cache that expires.
module.exports = class Cache extends Map {
  constructor(timeout = 1000) {
    super();
    this.timeout = timeout;
  }
  set(key, value) {
    if (this.has(key)) {
      clearTimeout(super.get(key).tid);
    }
    super.set(key, {
      tid: setTimeout(this.delete.bind(this, key), this.timeout).unref(),
      value,
    });
  }
  get(key) {
    let entry = super.get(key);
    if (entry) {
      return entry.value;
    }
    return null;
  }
  getOrSet(key, fn) {
    if (this.has(key)) {
      return this.get(key);
    } else {
      let value = fn();
      this.set(key, value);
      (async() => {
        try {
          await value;
        } catch (err) {
          this.delete(key);
        }
      })();
      return value;
    }
  }
  delete(key) {
    let entry = super.get(key);
    if (entry) {
      clearTimeout(entry.tid);
      super.delete(key);
    }
  }
  clear() {
    for (let entry of this.values()) {
      clearTimeout(entry.tid);
    }
    super.clear();
  }
};


/***/ }),
/* 144 */
/***/ ((module) => {

"use strict";
module.exports = require("vm");

/***/ }),
/* 145 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlaylistManager = void 0;
const vscode = __importStar(__webpack_require__(1));
const Constants_1 = __webpack_require__(110);
const PlaylistStorage_1 = __webpack_require__(146);
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
        // Safe extraction - first track's source is guaranteed since tracks.length > 0
        const firstSource = tracks[0].source;
        return firstSource;
    }
    dispose() {
        this.playlistChangeEmitter.dispose();
    }
}
exports.PlaylistManager = PlaylistManager;


/***/ }),
/* 146 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlaylistStorage = void 0;
const vscode = __importStar(__webpack_require__(1));
const fs = __importStar(__webpack_require__(5));
const path = __importStar(__webpack_require__(4));
const Constants_1 = __webpack_require__(110);
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
        return (__webpack_require__(35).homedir)();
    }
}
exports.PlaylistStorage = PlaylistStorage;


/***/ }),
/* 147 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VibeEngine = void 0;
const MemoryManager_1 = __webpack_require__(111);
/**
 * Smart recommendation engine that suggests similar tracks
 * based on the currently playing track's attributes.
 * Uses genre, artist, and title keywords to find related music.
 */
class VibeEngine {
    constructor(youtubePlayer) {
        this.vibeHistory = new Set();
        this.youtubePlayer = youtubePlayer;
        this.cache = MemoryManager_1.MemoryManager.getInstance();
    }
    /**
     * Get recommended tracks based on the current track
     */
    async getRecommendations(currentTrack, count = 5) {
        const cacheKey = `vibe:${currentTrack.id}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return this.filterVibeHistory(cached);
        }
        const queries = this.buildSearchQueries(currentTrack);
        const allResults = [];
        for (const query of queries) {
            if (allResults.length >= count * 2) {
                break;
            }
            const results = await this.youtubePlayer.search(query, 10);
            const tracks = results.map(r => ({
                id: `yt_${r.id}`,
                title: r.title,
                artist: r.artist,
                duration: r.duration,
                source: 'youtube',
                uri: r.uri,
                thumbnailUri: r.thumbnailUri,
                addedAt: Date.now()
            }));
            allResults.push(...tracks);
        }
        // Remove duplicates and current track
        const uniqueResults = this.deduplicateTracks(allResults)
            .filter(t => t.id !== currentTrack.id);
        this.cache.set(cacheKey, uniqueResults, 1800); // 30 min cache
        return this.filterVibeHistory(uniqueResults).slice(0, count);
    }
    /**
     * Mark a track as played in vibe mode (avoid repeats)
     */
    markAsPlayed(trackId) {
        this.vibeHistory.add(trackId);
        // Limit history size
        if (this.vibeHistory.size > 200) {
            const entries = Array.from(this.vibeHistory);
            this.vibeHistory = new Set(entries.slice(-100));
        }
    }
    /**
     * Reset vibe history
     */
    resetHistory() {
        this.vibeHistory.clear();
    }
    /**
     * Build varied search queries for better recommendations
     */
    buildSearchQueries(track) {
        const queries = [];
        // Direct artist search
        if (track.artist && track.artist !== 'Unknown Artist') {
            queries.push(`${track.artist} best songs`);
            queries.push(`${track.artist} similar artists music`);
        }
        // Genre-based search
        if (track.genre) {
            queries.push(`${track.genre} music mix`);
            queries.push(`best ${track.genre} songs`);
        }
        // Title keyword search
        const keywords = this.extractKeywords(track.title);
        if (keywords.length > 0) {
            queries.push(`${keywords.join(' ')} similar songs`);
        }
        // Vibe-based search
        queries.push(`songs like ${track.title} ${track.artist}`);
        queries.push(`music similar to ${track.artist}`);
        return queries.slice(0, 3); // Limit to 3 queries to save API calls
    }
    /**
     * Extract meaningful keywords from a track title
     */
    extractKeywords(title) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
            'for', 'of', 'with', 'by', 'is', 'it', 'this', 'that', 'ft',
            'feat', 'featuring', 'remix', 'version', 'edit', 'mix', 'official'
        ]);
        return title
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word))
            .slice(0, 3);
    }
    /**
     * Remove duplicate tracks
     */
    deduplicateTracks(tracks) {
        const seen = new Set();
        return tracks.filter(track => {
            if (seen.has(track.id)) {
                return false;
            }
            seen.add(track.id);
            return true;
        });
    }
    /**
     * Filter out tracks that have already been played in vibe mode
     */
    filterVibeHistory(tracks) {
        return tracks.filter(t => !this.vibeHistory.has(t.id));
    }
}
exports.VibeEngine = VibeEngine;


/***/ }),
/* 148 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerWebview = void 0;
const vscode = __importStar(__webpack_require__(1));
const path = __importStar(__webpack_require__(4));
/**
 * Main webview panel that hosts the SonicFlow player UI.
 * Handles bidirectional communication between the extension
 * and the webview.
 */
class PlayerWebview {
    constructor(panel, extensionUri, playerManager, playlistManager, vibeEngine) {
        this.disposables = [];
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
    static createOrShow(extensionUri, playerManager, playlistManager, vibeEngine) {
        const column = vscode.ViewColumn.Beside;
        if (PlayerWebview.instance) {
            PlayerWebview.instance.panel.reveal(column);
            return PlayerWebview.instance;
        }
        const panel = vscode.window.createWebviewPanel(PlayerWebview.viewType, '🎵 SonicFlow', { viewColumn: column, preserveFocus: true }, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'dist'),
                vscode.Uri.joinPath(extensionUri, 'media'),
                // Allow access to the entire filesystem for local music files
                vscode.Uri.file('/')
            ]
        });
        PlayerWebview.instance = new PlayerWebview(panel, extensionUri, playerManager, playlistManager, vibeEngine);
        return PlayerWebview.instance;
    }
    /**
     * Get the current instance (if exists)
     */
    static getInstance() {
        return PlayerWebview.instance;
    }
    /**
     * Send a message to the webview
     */
    postMessage(message) {
        if (this.panel.visible) {
            this.panel.webview.postMessage(message);
        }
    }
    /**
     * Load and play a track
     */
    async loadTrack(track) {
        const streamUrl = await this.playerManager.getStreamUrl(track, this.panel.webview);
        this.postMessage({
            type: 'loadTrack',
            track: track,
            streamUrl: streamUrl
        });
        await this.playerManager.play(track);
    }
    setupPanel() {
        this.panel.webview.html = this.getHtmlContent();
        this.panel.iconPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'icons', 'sonicflow.svg');
        this.panel.onDidDispose(() => {
            PlayerWebview.instance = undefined;
            this.dispose();
        }, null, this.disposables);
    }
    setupMessageHandler() {
        this.panel.webview.onDidReceiveMessage(async (message) => {
            try {
                await this.handleMessage(message);
            }
            catch (error) {
                console.error('[SonicFlow] Message handler error:', error);
            }
        }, null, this.disposables);
    }
    async handleMessage(message) {
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
                vscode.workspace.getConfiguration('sonicflow').update('theme', message.theme.replace('theme-', ''), vscode.ConfigurationTarget.Global);
                break;
            case 'audioError':
                console.error('[SonicFlow] Audio playback error:', message.error);
                vscode.window.showErrorMessage(`Playback error: ${message.error || 'Unknown error'}`);
                break;
        }
    }
    async handleBrowseLocal() {
        const localPlayer = this.playerManager.getLocalPlayer();
        const choice = await vscode.window.showQuickPick([
            { label: '$(file) Select Files', description: 'Choose individual music files', id: 'files' },
            { label: '$(folder) Select Folder', description: 'Scan a folder for music', id: 'folder' }
        ], { title: 'Browse Local Music' });
        if (!choice) {
            return;
        }
        let tracks;
        if (choice.id === 'files') {
            tracks = await localPlayer.browseFiles();
        }
        else {
            tracks = await localPlayer.browseFolder();
        }
        if (tracks.length === 0) {
            return;
        }
        // Ask what to do with the tracks
        const action = await vscode.window.showQuickPick([
            { label: '$(play) Play Now', description: 'Replace queue and play', id: 'play' },
            { label: '$(add) Add to Queue', description: 'Add to current queue', id: 'queue' },
            { label: '$(list-unordered) Add to Playlist', description: 'Save to a playlist', id: 'playlist' }
        ], { title: `${tracks.length} track(s) found` });
        if (!action) {
            return;
        }
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
    async handleYouTubeSearch() {
        const ytPlayer = this.playerManager.getYouTubePlayer();
        const track = await ytPlayer.interactiveSearch();
        if (!track) {
            return;
        }
        const action = await vscode.window.showQuickPick([
            { label: '$(play) Play Now', id: 'play' },
            { label: '$(add) Add to Queue', id: 'queue' },
            { label: '$(list-unordered) Add to Playlist', id: 'playlist' }
        ], { title: `Selected: ${track.title}` });
        if (!action) {
            return;
        }
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
    async handleShowPlaylist() {
        const playlist = await this.playlistManager.pickPlaylist();
        if (!playlist || playlist.tracks.length === 0) {
            return;
        }
        const action = await vscode.window.showQuickPick([
            { label: '$(play) Play Playlist', id: 'play' },
            { label: '$(add) Add to Queue', id: 'queue' }
        ], { title: `Playlist: ${playlist.name} (${playlist.tracks.length} tracks)` });
        if (!action) {
            return;
        }
        if (action.id === 'play') {
            this.playerManager.clearQueue();
            await this.playerManager.addTracksToQueue(playlist.tracks, true);
            await this.loadCurrentTrack();
        }
        else {
            await this.playerManager.addTracksToQueue(playlist.tracks, false);
        }
        this.syncQueue();
    }
    async handlePlayFromQueue(index) {
        const state = this.playerManager.getState();
        if (index >= 0 && index < state.queue.length) {
            const track = state.queue[index];
            this.playerManager.getState().queueIndex = index;
            await this.playerManager.play(track);
            await this.loadTrack(track);
            this.syncQueue();
        }
    }
    async loadCurrentTrack() {
        const state = this.playerManager.getState();
        if (state.currentTrack) {
            await this.loadTrack(state.currentTrack);
        }
    }
    setupStateSync() {
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
    syncQueue() {
        const state = this.playerManager.getState();
        this.postMessage({
            type: 'updateQueue',
            queue: state.queue,
            queueIndex: state.queueIndex
        });
    }
    getHtmlContent() {
        const webview = this.panel.webview;
        const distPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'player.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'player.js'));
        const nonce = this.getNonce();
        const cspSource = webview.cspSource;
        // Read HTML template and replace placeholders
        const htmlPath = path.join(this.extensionUri.fsPath, 'dist', 'webview', 'player.html');
        let html;
        try {
            html = (__webpack_require__(5).readFileSync)(htmlPath, 'utf-8');
        }
        catch {
            // Fallback: construct HTML directly
            html = this.getInlineHtml();
        }
        return html
            .replace(/\$\{cspSource\}/g, cspSource)
            .replace(/\$\{nonce\}/g, nonce)
            .replace(/\$\{styleUri\}/g, styleUri.toString())
            .replace(/\$\{scriptUri\}/g, scriptUri.toString());
    }
    getInlineHtml() {
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
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    dispose() {
        PlayerWebview.instance = undefined;
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.PlayerWebview = PlayerWebview;
PlayerWebview.viewType = 'sonicflow.player';


/***/ }),
/* 149 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StatusBarController = void 0;
const vscode = __importStar(__webpack_require__(1));
const Constants_1 = __webpack_require__(110);
/**
 * Status bar music controller - always visible at the bottom of VS Code.
 * Shows current track info and provides quick controls.
 */
class StatusBarController {
    constructor() {
        // Create status bar items (right to left ordering with priority)
        const basePriority = Constants_1.CONSTANTS.STATUSBAR_PRIORITY;
        this.vibeIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority + 5);
        this.vibeIndicator.command = 'sonicflow.toggleVibeMode';
        this.vibeIndicator.tooltip = 'Toggle Vibe Mode';
        this.volumeIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority + 4);
        this.volumeIndicator.command = 'sonicflow.setVolume';
        this.nextButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority + 3);
        this.nextButton.text = '$(chevron-right)';
        this.nextButton.command = 'sonicflow.next';
        this.nextButton.tooltip = 'Next Track';
        this.playPauseButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority + 2);
        this.playPauseButton.command = 'sonicflow.playPause';
        this.prevButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority + 1);
        this.prevButton.text = '$(chevron-left)';
        this.prevButton.command = 'sonicflow.previous';
        this.prevButton.tooltip = 'Previous Track';
        this.trackInfo = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority);
        this.trackInfo.command = 'sonicflow.openPlayer';
        this.trackInfo.tooltip = 'Open SonicFlow Player';
        this.showInitialState();
    }
    /**
     * Update the status bar based on current player state
     */
    update(state) {
        if (state.currentTrack) {
            this.updateTrackInfo(state.currentTrack, state.position);
            this.updatePlayPauseButton(state.isPlaying);
            this.updateVibeIndicator(state.vibeMode);
            this.updateVolumeIndicator(state.volume);
            this.showAllItems();
        }
        else {
            this.showInitialState();
        }
    }
    updateTrackInfo(track, position) {
        const title = this.truncateText(track.title, Constants_1.CONSTANTS.TRACK_TITLE_MAX_LENGTH);
        const sourceIcon = track.source === 'youtube' ? '$(globe)' : '$(file-media)';
        const timeStr = this.formatTime(position);
        this.trackInfo.text = `${sourceIcon} ${title} - ${track.artist} [${timeStr}]`;
        this.trackInfo.tooltip = `${track.title}\nby ${track.artist}\n\nClick to open player`;
    }
    updatePlayPauseButton(isPlaying) {
        this.playPauseButton.text = isPlaying ? '$(debug-pause)' : '$(play)';
        this.playPauseButton.tooltip = isPlaying ? 'Pause' : 'Play';
    }
    updateVibeIndicator(vibeMode) {
        this.vibeIndicator.text = vibeMode ? '$(pulse) Vibe' : '$(pulse)';
        this.vibeIndicator.color = vibeMode ? '#00E5A0' : undefined;
        this.vibeIndicator.tooltip = vibeMode ? 'Vibe Mode: ON' : 'Vibe Mode: OFF';
    }
    updateVolumeIndicator(volume) {
        let icon = '$(unmute)';
        if (volume === 0) {
            icon = '$(mute)';
        }
        else if (volume < 50) {
            icon = '$(unmute)';
        }
        this.volumeIndicator.text = `${icon} ${volume}%`;
        this.volumeIndicator.tooltip = `Volume: ${volume}%\nClick to adjust`;
    }
    showInitialState() {
        this.trackInfo.text = '$(music) SonicFlow';
        this.trackInfo.tooltip = 'Click to open SonicFlow player';
        this.trackInfo.show();
        this.playPauseButton.text = '$(play)';
        this.playPauseButton.tooltip = 'Play';
        this.playPauseButton.show();
        // Hide other items until music is playing
        this.prevButton.hide();
        this.nextButton.hide();
        this.vibeIndicator.hide();
        this.volumeIndicator.hide();
    }
    showAllItems() {
        this.trackInfo.show();
        this.playPauseButton.show();
        this.prevButton.show();
        this.nextButton.show();
        this.vibeIndicator.show();
        this.volumeIndicator.show();
    }
    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 1) + '…';
    }
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    dispose() {
        this.playPauseButton.dispose();
        this.trackInfo.dispose();
        this.prevButton.dispose();
        this.nextButton.dispose();
        this.vibeIndicator.dispose();
        this.volumeIndicator.dispose();
    }
}
exports.StatusBarController = StatusBarController;


/***/ }),
/* 150 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ServiceRegistry = void 0;
const vscode = __importStar(__webpack_require__(1));
class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.serviceChangeEmitter = new vscode.EventEmitter();
        this.onServiceChange = this.serviceChangeEmitter.event;
    }
    /**
     * Register a new music service
     */
    register(service) {
        this.services.set(service.id, service);
        this.serviceChangeEmitter.fire(this.getActiveServiceIds());
        console.log(`[SonicFlow] Service registered: ${service.name}`);
    }
    /**
     * Unregister a music service
     */
    unregister(serviceId) {
        const service = this.services.get(serviceId);
        if (service) {
            service.dispose();
            this.services.delete(serviceId);
            this.serviceChangeEmitter.fire(this.getActiveServiceIds());
        }
    }
    /**
     * Get a specific service
     */
    get(serviceId) {
        return this.services.get(serviceId);
    }
    /**
     * Get all registered services
     */
    getAll() {
        return Array.from(this.services.values());
    }
    /**
     * Get active service IDs
     */
    getActiveServiceIds() {
        return Array.from(this.services.keys());
    }
    /**
     * Search across all enabled services
     */
    async searchAll(query) {
        const results = new Map();
        for (const [id, service] of this.services) {
            if (service.isEnabled) {
                try {
                    const serviceResults = await service.search(query);
                    results.set(id, serviceResults);
                }
                catch (error) {
                    console.error(`[SonicFlow] Search failed for service ${id}:`, error);
                }
            }
        }
        return results;
    }
    dispose() {
        for (const service of this.services.values()) {
            service.dispose();
        }
        this.services.clear();
        this.serviceChangeEmitter.dispose();
    }
}
exports.ServiceRegistry = ServiceRegistry;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map