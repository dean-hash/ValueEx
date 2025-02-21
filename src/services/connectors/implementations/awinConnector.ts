import axios from 'axios';

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

export class AwinConnector {
  private static instance: AwinConnector;
  private readonly apiKey: string;
  private readonly publisherId: string;
  private readonly merchantId = '7777';
  private readonly baseUrl = 'https://api.awin.com/publishers';

  private constructor() {
    this.apiKey = process.env.AWIN_API_KEY || '';
    this.publisherId = process.env.AWIN_PUBLISHER_ID || '';
  }

  static getInstance(): AwinConnector {
    if (!AwinConnector.instance) {
      AwinConnector.instance = new AwinConnector();
    }
    return AwinConnector.instance;
  }

  async getHighValueProducts(): Promise<AwinProduct[]> {
    const response = await axios.get(`${this.baseUrl}/${this.publisherId}/products`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'X-Merchant-Id': this.merchantId,
      },
    });

    return response.data.products
      .filter((p: any) => p.status === 'active' && p.commissionRate >= 25)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        commissionRate: p.commissionRate,
        price: p.price,
        category: p.category,
        merchantName: 'ValueEx',
        deepLink: this.generateTrackingLink(p.id),
      }));
  }

  private generateTrackingLink(productId: string): string {
    return `https://track.network/click/${this.merchantId}/${productId}`;
  }

  async trackConversion(productId: string, saleAmount: number): Promise<void> {
    await axios.post(
      `${this.baseUrl}/${this.publisherId}/conversions`,
      {
        productId,
        amount: saleAmount,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-Merchant-Id': this.merchantId,
        },
      }
    );
  }

  async getHighPayingPrograms(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.publisherId}/programmes`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        params: {
          relationship: 'joined',
          orderBy: 'commission',
        },
      });

      return response.data
        .filter(
          (program: any) =>
            program.commissionRange.max >= 30 && // 30% or higher commission
            program.paymentStatus === 'active' && // Currently paying
            program.validationPeriod <= 7 // Quick validation
        )
        .sort((a: any, b: any) => b.commissionRange.max - a.commissionRange.max);
    } catch (error) {
      console.error('Error fetching Awin programs:', error);
      return [];
    }
  }

  async getCommissionsDue(): Promise<any> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

      const response = await axios.get(`${this.baseUrl}/${this.publisherId}/transactions`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        params: {
          startDate: thirtyDaysAgo.toISOString(),
          endDate: new Date().toISOString(),
          status: 'pending',
        },
      });

      return {
        totalDue: response.data.reduce((sum: number, tx: any) => sum + tx.commission, 0),
        transactions: response.data,
      };
    } catch (error) {
      console.error('Error fetching Awin commissions:', error);
      return { totalDue: 0, transactions: [] };
    }
  }

  async generateHighValueLinks(): Promise<string[]> {
    const products = await this.getHighPayingPrograms();
    return products.map(
      (product) =>
        `https://www.awin1.com/cread.php?awinmid=${this.merchantId}&awinaffid=${this.publisherId}&clickref=high_value&p=${product.id}`
    );
  }

  async getActiveCommissions(): Promise<number> {
    const response = await axios.get(`${this.baseUrl}/${this.publisherId}/commissions`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.totalAmount || 0;
  }

  async optimizeCommissions(): Promise<void> {
    const products = await this.getHighPayingPrograms();

    // Focus on highest commission products
    const optimizedProducts = products
      .filter((p) => p.commissionRate >= 0.25)
      .sort((a, b) => b.commissionRate - a.commissionRate);

    // Generate optimized tracking links
    const links = optimizedProducts.map((product) => ({
      url: `https://www.awin1.com/cread.php?awinmid=${this.merchantId}&awinaffid=${this.publisherId}&clickref=optimized&p=${product.id}`,
      rate: product.commissionRate,
      value: product.price * product.commissionRate,
    }));

    console.log('Optimized Commission Opportunities:');
    links.forEach((link) => {
      console.log(`\nCommission Rate: ${(link.rate * 100).toFixed(1)}%`);
      console.log(`Potential Value: $${link.value.toFixed(2)}`);
      console.log(`Tracking URL: ${link.url}`);
    });
  }
}
