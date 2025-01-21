import { DomainInfo } from '../domain/types';
import { logger } from '../../utils/logger';
import { GeminiService } from '../ai/geminiService';

export interface DomainAnalysis {
  domain: string;
  quickFlipValue: number;
  affiliateValue: number;
  recommendations: string[];
  aiInsights: {
    marketTrends: string;
    valueOptimization: string;
    suggestedPrice?: number;
  };
  metrics: {
    seoValue: number;
    brandValue: number;
    marketDemand: number;
    conversionPotential: number;
  };
}

export class DomainAnalyzer {
  private static instance: DomainAnalyzer;
  private gemini: GeminiService;

  private constructor() {
    this.gemini = GeminiService.getInstance();
  }

  public static getInstance(): DomainAnalyzer {
    if (!DomainAnalyzer.instance) {
      DomainAnalyzer.instance = new DomainAnalyzer();
    }
    return DomainAnalyzer.instance;
  }

  public async analyzeDomain(domain: DomainInfo): Promise<DomainAnalysis> {
    const analysis: DomainAnalysis = {
      domain: domain.domain,
      quickFlipValue: 0,
      affiliateValue: 0,
      recommendations: [],
      aiInsights: {
        marketTrends: '',
        valueOptimization: ''
      },
      metrics: {
        seoValue: 0,
        brandValue: 0,
        marketDemand: 0,
        conversionPotential: 0,
      },
    };

    // Calculate base metrics
    analysis.metrics.seoValue = this.calculateSEOValue(domain.domain);
    analysis.metrics.brandValue = this.calculateBrandValue(domain.domain);
    analysis.metrics.marketDemand = this.calculateMarketDemand(domain.domain);
    analysis.metrics.conversionPotential = this.calculateConversionPotential(domain.domain);

    // Get AI insights
    try {
      const [marketTrends, valueOptimization] = await Promise.all([
        this.gemini.analyzeMarketTrends(this.extractNiche(domain.domain)),
        this.gemini.optimizeDomainValue(domain.domain)
      ]);

      analysis.aiInsights = {
        marketTrends,
        valueOptimization,
        suggestedPrice: this.extractPriceFromAIInsights(valueOptimization)
      };

      // Adjust values based on AI insights
      const aiValueMultiplier = this.calculateAIValueMultiplier(analysis.aiInsights);
      analysis.quickFlipValue = this.calculateQuickFlipValue(analysis.metrics) * aiValueMultiplier;
      analysis.affiliateValue = this.calculateAffiliateValue(analysis.metrics) * aiValueMultiplier;
    } catch (error) {
      logger.warn('AI insights unavailable, using base calculations:', error);
      analysis.quickFlipValue = this.calculateQuickFlipValue(analysis.metrics);
      analysis.affiliateValue = this.calculateAffiliateValue(analysis.metrics);
    }

    // Generate recommendations
    analysis.recommendations = await this.generateRecommendations(analysis);

    return analysis;
  }

  private extractNiche(domain: string): string {
    // Extract likely niche from domain name
    const words = domain.split(/[.-]/);
    const commonNiches = ['tech', 'finance', 'health', 'education', 'ecommerce'];
    
    for (const word of words) {
      const niche = commonNiches.find(n => word.toLowerCase().includes(n));
      if (niche) return niche;
    }

    return 'general';
  }

  private extractPriceFromAIInsights(insights: string): number | undefined {
    try {
      // Look for price mentions in the AI response
      const priceMatch = insights.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
      if (priceMatch) {
        return parseFloat(priceMatch[1].replace(/,/g, ''));
      }
      return undefined;
    } catch (error) {
      logger.warn('Failed to extract price from AI insights:', error);
      return undefined;
    }
  }

  private calculateAIValueMultiplier(aiInsights: DomainAnalysis['aiInsights']): number {
    let multiplier = 1;

    // Positive signals in market trends
    if (aiInsights.marketTrends.toLowerCase().includes('growing market')) multiplier += 0.2;
    if (aiInsights.marketTrends.toLowerCase().includes('high demand')) multiplier += 0.3;
    if (aiInsights.marketTrends.toLowerCase().includes('emerging trend')) multiplier += 0.4;

    // Positive signals in value optimization
    if (aiInsights.valueOptimization.toLowerCase().includes('premium')) multiplier += 0.3;
    if (aiInsights.valueOptimization.toLowerCase().includes('unique')) multiplier += 0.2;
    if (aiInsights.valueOptimization.toLowerCase().includes('brand potential')) multiplier += 0.3;

    return multiplier;
  }

  private calculateSEOValue(domain: string): number {
    let value = 0;

    // Length factor (shorter is better)
    value += Math.max(0, 1 - domain.length / 20);

    // Keywords in domain
    const keywords = domain.split(/[.-]/);
    value += keywords.length * 0.2;

    // TLD value
    const tld = domain.split('.').pop() || '';
    if (['com', 'org', 'net'].includes(tld)) value += 0.3;
    if (['ai', 'io', 'tech'].includes(tld)) value += 0.4;

    return Math.min(1, value);
  }

  private calculateBrandValue(domain: string): number {
    let value = 0;

    // Memorability (shorter names are more memorable)
    value += Math.max(0, 1 - domain.length / 15);

    // No numbers or hyphens
    if (!/[\d-]/.test(domain)) value += 0.3;

    // Common word combinations
    const words = domain.split(/[.-]/);
    if (words.length <= 2) value += 0.2;

    return Math.min(1, value);
  }

  private calculateMarketDemand(domain: string): number {
    let value = 0;

    // Tech/AI domains are hot
    if (domain.includes('ai') || domain.includes('tech')) value += 0.4;

    // Digital/crypto domains
    if (domain.includes('digital') || domain.includes('crypto')) value += 0.3;

    // Business/finance domains
    if (domain.includes('business') || domain.includes('finance')) value += 0.3;

    return Math.min(1, value);
  }

  private calculateConversionPotential(domain: string): number {
    let value = 0;

    // Trust factors
    if (domain.includes('secure') || domain.includes('trust')) value += 0.2;

    // Action words
    if (domain.includes('buy') || domain.includes('shop')) value += 0.3;

    // Industry specific
    if (domain.includes('market') || domain.includes('store')) value += 0.2;

    return Math.min(1, value);
  }

  private calculateQuickFlipValue(metrics: DomainAnalysis['metrics']): number {
    // Base value
    let value = 500;

    // Multiply by metrics
    value *= 1 + metrics.seoValue;
    value *= 1 + metrics.brandValue;
    value *= 1 + metrics.marketDemand;

    // Round to nearest 100
    return Math.round(value / 100) * 100;
  }

  private calculateAffiliateValue(metrics: DomainAnalysis['metrics']): number {
    // Monthly potential
    let value = 1000;

    // Multiply by conversion potential
    value *= 1 + metrics.conversionPotential;

    // Multiply by SEO value
    value *= 1 + metrics.seoValue;

    // Round to nearest 50
    return Math.round(value / 50) * 50;
  }

  private async generateRecommendations(analysis: DomainAnalysis): Promise<string[]> {
    const recommendations: string[] = [];

    if (analysis.quickFlipValue > analysis.affiliateValue * 12) {
      recommendations.push('Consider quick flip - high immediate value potential');
    } else {
      recommendations.push('Better suited for affiliate revenue - set up landing pages');
    }

    if (analysis.metrics.seoValue > 0.7) {
      recommendations.push('High SEO value - prioritize content development');
    }

    if (analysis.metrics.conversionPotential > 0.6) {
      recommendations.push('Strong conversion potential - focus on affiliate products');
    }

    if (analysis.metrics.brandValue > 0.8) {
      recommendations.push('Excellent brand potential - consider long-term development');
    }

    return recommendations;
  }
}
