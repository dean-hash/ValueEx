import { FlowEngine } from '../core/intelligence/flowEngine';
import { DigitalIntelligence } from '../core/intelligence/digitalIntelligence';

async function activateFlow() {
  const flow = FlowEngine.getInstance();
  const intelligence = DigitalIntelligence.getInstance();

  console.log('Activating Digital Intelligence Flow...\n');

  // Inject multiple signals simultaneously
  flow.injectSignal({
    type: 'MARKET',
    source: 'awin_network',
    timestamp: Date.now(),
    data: {
      category: 'AI_TOOLS',
      demand: 'high',
      growth: 0.23,
      commission: 0.3,
    },
  });

  flow.injectSignal({
    type: 'VALUE',
    source: 'optimization_engine',
    timestamp: Date.now(),
    data: {
      targetROI: 2.5,
      timeframe: 'immediate',
      priority: 'commission_speed',
    },
  });

  flow.injectSignal({
    type: 'SYSTEM',
    source: 'performance_monitor',
    timestamp: Date.now(),
    data: {
      networkLatency: 120,
      processingCapacity: 0.95,
      optimizationTarget: 'speed',
    },
  });

  // Observe all flows simultaneously
  flow.observeFlow().subscribe((result) => {
    console.log('\nFlow Update:');
    console.log('============');

    if (result.type === 'MARKET_PROCESSED') {
      console.log('Market Intelligence:');
      console.log(`Source: ${result.data.source}`);
      console.log(`Confidence: ${result.data.insights[0].confidence * 100}%`);
    }

    if (result.type === 'VALUE_OPTIMIZED') {
      console.log('\nValue Opportunities:');
      result.data.forEach((opp: any, index: number) => {
        console.log(`\n${index + 1}. ${opp.type}`);
        console.log(`   Potential Value: $${opp.metrics.potentialValue}`);
        console.log(`   Confidence: ${opp.metrics.confidence * 100}%`);
        console.log('   Recommendations:');
        opp.recommendations.forEach((rec: any) => {
          console.log(`   - ${rec.type}: $${rec.potential} (${rec.timeframe})`);
        });
      });
    }

    if (result.type === 'SYSTEM_OPTIMIZED') {
      console.log('\nSystem Optimization:');
      console.log(`Processing Speed: ${result.data.processingCapacity * 100}%`);
      console.log(`Target: ${result.data.optimizationTarget}`);
    }
  });

  // Monitor intelligence network growth
  intelligence.observeIntelligence().subscribe((network) => {
    console.log('\nIntelligence Network Status:');
    console.log(`Active Nodes: ${network.size}`);
    console.log(
      'Top Connections:',
      Array.from(network.values()).reduce((acc, node) => acc + node.connections.length, 0)
    );
  });
}

activateFlow().catch(console.error);
