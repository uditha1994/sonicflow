"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const Constants_1 = require("./Constants");
/**
 * Memory-efficient cache manager using LRU strategy.
 * Prevents excessive memory usage by limiting cache entries
 * and implementing automatic expiration.
 */
class MemoryManager {
    constructor() {
        this.memoryUsageLog = [];
        this.MAX_LOG_ENTRIES = 50;
        this.cache = new node_cache_1.default({
            stdTTL: Constants_1.CONSTANTS.CACHE_TTL_SECONDS,
            maxKeys: Constants_1.CONSTANTS.MAX_CACHE_ENTRIES,
            checkperiod: 120, // Check for expired keys every 2 minutes
            useClones: false, // Don't clone objects - saves memory
            deleteOnExpire: true
        });
        // Monitor cache events
        this.cache.on('del', (_key, _value) => {
            this.logMemoryUsage();
        });
    }
    static getInstance() {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }
    set(key, value, ttl) {
        try {
            // Check if we're approaching memory limit
            if (this.cache.keys().length >= Constants_1.CONSTANTS.MAX_CACHE_ENTRIES) {
                this.evictOldest();
            }
            return this.cache.set(key, value, ttl ?? Constants_1.CONSTANTS.CACHE_TTL_SECONDS);
        }
        catch (error) {
            console.error(`[SonicFlow] Cache set error for key ${key}:`, error);
            return false;
        }
    }
    get(key) {
        return this.cache.get(key);
    }
    has(key) {
        return this.cache.has(key);
    }
    delete(key) {
        return this.cache.del(key);
    }
    clear() {
        this.cache.flushAll();
        this.memoryUsageLog = [];
    }
    getStats() {
        const stats = this.cache.getStats();
        return {
            keys: this.cache.keys().length,
            hits: stats.hits,
            misses: stats.misses,
            memoryEstimate: this.getMemoryEstimate()
        };
    }
    evictOldest() {
        const keys = this.cache.keys();
        if (keys.length > 0) {
            // Remove the oldest 10% of entries
            const removeCount = Math.max(1, Math.floor(keys.length * 0.1));
            for (let i = 0; i < removeCount && i < keys.length; i++) {
                this.cache.del(keys[i]);
            }
        }
    }
    logMemoryUsage() {
        const usage = process.memoryUsage();
        this.memoryUsageLog.push(usage.heapUsed);
        if (this.memoryUsageLog.length > this.MAX_LOG_ENTRIES) {
            this.memoryUsageLog.shift();
        }
    }
    getMemoryEstimate() {
        const usage = process.memoryUsage();
        const mbUsed = (usage.heapUsed / 1024 / 1024).toFixed(2);
        return `${mbUsed} MB`;
    }
    dispose() {
        this.cache.flushAll();
        this.cache.close();
        this.memoryUsageLog = [];
    }
}
exports.MemoryManager = MemoryManager;
//# sourceMappingURL=MemoryManager.js.map