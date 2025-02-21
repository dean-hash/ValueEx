"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const godaddyConnector_1 = require("../services/domain/connectors/godaddyConnector");
const domainAnalyzer_1 = require("../services/revenue/domainAnalyzer");
const logger_1 = require("../utils/logger");
async function analyzeDomains() {
    const connector = godaddyConnector_1.GoDaddyConnector.getInstance();
    const analyzer = domainAnalyzer_1.DomainAnalyzer.getInstance();
    try {
        // Get our actual domain list from GoDaddy
        logger_1.logger.info('Fetching domain list...');
        const domains = await connector.listDomains();
        logger_1.logger.info(`Found ${domains.length} domains. Analyzing opportunities...`);
        const analyses = await Promise.all(domains.map((domain) => analyzer.analyzeDomain(domain)));
        // Group domains by best use
        const quickFlips = analyses.filter((a) => a.quickFlipValue > a.affiliateValue * 12);
        const affiliateDomains = analyses.filter((a) => a.quickFlipValue <= a.affiliateValue * 12);
        logger_1.logger.info('\n=== Domain Analysis Report ===\n');
        if (quickFlips.length > 0) {
            logger_1.logger.info('\nQuick Flip Opportunities:');
            quickFlips.forEach((a) => {
                logger_1.logger.info(`\n${a.domain}:`);
                logger_1.logger.info(`- Estimated Value: $${a.quickFlipValue}`);
                logger_1.logger.info(`- SEO Score: ${(a.metrics.seoValue * 100).toFixed(1)}%`);
                logger_1.logger.info(`- Brand Value: ${(a.metrics.brandValue * 100).toFixed(1)}%`);
                logger_1.logger.info('Recommendations:');
                a.recommendations.forEach((r) => logger_1.logger.info(`  - ${r}`));
            });
        }
        if (affiliateDomains.length > 0) {
            logger_1.logger.info('\nAffiliate Revenue Opportunities:');
            affiliateDomains.forEach((a) => {
                logger_1.logger.info(`\n${a.domain}:`);
                logger_1.logger.info(`- Est. Monthly Revenue: $${a.affiliateValue}`);
                logger_1.logger.info(`- Conversion Score: ${(a.metrics.conversionPotential * 100).toFixed(1)}%`);
                logger_1.logger.info(`- Market Demand: ${(a.metrics.marketDemand * 100).toFixed(1)}%`);
                logger_1.logger.info('Recommendations:');
                a.recommendations.forEach((r) => logger_1.logger.info(`  - ${r}`));
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Error analyzing domains:', error);
        throw error;
    }
}
// Run analysis
analyzeDomains().catch((error) => {
    logger_1.logger.error('Failed to analyze domains:', error);
    process.exit(1);
});
//# sourceMappingURL=analyzeDomains.js.map