import { Client } from '@microsoft/microsoft-graph-client';
import { logger } from '../src/utils/logger';

async function testEmailForward() {
  try {
    // Initialize Graph client with existing Office 365 connection
    const client = Client.init({
      authProvider: async (done) => {
        // Use the existing Office 365 connection
        done(null, process.env.OFFICE365_TOKEN || '');
      },
    });

    // Send a test email
    await client.api('/me/sendMail').post({
      message: {
        subject: 'Test Email Forward',
        body: {
          contentType: 'Text',
          content: 'This is a test email to verify forwarding functionality.',
        },
        toRecipients: [
          {
            emailAddress: {
              address: 'dean@divvytech.com',
            },
          },
        ],
      },
    });

    logger.info('Test email sent successfully');
  } catch (error) {
    logger.error('Failed to send test email:', error);
    console.error('Error details:', error);
  }
}

testEmailForward();
