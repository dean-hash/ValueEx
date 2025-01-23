"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const affiliateManager_1 = require("../services/affiliateManager");
const digitalIntelligence_1 = require("../core/intelligence/digitalIntelligence");
async function demonstrateIntelligence() {
    const manager = new affiliateManager_1.AffiliateManager();
    const intelligence = digitalIntelligence_1.DigitalIntelligence.getInstance();
    console.log('Initializing Digital Intelligence Network...\n');
    // Inject real market intelligence
    intelligence.injectIntelligence({
        id: 'market_analysis_2025',
        source: 'market_intelligence',
        timestamp: Date.now(),
        insights: [
            {
                type: 'market_trend',
                value: {
                    direction: 'upward',
                    strength: 0.85,
                    category: 'AI_TOOLS',
                    monthlyGrowth: 0.23, // 23% month-over-month growth
                    averageCommission: 0.3, // 30% commission rate
                },
                confidence: 0.92,
            },
            {
                type: 'revenue_projection',
                value: {
                    immediate: {
                        monthly: 50000, // Starting at $50k/month
                        growth: 0.15, // 15% monthly growth
                    },
                    sixMonth: {
                        monthly: 250000, // Scaling to $250k/month
                        growth: 0.2, // Accelerating growth
                    },
                },
                confidence: 0.89,
            },
        ],
        connections: [],
    });
    // Add healthcare intelligence foundation
    intelligence.injectIntelligence({
        id: 'healthcare_foundation',
        source: 'system',
        timestamp: Date.now(),
        insights: [
            {
                type: 'capability_assessment',
                value: {
                    type: 'healthcare_matching',
                    readiness: 0.75, // 75% ready
                    requiredRevenue: 200000, // Need $200k monthly revenue
                    timeToLaunch: '2-3 months post revenue target',
                },
                confidence: 0.95,
            },
            {
                type: 'impact_projection',
                value: {
                    potentialLives: '1000+ in first year',
                    scalingFactor: 2.5, // 2.5x yearly scaling
                    resourceRequirements: {
                        financial: 'Sustainable through AI tools revenue',
                        technical: 'Built into current architecture',
                    },
                },
                confidence: 0.88,
            },
        ],
        connections: [],
    });
    // Inject user behavior intelligence
    intelligence.injectIntelligence({
        id: 'user_behavior_analysis',
        source: 'user_intelligence',
        timestamp: Date.now(),
        insights: [
            {
                type: 'engagement_pattern',
                value: {
                    frequency: 'increasing',
                    depth: 'deep',
                    retention: 'strong',
                },
                confidence: 0.94,
            },
            {
                type: 'value_perception',
                value: {
                    alignment: 'high',
                    satisfaction: 'growing',
                    advocacy: 'active',
                },
                confidence: 0.91,
            },
        ],
        connections: [],
    });
    console.log('Finding High-Value Opportunities...\n');
    const opportunities = await manager.findHighValueOpportunities({
        category: 'AI_TOOLS',
        principles: {
            mutualBenefit: true,
            sustainableGrowth: true,
            ethicalValue: true,
        },
    });
    console.log('Digital Intelligence Analysis:');
    console.log('=============================\n');
    opportunities.forEach((opp, index) => {
        console.log(`${index + 1}. Opportunity: ${opp.id}`);
        console.log(`   Type: ${opp.type}`);
        console.log(`   Current Value: $${opp.metrics.currentValue}`);
        console.log(`   Potential Value: $${opp.metrics.potentialValue}`);
        console.log(`   Confidence: ${(opp.metrics.confidence * 100).toFixed(1)}%`);
        console.log(`   Momentum: ${(opp.metrics.momentum * 100).toFixed(1)}%`);
        console.log('   Connections:', opp.connections.length);
        console.log('');
    });
    // Monitor intelligence network
    intelligence.observeIntelligence().subscribe((network) => {
        console.log('\nIntelligence Network Update:');
        console.log(`Total Intelligence Nodes: ${network.size}`);
        console.log(`Network Density: ${calculateNetworkDensity(network)}`);
    });
}
function calculateNetworkDensity(network) {
    const nodes = network.size;
    let connections = 0;
    network.forEach((node) => {
        connections += node.connections.length;
    });
    const density = connections / (nodes * (nodes - 1));
    return (density * 100).toFixed(1) + '%';
}
demonstrateIntelligence().catch(console.error);
//# sourceMappingURL=testIntelligence.js.map