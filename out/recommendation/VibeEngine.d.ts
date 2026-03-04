import { Track } from '../utils/Constants';
import { YouTubePlayer } from '../players/YouTubePlayer';
/**
 * Smart recommendation engine that suggests similar tracks
 * based on the currently playing track's attributes.
 * Uses genre, artist, and title keywords to find related music.
 */
export declare class VibeEngine {
    private youtubePlayer;
    private cache;
    private vibeHistory;
    constructor(youtubePlayer: YouTubePlayer);
    /**
     * Get recommended tracks based on the current track
     */
    getRecommendations(currentTrack: Track, count?: number): Promise<Track[]>;
    /**
     * Mark a track as played in vibe mode (avoid repeats)
     */
    markAsPlayed(trackId: string): void;
    /**
     * Reset vibe history
     */
    resetHistory(): void;
    /**
     * Build varied search queries for better recommendations
     */
    private buildSearchQueries;
    /**
     * Extract meaningful keywords from a track title
     */
    private extractKeywords;
    /**
     * Remove duplicate tracks
     */
    private deduplicateTracks;
    /**
     * Filter out tracks that have already been played in vibe mode
     */
    private filterVibeHistory;
}
//# sourceMappingURL=VibeEngine.d.ts.map