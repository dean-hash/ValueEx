import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

interface TeamsConfig {
  token: string;
  userId: string;
  displayName: string;
  tenantId: string;
  communicationToken?: string;
}

// Direct credential management
const credentials = {
  tenantId: process.env.AZURE_TENANT_ID,
  clientId: process.env.AZURE_CLIENT_ID,
  clientSecret: process.env.AZURE_CLIENT_SECRET,
};

async function getGraphToken(): Promise<TeamsConfig> {
  try {
    const credential = new ClientSecretCredential(
      credentials.tenantId!,
      credentials.clientId!,
      credentials.clientSecret!
    );

    const scopes = [
      'https://graph.microsoft.com/.default',
      'Calls.JoinGroupCall.All',
      'Calls.InitiateGroupCall.All',
      'OnlineMeetings.ReadWrite.All',
      'User.Read.All',
    ];

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: scopes,
    });

    const client = Client.initWithMiddleware({
      authProvider: authProvider,
    });

    // Get current user info
    const me = await client.api('/me').get();

    // Get communication token for real-time features
    const commToken = await getCommunicationToken(credential);

    const config: TeamsConfig = {
      token: (await credential.getToken(scopes[0])).token,
      userId: me.id,
      displayName: me.displayName,
      tenantId: credentials.tenantId!,
      communicationToken: commToken,
    };

    return config;
  } catch (error) {
    console.error('Teams setup error:', error);
    throw error;
  }
}

async function getCommunicationToken(credential: ClientSecretCredential): Promise<string> {
  // Implementation will connect to Azure Communication Services
  // This will be used for speech services integration
  return 'placeholder-for-comm-token';
}

export { getGraphToken, TeamsConfig, credentials };

// Only run if called directly
if (require.main === module) {
  getGraphToken()
    .then((config) => {
      console.log('\nTeams configuration ready!');
      console.log(`Connected as: ${config.displayName}`);
      console.log(`User ID: ${config.userId}`);
    })
    .catch((error) => {
      console.error('Failed to initialize Teams:', error);
      process.exit(1);
    });
}
