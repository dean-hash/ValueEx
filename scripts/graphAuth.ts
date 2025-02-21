import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { logger } from '../src/utils/logger';

async function getGraphClient() {
  try {
    console.log('Initializing Graph client...');

    // Initialize the client credentials
    const credential = new ClientSecretCredential(
      '54fdd9af-67c8-4d3f-b8da-838eae06187a', // tenant ID
      'ba23cd2a-306c-48f2-9d62-d3ecd372dfe4', // client ID
      process.env.AZURE_CLIENT_SECRET || '' // client secret
    );

    // Create an authentication provider
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: [
        'https://graph.microsoft.com/.default',
        'Chat.ReadWrite',
        'ChatMessage.Send',
        'ChatMember.ReadWrite.All',
        'OnlineMeetings.ReadWrite.All',
      ],
    });

    // Initialize the Graph client
    const graphClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });

    console.log('Testing connection...');

    // Test the connection by getting user profile
    const user = await graphClient.api('/users').top(1).get();
    console.log('Successfully connected to Microsoft Graph!');
    console.log('Sample user:', user.value[0].displayName);

    // Test sending an email
    await graphClient.api('/users/dean@divvytech.com/sendMail').post({
      message: {
        subject: 'Test Email from Graph API',
        body: {
          contentType: 'Text',
          content: 'This is a test email sent using Microsoft Graph API',
        },
        toRecipients: [
          {
            emailAddress: {
              address: 'dean@divvytech.com',
            },
          },
        ],
      },
    });

    console.log('Test email sent successfully!');
    return graphClient;
  } catch (error: any) {
    logger.error('Failed to initialize Graph client:', error);
    console.error('\nError details:', error);

    if (error.message?.includes('unauthorized_client')) {
      console.log('\nPossible issues:');
      console.log('1. Client secret is missing or invalid');
      console.log('2. Application does not have the required permissions');
      console.log('3. Tenant ID or client ID is incorrect');
    }

    throw error;
  }
}

// Execute the function
getGraphClient().catch((error) => {
  console.error('Failed to execute:', error);
  process.exit(1);
});
