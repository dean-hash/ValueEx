import { TeamsActivityHandler, TurnContext, MessageFactory } from 'botbuilder';
import { logger } from '../../utils/logger';
import { DemandMatcher } from '../mvp/demandMatcher';
import { ProductSourcing } from '../mvp/productSourcing';

interface Demand {
    category: string;
    strength: number;
    confidence: number;
}

interface ProductOpportunity {
    category: string;
    priceRange?: {
        min: number;
        max: number;
    };
}

export class TeamsBot extends TeamsActivityHandler {
    private demandMatcher = DemandMatcher.getInstance();
    private productSourcing = ProductSourcing.getInstance();

    constructor() {
        super();
        this.onMessage(this.handleMessage.bind(this));
    }

    async handleMessage(context: TurnContext): Promise<void> {
        try {
            const text = context.activity.text.toLowerCase();

            if (text.includes('demand') || text.includes('opportunity')) {
                await this.handleDemandQuery(context);
            } else if (text.includes('product') || text.includes('source')) {
                await this.handleProductQuery(context);
            } else if (text.includes('status') || text.includes('health')) {
                await this.handleStatusQuery(context);
            } else {
                await this.handleHelp(context);
            }
        } catch (error) {
            logger.error('Error handling Teams message:', error);
            await context.sendActivity('Sorry, I encountered an error processing your request.');
        }
    }

    private async handleDemandQuery(context: TurnContext): Promise<void> {
        const demands: Demand[] = await this.demandMatcher.getCurrentDemands();
        const message = MessageFactory.text(
            `Current Demand Overview:\n${demands.map(d => 
                `- ${d.category}: ${d.strength} strength, ${d.confidence.toFixed(2)} confidence`
            ).join('\n')}`
        );
        await context.sendActivity(message);
    }

    private async handleProductQuery(context: TurnContext): Promise<void> {
        const opportunities: ProductOpportunity[] = await this.productSourcing.findOpportunities();
        const message = MessageFactory.text(
            `Product Opportunities:\n${opportunities.map(o => 
                `- ${o.category}: $${o.priceRange?.min}-${o.priceRange?.max}`
            ).join('\n')}`
        );
        await context.sendActivity(message);
    }

    private async handleStatusQuery(context: TurnContext): Promise<void> {
        const status: Record<string, boolean> = {
            matcher: await this.demandMatcher.isHealthy(),
            sourcing: await this.productSourcing.isHealthy()
        };

        const message = MessageFactory.text(
            `System Status:\n` +
            `- Demand Matcher: ${status.matcher ? '✅' : '❌'}\n` +
            `- Product Sourcing: ${status.sourcing ? '✅' : '❌'}`
        );
        await context.sendActivity(message);
    }

    private async handleHelp(context: TurnContext): Promise<void> {
        const message = MessageFactory.text(
            'Available commands:\n' +
            '- "demand": View current demand metrics\n' +
            '- "product": View product opportunities\n' +
            '- "status": Check system health\n' +
            '- "help": Show this message'
        );
        await context.sendActivity(message);
    }
}
