import { Client } from '@microsoft/microsoft-graph-client';
import { logger } from '../../utils/logger';
import { SecureStore } from '../../config/secureStore';

export class GraphService {
  private static instance: GraphService;
  private client: Client;
  private secureStore: SecureStore;

  private constructor() {
    this.secureStore = SecureStore.getInstance();

    // Use existing Office 365 connection
    const existingConfig = {
      connectionName: 'office365',
      resourceGroup: 'DefaultResourceGroup-EUS',
      subscription: 'Azure subscription 1',
    };

    // Initialize Microsoft Graph client using existing connection
    this.client = Client.initWithMiddleware({
      authProvider: new CustomAuthProvider(existingConfig),
    });
  }

  static getInstance(): GraphService {
    if (!GraphService.instance) {
      GraphService.instance = new GraphService();
    }
    return GraphService.instance;
  }

  async forwardEmail(message: any, toAddress: string, analysis: string): Promise<void> {
    try {
      // Create forward message
      const forwardMessage = {
        message: {
          subject: `Fwd: ${message.subject}`,
          body: {
            contentType: 'HTML',
            content: `
              <h3>Original Email</h3>
              <p><strong>From:</strong> ${message.from.text}</p>
              <p><strong>Subject:</strong> ${message.subject}</p>
              <hr>
              <div>${message.html || message.text}</div>
              <hr>
              <h3>AI Analysis</h3>
              <pre>${analysis}</pre>
            `,
          },
          toRecipients: [
            {
              emailAddress: {
                address: toAddress,
              },
            },
          ],
        },
      };

      // Send using Graph API
      await this.client.api('/me/sendMail').post(forwardMessage);

      logger.info('Email forwarded successfully', {
        to: toAddress,
        subject: message.subject,
      });
    } catch (error) {
      logger.error('Failed to forward email:', error);
      throw error;
    }
  }

  async createSharedMailbox(name: string, email: string): Promise<void> {
    try {
      // Create shared mailbox
      const mailbox = {
        displayName: name,
        alias: email.split('@')[0],
        emailAddresses: [`${email}`],
      };

      await this.client.api('/users').post(mailbox);

      logger.info('Shared mailbox created successfully', {
        name,
        email,
      });
    } catch (error) {
      logger.error('Failed to create shared mailbox:', error);
      throw error;
    }
  }

  async grantMailboxAccess(mailboxEmail: string, userEmail: string): Promise<void> {
    try {
      const permission = {
        emailAddress: {
          address: userEmail,
        },
        roles: ['Mail.ReadWrite'],
      };

      await this.client
        .api(`/users/${mailboxEmail}/mailboxSettings/delegateMeetingMessageDelivery`)
        .patch(permission);

      logger.info('Mailbox access granted', {
        mailbox: mailboxEmail,
        user: userEmail,
      });
    } catch (error) {
      logger.error('Failed to grant mailbox access:', error);
      throw error;
    }
  }
}

// Custom auth provider that uses existing Office 365 connection
class CustomAuthProvider {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async getAccessToken(): Promise<string> {
    try {
      // Use existing connection token
      // This leverages your already-working Office 365 connection
      return process.env.OFFICE365_TOKEN || '';
    } catch (error) {
      logger.error('Failed to get access token:', error);
      throw error;
    }
  }
}
