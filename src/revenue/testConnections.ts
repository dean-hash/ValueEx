import { AffiliateConnector } from './affiliateConnector';

async function testConnections() {
    const connector = AffiliateConnector.getInstance();
    
    try {
        // Test Awin connection
        console.log('Testing Awin connection...');
        const programs = await connector.getAwinPrograms();
        console.log('Successfully connected to Awin:', programs.length, 'programs found');
        
        // Test GoDaddy connection
        console.log('\nTesting GoDaddy connection...');
        const domains = await connector.getDomains();
        console.log('Successfully connected to GoDaddy:', domains.length, 'domains found');
        
        // Get Fiverr links
        console.log('\nVerifying Fiverr links...');
        const fiverrLinks = connector.getFiverrLinks();
        console.log('Fiverr links available:', Object.keys(fiverrLinks).length);
        
    } catch (error) {
        console.error('Error testing connections:', error);
    }
}

// Run the test
testConnections();
