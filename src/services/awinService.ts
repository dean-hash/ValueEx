/**
 * AWIN API Integration Status:
 * 
 * Working Endpoints:
 * - GET /publishers/{publisherId}/programmes
 *   Successfully fetches joined merchant programs
 * 
 * Known Issues:
 * - Product Search (404 Error):
 *   Attempted: GET /publishers/{publisherId}/product-search
 *   Status: Not working as of 2024-12-15
 *   Tried:
 *   1. Different endpoint variations (/products/search, /product-search)
 *   2. Verified API token and publisher ID
 *   3. Checked authorization headers
 *   
 * Next Steps:
 * 1. Verify product search endpoint in latest API documentation
 * 2. Check if additional permissions are needed for product access
 * 3. Consider reaching out to AWIN support for endpoint clarification
 */

import axios from 'axios';
import { config } from '../config';
import { ResonanceField } from './resonanceField';
import { DemandPattern } from '../types/demandPattern';
import { AwinProduct, AwinSearchParams } from '../types/awinTypes';
import { ProductDataSource } from './productDataSource';

export class AwinService {
    private readonly baseUrl = 'https://api.awin.com';
    private readonly apiToken: string;
    private readonly publisherId: string;
    private readonly resonanceField: ResonanceField;
    private readonly productDataSource: ProductDataSource;
    private headers: any;

    constructor() {
        this.apiToken = config.awin.apiToken;
        this.publisherId = config.awin.publisherId;
        this.headers = {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'X-Publisher-ID': this.publisherId
        };
        if (!this.apiToken) {
            throw new Error('Awin API token not configured');
        }
        this.resonanceField = new ResonanceField();
        this.productDataSource = new ProductDataSource();
    }

    async getMerchants(): Promise<any[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/publishers/${this.publisherId}/programmes`, {
                headers: this.headers,
                params: {
                    relationship: 'joined'  // Only get merchants we're already connected with
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching Awin merchants:', error);
            throw error;
        }
    }

    /**
     * Search for products using the AWIN API
     * Note: Currently returns mock data due to API endpoint issues
     */
    async searchProducts(params: AwinSearchParams): Promise<AwinProduct[]> {
        try {
            // First try API
            try {
                // TODO: Implement actual API call once endpoint is working
                throw new Error('API not implemented');
            } catch (apiError) {
                // Fallback to scraping popular marketplaces
                console.info('Falling back to web scraping for product data');
                
                // Example URLs - in production, these would be generated based on search params
                const urls = [
                    `https://www.amazon.com/s?k=${params.keyword}`,
                    `https://www.ebay.com/sch/i.html?_nkw=${params.keyword}`
                ];

                const scrapedProducts = await Promise.all(
                    urls.map(url => this.productDataSource.getProductData(url))
                );

                return scrapedProducts.map(p => this.productDataSource.convertToAwinProduct(p));
            }
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }

    async findResonantProducts(pattern: DemandPattern): Promise<AwinProduct[]> {
        try {
            const keyword = pattern.keywords?.[0] || '';
            const enhancedParams: AwinSearchParams = await this.resonanceField.enhanceSearchParams({
                baseParams: {
                    keyword,
                    categoryId: pattern.category
                },
                context: pattern
            });

            console.log('Searching with resonance-enhanced params:', enhancedParams);
            const products = await this.searchProducts(enhancedParams);

            // Let resonance field score and sort the products
            const scoredProducts = await this.resonanceField.scoreProducts(products, pattern);
            return scoredProducts.sort((a, b) => (b.resonanceScore || 0) - (a.resonanceScore || 0));
        } catch (error) {
            console.error('Error in resonant product search:', error);
            throw error;
        }
    }

    private convertPatternToParams(pattern: DemandPattern): AwinSearchParams {
        return {
            keyword: pattern.keywords?.[0] || 'general',  // Default to 'general' if no keywords
            categoryId: pattern.category,
            minPrice: pattern.priceRange?.min,
            maxPrice: pattern.priceRange?.max
        };
    }

    private getCurrentSeason(): string {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }
}
