import { GoDaddyConnector } from '../services/domain/connectors/godaddyConnector';
import { logger } from '../utils/logger';

async function listDomains(): Promise<void> {
  const connector = GoDaddyConnector.getInstance();

  try {
    logger.info('Fetching domain list...');
    const domains = await connector.listDomains();

    logger.info('\nDomain Analysis Report:');
    logger.info('=====================\n');

    domains.forEach((domain) => {
      logger.info(`Domain: ${domain.domain}`);
      logger.info(`Status: ${domain.status}`);
      logger.info(`Expires: ${domain.expires}`);
      logger.info('-------------------\n');
    });
  } catch (error) {
    logger.error('Error listing domains:', error);
    process.exit(1);
  }
}

// Run it
listDomains().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
