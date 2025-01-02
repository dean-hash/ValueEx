import { DemandSignal, MatchRecommendation } from '../analysis/types';

interface Product {
    id: string;
    name: string;
    category: string;
    features: string[];
    specifications: Record<string, any>;
    pricing: {
        amount: number;
        period?: string;
    };
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
    async findMatches(signal: DemandSignal): Promise<MatchRecommendation[]> {
        // Get potential matches
        const candidates = await this.findCandidates(signal);
        
        // Score and rank matches
        const scoredMatches = await this.scoreMatches(candidates, signal);
        
        // Filter and sort
        return this.rankMatches(scoredMatches);
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
        return Array.from(this.products.values()).filter(product => 
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
        return products.map(product => ({
            ...product,
            score: this.calculateMatchScore(product, signal)
        }));
    }

    /**
     * Rank and format matches
     */
    private rankMatches(
        scoredProducts: Array<Product & { score: number }>
    ): MatchRecommendation[] {
        return scoredProducts
            .filter(p => p.score > 0.5) // Basic threshold
            .sort((a, b) => b.score - a.score)
            .map(p => this.formatMatch(p));
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
        const hasRequiredFeatures = requiredFeatures.every(
            feature => product.features.includes(feature)
        );

        return hasRequiredFeatures;
    }

    /**
     * Calculate detailed match score
     */
    private calculateMatchScore(product: Product, signal: DemandSignal): number {
        const scores = [
            this.scoreFeatures(product, signal),
            this.scoreSpecifications(product, signal),
            this.scorePricing(product, signal)
        ];

        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    /**
     * Score feature match
     */
    private scoreFeatures(product: Product, signal: DemandSignal): number {
        const requiredFeatures = signal.requirements.features || [];
        if (requiredFeatures.length === 0) return 1;

        const matchedFeatures = requiredFeatures.filter(
            feature => product.features.includes(feature)
        );

        return matchedFeatures.length / requiredFeatures.length;
    }

    /**
     * Score specifications match
     */
    private scoreSpecifications(product: Product, signal: DemandSignal): number {
        // Implementation will depend on specification structure
        return 1;
    }

    /**
     * Score pricing match
     */
    private scorePricing(product: Product, signal: DemandSignal): number {
        if (!signal.requirements.constraints.priceRange) return 1;

        const { min, max } = signal.requirements.constraints.priceRange;
        const price = product.pricing.amount;

        if (price < min || price > max) return 0;

        // Score higher for prices closer to the middle of the range
        const middle = (min + max) / 2;
        const distance = Math.abs(price - middle);
        const maxDistance = (max - min) / 2;

        return 1 - (distance / maxDistance);
    }

    /**
     * Format product match as recommendation
     */
    private formatMatch(
        scoredProduct: Product & { score: number }
    ): MatchRecommendation {
        return {
            id: this.generateMatchId(),
            demandId: '', // Set by caller
            supplyId: scoredProduct.id,
            valueScore: scoredProduct.score,
            confidence: scoredProduct.score, // Can be refined
            valueMetrics: {
                featureAlignment: this.scoreFeatures(scoredProduct, {} as DemandSignal),
                constraintSatisfaction: 1, // Placeholder
                mutualBenefit: 1, // Placeholder
                longTermValue: 1 // Placeholder
            },
            gaps: [], // Can be implemented
            enhancements: [], // Can be implemented
            risks: [], // Can be implemented
            nextSteps: [
                'Review product details',
                'Contact supplier',
                'Request demo'
            ],
            timeline: 'immediate'
        };
    }

    private generateMatchId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
