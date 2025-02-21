import axios from 'axios';
import { ConfigService } from '../config/configService';
import { DomainAvailability } from '../types/domainTypes';

export class GoDaddyConnector {
  private readonly baseUrl = 'https://api.godaddy.com/v1';
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(config: ConfigService) {
    const godaddyConfig = config.get('godaddy');
    this.apiKey = godaddyConfig.apiKey;
    this.apiSecret = godaddyConfig.apiSecret;
  }

  private getHeaders() {
    return {
      Authorization: `sso-key ${this.apiKey}:${this.apiSecret}`,
      'Content-Type': 'application/json',
    };
  }

  public async checkDomainAvailability(domainName: string): Promise<DomainAvailability> {
    try {
      const response = await axios.get(`${this.baseUrl}/domains/available?domain=${domainName}`, {
        headers: this.getHeaders(),
      });

      return {
        available: response.data.available,
        price: response.data.price,
      };
    } catch (error) {
      throw new Error(`Failed to check domain availability: ${(error as Error).message}`);
    }
  }

  public async purchaseDomain(domainName: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/domains/purchase`,
        { domain: domainName },
        { headers: this.getHeaders() }
      );
      return response.status === 200;
    } catch (error) {
      throw new Error(`Failed to purchase domain: ${(error as Error).message}`);
    }
  }

  public async configureDNS(domainName: string, records: any[]): Promise<boolean> {
    try {
      const response = await axios.put(`${this.baseUrl}/domains/${domainName}/records`, records, {
        headers: this.getHeaders(),
      });
      return response.status === 200;
    } catch (error) {
      throw new Error(`Failed to configure DNS: ${(error as Error).message}`);
    }
  }
}
