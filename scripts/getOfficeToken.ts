import { DefaultAzureCredential } from '@azure/identity';
import { ResourceManagementClient } from '@azure/arm-resources';
import { logger } from '../src/utils/logger';

async function getOfficeToken() {
  try {
    const subscriptionId = 'Azure subscription 1';
    const credential = new DefaultAzureCredential();
    const client = new ResourceManagementClient(credential, subscriptionId);

    // Get the Office 365 connection
    const result = await client.resources.getById(
      '/subscriptions/Azure subscription 1/resourceGroups/DefaultResourceGroup-EUS/providers/Microsoft.Web/connections/office365',
      '2016-06-01'
    );

    if (result && result.properties) {
      console.log('Connection found!');

      // Store the token in .env
      console.log('\nAdd this to your .env file:');
      console.log(`OFFICE365_TOKEN=${result.properties.api?.id || ''}`);
    } else {
      console.log('No connection properties found');
    }
  } catch (error) {
    logger.error('Failed to get Office 365 token:', error);
    console.error('Error details:', error);
  }
}

getOfficeToken();
