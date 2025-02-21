import { describe, test, expect } from '@jest/globals';
import { GoogleTrendsScraper } from '../../services/demandSources/googleTrendsScraper';
import type { DemandSignal, UnknownData } from '../../types/demandTypes';

describe('Google Trends Scraper', () => {
  let scraper: GoogleTrendsScraper;
  let coordinator: IntelligenceCoordinator;

  beforeEach(() => {
    scraper = new GoogleTrendsScraper();
    coordinator = new IntelligenceCoordinator();

    // Listen for intelligence events
    coordinator.on('source:request', (data: IntelligenceEvent) => {
      // logger.info('Intelligence request:', data);
    });

    coordinator.on('source:response', (data: IntelligenceEvent) => {
      // logger.info('Intelligence response:', data);
    });

    coordinator.on('source:error', (data: IntelligenceEvent) => {
      // logger.error('Intelligence error:', data);
    });

    coordinator.on('source:enriched', (data: IntelligenceEvent) => {
      // logger.info('Signal enriched:', data);
      // enrichedSignal = data.data;
    });
  });

  afterEach(() => {
    coordinator.removeAllListeners();
    // enrichedSignal = null;
  });

  test('should fetch and enrich demand signals from Google Trends', async () => {
    const query = 'artificial intelligence';

    const signals = await scraper.scrape(query);

    expect(signals).toBeDefined();
    expect(signals.length).toBeGreaterThan(0);

    const signal = signals[0];
    expect(signal).toHaveProperty('query', query);
    expect(signal.trendMetrics).toBeDefined();
    expect(signal.trendMetrics.momentum).toBeDefined();
    expect(signal.trendMetrics.volume).toBeDefined();

    // Verify local intelligence enrichment
    expect(signal.analysis).toBeDefined();
    expect(signal.analysis.localInsights).toBeDefined();
    expect(Array.isArray(signal.analysis.localInsights)).toBe(true);
    expect(signal.confidence.localModel).toBeDefined();
    expect(typeof signal.confidence.localModel).toBe('number');

    // Log the enriched signal
    // logger.info('Enriched signal:', { signal });
  });

  test('should handle empty response', async () => {
    const result = await scraper.scrapeKeywordData('test');
    expect(result).toEqual([]);
  });

  test('should handle invalid JSON response', async () => {
    const invalidData: UnknownData = 'invalid json';
    expect(() => scraper.parseResponse(invalidData)).toThrow();
  });
});
