import axios from 'axios';
import { logger } from '../../utils/logger';

interface AwinTransaction {
  id: string;
  amount: number;
  commission: number;
  status: string;
  merchantId: string;
  clickRefs: {
    clickRef: string;
    clickDate: string;
  }[];
}

interface GetTransactionsParams {
  startDate: Date;
  endDate: Date;
}

export class AwinClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.awin.com/publishers';
  private readonly publisherId: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Awin API key is required');
    }
    this.apiKey = apiKey;
    
    const publisherId = process.env.AWIN_PUBLISHER_ID;
    if (!publisherId) {
      throw new Error('AWIN_PUBLISHER_ID environment variable is required');
    }
    this.publisherId = publisherId;

    logger.info('Awin client initialized with publisher ID:', publisherId);
  }

  async getTransactions(params: GetTransactionsParams): Promise<AwinTransaction[]> {
    try {
      const url = `${this.baseUrl}/${this.publisherId}/transactions/`;
      logger.info(`Fetching Awin transactions from ${url}`);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          startDate: params.startDate.toISOString(),
          endDate: params.endDate.toISOString(),
          timezone: 'UTC',
          status: 'confirmed'
        }
      });

      const transactions = response.data;
      logger.info(`Retrieved ${transactions.length} transactions from Awin`);
      
      return transactions;
    } catch (error: any) {
      if (error.response) {
        logger.error('Awin API error:', {
          status: error.response.status,
          data: error.response.data
        });
      } else {
        logger.error('Error fetching Awin transactions:', error.message);
      }
      throw error;
    }
  }
}
