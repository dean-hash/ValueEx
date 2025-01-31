import { logger } from '../../utils/logger';
import axios from 'axios';
import { RevenueEvent } from '../revenue/types';
import { RevenueVerifier } from '../verification/revenueVerifier';

interface AffiliateNetwork {
  name: string;
  apiEndpoint: string;
  trackingLinks: Map<string, string>;
  active: boolean;
}

export class AffiliateManager {
  private static instance: AffiliateManager;
  private networks: Map<string, AffiliateNetwork>;
  private verifier: RevenueVerifier;
  private activeConversions: Map<string, RevenueEvent>;

  private constructor() {
    this.networks = new Map();
    this.verifier = RevenueVerifier.getInstance();
    this.activeConversions = new Map();
    this.initializeNetworks();
  }

  public static getInstance(): AffiliateManager {
    if (!AffiliateManager.instance) {
      AffiliateManager.instance = new AffiliateManager();
    }
    return AffiliateManager.instance;
  }

  private initializeNetworks(): void {
    // Fiverr Network
    this.networks.set('fiverr', {
      name: 'Fiverr',
      apiEndpoint: 'https://affiliates.fiverr.com/api/v2',
      trackingLinks: new Map([
        ['marketplace', 'https://go.fiverr.com/visit/?bta=1064652&brand=fiverrmktplace'],
        ['pro', 'https://go.fiverr.com/visit/?bta=1064652&brand=fp'],
        ['logomaker', 'https://go.fiverr.com/visit/?bta=1064652&brand=logomaker'],
      ]),
      active: true,
    });

    // Jasper AI Network
    this.networks.set('jasper', {
      name: 'Jasper AI',
      apiEndpoint: 'https://api.jasper.ai/affiliates',
      trackingLinks: new Map([
        ['standard', 'https://jasper.ai/?fpr=valueex'],
        ['enterprise', 'https://jasper.ai/enterprise?fpr=valueex'],
      ]),
      active: true,
    });

    // Midjourney Network
    this.networks.set('midjourney', {
      name: 'Midjourney',
      apiEndpoint: 'https://api.midjourney.com/affiliates',
      trackingLinks: new Map([
        ['basic', 'https://midjourney.com/account/?ref=valueex'],
        ['pro', 'https://midjourney.com/pro/?ref=valueex'],
      ]),
      active: true,
    });

    // Anthropic Network
    this.networks.set('anthropic', {
      name: 'Anthropic',
      apiEndpoint: 'https://api.anthropic.com/v1/affiliate',
      trackingLinks: new Map([
        ['claude', 'https://anthropic.ai/claude?ref=valueex'],
        ['api', 'https://anthropic.ai/api?ref=valueex'],
      ]),
      active: true,
    });
  }

  public async trackConversion(networkId: string, data: any): Promise<void> {
    const network = this.networks.get(networkId);
    if (!network) {
      logger.error('Unknown affiliate network:', networkId);
      return;
    }

    try {
      // Verify conversion with network's API
      const response = await axios.post(`${network.apiEndpoint}/conversions/verify`, data);

      if (response.data.verified) {
        const event: RevenueEvent = {
          source: 'affiliate',
          amount: response.data.commission,
          details: {
            platform: networkId,
            product: data.product,
            commission: response.data.commission,
            timestamp: new Date().toISOString(),
          },
        };

        // Verify through blockchain
        const isVerified = await this.verifier.verifyTransaction(event);
        if (isVerified) {
          this.activeConversions.set(response.data.conversionId, event);
          logger.info('Verified conversion:', event);
        }
      }
    } catch (error) {
      logger.error('Failed to track conversion:', error);
    }
  }

  public getActiveNetworks(): string[] {
    return Array.from(this.networks.entries())
      .filter(([_, network]) => network.active)
      .map(([id, _]) => id);
  }

  public getTrackingLink(networkId: string, product: string): string | null {
    const network = this.networks.get(networkId);
    return network?.trackingLinks.get(product) || null;
  }

  public async getNetworkStats(networkId: string): Promise<any> {
    const network = this.networks.get(networkId);
    if (!network) {
      return null;
    }

    try {
      const response = await axios.get(`${network.apiEndpoint}/stats`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get network stats:', error);
      return null;
    }
  }
}
