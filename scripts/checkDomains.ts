import * as dotenv from 'dotenv';
import { GoDaddyConnector } from '../src/services/domain/connectors/godaddyConnector';

// Load environment variables
dotenv.config();

async function checkDomainOptions() {
  const connector = GoDaddyConnector.getInstance();

  const domainOptions = [
    'valuex.io',
    'valuex.co',
    'valuex.app',
    'valuex.dev',
    'valuex.digital',
    'valuex.market',
    'valuex.tech',
    'value-ex.com',
    'value-ex.io',
    'valueex.com',
  ];

  console.log('Checking domain availability...\n');

  // Check domains one by one since the bulk API is giving issues
  for (const domain of domainOptions) {
    try {
      const available = await connector.checkDomainAvailability(domain);
      console.log(`${domain}: ${available ? '✅ Available' : '❌ Taken'}`);
    } catch (error: any) {
      console.error(`Error checking ${domain}:`, error?.message || 'Unknown error');
    }
    // Add a small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

checkDomainOptions();
