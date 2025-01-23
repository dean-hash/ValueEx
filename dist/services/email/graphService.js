"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphService = void 0;
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const logger_1 = require("../../utils/logger");
const secureStore_1 = require("../../config/secureStore");
class GraphService {
    constructor() {
        this.secureStore = secureStore_1.SecureStore.getInstance();
        // Use existing Office 365 connection
        const existingConfig = {
            connectionName: 'office365',
            resourceGroup: 'DefaultResourceGroup-EUS',
            subscription: 'Azure subscription 1'
        };
        // Initialize Microsoft Graph client using existing connection
        this.client = microsoft_graph_client_1.Client.initWithMiddleware({
            authProvider: new CustomAuthProvider(existingConfig)
        });
    }
    static getInstance() {
        if (!GraphService.instance) {
            GraphService.instance = new GraphService();
        }
        return GraphService.instance;
    }
    async forwardEmail(message, toAddress, analysis) {
        try {
            // Create forward message
            const forwardMessage = {
                message: {
                    subject: `Fwd: ${message.subject}`,
                    body: {
                        contentType: 'HTML',
                        content: `
              <h3>Original Email</h3>
              <p><strong>From:</strong> ${message.from.text}</p>
              <p><strong>Subject:</strong> ${message.subject}</p>
              <hr>
              <div>${message.html || message.text}</div>
              <hr>
              <h3>AI Analysis</h3>
              <pre>${analysis}</pre>
            `
                    },
                    toRecipients: [
                        {
                            emailAddress: {
                                address: toAddress
                            }
                        }
                    ]
                }
            };
            // Send using Graph API
            await this.client.api('/me/sendMail').post(forwardMessage);
            logger_1.logger.info('Email forwarded successfully', {
                to: toAddress,
                subject: message.subject
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to forward email:', error);
            throw error;
        }
    }
    async createSharedMailbox(name, email) {
        try {
            // Create shared mailbox
            const mailbox = {
                displayName: name,
                alias: email.split('@')[0],
                emailAddresses: [`${email}`]
            };
            await this.client.api('/users').post(mailbox);
            logger_1.logger.info('Shared mailbox created successfully', {
                name,
                email
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create shared mailbox:', error);
            throw error;
        }
    }
    async grantMailboxAccess(mailboxEmail, userEmail) {
        try {
            const permission = {
                emailAddress: {
                    address: userEmail
                },
                roles: ['Mail.ReadWrite']
            };
            await this.client.api(`/users/${mailboxEmail}/mailboxSettings/delegateMeetingMessageDelivery`)
                .patch(permission);
            logger_1.logger.info('Mailbox access granted', {
                mailbox: mailboxEmail,
                user: userEmail
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to grant mailbox access:', error);
            throw error;
        }
    }
}
exports.GraphService = GraphService;
// Custom auth provider that uses existing Office 365 connection
class CustomAuthProvider {
    constructor(config) {
        this.config = config;
    }
    async getAccessToken() {
        try {
            // Use existing connection token
            // This leverages your already-working Office 365 connection
            return process.env.OFFICE365_TOKEN || '';
        }
        catch (error) {
            logger_1.logger.error('Failed to get access token:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=graphService.js.map