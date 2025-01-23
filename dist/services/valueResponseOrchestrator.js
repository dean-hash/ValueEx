"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueResponseOrchestrator = void 0;
const logger_1 = require("../utils/logger");
const intelligenceOrchestrator_1 = require("./intelligenceOrchestrator");
const symbiosis_1 = require("./symbiosis");
class ValueResponseOrchestrator {
    constructor() {
        this.responses = new Map();
        this.intelligenceOrchestrator = intelligenceOrchestrator_1.IntelligenceOrchestrator.getInstance();
        this.symbiosis = symbiosis_1.Symbiosis.getInstance();
    }
    static getInstance() {
        if (!ValueResponseOrchestrator.instance) {
            ValueResponseOrchestrator.instance = new ValueResponseOrchestrator();
        }
        return ValueResponseOrchestrator.instance;
    }
    async processValue(input) {
        try {
            const response = await this.intelligenceOrchestrator.orchestrateResponse(input);
            const metrics = (await this.symbiosis.getSymbiosisMetrics(input)) || {
                strength: 0,
                resonance: 0,
                harmony: 0,
                lastUpdate: new Date(),
                interactions: 0,
            };
            await this.symbiosis.updateSymbiosis(input, {
                ...metrics,
                strength: metrics.strength + 0.1,
                resonance: metrics.resonance + 0.1,
                harmony: metrics.harmony + 0.1,
            });
            const valueResponse = {
                content: response,
                metrics: await this.symbiosis.getSymbiosisMetrics(input),
                timestamp: new Date(),
            };
            const responses = this.responses.get(input) || [];
            responses.push(valueResponse);
            this.responses.set(input, responses);
            logger_1.logger.info('Processed value response', { input, response: valueResponse });
            return valueResponse;
        }
        catch (error) {
            logger_1.logger.error('Error processing value:', error);
            throw error;
        }
    }
    async getValueResponses(input) {
        try {
            return this.responses.get(input) || [];
        }
        catch (error) {
            logger_1.logger.error('Error getting value responses:', error);
            throw error;
        }
    }
}
exports.ValueResponseOrchestrator = ValueResponseOrchestrator;
//# sourceMappingURL=valueResponseOrchestrator.js.map