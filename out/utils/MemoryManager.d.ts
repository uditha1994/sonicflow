/**
 * Memory-efficient cache manager using LRU strategy.
 * Prevents excessive memory usage by limiting cache entries
 * and implementing automatic expiration.
 */
export declare class MemoryManager {
    private static instance;
    private cache;
    private memoryUsageLog;
    private readonly MAX_LOG_ENTRIES;
    private constructor();
    static getInstance(): MemoryManager;
    set<T>(key: string, value: T, ttl?: number): boolean;
    get<T>(key: string): T | undefined;
    has(key: string): boolean;
    delete(key: string): number;
    clear(): void;
    getStats(): {
        keys: number;
        hits: number;
        misses: number;
        memoryEstimate: string;
    };
    private evictOldest;
    private logMemoryUsage;
    private getMemoryEstimate;
    dispose(): void;
}
//# sourceMappingURL=MemoryManager.d.ts.map