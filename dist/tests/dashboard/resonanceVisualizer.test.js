import { ResonanceVisualizer } from '../../dashboard/resonanceVisualizer';
import { DataSimulator } from '../../core/simulation/dataSimulator';
import { ResonanceField } from '../../services/resonanceField';
describe('ResonanceVisualizer Integration Tests', () => {
    let visualizer;
    let simulator;
    let resonanceField;
    beforeEach(() => {
        // Setup DOM environment for Chart.js
        document.body.innerHTML = `
      <div>
        <canvas id="resonanceStrengthChart"></canvas>
        <canvas id="verifiedIncomeChart"></canvas>
        <canvas id="resonancePatternsChart"></canvas>
        <canvas id="coherenceChart"></canvas>
      </div>
    `;
        resonanceField = new ResonanceField();
        simulator = new DataSimulator();
        visualizer = new ResonanceVisualizer(resonanceField);
    });
    describe('Chart Initialization', () => {
        it('should initialize all charts correctly', () => {
            expect(visualizer.getCharts()).toHaveProperty('resonanceStrength');
            expect(visualizer.getCharts()).toHaveProperty('verifiedIncome');
            expect(visualizer.getCharts()).toHaveProperty('resonancePatterns');
            expect(visualizer.getCharts()).toHaveProperty('coherence');
        });
        it('should handle data updates from simulator', async () => {
            const mockPattern = {
                id: 'test-pattern',
                signals: [],
                confidence: 0.8,
                coherence: 0.7,
                intensity: 0.9,
                temporalFactors: {
                    trend: 0.5,
                    seasonality: 0.3,
                    volatility: 0.2
                },
                spatialFactors: {
                    geographic: ['US'],
                    demographic: ['adults'],
                    psychographic: ['tech-savvy']
                },
                context: {
                    market: 'test',
                    category: 'test',
                    priceRange: { min: 0, max: 100 },
                    intent: 'purchase',
                    location: {
                        country: 'US'
                    },
                    timeframe: 'immediate',
                    constraints: [],
                    preferences: []
                }
            };
            // Subscribe to simulator updates
            simulator.subscribe((data) => {
                visualizer.updateCharts(data);
            });
            // Start simulation
            simulator.start();
            // Wait for a few updates
            await new Promise(resolve => setTimeout(resolve, 2000));
            const charts = visualizer.getCharts();
            // Verify chart data
            expect(charts.resonanceStrength.data.datasets[0].data.length).toBeGreaterThan(0);
            expect(charts.verifiedIncome.data.datasets[0].data.length).toBeGreaterThan(0);
            expect(charts.resonancePatterns.data.datasets[0].data.length).toBeGreaterThan(0);
            expect(charts.coherence.data.datasets[0].data.length).toBeGreaterThan(0);
            // Stop simulation
            simulator.stop();
        });
    });
    describe('Resonance Field Integration', () => {
        it('should reflect resonance field state changes', async () => {
            // Add a demand pattern to the resonance field
            await resonanceField.addDemandSignal({
                id: 'test-signal',
                type: 'demand',
                strength: 0.8,
                context: {
                    market: 'test',
                    category: 'electronics',
                    intent: 'purchase'
                },
                timestamp: new Date(),
                source: 'test'
            });
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Verify charts reflect the new state
            const charts = visualizer.getCharts();
            const resonanceState = resonanceField.getResonanceState();
            expect(charts.coherence.data.datasets[0].data).toContain(resonanceState.coherence);
            expect(charts.resonanceStrength.data.datasets[0].data).toContain(resonanceState.intensity);
        });
        it('should handle multiple concurrent updates', async () => {
            const updatePromises = Array(5).fill(null).map((_, i) => resonanceField.addDemandSignal({
                id: `test-signal-${i}`,
                type: 'demand',
                strength: 0.5 + (i * 0.1),
                context: {
                    market: 'test',
                    category: 'electronics',
                    intent: 'purchase'
                },
                timestamp: new Date(),
                source: 'test'
            }));
            await Promise.all(updatePromises);
            await new Promise(resolve => setTimeout(resolve, 1000));
            const charts = visualizer.getCharts();
            expect(charts.resonancePatterns.data.datasets[0].data.length).toBeGreaterThanOrEqual(5);
        });
    });
    describe('Error Handling', () => {
        it('should handle missing DOM elements gracefully', () => {
            document.body.innerHTML = ''; // Remove all canvases
            expect(() => new ResonanceVisualizer(resonanceField)).not.toThrow();
        });
        it('should handle invalid data updates gracefully', () => {
            expect(() => visualizer.updateCharts(null)).not.toThrow();
            expect(() => visualizer.updateCharts(undefined)).not.toThrow();
            expect(() => visualizer.updateCharts({ invalid: 'data' })).not.toThrow();
        });
    });
    describe('Performance', () => {
        it('should handle rapid updates efficiently', async () => {
            const startTime = performance.now();
            const updateCount = 100;
            // Generate rapid updates
            for (let i = 0; i < updateCount; i++) {
                visualizer.updateCharts({
                    resonanceStrength: Math.random(),
                    verifiedIncome: Math.random() * 1000,
                    patterns: Array(5).fill(null).map(() => ({
                        strength: Math.random(),
                        coherence: Math.random(),
                        type: 'test'
                    })),
                    coherence: Math.random()
                });
            }
            const endTime = performance.now();
            const timePerUpdate = (endTime - startTime) / updateCount;
            // Each update should take less than 5ms on average
            expect(timePerUpdate).toBeLessThan(5);
        });
    });
});
//# sourceMappingURL=resonanceVisualizer.test.js.map