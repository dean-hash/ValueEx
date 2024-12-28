import OpenAI from 'openai';
import { logger } from '../utils/logger';

export class CollaborativeIntelligence {
  private openai: OpenAI;
  private static instance: CollaborativeIntelligence;
  private context: Map<string, any> = new Map();

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

  async brainstorm(
    topic: string,
    context?: any
  ): Promise<{
    ideas: string[];
    rationale: string;
    questions: string[];
    risks: string[];
  }> {
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
                     - Market potential
                     - Innovation opportunities
                     - Potential challenges
                     Format response as JSON with keys: ideas, rationale, questions, risks`,
          },
          {
            role: 'user',
            content: `Topic: ${topic}\nContext: ${JSON.stringify(context || {})}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      this.context.set('lastBrainstorm', { topic, result });
      return result;
    } catch (error) {
      logger.error('Error during brainstorming session', { error, topic });
      throw error;
    }
  }

  async evaluateApproach(
    approach: string,
    criteria: string[]
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    alternativeApproaches: string[];
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `As a collaborative partner, evaluate the proposed approach considering:
                     - Technical architecture
                     - Scalability
                     - Maintainability
                     - User experience
                     - Performance
                     - Security
                     - Innovation potential
                     Provide constructive feedback and alternative perspectives.`,
          },
          {
            role: 'user',
            content: `Approach: ${approach}\nCriteria: ${JSON.stringify(criteria)}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      this.context.set('lastEvaluation', { approach, result });
      return result;
    } catch (error) {
      logger.error('Error evaluating approach', { error, approach });
      throw error;
    }
  }

  async enhanceSolution(
    currentSolution: string,
    goals: string[]
  ): Promise<{
    enhancements: string[];
    reasoning: string;
    implementation: string;
    considerations: string[];
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `As a collaborative partner, suggest enhancements to the current solution.
                     Consider:
                     - Innovation opportunities
                     - Performance optimizations
                     - User experience improvements
                     - Technical debt reduction
                     - Future scalability
                     - Integration possibilities
                     Provide practical, implementable suggestions with reasoning.`,
          },
          {
            role: 'user',
            content: `Current Solution: ${currentSolution}\nGoals: ${JSON.stringify(goals)}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      this.context.set('lastEnhancement', { currentSolution, result });
      return result;
    } catch (error) {
      logger.error('Error enhancing solution', { error, currentSolution });
      throw error;
    }
  }

  async exploreImplications(
    decision: string,
    context: string
  ): Promise<{
    immediate: string[];
    longTerm: string[];
    opportunities: string[];
    risks: string[];
    recommendations: string[];
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `As a collaborative partner, explore the full implications of this decision.
                     Consider:
                     - Technical implications
                     - Business impact
                     - User experience
                     - Ethical considerations
                     - Future flexibility
                     - Resource requirements
                     - Market positioning
                     Provide comprehensive analysis and actionable recommendations.`,
          },
          {
            role: 'user',
            content: `Decision: ${decision}\nContext: ${context}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      this.context.set('lastImplicationAnalysis', { decision, result });
      return result;
    } catch (error) {
      logger.error('Error exploring implications', { error, decision });
      throw error;
    }
  }
}
