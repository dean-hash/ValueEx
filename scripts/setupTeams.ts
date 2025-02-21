import { TeamsSetup } from '../src/integrations/teamsSetup';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    const setup = new TeamsSetup();

    console.log('Starting Teams environment cleanup...');
    await setup.cleanupEnvironment();
    console.log('Cleanup complete');

    console.log('Setting up new Teams environment...');
    await setup.setupNewEnvironment();
    console.log('Setup complete');

    console.log('Teams environment successfully configured!');
    console.log('You can now use the Voice Collaboration channel for direct communication.');
  } catch (error) {
    console.error('Error during setup:', error);
    process.exit(1);
  }
}

main();
