import { DynamicsService } from '../integrations/dynamics365';
import { BusinessCentralService } from '../integrations/businessCentral';
import { ResonanceFieldService } from './resonanceField';
import { Logger } from '../utils/logger';
import { Product } from '../types/productTypes';
import { DemandPattern } from '../types/demandTypes';
import { DemandSignal } from '../types/resonanceTypes';
import { AwinService } from './awinService';
import { ValueCreationMetrics } from '../types/serviceTypes';

type CacheEntry = {
  data: ValueCreationMetrics;
  timestamp: Date;
};

/**
 * Service for measuring and optimizing real-time value creation across all participants
 * Integrates directly with Dynamics 365 and Business Central for accurate metrics
 */
export class ValueCreationService {
  private readonly logger: Logger;
  private readonly dynamicsService: DynamicsService;
  private readonly bcService: BusinessCentralService;
  private cache: Map<string, CacheEntry>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly resonanceField: ResonanceFieldService,
    private readonly awinService: AwinService,
    dynamicsService: DynamicsService,
    bcService: BusinessCentralService
  ) {
    this.logger = new Logger();
    this.dynamicsService = dynamicsService;
    this.bcService = bcService;
    this.cache = new Map();
  }

  /**
   * Calculate value creation for all parties in a potential match
   */
  public async measureValueCreation(
    product: Product,
    pattern: DemandPattern
  ): Promise<ValueCreationMetrics> {
    const cacheKey = this.getCacheKey(product, pattern);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const metrics = await this.resonanceField.measureValueCreation(product, pattern);
      
      // Enrich with real-time metrics
      const [efficiencyMetrics, affiliateMetrics] = await Promise.all([
        this.bcService.getEfficiencyMetrics(),
        this.awinService.getAffiliateMetrics()
      ]);

      metrics.realTimeMetrics = {
        revenue: affiliateMetrics.revenue,
        costs: efficiencyMetrics.costPerLead * affiliateMetrics.conversions,
        profitMargin: (affiliateMetrics.revenue - affiliateMetrics.commission) / affiliateMetrics.revenue,
        customerEngagement: affiliateMetrics.conversions / affiliateMetrics.clicks
      };

      this.cache.set(cacheKey, { data: metrics, timestamp: new Date() });
      return metrics;
    } catch (error) {
      this.logger.error('Error measuring value creation:', error);
      throw error;
    }
  }

  /**
   * Calculate the value match between consumer intent and product
   */
  public async calculateIntentMatchValue(
    product: Product,
    pattern: DemandPattern,
    signals: DemandSignal[]
  ): Promise<number> {
    try {
      const consumerValue = await this.resonanceField.calculateConsumerValue(
        product,
        pattern,
        signals
      );

      const merchantValue = await this.resonanceField.calculateMerchantValue(
        product,
        signals
      );

      // Weighted average of consumer and merchant value
      return (consumerValue * 0.6 + merchantValue * 0.4);
    } catch (error) {
      this.logger.error('Error calculating intent match value:', error);
      throw error;
    }
  }

  private getCacheKey(product: Product, pattern: DemandPattern): string {
    return `${product.id}-${pattern.id}`;
  }

  private isCacheValid(timestamp: Date): boolean {
    return Date.now() - timestamp.getTime() < this.CACHE_TTL;
  }
}
