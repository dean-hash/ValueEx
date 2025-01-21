import 'dotenv/config';
import { GoDaddyConnector } from '../services/domain/connectors/godaddyConnector';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

async function setupDomainSales() {
  const connector = GoDaddyConnector.getInstance();

  try {
    // Get list of owned domains
    console.log('\nFetching owned domains...');
    const ownedDomains = await connector.getDomains();
    console.log('Owned domains:', ownedDomains);

    // Prepare landing page files
    const landingPath = path.join(process.cwd(), 'src', 'landing', 'alerion');
    if (!fs.existsSync(landingPath)) {
      fs.mkdirSync(landingPath, { recursive: true });
    }

    logger.info('Landing page files prepared');

    // List domains for sale
    const domains = [
      {
        domain: 'alerion.ai',
        price: 3500,
        description: 'Premium AI domain, perfect for AI/ML startups',
      },
      {
        domain: 'divvy.city',
        price: 1200,
        description: 'Premium city-focused fintech domain',
      },
      {
        domain: 'divvy.earth',
        price: 1500,
        description: 'Global fintech/sustainability domain',
      },
      {
        domain: 'divvy.news',
        price: 900,
        description: 'Perfect for financial news/media',
      },
      {
        domain: 'divvy.one',
        price: 2000,
        description: 'Premium short domain for fintech platform',
      },
      {
        domain: 'divvy.zone',
        price: 800,
        description: 'Ideal for fintech community platform',
      },
    ];

    console.log('\nListing Domains for Sale:');
    console.log('========================');

    for (const domain of domains) {
      if (!ownedDomains.includes(domain.domain)) {
        console.log(`⚠ Skipping ${domain.domain} - not owned`);
        continue;
      }

      try {
        await connector.listDomainForSale(domain.domain, {
          price: domain.price,
          description: domain.description,
        });
        console.log(`✓ Listed ${domain.domain} for $${domain.price}`);
      } catch (error: any) {
        console.error(`✗ Failed to list ${domain.domain}:`, error?.message || 'Unknown error');
      }
    }

    console.log('\nNext Steps:');
    console.log('1. Set up GitHub Pages repository');
    console.log('2. Configure GitHub Pages DNS settings');
    console.log('3. Monitor domain sale listings');
  } catch (error) {
    logger.error('Error in setup:', error);
    throw error;
  }
}

setupDomainSales();
