import { Client } from '@microsoft/microsoft-graph-client';
import { DeviceCodeCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { logger } from '../src/utils/logger';

const tenantId = '045b7d24-2664-418d-9988-73ec9a607ba3';
const clientId = 'ba23cd2a-306c-48f2-9d62-d3ecd372dfe4';

async function getGraphAccess() {
  try {
    console.log('Initializing authentication...');

    // Initialize the Device Code Credential with more specific configuration
    const credential = new DeviceCodeCredential({
      tenantId,
      clientId,
      userPromptCallback: (info) => {
        console.log('\n=== Authentication Required ===');
        console.log(`1. Open this URL in your browser: ${info.verificationUri}`);
        console.log(`2. Enter this code: ${info.userCode}`);
        console.log('3. Sign in with your Microsoft account');
        console.log('===============================\n');
      },
    });

    console.log('Requesting token...');

    // Get an access token with default scope
    const scopes = ['https://graph.microsoft.com/.default'];

    const token = await credential.getToken(scopes);

    if (!token) {
      throw new Error('Failed to acquire token');
    }

    console.log('Token acquired successfully');

    // Create an authentication provider
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: scopes,
    });

    // Initialize the Graph client
    const graphClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });

    console.log('Testing Graph API connection...');

    // Test the connection
    const user = await graphClient.api('/me').get();
    console.log('Successfully connected!');
    console.log('User:', user.displayName);

    // Test sending an email
    console.log('Attempting to send test email...');

    await graphClient.api('/me/sendMail').post({
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
  } catch (error: any) {
    logger.error('Authentication failed:', error);
    console.error('\nError details:', error);

    if (typeof error.message === 'string' && error.message.includes('invalid_grant')) {
      console.log('\nPossible issues:');
      console.log('1. The application may not be configured for public client flows in Azure AD');
      console.log('2. The requested permissions may not be granted to the application');
      console.log('3. The tenant ID or client ID may be incorrect');
      console.log('\nPlease verify the Azure AD application configuration and try again.');
    }
  }
}

getGraphAccess();
