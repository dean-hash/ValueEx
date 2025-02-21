import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { logger } from '../../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

interface DynamicsContact {
  id?: string;
  givenName: string;
  surname: string;
  emailAddresses: Array<{ address: string }>;
  companyName?: string;
}

interface DynamicsOpportunity {
  id?: string;
  title: string;
  description?: string;
  estimatedValue?: number;
  status: string;
  contactId: string;
}

export class DynamicsClient {
  private client: Client;
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly resourceUrl: string;

  constructor() {
    this.tenantId = process.env.DYNAMICS_TENANT_ID || '';
    this.clientId = process.env.DYNAMICS_CLIENT_ID || '';
    this.clientSecret = process.env.DYNAMICS_CLIENT_SECRET || '';
    this.resourceUrl = process.env.DYNAMICS_RESOURCE_URL || '';

    if (!this.tenantId || !this.clientId || !this.clientSecret || !this.resourceUrl) {
      throw new Error('Dynamics credentials are required');
    }

    const credential = new ClientSecretCredential(this.tenantId, this.clientId, this.clientSecret);

    this.client = Client.init({
      authProvider: async (done) => {
        try {
          const token = await credential.getToken('https://graph.microsoft.com/.default');
          done(null, token.token);
        } catch (error) {
          logger.error('Failed to get token:', error);
          done(error as Error, null);
        }
      },
    });
  }

  public async createContact(contact: DynamicsContact): Promise<string> {
    try {
      const response = await this.client.api('/users').post({
        givenName: contact.givenName,
        surname: contact.surname,
        mail: contact.emailAddresses[0]?.address,
        companyName: contact.companyName,
      });

      return response.id;
    } catch (error) {
      logger.error('Failed to create contact:', error);
      throw error;
    }
  }

  public async updateContact(contactId: string, contact: Partial<DynamicsContact>): Promise<void> {
    try {
      await this.client.api(`/users/${contactId}`).patch({
        givenName: contact.givenName,
        surname: contact.surname,
        mail: contact.emailAddresses?.[0]?.address,
        companyName: contact.companyName,
      });
    } catch (error) {
      logger.error('Failed to update contact:', error);
      throw error;
    }
  }

  public async createOpportunity(
    opportunity: DynamicsOpportunity
  ): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.api('/opportunities').post({
        title: opportunity.title,
        description: opportunity.description,
        estimatedValue: opportunity.estimatedValue,
        status: opportunity.status,
        contactId: opportunity.contactId,
      });

      return response;
    } catch (error) {
      logger.error('Failed to create opportunity:', error);
      throw error;
    }
  }
}
