import { digitalIntelligence } from '../../services/digitalIntelligence';
import { MARKET_VERTICALS } from '../../types/marketTypes';
describe('Digital Intelligence Integration Tests', () => {
    jest.setTimeout(30000); // Increase timeout for OpenAI calls
    it('should analyze need with vertical detection', async () => {
        const analysis = await digitalIntelligence.analyzeNeed('wireless headphones');
        expect(analysis).toHaveProperty('vertical');
        expect(analysis.vertical?.id).toBe('electronics');
        expect(analysis.signals).toHaveLength(3); // market, demand, urgency
        expect(analysis.accuracy.confidence).toBeGreaterThan(0.6);
    });
    it('should provide vertical-specific recommendations', async () => {
        const analysis = await digitalIntelligence.analyzeNeed('summer dress', 'fashion');
        expect(analysis.vertical?.id).toBe('fashion');
        expect(analysis.recommendedActions.length).toBeGreaterThan(0);
        expect(analysis.signals.some((s) => s.metadata.vertical?.characteristics.seasonality ===
            MARKET_VERTICALS.fashion.characteristics.seasonality)).toBe(true);
    });
    it('should adjust confidence based on vertical fit', async () => {
        const techProduct = await digitalIntelligence.analyzeNeed('smart watch', 'electronics');
        const misplacedProduct = await digitalIntelligence.analyzeNeed('smart watch', 'fashion');
        expect(techProduct.accuracy.confidence).toBeGreaterThan(misplacedProduct.accuracy.confidence);
    });
    it('should consider vertical characteristics in urgency analysis', async () => {
        const impulseProduct = await digitalIntelligence.analyzeNeed('trending t-shirt', 'fashion');
        const consideredProduct = await digitalIntelligence.analyzeNeed('sofa set', 'homegoods');
        const impulseUrgency = impulseProduct.signals.find((s) => s.type === 'urgency')?.strength || 0;
        const consideredUrgency = consideredProduct.signals.find((s) => s.type === 'urgency')?.strength || 0;
        // Impulse purchases should generally show higher urgency
        expect(impulseUrgency).toBeGreaterThan(consideredUrgency);
    });
});
//# sourceMappingURL=digitalIntelligence.integration.test.js.map