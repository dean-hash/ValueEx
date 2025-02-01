export interface AwinProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  merchant: string;
  category: string;
  categories: string[];
  url: string;
  imageUrl?: string;
  brand?: string;
  features?: string[];
  availability?: boolean;
  rating?: number;
  reviewCount?: number;
  title: string;
}
export interface AwinSearchParams {
  searchTerm?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  merchant?: string;
  sortBy?: 'price' | 'relevance' | 'rating';
  page?: number;
  pageSize?: number;
}
