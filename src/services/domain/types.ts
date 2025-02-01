export interface DomainInfo {
  domain: string;
  status: string;
  expires: string;
}

export interface DNSRecord {
  type: 'A' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  data: string;
  ttl: number;
}

export interface DomainListingOptions {
  price: number;
  description: string;
}

export interface DomainListingResult {
  success: boolean;
  domain: string;
  message?: string;
}

export interface DomainMetrics {
  domain: string;
  traffic: number;
  backlinks: number;
  authority: number;
  resonance: number;
  niche?: string;
  competitors?: string[];
  insights?: string[];
  affiliatePrograms: string[];
  lastUpdated: Date;
  affiliateLinks: {
    fiverr: {
      marketplace: string;
      pro: string;
      logoMaker: string;
      subAffiliates: string;
    };
    awin: Record<string, string>;
  };
}
