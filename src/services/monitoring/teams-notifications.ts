import { WebClient } from '@microsoft/microsoft-graph-client';
import { configService } from '../../config/configService';

export class TeamsNotificationService {
  private static instance: TeamsNotificationService;
  private client: WebClient;
  private channelId: string;
  private notificationEmail: string = `${configService.get('NOTIFICATION_EMAIL_PREFIX')}@${configService.get('EMAIL_DOMAIN')}`;

  private constructor() {
    this.client = new WebClient();
    this.channelId = configService.get('TEAMS_CHANNEL_ID');
  }

  public static getInstance(): TeamsNotificationService {
    if (!TeamsNotificationService.instance) {
      TeamsNotificationService.instance = new TeamsNotificationService();
    }
    return TeamsNotificationService.instance;
  }

  async sendTransactionAlert(transaction: {
    id: string;
    amount: number;
    status: string;
  }): Promise<void> {
    const message = {
      type: 'message',
      body: {
        content: `🔔 New Transaction\nID: ${transaction.id}\nAmount: $${transaction.amount}\nStatus: ${transaction.status}`,
      },
    };

    await this.client.api(`/teams/${this.channelId}/messages`).post(message);
  }

  async sendMetricsUpdate(metrics: {
    revenue: number;
    transactions: number;
    activeUsers: number;
  }): Promise<void> {
    const message = {
      type: 'message',
      body: {
        content: `📊 Metrics Update\nRevenue: $${metrics.revenue}\nTransactions: ${metrics.transactions}\nActive Users: ${metrics.activeUsers}`,
      },
    };

    await this.client.api(`/teams/${this.channelId}/messages`).post(message);
  }

  async sendHealthAlert(status: {
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    message: string;
  }): Promise<void> {
    const emoji = {
      healthy: '✅',
      degraded: '⚠️',
      down: '🔴',
    };

    const message = {
      type: 'message',
      body: {
        content: `${emoji[status.status]} Health Alert\nService: ${status.service}\nStatus: ${status.status}\nMessage: ${status.message}`,
      },
    };

    await this.client.api(`/teams/${this.channelId}/messages`).post(message);
  }
}
