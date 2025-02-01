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
export declare class AwinService {
  private readonly config;
  private readonly cache;
  private readonly retry;
  private readonly analytics;
  constructor(
    config: ConfigService,
    cache: AwinCache,
    retry: RetryStrategy,
    analytics: CacheAnalytics
  );
  getMerchants(): Promise<Merchant[]>;
  generateAffiliateLink(merchantId: string): Promise<string>;
}
