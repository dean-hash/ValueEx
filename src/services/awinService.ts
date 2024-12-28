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
import { configService } from '../config/configService';
import { ResonanceFieldService } from './resonanceField';
import { DemandPattern } from '../types/demandTypes';
import { AwinProduct } from '../types/awinTypes';
import { Logger } from '../logger/logger';
import { MockProductDataSource } from '../mocks/productDataSource';

interface AwinSearchParams {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
  limit?: number;
  sortBy?: string;
}

export class AwinService {
  private apiKey: string;
  private publisherId: string;
  private resonanceField: ResonanceFieldService;
  private logger: Logger;
  private baseUrl = 'https://api.awin.com';
  private mockDataSource: MockProductDataSource;

  constructor(
    private config = configService,
    resonanceField: ResonanceFieldService,
    logger: Logger
  ) {
    const awinConfig = config.getAwinConfig();
    this.apiKey = awinConfig.apiKey || '';
    this.publisherId = awinConfig.publisherId || '';
    this.resonanceField = resonanceField;
    this.logger = logger;
    this.mockDataSource = MockProductDataSource.getInstance();
  }

  async getMerchants(): Promise<any[]> {
    try {
      const response = await this.makeRequest(
        '/publishers/' + this.publisherId + '/programmes',
        {}
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching merchants:', { error: String(error) });
      return [];
    }
  }

  async searchProducts(pattern: DemandPattern): Promise<AwinProduct[]> {
    try {
      // Use mock data source while API endpoint is unavailable
      this.logger.info('Using mock product data source for development');
      return await this.mockDataSource.searchProducts(pattern);

      /* Commented out until API endpoint is fixed
            const params = this.convertPatternToParams(pattern);
            const response = await this.makeRequest('/publishers/' + this.publisherId + '/product-search', params);
            return this.processProducts(response.data, pattern);
            */
    } catch (error) {
      this.logger.error('Error searching products:', { error: String(error) });
      return [];
    }
  }

  private async makeRequest(endpoint: string, params: AwinSearchParams): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        params,
      });
      return response;
    } catch (error) {
      this.logger.error(`API request failed for endpoint ${endpoint}:`, { error: String(error) });
      throw error;
    }
  }

  private convertPatternToParams(pattern: DemandPattern): AwinSearchParams {
    return {
      categoryId: pattern.category,
      minPrice: pattern.priceRange?.min,
      maxPrice: pattern.priceRange?.max,
      searchTerm: pattern.context.marketTrends.join(' '),
      limit: 50,
      sortBy: 'relevance',
    };
  }
}
