import { ENV_CONFIG } from '../../config/env.production';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as fsPromises from 'fs/promises';

interface Credentials {
  godaddy?: {
    apiKey: string;
    apiSecret: string;
  };
  teams?: {
    appId: string;
    appPassword: string;
  };
  fiverr?: {
    affiliateLinks: {
      marketplace: string;
      pro: string;
      logoMaker: string;
      subAffiliates: string;
    };
  };
}

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export class CredentialsManager {
  private static instance: CredentialsManager;
  private credentials: Map<string, Credentials[keyof Credentials]>;
  private readonly paymentInfoPath: string;

  private constructor() {
    this.credentials = new Map();
    this.paymentInfoPath = path.join(__dirname, '../../.payment-info');
    this.initializeCredentials();
  }

  public static getInstance(): CredentialsManager {
    if (!CredentialsManager.instance) {
      CredentialsManager.instance = new CredentialsManager();
    }
    return CredentialsManager.instance;
  }

  private initializeCredentials(): void {
    // Load and encrypt sensitive credentials
    this.credentials.set('godaddy', ENV_CONFIG.GODADDY);
    this.credentials.set('teams', ENV_CONFIG.TEAMS);
    this.credentials.set('fiverr', ENV_CONFIG.FIVERR);
  }

  public async validateCredentials(): Promise<boolean> {
    try {
      // Validate GoDaddy API access
      const godaddyValid = await this.validateGoDaddyCredentials();
      if (!godaddyValid) {
        logger.error('GoDaddy credentials validation failed');
        return false;
      }

      // Validate Teams integration
      const teamsValid = await this.validateTeamsCredentials();
      if (!teamsValid) {
        logger.error('Teams credentials validation failed');
        return false;
      }

      // Validate Fiverr affiliate links
      const fiverrValid = this.validateFiverrLinks();
      if (!fiverrValid) {
        logger.error('Fiverr affiliate links validation failed');
        return false;
      }

      logger.info('All credentials validated successfully');
      return true;
    } catch (error) {
      logger.error('Credentials validation failed:', error);
      return false;
    }
  }

  private async validateGoDaddyCredentials(): Promise<boolean> {
    try {
      const { apiKey, apiSecret } = this.credentials.get('godaddy');
      // TODO: Implement actual GoDaddy API validation
      return !!(apiKey && apiSecret);
    } catch (error) {
      return false;
    }
  }

  private async validateTeamsCredentials(): Promise<boolean> {
    try {
      const { appId, appPassword } = this.credentials.get('teams');
      // TODO: Implement actual Teams API validation
      return !!(appId && appPassword);
    } catch (error) {
      return false;
    }
  }

  private validateFiverrLinks(): boolean {
    try {
      const fiverrCreds = this.credentials.get('fiverr');
      return Object.values(fiverrCreds.affiliateLinks).every(
        (link) => typeof link === 'string' && link.startsWith('https://go.fiverr.com/')
      );
    } catch (error) {
      return false;
    }
  }

  public getCredentials(service: keyof Credentials): Credentials[typeof service] | null {
    return this.credentials.get(service) || null;
  }

  async storePaymentInfo(info: PaymentInfo): Promise<void> {
    try {
      const encryptedData = this.encryptData(JSON.stringify(info));
      await fsPromises.writeFile(this.paymentInfoPath, encryptedData, { mode: 0o600 }); // Restricted permissions
      logger.info('Payment information stored securely');
    } catch (error) {
      logger.error('Failed to store payment information:', error);
      throw error;
    }
  }

  async getPaymentInfo(): Promise<PaymentInfo | null> {
    try {
      if (!fs.existsSync(this.paymentInfoPath)) {
        return null;
      }
      const encryptedData = await fsPromises.readFile(this.paymentInfoPath, 'utf8');
      const decryptedData = this.decryptData(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      logger.error('Failed to get payment information:', error);
      return null;
    }
  }

  private encryptData(data: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.MASTER_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return JSON.stringify({
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted.toString('hex'),
    });
  }

  private decryptData(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.MASTER_KEY || 'default-key', 'salt', 32);
    const { iv, authTag, data } = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
