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
exports.YouTubePlayer = void 0;
const vscode = __importStar(require("vscode"));
const Constants_1 = require("../utils/Constants");
const MemoryManager_1 = require("../utils/MemoryManager");
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
            const ytsr = require('ytsr');
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
            const ytdl = require('ytdl-core');
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
//# sourceMappingURL=YouTubePlayer.js.map