import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';

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

export class MVPStorage {
  private static instance: MVPStorage;
  private data: StorageData;
  private readonly filePath: string;
  private saveInterval: NodeJS.Timeout;

  private constructor() {
    this.filePath = path.join(__dirname, '../../../data/mvp_data.json');
    this.data = this.loadData();

    // Auto-save every 5 minutes
    this.saveInterval = setInterval(() => this.saveData(), 5 * 60 * 1000);
  }

  static getInstance(): MVPStorage {
    if (!MVPStorage.instance) {
      MVPStorage.instance = new MVPStorage();
    }
    return MVPStorage.instance;
  }

  private loadData(): StorageData {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (error) {
      logger.error('Error loading data:', error);
    }

    // Return default structure if file doesn't exist or has error
    return {
      matches: [],
      commissions: [],
      analytics: {
        apiCalls: 0,
        successfulMatches: 0,
        totalRevenue: 0,
        lastUpdate: new Date().toISOString(),
      },
    };
  }

  private saveData(): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save data
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
      logger.info('Data saved successfully');
    } catch (error) {
      logger.error('Error saving data:', error);
    }
  }

  /**
   * Track a new match
   */
  trackMatch(demandId: string, productId: string): void {
    this.data.matches.push({
      demandId,
      productId,
      timestamp: new Date().toISOString(),
      status: 'active',
    });
  }

  /**
   * Update match status
   */
  updateMatchStatus(demandId: string, status: 'fulfilled' | 'expired'): void {
    const match = this.data.matches.find((m) => m.demandId === demandId);
    if (match) {
      match.status = status;
    }
  }

  /**
   * Track commission
   */
  trackCommission(verticalId: string, amount: number): void {
    this.data.commissions.push({
      verticalId,
      amount,
      timestamp: new Date().toISOString(),
    });

    // Update analytics
    this.data.analytics.successfulMatches++;
    this.data.analytics.totalRevenue += amount;
    this.data.analytics.lastUpdate = new Date().toISOString();
  }

  /**
   * Track API call
   */
  trackAPICall(): void {
    this.data.analytics.apiCalls++;
    this.data.analytics.lastUpdate = new Date().toISOString();
  }

  /**
   * Get active matches
   */
  getActiveMatches(): StorageData['matches'] {
    return this.data.matches.filter((m) => m.status === 'active');
  }

  /**
   * Get analytics
   */
  getAnalytics(): StorageData['analytics'] {
    return { ...this.data.analytics };
  }

  /**
   * Get commission history for a vertical
   */
  getVerticalCommissions(verticalId: string): {
    total: number;
    count: number;
    average: number;
  } {
    const verticalCommissions = this.data.commissions.filter((c) => c.verticalId === verticalId);

    const total = verticalCommissions.reduce((sum, c) => sum + c.amount, 0);
    const count = verticalCommissions.length;

    return {
      total,
      count,
      average: count > 0 ? total / count : 0,
    };
  }

  /**
   * Clean up on shutdown
   */
  cleanup(): void {
    clearInterval(this.saveInterval);
    this.saveData();
  }
}
