import axios from 'axios';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { AwinClient } from './services/affiliate/awinClient';
import { JasperClient } from './services/affiliate/jasperClient';
import { RevenueTracker } from './services/affiliate/revenueTracker';
import { TeamsNotifier } from './services/teams/teamsNotifier';
import { DynamicsClient, DynamicsOpportunity } from './services/dynamics/dynamicsClient';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

dotenv.config();

// Real, working Fiverr affiliate links from MEMORY
const FIVERR_LINKS = {
  marketplace: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiverrmktplace',
  pro: 'https://go.fiverr.com/visit/?bta=1064652&brand=fp',
  logomaker: 'https://go.fiverr.com/visit/?bta=1064652&brand=logomaker',
};

// Real GoDaddy credentials from MEMORY
const GODADDY = {
  API_KEY: 'YvFt7v3Y1X_YHYvN-jTbpcrGYN-dwyR',
  API_SECRET: 'QwzQzWrRZzwKmLGvqwbP',
};

export interface DomainListing {
  domain: string;
  price: number;
  lastChecked: string;
}

export interface RevenueMetrics {
  revenue: number;
  newTransactions: number;
  clicks: number;
  conversionRate: number;
}

export type TransactionStatus = 'approved' | 'pending' | 'declined';

export interface Transaction {
  id: string;
  programId: string;
  amount: number;
  status: TransactionStatus;
  timestamp: string;
}

interface RevenueTracker {
  trackTransaction(transaction: Transaction): Promise<void>;
  getMetrics(): Promise<RevenueMetrics>;
  trackAffiliateLinks(links: string[]): Promise<void>;
}

export class RevenueGenerator {
  private domainListings: DomainListing[] = [];
  private readonly dataFile = join(__dirname, '../data/domains.json');
  private awinClient: AwinClient;
  private jasperClient: JasperClient;
  private revenueTracker: RevenueTracker;
  private teamsNotifier: TeamsNotifier;
  private dynamicsClient: DynamicsClient;

  constructor() {
    this.loadDomains();
    this.awinClient = new AwinClient(
      process.env.AWIN_API_KEY || '',
      process.env.AWIN_PUBLISHER_ID || ''
    );
    this.jasperClient = new JasperClient(
      process.env.JASPER_API_KEY || '',
      process.env.JASPER_AFFILIATE_ID || ''
    );
    this.revenueTracker = new RevenueTracker();
    this.teamsNotifier = new TeamsNotifier();
    this.dynamicsClient = new DynamicsClient();
  }

  private async loadDomains(): Promise<void> {
    try {
      const data = readFileSync(this.dataFile, 'utf-8');
      this.domainListings = JSON.parse(data);
    } catch (error) {
      logger.error('Failed to load domains:', error);
      this.domainListings = [];
    }
  }

  private saveDomains(): void {
    try {
      writeFileSync(this.dataFile, JSON.stringify(this.domainListings, null, 2));
    } catch (error) {
      logger.error('Failed to save domains:', error);
    }
  }

  private async findDomainDeals(): Promise<DomainListing[]> {
    const deals: DomainListing[] = [];
    try {
      const response = await axios.get('https://api.godaddy.com/v1/domains/available', {
        headers: {
          Authorization: `sso-key ${GODADDY.API_KEY}:${GODADDY.API_SECRET}`,
          'Content-Type': 'application/json',
        },
        params: {
          limit: 10,
          checkType: 'FAST',
        },
      });

      if (response.data.domains) {
        const domains = response.data.domains;
        for (const domain of domains) {
          if (domain.available && domain.price < 1000) {
            deals.push({
              domain: domain.domain,
              price: domain.price,
              lastChecked: new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to find domain deals:', error);
    }
    return deals;
  }

  public async start(): Promise<void> {
    logger.info('Starting revenue generation...');

    // Initialize revenue tracking
    await this.revenueTracker.init();

    // Start commission tracking
    this.trackAwinCommissions();
    this.trackJasperCommissions();

    // Find domain deals every hour
    setInterval(async () => {
      const deals = await this.findDomainDeals();
      if (deals.length > 0) {
        logger.info('New domain opportunities:', deals);
        await this.teamsNotifier.sendAlert(
          'New Domain Opportunities',
          `Found ${deals.length} new domain opportunities. Check revenue dashboard for details.`
        );

        // Create opportunities in Dynamics 365
        await this.createDomainOpportunities(deals);
      }
    }, 3600000);

    // Generate and track affiliate links
    await this.generateAndTrackAffiliateLinks();

    // Monitor revenue metrics every 15 minutes
    setInterval(async () => {
      const metrics = await this.revenueTracker.getMetrics();
      if (metrics.newTransactions > 0) {
        await this.teamsNotifier.sendAlert(
          'New Revenue',
          `Generated $${metrics.revenue.toFixed(2)} from ${metrics.newTransactions} transactions in the last period.`
        );

        // Update revenue in Dynamics 365
        await this.updateRevenueInDynamics(metrics);
      }
    }, 900000);
  }

  private async trackAwinCommissions(): Promise<void> {
    try {
      const transactions = await this.awinClient.getTransactions();
      for (const transaction of transactions) {
        await this.revenueTracker.trackTransaction({
          id: transaction.id,
          programId: 'awin',
          amount: transaction.commission,
          status: transaction.status as TransactionStatus,
          timestamp: transaction.date,
        });
      }
    } catch (error) {
      logger.error('Failed to track Awin commissions:', error);
    }
  }

  private async trackJasperCommissions(): Promise<void> {
    try {
      const transactions = await this.jasperClient.getTransactions();
      for (const transaction of transactions) {
        await this.revenueTracker.trackTransaction({
          id: transaction.id,
          programId: 'jasper',
          amount: transaction.commission,
          status: transaction.status as TransactionStatus,
          timestamp: transaction.createdAt,
        });
      }
    } catch (error) {
      logger.error('Failed to track Jasper commissions:', error);
    }
  }

  private async generateAndTrackAffiliateLinks(): Promise<void> {
    try {
      // Track Fiverr links
      const webDevLinks = this.generateAffiliateLinks('web development');
      const aiLinks = this.generateAffiliateLinks('ai development');
      const designLinks = this.generateAffiliateLinks('design');

      // Track Jasper links
      const jasperLinks = [
        await this.jasperClient.getAffiliateLink(),
        await this.jasperClient.getAffiliateLink('starter'),
        await this.jasperClient.getAffiliateLink('business'),
        await this.jasperClient.getAffiliateLink('enterprise'),
      ];

      await this.revenueTracker.trackAffiliateLinks([
        ...Object.values(webDevLinks),
        ...Object.values(aiLinks),
        ...Object.values(designLinks),
        ...jasperLinks,
      ]);

      // Track Awin program links
      const awinLinks = await this.awinClient.getProgramLinks();
      await this.revenueTracker.trackAffiliateLinks(awinLinks);

      logger.info('Active affiliate links:', {
        fiverr: { webDev: webDevLinks, ai: aiLinks, design: designLinks },
        jasper: jasperLinks,
        awin: awinLinks,
      });
    } catch (error) {
      logger.error('Failed to generate and track affiliate links:', error);
    }
  }

  private generateAffiliateLinks(keyword: string): { [key: string]: string } {
    const encodedKeyword = encodeURIComponent(keyword);
    return {
      marketplace: `${FIVERR_LINKS.marketplace}&search_query=${encodedKeyword}`,
      pro: `${FIVERR_LINKS.pro}&search_query=${encodedKeyword}`,
      logomaker: FIVERR_LINKS.logomaker,
    };
  }

  private async createDomainOpportunities(deals: DomainListing[]): Promise<void> {
    try {
      for (const deal of deals) {
        const opportunity: DynamicsOpportunity = {
          name: `Domain Opportunity: ${deal.domain}`,
          description: `Domain available for purchase: ${deal.domain}`,
          estimatedvalue: deal.price,
          closeprobability: 60,
          statuscode: 1, // New
        };

        await this.dynamicsClient.createOpportunity(opportunity);
      }
    } catch (error) {
      logger.error('Failed to create domain opportunities in Dynamics:', error);
    }
  }

  private async updateRevenueInDynamics(metrics: RevenueMetrics): Promise<void> {
    try {
      // Get all affiliate contacts
      const awinContact = await this.dynamicsClient.getContactByAffiliateId(
        process.env.AWIN_PUBLISHER_ID || ''
      );
      const jasperContact = await this.dynamicsClient.getContactByAffiliateId(
        process.env.JASPER_AFFILIATE_ID || ''
      );

      // Update revenue for each affiliate program
      if (awinContact?.contactid) {
        await this.dynamicsClient.updateContact(awinContact.contactid, {
          revenue: (awinContact.revenue || 0) + metrics.revenue,
        });
      }

      if (jasperContact?.contactid) {
        await this.dynamicsClient.updateContact(jasperContact.contactid, {
          revenue: (jasperContact.revenue || 0) + metrics.revenue,
        });
      }
    } catch (error) {
      logger.error('Failed to update revenue in Dynamics:', error);
    }
  }
}

// Start generating revenue
const generator = new RevenueGenerator();
generator.start().catch(console.error);
