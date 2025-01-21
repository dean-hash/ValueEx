import { AwinConnector } from '../services/connectors/implementations/awinConnector';

async function checkCommissions() {
  const awin = AwinConnector.getInstance();

  console.log('Checking current commissions due...\n');

  const { totalDue, transactions } = await awin.getCommissionsDue();

  console.log(`Total Commissions Due: $${totalDue.toFixed(2)}\n`);

  console.log('Recent Transactions:');
  console.log('===================');

  transactions.slice(0, 5).forEach((tx: any) => {
    console.log(`
Transaction ID: ${tx.id}
Amount: $${tx.commission.toFixed(2)}
Status: ${tx.status}
Expected Payment: ${new Date(tx.paymentDate).toLocaleDateString()}
        `);
  });

  console.log('\nFetching high-paying program opportunities...\n');

  const programs = await awin.getHighPayingPrograms();

  console.log('Top Programs Available Now:');
  console.log('=========================');

  programs.slice(0, 5).forEach((program: any) => {
    console.log(`
Program: ${program.name}
Commission: Up to ${program.commissionRange.max}%
Payment Terms: ${program.paymentTerms} days
Validation Period: ${program.validationPeriod} days
        `);
  });
}

checkCommissions().catch(console.error);
