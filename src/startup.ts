import { qaSystem } from './core/qa';
import { UnifiedIntelligenceField } from './core/unified/intelligenceField';
import { LocalIntelligenceProvider } from './services/analysis/providers/localIntelligence';
import { ResearchIntelligenceProvider } from './services/analysis/providers/researchIntelligence';
import { PassiveEngagementAnalyzer } from './services/passiveEngagementAnalyzer';
import { healthMonitor } from './services/monitoring/healthMonitor';
import { MetricsCollector } from './services/metrics/metricsCollector';
import { logger } from './utils/logger';

async function initializeSystem(): Promise<void> {
  logger.info('Initializing ValueEx system...');

  // Initialize resonance field
  const resonanceField = UnifiedIntelligenceField.getInstance();
  await resonanceField.initialize();

  // Initialize QA system
  const qa = qaSystem;

  // Set up global error handling
  process.on('uncaughtException', (error) => {
    qa.handleError(error);
    logger.error('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    qa.handleRejection(reason, promise);
    logger.error('Unhandled Rejection:', { reason, promise });
  });

  // Start monitoring
  const status = qa.getSystemStatus();
  logger.info('System initialized:', status);
}

async function initializeIntelligence(): Promise<void> {
  logger.info('Initializing intelligence components...');

  // Initialize intelligence field
  const field = UnifiedIntelligenceField.getInstance();
  await field.initialize();

  // Initialize intelligence providers
  const localProvider = new LocalIntelligenceProvider();
  const researchProvider = new ResearchIntelligenceProvider();

  // Initialize engagement analyzer
  const engagementAnalyzer = new PassiveEngagementAnalyzer();
  await engagementAnalyzer.initialize();

  // Register providers with field
  field.registerProvider(localProvider);
  field.registerProvider(researchProvider);

  logger.info('Intelligence components initialized');
}

async function initializeMetrics(): Promise<void> {
  logger.info('Initializing metrics collection...');
  const metrics = MetricsCollector.getInstance();
  await metrics.getMetrics(); // Warm up metrics collection
  logger.info('Metrics collection initialized');
}

async function startHealthMonitoring(): Promise<void> {
  logger.info('Starting health monitoring...');
  await healthMonitor.start();
  logger.info('Health monitoring started');
}

async function startup(): Promise<void> {
  try {
    logger.info('Starting ValueEx...');

    await Promise.all([
      initializeSystem(),
      initializeIntelligence(),
      initializeMetrics(),
      startHealthMonitoring(),
    ]);

    logger.info('ValueEx startup complete');
  } catch (error) {
    logger.error('Startup failed:', error);
    process.exit(1);
  }
}

startup().catch((error) => {
  logger.error('Fatal startup error:', error);
  process.exit(1);
});
