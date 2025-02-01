import axios from 'axios';
import { UnifiedIntelligenceField } from '../../core/intelligence/unifiedIntelligenceField';
import type { DomainMetrics } from './types';

interface DomainAnalyzerConfig {
  awinApiKey: string;
  awinPublisherId: string;
  fiverr: {
    marketplaceLink: string;
    proLink: string;
    logoMakerLink: string;
    subAffiliatesLink: string;
  };
}

export class PortfolioAnalyzer {
  private intelligence: UnifiedIntelligenceField;
  private analyzer: DomainAnalyzer;

  private constructor(intelligence: UnifiedIntelligenceField, analyzer: DomainAnalyzer) {
    this.intelligence = intelligence;
    this.analyzer = analyzer;
  }

  public static async create(): Promise<PortfolioAnalyzer> {
    const intelligence = UnifiedIntelligenceField.getInstance();
    const analyzer = DomainAnalyzer.getInstance();
    return new PortfolioAnalyzer(intelligence, analyzer);
  }

  public async analyzeDomain(domain: string): Promise<DomainMetrics> {
    try {
      const resonance = await this.intelligence.getDomainResonance(domain);
      const analysis = await this.analyzer.analyzeDomain(domain);
      
      return {
        ...analysis,
        resonance,
        niche: analysis.niche || '',
        competitors: analysis.competitors || [],
        insights: analysis.insights || [],
      };
    } catch (error) {
      console.error(`Failed to analyze domain ${domain}:`, error);
      throw error;
    }
  }

  public async getDomains(): Promise<string[]> {
    try {
      return await this.analyzer.listDomains();
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      throw error;
    }
  }
}

class DomainAnalyzer {
  private static instance: DomainAnalyzer;
  private unifiedIntelligenceField: UnifiedIntelligenceField;

  private constructor() {
    this.unifiedIntelligenceField = UnifiedIntelligenceField.getInstance();
  }

  public static getInstance(): DomainAnalyzer {
    if (!DomainAnalyzer.instance) {
      DomainAnalyzer.instance = new DomainAnalyzer();
    }
    return DomainAnalyzer.instance;
  }

  public async analyzeDomain(domain: string): Promise<DomainMetrics> {
    const resonanceScore = this.unifiedIntelligenceField.getDomainResonance(domain);
    const awinData = await this.fetchAwinData(domain);

    return {
      domain,
      resonance: resonanceScore,
      affiliatePrograms: awinData.programs,
      potentialRevenue: awinData.revenue,
      lastUpdated: new Date(),
      affiliateLinks: {
        fiverr: {
          marketplace: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiverrmktplace',
          pro: 'https://go.fiverr.com/visit/?bta=1064652&brand=fp',
          logoMaker: 'https://go.fiverr.com/visit/?bta=1064652&brand=logomaker',
          subAffiliates: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiveraffiliates',
        },
        awin: awinData.links,
      },
    };
  }

  private async fetchAwinData(domain: string): Promise<{ programs: string[]; revenue: number; links: Record<string, string> }> {
    try {
      const response = await axios.get(
        `https://api.awin.com/publishers/${process.env.AWIN_PUBLISHER_ID}/programmes`,
        {
          headers: { Authorization: `Bearer ${process.env.AWIN_API_KEY}` },
          params: { domain },
        },
      );

      return {
        programs: response.data.programs || [],
        revenue: this.calculatePotentialRevenue(response.data),
        links: response.data.reduce((acc: Record<string, string>, program: { name: string; clickThroughUrl: string }) => {
          acc[program.name] = program.clickThroughUrl;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error('Error fetching Awin data:', error);
      return { programs: [], revenue: 0, links: {} };
    }
  }

  private calculatePotentialRevenue(_data: Record<string, unknown>): number {
    // Implementation will be added based on Awin's commission structure
    return 0;
  }

  public async listDomains(): Promise<string[]> {
    // Implementation will be added to list tracked domains
    return [];
  }
}
