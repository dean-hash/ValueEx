import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

interface SecureCredential {
  service: string;
  username: string;
  password: string;
  notes?: string;
}

export class SecureStore {
  private static instance: SecureStore;
  private storePath: string;
  private masterKey: Buffer;

  private constructor() {
    this.storePath = path.join(process.cwd(), '.secure', 'credentials.enc');
    // In production, this should come from a hardware security module or secure environment variable
    const salt = 'ValueEx_Salt'; // This should be randomly generated and stored securely
    this.masterKey = scryptSync(process.env.MASTER_KEY || 'default-master-key', salt, 32);
    this.ensureSecureDirectory();
  }

  static getInstance(): SecureStore {
    if (!SecureStore.instance) {
      SecureStore.instance = new SecureStore();
    }
    return SecureStore.instance;
  }

  private ensureSecureDirectory() {
    const secureDir = path.dirname(this.storePath);
    if (!fs.existsSync(secureDir)) {
      fs.mkdirSync(secureDir, { mode: 0o700 }); // Restricted permissions
    }
  }

  private encrypt(data: string): { iv: string; encryptedData: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted.toString('hex') + ':' + authTag.toString('hex')
    };
  }

  private decrypt(encryptedData: string, iv: string): string {
    const [data, authTag] = encryptedData.split(':');
    const decipher = createDecipheriv('aes-256-gcm', this.masterKey, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    return decipher.update(Buffer.from(data, 'hex'), 'hex', 'utf8') + 
           decipher.final('utf8');
  }

  async storeCredential(credential: SecureCredential): Promise<void> {
    try {
      let credentials = await this.getAllCredentials();
      credentials = credentials.filter(c => c.service !== credential.service);
      credentials.push(credential);

      const encrypted = this.encrypt(JSON.stringify(credentials));
      const data = JSON.stringify(encrypted);
      
      fs.writeFileSync(this.storePath, data, { mode: 0o600 }); // Restricted permissions
      logger.info(`Stored credentials for ${credential.service}`);
    } catch (error) {
      logger.error('Failed to store credentials:', error);
      throw error;
    }
  }

  async getCredential(service: string): Promise<SecureCredential | null> {
    try {
      const credentials = await this.getAllCredentials();
      return credentials.find(c => c.service === service) || null;
    } catch (error) {
      logger.error('Failed to get credentials:', error);
      throw error;
    }
  }

  private async getAllCredentials(): Promise<SecureCredential[]> {
    try {
      if (!fs.existsSync(this.storePath)) {
        return [];
      }

      const data = fs.readFileSync(this.storePath, 'utf8');
      const { iv, encryptedData } = JSON.parse(data);
      const decrypted = this.decrypt(encryptedData, iv);
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Failed to get all credentials:', error);
      return [];
    }
  }

  async updateMasterKey(newMasterKey: string): Promise<void> {
    try {
      // Get all credentials with old key
      const credentials = await this.getAllCredentials();
      
      // Update master key
      const salt = 'ValueEx_Salt';
      this.masterKey = scryptSync(newMasterKey, salt, 32);
      
      // Re-encrypt all credentials with new key
      const encrypted = this.encrypt(JSON.stringify(credentials));
      const data = JSON.stringify(encrypted);
      
      fs.writeFileSync(this.storePath, data, { mode: 0o600 });
      logger.info('Master key updated successfully');
    } catch (error) {
      logger.error('Failed to update master key:', error);
      throw error;
    }
  }
}
