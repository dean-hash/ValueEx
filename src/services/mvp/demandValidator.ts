import { DigitalIntelligence } from '../digitalIntelligence';
import { logger } from '../../utils/logger';

interface DemandValidation {
  query: string;
  confidence: number;
  isRealDemand: boolean;
  signals: {
    type: string;
    strength: number;
    evidence: string[];
  }[];
  timestamp: Date;
}

interface ValidationStats {
  total: number;
  realDemand: number;
  averageConfidence: number;
  strongSignals: number;
}

export class DemandValidator {
  private static instance: DemandValidator;
  private validations: Map<string, DemandValidation> = new Map();
  private intelligence: DigitalIntelligence;

  private constructor() {
    this.intelligence = new DigitalIntelligence();
  }

  public static getInstance(): DemandValidator {
    if (!DemandValidator.instance) {
      DemandValidator.instance = new DemandValidator();
    }
    return DemandValidator.instance;
  }

  /**
   * Validate a potential demand signal
   * @param query - The query string to validate
   * @returns Promise resolving to DemandValidation result
   * @throws Error if validation fails
   */
  public async validateDemand(query: string): Promise<DemandValidation> {
    try {
      // Use Digital Intelligence to analyze
      const analysis = await this.intelligence.analyzeNeed(query);

      const validation: DemandValidation = {
        query,
        confidence: analysis.accuracy.confidence,
        isRealDemand: false, // Will be set based on criteria
        signals: [],
        timestamp: new Date(),
      };

      // Extract signals from analysis
      for (const signal of analysis.signals) {
        validation.signals.push({
          type: signal.type,
          strength: signal.strength,
          evidence: signal.metadata.evidence || [],
        });
      }

      // Determine if this is real demand
      validation.isRealDemand = this.evaluateDemandReality(validation);

      // Store validation result
      this.validations.set(query, validation);

      // Log validation result
      logger.info('Demand validated:', {
        query,
        isReal: validation.isRealDemand,
        confidence: validation.confidence,
        signalCount: validation.signals.length,
      });

      return validation;
    } catch (error) {
      logger.error(
        'Error validating demand:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Evaluate if demand is real based on signals
   * @param validation - The validation object to evaluate
   * @returns boolean indicating if the demand is real
   */
  private evaluateDemandReality(validation: DemandValidation): boolean {
    // Must have high confidence
    if (validation.confidence < 0.7) {
      return false;
    }

    // Must have multiple signals
    if (validation.signals.length < 2) {
      return false;
    }

    // At least one signal must be strong
    const hasStrongSignal = validation.signals.some((s) => s.strength > 0.8);
    if (!hasStrongSignal) {
      return false;
    }

    // Must have supporting evidence
    const hasEvidence = validation.signals.some((s) => s.evidence.length > 0);
    if (!hasEvidence) {
      return false;
    }

    return true;
  }

  /**
   * Get validation history for a query
   * @param query - The query string to look up
   * @returns The validation history or null if not found
   */
  public getValidationHistory(query: string): DemandValidation | null {
    return this.validations.get(query) || null;
  }

  /**
   * Get all validations within a time range
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @returns Array of validations within the range
   */
  public getValidationsInRange(startTime: Date, endTime: Date): DemandValidation[] {
    return Array.from(this.validations.values()).filter(
      (v) => v.timestamp >= startTime && v.timestamp <= endTime
    );
  }

  /**
   * Get validation statistics
   * @returns ValidationStats object with summary statistics
   */
  public getValidationStats(): ValidationStats {
    const validations = Array.from(this.validations.values());
    const total = validations.length;
    const realDemand = validations.filter((v) => v.isRealDemand).length;
    const totalConfidence = validations.reduce((sum, v) => sum + v.confidence, 0);
    const strongSignals = validations.reduce(
      (count, v) => count + v.signals.filter((s) => s.strength > 0.8).length,
      0
    );

    return {
      total,
      realDemand,
      averageConfidence: total > 0 ? totalConfidence / total : 0,
      strongSignals,
    };
  }
}
