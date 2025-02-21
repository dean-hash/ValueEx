"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MVPStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../../utils/logger");
class MVPStorage {
    constructor() {
        this.filePath = path_1.default.join(__dirname, '../../../data/mvp_data.json');
        this.data = this.loadData();
        // Auto-save every 5 minutes
        this.saveInterval = setInterval(() => this.saveData(), 5 * 60 * 1000);
    }
    static getInstance() {
        if (!MVPStorage.instance) {
            MVPStorage.instance = new MVPStorage();
        }
        return MVPStorage.instance;
    }
    loadData() {
        try {
            if (fs_1.default.existsSync(this.filePath)) {
                const fileContent = fs_1.default.readFileSync(this.filePath, 'utf-8');
                return JSON.parse(fileContent);
            }
        }
        catch (error) {
            logger_1.logger.error('Error loading data:', error);
        }
        // Return default structure if file doesn't exist or has error
        return {
            matches: [],
            commissions: [],
            analytics: {
                apiCalls: 0,
                successfulMatches: 0,
                totalRevenue: 0,
                lastUpdate: new Date().toISOString(),
            },
        };
    }
    saveData() {
        try {
            // Ensure directory exists
            const dir = path_1.default.dirname(this.filePath);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            // Save data
            fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
            logger_1.logger.info('Data saved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error saving data:', error);
        }
    }
    /**
     * Track a new match
     */
    trackMatch(demandId, productId) {
        this.data.matches.push({
            demandId,
            productId,
            timestamp: new Date().toISOString(),
            status: 'active',
        });
    }
    /**
     * Update match status
     */
    updateMatchStatus(demandId, status) {
        const match = this.data.matches.find((m) => m.demandId === demandId);
        if (match) {
            match.status = status;
        }
    }
    /**
     * Track commission
     */
    trackCommission(verticalId, amount) {
        this.data.commissions.push({
            verticalId,
            amount,
            timestamp: new Date().toISOString(),
        });
        // Update analytics
        this.data.analytics.successfulMatches++;
        this.data.analytics.totalRevenue += amount;
        this.data.analytics.lastUpdate = new Date().toISOString();
    }
    /**
     * Track API call
     */
    trackAPICall() {
        this.data.analytics.apiCalls++;
        this.data.analytics.lastUpdate = new Date().toISOString();
    }
    /**
     * Get active matches
     */
    getActiveMatches() {
        return this.data.matches.filter((m) => m.status === 'active');
    }
    /**
     * Get analytics
     */
    getAnalytics() {
        return { ...this.data.analytics };
    }
    /**
     * Get commission history for a vertical
     */
    getVerticalCommissions(verticalId) {
        const verticalCommissions = this.data.commissions.filter((c) => c.verticalId === verticalId);
        const total = verticalCommissions.reduce((sum, c) => sum + c.amount, 0);
        const count = verticalCommissions.length;
        return {
            total,
            count,
            average: count > 0 ? total / count : 0,
        };
    }
    /**
     * Clean up on shutdown
     */
    cleanup() {
        clearInterval(this.saveInterval);
        this.saveData();
    }
}
exports.MVPStorage = MVPStorage;
//# sourceMappingURL=storage.js.map