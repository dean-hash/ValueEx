import { DigitalIntelligenceProvider } from '../services/digitalIntelligence';
import { DemandMatcher } from '../services/mvp/demandMatcher';
import { DemandFulfillment } from '../services/mvp/demandFulfillment';
import { ProductSourcing } from '../services/mvp/productSourcing';
import { MVPStorage } from '../services/mvp/storage';
import { CommissionTracker } from '../services/mvp/commissionTracker';
import { logger } from '../utils/logger';
import { TeamsNotificationService } from '../services/monitoring/teams-notifications';
import { configService } from '../config/configService';
import { DemandSignal } from '../types/mvp/demand';
import { ProductOpportunity } from '../types/mvp/productOpportunity';
import { MVPProduct } from '../types/mvp/mvpProduct';

interface RunnerConfig {
  matchInterval: number;
  analyticsInterval: number;
  maxConcurrentMatches: number;
  minConfidenceThreshold: number;
  enableHealthChecks: boolean;
}

class MVPRunner {
  private static instance: MVPRunner;
  private storage: MVPStorage;
  private demandMatcher: DemandMatcher;
  private fulfillment: DemandFulfillment;
  private productSourcing: ProductSourcing;
  private commissionTracker: CommissionTracker;
  private teamsNotifier: TeamsNotificationService;
  private intelligence: DigitalIntelligenceProvider;
  private config: RunnerConfig;
  private isRunning: boolean;
  private matchInterval: NodeJS.Timeout | null = null;
  private analyticsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.storage = MVPStorage.getInstance();
    this.demandMatcher = DemandMatcher.getInstance();
    this.fulfillment = DemandFulfillment.getInstance();
    this.productSourcing = ProductSourcing.getInstance();
    this.commissionTracker = CommissionTracker.getInstance();
    this.teamsNotifier = TeamsNotificationService.getInstance();
    this.intelligence = new DigitalIntelligenceProvider();
    this.config = this.loadConfig();
    this.isRunning = false;
  }

  public static getInstance(): MVPRunner {
    if (!MVPRunner.instance) {
      MVPRunner.instance = new MVPRunner();
    }
    return MVPRunner.instance;
  }

  private loadConfig(): RunnerConfig {
    const config = configService.get('runner');
    return {
      matchInterval: config.matchIntervalMs,
      analyticsInterval: config.analyticsIntervalMs,
      maxConcurrentMatches: config.maxConcurrentMatches,
      minConfidenceThreshold: config.minConfidenceThreshold,
      enableHealthChecks: config.enableHealthChecks,
    };
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      this.isRunning = true;
      await this.initializeServices();
      this.startIntervals();
      await this.teamsNotifier.sendHealthAlert({
        service: 'MVP Runner',
        status: 'healthy',
        message: 'Successfully started',
      });
    } catch (err) {
      const error = err as Error;
      logger.error('MVP Runner encountered an error', {
        service: 'MVP Runner',
        status: 'degraded',
        error: error.message,
      });
      this.isRunning = false;
      await this.teamsNotifier.sendHealthAlert({
        service: 'MVP Runner',
        status: 'down',
        message: `Failed to start: ${error.message}`,
      });
      throw error;
    }
  }

  private async initializeServices(): Promise<void> {
    // Initial health check
    await this.checkHealth();

    // Initial runs
    await Promise.all([this.runMatchingCycle(), this.runAnalytics()]);
  }

  private startIntervals(): void {
    // Set up intervals
    this.matchInterval = setInterval(() => this.runMatchingCycle(), this.config.matchInterval);
    this.analyticsInterval = setInterval(() => this.runAnalytics(), this.config.analyticsInterval);
    this.healthCheckInterval = setInterval(() => this.checkHealth(), 60 * 1000); // 1 minute

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  private async checkHealth(): Promise<boolean> {
    try {
      const health = {
        storage: await this.storage.isHealthy(),
        matcher: await this.demandMatcher.isHealthy(),
        fulfillment: await this.fulfillment.isHealthy(),
        sourcing: await this.productSourcing.isHealthy(),
        intelligence: await this.intelligence.validateAlignment(),
      };

      const isHealthy = Object.values(health).every((h) => h);

      if (!isHealthy) {
        const unhealthyServices = Object.entries(health)
          .filter(([_, healthy]) => !healthy)
          .map(([service]) => service)
          .join(', ');

        logger.error('Health check failed:', { unhealthyServices });
        await this.teamsNotifier.sendHealthAlert({
          service: 'MVP Runner',
          status: 'degraded',
          message: `Unhealthy services: ${unhealthyServices}`,
        });
      }

      return isHealthy;
    } catch (err) {
      const error = err as Error;
      logger.error('MVP Runner encountered an error', {
        service: 'MVP Runner',
        status: 'degraded',
        error: error.message,
      });
      return false;
    }
  }

  private async runMatchingCycle(): Promise<void> {
    if (!this.isRunning) return;

    try {
      logger.info('Starting matching cycle');
      const startTime = Date.now();

      // 1. Find product opportunities with rate limiting
      const opportunities: ProductOpportunity[] = await this.productSourcing.findOpportunities();

      // 2. Process opportunities in batches
      const batches = this.chunkArray(opportunities, this.config.maxConcurrentMatches);

      for (const batch of batches) {
        await Promise.all(
          batch.map(async (opportunity) => {
            try {
              // Ensure ProductOpportunity has all required properties
              if (
                !opportunity.name ||
                !opportunity.description ||
                !opportunity.price ||
                !opportunity.affiliateUrl ||
                !opportunity.commission ||
                !opportunity.confidence
              ) {
                logger.error('ProductOpportunity is missing required properties');
                return;
              }

              const signal: DemandSignal = {
                userId: opportunity.userId,
                tags: opportunity.tags,
                status: opportunity.status,
              };
              const matches: MVPProduct[] = await this.processSignal(signal);
              if (matches.length > 0) {
                await this.trackMatches(matches);
              }
            } catch (err) {
              const error = err as Error;
              logger.error('MVP Runner encountered an error', {
                service: 'MVP Runner',
                status: 'degraded',
                error: error.message,
              });
            }
          })
        );
      }

      const duration = Date.now() - startTime;
      logger.info('Matching cycle completed', { duration });
    } catch (err) {
      const error = err as Error;
      logger.error('MVP Runner encountered an error', {
        service: 'MVP Runner',
        status: 'degraded',
        error: error.message,
      });
    }
  }

  private async processSignal(signal: DemandSignal): Promise<MVPProduct[]> {
    try {
      // First find matches from existing products
      const matches: MVPProduct[] = await this.demandMatcher.findMatches(signal);

      if (matches.length > 0) {
        // Ensure MVPProduct has all required properties
        for (const match of matches) {
          if (
            !match.name ||
            !match.description ||
            !match.price ||
            !match.affiliateUrl ||
            !match.commission ||
            !match.confidence
          ) {
            logger.error('MVPProduct is missing required properties');
            return [];
          }
        }
        return matches;
      }

      // If no matches found, look for opportunities
      const opportunities: MVPProduct[] = await this.productSourcing.findProducts(signal);
      return opportunities;
    } catch (err) {
      logger.error('Error processing signal:', err);
      return [];
    }
  }

  private async trackMatches(matches: MVPProduct[]): Promise<void> {
    try {
      // Track potential matches
      await Promise.all(
        matches.map(async (match) => {
          if (match.confidence > 0.8) {
            const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            await this.storage.trackMatch(matchId, {
              strategyId: match.platform,
              confidence: match.confidence,
              timestamp: Date.now(),
            });

            logger.info('High confidence match found:', {
              category: match.category,
              confidence: match.confidence,
              platform: match.platform,
              matchId,
            });
          }
        })
      );
    } catch (err) {
      const error = err as Error;
      logger.error('MVP Runner encountered an error', {
        service: 'MVP Runner',
        status: 'degraded',
        error: error.message,
      });
    }
  }

  private async runAnalytics(): Promise<void> {
    if (!this.isRunning) return;

    try {
      logger.info('Running analytics');
      const startTime = Date.now();

      const analytics = this.storage.getAnalytics();
      const activeMatches = this.storage.getActiveMatches();
      const bestVerticals = this.commissionTracker.getBestVerticals();

      const metrics = this.calculateMetrics(analytics, activeMatches);

      logger.info('Performance Metrics:', metrics);

      await this.teamsNotifier.sendMetricsUpdate({
        revenue: analytics.totalRevenue,
        transactions: analytics.successfulMatches,
        activeUsers: activeMatches.length,
      });

      await this.adjustStrategies(metrics);

      const duration = Date.now() - startTime;
      logger.info('Analytics completed', { duration });
    } catch (err) {
      const error = err as Error;
      logger.error('MVP Runner encountered an error', {
        service: 'MVP Runner',
        status: 'degraded',
        error: error.message,
      });
    }
  }

  private calculateMetrics(analytics: any, activeMatches: any[]): any {
    return {
      conversionRate: analytics.successfulMatches / analytics.apiCalls,
      revenuePerCall: analytics.totalRevenue / analytics.apiCalls,
      activeMatchRate: activeMatches.length / analytics.apiCalls,
      apiCalls: analytics.apiCalls,
      totalRevenue: analytics.totalRevenue,
      activeMatches: activeMatches.length,
    };
  }

  private async adjustStrategies(metrics: any): Promise<void> {
    try {
      if (metrics.conversionRate < 0.1) {
        logger.warn('Low conversion rate - adjusting confidence thresholds');
        await this.demandMatcher.updateConfig({
          confidenceThreshold: Math.min(0.9, this.demandMatcher.config.confidenceThreshold + 0.1),
        });
      }
    } catch (err) {
      const error = err as Error;
      logger.error('Error adjusting strategies:', {
        error: error.message,
      });
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down MVP Runner');

    this.isRunning = false;

    if (this.matchInterval) clearInterval(this.matchInterval);
    if (this.analyticsInterval) clearInterval(this.analyticsInterval);
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);

    try {
      // Save final state
      await this.storage.cleanup();

      await this.teamsNotifier.sendHealthAlert({
        service: 'MVP Runner',
        status: 'down',
        message: 'Service shut down gracefully',
      });
    } catch (err) {
      const error = err as Error;
      logger.error('MVP Runner encountered an error', {
        service: 'MVP Runner',
        status: 'degraded',
        error: error.message,
      });
    }

    process.exit(0);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }
}

// Create and export runner instance
export const mvpRunner = MVPRunner.getInstance();

// If this file is run directly, start the runner
if (require.main === module) {
  mvpRunner.start().catch((err) => {
    const error = err as Error;
    logger.error('MVP Runner encountered an error', {
      service: 'MVP Runner',
      status: 'degraded',
      error: error.message,
    });
    process.exit(1);
  });
}
