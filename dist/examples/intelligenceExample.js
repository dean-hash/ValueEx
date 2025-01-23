"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const intelligenceCoordinator_1 = require("../services/analysis/intelligenceCoordinator");
async function demonstrateIntelligenceSystem() {
    const coordinator = intelligenceCoordinator_1.IntelligenceCoordinator.getInstance();
    // Create a sample demand signal
    const signal = {
        id: 'sig_' + Date.now(),
        source: 'market_research',
        timestamp: Date.now(),
        type: 'implicit',
        confidence: 0.85,
        category: 'electronics',
        context: {
            keywords: ['smartphone', '5G', 'battery life'],
            relatedCategories: ['mobile_accessories'],
            sentiment: 0.75,
            urgency: 0.8,
            matches: [
                {
                    id: 'prod_1',
                    name: 'Premium Smartphone',
                    quality: 0.9,
                    features: ['5G', 'Long battery life', 'AI camera'],
                    opportunities: ['Bundle with accessories', 'Extended warranty'],
                    recommendations: ['Target tech-savvy users', 'Focus on battery life'],
                },
            ],
        },
        requirements: {
            features: ['5G', 'Long battery life', 'High performance'],
            constraints: {
                budget: 1000,
                timeline: 'immediate',
                location: 'north_america',
            },
        },
    };
    console.log('Processing signal through intelligence providers...');
    // Process through all relevant providers
    const enrichedSignal = await coordinator.processSignal(signal, 'demand');
    console.log('Enriched signal:', JSON.stringify(enrichedSignal, null, 2));
    // Monitor system resources
    coordinator.on('system_health', (data) => {
        console.log('System health update:', data);
    });
    coordinator.on('system_optimization', (data) => {
        console.log('Optimization suggestion:', data);
    });
    // Optimize system if needed
    await coordinator.optimizeSystem();
}
// Run the demonstration
demonstrateIntelligenceSystem().catch(console.error);
//# sourceMappingURL=intelligenceExample.js.map