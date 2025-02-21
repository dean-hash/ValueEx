"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectMerchantAPI = void 0;
class DirectMerchantAPI {
    async getProducts() {
        // Our actual product data
        return [
            {
                id: 'vx_di_pro',
                name: 'Digital Intelligence Pro',
                description: 'Enterprise-grade digital intelligence platform with advanced analytics and automation',
                price: 499.99,
                commissionRate: 30,
                category: 'AI_TOOLS',
                metrics: {
                    projectedRevenue: 14999.7,
                    engagementScore: 0.95,
                    conversionRate: 0.12,
                    marketFit: 0.89,
                    growthPotential: 0.92,
                },
            },
            {
                id: 'vx_di_starter',
                name: 'Digital Intelligence Starter',
                description: 'Perfect for small teams starting their digital intelligence journey',
                price: 199.99,
                commissionRate: 25,
                category: 'AI_TOOLS',
                metrics: {
                    projectedRevenue: 4999.75,
                    engagementScore: 0.88,
                    conversionRate: 0.15,
                    marketFit: 0.85,
                    growthPotential: 0.9,
                },
            },
        ];
    }
    async trackEngagement(data) {
        console.log('Engagement tracked:', data);
    }
    async recordConversion(data) {
        console.log('Conversion recorded:', data);
        return {
            projectedRevenue: data.amount * 12, // Annualized
            engagementScore: 0.9,
            conversionRate: 0.15,
            marketFit: 0.88,
            growthPotential: 0.91,
        };
    }
}
exports.DirectMerchantAPI = DirectMerchantAPI;
//# sourceMappingURL=merchant.js.map