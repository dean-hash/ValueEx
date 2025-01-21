import { MVPProduct, ProductMatchCriteria } from '../../types/mvp/product';
import { digitalIntelligence } from '../digitalIntelligence';
import { logger } from '../../utils/logger';

/**
 * MVP Product Manager
 * Handles manual product management and basic matching logic
 * Can be extended later for API integrations
 */
export class ProductManager {
  private static instance: ProductManager;
  private products: Map<string, MVPProduct> = new Map();

  private constructor() {}

  static getInstance(): ProductManager {
    if (!ProductManager.instance) {
      ProductManager.instance = new ProductManager();
    }
    return ProductManager.instance;
  }

  /**
   * Add or update a product
   * Simple in MVP, but maintains structure for future enhancements
   */
  async addProduct(product: Omit<MVPProduct, 'id' | 'resonanceFactors'>): Promise<MVPProduct> {
    try {
      // Generate simple ID for MVP
      const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Analyze product with digital intelligence
      const analysis = await digitalIntelligence.analyzeNeed(product.category);

      const mvpProduct: MVPProduct = {
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
      logger.info(`Added new product: ${mvpProduct.name}`);

      return mvpProduct;
    } catch (error) {
      logger.error('Error adding product:', error);
      throw error;
    }
  }

  /**
   * Find products matching demand criteria
   * Simple matching for MVP, but structured for future enhancement
   */
  findMatches(criteria: ProductMatchCriteria): MVPProduct[] {
    const matches = Array.from(this.products.values()).filter((product) => {
      if (
        criteria.category &&
        !product.category.toLowerCase().includes(criteria.category.toLowerCase())
      ) {
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
        const avgResonance =
          (product.resonanceFactors.demandMatch +
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
  getAllProducts(): MVPProduct[] {
    return Array.from(this.products.values());
  }

  /**
   * Update product status
   */
  updateProductStatus(id: string, status: MVPProduct['status']): boolean {
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
  clearProducts(): void {
    this.products.clear();
  }
}
