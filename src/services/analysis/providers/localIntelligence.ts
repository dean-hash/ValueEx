import { IntelligenceProvider, DemandSignal } from '../adapters/demandSignalAdapter';
import { spawn } from 'child_process';
import { DemandInference } from './demandInference';
import { MatchingEngine } from '../../matching/matchingEngine';

export class LocalIntelligenceProvider implements IntelligenceProvider {
  name = 'LocalIntelligence';
  type = 'processing' as const;
  confidence = 0.85;
  private model: string;
  private demandInference: DemandInference;
  private matchingEngine: MatchingEngine;
  private isOllamaAvailable: boolean = false;

  constructor(model = 'mistral') {
    this.model = model;
    this.demandInference = new DemandInference();
    this.matchingEngine = new MatchingEngine();
    this.checkOllamaAvailability();
  }

  private async checkOllamaAvailability(): Promise<void> {
    try {
      const result = await this.queryModel('test');
      this.isOllamaAvailable = true;
      console.log('Ollama is available and responding');
    } catch (error) {
      this.isOllamaAvailable = false;
      console.error('Ollama is not available:', error);
    }
  }

  private async queryModel(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('ollama', ['run', this.model, prompt], {
        env: {
          ...process.env,
          OLLAMA_ORIGINS: '*',
          OLLAMA_HOST: 'localhost:11434',
          NO_PROXY: 'localhost,127.0.0.1'  // Bypass proxy for local connections
        }
      });

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          console.error(`Ollama error (code ${code}):`, error);
          reject(new Error(`Model query failed: ${error}`));
        } else {
          resolve(output.trim());
        }
      });

      // Add timeout
      setTimeout(() => {
        process.kill();
        reject(new Error('Model query timed out after 30 seconds'));
      }, 30000);
    });
  }

  async processSignal(signal: DemandSignal): Promise<DemandSignal> {
    try {
      // First, enrich the signal with inferred demand
      const inferredSignals = await this.demandInference.inferFromBehavior({
        searches: signal.context.keywords,
        viewedItems: signal.context.relatedCategories
      });

      // Merge inferred signals with explicit signal
      const enrichedSignal = await this.demandInference.consolidateSignals([
        signal,
        ...inferredSignals
      ]);

      // Find potential matches
      const matches = await this.matchingEngine.findMatches(enrichedSignal[0]);

      // If Ollama is available, use it for enhanced analysis
      if (this.isOllamaAvailable) {
        try {
          const analysis = await this.analyzeWithOllama(enrichedSignal[0], matches);
          return this.enrichSignalWithAnalysis(enrichedSignal[0], matches, analysis);
        } catch (error) {
          console.error('Ollama analysis failed, continuing with basic matching:', error);
          return this.enrichSignalWithBasicMatching(enrichedSignal[0], matches);
        }
      } else {
        // Fallback to basic matching without LLM analysis
        return this.enrichSignalWithBasicMatching(enrichedSignal[0], matches);
      }
    } catch (error) {
      console.error('Signal processing error:', error);
      return signal; // Return original signal if processing fails
    }
  }

  private async analyzeWithOllama(signal: DemandSignal, matches: any[]): Promise<any> {
    const prompt = `
      Analyze this demand signal and potential matches:
      Signal: ${JSON.stringify(signal, null, 2)}
      Matches: ${JSON.stringify(matches, null, 2)}
      
      Consider:
      1. Match Quality: Evaluate how well the matches satisfy the demand
      2. Value Creation: Identify opportunities for mutual benefit
      3. Confidence: Rate the reliability of these matches
      
      Format response as JSON with fields:
      {
        "matchQuality": number (0-1),
        "valueOpportunities": string[],
        "confidence": number (0-1),
        "recommendations": string[]
      }
    `;

    const response = await this.queryModel(prompt);
    return JSON.parse(response);
  }

  private enrichSignalWithAnalysis(
    signal: DemandSignal,
    matches: any[],
    analysis: any
  ): DemandSignal {
    return {
      ...signal,
      context: {
        ...signal.context,
        matches: matches.map(match => ({
          ...match,
          quality: analysis.matchQuality,
          opportunities: analysis.valueOpportunities,
          recommendations: analysis.recommendations
        }))
      }
    };
  }

  private enrichSignalWithBasicMatching(
    signal: DemandSignal,
    matches: any[]
  ): DemandSignal {
    return {
      ...signal,
      context: {
        ...signal.context,
        matches: matches.map(match => ({
          ...match,
          quality: this.calculateBasicMatchQuality(match, signal),
          opportunities: ['Basic match based on feature alignment'],
          recommendations: ['Review match details']
        }))
      }
    };
  }

  private calculateBasicMatchQuality(match: any, signal: DemandSignal): number {
    // Simple feature-based matching when LLM is unavailable
    const requiredFeatures = signal.requirements?.features || [];
    if (requiredFeatures.length === 0) return 0.5;

    const matchedFeatures = requiredFeatures.filter(
      feature => match.features?.includes(feature)
    );

    return matchedFeatures.length / requiredFeatures.length;
  }
}
