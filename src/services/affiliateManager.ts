import { logger } from '../utils/logger';

interface AffiliateProduct {
  name: string;
  description: string;
  baseUrl: string;
  affiliateId: string;
  commission: number;
  category: string;
}

export class AffiliateManager {
  private static instance: AffiliateManager;
  private products: Map<string, AffiliateProduct>;

  private constructor() {
    this.products = new Map();

    // Initialize with real, high-commission AI affiliate products
    this.addProduct({
      name: 'Jasper',
      description:
        'AI writing assistant that helps you create amazing content 10X faster. Perfect for marketing, blogs, and social media.',
      baseUrl: 'https://jasper.ai',
      affiliateId: process.env.JASPER_AFFILIATE_ID || '',
      commission: 0.3, // 30% commission
      category: 'ai_writing',
    });

    this.addProduct({
      name: 'Midjourney',
      description:
        'Create stunning AI-generated artwork and illustrations. Ideal for designers, marketers, and creators.',
      baseUrl: 'https://midjourney.com',
      affiliateId: process.env.MIDJOURNEY_AFFILIATE_ID || '',
      commission: 0.2, // 20% commission
      category: 'ai_image',
    });

    this.addProduct({
      name: 'Copy.ai',
      description:
        'AI-powered copywriting tool that helps you write better marketing copy, faster.',
      baseUrl: 'https://copy.ai',
      affiliateId: process.env.COPYAI_AFFILIATE_ID || '',
      commission: 0.25, // 25% commission
      category: 'ai_writing',
    });

    this.addProduct({
      name: 'Stable Diffusion',
      description:
        'Professional AI image generation platform for creating unique, high-quality visuals.',
      baseUrl: 'https://stability.ai',
      affiliateId: process.env.STABILITY_AFFILIATE_ID || '',
      commission: 0.2, // 20% commission
      category: 'ai_image',
    });
  }

  public static getInstance(): AffiliateManager {
    if (!AffiliateManager.instance) {
      AffiliateManager.instance = new AffiliateManager();
    }
    return AffiliateManager.instance;
  }

  private addProduct(product: AffiliateProduct): void {
    this.products.set(product.name.toLowerCase(), product);
    logger.info(`Added affiliate product: ${product.name}`);
  }

  async getRelevantProducts(category: string): Promise<AffiliateProduct[]> {
    try {
      return Array.from(this.products.values())
        .filter((product) => product.category === category)
        .sort((a, b) => b.commission - a.commission);
    } catch (err) {
      logger.error('Error getting relevant products:', err);
      return [];
    }
  }

  generateAffiliateLink(productName: string, userId: string): string {
    try {
      const product = this.products.get(productName.toLowerCase());
      if (!product) {
        throw new Error(`Product not found: ${productName}`);
      }

      // Generate trackable affiliate link
      const trackingId = `vex_${Date.now()}_${userId}`;
      return `${product.baseUrl}?ref=${product.affiliateId}&track=${trackingId}`;
    } catch (err) {
      logger.error('Error generating affiliate link:', err);
      return '';
    }
  }

  async isHealthy(): Promise<boolean> {
    return this.products.size > 0;
  }
}
