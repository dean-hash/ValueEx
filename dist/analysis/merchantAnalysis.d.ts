interface MerchantProfile {
  networkId: string;
  merchantId: string;
  name: string;
  categories: string[];
  commissionStructure: {
    base: number;
    tiered?: {
      [volume: string]: number;
    };
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
export declare class MerchantAnalyzer {
  private merchants;
  private categoryInsights;
  constructor();
  private initializeKnownMerchants;
  addMerchant(profile: MerchantProfile): void;
  getMerchantsByCategory(category: string): MerchantProfile[];
  getHighValueMerchants(): MerchantProfile[];
  private calculateMerchantValue;
  private updateCategoryAnalysis;
  generateActionableInsights(): string[];
  analyzeAwinMerchant(merchantId: string): Promise<void>;
  exportMerchantReport(): string;
  analyzeCategoryPatterns(merchants: MerchantProfile[]): CategoryPattern[];
  private calculateCategoryResonance;
  private groupByMajorCategory;
  private analyzeSubCategories;
  private analyzeServicePatterns;
  private calculateHarmonicAlignment;
  private calculateCrossContextResonance;
  private calculateServiceResonance;
  private calculatePatternCoherence;
  private normalizeServiceName;
  private calculateAverageCommission;
}
export {};
