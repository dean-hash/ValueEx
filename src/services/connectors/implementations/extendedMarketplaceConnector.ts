import { DataPoint } from '../dataConnector';
import axios from 'axios';
import { MarketplaceConnector } from './marketplaceConnector';

interface ExtendedMarketplaceConfig {
  marketplace: 'walmart' | 'etsy' | 'aliexpress' | 'shopify';
  endpoint: string;
  apiKey?: string;
  region: string;
}

interface WalmartItem {
  itemId: string;
  name: string;
  salePrice: number;
  stockStatus: string;
  numReviews: number;
  averageRating: number;
}

interface EtsyItem {
  listing_id: string;
  title: string;
  price: number;
  quantity: number;
  views: number;
  num_favorers: number;
}

interface AliExpressItem {
  productId: string;
  title: string;
  price: number;
  orders: number;
  rating: number;
}

interface ShopifyProduct {
  id: string;
  title: string;
  variants: ShopifyVariant[];
  images: { id: string }[];
}

interface ShopifyVariant {
  id: string;
  inventory_quantity: number;
}

export class ExtendedMarketplaceConnector {
  private config: ExtendedMarketplaceConfig;
  private baseConnector: MarketplaceConnector;

  constructor(config: ExtendedMarketplaceConfig) {
    this.config = config;
    this.baseConnector = new MarketplaceConnector({
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      marketplace: 'amazon', // Use Amazon as base for compatibility
      region: config.region,
    });
  }

  public async fetchMarketData(category: string): Promise<DataPoint[]> {
    switch (this.config.marketplace) {
      case 'walmart':
        return this.fetchWalmartData(category);
      case 'etsy':
        return this.fetchEtsyData(category);
      case 'aliexpress':
        return this.fetchAliExpressData(category);
      case 'shopify':
        return this.fetchShopifyData(category);
      default:
        throw new Error(`Unsupported marketplace: ${this.config.marketplace}`);
    }
  }

  private async fetchWalmartData(category: string): Promise<DataPoint[]> {
    try {
      const response = await axios.get<{ items: WalmartItem[] }>(
        `${this.config.endpoint}/v3/items/search`,
        {
          params: {
            category,
            sort: 'best_seller',
            limit: 50,
          },
          headers: {
            'WM_SEC.ACCESS_TOKEN': this.config.apiKey,
            'WM_QOS.CORRELATION_ID': Date.now().toString(),
          },
        }
      );

      return this.processWalmartData(response.data.items);
    } catch (error) {
      console.error('Error fetching Walmart data:', error);
      throw error;
    }
  }

  private async fetchEtsyData(category: string): Promise<DataPoint[]> {
    try {
      const response = await axios.get<{ results: EtsyItem[] }>(
        `${this.config.endpoint}/v3/application/listings/active`,
        {
          params: {
            taxonomy_id: category,
            sort_on: 'score',
            limit: 100,
          },
          headers: {
            'x-api-key': this.config.apiKey,
          },
        }
      );

      return this.processEtsyData(response.data.results);
    } catch (error) {
      console.error('Error fetching Etsy data:', error);
      throw error;
    }
  }

  private async fetchAliExpressData(category: string): Promise<DataPoint[]> {
    try {
      const response = await axios.get<{ items: AliExpressItem[] }>(
        `${this.config.endpoint}/api/products/search`,
        {
          params: {
            categoryId: category,
            sort: 'orders_desc',
            limit: 50,
          },
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }
      );

      return this.processAliExpressData(response.data.items);
    } catch (error) {
      console.error('Error fetching AliExpress data:', error);
      throw error;
    }
  }

  private async fetchShopifyData(category: string): Promise<DataPoint[]> {
    try {
      const response = await axios.get<{ products: ShopifyProduct[] }>(
        `${this.config.endpoint}/admin/api/2024-01/products.json`,
        {
          params: {
            collection_id: category,
            limit: 250,
          },
          headers: {
            'X-Shopify-Access-Token': this.config.apiKey,
          },
        }
      );

      return this.processShopifyData(response.data.products);
    } catch (error) {
      console.error('Error fetching Shopify data:', error);
      throw error;
    }
  }

  private processWalmartData(items: WalmartItem[]): DataPoint[] {
    return items.map((item) => ({
      timestamp: new Date().toISOString(),
      value: this.calculateWalmartDemand(item),
      metadata: {
        itemId: item.itemId,
        name: item.name,
        salePrice: item.salePrice,
        stockStatus: item.stockStatus,
        numReviews: item.numReviews,
        averageRating: item.averageRating,
        marketplace: 'walmart',
      },
      confidence: this.calculateWalmartConfidence(item),
    }));
  }

  private processEtsyData(items: EtsyItem[]): DataPoint[] {
    return items.map((item) => ({
      timestamp: new Date().toISOString(),
      value: this.calculateEtsyDemand(item),
      metadata: {
        listingId: item.listing_id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        views: item.views,
        numFavorers: item.num_favorers,
        marketplace: 'etsy',
      },
      confidence: this.calculateEtsyConfidence(item),
    }));
  }

  private processAliExpressData(items: AliExpressItem[]): DataPoint[] {
    return items.map((item) => ({
      timestamp: new Date().toISOString(),
      value: this.calculateAliExpressDemand(item),
      metadata: {
        productId: item.productId,
        title: item.title,
        price: item.price,
        orders: item.orders,
        rating: item.rating,
        marketplace: 'aliexpress',
      },
      confidence: this.calculateAliExpressConfidence(item),
    }));
  }

  private processShopifyData(products: ShopifyProduct[]): DataPoint[] {
    return products.map((product) => ({
      timestamp: new Date().toISOString(),
      value: this.calculateShopifyDemand(product),
      metadata: {
        productId: product.id,
        title: product.title,
        variants: product.variants.length,
        totalInventory: this.calculateTotalInventory(product),
        marketplace: 'shopify',
      },
      confidence: this.calculateShopifyConfidence(product),
    }));
  }

  private calculateWalmartDemand(item: WalmartItem): number {
    const reviewWeight = 0.3;
    const ratingWeight = 0.3;
    const stockWeight = 0.4;

    const reviewScore = Math.min(item.numReviews / 1000, 1);
    const ratingScore = item.averageRating / 5;
    const stockScore = item.stockStatus === 'IN_STOCK' ? 1 : 0;

    return reviewScore * reviewWeight + ratingScore * ratingWeight + stockScore * stockWeight;
  }

  private calculateEtsyDemand(item: EtsyItem): number {
    const viewWeight = 0.3;
    const favorWeight = 0.4;
    const quantityWeight = 0.3;

    const viewScore = Math.min(item.views / 1000, 1);
    const favorScore = Math.min(item.num_favorers / 100, 1);
    const quantityScore = Math.min(item.quantity / 50, 1);

    return viewScore * viewWeight + favorScore * favorWeight + quantityScore * quantityWeight;
  }

  private calculateAliExpressDemand(item: AliExpressItem): number {
    const orderWeight = 0.5;
    const ratingWeight = 0.3;
    const priceWeight = 0.2;

    const orderScore = Math.min(item.orders / 1000, 1);
    const ratingScore = item.rating / 5;
    const priceScore = Math.min(item.price / 100, 1);

    return orderScore * orderWeight + ratingScore * ratingWeight + priceScore * priceWeight;
  }

  private calculateShopifyDemand(product: ShopifyProduct): number {
    const variantWeight = 0.3;
    const inventoryWeight = 0.4;
    const imageWeight = 0.3;

    const variantScore = Math.min(product.variants.length / 10, 1);
    const inventoryScore = Math.min(this.calculateTotalInventory(product) / 1000, 1);
    const imageScore = Math.min(product.images.length / 5, 1);

    return (
      variantScore * variantWeight + inventoryScore * inventoryWeight + imageScore * imageWeight
    );
  }

  private calculateWalmartConfidence(item: WalmartItem): number {
    const reviewConfidence = Math.min(item.numReviews / 500, 1);
    const ratingConfidence = item.averageRating >= 4 ? 1 : 0.5;
    const stockConfidence = item.stockStatus === 'IN_STOCK' ? 1 : 0.3;

    return (reviewConfidence + ratingConfidence + stockConfidence) / 3;
  }

  private calculateEtsyConfidence(item: EtsyItem): number {
    const viewConfidence = Math.min(item.views / 500, 1);
    const favorConfidence = Math.min(item.num_favorers / 50, 1);
    const shopConfidence = item.listing_id ? 1 : 0.5;

    return (viewConfidence + favorConfidence + shopConfidence) / 3;
  }

  private calculateAliExpressConfidence(item: AliExpressItem): number {
    const orderConfidence = Math.min(item.orders / 500, 1);
    const ratingConfidence = item.rating >= 4.5 ? 1 : 0.5;
    const sellerScore = 0.8; // Default seller score if not available

    return (orderConfidence + ratingConfidence + sellerScore) / 3;
  }

  private calculateShopifyConfidence(product: ShopifyProduct): number {
    const variantConfidence = Math.min(product.variants.length / 5, 1);
    const inventoryConfidence = this.calculateTotalInventory(product) > 0 ? 1 : 0.3;
    const imageConfidence = Math.min(product.images.length / 3, 1);

    return (variantConfidence + inventoryConfidence + imageConfidence) / 3;
  }

  private calculateTotalInventory(product: ShopifyProduct): number {
    return product.variants.reduce(
      (total, variant) => total + (variant.inventory_quantity || 0),
      0
    );
  }
}
