import { Client } from '@microsoft/microsoft-graph-client';
import { logger } from '../src/utils/logger';

async function testExistingConnection() {
  try {
    // Initialize Graph client with existing connection
    const client = Client.init({
      authProvider: async (done) => {
        // Use the connection string from your office365 API Connection
        const connectionString = process.env.OFFICE365_CONNECTION_STRING;
        if (!connectionString) {
          done(new Error('No connection string found'), null);
          return;
        }
        done(null, connectionString);
      }
    });

    // Test sending an email
    await client.api('/me/sendMail').post({
      message: {
        subject: 'Test Connection',
        body: {
          contentType: 'Text',
          content: 'Testing Office 365 connection'
        },
        toRecipients: [
          {
            emailAddress: {
              address: 'dean@divvytech.com'
            }
          }
        ]
      }
    });

    console.log('Email sent successfully!');

  } catch (error) {
    logger.error('Failed to send email:', error);
    console.error('Error details:', error);
  }
}

testExistingConnection();
