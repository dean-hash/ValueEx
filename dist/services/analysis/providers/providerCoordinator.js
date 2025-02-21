"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderCoordinator = void 0;
const events_1 = require("events");
const localIntelligence_1 = require("./localIntelligence");
const researchIntelligence_1 = require("./researchIntelligence");
const systemResource_1 = require("./systemResource");
const logger_1 = require("../../../utils/logger");
class ProviderCoordinator extends events_1.EventEmitter {
    constructor() {
        super();
        this.MAX_LOAD = 0.8;
        this.ERROR_THRESHOLD = 5;
        this.providers = new Map();
        this.providerStates = new Map();
        this.taskQueue = [];
        this.initializeProviders();
        this.startStateMonitoring();
    }
    initializeProviders() {
        const localProvider = new localIntelligence_1.LocalIntelligenceProvider();
        const researchProvider = new researchIntelligence_1.ResearchIntelligenceProvider();
        const systemProvider = new systemResource_1.SystemResourceProvider();
        this.providers.set('local', localProvider);
        this.providers.set('research', researchProvider);
        this.providers.set('system', systemProvider);
        this.initializeState('local');
        this.initializeState('research');
        this.initializeState('system');
    }
    initializeState(providerId) {
        this.providerStates.set(providerId, {
            status: 'idle',
            lastUpdate: Date.now(),
            currentLoad: 0,
            errorCount: 0
        });
    }
    startStateMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.monitorProviderStates();
        }, 5000);
    }
    async monitorProviderStates() {
        for (const [providerId, state] of this.providerStates.entries()) {
            try {
                const provider = this.providers.get(providerId);
                if (!provider)
                    continue;
                const capacity = provider.getCapacity();
                const load = 1 - capacity;
                if (load > this.MAX_LOAD) {
                    this.emit('providerOverload', {
                        providerId,
                        load,
                        timestamp: Date.now()
                    });
                }
                if (state.errorCount > this.ERROR_THRESHOLD) {
                    this.emit('providerError', {
                        providerId,
                        errorCount: state.errorCount,
                        timestamp: Date.now()
                    });
                }
                this.providerStates.set(providerId, {
                    ...state,
                    currentLoad: load,
                    lastUpdate: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error(`Error monitoring provider ${providerId}:`, error);
            }
        }
    }
    async processSignal(signal, provider) {
        try {
            const result = await provider.process(signal);
            return {
                success: true,
                data: result,
                error: null
            };
        }
        catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error : new Error('Unknown error occurred')
            };
        }
    }
    async processWithProvider(providerId, signal) {
        const provider = this.providers.get(providerId);
        const state = this.providerStates.get(providerId);
        if (!provider || !state) {
            return {
                success: false,
                error: new Error(`Provider ${providerId} not found`)
            };
        }
        try {
            const result = await provider.process(signal);
            this.providerStates.set(providerId, {
                ...state,
                errorCount: 0,
                status: 'idle'
            });
            return result;
        }
        catch (error) {
            this.providerStates.set(providerId, {
                ...state,
                errorCount: state.errorCount + 1,
                status: 'error'
            });
            logger_1.logger.error(`Error processing with provider ${providerId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Unknown error occurred')
            };
        }
    }
    mergeResults(results) {
        return results.reduce((merged, result) => ({
            ...merged,
            ...result,
            confidence: Math.max(merged.confidence || 0, result.confidence || 0),
            relevance: Math.max(merged.relevance || 0, result.relevance || 0),
            priority: Math.max(merged.priority || 0, result.priority || 0)
        }), {});
    }
    dispose() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.removeAllListeners();
        this.taskQueue = [];
        this.providers.clear();
        this.providerStates.clear();
    }
}
exports.ProviderCoordinator = ProviderCoordinator;
//# sourceMappingURL=providerCoordinator.js.map