"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.domainTestScenarios = exports.testScenarios = void 0;
exports.testScenarios = [
    {
        name: 'High Resonance Pattern',
        description: 'Tests a pattern with strong demand signals and clear market fit',
        input: {
            demandPattern: {
                strength: 0.9,
                confidence: 0.85,
                source: 'market_analysis',
                status: 'active',
                signals: [
                    {
                        source: 'reddit',
                        strength: 0.9,
                        confidence: 0.85,
                        status: 'active',
                        content: 'Strong demand signal',
                        timestamp: new Date().toISOString(),
                    },
                ],
                timestamp: new Date().toISOString(),
            },
            threshold: 0.8,
        },
        expected: {
            resonanceScore: 0.875,
            matches: true,
        },
    },
];
exports.domainTestScenarios = [
    {
        name: 'High Value Domain Pattern',
        description: 'Tests a domain with strong SEO potential and market demand',
        input: {
            demandPattern: {
                strength: 0.95,
                confidence: 0.9,
                source: 'domain_analysis',
                status: 'active',
                signals: [
                    {
                        source: 'seo_metrics',
                        strength: 0.92,
                        confidence: 0.88,
                        metadata: {
                            domainAuthority: 85,
                            backlinks: 15000,
                            keywordRank: 'high',
                        },
                    },
                    {
                        source: 'market_demand',
                        strength: 0.95,
                        confidence: 0.92,
                        metadata: {
                            searchVolume: 250000,
                            competitionLevel: 'medium',
                            cpc: 2.5,
                        },
                    },
                    {
                        source: 'conversion_potential',
                        strength: 0.89,
                        confidence: 0.85,
                        metadata: {
                            brandability: 0.9,
                            memorability: 0.85,
                            targetMarket: 'tech',
                        },
                    },
                ],
            },
            threshold: 0.85,
        },
        expected: {
            resonanceScore: 0.92,
            matches: true,
        },
    },
    {
        name: 'Affiliate Optimization Pattern',
        description: 'Tests domain resonance with affiliate marketing potential',
        input: {
            demandPattern: {
                strength: 0.88,
                confidence: 0.85,
                source: 'affiliate_analysis',
                status: 'active',
                signals: [
                    {
                        source: 'niche_relevance',
                        strength: 0.9,
                        confidence: 0.87,
                        metadata: {
                            nicheMatch: 'high',
                            affiliatePrograms: 12,
                            averageCommission: 0.25,
                        },
                    },
                    {
                        source: 'traffic_potential',
                        strength: 0.85,
                        confidence: 0.82,
                        metadata: {
                            organicTraffic: 75000,
                            socialSignals: 'strong',
                            referralPotential: 0.8,
                        },
                    },
                ],
            },
            threshold: 0.8,
        },
        expected: {
            resonanceScore: 0.87,
            matches: true,
        },
    },
];
//# sourceMappingURL=resonancePatternTest.js.map