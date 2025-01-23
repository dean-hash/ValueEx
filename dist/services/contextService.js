"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextService = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
const contextRecovery_1 = require("./contextRecovery");
const resourceMonitor_1 = require("./monitoring/resourceMonitor");
class ContextService extends events_1.EventEmitter {
    constructor() {
        super();
        this.AUTO_SAVE_INTERVAL = 60000; // 1 minute
        this.recovery = new contextRecovery_1.ContextRecovery();
        this.monitor = new resourceMonitor_1.ResourceMonitor();
        this.setupAutoSave();
    }
    static getInstance() {
        if (!ContextService.instance) {
            ContextService.instance = new ContextService();
        }
        return ContextService.instance;
    }
    setupAutoSave() {
        this.saveTimer = setInterval(() => {
            this.saveContext();
        }, this.AUTO_SAVE_INTERVAL);
    }
    async initialize(initialState = {}) {
        try {
            const savedState = await this.recovery.loadState();
            const mergedState = {
                ...savedState,
                ...initialState,
                sessionContext: {
                    startTime: Date.now(),
                    lastUpdated: Date.now(),
                    activeUsers: [],
                    metrics: {},
                },
            };
            await this.recovery.saveState(mergedState);
            this.emit('stateUpdated', mergedState);
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize context:', error);
            throw error;
        }
    }
    async getState() {
        try {
            return await this.recovery.loadState();
        }
        catch (error) {
            logger_1.logger.error('Failed to get state:', error);
            throw error;
        }
    }
    async updateState(updates) {
        try {
            const currentState = await this.recovery.loadState();
            const updatedState = {
                ...currentState,
                ...updates,
                sessionContext: {
                    ...currentState.sessionContext,
                    lastUpdated: Date.now(),
                },
            };
            await this.recovery.saveState(updatedState);
            this.emit('stateUpdated', updatedState);
        }
        catch (error) {
            logger_1.logger.error('Failed to update state:', error);
            throw error;
        }
    }
    async saveContext() {
        try {
            const currentState = await this.recovery.loadState();
            await this.recovery.saveState(currentState);
        }
        catch (error) {
            logger_1.logger.error('Failed to save context:', error);
        }
    }
    dispose() {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
        }
        this.monitor.stopMonitoring();
        this.removeAllListeners();
    }
    getMonitor() {
        return this.monitor;
    }
    clearState() {
        this.recovery.clearState();
    }
}
exports.ContextService = ContextService;
//# sourceMappingURL=contextService.js.map