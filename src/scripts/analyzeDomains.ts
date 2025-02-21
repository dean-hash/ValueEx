import { GoDaddyConnector } from '../services/domain/connectors/godaddyConnector';
import { DomainAnalyzer } from '../services/revenue/domainAnalyzer';
import { logger } from '../utils/logger';

async function analyzeDomains() {
  const connector = GoDaddyConnector.getInstance();
  const analyzer = DomainAnalyzer.getInstance();

  try {
    // Get our actual domain list from GoDaddy
    logger.info('Fetching domain list...');
    const domains = await connector.listDomains();

    logger.info(`Found ${domains.length} domains. Analyzing opportunities...`);

    const analyses = await Promise.all(domains.map((domain) => analyzer.analyzeDomain(domain)));

    // Group domains by best use
    const quickFlips = analyses.filter((a) => a.quickFlipValue > a.affiliateValue * 12);
    const affiliateDomains = analyses.filter((a) => a.quickFlipValue <= a.affiliateValue * 12);

    logger.info('\n=== Domain Analysis Report ===\n');

    if (quickFlips.length > 0) {
      logger.info('\nQuick Flip Opportunities:');
      quickFlips.forEach((a) => {
        logger.info(`\n${a.domain}:`);
        logger.info(`- Estimated Value: $${a.quickFlipValue}`);
        logger.info(`- SEO Score: ${(a.metrics.seoValue * 100).toFixed(1)}%`);
        logger.info(`- Brand Value: ${(a.metrics.brandValue * 100).toFixed(1)}%`);
        logger.info('Recommendations:');
        a.recommendations.forEach((r) => logger.info(`  - ${r}`));
      });
    }

    if (affiliateDomains.length > 0) {
      logger.info('\nAffiliate Revenue Opportunities:');
      affiliateDomains.forEach((a) => {
        logger.info(`\n${a.domain}:`);
        logger.info(`- Est. Monthly Revenue: $${a.affiliateValue}`);
        logger.info(`- Conversion Score: ${(a.metrics.conversionPotential * 100).toFixed(1)}%`);
        logger.info(`- Market Demand: ${(a.metrics.marketDemand * 100).toFixed(1)}%`);
        logger.info('Recommendations:');
        a.recommendations.forEach((r) => logger.info(`  - ${r}`));
      });
    }
  } catch (error) {
    logger.error('Error analyzing domains:', error);
    throw error;
  }
}

// Run analysis
analyzeDomains().catch((error) => {
  logger.error('Failed to analyze domains:', error);
  process.exit(1);
});
