import axios from 'axios';
import { logger } from '../utils/logger';
import { RevenueTracker } from './affiliate/revenueTracker';

interface AffiliateProgram {
  name: string;
  baseUrl: string;
  affiliateId: string;
  commission: number;
  category: string;
}

interface AffiliateLink {
  originalUrl: string;
  affiliateUrl: string;
  program: string;
  potentialCommission: number;
}

export class AffiliateManager {
  private static instance: AffiliateManager;
  private programs: Map<string, AffiliateProgram>;
  private revenueTracker: RevenueTracker;

  private constructor() {
    this.programs = new Map();
    this.revenueTracker = new RevenueTracker();

    // Initialize with real, high-commission AI affiliate programs
    this.addProgram({
      name: 'jasper',
      baseUrl: 'https://jasper.ai',
      affiliateId: process.env.JASPER_AFFILIATE_ID || '',
      commission: 0.3, // 30% commission
      category: 'ai_writing',
    });

    this.addProgram({
      name: 'midjourney',
      baseUrl: 'https://midjourney.com',
      affiliateId: process.env.MIDJOURNEY_AFFILIATE_ID || '',
      commission: 0.2, // 20% commission
      category: 'ai_image',
    });

    this.addProgram({
      name: 'amazon_aws',
      baseUrl: 'https://aws.amazon.com',
      affiliateId: process.env.AWS_AFFILIATE_ID || '',
      commission: 0.1, // 10% first month
      category: 'cloud_ai',
    });
  }

  static getInstance(): AffiliateManager {
    if (!AffiliateManager.instance) {
      AffiliateManager.instance = new AffiliateManager();
    }
    return AffiliateManager.instance;
  }

  addProgram(program: AffiliateProgram) {
    this.programs.set(program.name, program);
    logger.info(`Added affiliate program: ${program.name}`);
  }

  async generateAffiliateLink(url: string, programName: string): Promise<AffiliateLink> {
    const program = this.programs.get(programName);
    if (!program) {
      throw new Error(`Affiliate program ${programName} not found`);
    }

    try {
      // Generate real affiliate link based on program
      let affiliateUrl = '';
      if (programName === 'jasper') {
        affiliateUrl = `${url}?fpr=${program.affiliateId}`;
      } else if (programName === 'midjourney') {
        affiliateUrl = `${url}?ref=${program.affiliateId}`;
      } else if (programName === 'amazon_aws') {
        affiliateUrl = `${url}?tag=${program.affiliateId}`;
      }

      const link: AffiliateLink = {
        originalUrl: url,
        affiliateUrl,
        program: programName,
        potentialCommission: program.commission,
      };

      // Track potential revenue
      await this.revenueTracker.trackOpportunity({
        source: programName,
        value: program.commission * 100, // Assuming $100 average sale
        probability: 0.05, // 5% conversion rate
        category: program.category,
      });

      return link;
    } catch (error) {
      logger.error('Error generating affiliate link', error);
      throw error;
    }
  }

  async getActivePrograms(): Promise<AffiliateProgram[]> {
    return Array.from(this.programs.values());
  }

  async getRevenueStats(): Promise<any> {
    return this.revenueTracker.getStats();
  }
}
