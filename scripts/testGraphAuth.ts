import { Client } from '@microsoft/microsoft-graph-client';
import { logger } from '../src/utils/logger';

async function testGraphAuth() {
  try {
    // Initialize Graph client with client credentials
    const client = Client.init({
      authProvider: async (done) => {
        // Use your existing client ID and secret
        const clientId = '24053b0c-bf45-4da5-9910-1b0d1f63d';
        const tenantId = '045b7d24-2664-418d-9988-73ec9a6';

        // Get token using client credentials
        const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            scope: 'https://graph.microsoft.com/.default',
            grant_type: 'client_credentials',
          }),
        });

        const data = await response.json();
        done(null, data.access_token);
      },
    });

    // Test the connection
    const me = await client.api('/users').get();
    console.log('Connection successful!');
    console.log(
      'Users:',
      me.value.map((u: any) => u.displayName)
    );
  } catch (error) {
    logger.error('Failed to authenticate:', error);
    console.error('Error details:', error);
  }
}

testGraphAuth();
