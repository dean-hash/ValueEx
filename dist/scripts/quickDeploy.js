"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const domainSetupManager_1 = require("../services/domain/domainSetupManager");
const revenueActions_1 = require("../services/revenue/revenueActions");
const configService_1 = require("../config/configService");
const githubPagesConnector_1 = require("../services/domain/connectors/githubPagesConnector");
async function quickDeploy() {
    const domainManager = domainSetupManager_1.DomainSetupManager.getInstance();
    const revenueActions = revenueActions_1.RevenueActions.getInstance();
    const config = configService_1.ConfigService.getInstance();
    const githubPages = githubPagesConnector_1.GithubPagesConnector.getInstance();
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
        }
        catch (error) {
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
//# sourceMappingURL=quickDeploy.js.map