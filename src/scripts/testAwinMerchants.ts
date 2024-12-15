import { AwinService } from '../services/awinService';

async function testMerchants() {
    const awinService = new AwinService();
    
    try {
        console.log('Fetching joined merchant programs...');
        const merchants = await awinService.getMerchants();
        
        // Log raw response for debugging
        console.log('Raw response:', JSON.stringify(merchants, null, 2));
        
        if (!Array.isArray(merchants)) {
            console.log('Response is not an array. Structure:', typeof merchants);
            return;
        }
        
        console.log(`Found ${merchants.length} joined programs\n`);
        
        merchants.forEach((merchant: any) => {
            console.log('Raw merchant data:', merchant);
            console.log(`Merchant: ${merchant.name || merchant.merchantName}`);
            console.log(`ID: ${merchant.id || merchant.merchantId}`);
            console.log(`Commission Details: ${merchant.commissionDetails || merchant.commissionRate || 'Not specified'}`);
            console.log(`Region: ${merchant.region || merchant.primaryRegion || 'Not specified'}`);
            console.log(`Description: ${merchant.description || merchant.strapLine || 'No description provided'}`);
            console.log('-------------------\n');
        });
    } catch (error) {
        console.error('Error fetching merchant data:', error);
    }
}

testMerchants();
