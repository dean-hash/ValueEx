import { TeamsActivityHandler, TurnContext } from 'botbuilder';
import { AffiliateManager } from '../affiliateManager';
import { logger } from '../../utils/logger';

export class TeamsBot extends TeamsActivityHandler {
  private affiliateManager = AffiliateManager.getInstance();

  constructor() {
    super();
    this.onMessage(this.handleMessage.bind(this));
  }

  async handleMessage(context: TurnContext): Promise<void> {
    try {
      const text = context.activity.text.toLowerCase();

      // Help command
      if (text.includes('help')) {
        await context.sendActivity(`
🤖 ValueEx Bot - Your AI Tool Assistant

Commands:
- *ai writing* - Get recommendations for AI writing tools
- *ai image* - Get recommendations for AI image generation tools
- *help* - Show this help message

Example: "I need an AI tool for writing blog posts"
                `);
        return;
      }

      // Extract user need
      const need = {
        query: text,
        category: text.includes('image') ? 'ai_image' : 'ai_writing',
        context: {
          urgency: text.includes('urgent') ? 0.9 : 0.5,
          priceRange: '0-1000',
          categories: ['ai', 'software', 'productivity'],
        },
      };

      // Get relevant affiliate products
      const products = await this.affiliateManager.getRelevantProducts(need.category);

      if (products.length === 0) {
        await context.sendActivity(
          "I couldn't find any relevant AI tools for your needs. Try asking for 'ai writing' or 'ai image' tools."
        );
        return;
      }

      // Format and send response
      const response = products
        .map(
          (product) => `
📌 ${product.name}
${product.description}
💰 Commission: ${product.commission * 100}%
🔗 Try it: ${this.affiliateManager.generateAffiliateLink(product.name, context.activity.from.id)}
            `
        )
        .join('\n');

      await context.sendActivity(response);
    } catch (error) {
      logger.error('Error handling Teams message:', error);
      await context.sendActivity(
        'Sorry, I encountered an error. Please try again or type "help" for available commands.'
      );
    }
  }
}
