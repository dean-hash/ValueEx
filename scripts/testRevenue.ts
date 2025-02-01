import { AwinClient } from '../src/services/affiliate/awinClient';
import { logger } from '../src/utils/logger';
import { AffiliateProgram } from '../src/services/affiliate/awinClient';

async function testAwinIntegration() {
  try {
    // Initialize with our known working credentials
    const awinClient = new AwinClient('29f5f656-d632-4cdd-b0c1-e4ad3f1fd0e2');

    logger.info('Testing Awin API connection...');

    // Get high-value programs
    const programs: AffiliateProgram[] = await awinClient.getHighValuePrograms();
    logger.info(`Found ${programs.length} high-value programs`);

    // Log top 5 opportunities
    programs.slice(0, 5).forEach((program: AffiliateProgram) => {
      logger.info(`Program: ${program.name}`);
      logger.info(`Commission Rate: ${program.commissionRate}%`);
      if (program.metrics) {
        logger.info(`Average Order Value: $${program.metrics.averageOrderValue}`);
        logger.info(`Conversion Rate: ${program.metrics.conversionRate}%`);
        logger.info('---');
      }
    });

    return programs;
  } catch (error) {
    logger.error('Failed to test Awin integration:', error);
    throw error;
  }
}

// Run the test if called directly
if (require.main === module) {
  testAwinIntegration()
    .then((programs) => {
      if (programs.length > 0) {
        logger.info('✅ Awin integration is working!');
      }
    })
    .catch((error) => {
      logger.error('❌ Awin integration test failed:', error);
      process.exit(1);
    });
}
