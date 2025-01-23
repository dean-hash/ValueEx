import { ConfigService } from '../config/configService';
import { DomainInfo, FieldState } from '../types/domainTypes';
import { Product } from '../types/productTypes';
import { DemandPattern } from '../types/demandTypes';
import { AwinService } from './awinService';
import { ResonanceFieldService } from './resonanceField';
/**
 * Unified Intelligence Field service that coordinates product resonance calculations
 * and demand pattern analysis across the system.
 */
export declare class UnifiedIntelligenceField {
    private readonly config;
    private readonly awinService;
    private readonly resonanceField;
    private readonly logger;
    private state;
    /**
     * Creates a new instance of UnifiedIntelligenceField
     * @param config - Configuration service for system settings
     * @param awinService - Service for interacting with Awin API
     * @param resonanceField - Service for calculating resonance metrics
     */
    constructor(config: ConfigService, awinService: AwinService, resonanceField: ResonanceFieldService);
    /**
     * Analyzes a domain and returns its status, resonance, and metrics
     * @param domainName - The name of the domain to analyze
     * @returns Promise<DomainInfo> containing the domain's status, resonance, and metrics
     */
    analyzeDomain(domainName: string): Promise<DomainInfo>;
    /**
     * Retrieves the current state of the Unified Intelligence Field
     * @returns Promise<FieldState> containing the current state
     */
    getDomainState(): Promise<FieldState>;
    /**
     * Updates the state of the Unified Intelligence Field
     * @param newState - The new state to apply
     * @returns Promise<void>
     */
    updateDomainState(newState: FieldState): Promise<void>;
    /**
     * Calculates the resonance of a product based on a demand pattern
     * @param product - The product to calculate resonance for
     * @param pattern - The demand pattern to use for calculation
     * @returns Promise<number> containing the product's resonance
     */
    calculateProductResonance(product: Product, pattern: DemandPattern): Promise<number>;
    /**
     * Calculates domain-specific metrics for a given domain
     * @param domainName - The name of the domain to calculate metrics for
     * @returns Promise<{ stability: number; coherence: number }> containing the domain's metrics
     */
    private calculateDomainMetrics;
    private getDomainActivity;
    /**
     * Calculates the resonance of a domain based on its metrics
     * @param metrics - The domain's metrics
     * @returns Promise<number> containing the domain's resonance
     */
    private calculateDomainResonance;
    /**
     * Calculates product metrics based on a demand pattern
     * @param product - The product to calculate metrics for
     * @param pattern - The demand pattern to use for calculation
     * @returns Promise<{
     *   harmony: number;
     *   impact: number;
     *   sustainability: number;
     *   innovation: number;
     *   localRelevance: number;
     * }> containing the product's metrics
     */
    private calculateProductMetrics;
    /**
     * Calculates the keyword match between a product and a demand pattern
     * @param product - The product to calculate keyword match for
     * @param pattern - The demand pattern to use for calculation
     * @returns number containing the keyword match
     */
    private calculateKeywordMatch;
    /**
     * Calculates the price match between a product and a demand pattern
     * @param product - The product to calculate price match for
     * @param pattern - The demand pattern to use for calculation
     * @returns number containing the price match
     */
    private calculatePriceMatch;
    /**
     * Calculates a product metric based on its attributes
     * @param product - The product to calculate the metric for
     * @param metricType - The type of metric to calculate
     * @returns number containing the calculated metric
     */
    private calculateProductMetric;
    private calculateProductSustainability;
    private calculateProductInnovation;
    /**
     * Calculates the local relevance of a product based on a demand pattern
     * @param product - The product to calculate local relevance for
     * @param pattern - The demand pattern to use for calculation
     * @returns number containing the local relevance
     */
    private calculateLocalRelevance;
    /**
     * Validates the price range in a demand pattern
     * @param pattern - The demand pattern to validate
     * @returns Promise<boolean> indicating if the price range is valid
     */
    private validatePriceRange;
}
