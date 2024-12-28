import { RedditScraper } from '../../services/demandSources/redditScraper';
import { digitalIntelligence } from '../../services/digitalIntelligence';
import { DemandSourceManager } from '../../services/demandSources/demandSourceManager';
import { logger } from '../../utils/logger';

describe('Demand Analysis Integration', () => {
  let redditScraper: RedditScraper;
  let demandManager: DemandSourceManager;

  beforeAll(() => {
    redditScraper = new RedditScraper();
    demandManager = new DemandSourceManager();
  });

  it('should analyze demand from real Reddit posts', async () => {
    // 1. Get real posts from Reddit
    const subreddits = ['homeoffice', 'productivity', 'gaming'];
    const signals = await redditScraper.scrape('desk chair recommendations', {
      subreddits,
      limit: 5, // Start small for testing
    });

    expect(signals.length).toBeGreaterThan(0);
    logger.info(`Found ${signals.length} initial signals`);

    // 2. Aggregate signals to remove duplicates and noise
    const aggregatedSignals = await demandManager.gatherDemandSignals(
      'desk chair recommendations',
      {
        subreddits,
        limit: 5,
      }
    );
    logger.info(`Aggregated to ${aggregatedSignals.length} unique signals`);

    // 3. Analyze each signal with Digital Intelligence
    const analysisResults = await Promise.all(
      aggregatedSignals.map(async (signal) => {
        const analysis = await digitalIntelligence.analyzeNeed(signal.content);
        return {
          signal,
          analysis,
          isGenuine: analysis.isGenuineNeed,
          confidence: analysis.accuracy.confidence,
          recommendedActions: analysis.recommendedActions,
        };
      })
    );

    // 4. Log detailed results
    analysisResults.forEach((result) => {
      logger.info('Demand Analysis Result:', {
        content: result.signal.content.substring(0, 100) + '...',
        isGenuine: result.isGenuine,
        confidence: result.confidence,
        actions: result.recommendedActions,
      });
    });

    // 5. Validate results
    const genuineDemands = analysisResults.filter((r) => r.isGenuine);
    const highConfidenceDemands = analysisResults.filter((r) => r.confidence > 0.7);

    expect(genuineDemands.length).toBeGreaterThan(0);
    expect(highConfidenceDemands.length).toBeGreaterThan(0);

    // 6. Return actionable insights
    const actionableInsights = analysisResults
      .filter((r) => r.isGenuine && r.confidence > 0.7)
      .map((r) => ({
        content: r.signal.content,
        confidence: r.confidence,
        actions: r.recommendedActions,
        vertical: r.analysis.vertical,
      }));

    logger.info(`Found ${actionableInsights.length} actionable demand signals`);
    expect(actionableInsights.length).toBeGreaterThan(0);
  }, 30000); // Increased timeout for real API calls
});
