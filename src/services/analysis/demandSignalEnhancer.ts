import { Observable, from } from 'rxjs';
import { map, mergeMap, groupBy, reduce } from 'rxjs/operators';
import natural from 'natural';
import { DemandSignal } from '../types/demand';

interface EnhancedDemandSignal extends DemandSignal {
  sentiment: {
    score: number;  // -1 to 1
    magnitude: number;  // 0 to 1
  };
  topics: string[];
  cluster?: string;
}

interface ContextualSignal extends EnhancedDemandSignal {
  relatedSignals: Array<{
    signal: EnhancedDemandSignal;
    relationship: number; // 0-1 strength of relationship
  }>;
  contextualConfidence: number;
}

export class DemandSignalEnhancer {
  private static instance: DemandSignalEnhancer;
  private tokenizer: natural.WordTokenizer;
  private tfidf: natural.TfIdf;
  private recentSignals: ContextualSignal[] = [];
  private readonly CONTEXT_WINDOW_SIZE = 100; // Keep last 100 signals for context
  
  private constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.initializeTopicModels();
  }

  public static getInstance(): DemandSignalEnhancer {
    if (!DemandSignalEnhancer.instance) {
      DemandSignalEnhancer.instance = new DemandSignalEnhancer();
    }
    return DemandSignalEnhancer.instance;
  }

  private initializeTopicModels(): void {
    // Initialize with common demand-related terms
    this.tfidf.addDocument('price cost affordable expensive budget');
    this.tfidf.addDocument('quality premium luxury high-end');
    this.tfidf.addDocument('urgent immediate quick fast delivery');
    this.tfidf.addDocument('comparison alternative similar better');
  }

  public enhanceSignal(signal: DemandSignal): Observable<ContextualSignal> {
    return from([signal]).pipe(
      map(sig => this.addSentiment(sig)),
      map(sig => this.addTopics(sig)),
      map(sig => this.findRelatedSignals(sig)),
      map(sig => this.calculateContextualConfidence(sig)),
      map(sig => {
        this.updateContextWindow(sig);
        return sig;
      })
    );
  }

  private addSentiment(signal: DemandSignal): EnhancedDemandSignal {
    const analyzer = new natural.SentimentAnalyzer(
      'English', 
      natural.PorterStemmer, 
      'afinn'
    );
    
    const tokens = this.tokenizer.tokenize(signal.intent);
    const sentimentScore = analyzer.getSentiment(tokens);

    return {
      ...signal,
      sentiment: {
        score: sentimentScore,
        magnitude: Math.abs(sentimentScore)
      },
      topics: []  // Will be filled by addTopics
    };
  }

  private addTopics(signal: EnhancedDemandSignal): EnhancedDemandSignal {
    this.tfidf.addDocument(signal.intent);
    const terms = this.tfidf.listTerms(this.tfidf.documents.length - 1);
    
    const topics = terms
      .filter(term => term.tfidf > 5)  // Only significant terms
      .map(term => term.term)
      .slice(0, 3);  // Top 3 topics

    return {
      ...signal,
      topics
    };
  }

  private calculateConfidenceBoost(signal: EnhancedDemandSignal): EnhancedDemandSignal {
    // Boost confidence based on sentiment magnitude and topic relevance
    const topicBoost = signal.topics.length * 0.1;  // 0.1 per relevant topic
    const sentimentBoost = signal.sentiment.magnitude * 0.2;  // Up to 0.2 for strong sentiment

    return {
      ...signal,
      confidence: Math.min(1, signal.confidence + topicBoost + sentimentBoost)
    };
  }

  private findRelatedSignals(signal: EnhancedDemandSignal): ContextualSignal {
    const related = this.recentSignals
      .map(existingSignal => ({
        signal: existingSignal,
        relationship: this.calculateRelationship(signal, existingSignal)
      }))
      .filter(rel => rel.relationship > 0.3) // Only keep strong relationships
      .sort((a, b) => b.relationship - a.relationship)
      .slice(0, 5); // Keep top 5 related signals

    return {
      ...signal,
      relatedSignals: related,
      contextualConfidence: signal.confidence
    };
  }

  private calculateRelationship(signal1: EnhancedDemandSignal, signal2: EnhancedDemandSignal): number {
    const topicSimilarity = this.calculateTopicOverlap(signal1.topics, signal2.topics);
    const sentimentSimilarity = 1 - Math.abs(signal1.sentiment.score - signal2.sentiment.score);
    const timeSimilarity = this.calculateTimeProximity(signal1.timestamp, signal2.timestamp);
    
    return (topicSimilarity * 0.5 + sentimentSimilarity * 0.3 + timeSimilarity * 0.2);
  }

  private calculateContextualConfidence(signal: ContextualSignal): ContextualSignal {
    if (signal.relatedSignals.length === 0) return signal;

    // Boost confidence based on supporting evidence from related signals
    const relationshipStrengths = signal.relatedSignals.map(rel => rel.relationship);
    const averageStrength = relationshipStrengths.reduce((a, b) => a + b, 0) / relationshipStrengths.length;
    
    // Boost confidence by up to 20% based on supporting evidence
    const confidenceBoost = averageStrength * 0.2;
    
    return {
      ...signal,
      contextualConfidence: Math.min(1, signal.confidence + confidenceBoost)
    };
  }

  private updateContextWindow(signal: ContextualSignal): void {
    this.recentSignals.push(signal);
    if (this.recentSignals.length > this.CONTEXT_WINDOW_SIZE) {
      this.recentSignals.shift(); // Remove oldest signal
    }
  }

  private calculateTopicOverlap(topics1: string[], topics2: string[]): number {
    const set1 = new Set(topics1);
    const set2 = new Set(topics2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  private calculateTimeProximity(time1: Date, time2: Date): number {
    const hoursDiff = Math.abs(time1.getTime() - time2.getTime()) / (1000 * 60 * 60);
    return Math.max(0, 1 - (hoursDiff / 24)); // Decay over 24 hours
  }

  public async clusterSignals(signals: EnhancedDemandSignal[]): Promise<EnhancedDemandSignal[]> {
    if (signals.length < 2) return signals;

    // Create TF-IDF vectors for clustering
    const vectors = signals.map(signal => {
      const vector = new natural.TfIdf();
      vector.addDocument(signal.intent);
      return vector;
    });

    // Simple k-means clustering
    const k = Math.min(3, Math.floor(signals.length / 2));
    const clusters = await this.kMeansClustering(vectors, k);

    return signals.map((signal, index) => ({
      ...signal,
      cluster: `cluster_${clusters[index]}`
    }));
  }

  private async kMeansClustering(vectors: natural.TfIdf[], k: number): Promise<number[]> {
    // Simple k-means implementation
    // Returns cluster assignments for each vector
    // This is a placeholder - in production we'd use a more robust clustering library
    return vectors.map((_, index) => index % k);
  }
}
