import { SecureStore } from './secureStore';
import { ENV_CONFIG } from '../../config/env.production';
import { logger } from '../utils/logger';

export interface CredentialConfig {
  service: string;
  username: string;
  envKey?: string;
  notes?: string;
}

class UnifiedCredentialManager {
  private static instance: UnifiedCredentialManager;
  private store: SecureStore;

  private constructor() {
    this.store = SecureStore.getInstance();
  }

  static getInstance(): UnifiedCredentialManager {
    if (!UnifiedCredentialManager.instance) {
      UnifiedCredentialManager.instance = new UnifiedCredentialManager();
    }
    return UnifiedCredentialManager.instance;
  }

  async getCredential(service: string): Promise<string | null> {
    try {
      const credential = await this.store.getCredential(service);
      if (!credential?.password) {
        // Fallback to environment variable if exists
        const envValue = process.env[`${service.toUpperCase()}_API_KEY`];
        if (envValue) {
          logger.info(`Using ${service} credential from environment`);
          return envValue;
        }
        return null;
      }
      return credential.password;
    } catch (error) {
      logger.error('Error getting credential', { context: { service, error }});
      return null;
    }
  }

  async setCredential(config: CredentialConfig, value: string): Promise<void> {
    try {
      await this.store.storeCredential({
        service: config.service,
        username: config.username,
        password: value,
        notes: config.notes
      });

      // If there's an env key, also set it in process.env
      if (config.envKey) {
        process.env[config.envKey] = value;
      }

      logger.info(`Stored credential for ${config.service}`);
    } catch (error) {
      logger.error('Error storing credential', { context: { service: config.service, error }});
      throw error;
    }
  }

  async validateCredentials(): Promise<boolean> {
    const requiredCredentials = [
      { service: 'gemini', name: 'Gemini API' },
      { service: 'firebase', name: 'Firebase' },
      { service: 'awin', name: 'Awin' },
      { service: 'openai', name: 'OpenAI API' }
    ];

    let allValid = true;
    const missing: string[] = [];

    for (const cred of requiredCredentials) {
      const value = await this.getCredential(cred.service);
      if (!value) {
        allValid = false;
        missing.push(cred.name);
      }
    }

    if (!allValid) {
      logger.warn('Missing required credentials', { context: { missing }});
    } else {
      logger.info('All required credentials are configured');
    }

    return allValid;
  }
}

export const credentialManager = UnifiedCredentialManager.getInstance();
