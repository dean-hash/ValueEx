import { AwinConnector } from '../services/connectors/implementations/awinConnector';

async function generateCommissions() {
  const awin = AwinConnector.getInstance();

  console.log('Starting Commission Generation...\n');

  // Check current commissions
  const currentCommissions = await awin.getActiveCommissions();
  console.log(`Current Active Commissions: $${currentCommissions.toFixed(2)}\n`);

  // Get and display high-value opportunities
  console.log('Generating High-Value Opportunities...');
  await awin.optimizeCommissions();
}

generateCommissions().catch(console.error);
