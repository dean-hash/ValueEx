import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';
import { configService } from '../src/config/configService';

const prisma = new PrismaClient();

async function initializeDatabase(): Promise<void> {
  try {
    // Create admin user
    const adminEmail = configService.get('ADMIN_EMAIL');
    const adminPassword = configService.get('ADMIN_PASSWORD');

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        name: 'System Administrator',
      },
    });

    logger.info('Admin user created:', { userId: admin.id });

    // Initialize system settings
    await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        matchInterval: parseInt(configService.get('MATCH_INTERVAL_MS')),
        analyticsInterval: parseInt(configService.get('ANALYTICS_INTERVAL_MS')),
        maxConcurrentMatches: parseInt(configService.get('MAX_CONCURRENT_MATCHES')),
        minConfidenceThreshold: parseFloat(configService.get('MIN_CONFIDENCE_THRESHOLD')),
        enableHealthChecks: configService.get('ENABLE_HEALTH_CHECKS') === 'true',
      },
    });

    logger.info('System settings initialized');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase()
  .then(() => logger.info('Database initialization completed'))
  .catch((error) => {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  });
