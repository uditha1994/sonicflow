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

export class ServiceRegistry {
    private services: Map<string, MusicService> = new Map();
    private serviceChangeEmitter = new vscode.EventEmitter<string[]>();

    readonly onServiceChange = this.serviceChangeEmitter.event;

    /**
     * Register a new music service
     */
    register(service: MusicService): void {
        this.services.set(service.id, service);
        this.serviceChangeEmitter.fire(this.getActiveServiceIds());
        console.log(`[SonicFlow] Service registered: ${service.name}`);
    }

    /**
     * Unregister a music service
     */
    unregister(serviceId: string): void {
        const service = this.services.get(serviceId);
        if (service) {
            service.dispose();
            this.services.delete(serviceId);
            this.serviceChangeEmitter.fire(this.getActiveServiceIds());
        }
    }

    /**
     * Get a specific service
     */
    get(serviceId: string): MusicService | undefined {
        return this.services.get(serviceId);
    }

    /**
     * Get all registered services
     */
    getAll(): MusicService[] {
        return Array.from(this.services.values());
    }

    /**
     * Get active service IDs
     */
    getActiveServiceIds(): string[] {
        return Array.from(this.services.keys());
    }

    /**
     * Search across all enabled services
     */
    async searchAll(query: string): Promise<Map<string, any[]>> {
        const results = new Map<string, any[]>();

        for (const [id, service] of this.services) {
            if (service.isEnabled) {
                try {
                    const serviceResults = await service.search(query);
                    results.set(id, serviceResults);
                } catch (error) {
                    console.error(`[SonicFlow] Search failed for service ${id}:`, error);
                }
            }
        }

        return results;
    }

    dispose(): void {
        for (const service of this.services.values()) {
            service.dispose();
        }
        this.services.clear();
        this.serviceChangeEmitter.dispose();
    }
}