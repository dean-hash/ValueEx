import 'dotenv/config';
import { GoDaddyConnector } from '../services/domain/connectors/godaddyConnector';
import axios from 'axios';
import { logger } from '../utils/logger';

interface DomainOpportunity {
  domain: string;
  quickSaleValue: number;
  affiliateValue: number;
  businessValue: number;
  recommendedPath: string;
  rationale: string;
}

async function getDomainMarketValue(domain: string): Promise<number> {
  try {
    // Use GoDaddy's aftermarket API to get real market data
    const response = await axios.get(`https://api.godaddy.com/v1/aftermarket/valuation/${domain}`, {
      headers: {
        Authorization: `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_API_SECRET}`,
      },
    });
    return response.data.price || 0;
  } catch (error) {
    logger.error('Error getting domain market value', error);
    // Fallback to estimation based on domain characteristics
    const tld = domain.split('.').pop() || '';
    const length = domain.split('.')[0].length;

    let baseValue = 100;

    // Premium TLD multipliers
    const tldMultipliers: Record<string, number> = {
      ai: 50, // AI domains are extremely hot right now
      com: 10, // Standard commercial premium
      io: 15, // Tech premium
      app: 12, // App premium
      tech: 8, // Tech premium
    };

    if (tld in tldMultipliers) {
      baseValue *= tldMultipliers[tld];
    }

    // Short domains are more valuable
    if (length <= 5) baseValue *= 3;
    if (length <= 3) baseValue *= 5;

    return baseValue;
  }
}

async function analyzeMarketOpportunities() {
  const connector = GoDaddyConnector.getInstance();
  const domains = await connector.listDomains();
  const activeDomains = domains.filter((d) => d.status === 'ACTIVE');

  console.log('\nAnalyzing Market Opportunities...');
  console.log('==============================');

  const opportunities: DomainOpportunity[] = [];

  for (const domain of activeDomains) {
    const marketValue = await getDomainMarketValue(domain.domain);
    const tld = domain.domain.split('.').pop();
    const name = domain.domain.split('.')[0];

    const opportunity: DomainOpportunity = {
      domain: domain.domain,
      quickSaleValue: marketValue * 0.7, // Quick sale discount
      affiliateValue: 0,
      businessValue: 0,
      recommendedPath: '',
      rationale: '',
    };

    // Analyze affiliate potential
    if (name.includes('tech') || tld === 'tech' || tld === 'ai') {
      opportunity.affiliateValue = 200; // Monthly potential through tech/AI affiliate programs
      opportunity.businessValue = 500; // Monthly potential as a tech business
    } else if (name.includes('divvy')) {
      opportunity.affiliateValue = 300; // Fintech affiliates pay well
      opportunity.businessValue = 1000; // Fintech business potential
    } else if (name.includes('clean') || name.includes('corona')) {
      opportunity.affiliateValue = 150; // Health/cleaning product affiliates
      opportunity.businessValue = 400; // Health tech business
    }

    // Determine best path
    const values = [
      { type: 'Quick Sale', value: opportunity.quickSaleValue },
      { type: 'Affiliate Marketing', value: opportunity.affiliateValue * 12 }, // Annual value
      { type: 'Business Development', value: opportunity.businessValue * 12 }, // Annual value
    ];

    const bestPath = values.reduce((a, b) => (a.value > b.value ? a : b));

    opportunity.recommendedPath = bestPath.type;
    opportunity.rationale = `${bestPath.type} offers the highest potential value at $${bestPath.value.toFixed(2)}${bestPath.type !== 'Quick Sale' ? '/year' : ''}. `;

    if (bestPath.type === 'Quick Sale') {
      opportunity.rationale += `Domain has immediate market value due to ${tld === 'ai' ? 'AI premium' : 'strong characteristics'}.`;
    } else if (bestPath.type === 'Affiliate Marketing') {
      opportunity.rationale += `Strong affiliate potential in ${name.includes('divvy') ? 'fintech' : 'tech/AI'} space.`;
    } else {
      opportunity.rationale += `High business potential due to ${tld === 'ai' ? 'AI industry growth' : 'market demand'}.`;
    }

    opportunities.push(opportunity);
  }

  // Sort by highest potential value (using annual values for comparison)
  opportunities.sort((a, b) => {
    const getAnnualValue = (opp: DomainOpportunity) => {
      if (opp.recommendedPath === 'Quick Sale') return opp.quickSaleValue;
      return Math.max(opp.affiliateValue, opp.businessValue) * 12;
    };
    return getAnnualValue(b) - getAnnualValue(a);
  });

  // Output results
  console.log('\nTop Revenue Opportunities:');
  console.log('========================');

  opportunities.forEach((opp, index) => {
    if (index < 10) {
      // Show top 10
      console.log(`\n${index + 1}. ${opp.domain}`);
      console.log(`   Recommended Strategy: ${opp.recommendedPath}`);
      console.log(`   Quick Sale Value: $${opp.quickSaleValue.toFixed(2)}`);
      if (opp.affiliateValue > 0) {
        console.log(`   Monthly Affiliate Potential: $${opp.affiliateValue.toFixed(2)}`);
      }
      if (opp.businessValue > 0) {
        console.log(`   Monthly Business Potential: $${opp.businessValue.toFixed(2)}`);
      }
      console.log(`   Rationale: ${opp.rationale}`);
    }
  });

  // Summary statistics
  const totalQuickSale = opportunities.reduce((sum, opp) => sum + opp.quickSaleValue, 0);
  const monthlyAffiliateTotal = opportunities.reduce((sum, opp) => sum + opp.affiliateValue, 0);
  const monthlyBusinessTotal = opportunities.reduce((sum, opp) => sum + opp.businessValue, 0);

  console.log('\nPortfolio Summary:');
  console.log('=================');
  console.log(`Total Quick Sale Value: $${totalQuickSale.toFixed(2)}`);
  console.log(`Total Monthly Affiliate Potential: $${monthlyAffiliateTotal.toFixed(2)}`);
  console.log(`Total Monthly Business Potential: $${monthlyBusinessTotal.toFixed(2)}`);
}

analyzeMarketOpportunities();
