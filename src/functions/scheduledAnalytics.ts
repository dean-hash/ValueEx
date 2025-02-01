import * as functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { logger } from '../utils/logger';

const db = getFirestore();
const secretManager = new SecretManagerServiceClient();

async function getGeminiKey(): Promise<string> {
  const [version] = await secretManager.accessSecretVersion({
    name: `projects/${process.env.FIREBASE_PROJECT_ID}/secrets/gemini-api-key/versions/latest`
  });
  return version.payload?.data?.toString() || '';
}

export const dailyRevenueOptimization = functions.pubsub
  .schedule('0 1 * * *') // Run at 1 AM daily
  .timeZone('America/New_York')
  .onRun(async () => {
    try {
      // 1. Gather daily stats
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const statsDoc = await db.collection('dailyStats').doc(yesterdayStr).get();
      const stats = statsDoc.data();

      if (!stats) {
        logger.info('No transactions for yesterday');
        return null;
      }

      // 2. Get merchant details
      const merchantStats = new Map();
      for (const [merchantId, data] of Object.entries(stats.merchantStats)) {
        const merchantDoc = await db.collection('merchants').doc(merchantId).get();
        const merchant = merchantDoc.data();
        if (merchant) {
          merchantStats.set(merchantId, {
            ...data,
            name: merchant.name,
            category: merchant.category,
            commission: merchant.commissionRates
          });
        }
      }

      // 3. Generate revenue optimization insights
      const genAI = new GoogleGenerativeAI(await getGeminiKey());
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Analyze ValueEx's affiliate marketing performance for ${yesterdayStr}:

Daily Performance:
- Total Transactions: ${stats.totalTransactions}
- Total Value: ${stats.totalValue}

Merchant Performance:
${Array.from(merchantStats.entries())
  .map(([id, data]) => `- ${data.name} (${data.category}):
  * Transactions: ${data.transactions}
  * Value: ${data.value}
  * Commission Rate: ${data.commission.default}%`)
  .join('\n')}

Focus on IMMEDIATE Revenue Generation:
1. Identify the highest-performing merchants and recommend ways to increase transactions
2. Spot quick-win opportunities with existing merchants
3. Suggest new merchant partnerships based on performance patterns
4. Recommend commission rate optimizations
5. Identify any urgent actions needed to boost revenue within 24-48 hours

Provide specific, actionable recommendations that can be implemented immediately to increase revenue.`;

      const result = await model.generateContent(prompt);
      const analysis = result.response.text();

      // 4. Store insights and update recommendations
      const insightsRef = db.collection('revenueInsights').doc(yesterdayStr);
      await insightsRef.set({
        date: yesterday,
        stats: stats,
        analysis: analysis.split('\n').filter(line => line.trim()),
        merchantPerformance: Object.fromEntries(merchantStats),
        generated: Timestamp.now()
      });

      // 5. Flag high-priority actions
      const highPriorityActions = analysis
        .split('\n')
        .filter(line => 
          line.toLowerCase().includes('urgent') || 
          line.toLowerCase().includes('immediate') ||
          line.toLowerCase().includes('high priority')
        );

      if (highPriorityActions.length > 0) {
        await db.collection('actionItems').add({
          type: 'revenue_optimization',
          priority: 'HIGH',
          actions: highPriorityActions,
          created: Timestamp.now(),
          status: 'pending'
        });
      }

      logger.info('Daily revenue optimization completed', {
        date: yesterdayStr,
        totalTransactions: stats.totalTransactions,
        urgentActions: highPriorityActions.length
      });

      return null;
    } catch (error) {
      logger.error('Error in daily revenue optimization:', error);
      throw error;
    }
  });
