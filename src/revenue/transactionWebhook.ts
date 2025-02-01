import express from 'express';
import { AffiliateConnector } from './affiliateConnector';

const router = express.Router();

router.post('/awin/transaction', async (req, res) => {
    try {
        const connector = AffiliateConnector.getInstance();
        await connector.handleTransactionNotification(req.body);
        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Error processing Awin transaction:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process transaction' });
    }
});

export default router;
