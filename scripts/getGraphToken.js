"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentials = void 0;
exports.getGraphToken = getGraphToken;
const identity_1 = require("@azure/identity");
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const azureTokenCredentials_1 = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
// Direct credential management
const credentials = {
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET
};
exports.credentials = credentials;
async function getGraphToken() {
    try {
        const credential = new identity_1.ClientSecretCredential(credentials.tenantId, credentials.clientId, credentials.clientSecret);
        const scopes = [
            'https://graph.microsoft.com/.default',
            'Calls.JoinGroupCall.All',
            'Calls.InitiateGroupCall.All',
            'OnlineMeetings.ReadWrite.All',
            'User.Read.All'
        ];
        const authProvider = new azureTokenCredentials_1.TokenCredentialAuthenticationProvider(credential, {
            scopes: scopes
        });
        const client = microsoft_graph_client_1.Client.initWithMiddleware({
            authProvider: authProvider
        });
        // Get current user info
        const me = await client.api('/me').get();
        // Get communication token for real-time features
        const commToken = await getCommunicationToken(credential);
        const config = {
            token: (await credential.getToken(scopes[0])).token,
            userId: me.id,
            displayName: me.displayName,
            tenantId: credentials.tenantId,
            communicationToken: commToken
        };
        return config;
    }
    catch (error) {
        console.error('Teams setup error:', error);
        throw error;
    }
}
async function getCommunicationToken(credential) {
    // Implementation will connect to Azure Communication Services
    // This will be used for speech services integration
    return "placeholder-for-comm-token";
}
// Only run if called directly
if (require.main === module) {
    getGraphToken()
        .then(config => {
        console.log('\nTeams configuration ready!');
        console.log(`Connected as: ${config.displayName}`);
        console.log(`User ID: ${config.userId}`);
    })
        .catch(error => {
        console.error('Failed to initialize Teams:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=getGraphToken.js.map