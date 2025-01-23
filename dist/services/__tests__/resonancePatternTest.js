"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResonancePatternTest = void 0;
const passiveEngagementAnalyzer_1 = require("../passiveEngagementAnalyzer");
const resonanceField_1 = require("../resonanceField");
const demandPrecognition_1 = require("../demandPrecognition");
const logger_1 = require("../../utils/logger");
class ResonancePatternTest {
    constructor() {
        this.testResults = new Map();
        this.TEST_SCENARIOS = [
            {
                id: 'natural_progression',
                description: 'Tests natural topic progression and engagement depth',
                signals: [
                    {
                        type: 'article_read',
                        source: 'blog_post_1',
                        duration: 180,
                        context: {
                            category: 'technology',
                            topic: ['software_development', 'beginner'],
                            sentiment: 0.5,
                        },
                    },
                    {
                        type: 'dwell_time',
                        source: 'documentation',
                        duration: 600,
                        context: {
                            category: 'technology',
                            topic: ['software_development', 'intermediate'],
                            sentiment: 0.7,
                        },
                    },
                    {
                        type: 'content_share',
                        source: 'tutorial',
                        context: {
                            category: 'technology',
                            topic: ['software_development', 'advanced'],
                            sentiment: 0.9,
                        },
                    },
                ],
                expectedPatterns: {
                    topicProgression: ['beginner', 'intermediate', 'advanced'],
                    engagementDepth: 0.8,
                    resonanceThreshold: 0.7,
                },
            },
            {
                id: 'value_discovery',
                description: 'Tests progression from awareness to value recognition',
                signals: [
                    {
                        type: 'article_read',
                        source: 'product_overview',
                        duration: 120,
                        context: {
                            category: 'product',
                            topic: ['features', 'overview'],
                            sentiment: 0.3,
                        },
                    },
                    {
                        type: 'dwell_time',
                        source: 'case_study',
                        duration: 480,
                        context: {
                            category: 'product',
                            topic: ['use_cases', 'benefits'],
                            sentiment: 0.6,
                        },
                    },
                    {
                        type: 'bookmark',
                        source: 'pricing_page',
                        context: {
                            category: 'product',
                            topic: ['pricing', 'comparison'],
                            sentiment: 0.8,
                        },
                    },
                ],
                expectedPatterns: {
                    topicProgression: ['overview', 'benefits', 'pricing'],
                    engagementDepth: 0.7,
                    resonanceThreshold: 0.6,
                },
            },
            {
                id: 'deep_research',
                description: 'Tests in-depth research behavior patterns',
                signals: [
                    {
                        type: 'article_read',
                        source: 'research_paper',
                        duration: 900,
                        context: {
                            category: 'academic',
                            topic: ['methodology', 'theory'],
                            sentiment: 0.4,
                        },
                    },
                    {
                        type: 'content_share',
                        source: 'discussion',
                        context: {
                            category: 'academic',
                            topic: ['analysis', 'critique'],
                            sentiment: 0.8,
                        },
                    },
                    {
                        type: 'return_visit',
                        source: 'research_paper',
                        duration: 1200,
                        context: {
                            category: 'academic',
                            topic: ['implementation', 'results'],
                            sentiment: 0.9,
                        },
                    },
                ],
                expectedPatterns: {
                    topicProgression: ['theory', 'analysis', 'implementation'],
                    engagementDepth: 0.9,
                    resonanceThreshold: 0.8,
                },
            },
        ];
        this.analyzer = new passiveEngagementAnalyzer_1.PassiveEngagementAnalyzer();
        this.resonanceField = new resonanceField_1.ResonanceField();
        this.precognition = new demandPrecognition_1.DemandPrecognition();
    }
    async runTests() {
        logger_1.logger.info('Starting Resonance Pattern Tests', {
            scenarios: this.TEST_SCENARIOS.length,
            timestamp: new Date('2024-12-20T12:07:12-05:00').toISOString(),
        });
        for (const scenario of this.TEST_SCENARIOS) {
            await this.runScenario(scenario);
        }
        await this.analyzeResults();
    }
    async runScenario(scenario) {
        const startTime = Date.now();
        try {
            // Process signals sequentially
            for (const signal of scenario.signals) {
                await this.analyzer.trackEngagement(signal);
            }
            // Get engagement insights
            const insights = await this.analyzer.getEngagementInsights(scenario.signals[0].source);
            // Calculate resonance
            const resonance = await this.calculateResonance(scenario, insights);
            // Store results
            this.testResults.set(scenario.id, {
                scenario,
                insights,
                resonance,
                duration: Date.now() - startTime,
            });
            logger_1.logger.info(`Completed scenario: ${scenario.id}`, {
                description: scenario.description,
                patterns: insights.patterns,
                resonance,
                error: null,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error(`Error in scenario: ${scenario.id}`, {
                error: errorMessage,
                scenario: scenario.id,
            });
        }
    }
    async calculateResonance(scenario, insights) {
        const resonanceScore = insights.metrics.genuineInterestScore *
            (insights.patterns.dwellTimeDistribution.size / scenario.signals.length);
        return resonanceScore;
    }
    async analyzeResults() {
        const analysis = {
            scenarios: this.TEST_SCENARIOS.length,
            successfulScenarios: 0,
            averageResonance: 0,
            patternFindings: new Map(),
            insights: [],
        };
        for (const [id, result] of this.testResults) {
            const scenario = result.scenario;
            const resonance = result.resonance;
            if (resonance >= (scenario.expectedPatterns.resonanceThreshold || 0)) {
                analysis.successfulScenarios++;
            }
            analysis.averageResonance += resonance;
            // Analyze pattern emergence
            this.analyzePatternEmergence(result, analysis);
        }
        analysis.averageResonance /= this.testResults.size;
        logger_1.logger.info('Resonance Pattern Test Results', {
            analysis,
            timestamp: new Date('2024-12-20T12:07:12-05:00').toISOString(),
        });
    }
    analyzePatternEmergence(result, analysis) {
        const patterns = result.insights.patterns;
        // Analyze topic progression
        patterns.topicProgression.forEach((sequence, topic) => {
            const progressionScore = this.calculateProgressionScore(sequence);
            analysis.patternFindings.set(topic, (analysis.patternFindings.get(topic) || 0) + progressionScore);
        });
        // Extract insights
        if (result.resonance > 0.7) {
            analysis.insights.push({
                scenarioId: result.scenario.id,
                keyPatterns: this.extractKeyPatterns(patterns),
                resonanceFactors: this.identifyResonanceFactors(result),
            });
        }
    }
    calculateProgressionScore(sequence) {
        if (sequence.length < 2)
            return 0;
        // Calculate how linear and consistent the progression is
        let score = 0;
        for (let i = 1; i < sequence.length; i++) {
            const gap = sequence[i] - sequence[i - 1];
            score += 1 / (1 + Math.abs(gap - 1)); // Ideal gap is 1
        }
        return score / (sequence.length - 1);
    }
    extractKeyPatterns(patterns) {
        const keyPatterns = [];
        // Extract patterns with strong progression
        for (const [topic, sequence] of patterns.topicProgression) {
            if (this.calculateProgressionScore(sequence) > 0.7) {
                keyPatterns.push(`Strong progression in ${topic}`);
            }
        }
        // Extract significant dwell time patterns
        for (const [topic, time] of patterns.dwellTimeDistribution) {
            if (time > 300) {
                // More than 5 minutes
                keyPatterns.push(`High engagement in ${topic}`);
            }
        }
        return keyPatterns;
    }
    identifyResonanceFactors(result) {
        const factors = [];
        const metrics = result.insights.metrics;
        if (metrics.genuineInterestScore > 0.8) {
            factors.push('High genuine interest');
        }
        if (metrics.engagementPattern.depth > 0.7) {
            factors.push('Deep engagement');
        }
        if (metrics.engagementPattern.consistency > 0.8) {
            factors.push('Consistent engagement');
        }
        return factors;
    }
}
exports.ResonancePatternTest = ResonancePatternTest;
//# sourceMappingURL=resonancePatternTest.js.map