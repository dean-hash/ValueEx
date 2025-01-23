"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const affiliateManager_1 = require("../services/affiliateManager");
// Load environment variables
(0, dotenv_1.config)();
async function showOpportunities() {
    const manager = new affiliateManager_1.AffiliateManager();
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
//# sourceMappingURL=testAwin.js.map