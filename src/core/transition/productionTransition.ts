import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { ResonanceField } from '../../services/resonanceField';
import { DataSimulator } from '../simulation/dataSimulator';
import { IntelligenceEnhancer } from '../../services/intelligence/intelligenceEnhancer';
import { Logger } from '../../logger/logger';
import { DemandPattern } from '../../types/demandTypes';
import { ResonanceMetrics } from '../../types/resonanceTypes';

/**
 * ProductionTransition manages the gradual transition from simulated to production data
 * while maintaining system stability and resonance coherence.
 */
export class ProductionTransition {
  private static instance: ProductionTransition;
  private transitionState: BehaviorSubject<TransitionState>;
  private productionRatio: BehaviorSubject<number>; // 0 = all simulated, 1 = all production
  private stabilityMetrics: BehaviorSubject<StabilityMetrics>;
  private logger: Logger;

  constructor(
    private resonanceField: ResonanceField,
    private simulator: DataSimulator,
    private enhancer: IntelligenceEnhancer
  ) {
    this.logger = new Logger('ProductionTransition');
    this.transitionState = new BehaviorSubject<TransitionState>('preparing');
    this.productionRatio = new BehaviorSubject<number>(0);
    this.stabilityMetrics = new BehaviorSubject<StabilityMetrics>({
      coherence: 1,
      confidence: 1,
      stability: 1,
      errorRate: 0,
    });

    this.initializeTransitionMonitoring();
  }

  public static getInstance(
    resonanceField: ResonanceField,
    simulator: DataSimulator,
    enhancer: IntelligenceEnhancer
  ): ProductionTransition {
    if (!ProductionTransition.instance) {
      ProductionTransition.instance = new ProductionTransition(resonanceField, simulator, enhancer);
    }
    return ProductionTransition.instance;
  }

  private initializeTransitionMonitoring(): void {
    // Monitor system stability during transition
    combineLatest([
      this.resonanceField.getResonanceState$(),
      this.productionRatio,
      this.simulator.getMetrics$(),
    ])
      .pipe(
        map(([resonance, ratio, simMetrics]) =>
          this.calculateStabilityMetrics(resonance, ratio, simMetrics)
        )
      )
      .subscribe((metrics) => {
        this.stabilityMetrics.next(metrics);
        this.adjustTransitionRate(metrics);
      });
  }

  /**
   * Begin the transition process with specified parameters
   */
  public async startTransition(config: TransitionConfig): Promise<void> {
    this.logger.info('Starting production transition', { config });
    this.transitionState.next('transitioning');

    try {
      // Initialize production data validation
      await this.validateProductionSources(config.productionSources);

      // Start gradual transition
      await this.executeTransition(config);
    } catch (error) {
      this.logger.error('Transition error', { error });
      this.handleTransitionError(error);
    }
  }

  /**
   * Execute the transition with stability checks
   */
  private async executeTransition(config: TransitionConfig): Promise<void> {
    const { minStability, maxErrorRate, transitionSteps, stepDuration } = config;

    for (let step = 1; step <= transitionSteps; step++) {
      const targetRatio = step / transitionSteps;

      // Gradually increase production data ratio
      await this.setProductionRatio(targetRatio);

      // Wait for stability metrics to settle
      await this.waitForStability(minStability, maxErrorRate, stepDuration);

      // Verify system coherence
      const metrics = this.stabilityMetrics.getValue();
      if (!this.isSystemStable(metrics, minStability, maxErrorRate)) {
        throw new Error('System instability detected during transition');
      }

      this.logger.info('Transition step complete', {
        step,
        targetRatio,
        metrics,
      });
    }

    this.transitionState.next('completed');
  }

  /**
   * Set the ratio of production to simulated data
   */
  private async setProductionRatio(ratio: number): Promise<void> {
    this.productionRatio.next(ratio);

    // Update simulator behavior
    this.simulator.setSimulationWeight(1 - ratio);

    // Adjust resonance field parameters
    await this.resonanceField.adjustToProductionRatio(ratio);
  }

  /**
   * Calculate stability metrics based on current state
   */
  private calculateStabilityMetrics(
    resonance: ResonanceMetrics,
    productionRatio: number,
    simMetrics: any
  ): StabilityMetrics {
    return {
      coherence: resonance.coherence,
      confidence: resonance.confidence,
      stability: this.calculateSystemStability(resonance, simMetrics),
      errorRate: this.calculateErrorRate(productionRatio, simMetrics),
    };
  }

  /**
   * Wait for system to stabilize after changes
   */
  private async waitForStability(
    minStability: number,
    maxErrorRate: number,
    duration: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const checkStability = () => {
        const metrics = this.stabilityMetrics.getValue();
        const elapsed = Date.now() - start;

        if (this.isSystemStable(metrics, minStability, maxErrorRate)) {
          resolve();
        } else if (elapsed >= duration) {
          reject(new Error('Stability timeout exceeded'));
        } else {
          setTimeout(checkStability, 1000);
        }
      };

      checkStability();
    });
  }

  /**
   * Verify system stability based on metrics
   */
  private isSystemStable(
    metrics: StabilityMetrics,
    minStability: number,
    maxErrorRate: number
  ): boolean {
    return (
      metrics.stability >= minStability &&
      metrics.errorRate <= maxErrorRate &&
      metrics.coherence >= minStability &&
      metrics.confidence >= minStability
    );
  }

  /**
   * Calculate overall system stability
   */
  private calculateSystemStability(resonance: ResonanceMetrics, simMetrics: any): number {
    // Combine multiple stability indicators
    const indicators = [resonance.coherence, resonance.confidence, simMetrics.stability || 1];

    return indicators.reduce((sum, val) => sum + val, 0) / indicators.length;
  }

  /**
   * Calculate error rate during transition
   */
  private calculateErrorRate(productionRatio: number, simMetrics: any): number {
    const baseErrorRate = simMetrics.errorRate || 0;
    // Error rate typically increases with production ratio
    return baseErrorRate * (1 + productionRatio);
  }

  /**
   * Adjust transition rate based on stability metrics
   */
  private adjustTransitionRate(metrics: StabilityMetrics): void {
    if (metrics.stability < 0.5 || metrics.errorRate > 0.1) {
      // Slow down transition if stability decreases
      const currentRatio = this.productionRatio.getValue();
      this.setProductionRatio(Math.max(0, currentRatio - 0.1));
    }
  }

  /**
   * Handle transition errors
   */
  private handleTransitionError(error: Error): void {
    this.logger.error('Transition error', { error });
    this.transitionState.next('error');

    // Revert to simulation if needed
    this.setProductionRatio(0);
  }

  /**
   * Validate production data sources
   */
  private async validateProductionSources(sources: ProductionSource[]): Promise<void> {
    for (const source of sources) {
      try {
        await this.validateSource(source);
      } catch (error) {
        this.logger.error('Source validation failed', { source, error });
        throw error;
      }
    }
  }

  /**
   * Validate a single production data source
   */
  private async validateSource(source: ProductionSource): Promise<void> {
    // Implement source-specific validation
    const testPattern = await this.enhancer.createTestPattern();
    const response = await source.test(testPattern);

    if (!response.valid) {
      throw new Error(`Invalid source: ${source.name}`);
    }
  }

  // Public getters for monitoring
  public getTransitionState$(): Observable<TransitionState> {
    return this.transitionState.asObservable();
  }

  public getProductionRatio$(): Observable<number> {
    return this.productionRatio.asObservable();
  }

  public getStabilityMetrics$(): Observable<StabilityMetrics> {
    return this.stabilityMetrics.asObservable();
  }
}

type TransitionState = 'preparing' | 'transitioning' | 'completed' | 'error';

interface StabilityMetrics {
  coherence: number;
  confidence: number;
  stability: number;
  errorRate: number;
}

interface TransitionConfig {
  productionSources: ProductionSource[];
  minStability: number;
  maxErrorRate: number;
  transitionSteps: number;
  stepDuration: number;
}

interface ProductionSource {
  name: string;
  test: (pattern: DemandPattern) => Promise<{ valid: boolean }>;
}
