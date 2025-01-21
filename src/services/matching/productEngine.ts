import { ValueMetrics } from '../../types/metrics';

export class ProductMatchingEngine {
  async findOptimalMatches(products: any[], context: any = {}): Promise<any[]> {
    const { category, minCommissionRate, maxPrice, sortBy } = context;

    return products
      .filter((p) => this.matchesFilters(p, category, minCommissionRate, maxPrice))
      .sort((a, b) => this.sortProducts(a, b, sortBy));
  }

  private matchesFilters(
    product: any,
    category?: string,
    minCommissionRate?: number,
    maxPrice?: number
  ): boolean {
    if (category && product.category !== category) return false;
    if (minCommissionRate && product.commissionRate < minCommissionRate) return false;
    if (maxPrice && product.price > maxPrice) return false;
    return true;
  }

  private sortProducts(a: any, b: any, sortBy: string = 'potentialValue'): number {
    switch (sortBy) {
      case 'price':
        return b.price - a.price;
      case 'commission':
        return b.commissionRate - a.commissionRate;
      case 'engagement':
        return b.metrics.engagementScore - a.metrics.engagementScore;
      case 'potentialValue':
      default:
        return (
          b.price * b.commissionRate * b.metrics.engagementScore -
          a.price * a.commissionRate * a.metrics.engagementScore
        );
    }
  }
}
