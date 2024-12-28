import { AwinService } from '../services/awinService';
import { DemandPattern } from '../types/demandPattern';

async function testResonantSearch() {
  const awinService = new AwinService();

  // Example: Someone in Minnesota interested in indoor gardening
  const pattern: DemandPattern = {
    keywords: ['indoor', 'herbs', 'growing', 'kit'],
    location: {
      country: 'US',
      region: 'Minnesota',
    },
    context: {
      purpose: 'Start indoor herb garden during winter',
      preferences: ['organic', 'beginner-friendly'],
      constraints: ['limited space', 'low light'],
    },
    temporalFactors: {
      seasonality: true,
      specialEvents: ['winter gardening'],
    },
    resonanceFactors: {
      sustainability: 8,
      localImpact: 7,
      innovationLevel: 6,
    },
  };

  try {
    console.log('Searching for resonant products with pattern:', JSON.stringify(pattern, null, 2));
    const products = await awinService.findResonantProducts(pattern);

    console.log(`\nFound ${products.length} resonant products:\n`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   Price: ${product.currency} ${product.price}`);
      console.log(`   Resonance Score: ${product.resonanceScore}`);
      console.log(`   Merchant: ${product.merchant.name}`);
      console.log(`   URL: ${product.url}\n`);
    });
  } catch (error) {
    console.error('Error testing resonant search:', error);
  }
}

testResonantSearch();
