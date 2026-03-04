export const CONSTANTS = {
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
} as const;

export interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: number;          // seconds
    source: 'local' | 'youtube';
    uri: string;               // file path or YouTube URL
    thumbnailUri?: string;
    genre?: string;
    tags?: string[];
    addedAt: number;           // timestamp
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
    position: number;          // current position in seconds
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