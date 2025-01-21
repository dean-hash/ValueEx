export const AzureConfig = {
  tenant: {
    id: '045b7d24-2664-418d-9988-73ec9a6', // Divvy Technologies Inc tenant
    domain: 'divvytech.com'
  },
  auth: {
    clientId: '', // We'll need the client ID from App Registration
    clientSecret: '' // We'll need to generate this in Azure Portal
  },
  endpoints: {
    graph: 'https://graph.microsoft.com'
  }
};

// Roles and permissions required:
// - Mail.Read
// - Mail.Send
// - Mail.ReadWrite
// - User.Read
// - Directory.Read.All
