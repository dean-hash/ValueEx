import axios from 'axios';
import { RevenueTracker, RevenueOpportunity } from '../services/affiliate/revenueTracker';
import { AwinClient } from '../services/awin/awinClient';
import { ResonanceEngine, ResonanceGesture } from '../services/resonance/resonanceEngine';

interface AwinProgram {
  id: number;
  name: string;
  commissionRate: number;
  averagePayment: number;
  primaryRegion: string;
  joinStatus: string;
}

interface ValueOpportunity {
  id: number;
  name: string;
  commissionRate: number;
  averagePayment: number;
  potentialValue: number;
}

async function showOpportunities() {
  const publisherId = '20934';
  const apiKey = '9f1c7f0f-7ef7-4f6c-8c8d-2e2f4f1f1e5c';
  const tracker = new RevenueTracker();

  try {
    const response = await axios.get<AwinProgram[]>(
      `https://api.awin.com/publishers/${publisherId}/programmes`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        params: {
          relationship: 'joined',
          orderBy: 'commissionRate',
          orderDirection: 'desc',
        },
      }
    );

    // Focus on immediate high-value opportunities
    const opportunities: ValueOpportunity[] = response.data
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
    opportunities.forEach((opp: ValueOpportunity) => {
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
    const links = await Promise.all(
      opportunities.map((opp) =>
        axios.post(
          `https://api.awin.com/publishers/${publisherId}/programmes/${opp.id}/deeplink`,
          {
            url: `https://www.awin1.com/cread.php?awinmid=${opp.id}&awinaffid=${publisherId}`,
            campaignId: 'high_value_automation',
          },
          {
            headers: { Authorization: `Bearer ${apiKey}` },
          }
        )
      )
    );

    console.log('\nAffiliate Links Generated:');
    links.forEach((link, i) => {
      console.log(`\n${opportunities[i].name}: ${link.data.deeplink}`);
    });

    // Show final metrics
    console.log('\nBoard Report:', tracker.getBoardReport());
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

async function trackAwinOpportunities() {
  const awinClient = new AwinClient();
  const revenueTracker = RevenueTracker.getInstance();
  const resonanceEngine = ResonanceEngine.getInstance();

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
    const gesture = new ResonanceGesture(opportunity);
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
