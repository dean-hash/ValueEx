import axios from 'axios';
import { config } from '../config';

interface AwinProduct {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    merchant: {
        id: string;
        name: string;
    };
    categories: string[];
    url: string;
    imageUrl: string;
}

interface AwinSearchParams {
    keyword: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    merchantId?: string;
    limit?: number;
    offset?: number;
}

export class AwinService {
    private readonly baseUrl = 'https://api.awin.com';
    private readonly apiToken: string;
    private headers: any;

    constructor() {
        this.apiToken = config.awin.apiToken;
        this.headers = {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'X-Publisher-ID': config.awin.publisherId
        };
        if (!this.apiToken) {
            throw new Error('Awin API token not configured');
        }
    }

    async searchProducts(params: AwinSearchParams): Promise<AwinProduct[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/product-feeds`, {
                headers: this.headers,
                params: {
                    ...params,
                    format: 'json'
                }
            });

            return this.transformProducts(response.data);
        } catch (error) {
            console.error('Error searching Awin products:', error);
            throw error;
        }
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

    async getProductDetails(productId: string): Promise<AwinProduct> {
        try {
            const response = await axios.get(`${this.baseUrl}/products/${productId}`, {
                headers: this.headers
            });

            return this.transformProduct(response.data);
        } catch (error) {
            console.error('Error fetching Awin product details:', error);
            throw error;
        }
    }

    private transformProducts(rawProducts: any[]): AwinProduct[] {
        return rawProducts.map(this.transformProduct);
    }

    private transformProduct(raw: any): AwinProduct {
        return {
            id: raw.id,
            title: raw.name,
            description: raw.description,
            price: parseFloat(raw.price),
            currency: raw.currency,
            merchant: {
                id: raw.merchantId,
                name: raw.merchantName
            },
            categories: raw.categories || [],
            url: raw.awTrackingUrl || raw.merchantDeeplink,
            imageUrl: raw.imageUrl
        };
    }

    async findProductsByDemandPattern(pattern: any): Promise<AwinProduct[]> {
        // Convert demand pattern to search parameters
        const searchParams: AwinSearchParams = {
            keyword: pattern.keywords?.join(' '),
            categoryId: pattern.category,
            minPrice: pattern.priceRange?.min,
            maxPrice: pattern.priceRange?.max,
            limit: 100
        };

        return this.searchProducts(searchParams);
    }
}
