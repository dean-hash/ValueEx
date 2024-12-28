import { ResonanceField } from '../resonanceField';
import { ResonanceError } from '../../types/errors';
import { firstValueFrom } from 'rxjs';

describe('ResonanceField', () => {
  let resonanceField: ResonanceField;

  beforeEach(() => {
    resonanceField = new ResonanceField();
  });

  describe('calculateResonance', () => {
    it('should calculate coherence and intensity for valid vectors', async () => {
      // Arrange
      const testVectors = {
        supply: {
          vectors: [
            {
              dimension: 'price',
              magnitude: 0.8,
              direction: 1,
              type: 'economic',
              strength: 0.8,
              context: ['market', 'pricing', 'value'],
            },
          ],
          coherence: 0.7,
          intensity: 0.8,
        },
        demand: {
          vectors: [
            {
              dimension: 'price',
              magnitude: 0.7,
              direction: -1,
              type: 'economic',
              strength: 0.7,
              context: ['market', 'pricing', 'value'],
            },
          ],
          coherence: 0.6,
          intensity: 0.7,
        },
      };

      // Act
      resonanceField['supplyField'].next(testVectors.supply);
      resonanceField['demandField'].next(testVectors.demand);

      const result = await firstValueFrom(resonanceField.resonance$);

      // Assert
      expect(result.coherence).toBeGreaterThan(0);
      expect(result.intensity).toBeGreaterThan(0);
      expect(result.vectors).toHaveLength(2);
    });

    it('should handle empty vector fields gracefully', async () => {
      // Arrange
      const emptyVectors = {
        vectors: [],
        coherence: 0,
        intensity: 0,
      };

      // Act
      resonanceField['supplyField'].next(emptyVectors);
      resonanceField['demandField'].next(emptyVectors);

      // Assert
      const subscription = resonanceField.resonance$.subscribe({
        next: () => {
          fail('Should not emit for empty vectors');
        },
        error: (error) => {
          expect(error).toBeInstanceOf(ResonanceError);
          expect(error.message).toBe('Empty vector fields detected');
        },
      });

      subscription.unsubscribe();
    });

    it('should calculate correct coherence for aligned vectors', async () => {
      // Arrange
      const alignedVectors = {
        supply: {
          vectors: [
            {
              dimension: 'quality',
              magnitude: 0.9,
              direction: 1,
              type: 'product',
              strength: 0.9,
              context: ['features', 'durability', 'performance'],
            },
          ],
          coherence: 0.8,
          intensity: 0.9,
        },
        demand: {
          vectors: [
            {
              dimension: 'quality',
              magnitude: 0.85,
              direction: 1,
              type: 'product',
              strength: 0.85,
              context: ['features', 'durability', 'performance'],
            },
          ],
          coherence: 0.75,
          intensity: 0.8,
        },
      };

      // Act
      resonanceField['supplyField'].next(alignedVectors.supply);
      resonanceField['demandField'].next(alignedVectors.demand);

      const result = await firstValueFrom(resonanceField.resonance$);

      // Assert
      expect(result.coherence).toBeCloseTo(1, 2);
      expect(result.intensity).toBeGreaterThan(0);
    });

    it('should handle mismatched dimensions correctly', async () => {
      // Arrange
      const mismatchedVectors = {
        supply: {
          vectors: [
            {
              dimension: 'innovation',
              magnitude: 0.7,
              direction: 1,
              type: 'technology',
              strength: 0.7,
              context: ['features', 'advancement', 'novelty'],
            },
          ],
          coherence: 0.6,
          intensity: 0.7,
        },
        demand: {
          vectors: [
            {
              dimension: 'reliability',
              magnitude: 0.8,
              direction: 1,
              type: 'product',
              strength: 0.8,
              context: ['stability', 'consistency', 'trust'],
            },
          ],
          coherence: 0.7,
          intensity: 0.8,
        },
      };

      // Act
      resonanceField['supplyField'].next(mismatchedVectors.supply);
      resonanceField['demandField'].next(mismatchedVectors.demand);

      const result = await firstValueFrom(resonanceField.resonance$);

      // Assert
      expect(result.coherence).toBeLessThan(0.5);
    });

    it('should handle varying magnitudes appropriately', async () => {
      // Arrange
      const variableMagnitudeVectors = {
        supply: {
          vectors: [
            {
              dimension: 'price',
              magnitude: 0.9,
              direction: 1,
              type: 'economic',
              strength: 0.9,
              context: ['market', 'pricing', 'value'],
            },
          ],
          coherence: 0.8,
          intensity: 0.9,
        },
        demand: {
          vectors: [
            {
              dimension: 'price',
              magnitude: 0.5,
              direction: -1,
              type: 'economic',
              strength: 0.5,
              context: ['market', 'pricing', 'value'],
            },
          ],
          coherence: 0.4,
          intensity: 0.5,
        },
      };

      // Act
      resonanceField['supplyField'].next(variableMagnitudeVectors.supply);
      resonanceField['demandField'].next(variableMagnitudeVectors.demand);

      const result = await firstValueFrom(resonanceField.resonance$);

      // Assert
      expect(result.intensity).toBeLessThan(1);
    });

    it('should maintain performance with large vector sets', async () => {
      // Arrange
      const largeVectorSet = {
        vectors: [
          {
            dimension: 'price',
            magnitude: 0.8,
            direction: 1,
            type: 'economic',
            strength: 0.8,
            context: ['market', 'pricing', 'value'],
          },
          {
            dimension: 'quality',
            magnitude: 0.7,
            direction: 1,
            type: 'product',
            strength: 0.7,
            context: ['features', 'durability', 'performance'],
          },
          {
            dimension: 'innovation',
            magnitude: 0.6,
            direction: 1,
            type: 'technology',
            strength: 0.6,
            context: ['features', 'advancement', 'novelty'],
          },
        ],
        coherence: 0.7,
        intensity: 0.8,
      };

      // Act
      const startTime = performance.now();
      resonanceField['supplyField'].next(largeVectorSet);
      resonanceField['demandField'].next(largeVectorSet);

      const result = await firstValueFrom(resonanceField.resonance$);
      const endTime = performance.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(150); // Increased threshold for CI environments
      expect(result.vectors).toHaveLength(6);
    });
  });
});
