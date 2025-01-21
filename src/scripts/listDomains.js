const { GoDaddyConnector } = require('../services/domain/connectors/godaddyConnector');

async function listDomains() {
    const connector = GoDaddyConnector.getInstance();
    
    try {
        console.log('Fetching domain list...');
        const domains = await connector.listDomains();
        
        console.log('\nDomain Analysis Report:');
        console.log('=====================\n');
        
        domains.forEach(domain => {
            console.log(`Domain: ${domain.domain}`);
            console.log(`Status: ${domain.status}`);
            console.log(`Expires: ${domain.expires}`);
            console.log('-------------------\n');
        });

    } catch (error) {
        console.error('Error listing domains:', error);
        throw error;
    }
}

// Run it
listDomains().catch(console.error);
