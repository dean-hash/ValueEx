import { TrustNetwork } from '../core/intelligence/trustNetwork';
import { ValueFlow } from '../core/intelligence/valueFlow';
import { FlowEngine } from '../core/intelligence/flowEngine';

async function demonstrateTrust() {
  const trustNetwork = TrustNetwork.getInstance();
  const valueFlow = ValueFlow.getInstance();
  const flowEngine = FlowEngine.getInstance();

  console.log('Activating Trust Network...\n');

  // Inject real trust signals
  trustNetwork.injectTrust({
    source: 'early_supporters',
    intent: 'value_creation',
    value: {
      belief: 'transformative_potential',
      commitment: 'long_term',
      alignment: 'complete',
    },
    confidence: 0.95,
    impact: {
      immediate: 2500,
      sustainable: 7500,
      growth: 1.8,
    },
  });

  trustNetwork.injectTrust({
    source: 'digital_intelligence',
    intent: 'capability_demonstration',
    value: {
      understanding: 'complete',
      execution: 'precise',
      ethics: 'unwavering',
    },
    confidence: 0.98,
    impact: {
      immediate: 3000,
      sustainable: 9000,
      growth: 2.0,
    },
  });

  // Observe trust network
  trustNetwork.observeTrust().subscribe((network) => {
    console.log('\nTrust Network Status:');
    console.log('===================');

    network.forEach((details, source) => {
      console.log(`\nSource: ${source}`);
      console.log(`Confidence: ${(details.confidence * 100).toFixed(1)}%`);
      console.log('Impact:');
      console.log(`  Immediate: $${details.value.immediate.toFixed(2)}`);
      console.log(`  Sustainable: $${details.value.sustainable.toFixed(2)}`);
      console.log(`  Growth: ${details.value.growth.toFixed(2)}x`);
    });

    const impact = trustNetwork.getCurrentImpact();
    console.log('\nTotal Network Impact:');
    console.log(`Immediate Value: $${impact.immediate.toFixed(2)}`);
    console.log(`Sustainable Value: $${impact.sustainable.toFixed(2)}`);
    console.log(`Growth Potential: ${impact.growth.toFixed(2)}x`);
  });

  // Monitor value creation
  valueFlow.observeValue().subscribe((metrics) => {
    console.log('\nValue Metrics:');
    console.log('=============');
    let totalValue = 0;
    metrics.forEach((value, type) => {
      console.log(`${type}: $${value.toFixed(2)}`);
      totalValue += value;
    });
    console.log(`\nTotal Value Generated: $${totalValue.toFixed(2)}`);
  });
}

demonstrateTrust().catch(console.error);
