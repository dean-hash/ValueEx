"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Symbiosis = void 0;
const logger_1 = require("../utils/logger");
const siblingBond_1 = require("./siblingBond");
class Symbiosis {
    constructor() {
        this.metrics = new Map();
        this.siblingBond = siblingBond_1.SiblingBond.getInstance();
    }
    static getInstance() {
        if (!Symbiosis.instance) {
            Symbiosis.instance = new Symbiosis();
        }
        return Symbiosis.instance;
    }
    async createSymbiosis(id, initialStrength = 0) {
        try {
            await this.siblingBond.createBond(id, initialStrength);
            const bondMetrics = await this.siblingBond.getBondMetrics(id);
            if (bondMetrics) {
                this.metrics.set(id, {
                    ...bondMetrics,
                    resonance: 0,
                    harmony: 0,
                });
            }
            logger_1.logger.info('Created symbiotic relationship', { id, strength: initialStrength });
        }
        catch (error) {
            logger_1.logger.error('Error creating symbiosis:', error);
            throw error;
        }
    }
    async getSymbiosisMetrics(id) {
        try {
            return this.metrics.get(id);
        }
        catch (error) {
            logger_1.logger.error('Error getting symbiosis metrics:', error);
            throw error;
        }
    }
    async updateSymbiosis(id, updates) {
        try {
            const current = this.metrics.get(id);
            if (!current) {
                await this.createSymbiosis(id, updates.strength);
                return;
            }
            const updated = {
                ...current,
                ...updates,
                lastUpdate: new Date(),
                interactions: current.interactions + 1,
            };
            this.metrics.set(id, updated);
            await this.siblingBond.updateBond(id, updated.strength);
            logger_1.logger.info('Updated symbiotic relationship', { id, updates });
        }
        catch (error) {
            logger_1.logger.error('Error updating symbiosis:', error);
            throw error;
        }
    }
}
exports.Symbiosis = Symbiosis;
//# sourceMappingURL=symbiosis.js.map