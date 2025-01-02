interface MerchantProfile {
  networkId: string; // 'awin' | 'fiverr'
  merchantId: string;
  name: string;
  categories: string[];
  commissionStructure: {
    base: number;
    tiered?: { [volume: string]: number };
    special?: string;
    notes?: string;
  };
  requirements?: string[];
  status: 'active' | 'pending' | 'target';
  notes: string;
}

interface CategoryAnalysis {
  name: string;
  totalMerchants: number;
  avgCommission: number;
  topMerchants: string[];
  marketGaps: string[];
}

export class MerchantAnalyzer {
  private merchants: Map<string, MerchantProfile> = new Map();
  private categoryInsights: Map<string, CategoryAnalysis> = new Map();

  constructor() {
    this.initializeKnownMerchants();
  }

  private initializeKnownMerchants() {
    // Add Fiverr
    this.addMerchant({
      networkId: 'fiverr',
      merchantId: 'fiverr_main',
      name: 'Fiverr',
      categories: ['services', 'freelance', 'digital'],
      commissionStructure: {
        base: 30,
        notes: 'First-time buyer CPA commission',
      },
      status: 'active',
      notes: 'Strong in digital services, established integration',
    });

    // We'll add Awin merchants as we discover them
  }

  public addMerchant(profile: MerchantProfile) {
    this.merchants.set(profile.merchantId, profile);
    this.updateCategoryAnalysis(profile);
  }

  public getMerchantsByCategory(category: string): MerchantProfile[] {
    return Array.from(this.merchants.values()).filter((m) => m.categories.includes(category));
  }

  public getHighValueMerchants(): MerchantProfile[] {
    return Array.from(this.merchants.values()).filter((m) => this.calculateMerchantValue(m) > 7);
  }

  private calculateMerchantValue(merchant: MerchantProfile): number {
    let score = 0;

    // Base commission weight
    score += merchant.commissionStructure.base * 0.5;

    // Category coverage
    score += merchant.categories.length * 0.3;

    // Status bonus
    if (merchant.status === 'active') score += 2;

    return score;
  }

  public generateActionableInsights(): string[] {
    const insights: string[] = [];

    // Category gaps
    this.categoryInsights.forEach((analysis, category) => {
      if (analysis.totalMerchants < 3) {
        insights.push(`Need more merchants in ${category} category`);
      }
    });

    // Commission opportunities
    const highValue = this.getHighValueMerchants();
    if (highValue.length < 5) {
      insights.push('Priority: Identify high-commission merchants');
    }

    return insights;
  }

  public async analyzeAwinMerchant(merchantId: string): Promise<void> {
    // TODO: Integrate with Awin API to fetch merchant details
    // For now, we'll manually add merchants as we discover them
  }

  public exportMerchantReport(): string {
    let report = '# Merchant Network Analysis\n\n';

    // Active Merchants
    report += '## Active Merchants\n';
    const active = Array.from(this.merchants.values()).filter((m) => m.status === 'active');
    active.forEach((m) => {
      report += `- ${m.name} (${m.networkId})\n`;
      report += `  Categories: ${m.categories.join(', ')}\n`;
      report += `  Base Commission: ${m.commissionStructure.base}%\n\n`;
    });

    // Opportunities
    report += '## Opportunities\n';
    const insights = this.generateActionableInsights();
    insights.forEach((insight) => {
      report += `- ${insight}\n`;
    });

    return report;
  }
}
