import { functions } from '../config/firebase';
import { db } from '../config/firebase';
import { analyzeTransactionWithGemini } from '../ai/transactionAnalyzer';

export const testIntegration = functions.https.onRequest(async (req, res) => {
    try {
        // Test Firebase connection
        const testRef = db.ref('test');
        await testRef.set({
            timestamp: Date.now(),
            message: 'Test connection successful'
        });

        // Test Gemini connection
        const testAnalysis = await analyzeTransactionWithGemini({
            transactionId: 'test-123',
            commissionAmount: 10.00,
            saleAmount: 100.00,
            status: 'pending'
        });

        res.status(200).json({
            status: 'success',
            message: 'All integrations working correctly',
            firebaseTest: 'passed',
            geminiTest: testAnalysis ? 'passed' : 'failed'
        });
    } catch (error) {
        console.error('Integration test failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Integration test failed',
            error: error.message
        });
    }
});
