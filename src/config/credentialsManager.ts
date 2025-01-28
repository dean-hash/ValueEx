import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

interface Credentials {
  username: string;
  password: string;
  service: string;
}

interface PaymentInfo {
  name: string;
  address: string;
  phone: string;
  ssn: string;
  email: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
}

export class CredentialsManager {
  private static instance: CredentialsManager;
  private credentialsPath: string;
  private paymentInfoPath: string;

  private constructor() {
    this.credentialsPath = path.join(process.cwd(), '.env');
    this.paymentInfoPath = path.join(process.cwd(), '.secure', 'payment.enc');
    this.ensureSecureFiles();
  }

  static getInstance(): CredentialsManager {
    if (!CredentialsManager.instance) {
      CredentialsManager.instance = new CredentialsManager();
    }
    return CredentialsManager.instance;
  }

  private ensureSecureFiles() {
    const secureDir = path.join(process.cwd(), '.secure');
    if (!fs.existsSync(secureDir)) {
      fs.mkdirSync(secureDir, { mode: 0o700 }); // Restricted permissions
    }
    if (!fs.existsSync(this.credentialsPath)) {
      fs.writeFileSync(this.credentialsPath, '', 'utf8');
    }
  }

  private ensureEnvFile() {
    if (!fs.existsSync(this.credentialsPath)) {
      fs.writeFileSync(this.credentialsPath, '', 'utf8');
    }
  }

  private encryptData(data: string): string {
    // TODO: Implement proper encryption using a hardware security module or KMS
    // For now, using a basic encryption to avoid storing plaintext
    const crypto = require('crypto');
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
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.MASTER_KEY || 'default-key', 'salt', 32);
    const { iv, authTag, data } = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    return decipher.update(Buffer.from(data, 'hex'), 'hex', 'utf8') + decipher.final('utf8');
  }

  async storeCredentials(credentials: Credentials): Promise<void> {
    try {
      const envContent = `
${credentials.service.toUpperCase()}_USERNAME=${credentials.username}
${credentials.service.toUpperCase()}_PASSWORD=${credentials.password}
`;
      fs.appendFileSync(this.credentialsPath, envContent);
      logger.info(`Stored credentials for ${credentials.service}`);
    } catch (error) {
      logger.error('Failed to store credentials:', error);
      throw error;
    }
  }

  async getCredentials(service: string): Promise<Credentials | null> {
    try {
      const envContent = fs.readFileSync(this.credentialsPath, 'utf8');
      const lines = envContent.split('\n');

      const username = lines
        .find((line) => line.startsWith(`${service.toUpperCase()}_USERNAME=`))
        ?.split('=')[1];

      const password = lines
        .find((line) => line.startsWith(`${service.toUpperCase()}_PASSWORD=`))
        ?.split('=')[1];

      if (username && password) {
        return {
          username,
          password,
          service,
        };
      }
      return null;
    } catch (error) {
      logger.error('Failed to get credentials:', error);
      throw error;
    }
  }

  async storePaymentInfo(info: PaymentInfo): Promise<void> {
    try {
      const encryptedData = this.encryptData(JSON.stringify(info));
      fs.writeFileSync(this.paymentInfoPath, encryptedData, { mode: 0o600 }); // Restricted permissions
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
      const encryptedData = fs.readFileSync(this.paymentInfoPath, 'utf8');
      const decryptedData = this.decryptData(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      logger.error('Failed to get payment information:', error);
      throw error;
    }
  }
}
