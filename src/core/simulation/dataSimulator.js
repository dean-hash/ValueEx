/**
 * @deprecated This is a temporary simulation class that needs to be replaced with real data sources.
 * 
 * MVP IMPLEMENTATION PLAN (Total: 3 hours)
 * 
 * Phase 1: Revenue-Critical Metrics (1 hour)
 * - Replace simulated product metrics with real Awin API data:
 *   • Product prices and availability (15min)
 *   • Merchant conversion rates (15min)
 *   • Commission rates and potential earnings (15min)
 * - Implement basic caching to stay within API limits (15min)
 * 
 * Phase 2: User Value Metrics (1 hour)
 * - Integrate core ResonanceField calculations:
 *   • Product-demand matching score (20min)
 *   • Price range optimization (20min)
 *   • Basic market trend analysis (20min)
 * 
 * Phase 3: MVP Dashboard (1 hour)
 * - Create real-time metrics dashboard:
 *   • Potential revenue per recommendation (20min)
 *   • Conversion probability indicators (20min)
 *   • Product-market fit scores (20min)
 * 
 * FUTURE ENHANCEMENTS (Post-MVP):
 * 1. Market Data Integration:
 *    - Google Trends API for market validation
 *    - Price indices for market positioning
 *    - Consumer sentiment analysis
 * 
 * 2. Advanced Analytics:
 *    - Machine learning for trend prediction
 *    - Competitor analysis
 *    - Market segmentation
 */
export class DataSimulator {
    constructor() {
        this.simulationInterval = null;
        this.subscribers = new Set();
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    startSimulation() {
        if (this.simulationInterval) return;

        this.simulationInterval = setInterval(() => {
            const resonanceData = this.generateResonanceData();
            this.notifySubscribers(resonanceData);
        }, 1000);
    }

    stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
    }

    notifySubscribers(data) {
        this.subscribers.forEach(callback => callback(data));
    }

    generateResonanceData() {
        return {
            strength: Math.random() * 100,
            coherence: Math.random(),
            amplitude: Math.random() * 100,
            harmony: Math.random() * 100,
            impact: Math.random() * 100,
            reach: Math.random() * 100,
            timestamp: new Date()
        };
    }
}
