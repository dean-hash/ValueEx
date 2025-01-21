import OpenAI from 'openai';
import { logger } from '../utils/logger';

export class GPTService {
  private openai: OpenAI;
  private static instance: GPTService;

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required in environment variables');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  public static getInstance(): GPTService {
    if (!GPTService.instance) {
      GPTService.instance = new GPTService();
    }
    return GPTService.instance;
  }

  async analyzeMarketOpportunity(productDescription: string): Promise<{
    opportunity: number;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `You are an AI market analyst specialized in evaluating product opportunities. 
                     Analyze the given product description and provide:
                     1. Opportunity score (0-100)
                     2. Confidence level (0-100)
                     3. Brief reasoning
                     Format: JSON with keys "opportunity", "confidence", "reasoning"`,
          },
          {
            role: 'user',
            content: productDescription,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      logger.info('Market opportunity analysis completed', { productDescription, result });
      return result;
    } catch (error) {
      logger.error('Error analyzing market opportunity', { error, productDescription });
      throw error;
    }
  }

  async generateProductDescription(keywords: string[]): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content:
              'Generate a compelling, SEO-friendly product description based on the provided keywords.',
          },
          {
            role: 'user',
            content: keywords.join(', '),
          },
        ],
      });

      const description = response.choices[0].message.content || '';
      logger.info('Product description generated', { keywords, description });
      return description;
    } catch (error) {
      logger.error('Error generating product description', { error, keywords });
      throw error;
    }
  }

  async analyzePurchaseIntent(userQuery: string): Promise<{
    intent: number;
    urgency: number;
    interests: string[];
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `Analyze the user query for:
                     1. Purchase intent (0-100)
                     2. Urgency level (0-100)
                     3. Key interests/needs
                     Format: JSON with keys "intent", "urgency", "interests"`,
          },
          {
            role: 'user',
            content: userQuery,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      logger.info('Purchase intent analysis completed', { userQuery, result });
      return result;
    } catch (error) {
      logger.error('Error analyzing purchase intent', { error, userQuery });
      throw error;
    }
  }
}
