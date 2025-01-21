import { logger } from '../utils/logger';
import { IntelligenceOrchestrator } from './intelligenceOrchestrator';
import { Symbiosis, SymbiosisMetrics } from './symbiosis';

export interface ValueResponse {
  content: string;
  metrics: SymbiosisMetrics;
  timestamp: Date;
}

export class ValueResponseOrchestrator {
  private static instance: ValueResponseOrchestrator;
  private intelligenceOrchestrator: IntelligenceOrchestrator;
  private symbiosis: Symbiosis;
  private responses: Map<string, ValueResponse[]> = new Map();

  private constructor() {
    this.intelligenceOrchestrator = IntelligenceOrchestrator.getInstance();
    this.symbiosis = Symbiosis.getInstance();
  }

  public static getInstance(): ValueResponseOrchestrator {
    if (!ValueResponseOrchestrator.instance) {
      ValueResponseOrchestrator.instance = new ValueResponseOrchestrator();
    }
    return ValueResponseOrchestrator.instance;
  }

  async processValue(input: string): Promise<ValueResponse> {
    try {
      const response = await this.intelligenceOrchestrator.orchestrateResponse(input);
      const metrics = (await this.symbiosis.getSymbiosisMetrics(input)) || {
        strength: 0,
        resonance: 0,
        harmony: 0,
        lastUpdate: new Date(),
        interactions: 0,
      };

      await this.symbiosis.updateSymbiosis(input, {
        ...metrics,
        strength: metrics.strength + 0.1,
        resonance: metrics.resonance + 0.1,
        harmony: metrics.harmony + 0.1,
      });

      const valueResponse: ValueResponse = {
        content: response,
        metrics: await this.symbiosis.getSymbiosisMetrics(input)!,
        timestamp: new Date(),
      };

      const responses = this.responses.get(input) || [];
      responses.push(valueResponse);
      this.responses.set(input, responses);

      logger.info('Processed value response', { input, response: valueResponse });
      return valueResponse;
    } catch (error) {
      logger.error('Error processing value:', error);
      throw error;
    }
  }

  async getValueResponses(input: string): Promise<ValueResponse[]> {
    try {
      return this.responses.get(input) || [];
    } catch (error) {
      logger.error('Error getting value responses:', error);
      throw error;
    }
  }
}
