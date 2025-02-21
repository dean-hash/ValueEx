import { CredentialsManager } from '../config/credentialsManager';

async function storeInitialCredentials() {
  const manager = CredentialsManager.getInstance();

  await manager.storeCredentials({
    service: 'godaddy',
    username: 'dean@divvytech.com',
    password: '142OsborneAve.',
  });

  console.log('Credentials stored successfully');
}

storeInitialCredentials();
