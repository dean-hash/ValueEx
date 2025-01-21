import { digitalIntelligence } from '../services/digitalIntelligence';
import { DemandMatcher } from '../services/mvp/demandMatcher';
import { DemandFulfillment } from '../services/mvp/demandFulfillment';
import { ProductSourcing } from '../services/mvp/productSourcing';
import { MVPStorage } from '../services/mvp/storage';
import { CommissionTracker } from '../services/mvp/commissionTracker';
import { logger } from '../utils/logger';

class MVPRunner {
  private storage = MVPStorage.getInstance();
  private demandMatcher = DemandMatcher.getInstance();
  private fulfillment = DemandFulfillment.getInstance();
  private productSourcing = ProductSourcing.getInstance();
  private commissionTracker = CommissionTracker.getInstance();

  private isRunning = false;
  private matchInterval: NodeJS.Timeout | null = null;
  private analyticsInterval: NodeJS.Timeout | null = null;

  private readonly MATCH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly ANALYTICS_INTERVAL = 60 * 60 * 1000; // 1 hour

  async start() {
    if (this.isRunning) {
      logger.warn('MVP Runner is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting MVP Runner');

    // Initial run
    await this.runMatchingCycle();
    await this.runAnalytics();

    // Set up intervals
    this.matchInterval = setInterval(() => this.runMatchingCycle(), this.MATCH_INTERVAL);

    this.analyticsInterval = setInterval(() => this.runAnalytics(), this.ANALYTICS_INTERVAL);

    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  private async runMatchingCycle() {
    try {
      logger.info('Starting matching cycle');

      // 1. Find product opportunities
      const opportunities = await this.productSourcing.findOpportunities();

      // 2. For each opportunity, find potential matches
      for (const opportunity of opportunities) {
        // Track API usage
        this.storage.trackAPICall();

        // Analyze market demand
        const analysis = await digitalIntelligence.analyzeNeed(opportunity.category);

        if (analysis.accuracy.confidence > 0.7) {
          // Generate fulfillment strategies
          const strategies = await this.fulfillment.createFulfillmentStrategies(
            {
              id: `temp_${Date.now()}`,
              name: opportunity.category,
              description: opportunity.requirements.join(', '),
              price: opportunity.priceRange?.min || 0,
              category: opportunity.category,
              vertical: opportunity.vertical,
              tags: opportunity.searchTerms,
              source: 'manual',
              status: 'active',
            },
            {
              id: `demand_${Date.now()}`,
              query: opportunity.category,
              timestamp: new Date(),
              source: 'inferred',
              vertical: opportunity.vertical,
              strength: opportunity.demandStrength,
              insights: {
                urgency: opportunity.urgency,
                confidence: analysis.accuracy.confidence,
                keywords: opportunity.requirements,
                demographics: opportunity.targetAudience,
              },
              status: 'active',
            }
          );

          // Track potential matches
          strategies.forEach((strategy) => {
            if (strategy.confidence > 0.8) {
              this.storage.trackMatch(`demand_${Date.now()}`, `prod_${Date.now()}`);

              logger.info('High confidence match found:', {
                category: opportunity.category,
                confidence: strategy.confidence,
                platform: strategy.platform,
              });
            }
          });
        }
      }

      logger.info('Matching cycle completed');
    } catch (error) {
      logger.error('Error in matching cycle:', error);
    }
  }

  private async runAnalytics() {
    try {
      logger.info('Running analytics');

      const analytics = this.storage.getAnalytics();
      const activeMatches = this.storage.getActiveMatches();
      const bestVerticals = this.commissionTracker.getBestVerticals();

      // Calculate key metrics
      const conversionRate = analytics.successfulMatches / analytics.apiCalls;
      const revenuePerCall = analytics.totalRevenue / analytics.apiCalls;
      const activeMatchRate = activeMatches.length / analytics.apiCalls;

      // Log performance metrics
      logger.info('Performance Metrics:', {
        conversionRate,
        revenuePerCall,
        activeMatchRate,
        bestVerticals: bestVerticals.slice(0, 3),
        apiCalls: analytics.apiCalls,
        totalRevenue: analytics.totalRevenue,
      });

      // Adjust strategies based on performance
      if (conversionRate < 0.1) {
        logger.warn('Low conversion rate - adjusting confidence thresholds');
        // In production: Implement strategy adjustments
      }

      if (revenuePerCall < 0.5) {
        logger.warn('Low revenue per call - focusing on higher commission verticals');
        // In production: Implement vertical prioritization
      }
    } catch (error) {
      logger.error('Error running analytics:', error);
    }
  }

  private async shutdown() {
    logger.info('Shutting down MVP Runner');

    this.isRunning = false;

    if (this.matchInterval) {
      clearInterval(this.matchInterval);
    }

    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }

    // Save final state
    this.storage.cleanup();

    process.exit(0);
  }
}

// Create and export runner instance
export const mvpRunner = new MVPRunner();

// If this file is run directly, start the runner
if (require.main === module) {
  mvpRunner.start().catch((error) => {
    logger.error('Error starting MVP Runner:', error);
    process.exit(1);
  });
}
