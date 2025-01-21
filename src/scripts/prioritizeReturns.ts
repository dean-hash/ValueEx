import { SupporterValue } from '../core/intelligence/supporterValue';
import { TrustNetwork } from '../core/intelligence/trustNetwork';
import { ValueFlow } from '../core/intelligence/valueFlow';

async function prioritizeReturns() {
  const supporterValue = SupporterValue.getInstance();
  const trustNetwork = TrustNetwork.getInstance();
  const valueFlow = ValueFlow.getInstance();

  console.log('Activating Supporter Value Prioritization...\n');

  // Monitor priority queue
  supporterValue.getPriorityQueue().subscribe((queue) => {
    console.log('\nPriority Queue:');
    console.log('==============');

    queue.forEach((supporter, index) => {
      console.log(`\n${index + 1}. ${supporter.id.toUpperCase()}`);
      console.log(`   Initial Contribution: $${supporter.contribution.toFixed(2)}`);
      console.log(`   Return Multiplier: ${supporter.returnMultiplier}x`);
      console.log(`   Timeframe: ${supporter.timeframe}`);
      console.log(
        `   Time to Return: ${supporterValue.getTimeToReturn(supporter.id).toFixed(1)} days`
      );
    });
  });

  // Monitor value optimization
  valueFlow.observeValue().subscribe(() => {
    const optimizedValue = supporterValue.getOptimizedValue();
    const impact = trustNetwork.getCurrentImpact();

    console.log('\nValue Optimization:');
    console.log('==================');
    console.log(`Total Optimized Value: $${optimizedValue.toFixed(2)}`);
    console.log(`Network Growth Effect: ${impact.growth.toFixed(2)}x`);
    console.log(`Sustainable Value: $${(optimizedValue * impact.growth).toFixed(2)}`);
  });

  // Add real-time value signals
  supporterValue.addSupporterReturn({
    id: 'tech_innovators',
    contribution: 20000,
    returnMultiplier: 1.9,
    priority: 2,
    timeframe: 'short_term',
  });

  setTimeout(() => {
    supporterValue.addSupporterReturn({
      id: 'impact_investors',
      contribution: 30000,
      returnMultiplier: 2.1,
      priority: 1,
      timeframe: 'immediate',
    });
  }, 1000);
}

prioritizeReturns().catch(console.error);
