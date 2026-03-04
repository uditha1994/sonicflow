import * as vscode from 'vscode';
import { LocalPlayer } from './LocalPlayer';
import { YouTubePlayer } from './YouTubePlayer';
import { Track, PlayerState } from '../utils/Constants';

/**
 * Central player manager that coordinates between different
 * music sources and maintains the unified player state.
 */
export class PlayerManager {
    private localPlayer: LocalPlayer;
    private youtubePlayer: YouTubePlayer;
    private state: PlayerState;
    private stateChangeEmitter = new vscode.EventEmitter<PlayerState>();

    readonly onStateChange = this.stateChangeEmitter.event;

    constructor() {
        this.localPlayer = new LocalPlayer();
        this.youtubePlayer = new YouTubePlayer();
        this.state = this.getDefaultState();
    }

    getState(): PlayerState {
        return { ...this.state };
    }

    getLocalPlayer(): LocalPlayer {
        return this.localPlayer;
    }

    getYouTubePlayer(): YouTubePlayer {
        return this.youtubePlayer;
    }

    /**
     * Play a specific track
     */
    async play(track: Track): Promise<void> {
        this.state.currentTrack = track;
        this.state.isPlaying = true;
        this.state.position = 0;
        this.state.duration = track.duration;
        this.emitStateChange();
    }

    /**
     * Add track to queue and optionally play it
     */
    async addToQueue(track: Track, playNow: boolean = false): Promise<void> {
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
    async addTracksToQueue(tracks: Track[], playFirst: boolean = false): Promise<void> {
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
    togglePlayPause(): void {
        this.state.isPlaying = !this.state.isPlaying;
        this.emitStateChange();
    }

    /**
     * Play next track in queue
     */
    async next(): Promise<void> {
        if (this.state.queue.length === 0) { return; }

        if (this.state.shuffle) {
            const randomIndex = Math.floor(Math.random() * this.state.queue.length);
            this.state.queueIndex = randomIndex;
        } else {
            this.state.queueIndex++;
            if (this.state.queueIndex >= this.state.queue.length) {
                if (this.state.repeat === 'all') {
                    this.state.queueIndex = 0;
                } else {
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
    async previous(): Promise<void> {
        if (this.state.queue.length === 0) { return; }

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
            } else {
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
    setVolume(volume: number): void {
        this.state.volume = Math.max(0, Math.min(100, volume));
        this.emitStateChange();
    }

    /**
     * Seek to position in seconds
     */
    seek(position: number): void {
        this.state.position = Math.max(0, Math.min(position, this.state.duration));
        this.emitStateChange();
    }

    /**
     * Update playback position (called from webview)
     */
    updatePosition(position: number): void {
        this.state.position = position;
        // Don't emit for position updates to avoid excessive communication
    }

    /**
     * Toggle shuffle mode
     */
    toggleShuffle(): void {
        this.state.shuffle = !this.state.shuffle;
        this.emitStateChange();
    }

    /**
     * Toggle repeat mode: none -> all -> one -> none
     */
    toggleRepeat(): void {
        const modes: ('none' | 'one' | 'all')[] = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(this.state.repeat);
        this.state.repeat = modes[(currentIndex + 1) % modes.length];
        this.emitStateChange();
    }

    /**
     * Toggle vibe mode (auto-recommendations)
     */
    toggleVibeMode(): void {
        this.state.vibeMode = !this.state.vibeMode;
        this.emitStateChange();
    }

    /**
     * Clear the queue
     */
    clearQueue(): void {
        this.state.queue = [];
        this.state.queueIndex = -1;
        this.emitStateChange();
    }

    /**
     * Remove a track from the queue
     */
    removeFromQueue(index: number): void {
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
    async onTrackEnded(): Promise<void> {
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
            const relatedTracks = await this.youtubePlayer.getRelatedTracks(
                this.state.currentTrack, 5
            );
            if (relatedTracks.length > 0) {
                this.state.queue.push(...relatedTracks);
            }
        }

        await this.next();
    }

    /**
     * Get the stream URL for current track
     */
    async getStreamUrl(track: Track, webview?: vscode.Webview): Promise<string | null> {
        if (track.source === 'local' && webview) {
            return this.localPlayer.getPlaybackUri(track, webview).toString();
        } else if (track.source === 'youtube') {
            return this.youtubePlayer.getStreamUrl(track.uri);
        }
        return null;
    }

    private getDefaultState(): PlayerState {
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

    private emitStateChange(): void {
        this.stateChangeEmitter.fire(this.getState());
    }

    dispose(): void {
        this.youtubePlayer.dispose();
        this.stateChangeEmitter.dispose();
    }
}