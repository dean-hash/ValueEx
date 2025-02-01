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
export declare class DemandValidator {
  private static instance;
  private validations;
  private intelligence;
  private constructor();
  static getInstance(): DemandValidator;
  /**
   * Validate a potential demand signal
   * @param query - The query string to validate
   * @returns Promise resolving to DemandValidation result
   * @throws Error if validation fails
   */
  validateDemand(query: string): Promise<DemandValidation>;
  /**
   * Evaluate if demand is real based on signals
   * @param validation - The validation object to evaluate
   * @returns boolean indicating if the demand is real
   */
  private evaluateDemandReality;
  /**
   * Get validation history for a query
   * @param query - The query string to look up
   * @returns The validation history or null if not found
   */
  getValidationHistory(query: string): DemandValidation | null;
  /**
   * Get all validations within a time range
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @returns Array of validations within the range
   */
  getValidationsInRange(startTime: Date, endTime: Date): DemandValidation[];
  /**
   * Get validation statistics
   * @returns ValidationStats object with summary statistics
   */
  getValidationStats(): ValidationStats;
}
export {};
