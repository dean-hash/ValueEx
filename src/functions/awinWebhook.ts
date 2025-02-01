import { functions } from '../config/firebase';
import { db } from '../config/firebase';
import { AffiliateConnector } from '../revenue/affiliateConnector';

export const awinWebhook = functions.https.onRequest(async (req, res) => {
    try {
        // Validate request method
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        const transactionData = req.body;
        
        // Basic validation
        if (!transactionData || !transactionData.transactionId) {
            res.status(400).send('Invalid transaction data');
            return;
        }

        // Store transaction in Firebase
        await db.ref(`transactions/${transactionData.transactionId}`).set({
            ...transactionData,
            timestamp: admin.database.ServerValue.TIMESTAMP,
            processed: false
        });

        // Process with our existing connector
        const connector = AffiliateConnector.getInstance();
        await connector.handleTransactionNotification(transactionData);

        // Use Gemini to analyze transaction patterns (we'll implement this next)
        await analyzeTransactionWithGemini(transactionData);

        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Internal server error'
        });
    }
});
