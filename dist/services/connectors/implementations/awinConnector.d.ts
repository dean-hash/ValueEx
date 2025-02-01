export interface AwinProduct {
  id: string;
  name: string;
  description: string;
  commissionRate: number;
  price: number;
  category: string;
  merchantName: string;
  deepLink: string;
}
export declare class AwinConnector {
  private static instance;
  private readonly apiKey;
  private readonly publisherId;
  private readonly merchantId;
  private readonly baseUrl;
  private constructor();
  static getInstance(): AwinConnector;
  getHighValueProducts(): Promise<AwinProduct[]>;
  private generateTrackingLink;
  trackConversion(productId: string, saleAmount: number): Promise<void>;
  getHighPayingPrograms(): Promise<any[]>;
  getCommissionsDue(): Promise<any>;
  generateHighValueLinks(): Promise<string[]>;
  getActiveCommissions(): Promise<number>;
  optimizeCommissions(): Promise<void>;
}
