export interface Domain {
  name: string;
  registrar?: string;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'pending';
  metrics?: DomainMetrics;
}

export interface DomainMetrics {
  domain: string;
  traffic: number;
  backlinks: number;
  authority: number;
  resonance: number;
  niche: string;
  lastUpdated: Date;
  competitors?: string[];
  insights?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
}
