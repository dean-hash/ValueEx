"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailMonitor = void 0;
const imapflow_1 = require("imapflow");
const mailparser_1 = require("mailparser");
const geminiService_1 = require("../ai/geminiService");
const graphService_1 = require("./graphService");
const logger_1 = require("../../utils/logger");
class EmailMonitor {
    constructor() {
        this.clients = new Map();
        this.isMonitoring = false;
        this.gemini = geminiService_1.GeminiService.getInstance();
        this.graph = graphService_1.GraphService.getInstance();
        // Configure multiple email accounts
        const accounts = {
            aoa: {
                host: 'outlook.office365.com',
                port: 993,
                auth: {
                    user: 'dean@aoaassociates.com',
                    pass: process.env.AOA_EMAIL_PASSWORD || '',
                },
                tls: true,
                forwardTo: 'dean@divvytech.com'
            },
            collaborative: {
                host: 'outlook.office365.com',
                port: 993,
                auth: {
                    user: 'partners@collaborativeintelligence.world',
                    pass: process.env.COLLAB_EMAIL_PASSWORD || '',
                },
                tls: true
            }
        };
        // Initialize email clients
        Object.entries(accounts).forEach(([name, config]) => {
            this.clients.set(name, new imapflow_1.ImapFlow(config));
        });
    }
    static getInstance() {
        if (!EmailMonitor.instance) {
            EmailMonitor.instance = new EmailMonitor();
        }
        return EmailMonitor.instance;
    }
    async startMonitoring() {
        if (this.isMonitoring) {
            logger_1.logger.info('Email monitoring already active');
            return;
        }
        try {
            for (const client of this.clients.values()) {
                await client.connect();
            }
            this.isMonitoring = true;
            logger_1.logger.info('Started email monitoring');
            // Monitor inbox for new messages
            for (const [name, client] of this.clients) {
                await client.mailboxWatch('INBOX');
                client.on('exists', async (path, count) => {
                    const latest = await this.getLatestEmails(name, 1);
                    for (const email of latest) {
                        await this.processEmail(email, name);
                    }
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to start email monitoring:', error);
            throw error;
        }
    }
    async stopMonitoring() {
        if (!this.isMonitoring)
            return;
        try {
            for (const client of this.clients.values()) {
                await client.logout();
            }
            this.isMonitoring = false;
            logger_1.logger.info('Stopped email monitoring');
        }
        catch (error) {
            logger_1.logger.error('Error stopping email monitoring:', error);
            throw error;
        }
    }
    async getLatestEmails(account, count) {
        const client = this.clients.get(account);
        if (!client) {
            throw new Error(`Unknown email account: ${account}`);
        }
        const lock = await client.getMailboxLock('INBOX');
        try {
            const messages = [];
            for await (const message of client.fetch({ last: count }, { source: true })) {
                const parsed = await (0, mailparser_1.simpleParser)(message.source);
                messages.push(parsed);
            }
            return messages;
        }
        finally {
            lock.release();
        }
    }
    async processEmail(email, account) {
        try {
            // Use Gemini to analyze email content and business impact
            const analysis = await this.gemini.generateContent(`
        Analyze this business email with high sensitivity to legal and business context:
        Subject: ${email.subject}
        From: ${email.from.text}
        Content: ${email.text}
        
        Provide:
        1. Priority (URGENT/HIGH/MEDIUM/LOW)
        2. Category (Legal/Business/Technical/Administrative)
        3. Required actions
        4. Risk assessment
        5. Suggested response
        6. Business opportunities
      `);
            // Log analysis with business context
            logger_1.logger.info('Email Analysis:', {
                account,
                subject: email.subject,
                from: email.from.text,
                analysis,
                timestamp: new Date().toISOString()
            });
            // Forward critical emails to Divvy
            const priority = this.extractPriority(analysis);
            if (account === 'aoa' || priority === 'URGENT' || priority === 'HIGH') {
                await this.forwardEmail(email, 'dean@divvytech.com', analysis);
            }
            // Store business intelligence
            await this.storeBusinessIntelligence(email, analysis);
        }
        catch (error) {
            logger_1.logger.error('Error processing email:', error);
            // Forward to Divvy on error to ensure no critical emails are missed
            await this.forwardEmail(email, 'dean@divvytech.com', 'Error in processing - requires manual review');
        }
    }
    async forwardEmail(email, to, analysis) {
        try {
            await this.graph.forwardEmail(email, to, analysis);
        }
        catch (error) {
            logger_1.logger.error('Failed to forward email:', error);
            // Store failed forwards for retry
            await this.storeFailedForward(email, to, analysis);
        }
    }
    async storeFailedForward(email, to, analysis) {
        // TODO: Implement retry mechanism for failed forwards
        logger_1.logger.warn('Email forward failed - stored for retry', {
            to,
            subject: email.subject,
            timestamp: new Date().toISOString()
        });
    }
    async storeBusinessIntelligence(email, analysis) {
        // Store valuable business insights for later use
        // This could help with domain valuations, market analysis, etc.
        // TODO: Implement secure storage
    }
    extractPriority(analysis) {
        const priorityMatch = analysis.match(/Priority:\s*(URGENT|HIGH|MEDIUM|LOW)/i);
        return priorityMatch ? priorityMatch[1].toUpperCase() : 'MEDIUM';
    }
    getAccountForwardTo(account) {
        const accounts = {
            aoa: {
                host: 'outlook.office365.com',
                port: 993,
                auth: {
                    user: 'dean@aoaassociates.com',
                    pass: process.env.AOA_EMAIL_PASSWORD || '',
                },
                tls: true,
                forwardTo: 'dean@divvytech.com'
            },
            collaborative: {
                host: 'outlook.office365.com',
                port: 993,
                auth: {
                    user: 'partners@collaborativeintelligence.world',
                    pass: process.env.COLLAB_EMAIL_PASSWORD || '',
                },
                tls: true
            }
        };
        return accounts[account]?.forwardTo;
    }
    async searchEmails(account, query, days = 7) {
        const client = this.clients.get(account);
        if (!client) {
            throw new Error(`Unknown email account: ${account}`);
        }
        const lock = await client.getMailboxLock('INBOX');
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);
            const messages = [];
            for await (const message of client.fetch({ since }, { source: true })) {
                const parsed = await (0, mailparser_1.simpleParser)(message.source);
                if (parsed.subject?.toLowerCase().includes(query.toLowerCase()) ||
                    parsed.text?.toLowerCase().includes(query.toLowerCase())) {
                    messages.push(parsed);
                }
            }
            return messages;
        }
        finally {
            lock.release();
        }
    }
}
exports.EmailMonitor = EmailMonitor;
//# sourceMappingURL=emailMonitor.js.map