import { DemandSignal } from '../../types/mvp/demand';
import { MVPProduct } from '../../types/mvp/product';
import { logger } from '../../utils/logger';

interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  commission: number;
  category: string;
  affiliateUrl: string;
}

interface DemandSignal {
  query: string;
  userId: string;
  vertical: string;
  tags: string[];
  source: string;
  status: string;
}

export class DemandMatcher {
  private static instance: DemandMatcher;

  // High-commission AI products
  private products: AffiliateProduct[] = [
    {
      id: 'jasper',
      name: 'Jasper AI',
      description: 'AI writing assistant that helps you create amazing content 10X faster',
      basePrice: 49,
      commission: 0.3, // 30% commission
      category: 'ai_writing',
      affiliateUrl: 'https://jasper.ai',
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      description: 'Create stunning AI-generated artwork and illustrations',
      basePrice: 30,
      commission: 0.2, // 20% commission
      category: 'ai_image',
      affiliateUrl: 'https://midjourney.com',
    },
    {
      id: 'copyai',
      name: 'Copy.ai',
      description: 'AI-powered copywriting tool for better marketing copy',
      basePrice: 35,
      commission: 0.25, // 25% commission
      category: 'ai_writing',
      affiliateUrl: 'https://copy.ai',
    },
    {
      id: 'stability',
      name: 'Stable Diffusion',
      description: 'Professional AI image generation platform',
      basePrice: 20,
      commission: 0.2, // 20% commission
      category: 'ai_image',
      affiliateUrl: 'https://stability.ai',
    },
  ];

  private constructor() {}

  public static getInstance(): DemandMatcher {
    if (!DemandMatcher.instance) {
      DemandMatcher.instance = new DemandMatcher();
    }
    return DemandMatcher.instance;
  }

  async findMatches(signal: DemandSignal): Promise<MVPProduct[]> {
    try {
      // Simple category-based matching for MVP
      const category = this.determineCategory(signal.query);

      // Get relevant products
      const matches = this.products
        .filter((p) => p.category === category)
        .sort((a, b) => b.commission - a.commission) // Prioritize higher commission
        .map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.basePrice,
          category: p.category,
          affiliateUrl: this.generateAffiliateUrl(p.affiliateUrl, signal.userId),
          commission: p.commission,
          confidence: 0.9, // High confidence for direct category matches
          vertical: signal.vertical, // Map vertical property
          tags: signal.tags, // Map tags property
          source: signal.source, // Map source property
          status: signal.status, // Map status property
        }));

      logger.info(`Found ${matches.length} matches for category ${category}`);
      return matches;
    } catch (error) {
      logger.error('Error finding matches:', error);
      return [];
    }
  }

  public async isHealthy(): Promise<boolean> {
    // Implement logic to check health
    try {
      // Example: Check if products array is populated
      return this.products.length > 0;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  private determineCategory(query: string): string {
    // Simple keyword matching for MVP
    return query.toLowerCase().includes('image') ? 'ai_image' : 'ai_writing';
  }

  private generateAffiliateUrl(baseUrl: string, userId: string): string {
    const affiliateId =
      process.env[
        `${
          baseUrl.includes('jasper')
            ? 'JASPER'
            : baseUrl.includes('midjourney')
              ? 'MIDJOURNEY'
              : baseUrl.includes('copy.ai')
                ? 'COPYAI'
                : 'STABILITY'
        }_AFFILIATE_ID`
      ];

    return `${baseUrl}?ref=${affiliateId}&uid=${userId}`;
  }
}
