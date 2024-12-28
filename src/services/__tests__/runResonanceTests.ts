import { ResonancePatternTest } from './resonancePatternTest';
import { logger } from '../../utils/logger';

async function runTests() {
  logger.info('Initializing Resonance Pattern Tests', {
    timestamp: new Date('2024-12-20T12:07:12-05:00').toISOString(),
  });

  const tester = new ResonancePatternTest();
  await tester.runTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    logger.error('Test execution failed', error);
    process.exit(1);
  });
}

export { runTests };
