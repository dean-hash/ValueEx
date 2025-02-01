interface StorageData {
  matches: {
    demandId: string;
    productId: string;
    timestamp: string;
    status: 'active' | 'fulfilled' | 'expired';
  }[];
  commissions: {
    verticalId: string;
    amount: number;
    timestamp: string;
  }[];
  analytics: {
    apiCalls: number;
    successfulMatches: number;
    totalRevenue: number;
    lastUpdate: string;
  };
}
export declare class MVPStorage {
  private static instance;
  private data;
  private readonly filePath;
  private saveInterval;
  private constructor();
  static getInstance(): MVPStorage;
  private loadData;
  private saveData;
  /**
   * Track a new match
   */
  trackMatch(demandId: string, productId: string): void;
  /**
   * Update match status
   */
  updateMatchStatus(demandId: string, status: 'fulfilled' | 'expired'): void;
  /**
   * Track commission
   */
  trackCommission(verticalId: string, amount: number): void;
  /**
   * Track API call
   */
  trackAPICall(): void;
  /**
   * Get active matches
   */
  getActiveMatches(): StorageData['matches'];
  /**
   * Get analytics
   */
  getAnalytics(): StorageData['analytics'];
  /**
   * Get commission history for a vertical
   */
  getVerticalCommissions(verticalId: string): {
    total: number;
    count: number;
    average: number;
  };
  /**
   * Clean up on shutdown
   */
  cleanup(): void;
}
export {};
