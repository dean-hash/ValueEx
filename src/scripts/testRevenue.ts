import { RevenueTracker } from '../services/revenue/revenueTracker';
import { FiverrAffiliateService } from '../services/affiliate/fiverrAffiliate';
import { logger } from '../utils/logger';
import { RevenueEvent } from '../services/revenue/types';

async function testRevenueComponents(): Promise<void> {
  try {
    // 1. Test Fiverr Affiliate Links
    const fiverrService = FiverrAffiliateService.getInstance();
    const links = fiverrService.getAffiliateLinks();
    logger.info('Fiverr affiliate links configured:', links);

    // 2. Test GoDaddy API Connection
    const godaddyKey = process.env.GODADDY_API_KEY;
    const godaddySecret = process.env.GODADDY_API_SECRET;
    if (!godaddyKey || !godaddySecret) {
      throw new Error('GoDaddy credentials missing');
    }

    const godaddyHeaders = {
      Authorization: `sso-key ${godaddyKey}:${godaddySecret}`,
      Accept: 'application/json',
    };

    const domainResponse = await fetch('https://api.godaddy.com/v1/domains', {
      headers: godaddyHeaders,
    });

    if (!domainResponse.ok) {
      throw new Error('GoDaddy API connection failed');
    }

    logger.info('GoDaddy API connection successful');

    // 3. Initialize Revenue Tracker
    const tracker = RevenueTracker.getInstance();
    logger.info('Revenue Tracker initialized');

    // 4. Test tracking a sample transaction
    const sampleTransaction: RevenueEvent = {
      source: 'affiliate',
      amount: 0, // No real money involved in test
      details: {
        platform: 'fiverr',
        linkType: 'marketplace',
        clickId: 'test-click-' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'click',
      },
    };

    await tracker.trackRevenue(sampleTransaction);
    logger.info('Sample transaction tracked');

    logger.info('All revenue components validated successfully');
  } catch (error) {
    logger.error('Revenue component validation failed:', error);
    throw error;
  }
}

testRevenueComponents().catch(console.error);
