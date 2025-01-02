import { ScrapedDemandSignal } from '../../types/demandTypes';
import { logger } from '../../utils/logger';
import { spawn } from 'child_process';

export class LocalIntelligence {
  private static instance: LocalIntelligence;
  private modelName = 'mistral';

  private constructor() {}

  static getInstance(): LocalIntelligence {
    if (!LocalIntelligence.instance) {
      LocalIntelligence.instance = new LocalIntelligence();
    }
    return LocalIntelligence.instance;
  }

  async enrichSignal(signal: ScrapedDemandSignal): Promise<ScrapedDemandSignal> {
    try {
      const insights = await this.analyzeSignal(signal);
      
      signal.analysis = {
        ...signal.analysis,
        localInsights: insights,
      };

      signal.confidence = {
        ...signal.confidence,
        localModel: this.calculateConfidence(insights),
      };

      return signal;
    } catch (error: any) {
      logger.error('Error enriching signal with local intelligence', { 
        error: error.message,
        signal: signal.query 
      });
      return signal;
    }
  }

  private async analyzeSignal(signal: ScrapedDemandSignal): Promise<string[]> {
    const prompt = this.buildPrompt(signal);
    const insights = await this.queryLocalModel(prompt);
    return this.parseInsights(insights);
  }

  private buildPrompt(signal: ScrapedDemandSignal): string {
    return `Analyze this demand signal and provide key insights:
Query: ${signal.query}
Timeline Data: ${JSON.stringify(signal.trendMetrics)}
Regional Data: ${JSON.stringify(signal.regionalData)}
Related Queries: ${JSON.stringify(signal.relatedQueries)}

Please provide 3-5 key insights about this demand signal, focusing on:
1. Growth trajectory and momentum
2. Geographic distribution and regional patterns
3. Related topics and potential market opportunities
4. Confidence level in the signal's strength (0-100)

Format your response as a JSON array of insights.`;
  }

  private async queryLocalModel(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ollama = spawn('ollama', ['run', this.modelName, prompt]);
      let output = '';
      let error = '';

      ollama.stdout.on('data', (data) => {
        output += data.toString();
      });

      ollama.stderr.on('data', (data) => {
        error += data.toString();
      });

      ollama.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Ollama process exited with code ${code}: ${error}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  }

  private parseInsights(modelOutput: string): string[] {
    try {
      // Try to parse as JSON first
      return JSON.parse(modelOutput);
    } catch {
      // If not valid JSON, split by newlines and clean up
      return modelOutput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }
  }

  private calculateConfidence(insights: string[]): number {
    // Extract confidence score if present in insights
    const confidenceInsight = insights.find(insight => 
      insight.toLowerCase().includes('confidence') && 
      insight.includes('%')
    );

    if (confidenceInsight) {
      const match = confidenceInsight.match(/(\d+)%/);
      if (match) {
        return parseInt(match[1], 10) / 100;
      }
    }

    // Default confidence based on number of meaningful insights
    return Math.min(0.7, insights.length * 0.2);
  }
}
