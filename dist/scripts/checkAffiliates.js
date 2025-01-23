"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const awinClient_1 = require("../services/affiliate/awinClient");
const opportunityMatcher_1 = require("../services/affiliate/opportunityMatcher");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function checkHighValueAffiliates() {
    const awinClient = new awinClient_1.AwinClient(process.env.AWIN_API_KEY || '');
    const matcher = new opportunityMatcher_1.OpportunityMatcher(awinClient);
    console.log('Finding high-value affiliate opportunities...');
    const matches = await matcher.findHighValueMatches();
    console.log('\nTop 5 Opportunities:');
    matches.slice(0, 5).forEach((match, i) => {
        console.log(`\n${i + 1}. ${match.name}`);
        console.log(`   Commission: ${match.commission}%`);
        console.log(`   Potential Value: $${match.potentialValue}`);
        console.log(`   Match Confidence: ${(match.matchConfidence * 100).toFixed(1)}%`);
        console.log('   Quick Start:');
        console.log(`   - Time to Implement: ${match.quickStart.timeToImplement} minutes`);
        console.log(`   - Steps: ${match.quickStart.steps.length} steps`);
    });
}
checkHighValueAffiliates().catch(console.error);
//# sourceMappingURL=checkAffiliates.js.map