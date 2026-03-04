export declare const CONSTANTS: {
    readonly EXTENSION_ID: "sonicflow";
    readonly SUPPORTED_FORMATS: readonly [".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".wma", ".opus", ".webm"];
    readonly MAX_CACHE_ENTRIES: 100;
    readonly MAX_QUEUE_SIZE: 500;
    readonly MAX_PLAYLIST_SIZE: 1000;
    readonly CACHE_TTL_SECONDS: 3600;
    readonly YT_MAX_RESULTS: 25;
    readonly YT_SEARCH_DEBOUNCE_MS: 500;
    readonly STATUSBAR_PRIORITY: 100;
    readonly TRACK_TITLE_MAX_LENGTH: 40;
    readonly STORAGE_PLAYLISTS: "sonicflow.playlists";
    readonly STORAGE_LAST_PLAYED: "sonicflow.lastPlayed";
    readonly STORAGE_PLAY_HISTORY: "sonicflow.playHistory";
    readonly STORAGE_SETTINGS: "sonicflow.settings";
    readonly STORAGE_QUEUE: "sonicflow.queue";
    readonly THEMES: {
        readonly aurora: {
            readonly primary: "#00E5A0";
            readonly secondary: "#7B2FBE";
            readonly accent: "#FF6B9D";
            readonly background: "#0A0E1A";
            readonly surface: "#131729";
            readonly surfaceLight: "#1C2137";
            readonly text: "#E8ECF4";
            readonly textMuted: "#6B7394";
            readonly gradient: "linear-gradient(135deg, #00E5A0 0%, #7B2FBE 50%, #FF6B9D 100%)";
            readonly glow: "0 0 20px rgba(0, 229, 160, 0.3)";
        };
        readonly 'neon-midnight': {
            readonly primary: "#FF073A";
            readonly secondary: "#00F0FF";
            readonly accent: "#FFE600";
            readonly background: "#05050F";
            readonly surface: "#0D0D1A";
            readonly surfaceLight: "#161628";
            readonly text: "#F0F0FF";
            readonly textMuted: "#5A5A7A";
            readonly gradient: "linear-gradient(135deg, #FF073A 0%, #00F0FF 100%)";
            readonly glow: "0 0 20px rgba(255, 7, 58, 0.3)";
        };
        readonly 'cyber-sunset': {
            readonly primary: "#FF6A00";
            readonly secondary: "#FF0080";
            readonly accent: "#7928CA";
            readonly background: "#0F0A1A";
            readonly surface: "#1A1228";
            readonly surfaceLight: "#241A35";
            readonly text: "#FFF0E5";
            readonly textMuted: "#8A7A6A";
            readonly gradient: "linear-gradient(135deg, #FF6A00 0%, #FF0080 50%, #7928CA 100%)";
            readonly glow: "0 0 20px rgba(255, 106, 0, 0.3)";
        };
        readonly 'deep-ocean': {
            readonly primary: "#00B4D8";
            readonly secondary: "#0077B6";
            readonly accent: "#90E0EF";
            readonly background: "#03071E";
            readonly surface: "#0A1628";
            readonly surfaceLight: "#122035";
            readonly text: "#CAF0F8";
            readonly textMuted: "#48738A";
            readonly gradient: "linear-gradient(135deg, #90E0EF 0%, #00B4D8 50%, #0077B6 100%)";
            readonly glow: "0 0 20px rgba(0, 180, 216, 0.3)";
        };
    };
};
export interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: number;
    source: 'local' | 'youtube';
    uri: string;
    thumbnailUri?: string;
    genre?: string;
    tags?: string[];
    addedAt: number;
}
export interface Playlist {
    id: string;
    name: string;
    description?: string;
    tracks: Track[];
    createdAt: number;
    updatedAt: number;
    source: 'local' | 'youtube' | 'mixed';
    coverUri?: string;
}
export interface PlayerState {
    currentTrack: Track | null;
    isPlaying: boolean;
    volume: number;
    position: number;
    duration: number;
    shuffle: boolean;
    repeat: 'none' | 'one' | 'all';
    vibeMode: boolean;
    queue: Track[];
    queueIndex: number;
}
export interface SearchResult {
    id: string;
    title: string;
    artist: string;
    duration: number;
    thumbnailUri: string;
    source: 'youtube';
    uri: string;
}
export type ThemeName = keyof typeof CONSTANTS.THEMES;
//# sourceMappingURL=Constants.d.ts.map