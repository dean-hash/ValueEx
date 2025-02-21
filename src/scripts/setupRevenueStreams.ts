import 'dotenv/config';
import { AffiliateManager } from '../services/affiliateManager';
import { GoDaddyConnector } from '../services/domain/connectors/godaddyConnector';
import { logger } from '../utils/logger';
import axios from 'axios';

async function setupDomainSales() {
  console.log('\nSetting up Domain Sales...');
  console.log('========================');

  const connector = GoDaddyConnector.getInstance();
  const domains = await connector.listDomains();

  // Premium domains for immediate sale
  const premiumDomains = [
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
    {
      domain: 'buydivvy.com',
      price: 700,
      description: 'Perfect for fintech/payment splitting services',
    },
  ];

  // Explicitly exclude divvytech.com
  const excludedDomains = ['divvytech.com'];

  for (const domain of premiumDomains) {
    if (!excludedDomains.includes(domain.domain)) {
      try {
        // List on GoDaddy Auction
        await connector.listDomainForSale(domain.domain, {
          price: domain.price,
          description: domain.description,
        });

        console.log(`Listed ${domain.domain} for sale at $${domain.price}`);
      } catch (error) {
        logger.error(`Failed to list ${domain.domain}`, error);
      }
    }
  }
}

async function setupAffiliateLinks() {
  console.log('\nSetting up Affiliate Programs...');
  console.log('==============================');

  const affiliateManager = AffiliateManager.getInstance();

  // Set up high-commission AI tool affiliates
  const programs = await affiliateManager.getActivePrograms();

  for (const program of programs) {
    try {
      const link = await affiliateManager.generateAffiliateLink(program.baseUrl, program.name);

      console.log(`Generated affiliate link for ${program.name}:`);
      console.log(`  Base URL: ${program.baseUrl}`);
      console.log(`  Commission: ${program.commission * 100}%`);
      console.log(`  Category: ${program.category}`);
      console.log(`  Affiliate URL: ${link.affiliateUrl}\n`);
    } catch (error) {
      logger.error(`Failed to set up ${program.name} affiliate`, error);
    }
  }

  const stats = await affiliateManager.getRevenueStats();
  console.log('Potential Monthly Revenue:');
  console.log(`  Affiliate Income: $${stats.projectedRevenue.toFixed(2)}`);
}

async function main() {
  try {
    // 1. Set up domain sales
    await setupDomainSales();

    // 2. Set up affiliate programs
    await setupAffiliateLinks();

    console.log('\nNext Steps:');
    console.log('1. Complete affiliate program registrations (2-3 days for approval)');
    console.log('2. Monitor domain sale listings and adjust prices if needed');
    console.log('3. Create landing pages for affiliate products');
  } catch (error) {
    logger.error('Error in revenue setup', error);
  }
}

main();
