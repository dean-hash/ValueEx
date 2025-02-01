import { EventEmitter } from 'events';
interface AnonymizedConsumerSignal {
  segmentId: string;
  interests: string[];
  needs: string[];
  marketContext: {
    region: string;
    generalDemographics: string[];
    valuePreferences: string[];
  };
  timestamp: Date;
}
/**
 * Privacy-Aware Data Service
 * Ensures all data handling follows the "secret sauce" formula:
 * - Uses only publicly available or properly authorized data
 * - Strips all PII before human review
 * - Focuses on matching existing wants/needs
 */
export declare class PrivacyAwareDataService extends EventEmitter {
  private static instance;
  private logger;
  private constructor();
  static getInstance(): PrivacyAwareDataService;
  /**
   * Processes raw consumer data and strips all PII
   */
  processConsumerSignal(rawData: any): Promise<AnonymizedConsumerSignal>;
  /**
   * Ensures no PII is present in data
   */
  private stripPII;
  /**
   * Generates non-reversible segment ID
   */
  private generateSegmentId;
  /**
   * Extracts general interest categories
   */
  private extractInterests;
  /**
   * Identifies current needs/wants without personal context
   */
  private extractNeeds;
  /**
   * Gets only US region, no specific location
   */
  private getRegionOnly;
  /**
   * Gets general, non-identifying demographics
   */
  private getGeneralDemographics;
  /**
   * Extracts preferences for types of value/deals
   */
  private extractValuePreferences;
  /**
   * Validates that no PII is present in final output
   */
  private validateNoPII;
}
export {};
