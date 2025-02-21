import { LocalIntelligenceProvider } from '../services/analysis/providers/localIntelligence';
import { DemandSignal } from '../services/analysis/adapters/demandSignalAdapter';

async function testDemandSignalProcessing() {
  const intelligence = new LocalIntelligenceProvider();

  // Test signals representing different types of demand
  const testSignals: DemandSignal[] = [
    {
      id: 'test_1',
      source: 'search',
      timestamp: Date.now(),
      type: 'explicit',
      confidence: 0.8,
      context: {
        keywords: ['laptop', 'programming', 'development'],
        relatedCategories: ['electronics', 'computers'],
        sentiment: 0.7,
        urgency: 0.6,
      },
    },
    {
      id: 'test_2',
      source: 'browsing',
      timestamp: Date.now(),
      type: 'implicit',
      confidence: 0.6,
      context: {
        keywords: ['react', 'typescript', 'web development'],
        relatedCategories: ['software', 'development tools'],
        sentiment: 0.5,
        urgency: 0.3,
      },
    },
    {
      id: 'test_3',
      source: 'marketplace',
      timestamp: Date.now(),
      type: 'explicit',
      confidence: 0.9,
      context: {
        keywords: ['cloud hosting', 'aws', 'deployment'],
        relatedCategories: ['cloud services', 'hosting'],
        sentiment: 0.8,
        urgency: 0.7,
      },
    },
  ];

  console.info('Starting demand signal processing test...\n');

  for (const signal of testSignals) {
    console.info(`\nProcessing signal ${signal.id}...`);
    console.info('Input signal:', JSON.stringify(signal, null, 2));

    try {
      const processedSignal = await intelligence.processSignal(signal);
      console.info('\nProcessed signal:', JSON.stringify(processedSignal, null, 2));
    } catch (error) {
      console.error(`Error processing signal ${signal.id}:`, error);
    }

    console.info('\n-------------------\n');
  }
}

// Run the test
testDemandSignalProcessing().catch(console.error);
