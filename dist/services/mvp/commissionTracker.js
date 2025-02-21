"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionTracker = void 0;
const logger_1 = require("../../utils/logger");
class CommissionTracker {
    constructor() {
        this.verticalStats = new Map();
        this.productStats = new Map();
        // Initialize with some known vertical averages
        this.initializeVerticalData();
    }
    static getInstance() {
        if (!CommissionTracker.instance) {
            CommissionTracker.instance = new CommissionTracker();
        }
        return CommissionTracker.instance;
    }
    initializeVerticalData() {
        // Initial data based on market research
        // We can update these as we get real data
        const initialData = [
            [
                'electronics',
                {
                    verticalId: 'electronics',
                    averageCommission: 4.5, // 4.5%
                    averageOrderValue: 150,
                    successfulMatches: 0,
                    totalMatches: 0,
                },
            ],
            [
                'fashion',
                {
                    verticalId: 'fashion',
                    averageCommission: 8, // 8%
                    averageOrderValue: 75,
                    successfulMatches: 0,
                    totalMatches: 0,
                },
            ],
            [
                'homegoods',
                {
                    verticalId: 'homegoods',
                    averageCommission: 6, // 6%
                    averageOrderValue: 120,
                    successfulMatches: 0,
                    totalMatches: 0,
                },
            ],
        ];
        initialData.forEach(([id, data]) => {
            this.verticalStats.set(id, data);
        });
    }
    /**
     * Calculate potential commission for a match
     */
    calculatePotentialCommission(vertical, price) {
        const verticalData = this.verticalStats.get(vertical.id);
        if (!verticalData) {
            return {
                estimatedCommission: 0,
                confidence: 0,
            };
        }
        // Calculate based on vertical averages
        const estimatedCommission = price * (verticalData.averageCommission / 100);
        // Confidence based on data points
        const confidence = Math.min(verticalData.totalMatches / 100, // Caps at 100 data points
        0.9 // Never perfectly confident
        );
        return {
            estimatedCommission,
            confidence,
        };
    }
    /**
     * Track a successful commission
     */
    trackCommission(productId, vertical, commission, orderValue) {
        // Update product stats
        this.productStats.set(productId, {
            productId,
            commission,
            orderValue,
            vertical,
        });
        // Update vertical stats
        const verticalData = this.verticalStats.get(vertical.id);
        if (verticalData) {
            const newTotal = verticalData.successfulMatches + 1;
            verticalData.averageCommission =
                (verticalData.averageCommission * verticalData.successfulMatches +
                    (commission / orderValue) * 100) /
                    newTotal;
            verticalData.averageOrderValue =
                (verticalData.averageOrderValue * verticalData.successfulMatches + orderValue) / newTotal;
            verticalData.successfulMatches = newTotal;
            verticalData.totalMatches++;
            this.verticalStats.set(vertical.id, verticalData);
        }
        logger_1.logger.info('Commission tracked:', {
            productId,
            vertical: vertical.id,
            commission,
            orderValue,
        });
    }
    /**
     * Get best performing verticals
     */
    getBestVerticals() {
        return Array.from(this.verticalStats.entries())
            .map(([id, data]) => ({
            verticalId: id,
            expectedValue: (data.averageCommission / 100) *
                data.averageOrderValue *
                (data.successfulMatches / Math.max(1, data.totalMatches)),
        }))
            .sort((a, b) => b.expectedValue - a.expectedValue);
    }
    /**
     * Get commission history for analysis
     */
    getCommissionHistory() {
        return {
            byProduct: new Map(this.productStats),
            byVertical: new Map(this.verticalStats),
        };
    }
}
exports.CommissionTracker = CommissionTracker;
//# sourceMappingURL=commissionTracker.js.map