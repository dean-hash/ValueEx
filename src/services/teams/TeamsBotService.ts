import { BotFrameworkAdapter, TurnContext, ActivityTypes } from 'botbuilder';
import { teamsConfig } from '../../config/teams.config';
import { Logger } from '../logging/Logger';
import { MetricsCollector } from '../monitoring/Metrics';
import { AffiliateManager } from '../affiliateManager';

export class TeamsBotService {
  private adapter: BotFrameworkAdapter;
  private logger: Logger;
  private metrics: MetricsCollector;
  private affiliateManager: AffiliateManager;

  constructor() {
    this.adapter = new BotFrameworkAdapter({
      appId: teamsConfig.botId,
      appPassword: teamsConfig.botPassword,
    });

    this.logger = new Logger('TeamsBotService');
    this.metrics = MetricsCollector.getInstance();
    this.affiliateManager = AffiliateManager.getInstance();

    this.setupErrorHandler();
    this.adapter.onTurn(async (context) => {
      await this.processMessage(context);
    });
  }

  private setupErrorHandler(): void {
    this.adapter.onTurnError = async (context, error) => {
      this.logger.error('Bot error:', error);
      this.metrics.trackError('bot_error');
      await context.sendActivity('I encountered an error. Please try asking about AI tools again.');
    };
  }

  public async processMessage(context: TurnContext): Promise<void> {
    const startTime = Date.now();

    try {
      if (context.activity.type === ActivityTypes.Message) {
        const message = context.activity.text.toLowerCase();
        const userId = context.activity.from.id;

        if (message.includes('help')) {
          await this.sendHelpMessage(context);
        } else {
          await this.handleProductRecommendation(context, message, userId);
        }
      }

      this.metrics.trackMetric('bot_response_time', Date.now() - startTime);
    } catch (error) {
      this.logger.error('Error processing message:', error);
      await context.sendActivity('I encountered an error. Please try asking about AI tools again.');
    }
  }

  private async handleProductRecommendation(
    context: TurnContext,
    message: string,
    userId: string
  ): Promise<void> {
    try {
      // Determine product category
      const category = message.includes('image') ? 'ai_image' : 'ai_writing';

      // Get relevant products
      const products = await this.affiliateManager.getRelevantProducts(category);

      if (products.length === 0) {
        await context.sendActivity(
          "I couldn't find any relevant AI tools for your needs. Try asking about AI writing or image generation tools."
        );
        return;
      }

      // Format response with affiliate links
      const response = products
        .map(
          (product) => `
📌 ${product.name}
${product.description}
💰 Special Offer: Up to ${product.commission * 100}% discount through our partnership
🔗 Get Started: ${this.affiliateManager.generateAffiliateLink(product.name, userId)}
            `
        )
        .join('\n');

      await context.sendActivity(response);

      // Track potential revenue opportunity
      this.metrics.trackMetric('product_recommendation', 1, {
        category,
        products: products.map((p) => p.name).join(','),
        potential_commission: products.reduce((sum, p) => sum + p.commission, 0),
      });
    } catch (error) {
      this.logger.error('Error handling product recommendation:', error);
      await context.sendActivity(
        'I encountered an error finding the right tools. Please try again.'
      );
    }
  }

  private async sendHelpMessage(context: TurnContext): Promise<void> {
    await context.sendActivity(`
🤖 ValueEx - Your AI Tool Assistant

I can help you find the perfect AI tools for your needs:

Just tell me what you're looking for:
- "I need an AI writing tool"
- "Looking for AI image generation"
- "Need help with content creation"

I'll recommend the best tools with exclusive partnership discounts! 
        `);
  }
}
