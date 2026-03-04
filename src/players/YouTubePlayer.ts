import * as vscode from 'vscode';
import { Track, SearchResult, CONSTANTS } from '../utils/Constants';
import { MemoryManager } from '../utils/MemoryManager';

/**
 * YouTube music search and playback handler.
 * Uses ytsr for search and ytdl-core for stream URL extraction.
 */
export class YouTubePlayer {
    private cache: MemoryManager;
    private searchDebounceTimer: NodeJS.Timeout | null = null;

    constructor() {
        this.cache = MemoryManager.getInstance();
    }

    /**
     * Search YouTube for music
     */
    async search(query: string, maxResults: number = CONSTANTS.YT_MAX_RESULTS): Promise<SearchResult[]> {
        const cacheKey = `ytsearch:${query}:${maxResults}`;
        const cached = this.cache.get<SearchResult[]>(cacheKey);
        if (cached) { return cached; }

        try {
            const ytsr = require('ytsr');

            const filters = await ytsr.getFilters(query);
            const videoFilter = filters.get('Type')?.get('Video');

            const searchResults = await ytsr(videoFilter?.url || query, {
                limit: maxResults,
                pages: 1
            });

            const results: SearchResult[] = searchResults.items
                .filter((item: any) => item.type === 'video')
                .map((item: any) => ({
                    id: item.id,
                    title: this.cleanTitle(item.title),
                    artist: item.author?.name || 'Unknown',
                    duration: this.parseDuration(item.duration),
                    thumbnailUri: item.bestThumbnail?.url || '',
                    source: 'youtube' as const,
                    uri: item.url
                }));

            // Cache results
            this.cache.set(cacheKey, results, 1800); // 30 min TTL
            return results;
        } catch (error) {
            console.error('[SonicFlow] YouTube search error:', error);
            vscode.window.showErrorMessage('YouTube search failed. Check your internet connection.');
            return [];
        }
    }

    /**
     * Interactive search with QuickPick UI
     */
    async interactiveSearch(): Promise<Track | null> {
        const query = await vscode.window.showInputBox({
            prompt: '🔍 Search YouTube Music',
            placeHolder: 'Enter song name, artist, or paste YouTube URL...',
            title: 'SonicFlow - YouTube Search'
        });

        if (!query) { return null; }

        // Check if it's a direct YouTube URL
        if (this.isYouTubeUrl(query)) {
            return this.getTrackFromUrl(query);
        }

        const results = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'SonicFlow: Searching YouTube...',
                cancellable: true
            },
            async (_progress, token) => {
                if (token.isCancellationRequested) { return []; }
                return this.search(query);
            }
        );

        if (results.length === 0) {
            vscode.window.showInformationMessage('No results found.');
            return null;
        }

        const items: vscode.QuickPickItem[] = results.map(r => ({
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

        if (!selected) { return null; }

        const selectedIndex = items.indexOf(selected);
        const result = results[selectedIndex];

        return this.searchResultToTrack(result);
    }

    /**
     * Get audio stream URL from a YouTube video
     */
    async getStreamUrl(videoUrl: string): Promise<string | null> {
        const cacheKey = `ytstream:${videoUrl}`;
        const cached = this.cache.get<string>(cacheKey);
        if (cached) { return cached; }

        try {
            const ytdl = require('ytdl-core');
            const info = await ytdl.getInfo(videoUrl);

            // Get best audio-only format
            const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

            if (audioFormats.length === 0) {
                console.error('[SonicFlow] No audio formats available');
                return null;
            }

            // Sort by quality and pick the best one
            const bestFormat = audioFormats.sort((a: any, b: any) =>
                (b.audioBitrate || 0) - (a.audioBitrate || 0)
            )[0];

            const streamUrl = bestFormat.url;

            // Cache with shorter TTL since YouTube URLs expire
            this.cache.set(cacheKey, streamUrl, 3600); // 1 hour
            return streamUrl;
        } catch (error) {
            console.error('[SonicFlow] Stream URL extraction error:', error);
            return null;
        }
    }

    /**
     * Get track info from a YouTube URL
     */
    async getTrackFromUrl(url: string): Promise<Track | null> {
        try {
            const ytdl = require('ytdl-core');
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
        } catch (error) {
            console.error('[SonicFlow] Failed to get video info:', error);
            return null;
        }
    }

    /**
     * Search for related/similar videos (for Vibe Mode)
     */
    async getRelatedTracks(track: Track, count: number = 10): Promise<Track[]> {
        try {
            const searchQuery = `${track.artist} ${track.genre || ''} similar music`;
            const results = await this.search(searchQuery, count);
            return results
                .filter(r => r.id !== track.id)
                .map(r => this.searchResultToTrack(r));
        } catch (error) {
            console.error('[SonicFlow] Related tracks error:', error);
            return [];
        }
    }

    private searchResultToTrack(result: SearchResult): Track {
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

    private isYouTubeUrl(text: string): boolean {
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(text);
    }

    private cleanTitle(title: string): string {
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

    private parseDuration(durationStr: string | null): number {
        if (!durationStr) { return 0; }
        const parts = durationStr.split(':').reverse();
        let seconds = 0;
        for (let i = 0; i < parts.length; i++) {
            seconds += parseInt(parts[i]) * Math.pow(60, i);
        }
        return seconds;
    }

    private formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    dispose(): void {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
    }
}