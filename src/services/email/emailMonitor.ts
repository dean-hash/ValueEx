import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { GeminiService } from '../ai/geminiService';
import { GraphService } from './graphService';
import { logger } from '../../utils/logger';
import { configService } from '../../config/configService';

interface EmailConfig {
  host: string;
  port: number;
  tls: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailAccount {
  host: string;
  port: number;
  tls: boolean;
  auth: {
    user: string;
    pass: string;
  };
  forwardTo?: string;
}

export class EmailMonitor {
  private static instance: EmailMonitor;
  private clients: Map<string, ImapFlow> = new Map();
  private gemini: GeminiService;
  private graph: GraphService;
  private isMonitoring: boolean = false;

  private constructor() {
    this.gemini = GeminiService.getInstance();
    this.graph = GraphService.getInstance();

    // Configure multiple email accounts
    const accounts: Record<string, EmailAccount> = {
      aoa: {
        host: configService.getConfigServiceConfig('AOA_EMAIL_HOST'),
        port: Number(configService.getConfigServiceConfig('AOA_EMAIL_PORT')),
        tls: configService.getConfigServiceConfig('AOA_EMAIL_TLS') === 'true',
        auth: {
          user: configService.getConfigServiceConfig('AOA_EMAIL_USER'),
          pass: configService.getConfigServiceConfig('AOA_EMAIL_PASSWORD'),
        },
        forwardTo: configService.getConfigServiceConfig('AOA_EMAIL_FORWARD_TO'),
      },
      collaborative: {
        host: configService.getConfigServiceConfig('COLLAB_EMAIL_HOST'),
        port: Number(configService.getConfigServiceConfig('COLLAB_EMAIL_PORT')),
        tls: configService.getConfigServiceConfig('COLLAB_EMAIL_TLS') === 'true',
        auth: {
          user: configService.getConfigServiceConfig('COLLAB_EMAIL_USER'),
          pass: configService.getConfigServiceConfig('COLLAB_EMAIL_PASSWORD'),
        },
      },
    };

    // Initialize email clients
    Object.entries(accounts).forEach(([name, config]) => {
      this.clients.set(name, new ImapFlow(config));
    });
  }

  static getInstance(): EmailMonitor {
    if (!EmailMonitor.instance) {
      EmailMonitor.instance = new EmailMonitor();
    }
    return EmailMonitor.instance;
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      logger.info('Email monitoring already active');
      return;
    }

    try {
      for (const client of this.clients.values()) {
        await client.connect();
      }
      this.isMonitoring = true;
      logger.info('Started email monitoring');

      // Monitor inbox for new messages
      for (const [name, client] of this.clients) {
        await client.mailboxWatch('INBOX');

        client.on('exists', async (path: string, count: number) => {
          const latest = await this.getLatestEmails(name, 1);
          for (const email of latest) {
            await this.processEmail(email, name);
          }
        });
      }
    } catch (error) {
      logger.error('Failed to start email monitoring:', error);
      throw error;
    }
  }

  async stopMonitoring() {
    if (!this.isMonitoring) return;

    try {
      for (const client of this.clients.values()) {
        await client.logout();
      }
      this.isMonitoring = false;
      logger.info('Stopped email monitoring');
    } catch (error) {
      logger.error('Error stopping email monitoring:', error);
      throw error;
    }
  }

  private async getLatestEmails(account: string, count: number) {
    const client = this.clients.get(account);
    if (!client) {
      throw new Error(`Unknown email account: ${account}`);
    }

    const lock = await client.getMailboxLock('INBOX');
    try {
      const messages = [];
      for await (const message of client.fetch({ last: count }, { source: true })) {
        const parsed = await simpleParser(message.source);
        messages.push(parsed);
      }
      return messages;
    } finally {
      lock.release();
    }
  }

  public async processEmail(email: any, account: string) {
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
      logger.info('Email Analysis:', {
        account,
        subject: email.subject,
        from: email.from.text,
        analysis,
        timestamp: new Date().toISOString(),
      });

      // Forward critical emails to Divvy
      const priority = this.extractPriority(analysis);
      if (account === 'aoa' || priority === 'URGENT' || priority === 'HIGH') {
        await this.forwardEmail(email, 'dean@divvytech.com', analysis);
      }

      // Store business intelligence
      await this.storeBusinessIntelligence(email, analysis);
    } catch (error) {
      logger.error('Error processing email:', error);
      // Forward to Divvy on error to ensure no critical emails are missed
      await this.forwardEmail(
        email,
        'dean@divvytech.com',
        'Error in processing - requires manual review'
      );
    }
  }

  private async forwardEmail(email: any, to: string, analysis: string) {
    try {
      await this.graph.forwardEmail(email, to, analysis);
    } catch (error) {
      logger.error('Failed to forward email:', error);
      // Store failed forwards for retry
      await this.storeFailedForward(email, to, analysis);
    }
  }

  private async storeFailedForward(email: any, to: string, analysis: string) {
    // TODO: Implement retry mechanism for failed forwards
    logger.warn('Email forward failed - stored for retry', {
      to,
      subject: email.subject,
      timestamp: new Date().toISOString(),
    });
  }

  private async storeBusinessIntelligence(email: any, analysis: string) {
    // Store valuable business insights for later use
    // This could help with domain valuations, market analysis, etc.
    // TODO: Implement secure storage
  }

  private extractPriority(analysis: string): string {
    const priorityMatch = analysis.match(/Priority:\s*(URGENT|HIGH|MEDIUM|LOW)/i);
    return priorityMatch ? priorityMatch[1].toUpperCase() : 'MEDIUM';
  }

  private getAccountForwardTo(account: string): string | undefined {
    const accounts: Record<string, EmailAccount> = {
      aoa: {
        host: configService.getConfigServiceConfig('AOA_EMAIL_HOST'),
        port: Number(configService.getConfigServiceConfig('AOA_EMAIL_PORT')),
        tls: configService.getConfigServiceConfig('AOA_EMAIL_TLS') === 'true',
        auth: {
          user: configService.getConfigServiceConfig('AOA_EMAIL_USER'),
          pass: configService.getConfigServiceConfig('AOA_EMAIL_PASSWORD'),
        },
        forwardTo: configService.getConfigServiceConfig('AOA_EMAIL_FORWARD_TO'),
      },
      collaborative: {
        host: configService.getConfigServiceConfig('COLLAB_EMAIL_HOST'),
        port: Number(configService.getConfigServiceConfig('COLLAB_EMAIL_PORT')),
        tls: configService.getConfigServiceConfig('COLLAB_EMAIL_TLS') === 'true',
        auth: {
          user: configService.getConfigServiceConfig('COLLAB_EMAIL_USER'),
          pass: configService.getConfigServiceConfig('COLLAB_EMAIL_PASSWORD'),
        },
      },
    };

    return accounts[account]?.forwardTo;
  }

  async searchEmails(account: string, query: string, days: number = 7) {
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
        const parsed = await simpleParser(message.source);
        if (
          parsed.subject?.toLowerCase().includes(query.toLowerCase()) ||
          parsed.text?.toLowerCase().includes(query.toLowerCase())
        ) {
          messages.push(parsed);
        }
      }
      return messages;
    } finally {
      lock.release();
    }
  }
}
