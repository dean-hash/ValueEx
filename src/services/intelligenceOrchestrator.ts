import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { DemandSignal } from '../types/demandTypes';
import { IntelligenceEnhancer } from './analysis/intelligenceEnhancer';
import { MetricsCollector } from './monitoring/metrics';
import { ResourceMonitor } from './monitoring/resourceMonitor';

export interface EnhancementResult {
  success: boolean;
  enhancedSignal?: DemandSignal;
  error?: string;
  metrics?: {
    processingTime: number;
    confidenceScore: number;
    enhancementDepth: number;
  };
}

export class IntelligenceOrchestrator extends EventEmitter {
  private static instance: IntelligenceOrchestrator;
  private enhancer: IntelligenceEnhancer;
  private metrics: MetricsCollector;
  private monitor: ResourceMonitor;

  private constructor() {
    super();
    this.enhancer = new IntelligenceEnhancer();
    this.metrics = MetricsCollector.getInstance();
    this.monitor = new ResourceMonitor();
    this.setupEventHandlers();
  }

  public static getInstance(): IntelligenceOrchestrator {
    if (!IntelligenceOrchestrator.instance) {
      IntelligenceOrchestrator.instance = new IntelligenceOrchestrator();
    }
    return IntelligenceOrchestrator.instance;
  }

  private setupEventHandlers(): void {
    this.monitor.on('alert', (alert) => {
      logger.warn('Resource alert:', alert);
      this.emit('resourceAlert', alert);
    });

    this.metrics.on('alert', (alert) => {
      logger.warn('Metrics alert:', alert);
      this.emit('metricsAlert', alert);
    });
  }

  public async enhanceSignal(signal: DemandSignal): Promise<EnhancementResult> {
    const startTime = Date.now();
    try {
      // Record initial metrics
      this.metrics.recordApiMetrics('signal_enhancement', {
        requests: 1,
        errors: 0,
        latency: 0,
      });

      // Enhance the signal
      const enhancedSignal = await this.enhancer.enhance(signal);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Record success metrics
      this.metrics.recordApiMetrics('signal_enhancement', {
        requests: 1,
        errors: 0,
        latency: processingTime,
      });

      return {
        success: true,
        enhancedSignal,
        metrics: {
          processingTime,
          confidenceScore: enhancedSignal.insights.confidence,
          enhancementDepth: this.calculateEnhancementDepth(enhancedSignal),
        },
      };
    } catch (error) {
      logger.error('Error enhancing signal:', error);

      // Record error metrics
      this.metrics.recordApiMetrics('signal_enhancement', {
        requests: 1,
        errors: 1,
        latency: Date.now() - startTime,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metrics: {
          processingTime: Date.now() - startTime,
          confidenceScore: 0,
          enhancementDepth: 0,
        },
      };
    }
  }

  private calculateEnhancementDepth(signal: DemandSignal): number {
    let depth = 0;

    // Check for enhanced fields
    if (signal.insights.keywords?.length) depth++;
    if (signal.insights.context) depth++;
    if (signal.insights.intent) depth++;
    if (signal.insights.valueEvidence?.authenticityMarkers?.length) depth++;
    if (signal.insights.valueEvidence?.realWorldImpact?.length) depth++;
    if (signal.insights.demographics?.length) depth++;
    if (signal.insights.priceRange) depth++;
    if (signal.insights.demandPatterns?.evidence?.length) depth++;

    return depth;
  }

  public getMetrics(): MetricsCollector {
    return this.metrics;
  }

  public getMonitor(): ResourceMonitor {
    return this.monitor;
  }

  public dispose(): void {
    this.monitor.stopMonitoring();
    this.removeAllListeners();
  }
}
