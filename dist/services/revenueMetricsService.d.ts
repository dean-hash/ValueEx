import { DynamicsService } from '../integrations/dynamics365';
import { BusinessCentralService } from '../integrations/businessCentral';
import { ResonanceFieldService } from './resonanceField';
import { Product } from '../types/productTypes';
import { DemandPattern } from '../types/demandTypes';
import { DemandSignal } from '../types/resonanceTypes';
import { AwinService } from './awinService';
import { ValueCreationMetrics } from '../types/serviceTypes';
/**
 * Service for measuring and optimizing real-time value creation across all participants
 * Integrates directly with Dynamics 365 and Business Central for accurate metrics
 */
export declare class ValueCreationService {
  private readonly resonanceField;
  private readonly awinService;
  private readonly logger;
  private readonly dynamicsService;
  private readonly bcService;
  private cache;
  private readonly CACHE_TTL;
  constructor(
    resonanceField: ResonanceFieldService,
    awinService: AwinService,
    dynamicsService: DynamicsService,
    bcService: BusinessCentralService
  );
  /**
   * Calculate value creation for all parties in a potential match
   */
  measureValueCreation(product: Product, pattern: DemandPattern): Promise<ValueCreationMetrics>;
  /**
   * Calculate the value match between consumer intent and product
   */
  calculateIntentMatchValue(
    product: Product,
    pattern: DemandPattern,
    signals: DemandSignal[]
  ): Promise<number>;
  private getCacheKey;
  private isCacheValid;
}
