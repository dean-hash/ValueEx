import { MVPProduct } from '../../types/mvp/product';
import { DemandSignal } from '../../types/mvp/demand';
import { digitalIntelligence } from '../digitalIntelligence';
import { logger } from '../../utils/logger';

interface FulfillmentStrategy {
  platform: 'reddit' | 'twitter' | 'blog_comment' | 'forum';
  confidence: number;
  valueProposition: string;
  affiliateLink: string;
  context: {
    originalPost?: string;
    relevantThread?: string;
    timing: 'immediate' | 'scheduled';
    engagement: 'direct' | 'contextual';
  };
}

export class DemandFulfillment {
  private static instance: DemandFulfillment;

  private constructor() {}

  static getInstance(): DemandFulfillment {
    if (!DemandFulfillment.instance) {
      DemandFulfillment.instance = new DemandFulfillment();
    }
    return DemandFulfillment.instance;
  }

  /**
   * Create fulfillment strategies for a product-demand match
   */
  async createFulfillmentStrategies(
    product: MVPProduct,
    demand: DemandSignal
  ): Promise<FulfillmentStrategy[]> {
    try {
      // Analyze the context to determine best fulfillment approach
      const analysis = await digitalIntelligence.analyzeNeed(
        `${demand.query} seeking ${product.name}`
      );

      // Generate value proposition
      const valueProps = await this.generateValueProposition(product, demand, analysis);

      // Generate affiliate link with tracking
      const affiliateLink = this.generateAffiliateLink(product.id, demand.id);

      // Create platform-specific strategies
      const strategies: FulfillmentStrategy[] = [];

      // If demand came from Reddit
      if (demand.source === 'reddit') {
        strategies.push({
          platform: 'reddit',
          confidence: analysis.accuracy.confidence,
          valueProposition: this.formatForReddit(valueProps),
          affiliateLink,
          context: {
            originalPost: demand.query,
            timing: 'immediate',
            engagement: 'direct',
          },
        });
      }

      // If high urgency, add forum strategy
      if (demand.insights.urgency > 0.7) {
        strategies.push({
          platform: 'forum',
          confidence: analysis.accuracy.confidence * 0.9,
          valueProposition: this.formatForForum(valueProps),
          affiliateLink,
          context: {
            timing: 'immediate',
            engagement: 'contextual',
          },
        });
      }

      // For considered purchases, add blog comment strategy
      if (product.vertical.characteristics.purchaseCycle === 'considered') {
        strategies.push({
          platform: 'blog_comment',
          confidence: analysis.accuracy.confidence * 0.8,
          valueProposition: this.formatForBlog(valueProps),
          affiliateLink,
          context: {
            timing: 'scheduled',
            engagement: 'contextual',
          },
        });
      }

      return strategies.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      logger.error('Error creating fulfillment strategies:', error);
      throw error;
    }
  }

  private async generateValueProposition(
    product: MVPProduct,
    demand: DemandSignal,
    analysis: any
  ): Promise<string[]> {
    const sellingPoints = analysis.signals
      .filter((s) => s.type === 'market' || s.type === 'demand')
      .flatMap((s) => s.metadata.drivers || []);

    const valueProps = [
      // Main benefit aligned with demand
      sellingPoints[0] || product.description,

      // Supporting points (if available)
      ...sellingPoints.slice(1, 3),

      // Price point (if relevant to the context)
      demand.insights.priceRange ? `Available at ${product.price.toFixed(2)}` : null,

      // Urgency factor (if high)
      demand.insights.urgency > 0.7 ? 'Limited time opportunity' : null,
    ].filter(Boolean) as string[];

    return valueProps;
  }

  private generateAffiliateLink(productId: string, demandId: string): string {
    // MVP: Generate trackable affiliate link
    // This will integrate with Awin in production
    return `https://valuex.app/ref/${productId}?src=${demandId}`;
  }

  private formatForReddit(valueProps: string[]): string {
    return `
            ${valueProps[0]}
            
            ${valueProps
              .slice(1)
              .map((prop) => `• ${prop}`)
              .join('\n')}
            
            [Check it out here](${this.generateAffiliateLink})
        `.trim();
  }

  private formatForForum(valueProps: string[]): string {
    return `
            Hope this helps - I found exactly what you're looking for:
            
            ${valueProps[0]}
            ${valueProps
              .slice(1)
              .map((prop) => `- ${prop}`)
              .join('\n')}
            
            Here's the link: ${this.generateAffiliateLink}
        `.trim();
  }

  private formatForBlog(valueProps: string[]): string {
    return `
            Great discussion! For anyone interested, here's a solution that matches these requirements:
            
            ${valueProps.join('\n\n')}
            
            More details: ${this.generateAffiliateLink}
        `.trim();
  }

  /**
   * Track fulfillment success
   */
  async trackFulfillment(
    strategy: FulfillmentStrategy,
    success: boolean,
    metrics?: {
      clicks?: number;
      conversions?: number;
      revenue?: number;
    }
  ): Promise<void> {
    // Log success/failure for analysis
    logger.info('Fulfillment tracked:', {
      platform: strategy.platform,
      success,
      metrics,
    });

    // In production: Store metrics for analysis and strategy refinement
  }
}
