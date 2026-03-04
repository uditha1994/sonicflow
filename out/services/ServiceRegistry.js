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
exports.ServiceRegistry = void 0;
const vscode = __importStar(require("vscode"));
class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.serviceChangeEmitter = new vscode.EventEmitter();
        this.onServiceChange = this.serviceChangeEmitter.event;
    }
    /**
     * Register a new music service
     */
    register(service) {
        this.services.set(service.id, service);
        this.serviceChangeEmitter.fire(this.getActiveServiceIds());
        console.log(`[SonicFlow] Service registered: ${service.name}`);
    }
    /**
     * Unregister a music service
     */
    unregister(serviceId) {
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
    get(serviceId) {
        return this.services.get(serviceId);
    }
    /**
     * Get all registered services
     */
    getAll() {
        return Array.from(this.services.values());
    }
    /**
     * Get active service IDs
     */
    getActiveServiceIds() {
        return Array.from(this.services.keys());
    }
    /**
     * Search across all enabled services
     */
    async searchAll(query) {
        const results = new Map();
        for (const [id, service] of this.services) {
            if (service.isEnabled) {
                try {
                    const serviceResults = await service.search(query);
                    results.set(id, serviceResults);
                }
                catch (error) {
                    console.error(`[SonicFlow] Search failed for service ${id}:`, error);
                }
            }
        }
        return results;
    }
    dispose() {
        for (const service of this.services.values()) {
            service.dispose();
        }
        this.services.clear();
        this.serviceChangeEmitter.dispose();
    }
}
exports.ServiceRegistry = ServiceRegistry;
//# sourceMappingURL=ServiceRegistry.js.map