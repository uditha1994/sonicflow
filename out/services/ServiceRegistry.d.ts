import * as vscode from 'vscode';
/**
 * Extensible service registry for future music service integrations.
 * Currently supports: Local, YouTube
 * Planned: Spotify, SoundCloud, Apple Music, etc.
 */
export interface MusicService {
    name: string;
    id: string;
    icon: string;
    isEnabled: boolean;
    initialize(): Promise<void>;
    search(query: string): Promise<any[]>;
    getStreamUrl(trackId: string): Promise<string | null>;
    dispose(): void;
}
export declare class ServiceRegistry {
    private services;
    private serviceChangeEmitter;
    readonly onServiceChange: vscode.Event<string[]>;
    /**
     * Register a new music service
     */
    register(service: MusicService): void;
    /**
     * Unregister a music service
     */
    unregister(serviceId: string): void;
    /**
     * Get a specific service
     */
    get(serviceId: string): MusicService | undefined;
    /**
     * Get all registered services
     */
    getAll(): MusicService[];
    /**
     * Get active service IDs
     */
    getActiveServiceIds(): string[];
    /**
     * Search across all enabled services
     */
    searchAll(query: string): Promise<Map<string, any[]>>;
    dispose(): void;
}
//# sourceMappingURL=ServiceRegistry.d.ts.map