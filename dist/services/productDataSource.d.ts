import { AwinProduct } from '../types/awinTypes';
export interface ScrapedProduct {
    title: string;
    price: number;
    currency: string;
    description: string;
    merchant: {
        name: string;
        id: string;
    };
    categories: string[];
    url: string;
    imageUrl: string;
}
export declare class ProductDataSource {
    private static readonly AMAZON_SELECTOR;
    private static readonly EBAY_SELECTOR;
    getProductData(url: string): Promise<ScrapedProduct>;
    private scrapeProductData;
    convertToAwinProduct(scraped: ScrapedProduct): AwinProduct;
}
