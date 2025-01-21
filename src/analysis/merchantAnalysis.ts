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
  services?: {
    name: string;
    value: number;
  }[];
}

interface CategoryAnalysis {
  name: string;
  totalMerchants: number;
  avgCommission: number;
  topMerchants: string[];
  marketGaps: string[];
}

interface CategoryPattern {
  category: string;
  merchantCount: number;
  averageCommission: number;
  subPatterns: SubCategoryPattern[];
  servicePatterns: ServicePattern[];
  resonanceScore: number;
}

interface SubCategoryPattern {
  name: string;
  merchantCount: number;
  resonanceScore: number;
  parentResonance: number;
  harmonic: number;
}

interface ServicePattern {
  name: string;
  frequency: number;
  categoryResonance: number;
  serviceResonance: number;
  coherence: number;
}

interface ServiceContext {
  service: {
    name: string;
    value: number;
  };
  merchant: MerchantProfile;
  categoryContext: string[];
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

  private updateCategoryAnalysis(profile: MerchantProfile) {
    profile.categories.forEach((category) => {
      const analysis = this.categoryInsights.get(category) || {
        name: category,
        totalMerchants: 0,
        avgCommission: 0,
        topMerchants: [],
        marketGaps: [],
      };

      // Update metrics
      analysis.totalMerchants++;

      // Update average commission
      const currentTotal = analysis.avgCommission * (analysis.totalMerchants - 1);
      analysis.avgCommission =
        (currentTotal + profile.commissionStructure.base) / analysis.totalMerchants;

      // Update top merchants if high value
      if (this.calculateMerchantValue(profile) > 7) {
        if (!analysis.topMerchants.includes(profile.name)) {
          analysis.topMerchants.push(profile.name);
        }
      }

      this.categoryInsights.set(category, analysis);
    });
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

  public analyzeCategoryPatterns(merchants: MerchantProfile[]): CategoryPattern[] {
    const patterns: CategoryPattern[] = [];

    // First level: Major categories
    const majorCategories = this.groupByMajorCategory(merchants);

    for (const [category, categoryMerchants] of majorCategories) {
      // Second level: Sub-categories
      const subPatterns = this.analyzeSubCategories(categoryMerchants);

      // Third level: Service patterns
      const servicePatterns = this.analyzeServicePatterns(categoryMerchants);

      patterns.push({
        category,
        merchantCount: categoryMerchants.length,
        averageCommission: this.calculateAverageCommission(categoryMerchants),
        subPatterns,
        servicePatterns,
        resonanceScore: this.calculateCategoryResonance(categoryMerchants),
      });
    }

    return patterns.sort((a, b) => b.resonanceScore - a.resonanceScore);
  }

  private calculateCategoryResonance(merchants: MerchantProfile[]): number {
    if (merchants.length === 0) return 0;

    // Base resonance from merchant count (logarithmic scaling)
    const countResonance = Math.log(merchants.length + 1) / Math.log(10);

    // Commission harmony (how well commission structures align)
    const avgCommission = this.calculateAverageCommission(merchants);
    const commissionVariance =
      merchants.reduce(
        (acc, m) => acc + Math.pow(m.commissionStructure.base - avgCommission, 2),
        0
      ) / merchants.length;
    const commissionHarmony = 1 / (1 + Math.sqrt(commissionVariance));

    // Service coherence (how well services complement each other)
    const serviceCoherence =
      merchants.reduce((acc, m) => acc + (m.services?.length || 0), 0) / (merchants.length * 3); // Normalize by expected service count

    // Combine factors with golden ratio weighting
    const φ = (1 + Math.sqrt(5)) / 2;
    return (countResonance + φ * commissionHarmony + serviceCoherence) / (1 + φ + 1);
  }

  private groupByMajorCategory(merchants: MerchantProfile[]): Map<string, MerchantProfile[]> {
    const majorCategories: Map<string, MerchantProfile[]> = new Map();

    merchants.forEach((merchant) => {
      const majorCategory = merchant.categories[0];

      if (!majorCategories.has(majorCategory)) {
        majorCategories.set(majorCategory, []);
      }

      const categoryMerchants = majorCategories.get(majorCategory);
      if (categoryMerchants) {
        categoryMerchants.push(merchant);
      }
    });

    return majorCategories;
  }

  private analyzeSubCategories(merchants: MerchantProfile[]): SubCategoryPattern[] {
    const subCategories = new Map<string, MerchantProfile[]>();

    // Group by sub-categories while maintaining connection to parent
    merchants.forEach((merchant) => {
      merchant.categories.slice(1).forEach((subCategory) => {
        if (!subCategories.has(subCategory)) {
          subCategories.set(subCategory, []);
        }
        const subCategoryMerchants = subCategories.get(subCategory);
        if (subCategoryMerchants) {
          subCategoryMerchants.push(merchant);
        }
      });
    });

    // Analyze each sub-category while maintaining parent context
    return Array.from(subCategories.entries()).map(([subCategory, merchantGroup]) => ({
      name: subCategory,
      merchantCount: merchantGroup.length,
      resonanceScore: this.calculateCategoryResonance(merchantGroup),
      parentResonance: this.calculateCategoryResonance(merchants),
      harmonic: this.calculateHarmonicAlignment(merchantGroup, merchants),
    }));
  }

  private analyzeServicePatterns(merchants: MerchantProfile[]): ServicePattern[] {
    // Extract service patterns while maintaining category context
    const services = merchants.flatMap((merchant) =>
      merchant.services && merchant.services.length > 0
        ? merchant.services.map((service) => ({
            service,
            merchant,
            categoryContext: merchant.categories,
          }))
        : []
    );

    // Group similar services
    const patterns = new Map<string, ServiceContext[]>();
    services.forEach(({ service, merchant, categoryContext }) => {
      const key = this.normalizeServiceName(service.name);
      if (!patterns.has(key)) {
        patterns.set(key, []);
      }
      const contextList = patterns.get(key);
      if (contextList) {
        contextList.push({ service, merchant, categoryContext });
      }
    });

    // Analyze patterns with both vertical (category) and horizontal (service) resonance
    return Array.from(patterns.entries()).map(([key, contexts]) => ({
      name: key,
      frequency: contexts.length,
      categoryResonance: this.calculateCrossContextResonance(contexts),
      serviceResonance: this.calculateServiceResonance(contexts),
      coherence: this.calculatePatternCoherence(contexts),
    }));
  }

  private calculateHarmonicAlignment(
    subGroup: MerchantProfile[],
    parentGroup: MerchantProfile[]
  ): number {
    const subFreq = this.calculateCategoryResonance(subGroup);
    const parentFreq = this.calculateCategoryResonance(parentGroup);

    // Check if sub-pattern frequency aligns with parent harmonics
    return Math.cos((subFreq / parentFreq) * Math.PI * 2);
  }

  private calculateCrossContextResonance(contexts: ServiceContext[]): number {
    const categoryFrequencies = contexts.map((ctx) =>
      this.calculateCategoryResonance([ctx.merchant])
    );

    // Find resonance across different category contexts
    return categoryFrequencies.reduce((acc, freq) => acc + freq, 0) / categoryFrequencies.length;
  }

  private calculateServiceResonance(contexts: ServiceContext[]): number {
    const baseFreq = 432;
    const avgValue = contexts.reduce((acc, ctx) => acc + ctx.service.value, 0) / contexts.length;

    return (avgValue * Math.log(contexts.length + 1)) / baseFreq;
  }

  private calculatePatternCoherence(contexts: ServiceContext[]): number {
    const categoryAlignment = this.calculateCrossContextResonance(contexts);
    const serviceAlignment = this.calculateServiceResonance(contexts);

    // Measure how well service patterns align across categories
    return Math.min(1, (categoryAlignment * serviceAlignment) / (432 * 432));
  }

  private normalizeServiceName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '_');
  }

  private calculateAverageCommission(merchants: MerchantProfile[]): number {
    const totalCommission = merchants.reduce(
      (acc, merchant) => acc + merchant.commissionStructure.base,
      0
    );

    return totalCommission / merchants.length;
  }
}
