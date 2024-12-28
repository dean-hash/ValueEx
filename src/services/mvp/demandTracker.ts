import { DemandSignal } from '../../types/mvp/demand';
import { digitalIntelligence } from '../digitalIntelligence';
import { logger } from '../../utils/logger';

export class DemandTracker {
  private static instance: DemandTracker;
  private signals: Map<string, DemandSignal> = new Map();
  private readonly SIGNAL_EXPIRY_DAYS = 30; // Signals older than this are marked expired

  private constructor() {
    // Start the expiry check process
    setInterval(() => this.checkExpiredSignals(), 1000 * 60 * 60 * 24); // Daily check
  }

  static getInstance(): DemandTracker {
    if (!DemandTracker.instance) {
      DemandTracker.instance = new DemandTracker();
    }
    return DemandTracker.instance;
  }

  /**
   * Track a new demand signal from direct input
   */
  async trackDemand(query: string): Promise<DemandSignal> {
    try {
      const analysis = await digitalIntelligence.analyzeNeed(query);

      const signal: DemandSignal = {
        id: `demand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        timestamp: new Date(),
        source: 'direct',
        vertical: analysis.vertical!,
        strength: analysis.accuracy.signalStrength,
        insights: {
          urgency: analysis.signals.find((s) => s.type === 'urgency')?.strength || 0,
          confidence: analysis.accuracy.confidence,
          keywords: analysis.signals.flatMap((s) => s.metadata.drivers || []),
          demographics:
            analysis.signals.find((s) => s.type === 'demand')?.metadata.targetDemographic || [],
        },
        status: 'active',
      };

      // Extract price range if available
      const demandSignal = analysis.signals.find((s) => s.type === 'demand');
      if (demandSignal?.metadata.pricePoint) {
        signal.insights.priceRange = {
          min: Number(demandSignal.metadata.pricePoint) * 0.8, // 20% range for MVP
          max: Number(demandSignal.metadata.pricePoint) * 1.2,
        };
      }

      this.signals.set(signal.id, signal);
      logger.info(`New demand signal tracked: ${query}`);

      return signal;
    } catch (error) {
      logger.error('Error tracking demand:', error);
      throw error;
    }
  }

  /**
   * Get active demand signals for a specific vertical
   */
  getActiveSignals(verticalId?: string): DemandSignal[] {
    return Array.from(this.signals.values())
      .filter(
        (signal) => signal.status === 'active' && (!verticalId || signal.vertical.id === verticalId)
      )
      .sort((a, b) => b.strength * b.insights.urgency - a.strength * a.insights.urgency);
  }

  /**
   * Mark a demand as fulfilled by a product
   */
  fulfillDemand(demandId: string, productId: string): boolean {
    const signal = this.signals.get(demandId);
    if (signal && signal.status === 'active') {
      signal.status = 'fulfilled';
      signal.fulfillmentData = {
        productId,
        fulfillmentDate: new Date(),
      };
      this.signals.set(demandId, signal);
      logger.info(`Demand ${demandId} fulfilled by product ${productId}`);
      return true;
    }
    return false;
  }

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
  ): boolean {
    const signal = this.signals.get(demandId);
    if (signal && signal.status === 'fulfilled' && signal.fulfillmentData) {
      signal.fulfillmentData.successMetrics = {
        ...signal.fulfillmentData.successMetrics,
        ...metrics,
      };
      this.signals.set(demandId, signal);
      return true;
    }
    return false;
  }

  /**
   * Get demand signals that have been successfully fulfilled
   * Useful for analyzing what works
   */
  getFulfilledSignals(): DemandSignal[] {
    return Array.from(this.signals.values())
      .filter((signal) => signal.status === 'fulfilled')
      .sort((a, b) => {
        const aSuccess = a.fulfillmentData?.successMetrics?.conversionRate || 0;
        const bSuccess = b.fulfillmentData?.successMetrics?.conversionRate || 0;
        return bSuccess - aSuccess;
      });
  }

  private checkExpiredSignals(): void {
    const now = new Date();
    const expiryMs = this.SIGNAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    for (const [id, signal] of this.signals) {
      if (signal.status === 'active' && now.getTime() - signal.timestamp.getTime() > expiryMs) {
        signal.status = 'expired';
        this.signals.set(id, signal);
        logger.info(`Demand signal expired: ${signal.query}`);
      }
    }
  }

  /**
   * Clear all signals (for testing)
   */
  clearSignals(): void {
    this.signals.clear();
  }
}
