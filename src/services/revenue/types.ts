export interface RevenueEvent {
  source: 'affiliate' | 'domain' | 'consultation' | 'community';
  amount: number;
  details: {
    platform?: string;
    product?: string;
    commission?: number;
    action?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

export interface DomainInfo {
  name: string;
  registrar: string;
  expiryDate: string;
  purchasePrice?: number;
  currentValue?: number;
  status: 'active' | 'pending' | 'expired';
}

export interface RevenueMetrics {
  quickSaleRevenue: number;
  affiliateRevenue: number;
  totalRevenue: number;
  lastUpdated: string;
}

export interface AffiliateOpportunity {
  provider: string;
  link: string;
  expectedCommission: number;
  needId: string;
  status: 'active' | 'pending' | 'completed';
}
