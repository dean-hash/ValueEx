import { config } from 'dotenv';
import { AffiliateManager } from '../services/affiliateManager';

// Load environment variables
config();

async function showOpportunities() {
  const manager = new AffiliateManager();
  console.log('Fetching high-value opportunities...\n');

  const opportunities = await manager.findHighValueOpportunities({
    category: 'AI_TOOLS',
    minCommissionRate: 25,
    maxPrice: 1000,
    sortBy: 'potentialValue',
  });

  console.log('Top High-Value Opportunities:');
  console.log('============================\n');

  opportunities.forEach((opp, index) => {
    console.log(`${index + 1}. ${opp.name}`);
    console.log(`   Price: $${opp.price}`);
    console.log(`   Commission Rate: ${opp.commissionRate}%`);
    console.log(`   Category: ${opp.category}`);
    console.log(`   Potential Monthly Revenue: $${opp.metrics.projectedRevenue}`);
    console.log(`   Engagement Score: ${opp.metrics.engagementScore}\n`);
  });
}

showOpportunities().catch(console.error);
