// Ensure MVPProduct is correctly exported from mvpProduct.ts
export interface ProductOpportunity {
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
