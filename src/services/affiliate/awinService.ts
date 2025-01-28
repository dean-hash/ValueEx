import { ConfigService } from '../../config/configService';
import { AwinCache } from '../../cache/awinCache';
import { RetryStrategy } from '../../utils/retryStrategy';
import { CacheAnalytics } from '../../analytics/cacheAnalytics';

export interface Merchant {
  name: string;
  networkId: string;
  merchantId: string;
  categories: string[];
  averageCommission: number;
  conversionRate: number;
  validationStatus: string;
  performance?: {
    reliability: number;
  };
  services?: Array<{
    name: string;
    value: number;
  }>;
  commissionStructure: {
    base: number;
    notes?: string;
  };
  status: 'active' | 'pending' | 'target';
  notes: string;
}

export class AwinService {
  constructor(
    private readonly config: ConfigService,
    private readonly cache: AwinCache,
    private readonly retry: RetryStrategy,
    private readonly analytics: CacheAnalytics
  ) {
    // Verify getAwinApiKey exists in ConfigService
    if (!('getAwinApiKey' in this.config)) {
      throw new Error('ConfigService must have a getAwinApiKey method');
    }
  }

  async getMerchants(): Promise<Merchant[]> {
    // Implement real data fetching logic here
    const merchants: Merchant[] = await this.fetchMerchantsFromAPI();
    return merchants;
  }

  async generateAffiliateLink(merchantId: string): Promise<string> {
    // In real implementation, this would call Awin's API
    return `https://www.awin1.com/cread.php?merchantId=${merchantId}&platform=dl`;
  }

  private async fetchMerchantsFromAPI(): Promise<Merchant[]> {
    try {
      const response = await fetch('https://api.awin.com/merchants', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.getAwinApiKey()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch merchants: ${response.statusText}`);
      }

      const merchants: Merchant[] = await response.json();
      return merchants;
    } catch (error) {
      console.error('Error fetching merchants:', error);
      return [];
    }
  }
}
