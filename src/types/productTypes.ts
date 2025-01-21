export interface Price {
  amount: number;
  currency: string;
}

export interface Merchant {
  id: string;
  name: string;
  category?: string;
}

export interface ResonanceMetrics {
  harmony: number;
  impact: number;
  sustainability: number;
  innovation: number;
  localRelevance: number;
}

export interface ProductSpecification {
  name: string;
  value: string | number;
  unit?: string;
  category?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: Price;
  merchant: Merchant;
  url: string;
  imageUrl?: string;
  brand?: string;
  ean?: string;
  specifications?: ProductSpecification[];
  resonanceScore?: number;
  resonanceMetrics?: ResonanceMetrics;
}
