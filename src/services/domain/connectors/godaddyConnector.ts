import axios, { AxiosInstance } from 'axios';
import { configService } from '../../../config/configService';
import { logger } from '../../../utils/logger';
import { CredentialsManager } from '../../../config/credentialsManager';
import puppeteer, { Page } from 'puppeteer';
import { RetryableError } from '../../../types/errors';
import { sleep } from '../../../utils/async';

interface GoDaddyConfig {
  apiKey: string;
  apiSecret: string;
  endpoint: string;
}

interface DNSRecord {
  type: 'A' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  data: string;
  ttl: number;
}

interface DomainListingOptions {
  price: number;
  description: string;
}

interface DomainListingResult {
  success: boolean;
  domain: string;
  price: number;
}

interface DomainInfo {
  domain: string;
  status: string;
  expires: string;
}

export class GoDaddyConnector {
  private static instance: GoDaddyConnector;
  private config: GoDaddyConfig;
  private axiosInstance: AxiosInstance;
  private credentialsManager: CredentialsManager;
  private retryCount = 3;
  private retryDelay = 1000;

  private constructor() {
    const config = configService.getGodaddyConfig();
    this.config = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      endpoint: 'https://api.godaddy.com/v1',
    };

    console.log(
      'GoDaddy API Key:',
      this.config.apiKey ? '***' + this.config.apiKey.slice(-4) : 'not set'
    );
    console.log(
      'GoDaddy API Secret:',
      this.config.apiSecret ? '***' + this.config.apiSecret.slice(-4) : 'not set'
    );

    this.axiosInstance = axios.create({
      baseURL: this.config.endpoint,
      headers: {
        Authorization: `sso-key ${this.config.apiKey}:${this.config.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    this.credentialsManager = CredentialsManager.getInstance();
  }

  static getInstance(): GoDaddyConnector {
    if (!GoDaddyConnector.instance) {
      GoDaddyConnector.instance = new GoDaddyConnector();
    }
    return GoDaddyConnector.instance;
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < this.retryCount; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        if (!(error instanceof RetryableError)) {
          throw error;
        }
        if (i < this.retryCount - 1) {
          await sleep(this.retryDelay * Math.pow(2, i));
        }
      }
    }

    throw lastError!;
  }

  async checkAvailability(domain: string): Promise<boolean> {
    return this.withRetry(async () => {
      try {
        const response = await this.axiosInstance.get(`/domains/available?domain=${domain}`);
        return response.data.available;
      } catch (error: any) {
        if (error.response?.status === 429) {
          throw new RetryableError('Rate limit exceeded', error);
        }
        throw error;
      }
    });
  }

  async purchaseDomain(domain: string): Promise<void> {
    return this.withRetry(async () => {
      try {
        await this.axiosInstance.post('/domains/purchase', {
          domain,
          consent: {
            agreementKeys: ['DNRA'],
            agreedBy: 'ValueEx System',
            agreedAt: new Date().toISOString(),
          },
        });
        logger.info(`Domain ${domain} purchased successfully`);
      } catch (error: any) {
        if (error.response?.status === 429) {
          throw new RetryableError('Rate limit exceeded', error);
        }
        throw error;
      }
    });
  }

  async configureDNS(domain: string, records: DNSRecord[]): Promise<void> {
    return this.withRetry(async () => {
      try {
        await this.axiosInstance.put(`/domains/${domain}/records`, records);
        logger.info('DNS records updated successfully');
      } catch (error: any) {
        if (error.response?.status === 429) {
          throw new RetryableError('Rate limit exceeded', error);
        }
        throw error;
      }
    });
  }

  async getDomainStatus(domain: string): Promise<any> {
    return this.withRetry(async () => {
      try {
        const response = await this.axiosInstance.get(`/domains/${domain}`);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 429) {
          throw new RetryableError('Rate limit exceeded', error);
        }
        throw error;
      }
    });
  }

  async setupVercelDNS(domain: string): Promise<void> {
    const records: DNSRecord[] = [
      {
        type: 'A',
        name: '@',
        data: '76.76.21.21',
        ttl: 600,
      },
      {
        type: 'CNAME',
        name: 'www',
        data: 'cname.vercel-dns.com',
        ttl: 600,
      },
    ];

    await this.configureDNS(domain, records);
  }

  async listDomains(): Promise<DomainInfo[]> {
    return this.withRetry(async () => {
      try {
        const response = await this.axiosInstance.get('/domains');
        return response.data.map((domain: any) => ({
          domain: domain.domain,
          status: domain.status,
          expires: domain.expires,
        }));
      } catch (error: any) {
        if (error.response?.status === 429) {
          throw new RetryableError('Rate limit exceeded', error);
        }
        throw error;
      }
    });
  }

  async getDomains(): Promise<string[]> {
    return this.withRetry(async () => {
      try {
        const response = await this.axiosInstance.get('/domains');
        return response.data.map((domain: any) => domain.domain);
      } catch (error: any) {
        if (error.response?.status === 429) {
          throw new RetryableError('Rate limit exceeded', error);
        }
        throw error;
      }
    });
  }

  async listDomainForSale(
    domain: string,
    options: DomainListingOptions
  ): Promise<DomainListingResult> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      const credentials = await this.credentialsManager.getCredentials('godaddy');
      if (!credentials) {
        throw new Error('No GoDaddy credentials found');
      }

      await page.goto('https://sso.godaddy.com/login?realm=idp&path=%2Fproducts&app=account');

      // Type credentials
      await page.type('#username', credentials.username);
      await page.type('#password', credentials.password);

      // Click login and wait for navigation
      await Promise.all([page.waitForNavigation(), page.click('#submitBtn')]);

      // Go to domain manager
      await page.goto(`https://dcc.godaddy.com/domain-manager/sell/${domain}`);

      // Fill listing details
      await page.waitForSelector('input[name="price"]');
      await page.type('input[name="price"]', options.price.toString());

      await page.waitForSelector('textarea[name="description"]');
      await page.type('textarea[name="description"]', options.description);

      // Submit listing
      await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);

      return { success: true, domain, price: options.price };
    } catch (error: unknown) {
      logger.error('Error listing domain for sale:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  async updatePaymentMethod(paymentInfo: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  }): Promise<boolean> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      const credentials = await this.credentialsManager.getCredentials('godaddy');
      if (!credentials) {
        throw new Error('No GoDaddy credentials found');
      }

      // Login
      await page.goto('https://sso.godaddy.com/login?realm=idp&path=%2Fproducts&app=account');
      await page.type('#username', credentials.username);
      await page.type('#password', credentials.password);
      await Promise.all([page.waitForNavigation(), page.click('#submitBtn')]);

      // Go to payment methods
      await page.goto('https://account.godaddy.com/billing');
      await page.waitForSelector('button[data-testid="add-payment-method"]');
      await page.click('button[data-testid="add-payment-method"]');

      // Fill payment form
      await page.waitForSelector('input[name="cardNumber"]');
      await page.type('input[name="cardNumber"]', paymentInfo.cardNumber);
      await page.type('input[name="expiryMonth"]', paymentInfo.expiryMonth);
      await page.type('input[name="expiryYear"]', paymentInfo.expiryYear);
      await page.type('input[name="cvv"]', paymentInfo.cvv);
      await page.type('input[name="firstName"]', paymentInfo.firstName);
      await page.type('input[name="lastName"]', paymentInfo.lastName);
      await page.type('input[name="address"]', paymentInfo.address);
      await page.type('input[name="city"]', paymentInfo.city);
      await page.type('input[name="state"]', paymentInfo.state);
      await page.type('input[name="zip"]', paymentInfo.zip);

      // Submit form
      await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);

      // Check for success message
      const success = await page.evaluate(() => {
        const element = document.querySelector('.success-message');
        return element !== null;
      });

      return success;
    } catch (error) {
      logger.error('Error updating payment method:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }
}
