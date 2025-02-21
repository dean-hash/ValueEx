import { ClientSecretCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { Client } from '@microsoft/microsoft-graph-client';
import { logger } from '../utils/logger';

export class AuthConfig {
  private static instance: AuthConfig;
  private graphClient: Client | null = null;

  private constructor() {}

  static getInstance(): AuthConfig {
    if (!AuthConfig.instance) {
      AuthConfig.instance = new AuthConfig();
    }
    return AuthConfig.instance;
  }

  async getGraphClient(): Promise<Client> {
    if (this.graphClient) {
      return this.graphClient;
    }

    try {
      // Initialize with cascade@divvytech.com credentials
      const credential = new ClientSecretCredential(
        '54fdd9af-67c8-4d3f-b8da-838eae06187a', // tenant ID
        'ba23cd2a-306c-48f2-9d62-d3ecd372dfe4', // client ID
        process.env.AZURE_CLIENT_SECRET || '' // client secret
      );

      const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: [
          'https://graph.microsoft.com/.default',
          'Chat.ReadWrite',
          'ChatMessage.Send',
          'Files.ReadWrite.All',
          'Sites.ReadWrite.All',
          'Mail.ReadWrite',
          'User.Read.All',
        ],
      });

      this.graphClient = Client.initWithMiddleware({
        authProvider: authProvider,
      });

      return this.graphClient;
    } catch (error) {
      logger.error('Failed to initialize Graph client:', error);
      throw error;
    }
  }

  async getTeamsClient(): Promise<Client> {
    try {
      const credential = new ClientSecretCredential(
        '045b7d24-2664-418d-9988-73ec9a607ba3', // tenant ID
        '1464194b-a33c-4936-96b2-ae3b3daa7577', // client ID
        process.env.TEAMS_CLIENT_SECRET || '' // client secret
      );

      const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default'],
      });

      return Client.initWithMiddleware({
        authProvider: authProvider,
      });
    } catch (error) {
      logger.error('Failed to initialize Teams client:', error);
      throw error;
    }
  }
}
