"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const awinService_1 = require("../services/awinService");
const valueManifestor_1 = require("../services/resonance/valueManifestor");
const resonanceEngine_1 = require("../services/resonance/resonanceEngine");
const three_1 = require("three");
async function testResonantSearch() {
    const awinService = new awinService_1.AwinService('YOUR_API_KEY', 'YOUR_AFFILIATE_ID', { timeout: 5000 });
    const valueManifestor = valueManifestor_1.ValueManifestor.getInstance();
    const resonanceEngine = resonanceEngine_1.ResonanceEngine.getInstance();
    // Example: Someone in Minnesota interested in indoor gardening
    const pattern = {
        id: 'dp_' + Date.now(),
        keywords: ['indoor', 'herbs', 'growing', 'kit'],
        category: 'Home & Garden',
        location: {
            country: 'US',
            region: 'Minnesota',
        },
        intensity: 8,
        context: {
            purpose: 'Start indoor herb garden during winter',
            preferences: ['organic', 'beginner-friendly'],
            constraints: ['limited space', 'low light'],
        },
        temporalFactors: {
            seasonality: true,
            specialEvents: ['winter gardening'],
        },
        resonanceFactors: {
            sustainability: 8,
            localImpact: 7,
            innovationLevel: 6,
        },
        signals: [
            {
                id: crypto.randomUUID(),
                title: 'search_trend',
                content: 'google_trends',
                url: '',
                type: 'search_trend',
                strength: 0.85,
                source: 'google_trends',
                timestamp: new Date().toISOString(),
                confidence: 0.9,
                metadata: {},
            },
            {
                id: crypto.randomUUID(),
                title: 'seasonal_demand',
                content: 'market_analysis',
                url: '',
                type: 'seasonal_demand',
                strength: 0.92,
                source: 'market_analysis',
                timestamp: new Date().toISOString(),
                confidence: 0.9,
                metadata: {},
            },
        ],
        confidence: 0.89,
        coherence: 0.91,
        spatialFactors: {
            density: 0.75,
            distribution: 'clustered',
            hotspots: [
                {
                    location: {
                        latitude: 44.9778,
                        longitude: -93.265,
                    },
                    intensity: 0.88,
                },
            ],
        },
    };
    try {
        console.log('Initializing resonance field...');
        const field = resonanceEngine.createField(new three_1.Vector3(0, 1, 0), 144 // Harmonic radius
        );
        console.log('Searching for resonant products with pattern:', JSON.stringify(pattern, null, 2));
        const products = await awinService.searchProducts(pattern);
        // Add products to resonance field
        products.forEach((product, index) => {
            const angle = (index / products.length) * Math.PI * 2;
            resonanceEngine.addPoint(field, {
                position: new three_1.Vector3(Math.cos(angle) * 10, 1, Math.sin(angle) * 10),
                intensity: product.resonanceScore / 10,
                frequency: 432 + index * 12, // Harmonic progression
                phase: angle,
            });
        });
        // Detect value patterns
        console.log('\nDetecting value patterns...');
        const valuePatterns = resonanceEngine
            .detectValuePatterns(field)
            .map((signal) => ({
            ...signal,
            confidence: 0.9,
            dependencies: [],
            risks: [],
            metadata: {},
        }));
        const actionablePatterns = valuePatterns.filter((p) => p.probability > 0.8);
        console.log(`\nFound ${products.length} resonant products and ${actionablePatterns.length} actionable value patterns:\n`);
        // Display products with their value patterns
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.title}`);
            console.log(`   Price: ${product.currency} ${product.price}`);
            console.log(`   Resonance Score: ${product.resonanceScore}`);
            console.log(`   Merchant: ${product.merchant.name}`);
            console.log(`   URL: ${product.url}`);
            const relatedPatterns = actionablePatterns.filter((p) => p.resonancePoints.some((point) => point.frequency === 432 + index * 12));
            if (relatedPatterns.length > 0) {
                console.log('   Value Patterns:');
                relatedPatterns.forEach((pattern) => {
                    console.log(`     - Type: ${pattern.type}`);
                    console.log(`     - Strength: ${pattern.strength.toFixed(2)}`);
                    console.log(`     - Time to Value: ${pattern.timeToValue} minutes`);
                    console.log(`     - Estimated Value: $${pattern.estimatedValue.toFixed(2)}`);
                });
            }
            console.log();
        });
        // Transform high-probability patterns to actions
        console.log('\nTransforming patterns to actions...');
        for (const pattern of actionablePatterns) {
            await valueManifestor.processPattern(pattern);
        }
    }
    catch (error) {
        console.error('Error testing resonant search:', error);
    }
}
testResonantSearch();
//# sourceMappingURL=testResonantSearch.js.map