import { DemandSignal } from '../adapters/demandSignalAdapter';

interface BehaviorData {
  searches: string[];
  viewedItems: string[];
}

interface InferenceResult {
  type: string;
  confidence: number;
  keywords: string[];
  categories: string[];
}

export class DemandInference {
  private readonly confidenceThreshold = 0.7;
  private readonly minKeywords = 3;
  private readonly maxSignals = 10;

  async inferFromBehavior(data: BehaviorData): Promise<DemandSignal[]> {
    const inferences: InferenceResult[] = [];

    // Analyze search patterns
    if (data.searches.length >= this.minKeywords) {
      const searchInference = this.analyzeSearchPatterns(data.searches);
      if (searchInference.confidence >= this.confidenceThreshold) {
        inferences.push(searchInference);
      }
    }

    // Analyze viewed items
    if (data.viewedItems.length > 0) {
      const viewInference = this.analyzeViewingPatterns(data.viewedItems);
      if (viewInference.confidence >= this.confidenceThreshold) {
        inferences.push(viewInference);
      }
    }

    // Convert inferences to signals
    return this.convertToSignals(inferences);
  }

  private analyzeSearchPatterns(searches: string[]): InferenceResult {
    const keywords = this.extractRelevantKeywords(searches);
    const categories = this.categorizeKeywords(keywords);

    return {
      type: 'search_pattern',
      confidence: this.calculateConfidence(keywords.length, categories.length),
      keywords,
      categories,
    };
  }

  private analyzeViewingPatterns(items: string[]): InferenceResult {
    const categories = this.categorizeItems(items);
    const keywords = this.extractKeywordsFromCategories(categories);

    return {
      type: 'viewing_pattern',
      confidence: this.calculateConfidence(keywords.length, categories.length),
      keywords,
      categories,
    };
  }

  private extractRelevantKeywords(searches: string[]): string[] {
    return [
      ...new Set(
        searches
          .flatMap((search) => search.toLowerCase().split(/\s+/))
          .filter((word) => word.length > 2)
      ),
    ];
  }

  private categorizeKeywords(keywords: string[]): string[] {
    // Simplified categorization - in real implementation, use ML model
    return [
      ...new Set(keywords.map((keyword) => this.findCategory(keyword)).filter(Boolean) as string[]),
    ];
  }

  private findCategory(keyword: string): string | null {
    // Placeholder - replace with actual category mapping logic
    const categoryMap: Record<string, string> = {
      price: 'financial',
      cost: 'financial',
      buy: 'purchase_intent',
      sell: 'sales_intent',
      compare: 'research',
      review: 'research',
    };

    return categoryMap[keyword] || null;
  }

  private categorizeItems(items: string[]): string[] {
    // Simplified categorization - in real implementation, use product taxonomy
    return [
      ...new Set(items.map((item) => this.extractMainCategory(item)).filter(Boolean) as string[]),
    ];
  }

  private extractMainCategory(item: string): string | null {
    // Placeholder - replace with actual category extraction logic
    const words = item.toLowerCase().split(/\s+/);
    return words[0] || null;
  }

  private extractKeywordsFromCategories(categories: string[]): string[] {
    // Simplified extraction - in real implementation, use category metadata
    return categories.flatMap((category) => category.split('_'));
  }

  private calculateConfidence(keywordCount: number, categoryCount: number): number {
    const keywordWeight = Math.min(keywordCount / this.minKeywords, 1);
    const categoryWeight = Math.min(categoryCount / 2, 1);

    return keywordWeight * 0.6 + categoryWeight * 0.4;
  }

  private convertToSignals(inferences: InferenceResult[]): DemandSignal[] {
    return inferences.slice(0, this.maxSignals).map((inference, index) => ({
      id: `inferred_${Date.now()}_${index}`,
      source: 'demand_inference',
      timestamp: Date.now(),
      type: 'inferred',
      confidence: inference.confidence,
      context: {
        keywords: inference.keywords,
        relatedCategories: inference.categories,
        sentiment: 0,
        urgency: 0.5,
      },
    }));
  }

  async consolidateSignals(signals: DemandSignal[]): Promise<DemandSignal[]> {
    // Group by source and type
    const groupedSignals = this.groupSignalsBySource(signals);

    // Consolidate each group
    return Object.values(groupedSignals).map((group) => this.mergeSignals(group));
  }

  private groupSignalsBySource(signals: DemandSignal[]): Record<string, DemandSignal[]> {
    return signals.reduce(
      (groups, signal) => {
        const key = `${signal.source}_${signal.type}`;
        groups[key] = groups[key] || [];
        groups[key].push(signal);
        return groups;
      },
      {} as Record<string, DemandSignal[]>
    );
  }

  private mergeSignals(signals: DemandSignal[]): DemandSignal {
    if (signals.length === 0) {
      throw new Error('Cannot merge empty signal array');
    }

    if (signals.length === 1) {
      return signals[0];
    }

    const base = signals[0];
    const mergedKeywords = new Set<string>();
    const mergedCategories = new Set<string>();
    let totalConfidence = 0;
    let totalSentiment = 0;
    let totalUrgency = 0;

    signals.forEach((signal) => {
      signal.context.keywords.forEach((k) => mergedKeywords.add(k));
      signal.context.relatedCategories.forEach((c) => mergedCategories.add(c));
      totalConfidence += signal.confidence;
      totalSentiment += signal.context.sentiment;
      totalUrgency += signal.context.urgency;
    });

    return {
      ...base,
      confidence: totalConfidence / signals.length,
      context: {
        ...base.context,
        keywords: Array.from(mergedKeywords),
        relatedCategories: Array.from(mergedCategories),
        sentiment: totalSentiment / signals.length,
        urgency: totalUrgency / signals.length,
      },
    };
  }
}
