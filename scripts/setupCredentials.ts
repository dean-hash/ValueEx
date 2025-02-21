import { SecureStore } from '../src/config/secureStore';
import { logger } from '../src/utils/logger';

async function setupCredentials() {
  const store = SecureStore.getInstance();

  // Store email credentials
  await store.storeCredential({
    service: 'email',
    username: 'dean@collaborativeintelligence.world',
    password: process.env.EMAIL_PASSWORD || '',
    notes: 'Microsoft 365 Email',
  });

  // Store OpenAI credentials
  await store.storeCredential({
    service: 'openai',
    username: 'dean@divvytech.com',
    password: process.env.OPENAI_API_KEY || '',
    notes: 'OpenAI API',
  });

  // Store Gemini credentials
  await store.storeCredential({
    service: 'gemini',
    username: 'dean@divvytech.com',
    password: process.env.GEMINI_API_KEY || '',
    notes: 'Google Gemini API',
  });

  // Store Teams credentials
  await store.storeCredential({
    service: 'teams',
    username: 'Cascade@divvytech.com',
    password: process.env.TEAMS_CLIENT_SECRET || '',
    notes: 'Microsoft Teams API',
  });

  // Store Azure Communication Services credentials
  await store.storeCredential({
    service: 'azurecomms',
    username: 'DefaultResourceGroup-EUS',
    password: process.env.AZURE_COMMS_CONNECTION_STRING || '',
    notes: 'Azure Communication Services',
  });

  logger.info('Credentials stored securely');

  // Verify storage
  const emailCreds = await store.getCredential('email');
  const openaiCreds = await store.getCredential('openai');
  const geminiCreds = await store.getCredential('gemini');
  const teamsCreds = await store.getCredential('teams');
  const azureCommsCreds = await store.getCredential('azurecomms');

  logger.info('Stored credentials:', {
    email: emailCreds?.username,
    openai: openaiCreds?.username,
    gemini: geminiCreds?.username,
    teams: teamsCreds?.username,
    azureComms: azureCommsCreds?.username,
  });
}

setupCredentials();
