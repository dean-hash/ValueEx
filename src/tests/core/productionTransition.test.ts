import { ProductionTransition } from '../../core/transition/productionTransition';
import { ResonanceField } from '../../services/resonanceField';
import { DataSimulator } from '../../core/simulation/dataSimulator';
import { IntelligenceEnhancer } from '../../services/intelligence/intelligenceEnhancer';
import { DemandPattern } from '../../types/demandTypes';

describe('Production Transition Tests', () => {
  let transition: ProductionTransition;
  let resonanceField: ResonanceField;
  let simulator: DataSimulator;
  let enhancer: IntelligenceEnhancer;

  beforeEach(() => {
    resonanceField = new ResonanceField();
    simulator = new DataSimulator();
    enhancer = IntelligenceEnhancer.getInstance();
    transition = ProductionTransition.getInstance(resonanceField, simulator, enhancer);
  });

  describe('Transition Process', () => {
    it('should execute gradual transition to production', async () => {
      const mockSource = {
        name: 'test-source',
        test: async () => ({ valid: true }),
      };

      const config = {
        productionSources: [mockSource],
        minStability: 0.7,
        maxErrorRate: 0.05,
        transitionSteps: 5,
        stepDuration: 1000,
      };

      const transitionStates: string[] = [];
      const ratios: number[] = [];
      const metrics: any[] = [];

      // Subscribe to transition observables
      transition.getTransitionState$().subscribe((state) => {
        transitionStates.push(state);
      });

      transition.getProductionRatio$().subscribe((ratio) => {
        ratios.push(ratio);
      });

      transition.getStabilityMetrics$().subscribe((m) => {
        metrics.push(m);
      });

      // Start transition
      await transition.startTransition(config);

      // Verify transition progression
      expect(transitionStates).toContain('preparing');
      expect(transitionStates).toContain('transitioning');
      expect(transitionStates).toContain('completed');

      // Verify ratio progression
      expect(ratios[0]).toBe(0);
      expect(ratios[ratios.length - 1]).toBe(1);

      // Verify stability maintained
      metrics.forEach((m) => {
        expect(m.stability).toBeGreaterThanOrEqual(config.minStability);
        expect(m.errorRate).toBeLessThanOrEqual(config.maxErrorRate);
      });
    });

    it('should handle unstable transitions gracefully', async () => {
      const mockSource = {
        name: 'unstable-source',
        test: async () => ({ valid: true }),
      };

      // Mock unstable resonance metrics
      jest.spyOn(resonanceField, 'getResonanceState$').mockImplementation(() => ({
        pipe: () => ({
          subscribe: (callback) =>
            callback({
              coherence: 0.3,
              confidence: 0.4,
              intensity: 0.5,
            }),
        }),
      }));

      const config = {
        productionSources: [mockSource],
        minStability: 0.8,
        maxErrorRate: 0.05,
        transitionSteps: 3,
        stepDuration: 1000,
      };

      let finalState = '';
      transition.getTransitionState$().subscribe((state) => {
        finalState = state;
      });

      try {
        await transition.startTransition(config);
      } catch (error) {
        expect(error.message).toContain('System instability detected');
      }

      expect(finalState).toBe('error');
    });
  });

  describe('Production Source Validation', () => {
    it('should validate production sources before transition', async () => {
      const validSource = {
        name: 'valid-source',
        test: async () => ({ valid: true }),
      };

      const invalidSource = {
        name: 'invalid-source',
        test: async () => ({ valid: false }),
      };

      const config = {
        productionSources: [validSource, invalidSource],
        minStability: 0.7,
        maxErrorRate: 0.05,
        transitionSteps: 5,
        stepDuration: 1000,
      };

      await expect(transition.startTransition(config)).rejects.toThrow('Invalid source');
    });
  });

  describe('Stability Monitoring', () => {
    it('should monitor and maintain system stability', async () => {
      const mockSource = {
        name: 'test-source',
        test: async () => ({ valid: true }),
      };

      const config = {
        productionSources: [mockSource],
        minStability: 0.7,
        maxErrorRate: 0.05,
        transitionSteps: 3,
        stepDuration: 1000,
      };

      const stabilityReadings: number[] = [];
      transition.getStabilityMetrics$().subscribe((metrics) => {
        stabilityReadings.push(metrics.stability);
      });

      await transition.startTransition(config);

      // Verify stability maintained above threshold
      stabilityReadings.forEach((stability) => {
        expect(stability).toBeGreaterThanOrEqual(config.minStability);
      });
    });
  });

  describe('Error Handling', () => {
    it('should recover from temporary instability', async () => {
      const mockSource = {
        name: 'test-source',
        test: async () => ({ valid: true }),
      };

      // Simulate temporary instability
      let unstableCount = 0;
      jest.spyOn(resonanceField, 'getResonanceState$').mockImplementation(() => ({
        pipe: () => ({
          subscribe: (callback) =>
            callback({
              coherence: unstableCount++ < 2 ? 0.3 : 0.8,
              confidence: 0.8,
              intensity: 0.7,
            }),
        }),
      }));

      const config = {
        productionSources: [mockSource],
        minStability: 0.7,
        maxErrorRate: 0.05,
        transitionSteps: 3,
        stepDuration: 1000,
      };

      await transition.startTransition(config);

      // Verify successful recovery
      const finalMetrics = await new Promise((resolve) => {
        transition.getStabilityMetrics$().subscribe((metrics) => {
          resolve(metrics);
        });
      });

      expect(finalMetrics.stability).toBeGreaterThanOrEqual(config.minStability);
    });
  });
});
