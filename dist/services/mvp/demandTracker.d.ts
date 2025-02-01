import { DemandSignal } from '../../types/mvp/demand';
export declare class DemandTracker {
  private static instance;
  private signals;
  private readonly SIGNAL_EXPIRY_DAYS;
  private constructor();
  static getInstance(): DemandTracker;
  /**
   * Track a new demand signal from direct input
   */
  trackDemand(query: string): Promise<DemandSignal>;
  /**
   * Get active demand signals for a specific vertical
   */
  getActiveSignals(verticalId?: string): DemandSignal[];
  /**
   * Mark a demand as fulfilled by a product
   */
  fulfillDemand(demandId: string, productId: string): boolean;
  /**
   * Update success metrics for a fulfilled demand
   */
  updateFulfillmentMetrics(
    demandId: string,
    metrics: {
      conversionRate?: number;
      customerSatisfaction?: number;
      repeatPurchaseRate?: number;
    }
  ): boolean;
  /**
   * Get demand signals that have been successfully fulfilled
   * Useful for analyzing what works
   */
  getFulfilledSignals(): DemandSignal[];
  private checkExpiredSignals;
  /**
   * Clear all signals (for testing)
   */
  clearSignals(): void;
}
