import * as vscode from 'vscode';
import { LocalPlayer } from './LocalPlayer';
import { YouTubePlayer } from './YouTubePlayer';
import { Track, PlayerState } from '../utils/Constants';
/**
 * Central player manager that coordinates between different
 * music sources and maintains the unified player state.
 */
export declare class PlayerManager {
    private localPlayer;
    private youtubePlayer;
    private state;
    private stateChangeEmitter;
    readonly onStateChange: vscode.Event<PlayerState>;
    constructor();
    getState(): PlayerState;
    getLocalPlayer(): LocalPlayer;
    getYouTubePlayer(): YouTubePlayer;
    /**
     * Play a specific track
     */
    play(track: Track): Promise<void>;
    /**
     * Add track to queue and optionally play it
     */
    addToQueue(track: Track, playNow?: boolean): Promise<void>;
    /**
     * Add multiple tracks to queue
     */
    addTracksToQueue(tracks: Track[], playFirst?: boolean): Promise<void>;
    /**
     * Toggle play/pause
     */
    togglePlayPause(): void;
    /**
     * Play next track in queue
     */
    next(): Promise<void>;
    /**
     * Play previous track in queue
     */
    previous(): Promise<void>;
    /**
     * Set volume (0-100)
     */
    setVolume(volume: number): void;
    /**
     * Seek to position in seconds
     */
    seek(position: number): void;
    /**
     * Update playback position (called from webview)
     */
    updatePosition(position: number): void;
    /**
     * Toggle shuffle mode
     */
    toggleShuffle(): void;
    /**
     * Toggle repeat mode: none -> all -> one -> none
     */
    toggleRepeat(): void;
    /**
     * Toggle vibe mode (auto-recommendations)
     */
    toggleVibeMode(): void;
    /**
     * Clear the queue
     */
    clearQueue(): void;
    /**
     * Remove a track from the queue
     */
    removeFromQueue(index: number): void;
    /**
     * Handle track ended event
     */
    onTrackEnded(): Promise<void>;
    /**
     * Get the stream URL for current track
     */
    getStreamUrl(track: Track, webview?: vscode.Webview): Promise<string | null>;
    private getDefaultState;
    private emitStateChange;
    dispose(): void;
}
//# sourceMappingURL=PlayerManager.d.ts.map