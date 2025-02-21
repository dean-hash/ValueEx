import axios from 'axios';
import { logger } from '../../utils/logger';

export interface JasperAffiliate {
  id: string;
  clickId: string;
  commission: number;
  status: string;
  createdAt: string;
}

export class JasperClient {
  private readonly baseUrl = 'https://api.jasper.ai';
  private readonly apiKey: string;
  private readonly affiliateId: string;

  constructor() {
    this.apiKey = process.env.JASPER_API_KEY || '';
    this.affiliateId = process.env.JASPER_AFFILIATE_ID || '';

    if (!this.apiKey || !this.affiliateId) {
      throw new Error('JASPER_API_KEY and JASPER_AFFILIATE_ID are required');
    }
  }

  async getAffiliateLink(campaignId?: string): Promise<string> {
    return `https://jasper.ai/r/${this.affiliateId}${campaignId ? `?c=${campaignId}` : ''}`;
  }

  async getTransactions(startDate?: Date): Promise<JasperAffiliate[]> {
    try {
      const date = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
      const response = await axios.get(`${this.baseUrl}/v1/affiliate/transactions`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          startDate: date.toISOString(),
          affiliateId: this.affiliateId,
        },
      });

      return response.data.transactions;
    } catch (error) {
      logger.error('Failed to fetch Jasper transactions:', error);
      return [];
    }
  }

  async trackClick(clickId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/v1/affiliate/track`,
        {
          clickId,
          affiliateId: this.affiliateId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      logger.error('Failed to track Jasper click:', error);
    }
  }
}
