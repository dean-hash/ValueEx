import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { RedisConfig } from './src/services/cache/redisConfig';

dotenv.config();

const execAsync = promisify(exec);

async function deploy() {
  try {
    // 1. Run tests
    console.log('Running tests...');
    await execAsync('npm test');

    // 2. Build TypeScript
    console.log('Building TypeScript...');
    await execAsync('npm run build');

    // 3. Initialize Redis
    console.log('Initializing Redis...');
    await RedisConfig.initialize();

    // 4. Start the application
    console.log('Starting application...');
    await execAsync('npm start');

    console.log('Deployment successful!');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy().catch(console.error);
