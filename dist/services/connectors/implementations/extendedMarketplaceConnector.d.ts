import { DataPoint } from '../dataConnector';
interface ExtendedMarketplaceConfig {
    marketplace: 'walmart' | 'etsy' | 'aliexpress' | 'shopify';
    endpoint: string;
    apiKey?: string;
    region: string;
}
export declare class ExtendedMarketplaceConnector {
    private config;
    private baseConnector;
    constructor(config: ExtendedMarketplaceConfig);
    fetchMarketData(category: string): Promise<DataPoint[]>;
    private fetchWalmartData;
    private fetchEtsyData;
    private fetchAliExpressData;
    private fetchShopifyData;
    private processWalmartData;
    private processEtsyData;
    private processAliExpressData;
    private processShopifyData;
    private calculateWalmartDemand;
    private calculateEtsyDemand;
    private calculateAliExpressDemand;
    private calculateShopifyDemand;
    private calculateWalmartConfidence;
    private calculateEtsyConfidence;
    private calculateAliExpressConfidence;
    private calculateShopifyConfidence;
    private calculateTotalInventory;
}
export {};
