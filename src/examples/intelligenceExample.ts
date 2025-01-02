import { IntelligenceCoordinator } from '../services/analysis/intelligenceCoordinator';
import { DemandSignal } from '../services/analysis/adapters/demandSignalAdapter';

async function demonstrateIntelligenceSystem() {
  const coordinator = IntelligenceCoordinator.getInstance();

  // Create a sample demand signal
  const signal: DemandSignal = {
    category: 'electronics',
    region: 'north_america',
    timestamp: new Date().toISOString(),
    strength: 0.85,
    type: 'search',
    context: {
      keywords: ['smartphone', '5G', 'battery life'],
      relatedCategories: ['mobile_accessories'],
      sentiment: 0.75
    }
  };

  console.log('Processing signal through intelligence providers...');
  
  // Process through all relevant providers
  const enrichedSignal = await coordinator.processSignal(signal, 'demand');
  console.log('Enriched signal:', JSON.stringify(enrichedSignal, null, 2));

  // Monitor system resources
  coordinator.on('system_health', (data) => {
    console.log('System health update:', data);
  });

  coordinator.on('system_optimization', (data) => {
    console.log('Optimization suggestion:', data);
  });

  // Optimize system if needed
  await coordinator.optimizeSystem();
}

// Run the demonstration
demonstrateIntelligenceSystem().catch(console.error);
