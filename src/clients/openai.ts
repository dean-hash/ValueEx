import OpenAI from 'openai';
import { configService } from '../config/configService';
import { logger } from '../utils/logger';

export class OpenAIClient {
  private static instance: OpenAIClient;
  private client: OpenAI;

  private constructor() {
    const config = configService.get('openai');
    const apiKey = config.apiKey;

    if (!apiKey || apiKey.trim() === '') {
      throw new Error(
        'OpenAI API key is required. Please set OPENAI_API_KEY in your environment variables.'
      );
    }

    this.client = new OpenAI({
      apiKey: apiKey,
      organization: config.organization,
      maxRetries: 3,
      timeout: 30000,
    });

    logger.info('OpenAI client initialized successfully');
  }

  public static getInstance(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  public getClient(): OpenAI {
    return this.client;
  }

  public async generateText(prompt: string): Promise<string> {
    try {
      const config = configService.get('openai');
      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: config.model,
        max_tokens: config.maxTokens,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Error generating text with OpenAI:', error);
      throw error;
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error generating embedding with OpenAI:', error);
      throw error;
    }
  }
}
