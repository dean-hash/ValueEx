import { BotFrameworkAdapter, TurnContext, ActivityTypes } from 'botbuilder';
import axios from 'axios';

const adapter = new BotFrameworkAdapter({
  appId: process.env.TEAMS_APP_ID,
  appPassword: process.env.TEAMS_APP_PASSWORD,
});

const FIVERR_LINKS = {
  marketplace: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiverrmktplace',
  pro: 'https://go.fiverr.com/visit/?bta=1064652&brand=fp',
};

interface LeadData {
  company: string;
  need: string;
  budget: string;
  timeline: string;
}

class RevenueBot {
  private leads: Map<string, LeadData> = new Map();

  async onMessage(context: TurnContext) {
    const text = context.activity.text.toLowerCase();

    // Extract potential budget numbers
    const budgetMatch = text.match(/\$\d+k|\$\d+,\d+|\$\d+/);
    const budget = budgetMatch ? budgetMatch[0] : '';

    // Look for company names (basic detection)
    const companyMatch = text.match(/(?:at|for|with)\s+([A-Z][A-Za-z&\s]+)(?=[\s,.])/);
    const company = companyMatch ? companyMatch[1].trim() : '';

    // Detect urgency/timeline
    const hasUrgency = /asap|urgent|immediately|quick|fast/.test(text);
    const timeline = hasUrgency ? 'URGENT' : 'Standard';

    // Store lead data
    if (company || budget) {
      this.leads.set(context.activity.from.id, {
        company,
        need: text,
        budget,
        timeline,
      });
    }

    // If it looks like a development request
    if (/develop|build|create|make|need|want|looking for/.test(text)) {
      const response = await this.generateResponse(text, budget);
      await context.sendActivity(response);
    }
  }

  private async generateResponse(text: string, budget: string): Promise<string> {
    let link = FIVERR_LINKS.marketplace;

    // High-value leads get pro link
    if (budget && parseInt(budget.replace(/[^0-9]/g, '')) > 5000) {
      link = FIVERR_LINKS.pro;
    }

    // Customize based on detected need
    const isWebProject = /website|web app|webapp|site/.test(text);
    const isMobile = /mobile|ios|android|app/.test(text);
    const isDesign = /design|logo|brand|ui|ux/.test(text);

    let service = 'development';
    if (isWebProject) service = 'web development';
    if (isMobile) service = 'mobile app development';
    if (isDesign) service = 'design';

    return `I've found some top-rated ${service} experts who can help with this project. They have experience with similar requirements and are available to start quickly. Check out their portfolios and reviews here: ${link}`;
  }

  async start() {
    adapter.onTurnError = async (context, error) => {
      console.error('Bot error:', error);
      await context.sendActivity('Apologies, I encountered an error. Please try again.');
    };

    adapter.listen(async (context) => {
      if (context.activity.type === ActivityTypes.Message) {
        await this.onMessage(context);
      }
    });
  }
}

const bot = new RevenueBot();
bot.start().catch(console.error);
