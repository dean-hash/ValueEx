import { DirectMerchantAPI } from '../../../core/api/merchant';
import { ValueMetrics } from '../../../types/metrics';
import { ProductMatchingEngine } from '../../matching/productEngine';

export class MerchantPortal {
  private static instance: MerchantPortal;
  private api: DirectMerchantAPI;
  private matchingEngine: ProductMatchingEngine;

  private constructor() {
    this.api = new DirectMerchantAPI();
    this.matchingEngine = new ProductMatchingEngine();
  }

  static getInstance(): MerchantPortal {
    if (!MerchantPortal.instance) {
      MerchantPortal.instance = new MerchantPortal();
    }
    return MerchantPortal.instance;
  }

  async getOptimalProducts(context: any = {}): Promise<any[]> {
    const products = await this.api.getProducts();
    return this.matchingEngine.findOptimalMatches(products, context);
  }

  async trackEngagement(data: any): Promise<void> {
    await this.api.trackEngagement(data);
  }

  async processConversion(conversionData: any): Promise<ValueMetrics> {
    return this.api.recordConversion(conversionData);
  }
}
