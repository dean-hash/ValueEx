export interface MarketVertical {
    id: string;
    name: string;
    characteristics: {
        purchaseCycle: 'impulse' | 'considered' | 'strategic';
        priceElasticity: number;
        seasonality: number;
        techDependency: number;
    };
    keyMetrics: {
        avgMargin: number;
        customerLifetime: number;
        acquisitionCost: number;
        repeatPurchaseRate: number;
    };
    competitiveFactors: {
        entryBarriers: number;
        substituteThreat: number;
        supplierPower: number;
        buyerPower: number;
    };
}
export interface MarketData {
    category: string;
    totalProducts: number;
    averagePrice: number;
    metadata: {
        trendingProducts: Array<{
            id: string;
            name: string;
            price: number;
            salesRank: number;
        }>;
        minPrice?: number;
        maxPrice?: number;
        timestamp: string;
        status: string;
        averageRating?: number;
    };
}
export interface ProductData {
    id: string;
    name: string;
    price: number;
    metadata: {
        description: string;
        salesRank: number;
        reviewCount: number;
        averageRating: number;
        timestamp: string;
        status: string;
    };
}
export interface PriceData {
    timestamp: string;
    price: number;
    metadata: {
        available: boolean;
        productId: string;
    };
}
export declare const MARKET_VERTICALS: Record<string, MarketVertical>;
