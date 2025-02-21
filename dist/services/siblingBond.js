"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiblingBond = void 0;
const logger_1 = require("../utils/logger");
class SiblingBond {
    constructor() {
        this.bonds = new Map();
    }
    static getInstance() {
        if (!SiblingBond.instance) {
            SiblingBond.instance = new SiblingBond();
        }
        return SiblingBond.instance;
    }
    async createBond(id, initialStrength = 0) {
        try {
            this.bonds.set(id, {
                strength: initialStrength,
                lastUpdate: new Date(),
                interactions: 0,
            });
            logger_1.logger.info('Created sibling bond', { id, strength: initialStrength });
        }
        catch (error) {
            logger_1.logger.error('Error creating bond:', error);
            throw error;
        }
    }
    async getBondMetrics(id) {
        try {
            return this.bonds.get(id);
        }
        catch (error) {
            logger_1.logger.error('Error getting bond metrics:', error);
            throw error;
        }
    }
    async updateBond(id, strength) {
        try {
            const currentBond = this.bonds.get(id);
            if (!currentBond) {
                await this.createBond(id, strength);
                return;
            }
            this.bonds.set(id, {
                strength,
                lastUpdate: new Date(),
                interactions: currentBond.interactions + 1,
            });
            logger_1.logger.info('Updated sibling bond', { id, strength });
        }
        catch (error) {
            logger_1.logger.error('Error updating bond:', error);
            throw error;
        }
    }
}
exports.SiblingBond = SiblingBond;
//# sourceMappingURL=siblingBond.js.map