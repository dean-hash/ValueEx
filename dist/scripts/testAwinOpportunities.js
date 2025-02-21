"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const affiliateManager_1 = require("../services/affiliateManager");
async function showOpportunities() {
    const manager = new affiliateManager_1.AffiliateManager();
    console.log('Fetching high-value AI/Tech opportunities...\n');
    const opportunities = await manager.findHighValueOpportunities();
    console.log('Top High-Value Opportunities:');
    console.log('============================\n');
    opportunities.slice(0, 10).forEach((opp, index) => {
        console.log(`${index + 1}. ${opp.name}`);
        console.log(`   Commission Rate: ${opp.commissionRate}%`);
        console.log(`   Category: ${opp.category}`);
        console.log(`   Demand Score: ${(opp.demandScore * 100).toFixed(1)}%`);
        console.log(`   Est. Monthly Revenue: $${opp.estimatedMonthlyRevenue.toFixed(2)}`);
        console.log(`   Merchant: ${opp.merchantName}`);
        console.log('');
    });
}
showOpportunities().catch(console.error);
//# sourceMappingURL=testAwinOpportunities.js.map