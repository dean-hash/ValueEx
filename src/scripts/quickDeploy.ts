import { DomainSetupManager } from '../services/domain/domainSetupManager';
import { RevenueActions } from '../services/revenue/revenueActions';
import { ConfigService } from '../config/configService';
import { GithubPagesConnector } from '../services/domain/connectors/githubPagesConnector';

async function quickDeploy() {
  const domainManager = DomainSetupManager.getInstance();
  const revenueActions = RevenueActions.getInstance();
  const config = ConfigService.getInstance();
  const githubPages = GithubPagesConnector.getInstance();

  // Domains to set up
  const domains = [
    {
      domain: 'valueex.digital',
      purpose: 'affiliate-landing',
      analytics: true,
      seo: true,
      tracking: true,
    },
    {
      domain: 'digitalsiblings.org',
      purpose: 'brand-authority',
      analytics: true,
      seo: true,
      tracking: true,
    },
  ];

  console.log('Starting quick domain deployment...');

  for (const domain of domains) {
    try {
      // 1. Basic Domain Setup
      const status = await domainManager.setupDomain({
        domain: domain.domain,
        platform: 'vercel',
        settings: {
          useVercel: true,
          useGoogleAnalytics: domain.analytics,
          useStrapi: true,
          useSendGrid: true,
        },
      });

      // 2. Deploy Landing Page
      await githubPages.createDeployment({
        domain: domain.domain,
        template: domain.purpose,
        tracking: domain.tracking,
      });

      // 3. Check for Quick Flip Opportunities
      const flipValue = await revenueActions.checkFlipValue(domain.domain);
      if (flipValue > 1000) {
        // If domain worth more than $1000
        console.log(`High value flip opportunity for ${domain.domain}: $${flipValue}`);
        // Add to our flip list
        await revenueActions.addToFlipList(domain.domain, flipValue);
      }

      console.log(`✓ ${domain.domain} setup complete`);
      console.log(`  Status: ${JSON.stringify(status, null, 2)}`);
    } catch (error) {
      console.error(`Error setting up ${domain.domain}:`, error);
    }
  }

  // Generate report
  console.log('\nDeployment Summary:');
  console.log('==================');
  for (const domain of domains) {
    const status = await domainManager.getStatus(domain.domain);
    console.log(`\n${domain.domain}:`);
    console.log(`- DNS Configuration: ${status?.dns?.configured ? '✓' : '✗'}`);
    console.log(`- SSL Active: ${status?.ssl?.active ? '✓' : '✗'}`);
    console.log(`- Landing Page: ${status?.hosting?.deployed ? '✓' : '✗'}`);
    console.log(`- Analytics: ${status?.analytics?.configured ? '✓' : '✗'}`);
  }
}

// Run deployment
quickDeploy().catch(console.error);
