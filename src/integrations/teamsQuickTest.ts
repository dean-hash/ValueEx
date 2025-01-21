import { DefaultAzureCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

async function quickTest() {
    try {
        // Use Azure CLI credentials
        const credential = new DefaultAzureCredential();
        
        const authProvider = new TokenCredentialAuthenticationProvider(credential, {
            scopes: ['https://graph.microsoft.com/.default']
        });

        const client = Client.initWithMiddleware({
            authProvider: authProvider
        });

        // Simple test - get current user
        const user = await client.api('/me').get();
        console.log('Connected as:', user.displayName);
        
        return true;
    } catch (error) {
        console.error('Test failed:', error);
        return false;
    }
}

quickTest().then(success => {
    if (success) {
        console.log('Teams connection test successful!');
    } else {
        console.log('Teams connection test failed.');
    }
});
