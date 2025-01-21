import { MarketVertical } from '../../types/marketTypes';
import { logger } from '../../utils/logger';

interface CommissionData {
  verticalId: string;
  averageCommission: number; // percentage
  averageOrderValue: number;
  successfulMatches: number;
  totalMatches: number;
}

interface ProductCommission {
  productId: string;
  commission: number;
  orderValue: number;
  vertical: MarketVertical;
}

export class CommissionTracker {
  private static instance: CommissionTracker;
  private verticalStats: Map<string, CommissionData> = new Map();
  private productStats: Map<string, ProductCommission> = new Map();

  private constructor() {
    // Initialize with some known vertical averages
    this.initializeVerticalData();
  }

  static getInstance(): CommissionTracker {
    if (!CommissionTracker.instance) {
      CommissionTracker.instance = new CommissionTracker();
    }
    return CommissionTracker.instance;
  }

  private initializeVerticalData() {
    // Initial data based on market research
    // We can update these as we get real data
    const initialData: [string, CommissionData][] = [
      [
        'electronics',
        {
          verticalId: 'electronics',
          averageCommission: 4.5, // 4.5%
          averageOrderValue: 150,
          successfulMatches: 0,
          totalMatches: 0,
        },
      ],
      [
        'fashion',
        {
          verticalId: 'fashion',
          averageCommission: 8, // 8%
          averageOrderValue: 75,
          successfulMatches: 0,
          totalMatches: 0,
        },
      ],
      [
        'homegoods',
        {
          verticalId: 'homegoods',
          averageCommission: 6, // 6%
          averageOrderValue: 120,
          successfulMatches: 0,
          totalMatches: 0,
        },
      ],
    ];

    initialData.forEach(([id, data]) => {
      this.verticalStats.set(id, data);
    });
  }

  /**
   * Calculate potential commission for a match
   */
  calculatePotentialCommission(
    vertical: MarketVertical,
    price: number
  ): {
    estimatedCommission: number;
    confidence: number;
  } {
    const verticalData = this.verticalStats.get(vertical.id);
    if (!verticalData) {
      return {
        estimatedCommission: 0,
        confidence: 0,
      };
    }

    // Calculate based on vertical averages
    const estimatedCommission = price * (verticalData.averageCommission / 100);

    // Confidence based on data points
    const confidence = Math.min(
      verticalData.totalMatches / 100, // Caps at 100 data points
      0.9 // Never perfectly confident
    );

    return {
      estimatedCommission,
      confidence,
    };
  }

  /**
   * Track a successful commission
   */
  trackCommission(
    productId: string,
    vertical: MarketVertical,
    commission: number,
    orderValue: number
  ): void {
    // Update product stats
    this.productStats.set(productId, {
      productId,
      commission,
      orderValue,
      vertical,
    });

    // Update vertical stats
    const verticalData = this.verticalStats.get(vertical.id);
    if (verticalData) {
      const newTotal = verticalData.successfulMatches + 1;
      verticalData.averageCommission =
        (verticalData.averageCommission * verticalData.successfulMatches +
          (commission / orderValue) * 100) /
        newTotal;

      verticalData.averageOrderValue =
        (verticalData.averageOrderValue * verticalData.successfulMatches + orderValue) / newTotal;

      verticalData.successfulMatches = newTotal;
      verticalData.totalMatches++;

      this.verticalStats.set(vertical.id, verticalData);
    }

    logger.info('Commission tracked:', {
      productId,
      vertical: vertical.id,
      commission,
      orderValue,
    });
  }

  /**
   * Get best performing verticals
   */
  getBestVerticals(): {
    verticalId: string;
    expectedValue: number; // commission * conversion rate
  }[] {
    return Array.from(this.verticalStats.entries())
      .map(([id, data]) => ({
        verticalId: id,
        expectedValue:
          (data.averageCommission / 100) *
          data.averageOrderValue *
          (data.successfulMatches / Math.max(1, data.totalMatches)),
      }))
      .sort((a, b) => b.expectedValue - a.expectedValue);
  }

  /**
   * Get commission history for analysis
   */
  getCommissionHistory(): {
    byProduct: Map<string, ProductCommission>;
    byVertical: Map<string, CommissionData>;
  } {
    return {
      byProduct: new Map(this.productStats),
      byVertical: new Map(this.verticalStats),
    };
  }
}
