import { Observable, from } from 'rxjs';
import { map, mergeMap, groupBy, reduce } from 'rxjs/operators';
import natural from 'natural';
import { DemandSignal } from '../../types/mvp/demand';

interface EnhancedDemandSignal extends DemandSignal {
  sentiment: {
    score: number; // -1 to 1
    magnitude: number; // 0 to 1
    label: string;
  };
  topics: string[];
  cluster?: string;
  relatedSignals: DemandSignal[];
}

interface ContextualSignal extends EnhancedDemandSignal {
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
      map((sig) => this.addSentiment(sig)),
      map((sig) => this.addTopics(sig)),
      map((sig) => this.calculateConfidence(sig)),
      map((sig) => this.findRelatedSignals(sig)),
      map((sig) => this.calculateContextualConfidence(sig)),
      map((sig) => {
        this.updateContextWindow(sig);
        return sig;
      })
    );
  }

  private addSentiment(signal: DemandSignal): EnhancedDemandSignal {
    const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    const tokens = this.tokenizer.tokenize(signal.insights.intent) || [];
    const score = analyzer.getSentiment(tokens);

    return {
      ...signal,
      sentiment: {
        score,
        magnitude: Math.abs(score),
        label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
      },
      topics: [],
      cluster: undefined,
      relatedSignals: [],
    };
  }

  private addTopics(signal: EnhancedDemandSignal): EnhancedDemandSignal {
    this.tfidf.addDocument(signal.insights.intent);
    const docIndex = Object.keys(this.tfidf.documents!).length - 1;
    const terms = this.tfidf.listTerms(docIndex);

    const topics = terms
      .filter((term) => term.tfidf > 5) // Only significant terms
      .map((term) => term.term)
      .slice(0, 5); // Top 5 topics

    return {
      ...signal,
      topics,
    };
  }

  private calculateConfidence(signal: EnhancedDemandSignal): EnhancedDemandSignal {
    const topicBoost = signal.topics.length > 2 ? 0.1 : 0;
    const sentimentBoost = Math.abs(signal.sentiment.score) > 0.7 ? 0.1 : 0;

    return {
      ...signal,
      insights: {
        ...signal.insights,
        confidence: Math.min(1, signal.insights.confidence + topicBoost + sentimentBoost),
      },
    };
  }

  private findRelatedSignals(signal: EnhancedDemandSignal): ContextualSignal {
    const related = this.recentSignals
      .map((existingSignal) => ({
        signal: existingSignal,
        relationship: this.calculateRelationship(signal, existingSignal),
      }))
      .filter((rel) => rel.relationship > 0.3) // Only keep strong relationships
      .sort((a, b) => b.relationship - a.relationship)
      .slice(0, 5); // Keep top 5 related signals

    return {
      ...signal,
      relatedSignals: related.map((rel) => rel.signal),
      contextualConfidence: signal.insights.confidence,
    };
  }

  private calculateRelationship(
    signal1: EnhancedDemandSignal,
    signal2: EnhancedDemandSignal
  ): number {
    // Calculate topic similarity
    const vector1 = new natural.TfIdf();
    const vector2 = new natural.TfIdf();
    vector1.addDocument(signal1.insights.intent);
    vector2.addDocument(signal2.insights.intent);

    // Calculate cosine similarity between TF-IDF vectors
    const terms1 = vector1.listTerms(0).map((term) => ({ term: term.term, tfidf: term.tfidf }));
    const terms2 = vector2.listTerms(0).map((term) => ({ term: term.term, tfidf: term.tfidf }));

    const allTerms = new Set([...terms1.map((t) => t.term), ...terms2.map((t) => t.term)]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    allTerms.forEach((term) => {
      const tfidf1 = terms1.find((t) => t.term === term)?.tfidf || 0;
      const tfidf2 = terms2.find((t) => t.term === term)?.tfidf || 0;
      dotProduct += tfidf1 * tfidf2;
      norm1 += tfidf1 * tfidf1;
      norm2 += tfidf2 * tfidf2;
    });

    const topicSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) || 0;

    // Calculate sentiment similarity
    const sentimentDiff = Math.abs(signal1.insights.confidence - signal2.insights.confidence);
    const sentimentSimilarity = 1 - sentimentDiff;

    // Calculate time similarity (signals closer in time are more related)
    const time1 = new Date(signal1.timestamp).getTime();
    const time2 = new Date(signal2.timestamp).getTime();
    const timeDiff = Math.abs(time1 - time2);
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    const timeSimilarity = Math.exp(-timeDiff / DAY_IN_MS); // Decay over 24 hours

    // Weighted combination of similarities
    return topicSimilarity * 0.5 + sentimentSimilarity * 0.3 + timeSimilarity * 0.2;
  }

  private calculateContextualConfidence(signal: ContextualSignal): ContextualSignal {
    if (signal.relatedSignals.length === 0) return signal;

    // Boost confidence based on supporting evidence from related signals
    const relationshipStrengths = this.recentSignals
      .filter((sig) => signal.relatedSignals.includes(sig))
      .map((sig) => this.calculateRelationship(signal, sig));
    const averageStrength =
      relationshipStrengths.reduce((a, b) => a + b, 0) / relationshipStrengths.length;

    // Boost confidence by up to 20% based on supporting evidence
    const confidenceBoost = averageStrength * 0.2;

    return {
      ...signal,
      contextualConfidence: Math.min(1, signal.insights.confidence + confidenceBoost),
    };
  }

  private updateContextWindow(signal: ContextualSignal): void {
    this.recentSignals.push(signal);
    if (this.recentSignals.length > this.CONTEXT_WINDOW_SIZE) {
      this.recentSignals.shift(); // Remove oldest signal
    }
  }

  public async clusterSignals(signals: EnhancedDemandSignal[]): Promise<EnhancedDemandSignal[]> {
    if (signals.length < 2) return signals;

    // Create TF-IDF vectors for clustering
    const vectors = signals.map((signal) => {
      const vector = new natural.TfIdf();
      vector.addDocument(signal.insights.intent);
      return vector;
    });

    // Calculate similarity matrix
    const similarityMatrix: number[][] = [];
    for (let i = 0; i < signals.length; i++) {
      similarityMatrix[i] = [];
      for (let j = 0; j < signals.length; j++) {
        if (i === j) {
          similarityMatrix[i][j] = 1;
        } else {
          similarityMatrix[i][j] = this.calculateRelationship(signals[i], signals[j]);
        }
      }
    }

    // Perform hierarchical clustering
    const clusters = this.hierarchicalCluster(similarityMatrix, 0.7);

    // Assign cluster IDs to signals
    return signals.map((signal, index) => ({
      ...signal,
      cluster: `cluster_${clusters[index]}`,
    }));
  }

  private hierarchicalCluster(similarityMatrix: number[][], threshold: number): number[] {
    const n = similarityMatrix.length;
    const clusters = Array.from({ length: n }, (_, i) => i);
    const merged = new Set<number>();

    while (true) {
      let maxSimilarity = -1;
      let mergeI = -1;
      let mergeJ = -1;

      // Find most similar pair
      for (let i = 0; i < n; i++) {
        if (merged.has(i)) continue;
        for (let j = i + 1; j < n; j++) {
          if (merged.has(j)) continue;
          if (similarityMatrix[i][j] > maxSimilarity) {
            maxSimilarity = similarityMatrix[i][j];
            mergeI = i;
            mergeJ = j;
          }
        }
      }

      if (maxSimilarity < threshold || mergeI === -1) break;

      // Merge clusters
      const targetCluster = clusters[mergeI];
      const sourceCluster = clusters[mergeJ];
      merged.add(mergeJ);

      for (let i = 0; i < n; i++) {
        if (clusters[i] === sourceCluster) {
          clusters[i] = targetCluster;
        }
      }
    }

    return clusters;
  }
}
