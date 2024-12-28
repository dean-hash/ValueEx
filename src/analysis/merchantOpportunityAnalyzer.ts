import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, groupBy } from 'rxjs/operators';

interface DemandPattern {
  category: string;
  pricePoint: {
    min: number;
    max: number;
    optimal: number;
  };
  urgency: number; // 0-1
  frequency: number; // Occurrences per week
  conversion: {
    potential: number; // Estimated conversion rate
    value: number; // Average transaction value
  };
}

interface MerchantOpportunity {
  merchantId: string;
  name: string;
  category: string;
  commission: {
    rate: number;
    type: 'percentage' | 'fixed';
    tiers?: { [volume: string]: number };
  };
  products: {
    priceRange: { min: number; max: number };
    categories: string[];
    uniqueValue: string[]; // Competitive advantages
  };
  requirements: {
    traffic?: number;
    sales?: number;
    platform?: string[];
  };
}

interface OpportunityScore {
  merchant: MerchantOpportunity;
  score: number;
  matchedDemand: DemandPattern[];
  potentialRevenue: number;
  implementationEffort: number; // 1-10
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class MerchantOpportunityAnalyzer {
  private demandPatterns = new BehaviorSubject<DemandPattern[]>([]);
  private knownMerchants = new Map<string, MerchantOpportunity>();
  private opportunityScores = new Map<string, OpportunityScore>();

  constructor() {
    this.initializeAnalysis();
  }

  private initializeAnalysis() {
    // Monitor demand patterns for significant changes
    this.demandPatterns.subscribe((patterns) => {
      this.updateOpportunityScores(patterns);
    });
  }

  public addDemandPattern(pattern: DemandPattern) {
    const current = this.demandPatterns.value;
    const updated = [...current, pattern];
    this.demandPatterns.next(updated);
  }

  public analyzeMerchant(merchant: MerchantOpportunity): OpportunityScore {
    const matchedPatterns = this.findMatchingDemandPatterns(merchant);
    const score = this.calculateOpportunityScore(merchant, matchedPatterns);
    const revenue = this.estimatePotentialRevenue(merchant, matchedPatterns);
    const effort = this.estimateImplementationEffort(merchant);

    const opportunityScore: OpportunityScore = {
      merchant,
      score,
      matchedDemand: matchedPatterns,
      potentialRevenue: revenue,
      implementationEffort: effort,
      priority: this.determinePriority(score, revenue, effort),
    };

    this.opportunityScores.set(merchant.merchantId, opportunityScore);
    return opportunityScore;
  }

  private findMatchingDemandPatterns(merchant: MerchantOpportunity): DemandPattern[] {
    return this.demandPatterns.value.filter((pattern) => {
      // Category match
      const categoryMatch = merchant.products.categories.some(
        (cat) => cat.toLowerCase() === pattern.category.toLowerCase()
      );

      // Price range overlap
      const priceMatch =
        merchant.products.priceRange.min <= pattern.pricePoint.max &&
        merchant.products.priceRange.max >= pattern.pricePoint.min;

      return categoryMatch && priceMatch;
    });
  }

  private calculateOpportunityScore(
    merchant: MerchantOpportunity,
    patterns: DemandPattern[]
  ): number {
    if (patterns.length === 0) return 0;

    const scores = patterns.map((pattern) => {
      let score = 0;

      // Commission potential
      score += this.normalizeCommission(merchant.commission) * 0.3;

      // Demand strength
      score += pattern.frequency * pattern.conversion.potential * 0.3;

      // Price point alignment
      score += this.calculatePriceAlignment(merchant.products.priceRange, pattern.pricePoint) * 0.2;

      // Unique value propositions
      score += (merchant.products.uniqueValue.length / 5) * 0.2;

      return score;
    });

    return scores.reduce((sum, score) => sum + score, 0) / patterns.length;
  }

  private normalizeCommission(commission: MerchantOpportunity['commission']): number {
    if (commission.type === 'percentage') {
      return commission.rate / 100;
    } else {
      // Convert fixed commission to approximate percentage
      return commission.rate / 50; // Assuming $50 average order value
    }
  }

  private calculatePriceAlignment(
    merchantRange: { min: number; max: number },
    demandPoint: DemandPattern['pricePoint']
  ): number {
    const overlap =
      Math.min(merchantRange.max, demandPoint.max) - Math.max(merchantRange.min, demandPoint.min);
    const range = demandPoint.max - demandPoint.min;
    return Math.max(0, overlap / range);
  }

  private estimatePotentialRevenue(
    merchant: MerchantOpportunity,
    patterns: DemandPattern[]
  ): number {
    return patterns.reduce((total, pattern) => {
      const monthlyTransactions = pattern.frequency * 4 * pattern.conversion.potential;
      const averageCommission =
        this.normalizeCommission(merchant.commission) * pattern.conversion.value;
      return total + monthlyTransactions * averageCommission;
    }, 0);
  }

  private estimateImplementationEffort(merchant: MerchantOpportunity): number {
    let effort = 5; // Base effort

    // Adjust based on requirements
    if (merchant.requirements.traffic) effort += 1;
    if (merchant.requirements.sales) effort += 1;
    if (merchant.requirements.platform?.length) effort += merchant.requirements.platform.length;

    return Math.min(10, effort);
  }

  private determinePriority(
    score: number,
    revenue: number,
    effort: number
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    const roi = (score * revenue) / effort;
    if (roi > 1000) return 'HIGH';
    if (roi > 500) return 'MEDIUM';
    return 'LOW';
  }

  public getTopOpportunities(limit: number = 10): OpportunityScore[] {
    return Array.from(this.opportunityScores.values())
      .sort((a, b) => {
        // Prioritize high ROI opportunities
        const roiA = (a.score * a.potentialRevenue) / a.implementationEffort;
        const roiB = (b.score * b.potentialRevenue) / b.implementationEffort;
        return roiB - roiA;
      })
      .slice(0, limit);
  }

  public generateOpportunityReport(): string {
    const opportunities = this.getTopOpportunities();
    let report = '# Merchant Opportunity Analysis\n\n';

    opportunities.forEach((opp, index) => {
      report += `## ${index + 1}. ${opp.merchant.name}\n`;
      report += `Priority: ${opp.priority}\n`;
      report += `Potential Monthly Revenue: $${opp.potentialRevenue.toFixed(2)}\n`;
      report += `Implementation Effort: ${opp.implementationEffort}/10\n`;
      report += `Matched Demand Patterns: ${opp.matchedDemand.length}\n\n`;

      report += '### Key Demand Matches:\n';
      opp.matchedDemand.forEach((pattern) => {
        report += `- ${pattern.category}: $${pattern.pricePoint.min}-${pattern.pricePoint.max}\n`;
        report += `  Frequency: ${pattern.frequency} times/week\n`;
        report += `  Potential Conversion: ${(pattern.conversion.potential * 100).toFixed(1)}%\n\n`;
      });

      report += '---\n\n';
    });

    return report;
  }
}
