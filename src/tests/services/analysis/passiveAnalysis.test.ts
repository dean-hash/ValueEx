import { LocalIntelligenceProvider } from '../../../services/analysis/providers/localIntelligence';
import { ResearchIntelligenceProvider } from '../../../services/analysis/providers/researchIntelligence';
import { ValueSignalProcessor } from '../../../services/analysis/providers/valueSignalProcessor';
import { DemandInference } from '../../../services/analysis/providers/demandInference';
import { CorrelationAnalyzer } from '../../../services/analysis/correlationAnalyzer';
import { DemandSignal } from '../../../types/mvp/demand';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Passive Analysis Test Suite
 *
 * These tests use real data and models but avoid:
 * 1. Making external API calls
 * 2. Sending alerts/notifications
 * 3. Writing to production databases
 * 4. Modifying system state
 *
 * Test data is loaded from local files and processed using:
 * - Local Ollama/Mistral for NLP
 * - Historical data for pattern analysis
 * - Cached research data for validation
 * - System metrics for resource analysis
 */

describe('Passive Analysis Integration', () => {
  let localIntelligence: LocalIntelligenceProvider;
  let researchIntelligence: ResearchIntelligenceProvider;
  let valueProcessor: ValueSignalProcessor;
  let demandInference: DemandInference;
  let correlationAnalyzer: CorrelationAnalyzer;

  // Load test data
  const loadTestData = (filename: string) => {
    const path = join(__dirname, '..', '..', 'data', filename);
    return JSON.parse(readFileSync(path, 'utf-8'));
  };

  beforeAll(async () => {
    // Initialize with test configuration
    localIntelligence = new LocalIntelligenceProvider('mistral');
    researchIntelligence = new ResearchIntelligenceProvider('llama2');
    valueProcessor = new ValueSignalProcessor();
    demandInference = new DemandInference();
    correlationAnalyzer = CorrelationAnalyzer.getInstance();

    // Load historical data
    const historicalSignals = loadTestData('historical_signals.json');
    const marketTrends = loadTestData('market_trends.json');
    const valuePatterns = loadTestData('value_patterns.json');

    // Warm up analysis engines
    await Promise.all([
      correlationAnalyzer.initializeWithHistoricalData(historicalSignals),
      valueProcessor.loadPatterns(valuePatterns),
      demandInference.trainOnHistoricalData(marketTrends),
    ]);
  });

  describe('Local Intelligence Analysis', () => {
    it('should analyze demand signals using local Ollama', async () => {
      const signal: DemandSignal = {
        id: 'test-local-1',
        query: 'need sustainable packaging solution for food delivery',
        source: 'business forum',
        strength: 0.8,
        vertical: { id: 'packaging', name: 'Packaging' },
        insights: {
          confidence: 0.7,
          urgency: 0.8,
          keywords: ['sustainable', 'food delivery', 'packaging'],
          context: 'Restaurant chain expanding delivery operations',
          valueEvidence: {
            authenticityMarkers: ['verified business', 'market research'],
            realWorldImpact: ['environmental impact', 'customer satisfaction'],
            practicalUtility: ['cost effective', 'food safe'],
          },
        },
      };

      const result = await localIntelligence.processSignal(signal);

      expect(result.analysis).toBeDefined();
      expect(result.analysis.matchQuality).toBeGreaterThan(0.7);
      expect(result.analysis.insights).toHaveLength(3);
      expect(result.analysis.confidence).toBeGreaterThan(0.6);
    });

    it('should batch process multiple signals efficiently', async () => {
      const signals = loadTestData('batch_test_signals.json');
      const results = await localIntelligence.processBatch(signals);

      expect(results).toHaveLength(signals.length);
      results.forEach((result) => {
        expect(result.error).toBeUndefined();
        expect(result.analysis.confidence).toBeGreaterThan(0.5);
      });
    });
  });

  describe('Research Intelligence Integration', () => {
    it('should validate signals against research data', async () => {
      const signal: DemandSignal = {
        id: 'test-research-1',
        query: 'AI-powered inventory optimization',
        source: 'industry research',
        strength: 0.9,
        vertical: { id: 'software', name: 'Software' },
        insights: {
          confidence: 0.8,
          urgency: 0.7,
          keywords: ['AI', 'inventory', 'optimization'],
          context: 'Retail chain seeking efficiency improvements',
          valueEvidence: {
            authenticityMarkers: ['market analysis', 'ROI studies'],
            realWorldImpact: ['reduced waste', 'improved margins'],
            practicalUtility: ['real-time tracking', 'predictive ordering'],
          },
        },
      };

      const result = await researchIntelligence.processSignal(signal);

      expect(result.validationScore).toBeGreaterThan(0.7);
      expect(result.marketTrends).toHaveLength(3);
      expect(result.competitiveAnalysis).toBeDefined();
    });
  });

  describe('Value Signal Processing', () => {
    it('should identify authentic value patterns', async () => {
      const signals = loadTestData('value_test_signals.json');
      const patterns = await valueProcessor.processSignals(signals);

      patterns.forEach((pattern) => {
        expect(pattern.authenticity).toBeGreaterThan(0.6);
        expect(pattern.evidence).toHaveLength(2);
        expect(pattern.confidence).toBeGreaterThan(0.7);
      });
    });

    it('should detect value creation opportunities', async () => {
      const signal = loadTestData('complex_value_signal.json');
      const opportunities = await valueProcessor.identifyOpportunities(signal);

      expect(opportunities).toHaveLength(2);
      opportunities.forEach((opportunity) => {
        expect(opportunity.potential).toBeGreaterThan(0.7);
        expect(opportunity.validation).toBeDefined();
        expect(opportunity.marketFit).toBeGreaterThan(0.6);
      });
    });
  });

  describe('Demand Pattern Analysis', () => {
    it('should recognize temporal patterns', async () => {
      const signals = loadTestData('temporal_signals.json');
      const patterns = await demandInference.analyzePatterns(signals);

      expect(patterns.seasonal).toBeDefined();
      expect(patterns.trending).toHaveLength(2);
      expect(patterns.cyclical).toBeDefined();
      patterns.trending.forEach((trend) => {
        expect(trend.confidence).toBeGreaterThan(0.7);
        expect(trend.evidence).toHaveLength(2);
      });
    });

    it('should identify demand drivers', async () => {
      const signal = loadTestData('complex_demand_signal.json');
      const drivers = await demandInference.identifyDrivers(signal);

      expect(drivers.primary).toBeDefined();
      expect(drivers.secondary).toHaveLength(2);
      expect(drivers.context).toBeDefined();
      expect(drivers.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Correlation Analysis', () => {
    it('should detect multi-source correlations', async () => {
      const sources = loadTestData('correlation_sources.json');
      const correlations = await correlationAnalyzer.analyzeMultiSource(sources);

      correlations.forEach((correlation) => {
        expect(correlation.coefficient).toBeDefined();
        expect(correlation.significance).toBeGreaterThan(0.05);
        expect(correlation.pattern).toBeDefined();
      });
    });

    it('should identify actionable patterns', async () => {
      const data = loadTestData('pattern_analysis_data.json');
      const patterns = await correlationAnalyzer.identifyActionablePatterns(data);

      patterns.forEach((pattern) => {
        expect(pattern.actionability).toBeGreaterThan(0.6);
        expect(pattern.evidence).toHaveLength(2);
        expect(pattern.confidence).toBeGreaterThan(0.7);
      });
    });
  });
});
