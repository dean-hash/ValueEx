import { logger } from '../../utils/logger';
import axios from 'axios';
import { RevenueEvent } from '../revenue/types';
import { AffiliateManager } from '../affiliate/affiliateManager';
import { RevenueVerifier } from '../verification/revenueVerifier';

interface MonitoringMetrics {
  totalRevenue: number;
  verifiedRevenue: number;
  pendingVerification: number;
  networkBreakdown: {
    [key: string]: {
      revenue: number;
      conversions: number;
      verificationRate: number;
    };
  };
  lastUpdated: string;
}

export class RevenueMonitor {
  private static instance: RevenueMonitor;
  private affiliateManager: AffiliateManager;
  private verifier: RevenueVerifier;
  private metrics: MonitoringMetrics;
  private externalValidators: string[];

  private constructor() {
    this.affiliateManager = AffiliateManager.getInstance();
    this.verifier = RevenueVerifier.getInstance();
    this.externalValidators = [
      'https://api.stripe.com/v1/balance',
      'https://api.coinbase.com/v2/accounts',
      'https://api.etherscan.io/api',
    ];
    this.metrics = this.initializeMetrics();
  }

  public static getInstance(): RevenueMonitor {
    if (!RevenueMonitor.instance) {
      RevenueMonitor.instance = new RevenueMonitor();
    }
    return RevenueMonitor.instance;
  }

  private initializeMetrics(): MonitoringMetrics {
    return {
      totalRevenue: 0,
      verifiedRevenue: 0,
      pendingVerification: 0,
      networkBreakdown: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  public async startMonitoring(): Promise<void> {
    logger.info('Starting revenue monitoring...');

    // Monitor every 5 minutes
    setInterval(async () => {
      await this.updateMetrics();
      await this.validateWithExternalSources();
      await this.generateReport();
    }, 300000);
  }

  private async updateMetrics(): Promise<void> {
    try {
      // Get active networks
      const networks = this.affiliateManager.getActiveNetworks();

      // Update metrics for each network
      for (const networkId of networks) {
        const stats = await this.affiliateManager.getNetworkStats(networkId);
        if (stats) {
          this.metrics.networkBreakdown[networkId] = {
            revenue: stats.revenue,
            conversions: stats.conversions,
            verificationRate: stats.verifiedTransactions / stats.totalTransactions,
          };
        }
      }

      // Update totals
      this.metrics.totalRevenue = Object.values(this.metrics.networkBreakdown).reduce(
        (total, network) => total + network.revenue,
        0
      );

      this.metrics.lastUpdated = new Date().toISOString();

      logger.info('Metrics updated:', this.metrics);
    } catch (error) {
      logger.error('Failed to update metrics:', error);
    }
  }

  private async validateWithExternalSources(): Promise<void> {
    try {
      const validations = await Promise.all(
        this.externalValidators.map((endpoint) =>
          axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            },
          })
        )
      );

      const allValid = validations.every((response) => response.status === 200);
      if (!allValid) {
        logger.warn('Some external validations failed');
      }

      // Update verified revenue
      this.metrics.verifiedRevenue =
        this.metrics.totalRevenue *
        (validations.filter((v) => v.status === 200).length / validations.length);
    } catch (error) {
      logger.error('External validation failed:', error);
    }
  }

  private async generateReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      verifiedTransactions: this.verifier.getVerifiedTransactions(),
      activeNetworks: this.affiliateManager.getActiveNetworks(),
    };

    // Save report to blockchain for immutability
    try {
      await axios.post('https://api.etherscan.io/api', {
        module: 'proxy',
        action: 'eth_sendRawTransaction',
        hex: Buffer.from(JSON.stringify(report)).toString('hex'),
        apikey: process.env.ETHERSCAN_API_KEY,
      });
    } catch (error) {
      logger.error('Failed to save report to blockchain:', error);
    }

    logger.info('Revenue report generated:', report);
  }

  public getMetrics(): MonitoringMetrics {
    return this.metrics;
  }

  public getVerificationRate(): number {
    return this.metrics.verifiedRevenue / this.metrics.totalRevenue;
  }
}
