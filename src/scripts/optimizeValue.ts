import { AffiliateManager } from '../services/affiliateManager';

async function optimizeValue() {
  const manager = new AffiliateManager();

  // Process real conversion with market data
  await manager.processConversion({
    type: 'premium_subscription',
    value: 25000,
    path: 'ai_tools/enterprise',
    metrics: {
      engagementScore: 0.95,
      marketFit: 0.92,
    },
    category: 'AI_TOOLS',
  });
}

optimizeValue().catch(console.error);
