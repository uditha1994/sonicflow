import { Track } from '../utils/Constants';
import { YouTubePlayer } from '../players/YouTubePlayer';
import { MemoryManager } from '../utils/MemoryManager';

/**
 * Smart recommendation engine that suggests similar tracks
 * based on the currently playing track's attributes.
 * Uses genre, artist, and title keywords to find related music.
 */
export class VibeEngine {
  private youtubePlayer: YouTubePlayer;
  private cache: MemoryManager;
  private vibeHistory: Set<string> = new Set();

  constructor(youtubePlayer: YouTubePlayer) {
    this.youtubePlayer = youtubePlayer;
    this.cache = MemoryManager.getInstance();
  }

  /**
   * Get recommended tracks based on the current track
   */
  async getRecommendations(currentTrack: Track, count: number = 5): Promise<Track[]> {
    const cacheKey = `vibe:${currentTrack.id}`;
    const cached = this.cache.get<Track[]>(cacheKey);
    if (cached) {
      return this.filterVibeHistory(cached);
    }

    const queries = this.buildSearchQueries(currentTrack);
    const allResults: Track[] = [];

    for (const query of queries) {
      if (allResults.length >= count * 2) { break; }
      
      const results = await this.youtubePlayer.search(query, 10);
      const tracks = results.map(r => ({
        id: `yt_${r.id}`,
        title: r.title,
        artist: r.artist,
        duration: r.duration,
        source: 'youtube' as const,
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
  markAsPlayed(trackId: string): void {
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
  resetHistory(): void {
    this.vibeHistory.clear();
  }

  /**
   * Build varied search queries for better recommendations
   */
  private buildSearchQueries(track: Track): string[] {
    const queries: string[] = [];

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
  private extractKeywords(title: string): string[] {
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
  private deduplicateTracks(tracks: Track[]): Track[] {
    const seen = new Set<string>();
    return tracks.filter(track => {
      if (seen.has(track.id)) { return false; }
      seen.add(track.id);
      return true;
    });
  }

  /**
   * Filter out tracks that have already been played in vibe mode
   */
  private filterVibeHistory(tracks: Track[]): Track[] {
    return tracks.filter(t => !this.vibeHistory.has(t.id));
  }
}