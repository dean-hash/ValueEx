import axios from 'axios';

interface DomainAnalysis {
  domain: string;
  seoValue: number;
  marketDemand: number;
  affiliateFit: number;
  keywords: string[];
  tld: string;
  length: number;
}

export class DomainAnalyzer {
  private static instance: DomainAnalyzer;
  private cachedAnalyses: Map<string, DomainAnalysis>;

  constructor() {
    this.cachedAnalyses = new Map();
  }

  public static getInstance(): DomainAnalyzer {
    if (!DomainAnalyzer.instance) {
      DomainAnalyzer.instance = new DomainAnalyzer();
    }
    return DomainAnalyzer.instance;
  }

  async analyzeDomain(domain: string): Promise<DomainAnalysis> {
    // Check cache first
    if (this.cachedAnalyses.has(domain)) {
      return this.cachedAnalyses.get(domain)!;
    }

    const domainParts = domain.split('.');
    const name = domainParts[0];
    const tld = domainParts[domainParts.length - 1];

    // Calculate SEO value based on domain characteristics
    const seoValue = this.calculateSEOValue(name, tld);

    // Calculate market demand based on TLD and keywords
    const marketDemand = this.calculateMarketDemand(name, tld);

    // Calculate affiliate marketing potential
    const affiliateFit = this.calculateAffiliateFit(name, tld);

    // Extract relevant keywords
    const keywords = this.extractKeywords(name);

    const analysis: DomainAnalysis = {
      domain,
      seoValue,
      marketDemand,
      affiliateFit,
      keywords,
      tld,
      length: name.length,
    };

    // Cache the analysis
    this.cachedAnalyses.set(domain, analysis);

    return analysis;
  }

  private calculateSEOValue(name: string, tld: string): number {
    let score = 0;

    // Length factor (shorter domains generally better for SEO)
    score += Math.max(0, (15 - name.length) / 15);

    // TLD value
    const tldScores: { [key: string]: number } = {
      com: 1.0,
      org: 0.9,
      net: 0.8,
      ai: 0.95,
      io: 0.85,
    };
    score += tldScores[tld] || 0.5;

    // Keyword richness
    const keywords = this.extractKeywords(name);
    score += Math.min(1, keywords.length * 0.2);

    // Memorability factor
    score += this.calculateMemorabilityScore(name);

    // Normalize to 0-1 range
    return Math.min(1, score / 4);
  }

  private calculateMarketDemand(name: string, tld: string): number {
    let score = 0;

    // TLD market value
    const tldDemand: { [key: string]: number } = {
      ai: 0.95,
      com: 0.9,
      io: 0.85,
      org: 0.8,
      net: 0.75,
    };
    score += tldDemand[tld] || 0.5;

    // Industry/niche value
    const keywords = this.extractKeywords(name);
    const highValueKeywords = new Set([
      'ai',
      'tech',
      'crypto',
      'nft',
      'meta',
      'cloud',
      'data',
      'eco',
      'green',
      'health',
    ]);

    keywords.forEach((keyword) => {
      if (highValueKeywords.has(keyword)) {
        score += 0.3;
      }
    });

    // Length value (shorter generally more valuable)
    score += Math.max(0, (10 - name.length) / 10);

    // Normalize to 0-1 range
    return Math.min(1, score / 2.5);
  }

  private calculateAffiliateFit(name: string, tld: string): number {
    let score = 0;

    // Extract keywords
    const keywords = this.extractKeywords(name);

    // Check for commercial/affiliate-friendly keywords
    const affiliateKeywords = new Set([
      'shop',
      'store',
      'buy',
      'deal',
      'price',
      'review',
      'best',
      'top',
      'compare',
      'save',
    ]);

    keywords.forEach((keyword) => {
      if (affiliateKeywords.has(keyword)) {
        score += 0.3;
      }
    });

    // TLD affiliate-friendliness
    const tldScores: { [key: string]: number } = {
      com: 1.0,
      shop: 0.9,
      store: 0.9,
      deals: 0.8,
    };
    score += tldScores[tld] || 0.5;

    // Normalize to 0-1 range
    return Math.min(1, score / 2);
  }

  private extractKeywords(name: string): string[] {
    // Split by common separators
    const parts = name.toLowerCase().split(/[-_]/);

    // For each part, try to extract meaningful keywords
    const keywords = new Set<string>();

    parts.forEach((part) => {
      // Common word boundaries in domain names
      const words = part.match(/[a-z]+/g) || [];
      words.forEach((word) => keywords.add(word));
    });

    return Array.from(keywords);
  }

  private calculateMemorabilityScore(name: string): number {
    let score = 0;

    // Length factor (shorter names more memorable)
    score += Math.max(0, (12 - name.length) / 12);

    // Pronounceability (simple approximation)
    const vowelCount = (name.match(/[aeiou]/gi) || []).length;
    const vowelRatio = vowelCount / name.length;
    if (vowelRatio >= 0.2 && vowelRatio <= 0.5) {
      score += 0.5;
    }

    // No numbers is generally more memorable
    if (!/\d/.test(name)) {
      score += 0.3;
    }

    return Math.min(1, score);
  }
}
