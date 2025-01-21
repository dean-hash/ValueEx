import { PassiveEngagementAnalyzer } from '../passiveEngagementAnalyzer';
import { ResonanceField } from '../resonanceField';
import { DemandPrecognition } from '../demandPrecognition';
import { logger } from '../../utils/logger';

interface TestScenario {
  id: string;
  description: string;
  signals: Array<{
    type: 'article_read' | 'content_share' | 'bookmark' | 'return_visit' | 'dwell_time';
    source: string;
    duration?: number;
    context: {
      category: string;
      topic: string[];
      sentiment: number;
    };
  }>;
  expectedPatterns: {
    topicProgression?: string[];
    engagementDepth?: number;
    resonanceThreshold?: number;
  };
}

class ResonancePatternTest {
  private analyzer: PassiveEngagementAnalyzer;
  private resonanceField: ResonanceField;
  private precognition: DemandPrecognition;
  private testResults: Map<string, any> = new Map();

  constructor() {
    this.analyzer = new PassiveEngagementAnalyzer();
    this.resonanceField = new ResonanceField();
    this.precognition = new DemandPrecognition();
  }

  private readonly TEST_SCENARIOS: TestScenario[] = [
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

  async runTests(): Promise<void> {
    logger.info('Starting Resonance Pattern Tests', {
      scenarios: this.TEST_SCENARIOS.length,
      timestamp: new Date('2024-12-20T12:07:12-05:00').toISOString(),
    });

    for (const scenario of this.TEST_SCENARIOS) {
      await this.runScenario(scenario);
    }

    await this.analyzeResults();
  }

  private async runScenario(scenario: TestScenario): Promise<void> {
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

      logger.info(`Completed scenario: ${scenario.id}`, {
        description: scenario.description,
        patterns: insights.patterns,
        resonance,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in scenario: ${scenario.id}`, {
        error: errorMessage,
        scenario: scenario.id,
      });
    }
  }

  private async calculateResonance(scenario: TestScenario, insights: any): Promise<number> {
    const resonanceScore =
      insights.metrics.genuineInterestScore *
      (insights.patterns.dwellTimeDistribution.size / scenario.signals.length);

    return resonanceScore;
  }

  private async analyzeResults(): Promise<void> {
    const analysis = {
      scenarios: this.TEST_SCENARIOS.length,
      successfulScenarios: 0,
      averageResonance: 0,
      patternFindings: new Map<string, number>(),
      insights: [],
    };

    for (const [id, result] of this.testResults) {
      const scenario = result.scenario as TestScenario;
      const resonance = result.resonance as number;

      if (resonance >= (scenario.expectedPatterns.resonanceThreshold || 0)) {
        analysis.successfulScenarios++;
      }

      analysis.averageResonance += resonance;

      // Analyze pattern emergence
      this.analyzePatternEmergence(result, analysis);
    }

    analysis.averageResonance /= this.testResults.size;

    logger.info('Resonance Pattern Test Results', {
      analysis,
      timestamp: new Date('2024-12-20T12:07:12-05:00').toISOString(),
    });
  }

  private analyzePatternEmergence(result: any, analysis: any): void {
    const patterns = result.insights.patterns;

    // Analyze topic progression
    patterns.topicProgression.forEach((sequence: number[], topic: string) => {
      const progressionScore = this.calculateProgressionScore(sequence);
      analysis.patternFindings.set(
        topic,
        (analysis.patternFindings.get(topic) || 0) + progressionScore
      );
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

  private calculateProgressionScore(sequence: number[]): number {
    if (sequence.length < 2) return 0;

    // Calculate how linear and consistent the progression is
    let score = 0;
    for (let i = 1; i < sequence.length; i++) {
      const gap = sequence[i] - sequence[i - 1];
      score += 1 / (1 + Math.abs(gap - 1)); // Ideal gap is 1
    }

    return score / (sequence.length - 1);
  }

  private extractKeyPatterns(patterns: any): string[] {
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

  private identifyResonanceFactors(result: any): string[] {
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

export { ResonancePatternTest };
export type { TestScenario };
