import { DemandSignal } from '../../../types/mvp/demand';
import { EventEmitter } from 'events';
import * as natural from 'natural';
import { v4 as uuidv4 } from 'uuid';
import { MARKET_VERTICALS } from '../../../types/marketTypes';

interface BehaviorData {
  searches: string[];
  viewedItems: string[];
  interactions?: Array<{
    type: string;
    item: string;
    duration: number;
    timestamp: number;
  }>;
  context?: {
    location?: string;
    device?: string;
    timeOfDay?: string;
    previousActions?: string[];
  };
}

interface InferenceResult {
  type: string;
  confidence: number;
  keywords: string[];
  categories: string[];
  context: {
    urgency: number;
    sentiment: number;
    intent: string;
  };
}

interface DemandContext {
  market: string;
  category: string;
  priceRange: string;
  intent: string;
  urgency: number;
  volume: number;
  sentiment: number;
  categories: string[];
}

export class DemandInference extends EventEmitter {
  private readonly confidenceThreshold = 0.7;
  private readonly minKeywords = 3;
  private readonly maxSignals = 10;
  private readonly tokenizer: natural.WordTokenizer;
  private readonly tfidf: natural.TfIdf;
  private readonly classifier: natural.BayesClassifier;

  constructor() {
    super();
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.classifier = new natural.BayesClassifier();
    this.initializeClassifier();
  }

  public initializeClassifier(): void {
    // Initialize with some basic training data
    this.classifier.addDocument('buy now urgent need', 'immediate_purchase');
    this.classifier.addDocument('looking for best price', 'price_comparison');
    this.classifier.addDocument('research product details', 'research');
    this.classifier.addDocument('when will it be available', 'availability');
    this.classifier.addDocument('compare features specs', 'comparison');
    this.classifier.train();
  }

  async inferFromBehavior(data: BehaviorData): Promise<DemandSignal[]> {
    const inferences: InferenceResult[] = [];

    // Analyze search patterns
    if (data.searches.length >= this.minKeywords) {
      const searchInference = await this.analyzeSearchPatterns(data.searches);
      if (searchInference.confidence >= this.confidenceThreshold) {
        inferences.push(searchInference);
      }
    }

    // Analyze viewed items
    if (data.viewedItems.length > 0) {
      const viewInference = await this.analyzeViewingPatterns(data.viewedItems);
      if (viewInference.confidence >= this.confidenceThreshold) {
        inferences.push(viewInference);
      }
    }

    // Analyze interactions if available
    if (data.interactions?.length) {
      const interactionInference = await this.analyzeInteractions(data.interactions);
      if (interactionInference.confidence >= this.confidenceThreshold) {
        inferences.push(interactionInference);
      }
    }

    // Convert inferences to signals
    return inferences.flatMap((inference) => this.createSignal(inference, data));
  }

  private async analyzeSearchPatterns(searches: string[]): Promise<InferenceResult> {
    const keywords = this.extractRelevantKeywords(searches);
    const categories = await this.categorizeKeywords(keywords);
    const intent = this.classifier.classify(searches.join(' '));

    const urgency = this.calculateUrgency(searches);
    const sentiment = this.analyzeSentiment(searches);

    return {
      type: 'search_pattern',
      confidence: this.calculateConfidence(keywords.length, categories.length),
      keywords,
      categories,
      context: {
        urgency,
        sentiment,
        intent,
      },
    };
  }

  private async analyzeViewingPatterns(items: string[]): Promise<InferenceResult> {
    const keywords = this.extractRelevantKeywords(items);
    const categories = await this.categorizeKeywords(keywords);
    const intent = this.classifier.classify(items.join(' '));

    return {
      type: 'view_pattern',
      confidence: this.calculateConfidence(keywords.length, categories.length) * 0.8,
      keywords,
      categories,
      context: {
        urgency: 0.5,
        sentiment: 0,
        intent,
      },
    };
  }

  private async analyzeInteractions(
    interactions: BehaviorData['interactions']
  ): Promise<InferenceResult> {
    if (!interactions) return this.createEmptyInference();

    const totalDuration = interactions.reduce((sum, i) => sum + i.duration, 0);
    const avgDuration = totalDuration / interactions.length;
    const recentInteractions = interactions.filter(
      (i) => Date.now() - i.timestamp < 24 * 60 * 60 * 1000
    );

    const keywords = this.extractRelevantKeywords(interactions.map((i) => i.item));
    const categories = await this.categorizeKeywords(keywords);
    const intent = this.classifier.classify(interactions.map((i) => i.type).join(' '));

    return {
      type: 'interaction_pattern',
      confidence: this.calculateInteractionConfidence(avgDuration, recentInteractions.length),
      keywords,
      categories,
      context: {
        urgency: this.calculateInteractionUrgency(recentInteractions),
        sentiment: 0,
        intent,
      },
    };
  }

  private extractRelevantKeywords(texts: string[]): string[] {
    const tokens = texts.flatMap((text) => this.tokenizer.tokenize(text.toLowerCase()) || []);
    const uniqueTokens = [...new Set(tokens)];

    // Add documents to TF-IDF
    uniqueTokens.forEach((token) => this.tfidf.addDocument([token]));

    // Get top keywords by TF-IDF score
    return uniqueTokens
      .map((token) => ({ token, score: this.calculateTfIdfScore(token) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxSignals)
      .map((item) => item.token);
  }

  private async categorizeKeywords(keywords: string[]): Promise<string[]> {
    // In production, this would use a proper categorization service
    const categories = new Set<string>();
    keywords.forEach((keyword) => {
      if (keyword.includes('price') || keyword.includes('cost')) categories.add('pricing');
      if (keyword.includes('fast') || keyword.includes('quick')) categories.add('urgency');
      if (keyword.includes('compare') || keyword.includes('review')) categories.add('research');
    });
    return Array.from(categories);
  }

  private calculateConfidence(keywordCount: number, categoryCount: number): number {
    const keywordWeight = Math.min(keywordCount / this.minKeywords, 1);
    const categoryWeight = Math.min(categoryCount / 2, 1);
    return keywordWeight * 0.6 + categoryWeight * 0.4;
  }

  private calculateInteractionConfidence(avgDuration: number, recentCount: number): number {
    const durationWeight = Math.min(avgDuration / 60000, 1); // Max 1 minute
    const recentWeight = Math.min(recentCount / 5, 1); // Max 5 recent interactions
    return durationWeight * 0.7 + recentWeight * 0.3;
  }

  private calculateInteractionUrgency(
    recentInteractions: NonNullable<BehaviorData['interactions']>
  ): number {
    if (!recentInteractions?.length) return 0;
    const timeGaps = recentInteractions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, -1)
      .map((_, i) => recentInteractions[i].timestamp - recentInteractions[i + 1].timestamp);

    const avgGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
    return Math.max(0, 1 - avgGap / (60 * 60 * 1000)); // Higher urgency for shorter gaps
  }

  private calculateUrgency(searches: string[]): number {
    const urgentWords = ['urgent', 'immediate', 'quick', 'fast', 'asap'];
    const urgentCount = searches.filter((s) =>
      urgentWords.some((w) => s.toLowerCase().includes(w))
    ).length;
    return Math.min(urgentCount / searches.length, 1);
  }

  private analyzeSentiment(texts: string[]): number {
    // In production, this would use a proper sentiment analysis service
    const positiveWords = ['good', 'great', 'excellent', 'best', 'perfect'];
    const negativeWords = ['bad', 'poor', 'worst', 'terrible', 'awful'];

    let sentiment = 0;
    texts.forEach((text) => {
      const lower = text.toLowerCase();
      positiveWords.forEach((word) => {
        if (lower.includes(word)) sentiment += 0.2;
      });
      negativeWords.forEach((word) => {
        if (lower.includes(word)) sentiment -= 0.2;
      });
    });

    return Math.max(-1, Math.min(1, sentiment));
  }

  private createEmptyInference(): InferenceResult {
    return {
      type: 'empty',
      confidence: 0,
      keywords: [],
      categories: [],
      context: {
        urgency: 0,
        sentiment: 0,
        intent: 'unknown',
      },
    };
  }

  private createSignal(result: InferenceResult, behaviorData: BehaviorData): DemandSignal[] {
    const signal: DemandSignal = {
      id: uuidv4(),
      query: behaviorData.searches.join(' '),
      source: 'demand_inference',
      strength: result.confidence,
      vertical: MARKET_VERTICALS.electronics,
      insights: {
        keywords: result.keywords,
        context: result.context.intent,
        urgency: result.context.urgency,
        intent: result.context.intent,
        confidence: result.confidence,
        valueEvidence: {
          authenticityMarkers: [],
          realWorldImpact: [],
          practicalUtility: [],
        },
        demographics: [],
        priceRange: {
          min: 0,
          max: 0,
        },
        demandPatterns: {
          frequency: 0,
          consistency: 0,
          evidence: [],
        },
      },
      context: {
        market: '',
        category: '',
        priceRange: '',
        intent: result.context.intent,
        urgency: result.context.urgency,
        volume: 0,
        sentiment: result.context.sentiment,
        categories: result.categories,
      },
      timestamp: new Date().toISOString(),
    };

    return [signal];
  }

  private calculateTfIdfScore(token: string): number {
    let score = 0;
    const docs = this.tfidf.documents;
    if (!docs) return 0;

    // Get the number of documents
    const documentCount = Object.keys(docs).length;
    if (documentCount === 0) return 0;

    // Calculate term frequency in each document
    let termFrequency = 0;
    let docsWithTerm = 0;

    Object.values(docs).forEach((doc: any) => {
      if (doc && typeof doc === 'object' && doc[token]) {
        termFrequency += doc[token];
        docsWithTerm++;
      }
    });

    // Calculate IDF
    const idf = Math.log(documentCount / (1 + docsWithTerm));

    // Final TF-IDF score
    score = termFrequency * idf;

    return score;
  }

  private groupSignals(signals: DemandSignal[]): Map<string, DemandSignal[]> {
    const groups = new Map<string, DemandSignal[]>();

    signals.forEach((signal) => {
      const key = `${signal.source}_${signal.vertical.id}`;
      const group = groups.get(key) || [];
      group.push(signal);
      groups.set(key, group);
    });

    return groups;
  }

  async consolidateSignals(signals: DemandSignal[]): Promise<DemandSignal[]> {
    // Group signals by source and type
    const groups = this.groupSignals(signals);

    // Consolidate each group
    return Array.from(groups.values()).map((group) => this.mergeSignals(group));
  }

  private mergeSignals(signals: DemandSignal[]): DemandSignal {
    if (signals.length === 0) {
      throw new Error('Cannot merge empty signal array');
    }

    if (signals.length === 1) {
      return signals[0];
    }

    const base = signals[0];
    const keywords = new Set<string>();
    const categories = new Set<string>();
    let totalConfidence = 0;
    let totalSentiment = 0;
    let totalUrgency = 0;
    let totalVolume = 0;

    signals.forEach((signal) => {
      // Add keywords from insights
      signal.insights.keywords.forEach((kw) => keywords.add(kw));

      // Add categories from context
      signal.context.categories.forEach((cat) => categories.add(cat));

      totalConfidence += signal.insights.confidence;
      totalSentiment += signal.context.sentiment;
      totalUrgency += signal.context.urgency;
      totalVolume += signal.context.volume;
    });

    const avgConfidence = totalConfidence / signals.length;
    const avgSentiment = totalSentiment / signals.length;
    const avgUrgency = totalUrgency / signals.length;
    const avgVolume = totalVolume / signals.length;

    return {
      ...base,
      context: {
        market: base.context.market,
        category: base.context.category,
        priceRange: base.context.priceRange,
        intent: base.context.intent,
        categories: Array.from(categories),
        sentiment: avgSentiment,
        urgency: avgUrgency,
        volume: totalVolume,
      },
      insights: {
        ...base.insights,
        keywords: Array.from(keywords),
        confidence: avgConfidence,
      },
    };
  }
}
