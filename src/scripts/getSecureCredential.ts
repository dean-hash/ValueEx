import { SecureStore } from '../config/secureStore';
import { logger } from '../utils/logger';

async function getSecureCredential() {
    try {
        const store = SecureStore.getInstance();
        const credentialName = process.argv[2];
        
        if (!credentialName) {
            logger.error('Please provide a credential name', { context: { action: 'getSecureCredential' }});
            process.exit(1);
        }

        const credential = await store.getCredential(credentialName);

        if (!credential) {
            logger.error('No credential found', { context: { service: credentialName }});
            process.exit(1);
        }

        logger.info('Retrieved credential', {
            context: {
                service: credential.service,
                username: credential.username,
                notes: credential.notes || 'No notes available',
                hasPassword: !!credential.password
            }
        });
    } catch (error) {
        logger.error('Error retrieving credential', { context: { error }});
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    getSecureCredential();
}
