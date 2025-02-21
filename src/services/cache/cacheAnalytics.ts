import { EventEmitter } from 'events';
import { Logger } from '../../logger/logger';
import { DemandPattern } from '../../types/demandTypes';

interface CacheMetrics {
  hits: number;
  misses: number;
  size: number;
  avgLatency: number;
  hitRate: number;
  patternDistribution: Map<string, number>;
}

interface CacheEvent {
  type: 'hit' | 'miss' | 'set' | 'delete';
  pattern?: DemandPattern;
  latency?: number;
  timestamp: number;
}

export class CacheAnalytics extends EventEmitter {
  private static instance: CacheAnalytics;
  private events: CacheEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private logger: Logger;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    size: 0,
    avgLatency: 0,
    hitRate: 0,
    patternDistribution: new Map(),
  };

  private constructor() {
    super();
    this.logger = new Logger('CacheAnalytics');
    this.startPeriodicAnalysis();
  }

  static getInstance(): CacheAnalytics {
    if (!CacheAnalytics.instance) {
      CacheAnalytics.instance = new CacheAnalytics();
    }
    return CacheAnalytics.instance;
  }

  private startPeriodicAnalysis() {
    setInterval(() => this.analyzeMetrics(), 60000); // Every minute
  }

  trackEvent(event: CacheEvent): void {
    this.events.push(event);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    // Update real-time metrics
    switch (event.type) {
      case 'hit':
        this.metrics.hits++;
        break;
      case 'miss':
        this.metrics.misses++;
        break;
      case 'set':
        this.metrics.size++;
        if (event.pattern) {
          const category = event.pattern.category || 'uncategorized';
          this.metrics.patternDistribution.set(
            category,
            (this.metrics.patternDistribution.get(category) || 0) + 1
          );
        }
        break;
      case 'delete':
        this.metrics.size = Math.max(0, this.metrics.size - 1);
        break;
    }

    // Update latency metrics
    if (event.latency) {
      const totalEvents = this.metrics.hits + this.metrics.misses;
      this.metrics.avgLatency =
        (this.metrics.avgLatency * (totalEvents - 1) + event.latency) / totalEvents;
    }

    // Update hit rate
    const totalRequests = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;

    this.emit('metrics-updated', this.getMetrics());
  }

  private analyzeMetrics(): void {
    const now = Date.now();
    const recentEvents = this.events.filter(
      (e) => now - e.timestamp < 300000 // Last 5 minutes
    );

    const analysis = {
      recentHitRate: this.calculateRecentHitRate(recentEvents),
      popularCategories: this.getPopularCategories(),
      performanceMetrics: {
        avgLatency: this.metrics.avgLatency,
        hitRate: this.metrics.hitRate,
        cacheSize: this.metrics.size,
      },
    };

    this.logger.info('Cache performance analysis', analysis);
    this.emit('analysis-complete', analysis);
  }

  private calculateRecentHitRate(events: CacheEvent[]): number {
    const hits = events.filter((e) => e.type === 'hit').length;
    return events.length > 0 ? hits / events.length : 0;
  }

  private getPopularCategories(): Array<[string, number]> {
    return Array.from(this.metrics.patternDistribution.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getAnalytics(): any {
    return {
      metrics: this.getMetrics(),
      recentEvents: this.events.slice(-50), // Last 50 events
      analysis: {
        popularCategories: this.getPopularCategories(),
        hitRate: this.metrics.hitRate,
        avgLatency: this.metrics.avgLatency,
      },
    };
  }
}
