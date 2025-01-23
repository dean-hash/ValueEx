import { PrismaClient } from '@prisma/client';
import { checkIntegrations } from '../src/services/integrations';
import { configService } from '../src/config/configService';

async function setup() {
  console.log('Starting ValueEx setup...');
  
  try {
    // 1. Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'STRIPE_SECRET_KEY',
      'EMAIL_HOST',
      'REDIS_URL'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!configService.get(envVar)) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
    console.log('✓ Environment variables validated');

    // 2. Initialize database
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✓ Database connection established');

    // 3. Run migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✓ Database migrations applied');

    // 4. Check all integrations
    const integrationStatus = await checkIntegrations();
    if (integrationStatus.status !== 'healthy') {
      throw new Error('Integration checks failed');
    }
    console.log('✓ All integrations verified');

    // 5. Initialize Redis cache
    const { redis } = require('../src/services/integrations');
    await redis.set('system:status', 'initialized');
    console.log('✓ Redis cache initialized');

    console.log('\nSetup completed successfully! ValueEx is ready to run.');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setup();
