import { logger } from '../../utils/logger';

interface ClickData {
  affiliateLink: string;
  timestamp: Date;
  userId: string;
  productId: string;
}

interface ConversionData {
  clickId: string;
  orderValue: number;
  commission: number;
  timestamp: Date;
}

interface PerformanceMetrics {
  clicks: number;
  conversions: number;
  revenue: number;
  commissions: number;
  conversionRate: number;
}

export class ResultMonitor {
  private static instance: ResultMonitor;
  private clicks: Map<string, ClickData> = new Map();
  private conversions: Map<string, ConversionData> = new Map();
  private metrics: PerformanceMetrics = {
    clicks: 0,
    conversions: 0,
    revenue: 0,
    commissions: 0,
    conversionRate: 0,
  };

  private constructor() {
    // Analyze performance every hour
    setInterval(() => this.analyzePerformance(), 60 * 60 * 1000);
  }

  static getInstance(): ResultMonitor {
    if (!ResultMonitor.instance) {
      ResultMonitor.instance = new ResultMonitor();
    }
    return ResultMonitor.instance;
  }

  async trackClick(affiliateLink: string, userId: string, productId: string): Promise<string> {
    try {
      const clickId = `click_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      this.clicks.set(clickId, {
        affiliateLink,
        timestamp: new Date(),
        userId,
        productId,
      });

      this.metrics.clicks++;
      logger.info(`Tracked click: ${clickId} for product ${productId}`);

      return clickId;
    } catch (error) {
      logger.error('Error tracking click:', error);
      throw error;
    }
  }

  async trackConversion(clickId: string, orderValue: number, commission: number): Promise<void> {
    try {
      const click = this.clicks.get(clickId);
      if (!click) {
        logger.warn(`No click found for conversion: ${clickId}`);
        return;
      }

      this.conversions.set(clickId, {
        clickId,
        orderValue,
        commission,
        timestamp: new Date(),
      });

      // Update metrics
      this.metrics.conversions++;
      this.metrics.revenue += orderValue;
      this.metrics.commissions += commission;
      this.metrics.conversionRate = this.metrics.conversions / this.metrics.clicks;

      logger.info(
        `Tracked conversion: ${clickId}, Revenue: $${orderValue}, Commission: $${commission}`
      );
    } catch (error) {
      logger.error('Error tracking conversion:', error);
      throw error;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  private analyzePerformance(): void {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get recent clicks and conversions
      const recentClicks = Array.from(this.clicks.values()).filter(
        (click) => click.timestamp >= hourAgo
      );

      const recentConversions = Array.from(this.conversions.values()).filter(
        (conv) => conv.timestamp >= hourAgo
      );

      // Calculate hourly metrics
      const hourlyMetrics = {
        clicks: recentClicks.length,
        conversions: recentConversions.length,
        revenue: recentConversions.reduce((sum, conv) => sum + conv.orderValue, 0),
        commissions: recentConversions.reduce((sum, conv) => sum + conv.commission, 0),
        conversionRate: recentConversions.length / (recentClicks.length || 1),
      };

      logger.info('Hourly Performance:', hourlyMetrics);
    } catch (error) {
      logger.error('Error analyzing performance:', error);
    }
  }
}
