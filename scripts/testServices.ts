import { EmailMonitor } from '../src/services/email/emailMonitor';
import { DomainAnalyzer } from '../src/services/revenue/domainAnalyzer';
import { logger } from '../src/utils/logger';

async function main() {
  try {
    // Start email monitoring
    const emailMonitor = EmailMonitor.getInstance();
    await emailMonitor.startMonitoring();
    logger.info('Email monitoring started');

    // Test domain analysis
    const domainAnalyzer = DomainAnalyzer.getInstance();
    const testDomains = [
      'aimarkets.tech',
      'smartfinance.com',
      'cryptotrends.io',
      'healthtech.ai'
    ];

    for (const domain of testDomains) {
      const analysis = await domainAnalyzer.analyzeDomain({ domain });
      logger.info(`Analysis for ${domain}:`, {
        quickFlipValue: analysis.quickFlipValue,
        affiliateValue: analysis.affiliateValue,
        aiInsights: analysis.aiInsights,
        recommendations: analysis.recommendations
      });
    }

    // Test email search
    const recentEmails = await emailMonitor.searchEmails('domain', 1);
    logger.info('Recent domain-related emails:', recentEmails.length);

  } catch (error) {
    logger.error('Error running tests:', error);
  }
}

main();
