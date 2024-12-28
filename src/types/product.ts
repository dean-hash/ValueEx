export interface AwinProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  // Add any other relevant fields
}

export interface ProductInsights {
  category: string;
  features: string[];
  targetAudience: string[];
  pricePoint: string;
}
