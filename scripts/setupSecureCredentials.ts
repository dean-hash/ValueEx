import { SecureStore } from '../src/config/secureStore';
import { logger } from '../src/utils/logger';
import { randomBytes } from 'crypto';

async function setupSecureCredentials() {
  try {
    const store = SecureStore.getInstance();

    // Generate a secure master key
    const masterKey = randomBytes(32).toString('hex');
    console.log(
      '\nIMPORTANT: Save this master key securely. You will need it to access your credentials.'
    );
    console.log(`Master Key: ${masterKey}\n`);

    // Update the master key
    await store.updateMasterKey(masterKey);

    // Create a .env.template file for reference
    const envTemplate = `
# ValueEx Environment Variables
# DO NOT commit the actual .env file to version control

# Master Key for Secure Store
MASTER_KEY=your_master_key_here

# Microsoft Graph API
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret

# Email Configuration
AOA_EMAIL_PASSWORD=your_password
COLLAB_EMAIL_PASSWORD=your_password

# API Keys
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key
`;

    // Instructions for secure setup
    console.log('Follow these steps to secure your credentials:');
    console.log('1. Save the master key in a password manager');
    console.log('2. Create a .env file with the template above');
    console.log('3. Fill in your credentials in the .env file');
    console.log('4. Enable 2FA on all services');
    console.log('5. Use unique passwords for each service\n');

    // Migration checklist
    const services = [
      'lemonsqueezy.com',
      'codeium.com',
      'salesgenie.com',
      'wellsfargo.com',
      'n8n.cloud',
      'automateed.com',
      'facebook.com',
      'chatgptaihub.com',
      'getrewardful.com',
      'awin.com',
      'ed-data.com',
    ];

    console.log('Security Migration Checklist:');
    services.forEach((service, index) => {
      console.log(`□ ${index + 1}. Change password for ${service}`);
    });

    // Store service URLs for reference
    await store.storeCredential({
      service: 'service_urls',
      username: 'reference',
      password: 'reference',
      notes: JSON.stringify(services),
    });

    logger.info('Secure credential setup complete');
  } catch (error) {
    logger.error('Failed to setup secure credentials:', error);
    throw error;
  }
}

setupSecureCredentials();
