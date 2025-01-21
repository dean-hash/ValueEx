import { DemandSourceManager } from '../services/demandSources/demandSourceManager';
import { RedditScraper } from '../services/demandSources/redditScraper';
import { GoogleTrendsScraper } from '../services/demandSources/googleTrendsScraper';
import { ScrapedDemandSignal } from '../types/demandTypes';

describe('DemandSourceManager', () => {
  let manager: DemandSourceManager;

  beforeEach(() => {
    manager = new DemandSourceManager();
  });

  test('should initialize with default sources', () => {
    const sources = (manager as any).sources;
    expect(sources.has('reddit')).toBe(true);
    expect(sources.has('twitter')).toBe(true);
    expect(sources.has('googleTrends')).toBe(true);
    expect(sources.has('ecommerce')).toBe(true);
  });

  test('should normalize weights correctly', () => {
    const weights = (manager as any).sourceWeights;
    const totalWeight = Array.from(weights.values()).reduce((sum, w) => sum + w, 0);
    expect(totalWeight).toBeCloseTo(1);
  });

  test('should gather and aggregate signals from multiple sources', async () => {
    const signals = await manager.gatherDemandSignals('test query');
    expect(Array.isArray(signals)).toBe(true);

    signals.forEach((signal) => {
      expect(signal).toHaveProperty('metadata.source');
      expect(signal).toHaveProperty('metadata.sourceWeight');
      expect(signal.confidence.overall).toBeGreaterThanOrEqual(0);
      expect(signal.confidence.overall).toBeLessThanOrEqual(1);
    });
  });
});

describe('RedditScraper', () => {
  let scraper: RedditScraper;

  beforeEach(() => {
    scraper = new RedditScraper();
  });

  test('should validate signals correctly', () => {
    const validSignal: ScrapedDemandSignal = {
      id: 'test-id',
      title: 'Test Title',
      content: 'Test Content',
      url: 'https://reddit.com/r/test/123',
      timestamp: new Date().toISOString(),
      confidence: {
        overall: 0.8,
        factors: {
          textQuality: 0.8,
          communityEngagement: 0.7,
          authorCredibility: 0.9,
          contentRelevance: 0.8,
          temporalRelevance: 0.7,
        },
      },
      context: {
        thread: {
          id: 'thread-id',
          depth: 0,
          isOriginalPost: true,
        },
        author: {
          id: 'author123',
        },
        community: {
          name: 'test',
          topicRelevance: 0.8,
        },
      },
      analysis: {
        sentiment: 0.5,
        topics: [],
        pricePoints: [],
        features: {},
        relationships: {
          relatedThreads: [],
          crossReferences: [],
          temporalConnections: [],
        },
      },
      metadata: {
        processingTime: Date.now(),
        extractionVersion: '1.0.0',
        dataQualityScore: 0.8,
      },
    };

    const invalidSignal = { ...validSignal, id: undefined };

    expect(scraper.validateSignal(validSignal)).toBe(true);
    expect(scraper.validateSignal(invalidSignal as any)).toBe(false);
  });

  test('should scrape subreddits with proper error handling', async () => {
    const signals = await scraper.scrape('typescript', {
      subreddits: ['programming', 'typescript'],
    });

    expect(Array.isArray(signals)).toBe(true);
    signals.forEach((signal) => {
      expect(signal).toHaveProperty('id');
      expect(signal).toHaveProperty('confidence.overall');
      expect(signal.confidence.overall).toBeGreaterThanOrEqual(0);
      expect(signal.confidence.overall).toBeLessThanOrEqual(1);
    });
  });
});

describe('GoogleTrendsScraper', () => {
  let scraper: GoogleTrendsScraper;

  beforeEach(() => {
    scraper = new GoogleTrendsScraper();
  });

  test('should calculate momentum correctly', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const momentum = (scraper as any).calculateMomentum(values);
    expect(momentum).toBeGreaterThan(0); // Positive trend
    expect(momentum).toBeLessThanOrEqual(1);
  });

  test('should calculate seasonality correctly', () => {
    // Create mock data for a full year (52 weeks)
    const values = Array(52)
      .fill(0)
      .map((_, i) => {
        // Add some seasonal variation
        return 50 + Math.sin((i * 2 * Math.PI) / 52) * 25;
      });

    const seasonality = (scraper as any).calculateSeasonality(values);
    expect(seasonality).toBeGreaterThan(0);
    expect(seasonality).toBeLessThanOrEqual(1);
  });

  test('should calculate volatility correctly', () => {
    const stableValues = Array(10).fill(50);
    const volatileValues = [10, 90, 20, 80, 30, 70, 40, 60, 50, 50];

    const stableVolatility = (scraper as any).calculateVolatility(stableValues);
    const highVolatility = (scraper as any).calculateVolatility(volatileValues);

    expect(stableVolatility).toBeLessThan(highVolatility);
    expect(stableVolatility).toBeCloseTo(0);
  });

  test('should create valid signal from trend metrics', () => {
    const mockMetrics = {
      currentValue: 0.75,
      historicalAverage: 0.5,
      momentum: 0.25,
      seasonalityScore: 0.3,
      volatility: 0.2,
      regionalSpread: {
        global: 0.8,
        local: 0.6,
        ratio: 0.75,
      },
      relatedQueries: [],
    };

    const mockRelatedQueries = [
      { query: 'related1', correlation: 0.8 },
      { query: 'related2', correlation: 0.6 },
    ];

    const signal = (scraper as any).createSignal('test-query', mockMetrics, mockRelatedQueries);

    expect(signal).toHaveProperty('id');
    expect(signal).toHaveProperty('confidence.overall');
    expect(signal.confidence.overall).toBeGreaterThan(0);
    expect(signal.confidence.overall).toBeLessThanOrEqual(1);
    expect(signal.analysis.topics[0].keywords).toHaveLength(2);
    expect(signal.metadata.source).toBe('google-trends');
  });

  test('should handle API errors gracefully', async () => {
    // Mock a failed API call
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));

    const signals = await scraper.scrape('test-query');
    expect(Array.isArray(signals)).toBe(true);
    expect(signals).toHaveLength(0);
  });

  test('should validate signals correctly', () => {
    const validSignal = {
      id: 'test-id',
      timestamp: new Date().toISOString(),
      confidence: {
        overall: 0.8,
      },
    };

    const invalidSignal = {
      id: 'test-id',
      timestamp: new Date().toISOString(),
      confidence: {
        overall: 1.5, // Invalid confidence > 1
      },
    };

    expect(scraper.validateSignal(validSignal as any)).toBe(true);
    expect(scraper.validateSignal(invalidSignal as any)).toBe(false);
  });
});
