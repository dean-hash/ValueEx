import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { logger } from '../../src/utils/logger';

export async function setupSecureCredentials() {
  try {
    // Use managed identity or default credentials
    const credential = new DefaultAzureCredential();

    // Initialize secure credential storage
    const vaultName = 'valueex-credentials';
    const vaultUrl = `https://${vaultName}.vault.azure.net`;

    const secretClient = new SecretClient(vaultUrl, credential);

    // Store credentials securely
    await secretClient.setSecret('AZURE-ADMIN-EMAIL', 'cascade@divvytech.com');

    logger.info('Credentials stored securely in Azure Key Vault');

    // Test Graph API access
    const graphCredential = new ClientSecretCredential(
      '54fdd9af-67c8-4d3f-b8da-838eae06187a', // tenant ID from subscription
      'ba23cd2a-306c-48f2-9d62-d3ecd372dfe4', // client ID
      process.env.AZURE_CLIENT_SECRET || ''
    );

    const token = await graphCredential.getToken('https://graph.microsoft.com/.default');
    if (token) {
      logger.info('Successfully authenticated with Graph API');
    }
  } catch (error) {
    logger.error('Failed to set up secure credentials:', error);
    throw error;
  }
}

// Only run if called directly
if (require.main === module) {
  setupSecureCredentials().catch(console.error);
}
