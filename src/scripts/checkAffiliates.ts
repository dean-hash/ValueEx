import { AwinClient } from '../services/affiliate/awinClient';
import { OpportunityMatcher } from '../services/affiliate/opportunityMatcher';
import dotenv from 'dotenv';

dotenv.config();

interface AffiliateMatch {
  name: string;
  commission: number;
  potentialValue: number;
  matchConfidence: number;
  quickStart: {
    timeToImplement: number;
    steps: Array<{
      type: string;
      description: string;
    }>;
  };
}

async function checkHighValueAffiliates() {
  const awinClient = new AwinClient(process.env.AWIN_API_KEY || '');
  const matcher = new OpportunityMatcher(awinClient);

  console.log('Finding high-value affiliate opportunities...');
  const matches = await matcher.findHighValueMatches();

  console.log('\nTop 5 Opportunities:');
  matches.slice(0, 5).forEach((match: AffiliateMatch, i: number) => {
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
