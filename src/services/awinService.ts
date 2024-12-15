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

export class AwinService {
    private readonly baseUrl = 'https://api.awin.com';
    private readonly apiToken: string;
    private readonly resonanceField: ResonanceField;
    private headers: any;

    constructor(resonanceField?: ResonanceField) {
        this.apiToken = config.awin.apiToken;
        this.headers = {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'X-Publisher-ID': config.awin.publisherId
        };
        if (!this.apiToken) {
            throw new Error('Awin API token not configured');
        }
        this.resonanceField = resonanceField || new ResonanceField();
    }

    async getMerchants(): Promise<any[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/publishers/${config.awin.publisherId}/programmes`, {
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

    // TODO: Product search functionality temporarily removed until API endpoint issues are resolved
    // See documentation at the top of file for details on current status and next steps

    async findResonantProducts(pattern: DemandPattern): Promise<AwinProduct[]> {
        try {
            // Let the resonance field enhance our search parameters
            const enhancedParams = await this.resonanceField.enhanceSearchParams({
                baseParams: this.convertPatternToParams(pattern),
                context: {
                    location: pattern.location,
                    season: this.getCurrentSeason(),
                    timeContext: new Date(),
                    demandStrength: pattern.intensity || 1
                }
            });

            console.log('Searching with resonance-enhanced params:', enhancedParams);
            // Removed product search functionality
            // const products = await this.searchProducts(enhancedParams);

            // Let resonance field score and sort the products
            // const scoredProducts = await this.resonanceField.scoreProducts(products, pattern);
            // return scoredProducts.sort((a, b) => b.resonanceScore - a.resonanceScore);
        } catch (error) {
            console.error('Error in resonant product search:', error);
            throw error;
        }
    }

    private convertPatternToParams(pattern: DemandPattern): AwinSearchParams {
        return {
            keyword: pattern.keywords?.join(' '),
            categoryId: pattern.category,
            minPrice: pattern.priceRange?.min,
            maxPrice: pattern.priceRange?.max,
            limit: 100
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
