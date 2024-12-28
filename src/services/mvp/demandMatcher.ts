import { MVPProduct } from '../../types/mvp/product';
import { DemandSignal } from '../../types/mvp/demand';
import { digitalIntelligence } from '../digitalIntelligence';
import { logger } from '../../utils/logger';

interface MatchScore {
  score: number;
  factors: {
    marketFit: number;
    priceAlignment: number;
    demographicMatch: number;
    urgencyFactor: number;
    verticalAlignment: number;
  };
  insights: string[];
}

export class DemandMatcher {
  private static instance: DemandMatcher;

  private constructor() {}

  static getInstance(): DemandMatcher {
    if (!DemandMatcher.instance) {
      DemandMatcher.instance = new DemandMatcher();
    }
    return DemandMatcher.instance;
  }

  /**
   * Find real market opportunities for a specific product
   */
  async findOpportunities(product: MVPProduct): Promise<
    {
      signal: DemandSignal;
      score: MatchScore;
    }[]
  > {
    try {
      // First, analyze the product itself to understand its market position
      const productAnalysis = await digitalIntelligence.analyzeNeed(
        `${product.name} in ${product.category}`
      );

      // Extract key product characteristics
      const productKeywords = productAnalysis.signals
        .flatMap((s) => s.metadata.drivers || [])
        .concat(product.tags);

      const productDemographics =
        productAnalysis.signals.find((s) => s.type === 'demand')?.metadata.targetDemographic || [];

      // Analyze active demand signals for matches
      const activeSignals = await this.getActiveSignals();
      const opportunities = await Promise.all(
        activeSignals.map(async (signal) => {
          const score = await this.calculateMatchScore(signal, product, {
            keywords: productKeywords,
            demographics: productDemographics,
            marketAnalysis: productAnalysis,
          });

          return { signal, score };
        })
      );

      // Filter and sort opportunities
      return opportunities
        .filter((opp) => opp.score.score >= 0.6) // Only strong matches
        .sort((a, b) => b.score.score - a.score.score);
    } catch (error) {
      logger.error('Error finding opportunities:', error);
      throw error;
    }
  }

  /**
   * Calculate how well a product matches a demand signal
   */
  private async calculateMatchScore(
    signal: DemandSignal,
    product: MVPProduct,
    productContext: {
      keywords: string[];
      demographics: string[];
      marketAnalysis: any;
    }
  ): Promise<MatchScore> {
    const insights: string[] = [];

    // 1. Market Fit (30%)
    const marketFit = this.calculateMarketFit(signal, product, productContext);
    if (marketFit > 0.7) {
      insights.push('Strong market alignment detected');
    }

    // 2. Price Alignment (20%)
    const priceAlignment = this.calculatePriceAlignment(signal, product);
    if (priceAlignment > 0.7) {
      insights.push('Price point matches market expectations');
    }

    // 3. Demographic Match (20%)
    const demographicMatch = this.calculateDemographicMatch(
      signal.insights.demographics || [],
      productContext.demographics
    );
    if (demographicMatch > 0.7) {
      insights.push('Strong demographic alignment');
    }

    // 4. Urgency Factor (15%)
    const urgencyFactor = signal.insights.urgency;
    if (urgencyFactor > 0.7) {
      insights.push('High market urgency detected');
    }

    // 5. Vertical Alignment (15%)
    const verticalAlignment = signal.vertical.id === product.vertical.id ? 1 : 0.3;
    if (verticalAlignment > 0.7) {
      insights.push('Perfect vertical market match');
    }

    // Calculate weighted score
    const score =
      marketFit * 0.3 +
      priceAlignment * 0.2 +
      demographicMatch * 0.2 +
      urgencyFactor * 0.15 +
      verticalAlignment * 0.15;

    return {
      score,
      factors: {
        marketFit,
        priceAlignment,
        demographicMatch,
        urgencyFactor,
        verticalAlignment,
      },
      insights,
    };
  }

  private calculateMarketFit(
    signal: DemandSignal,
    product: MVPProduct,
    context: {
      keywords: string[];
      marketAnalysis: any;
    }
  ): number {
    // Keyword matching
    const signalKeywords = signal.insights.keywords;
    const keywordMatches = context.keywords.filter((kw) =>
      signalKeywords.some(
        (sk) =>
          sk.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(sk.toLowerCase())
      )
    ).length;

    const keywordScore = keywordMatches / Math.max(context.keywords.length, signalKeywords.length);

    // Market trend alignment
    const marketTrendSignal = signal.strength;
    const productMarketFit = product.resonanceFactors?.marketFit || 0.5;

    return keywordScore * 0.6 + marketTrendSignal * 0.2 + productMarketFit * 0.2;
  }

  private calculatePriceAlignment(signal: DemandSignal, product: MVPProduct): number {
    if (!signal.insights.priceRange) {
      return 0.5; // Neutral if no price expectation
    }

    const { min, max } = signal.insights.priceRange;
    const price = product.price;

    if (price >= min && price <= max) {
      // Perfect match
      return 1;
    }

    // Calculate how far outside the range
    const midPoint = (min + max) / 2;
    const maxDeviation = midPoint * 0.5; // Allow 50% deviation

    if (price < min) {
      const deviation = (min - price) / maxDeviation;
      return Math.max(0, 1 - deviation);
    }

    const deviation = (price - max) / maxDeviation;
    return Math.max(0, 1 - deviation);
  }

  private calculateDemographicMatch(
    signalDemographics: string[],
    productDemographics: string[]
  ): number {
    if (!signalDemographics.length || !productDemographics.length) {
      return 0.5; // Neutral if no demographic data
    }

    const matches = signalDemographics.filter((sd) =>
      productDemographics.some(
        (pd) =>
          pd.toLowerCase().includes(sd.toLowerCase()) || sd.toLowerCase().includes(pd.toLowerCase())
      )
    ).length;

    return matches / Math.max(signalDemographics.length, productDemographics.length);
  }

  private async getActiveSignals(): Promise<DemandSignal[]> {
    // This would typically come from DemandTracker
    // For MVP, we could start with manually tracked signals
    return []; // TODO: Implement actual signal retrieval
  }
}
