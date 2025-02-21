"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const revenueTracker_1 = require("../services/affiliate/revenueTracker");
const awinClient_1 = require("../services/awin/awinClient");
const resonanceEngine_1 = require("../services/resonance/resonanceEngine");
async function showOpportunities() {
    const publisherId = '20934';
    const apiKey = '9f1c7f0f-7ef7-4f6c-8c8d-2e2f4f1f1e5c';
    const tracker = new revenueTracker_1.RevenueTracker();
    try {
        const response = await axios_1.default.get(`https://api.awin.com/publishers/${publisherId}/programmes`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            params: {
                relationship: 'joined',
                orderBy: 'commissionRate',
                orderDirection: 'desc',
            },
        });
        // Focus on immediate high-value opportunities
        const opportunities = response.data
            .filter((prog) => prog.commissionRate > 20)
            .map((prog) => ({
            id: prog.id,
            name: prog.name,
            commissionRate: prog.commissionRate,
            averagePayment: prog.averagePayment,
            potentialValue: (prog.averagePayment * prog.commissionRate) / 100,
        }))
            .sort((a, b) => b.potentialValue - a.potentialValue)
            .slice(0, 5);
        console.log('\nTop 5 High-Value Opportunities:');
        opportunities.forEach((opp) => {
            console.log(`\nProgram: ${opp.name}`);
            console.log(`Commission Rate: ${opp.commissionRate}%`);
            console.log(`Average Payment: $${opp.averagePayment}`);
            console.log(`Potential Value: $${opp.potentialValue}`);
            // Track this revenue opportunity
            tracker.trackOpportunity({
                source: opp.name,
                value: opp.potentialValue,
                confidence: opp.commissionRate / 100,
            });
        });
        // Generate affiliate links for these opportunities
        const links = await Promise.all(opportunities.map((opp) => axios_1.default.post(`https://api.awin.com/publishers/${publisherId}/programmes/${opp.id}/deeplink`, {
            url: `https://www.awin1.com/cread.php?awinmid=${opp.id}&awinaffid=${publisherId}`,
            campaignId: 'high_value_automation',
        }, {
            headers: { Authorization: `Bearer ${apiKey}` },
        })));
        console.log('\nAffiliate Links Generated:');
        links.forEach((link, i) => {
            console.log(`\n${opportunities[i].name}: ${link.data.deeplink}`);
        });
        // Show final metrics
        console.log('\nBoard Report:', tracker.getBoardReport());
    }
    catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}
async function trackAwinOpportunities() {
    const awinClient = new awinClient_1.AwinClient();
    const revenueTracker = revenueTracker_1.RevenueTracker.getInstance();
    const resonanceEngine = resonanceEngine_1.ResonanceEngine.getInstance();
    // Get merchant opportunities
    const merchants = await awinClient.getMerchants();
    console.log(`Found ${merchants.length} merchants`);
    for (const merchant of merchants) {
        // Create value opportunity
        const opportunity = {
            merchant: merchant.name,
            strength: merchant.averageCommission / 100,
            urgency: merchant.conversionRate,
            readiness: merchant.validationStatus === 'approved' ? 1 : 0.5,
            confidence: merchant.performance?.reliability || 0.7,
        };
        // Create and amplify gesture
        const gesture = new resonanceEngine_1.ResonanceGesture(opportunity);
        await gesture.amplify();
        // Transform to action and execute
        const action = await gesture.transformToAction();
        const result = await action.execute();
        // Track revenue impact
        const impact = await revenueTracker.trackManifestationResult(result);
        console.log(`
Merchant: ${merchant.name}
Revenue Impact: $${impact.metrics.dailyRevenue.toFixed(2)}
Coherence: ${impact.coherence.toFixed(2)}
Success: ${impact.success}
        `);
    }
}
// Run it
trackAwinOpportunities().catch(console.error);
showOpportunities();
//# sourceMappingURL=showAwinOpportunities.js.map