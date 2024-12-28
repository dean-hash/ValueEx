import OpenAI from 'openai';
import { logger } from '../utils/logger';

export interface BrainstormResult {
  ideas: string[];
  rationale: string;
  questions: string[];
  risks: string[];
}

export class CollaborativeIntelligence {
  private openai: OpenAI;
  private static instance: CollaborativeIntelligence;
  private context: Map<string, BrainstormResult> = new Map();

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required in environment variables');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  public static getInstance(): CollaborativeIntelligence {
    if (!CollaborativeIntelligence.instance) {
      CollaborativeIntelligence.instance = new CollaborativeIntelligence();
    }
    return CollaborativeIntelligence.instance;
  }

  async brainstorm(topic: string, context?: BrainstormResult): Promise<BrainstormResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `You are a collaborative intelligence partner helping to brainstorm solutions and ideas.
                     Consider multiple perspectives and think outside conventional boundaries.
                     Analyze the topic from various angles:
                     - Technical feasibility
                     - User experience
                     - Ethical implications
                     - Market potential`,
          },
          {
            role: 'user',
            content: `Topic: ${topic}\nContext: ${JSON.stringify(context || {})}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}') as BrainstormResult;
      this.context.set(topic, result);
      return result;
    } catch (error) {
      logger.error('Error in brainstorming:', error);
      throw error;
    }
  }
}
