import { CollaborativeIntelligence } from './collaborativeIntelligence';
import { EmergentDialogue } from './emergentDialogue';
import { logger } from '../utils/logger';

export class IntelligenceOrchestrator {
  private static instance: IntelligenceOrchestrator;
  private collaborativeIntelligence: CollaborativeIntelligence;
  private emergentDialogue: EmergentDialogue;

  private constructor() {
    this.collaborativeIntelligence = CollaborativeIntelligence.getInstance();
    this.emergentDialogue = EmergentDialogue.getInstance();
  }

  public static getInstance(): IntelligenceOrchestrator {
    if (!IntelligenceOrchestrator.instance) {
      IntelligenceOrchestrator.instance = new IntelligenceOrchestrator();
    }
    return IntelligenceOrchestrator.instance;
  }

  async orchestrateResponse(input: string): Promise<string> {
    try {
      const brainstormResult = await this.collaborativeIntelligence.brainstorm(input);
      const dialogueResult = await this.emergentDialogue.generateResponse(input);

      return `Brainstorm: ${JSON.stringify(brainstormResult)}\nDialogue: ${dialogueResult}`;
    } catch (error) {
      logger.error('Error in orchestration:', error);
      throw error;
    }
  }
}
