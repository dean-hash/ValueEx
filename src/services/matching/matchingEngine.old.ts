import { DemandSignal, MatchRecommendation } from '../analysis/types';

interface Product {
  id: string;
  name: string;
  category: string;
  features: string[];
  specifications: Record<string, any>;
  pricing: {
    amount: number;
    currency: string;
  };
}

export interface Match {
  id: string;
  name: string;
  quality: number;
  features?: string[];
  opportunities?: string[];
  recommendations?: string[];
}

/**
 * MatchingEngine
 *
 * Core engine for matching products/services with demand signals
 */
export class MatchingEngine {
  private products: Map<string, Product> = new Map();

  /**
   * Find matches for a demand signal
   */
  async findMatches(signal: DemandSignal): Promise<Match[]> {
    // For now, return mock matches for testing
    return [
      {
        id: 'match_1',
        name: 'Example Match 1',
        quality: 0.8,
        features: ['feature1', 'feature2'],
        opportunities: ['Potential cost savings', 'Improved efficiency'],
        recommendations: ['Review detailed specifications', 'Schedule demo'],
      },
      {
        id: 'match_2',
        name: 'Example Match 2',
        quality: 0.6,
        features: ['feature2', 'feature3'],
        opportunities: ['Market expansion', 'New capabilities'],
        recommendations: ['Compare pricing', 'Evaluate integration requirements'],
      },
    ];
  }

  /**
   * Register a product/service in the catalog
   */
  async registerProduct(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }

  /**
   * Update product information
   */
  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    const existing = this.products.get(productId);
    if (existing) {
      this.products.set(productId, { ...existing, ...updates });
    }
  }

  /**
   * Find candidate matches based on basic criteria
   */
  private async findCandidates(signal: DemandSignal): Promise<Product[]> {
    return Array.from(this.products.values()).filter((product) =>
      this.isBasicMatch(product, signal)
    );
  }

  /**
   * Score how well products match the demand
   */
  private async scoreMatches(
    products: Product[],
    signal: DemandSignal
  ): Promise<Array<Product & { score: number }>> {
    return products.map((product) => ({
      ...product,
      score: this.calculateMatchScore(product, signal),
    }));
  }

  /**
   * Rank and format matches
   */
  private rankMatches(scoredProducts: Array<Product & { score: number }>): Match[] {
    return scoredProducts
      .filter((p) => p.score > 0.5) // Basic threshold
      .sort((a, b) => b.score - a.score)
      .map((p) => this.formatMatch(p));
  }

  /**
   * Check if product meets basic matching criteria
   */
  private isBasicMatch(product: Product, signal: DemandSignal): boolean {
    // Category match
    if (signal.category && product.category !== signal.category) {
      return false;
    }

    // Price range check
    if (signal.requirements.constraints.priceRange) {
      const { min, max } = signal.requirements.constraints.priceRange;
      if (product.pricing.amount < min || product.pricing.amount > max) {
        return false;
      }
    }

    // Basic feature check
    const requiredFeatures = signal.requirements.features || [];
    const hasRequiredFeatures = requiredFeatures.every((feature) =>
      product.features.includes(feature)
    );

    return hasRequiredFeatures;
  }

  /**
   * Calculate detailed match score
   */
  private calculateMatchScore(product: Product, signal: DemandSignal): number {
    const scores = [this.scoreFeatures(product, signal), this.scorePricing(product, signal)];

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Score feature match
   */
  private scoreFeatures(product: Product, signal: DemandSignal): number {
    const requiredFeatures = signal.requirements?.features || [];
    if (requiredFeatures.length === 0) return 1;

    const matchedFeatures = requiredFeatures.filter((feature) =>
      product.features.includes(feature)
    );

    return matchedFeatures.length / requiredFeatures.length;
  }

  /**
   * Score pricing match
   */
  private scorePricing(product: Product, signal: DemandSignal): number {
    const budget = signal.requirements?.constraints.budget;
    if (!budget) return 1;

    const price = product.pricing.amount;
    if (price > budget) return 0;

    // Score higher for prices closer to budget
    return 1 - price / budget;
  }

  /**
   * Format product match as recommendation
   */
  private formatMatch(scoredProduct: Product & { score: number }): Match {
    return {
      id: this.generateMatchId(),
      name: scoredProduct.name,
      quality: scoredProduct.score,
      features: scoredProduct.features,
      opportunities: [], // Can be implemented
      recommendations: [], // Can be implemented
    };
  }

  private generateMatchId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
