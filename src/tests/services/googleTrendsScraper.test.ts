import { describe, expect, beforeEach, it } from '@jest/globals';
import { GoogleTrendsScraper } from '../../services/demandSources/googleTrendsScraper';
import type { DemandSignal } from '../../types/demandTypes';

describe('Google Trends Scraper', () => {
  let scraper: GoogleTrendsScraper;
  let coordinator: IntelligenceCoordinator;
  let signal: DemandSignal;

  beforeEach(() => {
    scraper = new GoogleTrendsScraper();
    coordinator = new IntelligenceCoordinator();
    signal = {
      id: 'test-signal',
      query: 'test query',
      source: 'google-trends',
      timestamp: new Date().toISOString(),
      confidence: 0.8,
      metadata: {}
    };

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

  it('should fetch and enrich demand signals from Google Trends', async (): Promise<void> => {
    const query = 'artificial intelligence';

    try {
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
    } catch (error: any) {
      // logger.error('Test failed:', { error: error.message });
      throw error;
    }
  }, 30000);
});
