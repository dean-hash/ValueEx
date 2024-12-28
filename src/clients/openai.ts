import OpenAI from 'openai';
import { configService } from '../config/configService';

export class OpenAIClient {
  private static instance: OpenAIClient;
  private client: OpenAI;

  private constructor() {
    const apiKey = configService.getOpenAIKey();

    if (!apiKey || apiKey.trim() === '') {
      throw new Error(
        'OpenAI API key is required. Please set OPENAI_API_KEY in your environment variables.'
      );
    }

    this.client = new OpenAI({
      apiKey: apiKey,
      maxRetries: 3,
      timeout: 30000,
    });
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

  // Helper method for common chat completion requests
  public async createChatCompletion(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: Partial<OpenAI.Chat.ChatCompletionCreateParams> = {}
  ): Promise<OpenAI.Chat.ChatCompletion> {
    try {
      const completion = await this.client.chat.completions.create({
        model: options.model || 'gpt-4-turbo-preview',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens,
        ...options,
        stream: false, // Ensure we get a ChatCompletion not a Stream
      });

      return completion as OpenAI.Chat.ChatCompletion;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        // Handle rate limits
        if (error.status === 429) {
          console.warn('OpenAI rate limit reached. Implementing exponential backoff...');
          // Could implement retry logic here
        }

        // Handle invalid API key
        if (error.status === 401) {
          console.error('Invalid OpenAI API key. Please check your configuration.');
        }
      }
      throw error;
    }
  }

  // Helper for JSON responses
  public async createJSONCompletion<T>(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: Partial<OpenAI.Chat.ChatCompletionCreateParams> = {}
  ): Promise<T | null> {
    try {
      const completion = await this.createChatCompletion(messages, {
        ...options,
        response_format: { type: 'json_object' },
        temperature: options.temperature ?? 0, // Default to 0 for JSON
      });

      const content = completion.choices[0]?.message?.content;
      return content ? JSON.parse(content) : null;
    } catch (error) {
      console.error('Error creating JSON completion:', error);
      return null;
    }
  }
}
