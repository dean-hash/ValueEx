export interface MVPProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  affiliateUrl: string;
  commission: number;
  confidence: number;
  vertical: string;
  tags: string[];
  source: 'awin' | 'manual';
  status: string;
}
