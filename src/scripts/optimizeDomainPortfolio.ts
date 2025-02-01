import { logger } from '../utils/logger';
import { CredentialsManager } from '../config/credentialsManager';
import { RevenueTracker } from '../services/revenue/revenueTracker';
import { DomainRevenueManager } from '../services/revenue/revenueStreamManager';
import { AffiliateManager } from '../services/affiliate/affiliateManager';
import { RevenueMonitor } from '../services/monitoring/revenueMonitor';
import { RevenueVerifier } from '../services/verification/revenueVerifier';

async function validateSetup(): Promise<boolean> {
  const credentialsManager = CredentialsManager.getInstance();
  return await credentialsManager.validateCredentials();
}

async function main() {
  try {
    logger.info('Starting ValueEx revenue generation system...');

    // Validate setup
    const isValid = await validateSetup();
    if (!isValid) {
      throw new Error('System validation failed. Check credentials and try again.');
    }

    // Initialize all components
    const manager = DomainRevenueManager.getInstance();
    const tracker = RevenueTracker.getInstance();
    const affiliateManager = AffiliateManager.getInstance();
    const monitor = RevenueMonitor.getInstance();
    const verifier = RevenueVerifier.getInstance();

    logger.info('Starting revenue generation and monitoring...');

    // Start all systems in parallel
    await Promise.all([
      manager.optimizePortfolio(),
      manager.monitorRevenue(),
      monitor.startMonitoring(),
      tracker.trackRevenue({
        source: 'domain',
        amount: 0,
        details: {
          action: 'system_start',
          timestamp: new Date().toISOString(),
        },
      }),
    ]);

    // Log active revenue streams
    logger.info('Active affiliate networks:', affiliateManager.getActiveNetworks());
    logger.info(
      'Verification system status:',
      verifier.getVerifiedTransactions().length,
      'transactions verified'
    );

    // Start continuous monitoring
    setInterval(async () => {
      const metrics = monitor.getMetrics();
      logger.info('Current revenue metrics:', {
        total: metrics.totalRevenue,
        verified: metrics.verifiedRevenue,
        verificationRate: monitor.getVerificationRate(),
      });
    }, 3600000); // Check every hour

    logger.info('Revenue generation system running with full verification');
  } catch (error) {
    logger.error('Error in revenue generation system:', error);
    process.exit(1);
  }
}

// Start the system
main();
