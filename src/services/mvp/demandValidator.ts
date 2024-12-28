import { digitalIntelligence } from '../digitalIntelligence';
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

export class DemandValidator {
  private static instance: DemandValidator;
  private validations: Map<string, DemandValidation> = new Map();

  private constructor() {}

  static getInstance(): DemandValidator {
    if (!DemandValidator.instance) {
      DemandValidator.instance = new DemandValidator();
    }
    return DemandValidator.instance;
  }

  /**
   * Validate a potential demand signal
   */
  async validateDemand(query: string): Promise<DemandValidation> {
    try {
      // Use Digital Intelligence to analyze
      const analysis = await digitalIntelligence.analyzeNeed(query);

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
      logger.error('Error validating demand:', error);
      throw error;
    }
  }

  /**
   * Evaluate if demand is real based on signals
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
   */
  getValidationHistory(query: string): DemandValidation | null {
    return this.validations.get(query) || null;
  }

  /**
   * Get all validations within a time range
   */
  getValidationsInRange(startTime: Date, endTime: Date): DemandValidation[] {
    return Array.from(this.validations.values()).filter(
      (v) => v.timestamp >= startTime && v.timestamp <= endTime
    );
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    total: number;
    realDemand: number;
    averageConfidence: number;
    strongSignals: number;
  } {
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
