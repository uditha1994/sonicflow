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
exports.PlayerManager = void 0;
const vscode = __importStar(require("vscode"));
const LocalPlayer_1 = require("./LocalPlayer");
const YouTubePlayer_1 = require("./YouTubePlayer");
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
//# sourceMappingURL=PlayerManager.js.map