"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MARKET_VERTICALS = void 0;
exports.MARKET_VERTICALS = {
    electronics: {
        id: 'electronics',
        name: 'Consumer Electronics',
        characteristics: {
            purchaseCycle: 'considered',
            priceElasticity: 0.8,
            seasonality: 0.6,
            techDependency: 0.9,
        },
        keyMetrics: {
            avgMargin: 0.25,
            customerLifetime: 24,
            acquisitionCost: 50,
            repeatPurchaseRate: 0.4,
        },
        competitiveFactors: {
            entryBarriers: 0.7,
            substituteThreat: 0.6,
            supplierPower: 0.7,
            buyerPower: 0.5,
        },
    },
    fashion: {
        id: 'fashion',
        name: 'Fashion & Apparel',
        characteristics: {
            purchaseCycle: 'impulse',
            priceElasticity: 0.9,
            seasonality: 0.9,
            techDependency: 0.3,
        },
        keyMetrics: {
            avgMargin: 0.45,
            customerLifetime: 36,
            acquisitionCost: 30,
            repeatPurchaseRate: 0.6,
        },
        competitiveFactors: {
            entryBarriers: 0.4,
            substituteThreat: 0.8,
            supplierPower: 0.4,
            buyerPower: 0.7,
        },
    },
    homegoods: {
        id: 'homegoods',
        name: 'Home & Living',
        characteristics: {
            purchaseCycle: 'considered',
            priceElasticity: 0.7,
            seasonality: 0.4,
            techDependency: 0.4,
        },
        keyMetrics: {
            avgMargin: 0.35,
            customerLifetime: 48,
            acquisitionCost: 40,
            repeatPurchaseRate: 0.3,
        },
        competitiveFactors: {
            entryBarriers: 0.5,
            substituteThreat: 0.5,
            supplierPower: 0.5,
            buyerPower: 0.6,
        },
    },
};
//# sourceMappingURL=marketTypes.js.map