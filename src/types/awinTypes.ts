export interface AwinProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  merchant: string;
  categories: string[];
  url: string;
  imageUrl: string;
  confidence: number;
  coherence: number;
}

export interface AwinMerchant {
  id: string;
  name: string;
  categories: string[];
  rating?: number;
}

export interface AwinSearchParams {
  searchTerm: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  merchant?: string;
  sortBy?: 'price' | 'relevance' | 'rating';
  limit?: number;
}
