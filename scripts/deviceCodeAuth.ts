import { PublicClientApplication } from '@azure/msal-node';
import { logger } from '../src/utils/logger';

async function getDeviceCodeToken() {
  try {
    const clientId = '24053b0c-bf45-4da5-9910-1b0d1f63d';
    const tenantId = '045b7d24-2664-418d-9988-73ec9a6';

    const msalConfig = {
      auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`
      }
    };

    const pca = new PublicClientApplication(msalConfig);

    const deviceCodeRequest = {
      deviceCodeCallback: (response: any) => {
        // Display message to user
        console.log(response.message);
      },
      scopes: ['https://graph.microsoft.com/.default']
    };

    const response = await pca.acquireTokenByDeviceCode(deviceCodeRequest);
    
    if (response) {
      console.log('\nAdd this to your .env file:');
      console.log(`OFFICE365_TOKEN=${response.accessToken}`);
    }

  } catch (error) {
    logger.error('Failed to get token:', error);
    console.error('Error details:', error);
  }
}

getDeviceCodeToken();
