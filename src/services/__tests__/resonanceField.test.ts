import { ResonanceFieldService } from '../resonanceField';
import { ResonanceError } from '../../types/errors';
import { firstValueFrom } from 'rxjs';
import { ResonanceMetrics, ResonanceState, ResonanceVector } from '../../types/resonanceTypes';
import { IResonanceField } from '../../interfaces/resonanceField';

describe('ResonanceFieldService', () => {
  let resonanceField: ResonanceFieldService;

  beforeEach(() => {
    resonanceField = ResonanceFieldService.getInstance();
  });

  describe('singleton pattern', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = ResonanceFieldService.getInstance();
      const instance2 = ResonanceFieldService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(resonanceField.initialize()).resolves.not.toThrow();
    });
  });

  describe('state management', () => {
    it('should return current state with patterns and metrics', () => {
      const state = resonanceField.getCurrentState();
      expect(state).toHaveProperty('patterns');
      expect(state).toHaveProperty('metrics');
      expect(state.metrics).toHaveProperty('coherence');
      expect(state.metrics).toHaveProperty('intensity');
      expect(state.metrics).toHaveProperty('confidence');
    });
  });

  describe('pattern observation', () => {
    it('should emit resonance patterns', async () => {
      const pattern = await firstValueFrom(resonanceField.observePatterns());
      expect(pattern).toHaveProperty('id');
      expect(pattern).toHaveProperty('type', 'resonance');
      expect(pattern).toHaveProperty('metrics');
      expect(pattern).toHaveProperty('timestamp');
    });
  });

  describe('calculateResonance', () => {
    it('should calculate coherence and intensity for valid vectors', async () => {
      // Arrange
      const supplyState: ResonanceState = {
        vectors: {
          supply: [
            {
              dimension: 'price',
              magnitude: 0.8,
              direction: [1],
              type: 'economic',
              strength: 0.8,
              context: ['market', 'pricing', 'value'],
            },
          ],
          demand: [],
        },
        coherence: 0.7,
        intensity: 0.8,
        confidence: 0.85,
      };

      const demandState: ResonanceState = {
        vectors: {
          supply: [],
          demand: [
            {
              dimension: 'price',
              magnitude: 0.7,
              direction: [-1],
              type: 'economic',
              strength: 0.7,
              context: ['market', 'pricing', 'value'],
            },
          ],
        },
        coherence: 0.6,
        intensity: 0.7,
        confidence: 0.9,
      };

      // Act
      resonanceField.addSupplyVector(supplyState.vectors.supply[0]);
      resonanceField.addDemandVector(demandState.vectors.demand[0]);

      // Assert
      const resonanceMetrics = resonanceField.getResonanceState();
      expect(resonanceMetrics.coherence).toBeGreaterThan(0);
      expect(resonanceMetrics.intensity).toBeGreaterThan(0);
      expect(resonanceMetrics.confidence).toBeGreaterThan(0);
    });

    it('should handle empty vectors gracefully', async () => {
      const emptyState: ResonanceState = {
        vectors: {
          supply: [],
          demand: [],
        },
        coherence: 0,
        intensity: 0,
        confidence: 0,
      };

      const metrics = resonanceField.getResonanceState();
      expect(metrics).toEqual({
        coherence: 0,
        intensity: 0,
        confidence: 0,
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid vector data', () => {
      const invalidVector = {
        dimension: 'price',
        magnitude: -1, // Invalid magnitude
        direction: [], // Empty direction
        type: 'economic',
        strength: 2, // Invalid strength > 1
        context: [],
      } as ResonanceVector;

      expect(() => resonanceField.addSupplyVector(invalidVector)).not.toThrow();
      const metrics = resonanceField.getResonanceState();
      expect(metrics.coherence).toBe(0);
    });
  });
});
