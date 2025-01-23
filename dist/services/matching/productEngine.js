"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductMatchingEngine = void 0;
class ProductMatchingEngine {
    async findOptimalMatches(products, context = {}) {
        const { category, minCommissionRate, maxPrice, sortBy } = context;
        return products
            .filter((p) => this.matchesFilters(p, category, minCommissionRate, maxPrice))
            .sort((a, b) => this.sortProducts(a, b, sortBy));
    }
    matchesFilters(product, category, minCommissionRate, maxPrice) {
        if (category && product.category !== category)
            return false;
        if (minCommissionRate && product.commissionRate < minCommissionRate)
            return false;
        if (maxPrice && product.price > maxPrice)
            return false;
        return true;
    }
    sortProducts(a, b, sortBy = 'potentialValue') {
        switch (sortBy) {
            case 'price':
                return b.price - a.price;
            case 'commission':
                return b.commissionRate - a.commissionRate;
            case 'engagement':
                return b.metrics.engagementScore - a.metrics.engagementScore;
            case 'potentialValue':
            default:
                return (b.price * b.commissionRate * b.metrics.engagementScore -
                    a.price * a.commissionRate * a.metrics.engagementScore);
        }
    }
}
exports.ProductMatchingEngine = ProductMatchingEngine;
//# sourceMappingURL=productEngine.js.map