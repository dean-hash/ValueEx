import {
  BotFrameworkAdapter,
  TurnContext,
  ConversationReference,
  ConversationAccount,
} from 'botbuilder';
import { logger } from '../../utils/logger';

export class TeamsNotifier {
  private adapter: BotFrameworkAdapter;
  private readonly appId: string;
  private readonly appPassword: string;

  constructor() {
    this.appId = process.env.TEAMS_APP_ID || '';
    this.appPassword = process.env.TEAMS_APP_PASSWORD || '';

    if (!this.appId || !this.appPassword) {
      throw new Error('Teams credentials are required');
    }

    this.adapter = new BotFrameworkAdapter({
      appId: this.appId,
      appPassword: this.appPassword,
    });

    // Error handler
    this.adapter.onTurnError = async (context: TurnContext, error: Error): Promise<void> => {
      logger.error('Teams notification error:', error);
      await context.sendActivity('Error sending notification. Please check the logs.');
    };
  }

  public async sendAlert(title: string, message: string): Promise<void> {
    try {
      const activity = {
        type: 'message',
        text: `**${title}**\n\n${message}`,
        channelId: 'msteams',
      };

      const conversationReference: Partial<ConversationReference> = {
        channelId: 'msteams',
        serviceUrl: process.env.TEAMS_SERVICE_URL || '',
        conversation: {
          id: process.env.TEAMS_CHANNEL_ID || '',
          tenantId: process.env.TEAMS_TENANT_ID || '',
          name: 'ValueEx Notifications',
          conversationType: 'channel',
          isGroup: true,
        } as ConversationAccount,
      };

      if (
        !conversationReference.serviceUrl ||
        !conversationReference.conversation?.id ||
        !conversationReference.conversation?.tenantId
      ) {
        throw new Error('Teams channel configuration is required');
      }

      await this.adapter.createConversation(conversationReference, async (context: TurnContext) => {
        await context.sendActivity(activity);
      });

      logger.info(`Sent Teams alert: ${title}`);
    } catch (error) {
      logger.error('Failed to send Teams alert:', error);
      throw error;
    }
  }
}
