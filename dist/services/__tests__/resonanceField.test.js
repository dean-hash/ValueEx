import { ResonanceField } from '../resonanceField';
describe('ResonanceField', () => {
    let resonanceField;
    beforeEach(() => {
        resonanceField = new ResonanceField();
    });
    describe('calculateResonance', () => {
        it('should calculate coherence and intensity for valid vectors', async () => {
            // Arrange
            const supplyState = {
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
            const demandState = {
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
            const result = resonanceField.getResonanceState();
            // Assert
            expect(result.coherence).toBeGreaterThan(0);
            expect(result.intensity).toBeGreaterThan(0);
            expect(result.confidence).toBeGreaterThan(0);
        });
        it('should handle empty vectors gracefully', async () => {
            // Arrange
            const emptyState = {
                vectors: {
                    supply: [],
                    demand: [],
                },
                coherence: 0,
                intensity: 0,
                confidence: 0,
            };
            // Act
            const result = resonanceField.getResonanceState();
            // Assert
            expect(result.coherence).toBe(0);
            expect(result.intensity).toBe(0);
            expect(result.confidence).toBe(0);
        });
    });
    describe('vector normalization', () => {
        it('should normalize vectors correctly', async () => {
            // Arrange
            const testVector = {
                dimension: 'price',
                magnitude: 1.5,
                direction: [2],
                type: 'economic',
                strength: 1.2,
                context: ['market'],
            };
            // Act
            resonanceField.addSupplyVector(testVector);
            const result = resonanceField.getResonanceState();
            // Assert
            expect(result.coherence).toBeLessThanOrEqual(1);
            expect(result.intensity).toBeLessThanOrEqual(1);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });
    });
    describe('error handling', () => {
        it('should handle invalid vectors gracefully', async () => {
            // Arrange
            const invalidVector = {
                dimension: 'invalid',
                magnitude: NaN,
                direction: [NaN],
                type: 'unknown',
                strength: NaN,
                context: [],
            };
            // Act
            resonanceField.addSupplyVector(invalidVector);
            const result = resonanceField.getResonanceState();
            // Assert
            expect(result.coherence).toBe(0);
            expect(result.intensity).toBe(0);
            expect(result.confidence).toBe(0);
        });
    });
});
//# sourceMappingURL=resonanceField.test.js.map