interface RevenueEvent {
  source: 'affiliate' | 'domain' | 'consultation' | 'community';
  amount: number;
  details: {
    platform?: string;
    product?: string;
    commission?: number;
    [key: string]: any;
  };
}
export declare class RevenueStreamManager {
  private static instance;
  private valueManager;
  private constructor();
  static getInstance(): RevenueStreamManager;
  processRevenueEvent(event: RevenueEvent): Promise<void>;
  private recordRevenue;
  private distributeValue;
  private calculateDistributions;
  trackSpecific(destination: string): Promise<void>;
  generateRevenueReport(): Promise<string>;
}
export {};
