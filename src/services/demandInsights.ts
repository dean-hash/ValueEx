import { Observable, Subject, merge } from 'rxjs';
import { filter, map, groupBy, mergeMap } from 'rxjs/operators';
import { DemandSignalEnhancer } from './analysis/demandSignalEnhancer';
import { MetricsCollector } from './monitoring/metrics';

interface DemandSignal {
  source: 'email' | 'search' | 'social' | 'direct';
  intent: string;
  context: {
    urgency: number; // 0-1
    specificity: number; // 0-1
    valueConstraints?: {
      budget?: number;
      timeframe?: string;
    };
  };
  timestamp: Date;
  confidence: number;
  sentiment?: {
    score: number;
  };
  topics?: string[];
  cluster?: string;
}

interface ContextualSignal extends DemandSignal {
  contextualConfidence: number;
  relatedSignals: Array<{
    signal: DemandSignal;
    relationship: number;
  }>;
}

interface SupplyMatch {
  demandSignal: DemandSignal;
  potentialSolutions: Array<{
    source: string;
    relevance: number;
    value: number;
    availability: boolean;
  }>;
}

export class DemandInsights {
  private emailSignals = new Subject<DemandSignal>();
  private publicSignals = new Subject<DemandSignal>();
  private directSignals = new Subject<DemandSignal>();

  private allSignals: Observable<ContextualSignal>;
  private patterns = new Map<string, Array<ContextualSignal>>();
  private enhancer: DemandSignalEnhancer;
  private metrics: MetricsCollector;

  constructor() {
    this.enhancer = DemandSignalEnhancer.getInstance();
    this.metrics = MetricsCollector.getInstance();

    // Merge and enhance all signal sources with context awareness
    this.allSignals = merge(
      this.emailSignals,
      this.publicSignals,
      this.directSignals
    ).pipe(
      mergeMap(signal => this.enhancer.enhanceSignal(signal)),
      map(signal => this.updatePatterns(signal))
    );

    // Subscribe to process signals and update metrics
    this.allSignals.subscribe(signal => {
      this.metrics.trackSignal({
        type: signal.source,
        confidence: signal.contextualConfidence,
        hasRelatedSignals: signal.relatedSignals.length > 0,
        topRelationshipStrength: signal.relatedSignals[0]?.relationship || 0
      });
    });
  }

  private updatePatterns(signal: ContextualSignal): ContextualSignal {
    // Group related signals by their primary topics
    signal.topics.forEach(topic => {
      if (!this.patterns.has(topic)) {
        this.patterns.set(topic, []);
      }
      const topicPatterns = this.patterns.get(topic)!;
      topicPatterns.push(signal);
      
      // Keep only recent patterns
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.patterns.set(
        topic,
        topicPatterns.filter(s => s.timestamp > oneDayAgo)
      );
    });
    
    return signal;
  }

  public getEmergingPatterns(): Observable<Array<{
    topic: string;
    signals: ContextualSignal[];
    averageConfidence: number;
    relationshipStrength: number;
  }>> {
    return new Observable(subscriber => {
      const patterns = Array.from(this.patterns.entries())
        .map(([topic, signals]) => ({
          topic,
          signals,
          averageConfidence: signals.reduce((acc, sig) => acc + sig.contextualConfidence, 0) / signals.length,
          relationshipStrength: this.calculatePatternStrength(signals)
        }))
        .filter(pattern => pattern.signals.length >= 3) // Only patterns with sufficient support
        .sort((a, b) => b.averageConfidence - a.averageConfidence);
      
      subscriber.next(patterns);
    });
  }

  private calculatePatternStrength(signals: ContextualSignal[]): number {
    if (signals.length < 2) return 0;
    
    // Calculate average relationship strength between all signals in the pattern
    let totalStrength = 0;
    let relationships = 0;
    
    for (let i = 0; i < signals.length; i++) {
      for (let j = i + 1; j < signals.length; j++) {
        const relationship = signals[i].relatedSignals
          .find(rel => rel.signal === signals[j])?.relationship || 0;
        totalStrength += relationship;
        relationships++;
      }
    }
    
    return totalStrength / relationships;
  }

  public async processEmailInsight(intent: string, context: any, preservePrivacy: boolean = true) {
    if (preservePrivacy) {
      // Remove any PII or sensitive details
      intent = this.sanitizeIntent(intent);
      context = this.sanitizeContext(context);
    }

    this.emailSignals.next({
      source: 'email',
      intent,
      context: {
        urgency: this.calculateUrgency(context),
        specificity: this.calculateSpecificity(intent),
        valueConstraints: this.extractValueConstraints(context),
      },
      timestamp: new Date(),
      confidence: 0.8, // Base confidence for explicit email signals
    });
  }

  private sanitizeIntent(intent: string): string {
    // Remove names, emails, phone numbers, etc.
    return intent
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');
  }

  private sanitizeContext(context: any): any {
    // Deep clone and sanitize context object
    const sanitized = JSON.parse(JSON.stringify(context));
    this.recursiveSanitize(sanitized);
    return sanitized;
  }

  private recursiveSanitize(obj: any) {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = this.sanitizeIntent(obj[key]);
      } else if (typeof obj[key] === 'object') {
        this.recursiveSanitize(obj[key]);
      }
    }
  }

  private calculateUrgency(context: any): number {
    // Implement urgency calculation based on:
    // - Time-related keywords
    // - Repetition of request
    // - Expression intensity
    return 0.5; // Placeholder
  }

  private calculateSpecificity(intent: string): number {
    // Implement specificity calculation based on:
    // - Detail level
    // - Concrete requirements
    // - Quantifiable elements
    return 0.7; // Placeholder
  }

  private extractValueConstraints(context: any): any {
    // Extract budget, timeframe, and other constraints
    return {}; // Placeholder
  }
}
