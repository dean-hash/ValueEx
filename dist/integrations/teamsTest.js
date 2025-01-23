"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const azureTokenCredentials_1 = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
const identity_1 = require("@azure/identity");
async function testTeamsConnection() {
    try {
        // Initialize the auth provider
        const credential = new identity_1.ClientSecretCredential(process.env.TENANT_ID, process.env.CLIENT_ID, process.env.CLIENT_SECRET);
        const authProvider = new azureTokenCredentials_1.TokenCredentialAuthenticationProvider(credential, {
            scopes: ['https://graph.microsoft.com/.default']
        });
        // Initialize the Graph client
        const graphClient = microsoft_graph_client_1.Client.initWithMiddleware({
            authProvider: authProvider
        });
        // Test connection by getting current user
        const user = await graphClient.api('/me').get();
        console.log('Connected successfully as:', user.displayName);
        // Test Teams access
        const teams = await graphClient.api('/teams').get();
        console.log('Successfully accessed Teams');
        return true;
    }
    catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
}
testTeamsConnection()
    .then(success => {
    if (success) {
        console.log('Teams connection test passed!');
        process.exit(0);
    }
    else {
        console.log('Teams connection test failed!');
        process.exit(1);
    }
})
    .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
//# sourceMappingURL=teamsTest.js.map