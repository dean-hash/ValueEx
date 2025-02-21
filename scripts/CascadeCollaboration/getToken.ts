import { ClientSecretCredential } from '@azure/identity';

async function getTeamsToken() {
  try {
    // Initialize credential with admin privileges
    const credential = new ClientSecretCredential(
      '045b7d24-2664-418d-9988-73ec9a607ba3', // tenant ID
      '1464194b-a33c-4936-96b2-ae3b3daa7577', // client ID
      process.env.TEAMS_CLIENT_SECRET || '' // client secret
    );

    // Get token with all required scopes
    const token = await credential.getToken('https://graph.microsoft.com/.default');

    // Set token in environment
    process.env.TEAMS_TOKEN = token.token;
    console.log('Teams token acquired and set in environment');
  } catch (error) {
    console.error('Failed to get Teams token:', error);
    process.exit(1);
  }
}

getTeamsToken();
