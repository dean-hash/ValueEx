import 'dotenv/config';
import { AlerionManager } from '../services/alerion/alerionManager';
import { logger } from '../utils/logger';

async function deployAlerion() {
  try {
    console.log('\nInitializing Alerion AI Platform...');
    const manager = AlerionManager.getInstance();

    console.log('\nDeploying Services:');
    console.log('==================');
    const result = await manager.deployAllServices();

    console.log('\nDeployment Results:');
    console.log('==================');
    console.log(`Services Deployed: ${result.deployedServices}`);
    console.log(`Projected Monthly Revenue: $${result.projectedRevenue.toFixed(2)}`);

    const status = manager.getServiceStatus();

    console.log('\nActive Endpoints:');
    console.log('================');
    status.endpoints.forEach((endpoint: string) => {
      console.log(`https://${status.domain}${endpoint}`);
    });

    console.log('\nRevenue Opportunities:');
    console.log('====================');
    status.opportunities.forEach((opp: any) => {
      console.log(`- ${opp.source}: $${opp.value} (${opp.confidence * 100}% confidence)`);
    });
  } catch (error) {
    logger.error('Failed to deploy Alerion platform', error);
  }
}

deployAlerion();
