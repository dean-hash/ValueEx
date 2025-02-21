import { ResonanceField } from '../../services/resonanceField';
import { AwinService } from '../../services/awinService';
import { DataSimulator } from '../../core/simulation/dataSimulator';
import { ResonanceVisualizer } from '../../dashboard/resonanceVisualizer';
import { IntelligenceEnhancer } from '../../services/intelligence/intelligenceEnhancer';
import { Logger } from '../../logger/logger';
describe('Resonance Ecosystem Integration', () => {
    let resonanceField;
    let awinService;
    let dataSimulator;
    let visualizer;
    let enhancer;
    let logger;
    beforeEach(() => {
        // Setup DOM for visualizer
        document.body.innerHTML = `
      <div>
        <canvas id="resonanceStrengthChart"></canvas>
        <canvas id="verifiedIncomeChart"></canvas>
        <canvas id="resonancePatternsChart"></canvas>
        <canvas id="coherenceChart"></canvas>
      </div>
    `;
        logger = new Logger();
        resonanceField = new ResonanceField();
        awinService = new AwinService('test-api-key', 'test-publisher-id', { timeout: 5000 });
        dataSimulator = new DataSimulator();
        visualizer = new ResonanceVisualizer(resonanceField);
        enhancer = IntelligenceEnhancer.getInstance();
    });
    describe('End-to-End Flow', () => {
        it('should process demand patterns through the entire ecosystem', async () => {
            // 1. Create a demand pattern
            const pattern = {
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
                    category: 'electronics',
                    priceRange: { min: 0, max: 1000 },
                    intent: 'purchase',
                    location: { country: 'US' },
                    timeframe: 'immediate',
                    constraints: [],
                    preferences: []
                }
            };
            // 2. Process through intelligence enhancer
            const enhancedPattern = await enhancer.enhanceDemandPattern(pattern);
            expect(enhancedPattern.confidence).toBeGreaterThan(pattern.confidence);
            // 3. Search for matching products
            const products = await awinService.searchProducts(enhancedPattern);
            expect(products.length).toBeGreaterThan(0);
            // 4. Add products to resonance field
            for (const product of products) {
                await resonanceField.addProduct(product);
            }
            // 5. Verify resonance field state
            const resonanceState = resonanceField.getResonanceState();
            expect(resonanceState.coherence).toBeGreaterThan(0);
            expect(resonanceState.intensity).toBeGreaterThan(0);
            // 6. Verify visualization updates
            const charts = visualizer.getCharts();
            expect(charts.resonanceStrength.data.datasets[0].data.length).toBeGreaterThan(0);
            expect(charts.coherence.data.datasets[0].data.length).toBeGreaterThan(0);
        });
    });
    describe('Ecosystem Stability', () => {
        it('should maintain coherence under load', async () => {
            // Subscribe simulator to resonance field
            dataSimulator.subscribe(async (data) => {
                // Update resonance field
                await resonanceField.addDemandSignal({
                    id: `sim-${Date.now()}`,
                    type: 'demand',
                    strength: data.resonanceStrength,
                    context: {
                        market: 'test',
                        category: 'electronics',
                        intent: 'purchase'
                    },
                    timestamp: new Date(),
                    source: 'simulator'
                });
                // Update visualization
                visualizer.updateCharts(data);
            });
            // Start simulation
            dataSimulator.start();
            // Run for 5 seconds
            await new Promise(resolve => setTimeout(resolve, 5000));
            // Check ecosystem stability
            const resonanceState = resonanceField.getResonanceState();
            expect(resonanceState.coherence).toBeGreaterThan(0.5);
            expect(resonanceState.confidence).toBeGreaterThan(0.5);
            // Verify visualization reflects stable state
            const charts = visualizer.getCharts();
            const recentCoherence = charts.coherence.data.datasets[0].data.slice(-5);
            const coherenceVariance = calculateVariance(recentCoherence);
            expect(coherenceVariance).toBeLessThan(0.1); // Low variance indicates stability
            // Stop simulation
            dataSimulator.stop();
        });
    });
    describe('Error Recovery', () => {
        it('should recover from component failures', async () => {
            // Simulate component failure
            resonanceField = null;
            // Recreate failed component
            resonanceField = new ResonanceField();
            visualizer = new ResonanceVisualizer(resonanceField);
            // Verify system recovers
            const pattern = {
                id: 'recovery-test',
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
                    category: 'electronics',
                    priceRange: { min: 0, max: 1000 },
                    intent: 'purchase',
                    location: { country: 'US' },
                    timeframe: 'immediate',
                    constraints: [],
                    preferences: []
                }
            };
            await resonanceField.addDemandSignal({
                id: 'recovery-signal',
                type: 'demand',
                strength: 0.8,
                context: pattern.context,
                timestamp: new Date(),
                source: 'test'
            });
            const resonanceState = resonanceField.getResonanceState();
            expect(resonanceState.coherence).toBeGreaterThanOrEqual(0);
            expect(resonanceState.intensity).toBeGreaterThanOrEqual(0);
        });
    });
});
// Utility function for calculating variance
function calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}
//# sourceMappingURL=resonanceEcosystem.test.js.map