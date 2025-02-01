import { DefaultAzureCredential } from '@azure/identity';
import { ResourceManagementClient } from '@azure/arm-resources';
import { RedisManagementClient } from '@azure/arm-rediscache';
import dotenv from 'dotenv';

dotenv.config();

const RESOURCE_GROUP = process.env.AZURE_RESOURCE_GROUP || 'valueex-prod';
const REDIS_NAME = 'valueex-redis';
const LOCATION = 'eastus';

async function setupRedis(): Promise<void> {
  try {
    const credential = new DefaultAzureCredential();
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

    if (!subscriptionId) {
      throw new Error('AZURE_SUBSCRIPTION_ID environment variable is required');
    }

    // Create Resource Management Client
    const resourceClient = new ResourceManagementClient(credential, subscriptionId);

    // Create Redis Management Client
    const redisClient = new RedisManagementClient(credential, subscriptionId);

    // Ensure resource group exists
    await resourceClient.resourceGroups.createOrUpdate(RESOURCE_GROUP, {
      location: LOCATION,
    });

    console.log(`Resource group ${RESOURCE_GROUP} is ready`);

    // Create Redis Cache
    const redisParams = {
      location: LOCATION,
      sku: {
        name: 'Basic',
        family: 'C',
        capacity: 0,
      },
      enableNonSslPort: false,
      minimumTlsVersion: '1.2',
      publicNetworkAccess: 'Enabled',
    };

    console.log('Creating Redis Cache...');
    const redis = await redisClient.redis.beginCreateAndWait(
      RESOURCE_GROUP,
      REDIS_NAME,
      redisParams
    );

    console.log('Redis Cache created successfully');

    // Get access keys
    const keys = await redisClient.redis.listKeys(RESOURCE_GROUP, REDIS_NAME);
    const connectionString = `${redis.hostName}:${redis.sslPort},password=${keys.primaryKey},ssl=True,abortConnect=False`;

    console.log('\nAdd this to your .env file:');
    console.log(`REDIS_CONNECTION_STRING=${connectionString}`);
  } catch (error) {
    console.error('Failed to set up Redis:', error);
    process.exit(1);
  }
}

// Execute setup
setupRedis().catch(console.error);
