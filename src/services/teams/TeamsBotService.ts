import { BotFrameworkAdapter, TurnContext, ActivityTypes } from 'botbuilder';
import { teamsConfig } from '../../config/teams.config';
import { Logger } from '../logging/Logger';
import { MetricsCollector } from '../monitoring/Metrics';

export class TeamsBotService {
    private adapter: BotFrameworkAdapter;
    private logger: Logger;
    private metrics: MetricsCollector;

    constructor() {
        this.adapter = new BotFrameworkAdapter({
            appId: teamsConfig.botId,
            appPassword: teamsConfig.botPassword
        });

        this.logger = new Logger('TeamsBotService');
        this.metrics = MetricsCollector.getInstance();

        this.setupErrorHandler();
        this.adapter.onTurn(async (context) => {
            await this.processMessage(context);
        });
    }

    private setupErrorHandler(): void {
        this.adapter.onTurnError = async (context, error) => {
            this.logger.error('Bot error:', error);
            this.metrics.trackError('bot_error');

            await context.sendActivity('The bot encountered an error. Please try again later.');
        };
    }

    public async processMessage(context: TurnContext): Promise<void> {
        const startTime = Date.now();
        
        try {
            if (context.activity.type === ActivityTypes.Message) {
                const message = context.activity.text.toLowerCase();

                // Command handling
                if (message.startsWith('!help')) {
                    await this.sendHelpMessage(context);
                } else if (message.startsWith('!status')) {
                    await this.sendStatusMessage(context);
                } else if (message.startsWith('!metrics')) {
                    await this.sendMetricsMessage(context);
                } else {
                    // Default response
                    await context.sendActivity('Type !help to see available commands');
                }
            }

            this.metrics.trackApiMetrics('bot_message', {
                latency: Date.now() - startTime,
                success: true
            });
        } catch (error) {
            this.metrics.trackError('message_processing_error');
            this.logger.error('Error processing message:', error);
            await context.sendActivity('Error processing your message. Please try again.');
        }
    }

    private async sendHelpMessage(context: TurnContext): Promise<void> {
        const helpMessage = `
Available commands:
- !help: Show this help message
- !status: Check system status
- !metrics: View current metrics
        `;
        await context.sendActivity(helpMessage);
    }

    private async sendStatusMessage(context: TurnContext): Promise<void> {
        const resourceMetrics = this.metrics.getResourceMetrics();
        const status = {
            uptime: process.uptime(),
            ...resourceMetrics,
            timestamp: new Date().toISOString()
        };
        await context.sendActivity(`System Status:\n${JSON.stringify(status, null, 2)}`);
    }

    private async sendMetricsMessage(context: TurnContext): Promise<void> {
        const apiMetrics = this.metrics.getApiMetrics();
        await context.sendActivity(`Current Metrics:\n${JSON.stringify(apiMetrics, null, 2)}`);
    }

    public async sendNotification(channelId: string, message: string): Promise<void> {
        const startTime = Date.now();
        
        try {
            const reference = {
                channelId: channelId,
                serviceUrl: 'https://smba.trafficmanager.net/amer/',
                conversation: { id: channelId }
            };

            await this.adapter.continueConversation(reference, async (context) => {
                await context.sendActivity(message);
            });

            this.metrics.trackApiMetrics('bot_notification', {
                latency: Date.now() - startTime,
                success: true
            });
        } catch (error) {
            this.metrics.trackError('notification_error');
            this.logger.error('Failed to send notification:', error);
            throw error;
        }
    }
}
