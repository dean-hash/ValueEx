import { db } from '../../src/config/firebase';
import { analyzeTransactionWithGemini } from '../../src/ai/transactionAnalyzer';
import { logger } from '../../src/utils/logger';

async function testIntegrations() {
  try {
    logger.info('Testing Firebase connection...');
    const testRef = db.ref('test');
    await testRef.set({
      timestamp: Date.now(),
      message: 'Test connection successful'
    });
    logger.info('✅ Firebase connection successful');

    logger.info('Testing Gemini integration...');
    const testAnalysis = await analyzeTransactionWithGemini({
      transactionId: 'test-123',
      commissionAmount: 10.00,
      saleAmount: 100.00,
      status: 'pending'
    });
    logger.info('✅ Gemini integration successful');
    logger.info('Sample analysis:', testAnalysis);

    // Clean up test data
    await testRef.remove();
    logger.info('🎉 All integrations working correctly!');
  } catch (error) {
    logger.error('Integration test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testIntegrations();
}
