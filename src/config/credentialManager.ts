import { config } from 'dotenv';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';

// Load environment variables
config();

interface EncryptedCredentials {
  encrypted: string;
  iv: string;
}

export class CredentialManager {
  private static instance: CredentialManager;
  private encryptionKey: Buffer;

  private constructor() {
    // Use a secure environment variable for the encryption key
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable must be set');
    }
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
  }

  public static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager();
    }
    return CredentialManager.instance;
  }

  public encrypt(value: string): EncryptedCredentials {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
    };
  }

  public decrypt(encrypted: EncryptedCredentials): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(encrypted.iv, 'hex')
    );

    let decrypted = decipher.update(encrypted.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  public async validateCredentials(): Promise<boolean> {
    try {
      // Validate required environment variables
      const requiredVars = [
        'OPENAI_API_KEY',
        'VALUEX_SERVICE_ACCOUNT',
        'AWIN_API_TOKEN',
        'GOOGLE_TRENDS_API_KEY',
      ];

      const missingVars = requiredVars.filter((v) => !process.env[v]);

      if (missingVars.length > 0) {
        logger.error('Missing required environment variables:', missingVars);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating credentials:', error);
      return false;
    }
  }
}

export const credentialManager = CredentialManager.getInstance();
