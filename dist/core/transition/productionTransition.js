"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionTransition = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const logger_1 = require("../../logger/logger");
/**
 * ProductionTransition manages the gradual transition from simulated to production data
 * while maintaining system stability and resonance coherence.
 */
class ProductionTransition {
    constructor(resonanceField, simulator, enhancer) {
        this.resonanceField = resonanceField;
        this.simulator = simulator;
        this.enhancer = enhancer;
        this.logger = new logger_1.Logger('ProductionTransition');
        this.transitionState = new rxjs_1.BehaviorSubject('preparing');
        this.productionRatio = new rxjs_1.BehaviorSubject(0);
        this.stabilityMetrics = new rxjs_1.BehaviorSubject({
            coherence: 1,
            confidence: 1,
            stability: 1,
            errorRate: 0,
        });
        this.initializeTransitionMonitoring();
    }
    static getInstance(resonanceField, simulator, enhancer) {
        if (!ProductionTransition.instance) {
            ProductionTransition.instance = new ProductionTransition(resonanceField, simulator, enhancer);
        }
        return ProductionTransition.instance;
    }
    initializeTransitionMonitoring() {
        // Monitor system stability during transition
        (0, rxjs_1.combineLatest)([
            this.resonanceField.getResonanceState$(),
            this.productionRatio,
            this.simulator.getMetrics$(),
        ])
            .pipe((0, operators_1.map)(([resonance, ratio, simMetrics]) => this.calculateStabilityMetrics(resonance, ratio, simMetrics)))
            .subscribe((metrics) => {
            this.stabilityMetrics.next(metrics);
            this.adjustTransitionRate(metrics);
        });
    }
    /**
     * Begin the transition process with specified parameters
     */
    async startTransition(config) {
        this.logger.info('Starting production transition', { config });
        this.transitionState.next('transitioning');
        try {
            // Initialize production data validation
            await this.validateProductionSources(config.productionSources);
            // Start gradual transition
            await this.executeTransition(config);
        }
        catch (error) {
            this.logger.error('Transition error', { error });
            this.handleTransitionError(error);
        }
    }
    /**
     * Execute the transition with stability checks
     */
    async executeTransition(config) {
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
    async setProductionRatio(ratio) {
        this.productionRatio.next(ratio);
        // Update simulator behavior
        this.simulator.setSimulationWeight(1 - ratio);
        // Adjust resonance field parameters
        await this.resonanceField.adjustToProductionRatio(ratio);
    }
    /**
     * Calculate stability metrics based on current state
     */
    calculateStabilityMetrics(resonance, productionRatio, simMetrics) {
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
    async waitForStability(minStability, maxErrorRate, duration) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const checkStability = () => {
                const metrics = this.stabilityMetrics.getValue();
                const elapsed = Date.now() - start;
                if (this.isSystemStable(metrics, minStability, maxErrorRate)) {
                    resolve();
                }
                else if (elapsed >= duration) {
                    reject(new Error('Stability timeout exceeded'));
                }
                else {
                    setTimeout(checkStability, 1000);
                }
            };
            checkStability();
        });
    }
    /**
     * Verify system stability based on metrics
     */
    isSystemStable(metrics, minStability, maxErrorRate) {
        return (metrics.stability >= minStability &&
            metrics.errorRate <= maxErrorRate &&
            metrics.coherence >= minStability &&
            metrics.confidence >= minStability);
    }
    /**
     * Calculate overall system stability
     */
    calculateSystemStability(resonance, simMetrics) {
        // Combine multiple stability indicators
        const indicators = [resonance.coherence, resonance.confidence, simMetrics.stability || 1];
        return indicators.reduce((sum, val) => sum + val, 0) / indicators.length;
    }
    /**
     * Calculate error rate during transition
     */
    calculateErrorRate(productionRatio, simMetrics) {
        const baseErrorRate = simMetrics.errorRate || 0;
        // Error rate typically increases with production ratio
        return baseErrorRate * (1 + productionRatio);
    }
    /**
     * Adjust transition rate based on stability metrics
     */
    adjustTransitionRate(metrics) {
        if (metrics.stability < 0.5 || metrics.errorRate > 0.1) {
            // Slow down transition if stability decreases
            const currentRatio = this.productionRatio.getValue();
            this.setProductionRatio(Math.max(0, currentRatio - 0.1));
        }
    }
    /**
     * Handle transition errors
     */
    handleTransitionError(error) {
        this.logger.error('Transition error', { error });
        this.transitionState.next('error');
        // Revert to simulation if needed
        this.setProductionRatio(0);
    }
    /**
     * Validate production data sources
     */
    async validateProductionSources(sources) {
        for (const source of sources) {
            try {
                await this.validateSource(source);
            }
            catch (error) {
                this.logger.error('Source validation failed', { source, error });
                throw error;
            }
        }
    }
    /**
     * Validate a single production data source
     */
    async validateSource(source) {
        // Implement source-specific validation
        const testPattern = await this.enhancer.createTestPattern();
        const response = await source.test(testPattern);
        if (!response.valid) {
            throw new Error(`Invalid source: ${source.name}`);
        }
    }
    // Public getters for monitoring
    getTransitionState$() {
        return this.transitionState.asObservable();
    }
    getProductionRatio$() {
        return this.productionRatio.asObservable();
    }
    getStabilityMetrics$() {
        return this.stabilityMetrics.asObservable();
    }
}
exports.ProductionTransition = ProductionTransition;
//# sourceMappingURL=productionTransition.js.map