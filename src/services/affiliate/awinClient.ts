import axios from 'axios';

export interface AffiliateProgram {
  id: string;
  name: string;
  description: string;
  commissionRate: number;
  category: string;
  requirements: string[];
  status: 'active' | 'pending' | 'inactive';
  lastUpdated: string;
  metrics?: {
    conversionRate?: number;
    averageOrderValue?: number;
    clickThroughRate?: number;
  };
}

export interface Transaction {
  id: string;
  programId: string;
  amount: number;
  status: 'pending' | 'approved' | 'declined';
  clickRef?: string;
  timestamp: string;
}

export class AwinClient {
  private readonly baseUrl = 'https://api.awin.com';
  private readonly apiKey: string;
  private readonly publisherId: string;

  constructor(apiKey: string, publisherId: string) {
    this.apiKey = apiKey;
    this.publisherId = publisherId;
  }

  async getHighValuePrograms(): Promise<AffiliateProgram[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/publishers/${this.publisherId}/programmes`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Transform response to AffiliateProgram format
      return response.data.map((program: any) => ({
        id: program.id,
        name: program.name,
        description: program.description || '',
        commissionRate: program.commissionRate || 0,
        category: program.category || 'General',
        requirements: program.requirements || [],
        status: program.status || 'inactive',
        lastUpdated: program.lastUpdated || new Date().toISOString(),
        metrics: {
          conversionRate: program.metrics?.conversionRate || 0,
          averageOrderValue: program.metrics?.averageOrderValue || 0,
          clickThroughRate: program.metrics?.clickThroughRate || 0,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch high value programs:', error);
      throw error;
    }
  }

  async getTransactions(startDate?: Date): Promise<Transaction[]> {
    try {
      const date = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours by default
      const response = await axios.get(
        `${this.baseUrl}/publishers/${this.publisherId}/transactions`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          params: {
            startDate: date.toISOString(),
            timezone: 'UTC',
          },
        }
      );

      return response.data.map((tx: any) => ({
        id: tx.id,
        programId: tx.programId,
        amount: tx.amount,
        status: tx.status,
        clickRef: tx.clickRef,
        timestamp: tx.transactionDate,
      }));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }
  }

  async getProgramLinks(): Promise<string[]> {
    try {
      const programs = await this.getHighValuePrograms();
      return programs
        .filter((p) => p.status === 'active' && p.commissionRate > 0)
        .map((p) => `${this.baseUrl}/publisher/${this.publisherId}/program/${p.id}`);
    } catch (error) {
      console.error('Failed to generate program links:', error);
      return [];
    }
  }

  async trackOpportunity(program: AffiliateProgram): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/publishers/${this.publisherId}/opportunities`,
        {
          programId: program.id,
          timestamp: new Date().toISOString(),
          metrics: program.metrics,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error(`Failed to track opportunity for program ${program.name}:`, error);
    }
  }
}
