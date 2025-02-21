import { Observable } from 'rxjs';
import { ResonanceField } from '../../services/resonanceField';
import { DataSimulator } from '../simulation/dataSimulator';
import { IntelligenceEnhancer } from '../../services/intelligence/intelligenceEnhancer';
import { DemandPattern } from '../../types/demandTypes';
/**
 * ProductionTransition manages the gradual transition from simulated to production data
 * while maintaining system stability and resonance coherence.
 */
export declare class ProductionTransition {
    private resonanceField;
    private simulator;
    private enhancer;
    private static instance;
    private transitionState;
    private productionRatio;
    private stabilityMetrics;
    private logger;
    constructor(resonanceField: ResonanceField, simulator: DataSimulator, enhancer: IntelligenceEnhancer);
    static getInstance(resonanceField: ResonanceField, simulator: DataSimulator, enhancer: IntelligenceEnhancer): ProductionTransition;
    private initializeTransitionMonitoring;
    /**
     * Begin the transition process with specified parameters
     */
    startTransition(config: TransitionConfig): Promise<void>;
    /**
     * Execute the transition with stability checks
     */
    private executeTransition;
    /**
     * Set the ratio of production to simulated data
     */
    private setProductionRatio;
    /**
     * Calculate stability metrics based on current state
     */
    private calculateStabilityMetrics;
    /**
     * Wait for system to stabilize after changes
     */
    private waitForStability;
    /**
     * Verify system stability based on metrics
     */
    private isSystemStable;
    /**
     * Calculate overall system stability
     */
    private calculateSystemStability;
    /**
     * Calculate error rate during transition
     */
    private calculateErrorRate;
    /**
     * Adjust transition rate based on stability metrics
     */
    private adjustTransitionRate;
    /**
     * Handle transition errors
     */
    private handleTransitionError;
    /**
     * Validate production data sources
     */
    private validateProductionSources;
    /**
     * Validate a single production data source
     */
    private validateSource;
    getTransitionState$(): Observable<TransitionState>;
    getProductionRatio$(): Observable<number>;
    getStabilityMetrics$(): Observable<StabilityMetrics>;
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
    test: (pattern: DemandPattern) => Promise<{
        valid: boolean;
    }>;
}
export {};
