import { credentialManager } from '../src/config/unifiedCredentials';
import { logger } from '../src/utils/logger';
import * as readline from 'readline';
import { promisify } from 'util';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

async function configureCredentials() {
  try {
    logger.info('ValueEx Credential Configuration');
    logger.info('===============================');

    // Configure Google Services (Gemini & Firebase)
    logger.info('\nGoogle Services Configuration:');
    const googleAccount = await question('Which Google account are you using? [dean@divvytech.com/dean@collaborativeintelligence.world]: ');
    
    // Gemini API Key
    const geminiKey = await question('Enter your Gemini API key: ');
    if (geminiKey) {
      await credentialManager.setCredential({
        service: 'gemini',
        username: googleAccount,
        envKey: 'GEMINI_API_KEY',
        notes: 'Google Gemini API Key'
      }, geminiKey);
    }

    // Firebase Configuration
    logger.info('\nFirebase Configuration:');
    const firebaseProjectId = await question('Enter your Firebase project ID: ');
    const firebasePrivateKey = await question('Enter your Firebase private key (from service account JSON): ');
    const firebaseClientEmail = await question('Enter your Firebase client email: ');
    
    if (firebaseProjectId && firebasePrivateKey && firebaseClientEmail) {
      await credentialManager.setCredential({
        service: 'firebase',
        username: googleAccount,
        envKey: 'FIREBASE_PROJECT_ID',
        notes: 'Firebase Configuration'
      }, JSON.stringify({
        projectId: firebaseProjectId,
        privateKey: firebasePrivateKey,
        clientEmail: firebaseClientEmail,
        databaseURL: `https://${firebaseProjectId}.firebaseio.com`
      }));
    }

    // Validate all credentials
    const isValid = await credentialManager.validateCredentials();
    if (isValid) {
      logger.info('🎉 All credentials configured successfully!');
    } else {
      logger.warn('Some credentials are missing. Please run this script again to configure them.');
    }

  } catch (error) {
    logger.error('Error configuring credentials:', error);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  configureCredentials();
}
