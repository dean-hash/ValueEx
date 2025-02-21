"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductManager = void 0;
const digitalIntelligence_1 = require("../digitalIntelligence");
const logger_1 = require("../../utils/logger");
/**
 * MVP Product Manager
 * Handles manual product management and basic matching logic
 * Can be extended later for API integrations
 */
class ProductManager {
    constructor() {
        this.products = new Map();
    }
    static getInstance() {
        if (!ProductManager.instance) {
            ProductManager.instance = new ProductManager();
        }
        return ProductManager.instance;
    }
    /**
     * Add or update a product
     * Simple in MVP, but maintains structure for future enhancements
     */
    async addProduct(product) {
        try {
            // Generate simple ID for MVP
            const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Analyze product with digital intelligence
            const analysis = await digitalIntelligence_1.digitalIntelligence.analyzeNeed(product.category);
            const mvpProduct = {
                ...product,
                id,
                resonanceFactors: {
                    demandMatch: analysis.accuracy.confidence,
                    marketFit: analysis.signals.find((s) => s.type === 'market')?.strength || 0,
                    valueAlignment: analysis.signals.find((s) => s.type === 'demand')?.strength || 0,
                },
                source: 'manual',
                status: 'active',
            };
            this.products.set(id, mvpProduct);
            logger_1.logger.info(`Added new product: ${mvpProduct.name}`);
            return mvpProduct;
        }
        catch (error) {
            logger_1.logger.error('Error adding product:', error);
            throw error;
        }
    }
    /**
     * Find products matching demand criteria
     * Simple matching for MVP, but structured for future enhancement
     */
    findMatches(criteria) {
        const matches = Array.from(this.products.values()).filter((product) => {
            if (criteria.category &&
                !product.category.toLowerCase().includes(criteria.category.toLowerCase())) {
                return false;
            }
            if (criteria.vertical && product.vertical.id !== criteria.vertical) {
                return false;
            }
            if (criteria.priceRange) {
                if (product.price < criteria.priceRange.min || product.price > criteria.priceRange.max) {
                    return false;
                }
            }
            if (criteria.tags && criteria.tags.length > 0) {
                if (!criteria.tags.some((tag) => product.tags.includes(tag))) {
                    return false;
                }
            }
            if (criteria.resonanceThreshold && product.resonanceFactors) {
                const avgResonance = (product.resonanceFactors.demandMatch +
                    product.resonanceFactors.marketFit +
                    product.resonanceFactors.valueAlignment) /
                    3;
                if (avgResonance < criteria.resonanceThreshold) {
                    return false;
                }
            }
            return true;
        });
        // Sort by resonance for MVP
        return matches.sort((a, b) => {
            const aScore = a.resonanceFactors
                ? (a.resonanceFactors.demandMatch +
                    a.resonanceFactors.marketFit +
                    a.resonanceFactors.valueAlignment) /
                    3
                : 0;
            const bScore = b.resonanceFactors
                ? (b.resonanceFactors.demandMatch +
                    b.resonanceFactors.marketFit +
                    b.resonanceFactors.valueAlignment) /
                    3
                : 0;
            return bScore - aScore;
        });
    }
    /**
     * Get all products (for MVP admin interface)
     */
    getAllProducts() {
        return Array.from(this.products.values());
    }
    /**
     * Update product status
     */
    updateProductStatus(id, status) {
        const product = this.products.get(id);
        if (product) {
            product.status = status;
            this.products.set(id, product);
            return true;
        }
        return false;
    }
    /**
     * Clear all products (for testing)
     */
    clearProducts() {
        this.products.clear();
    }
}
exports.ProductManager = ProductManager;
//# sourceMappingURL=productManager.js.map