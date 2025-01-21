import { qaSystem } from './core/qa';
import { ResonanceField } from './core/unified/intelligenceField';

async function initializeSystem() {
  console.log('Initializing ValueEx system...');

  // Initialize resonance field
  const resonanceField = ResonanceField.getInstance();
  await resonanceField.initialize();

  // Initialize QA system
  const qa = qaSystem;

  // Set up global error handling
  process.on('uncaughtException', (error) => {
    qa.handleError(error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    qa.handleRejection(reason, promise);
  });

  // Start monitoring
  const status = qa.getSystemStatus();
  console.log('System initialized:', status);
}

initializeSystem().catch(console.error);
