import { DemandInsights } from '../insights/DemandInsights';
import { MetricsCollector } from '../metrics/MetricsCollector';
import { LandingPageGenerator } from './landingPageGenerator';
import * as fs from 'fs/promises';
import * as path from 'path';

async function generateAllPages() {
  const metricsCollector = MetricsCollector.getInstance();
  const demandInsights = DemandInsights.getInstance(metricsCollector);
  const generator = new LandingPageGenerator(demandInsights);
  
  const categories = ['marketplace', 'pro', 'logoMaker'];
  const outputDir = path.join(__dirname, '../../public/landing');
  
  // Create output directory if it doesn't exist
  await fs.mkdir(outputDir, { recursive: true });
  
  for (const category of categories) {
    console.log(`Generating landing page for ${category}...`);
    const content = await generator.generateOptimizedPage(category);
    
    const outputPath = path.join(outputDir, `${category}.html`);
    await fs.writeFile(outputPath, content);
    
    console.log(`Created ${outputPath}`);
  }
  
  console.log('All landing pages generated successfully!');
}

// Run the generator
generateAllPages().catch(console.error);
