import { logger } from '../utils/logger';

interface AzureConfigType {
  tenant: {
    id: string;
    domain: string;
  };
  auth: {
    clientId: string;
    clientSecret: string;
  };
  endpoints: {
    graph: string;
  };
}

export const AzureConfig: AzureConfigType = {
  tenant: {
    id: process.env.AZURE_TENANT_ID || '', // Divvy Technologies Inc tenant
    domain: process.env.AZURE_TENANT_DOMAIN || 'divvytech.com',
  },
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || '', // From App Registration
    clientSecret: process.env.AZURE_CLIENT_SECRET || '', // Generated in Azure Portal
  },
  endpoints: {
    graph: 'https://graph.microsoft.com',
  },
};

if (!AzureConfig.tenant.id || !AzureConfig.auth.clientId || !AzureConfig.auth.clientSecret) {
  logger.warn('Azure configuration is incomplete. Some features may not work.');
}

// Required permissions:
// - Mail.Read: Read user mail
// - Mail.Send: Send mail as user
// - Mail.ReadWrite: Create, read, update mail
// - User.Read: Sign in and read user profile
// - Directory.Read.All: Read directory data
