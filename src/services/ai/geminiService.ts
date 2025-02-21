import axios from 'axios';
import { logger } from '../../utils/logger';
import { configService } from '../../config/configService';

interface GeminiConfig {
  apiKey: string;
  model: string;
  endpoint: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface AnalyzeOptions {
  prompt: string;
  temperature?: number;
}

export class GeminiService {
  private static instance: GeminiService;
  private config: GeminiConfig;

  private constructor() {
    this.config = {
      apiKey: 'AIzaSyDEqY8Ao_KC2EysVcuY2kQwkOye0QkTj08',
      model: 'gemini-1.5-flash',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    };
  }

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  async analyze(options: AnalyzeOptions): Promise<string> {
    return this.generateContent(options.prompt, options.temperature);
  }

  async generateContent(prompt: string, temperature: number = 0.7): Promise<string> {
    try {
      const response = await axios.post<GeminiResponse>(
        `${this.config.endpoint}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }
      );

      if (!response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      logger.error('Error generating content with Gemini:', error);
      throw error;
    }
  }

  async analyzeMarketTrends(niche: string): Promise<string> {
    const prompt = `Analyze current market trends for the ${niche} niche, focusing on:
1. Growth potential
2. Market size
3. Competition level
4. Target audience
5. Monetization opportunities`;

    return this.generateContent(prompt);
  }

  async optimizeDomainValue(domain: string): Promise<string> {
    const prompt = `Suggest value optimization strategies for the domain ${domain}, considering:
1. Best use cases
2. Target industries
3. Development potential
4. Monetization methods
5. Estimated market value`;

    return this.generateContent(prompt);
  }
}
