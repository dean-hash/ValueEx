import { mvpRunner } from './src/mvp/runner';
import { logger } from './src/utils/logger';

logger.info('Starting ValueEx MVP');

mvpRunner.start().catch((error) => {
  logger.error('Failed to start MVP:', error);
  process.exit(1);
});
