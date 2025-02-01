import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Transaction } from '../models/transaction';
import { logger } from '../utils/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as crypto from 'crypto';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const secretManager = new SecretManagerServiceClient();

async function verifyWebhookSignature(signature: string, body: string, secret: string): Promise<boolean> {
  const hmac = crypto.createHmac('sha256', secret);
  const computedSignature = hmac.update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}

async function getSecrets(): Promise<{ geminiKey: string; webhookSecret: string }> {
  const [geminiVersion] = await secretManager.accessSecretVersion({
    name: `projects/${process.env.FIREBASE_PROJECT_ID}/secrets/gemini-api-key/versions/latest`
  });
  const [webhookVersion] = await secretManager.accessSecretVersion({
    name: `projects/${process.env.FIREBASE_PROJECT_ID}/secrets/awin-webhook-secret/versions/latest`
  });
  
  return {
    geminiKey: geminiVersion.payload?.data?.toString() || '',
    webhookSecret: webhookVersion.payload?.data?.toString() || ''
  };
}

function validateTransaction(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.transactionId || typeof data.transactionId !== 'string') {
    errors.push('Invalid or missing transactionId');
  }
  if (!data.merchantId || typeof data.merchantId !== 'string') {
    errors.push('Invalid or missing merchantId');
  }
  if (typeof data.amount !== 'number' || data.amount <= 0) {
    errors.push('Invalid transaction amount');
  }
  if (!['USD', 'EUR', 'GBP'].includes(data.currency)) {
    errors.push('Unsupported currency');
  }
  
  return { valid: errors.length === 0, errors };
}

export const handleAwinWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // 1. Validate request method and headers
    if (req.method !== 'POST') {
      logger.warn('Invalid request method', { method: req.method });
      return res.status(405).send('Method not allowed');
    }

    const signature = req.headers['x-awin-signature'];
    if (!signature || typeof signature !== 'string') {
      logger.warn('Missing webhook signature');
      return res.status(401).send('Unauthorized');
    }

    // 2. Get secrets and verify signature
    const { geminiKey, webhookSecret } = await getSecrets();
    const isValid = await verifyWebhookSignature(
      signature,
      JSON.stringify(req.body),
      webhookSecret
    );

    if (!isValid) {
      logger.warn('Invalid webhook signature');
      return res.status(401).send('Unauthorized');
    }

    // 3. Validate webhook data
    const validation = validateTransaction(req.body);
    if (!validation.valid) {
      logger.warn('Invalid transaction data', { errors: validation.errors });
      return res.status(400).json({ errors: validation.errors });
    }

    // 4. Create transaction document
    const transaction: Transaction = {
      transactionId: req.body.transactionId,
      timestamp: Timestamp.now(),
      merchantId: req.body.merchantId,
      transactionValue: req.body.amount,
      currency: req.body.currency,
      transactionType: req.body.type || 'purchase',
      status: 'pending',
      affiliateNetwork: 'awin',
      rawWebhookData: req.body
    };

    // 5. Initialize Gemini for analysis
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze this affiliate marketing transaction for ValueEx:

Transaction Details:
- Merchant: ${req.body.merchantName}
- Value: ${transaction.transactionValue} ${transaction.currency}
- Type: ${transaction.transactionType}

Focus Areas:
1. Revenue Generation:
   - Identify immediate revenue optimization opportunities
   - Suggest quick-win merchant partnerships
   - Highlight high-value transaction patterns

2. Performance Analysis:
   - Compare to historical merchant performance
   - Identify conversion rate patterns
   - Flag any unusual patterns or potential issues

3. Growth Opportunities:
   - Recommend similar merchants to target
   - Suggest optimal commission structures
   - Identify underserved market segments

Provide actionable insights that can directly increase revenue within the next 7 days.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    // 6. Store transaction with analysis
    const batch = db.batch();
    
    // Transaction document
    const transactionRef = db.collection('transactions').doc(transaction.transactionId);
    batch.set(transactionRef, {
      ...transaction,
      analysisResults: {
        insights: analysis.split('\n').filter(line => line.trim()),
        recommendations: [],
        lastAnalyzed: Timestamp.now()
      }
    });

    // Update merchant metrics
    const merchantRef = db.collection('merchants').doc(transaction.merchantId);
    batch.set(merchantRef, {
      performanceMetrics: {
        totalTransactions: FieldValue.increment(1),
        totalValue: FieldValue.increment(transaction.transactionValue),
        lastUpdated: Timestamp.now()
      }
    }, { merge: true });

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    const statsRef = db.collection('dailyStats').doc(today);
    batch.set(statsRef, {
      totalTransactions: FieldValue.increment(1),
      totalValue: FieldValue.increment(transaction.transactionValue),
      merchantStats: {
        [transaction.merchantId]: {
          transactions: FieldValue.increment(1),
          value: FieldValue.increment(transaction.transactionValue)
        }
      }
    }, { merge: true });

    await batch.commit();

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).send('Internal server error');
  }
});
