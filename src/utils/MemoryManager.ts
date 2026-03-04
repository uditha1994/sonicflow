import NodeCache from 'node-cache';
import { CONSTANTS } from './Constants';

/**
 * Memory-efficient cache manager using LRU strategy.
 * Prevents excessive memory usage by limiting cache entries
 * and implementing automatic expiration.
 */
export class MemoryManager {
    private static instance: MemoryManager;
    private cache: NodeCache;
    private memoryUsageLog: number[] = [];
    private readonly MAX_LOG_ENTRIES = 50;

    private constructor() {
        this.cache = new NodeCache({
            stdTTL: CONSTANTS.CACHE_TTL_SECONDS,
            maxKeys: CONSTANTS.MAX_CACHE_ENTRIES,
            checkperiod: 120,         // Check for expired keys every 2 minutes
            useClones: false,         // Don't clone objects - saves memory
            deleteOnExpire: true
        });

        // Monitor cache events
        this.cache.on('del', (_key, _value) => {
            this.logMemoryUsage();
        });
    }

    static getInstance(): MemoryManager {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }

    set<T>(key: string, value: T, ttl?: number): boolean {
        try {
            // Check if we're approaching memory limit
            if (this.cache.keys().length >= CONSTANTS.MAX_CACHE_ENTRIES) {
                this.evictOldest();
            }
            return this.cache.set(key, value, ttl ?? CONSTANTS.CACHE_TTL_SECONDS);
        } catch (error) {
            console.error(`[SonicFlow] Cache set error for key ${key}:`, error);
            return false;
        }
    }

    get<T>(key: string): T | undefined {
        return this.cache.get<T>(key);
    }

    has(key: string): boolean {
        return this.cache.has(key);
    }

    delete(key: string): number {
        return this.cache.del(key);
    }

    clear(): void {
        this.cache.flushAll();
        this.memoryUsageLog = [];
    }

    getStats(): { keys: number; hits: number; misses: number; memoryEstimate: string } {
        const stats = this.cache.getStats();
        return {
            keys: this.cache.keys().length,
            hits: stats.hits,
            misses: stats.misses,
            memoryEstimate: this.getMemoryEstimate()
        };
    }

    private evictOldest(): void {
        const keys = this.cache.keys();
        if (keys.length > 0) {
            // Remove the oldest 10% of entries
            const removeCount = Math.max(1, Math.floor(keys.length * 0.1));
            for (let i = 0; i < removeCount && i < keys.length; i++) {
                this.cache.del(keys[i]);
            }
        }
    }

    private logMemoryUsage(): void {
        const usage = process.memoryUsage();
        this.memoryUsageLog.push(usage.heapUsed);
        if (this.memoryUsageLog.length > this.MAX_LOG_ENTRIES) {
            this.memoryUsageLog.shift();
        }
    }

    private getMemoryEstimate(): string {
        const usage = process.memoryUsage();
        const mbUsed = (usage.heapUsed / 1024 / 1024).toFixed(2);
        return `${mbUsed} MB`;
    }

    dispose(): void {
        this.cache.flushAll();
        this.cache.close();
        this.memoryUsageLog = [];
    }
}