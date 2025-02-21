"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const identity_1 = require("@azure/identity");
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const azureTokenCredentials_1 = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
async function quickTest() {
    try {
        // Use Azure CLI credentials
        const credential = new identity_1.DefaultAzureCredential();
        const authProvider = new azureTokenCredentials_1.TokenCredentialAuthenticationProvider(credential, {
            scopes: ['https://graph.microsoft.com/.default']
        });
        const client = microsoft_graph_client_1.Client.initWithMiddleware({
            authProvider: authProvider
        });
        // Simple test - get current user
        const user = await client.api('/me').get();
        console.log('Connected as:', user.displayName);
        return true;
    }
    catch (error) {
        console.error('Test failed:', error);
        return false;
    }
}
quickTest().then(success => {
    if (success) {
        console.log('Teams connection test successful!');
    }
    else {
        console.log('Teams connection test failed.');
    }
});
//# sourceMappingURL=teamsQuickTest.js.map