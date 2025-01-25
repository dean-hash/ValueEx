import { digitalIntelligence } from '../services/digitalIntelligence';
import { DemandMatcher } from '../services/mvp/demandMatcher';
import { DemandFulfillment } from '../services/mvp/demandFulfillment';
import { ProductSourcing } from '../services/mvp/productSourcing';
import { MVPStorage } from '../services/mvp/storage';
import { CommissionTracker } from '../services/mvp/commissionTracker';
import { logger } from '../utils/logger';
import { TeamsNotificationService } from '../services/monitoring/teams-notifications';
import { configService } from '../config/configService';

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
            enableHealthChecks: config.enableHealthChecks
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
                message: 'Successfully started'
            });
        } catch (error) {
            this.isRunning = false;
            await this.teamsNotifier.sendHealthAlert({
                service: 'MVP Runner',
                status: 'down',
                message: `Failed to start: ${error instanceof Error ? error.message : String(error)}`
            });
            throw error;
        }
    }

    private async initializeServices(): Promise<void> {
        // Initial health check
        await this.checkHealth();

        // Initial runs
        await Promise.all([
            this.runMatchingCycle(),
            this.runAnalytics()
        ]);
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
                sourcing: await this.productSourcing.isHealthy()
            };

            const isHealthy = Object.values(health).every(h => h);
            
            if (!isHealthy) {
                const unhealthyServices = Object.entries(health)
                    .filter(([_, healthy]) => !healthy)
                    .map(([service]) => service)
                    .join(', ');
                  
                logger.error('Health check failed:', { unhealthyServices });
                await this.teamsNotifier.sendHealthAlert({
                    service: 'MVP Runner',
                    status: 'degraded',
                    message: `Unhealthy services: ${unhealthyServices}`
                });
            }

            return isHealthy;
        } catch (error) {
            logger.error('Health check error:', error);
            return false;
        }
    }

    private async runMatchingCycle(): Promise<void> {
        if (!this.isRunning) return;

        try {
            logger.info('Starting matching cycle');
            const startTime = Date.now();

            // 1. Find product opportunities with rate limiting
            const opportunities = await this.productSourcing.findOpportunities();
            
            // 2. Process opportunities in batches
            const batches = this.chunkArray(opportunities, this.config.maxConcurrentMatches);
            
            for (const batch of batches) {
                await Promise.all(batch.map(async (opportunity) => {
                    try {
                        await this.processOpportunity(opportunity);
                    } catch (error) {
                        logger.error('Error processing opportunity:', { 
                            opportunity: opportunity.category,
                            error: error.message 
                        });
                    }
                }));
            }

            const duration = Date.now() - startTime;
            logger.info('Matching cycle completed', { duration });
            
        } catch (error) {
            logger.error('Error in matching cycle:', error);
            await this.teamsNotifier.sendHealthAlert({
                service: 'MVP Runner',
                status: 'degraded',
                message: `Matching cycle error: ${error.message}`
            });
        }
    }

    private async processOpportunity(opportunity: any): Promise<void> {
        // Track API usage
        this.storage.trackAPICall();

        // Analyze market demand
        const analysis = await digitalIntelligence.analyzeNeed(opportunity.category);

        if (analysis.accuracy.confidence > this.config.minConfidenceThreshold) {
            const strategies = await this.fulfillment.createFulfillmentStrategies(
                this.createProductDTO(opportunity),
                this.createDemandDTO(opportunity, analysis)
            );

            // Track potential matches
            await Promise.all(strategies.map(async (strategy) => {
                if (strategy.confidence > 0.8) {
                    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    await this.storage.trackMatch(matchId, strategy.id);

                    logger.info('High confidence match found:', {
                        category: opportunity.category,
                        confidence: strategy.confidence,
                        platform: strategy.platform,
                        matchId
                    });
                }
            }));
        }
    }

    private createProductDTO(opportunity: any): any {
        return {
            id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: opportunity.category,
            description: opportunity.requirements.join(', '),
            price: opportunity.priceRange?.min || 0,
            category: opportunity.category,
            vertical: opportunity.vertical,
            tags: opportunity.searchTerms,
            source: 'manual',
            status: 'active'
        };
    }

    private createDemandDTO(opportunity: any, analysis: any): any {
        return {
            id: `demand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            query: opportunity.category,
            timestamp: new Date(),
            source: 'inferred',
            vertical: opportunity.vertical,
            strength: opportunity.demandStrength,
            insights: {
                urgency: opportunity.urgency,
                confidence: analysis.accuracy.confidence,
                keywords: opportunity.requirements,
                demographics: opportunity.targetAudience
            },
            status: 'active'
        };
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
                activeUsers: activeMatches.length
            });

            await this.adjustStrategies(metrics);

            const duration = Date.now() - startTime;
            logger.info('Analytics completed', { duration });
            
        } catch (error) {
            logger.error('Error running analytics:', error);
            await this.teamsNotifier.sendHealthAlert({
                service: 'MVP Runner Analytics',
                status: 'degraded',
                message: `Analytics error: ${error.message}`
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
            activeMatches: activeMatches.length
        };
    }

    private async adjustStrategies(metrics: any): Promise<void> {
        if (metrics.conversionRate < 0.1) {
            logger.warn('Low conversion rate - adjusting confidence thresholds');
            await this.demandMatcher.adjustConfidenceThresholds(metrics.conversionRate);
        }

        if (metrics.revenuePerCall < 0.5) {
            logger.warn('Low revenue per call - focusing on higher commission verticals');
            await this.productSourcing.prioritizeHighCommissionVerticals();
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
                message: 'Service shut down gracefully'
            });
        } catch (error) {
            logger.error('Error during shutdown:', error);
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
    mvpRunner.start().catch((error) => {
        logger.error('Error starting MVP Runner:', error);
        process.exit(1);
    });
}
