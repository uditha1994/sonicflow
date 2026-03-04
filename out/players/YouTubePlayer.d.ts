import { Track, SearchResult } from '../utils/Constants';
/**
 * YouTube music search and playback handler.
 * Uses ytsr for search and ytdl-core for stream URL extraction.
 */
export declare class YouTubePlayer {
    private cache;
    private searchDebounceTimer;
    constructor();
    /**
     * Search YouTube for music
     */
    search(query: string, maxResults?: number): Promise<SearchResult[]>;
    /**
     * Interactive search with QuickPick UI
     */
    interactiveSearch(): Promise<Track | null>;
    /**
     * Get audio stream URL from a YouTube video
     */
    getStreamUrl(videoUrl: string): Promise<string | null>;
    /**
     * Get track info from a YouTube URL
     */
    getTrackFromUrl(url: string): Promise<Track | null>;
    /**
     * Search for related/similar videos (for Vibe Mode)
     */
    getRelatedTracks(track: Track, count?: number): Promise<Track[]>;
    private searchResultToTrack;
    private isYouTubeUrl;
    private cleanTitle;
    private parseDuration;
    private formatDuration;
    dispose(): void;
}
//# sourceMappingURL=YouTubePlayer.d.ts.map