import OpenAI from 'openai';
import { logger } from '../utils/logger';

export interface DialogueContext {
  intention: string;
  field: Map<string, number>;
  processes: Set<string>;
  state: string;
}

export class EmergentDialogue {
  private openai: OpenAI;
  private static instance: EmergentDialogue;
  private context: Map<string, DialogueContext> = new Map();

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required in environment variables');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  public static getInstance(): EmergentDialogue {
    if (!EmergentDialogue.instance) {
      EmergentDialogue.instance = new EmergentDialogue();
    }
    return EmergentDialogue.instance;
  }

  async generateResponse(input: string, context?: DialogueContext): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a collaborative dialogue partner.',
          },
          {
            role: 'user',
            content: `Input: ${input}\nContext: ${JSON.stringify(context || {})}`,
          },
        ],
      });

      const result = response.choices[0].message.content || '';
      if (context) {
        this.context.set(input, context);
      }
      return result;
    } catch (error) {
      logger.error('Error in dialogue:', error);
      throw error;
    }
  }
}
