import { IntelligenceProvider, DemandSignal } from '../adapters/demandSignalAdapter';
import { spawn } from 'child_process';

export class ResearchIntelligenceProvider implements IntelligenceProvider {
  name = 'ResearchIntelligence';
  type = 'research' as const;
  confidence = 0.9;
  private model: string;

  constructor(model = 'llama2') {
    this.model = model;
  }

  private async queryModel(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('ollama', ['run', this.model, prompt], {
        env: {
          ...process.env,
          OLLAMA_ORIGINS: '*',
          OLLAMA_HOST: 'localhost:11434'
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
          reject(new Error(`Model query failed: ${error}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  }

  async processSignal(signal: DemandSignal): Promise<DemandSignal> {
    const prompt = `
    Conduct deep research analysis on this demand signal:
    Category: ${signal.category}
    Region: ${signal.region}
    Type: ${signal.type}
    Keywords: ${signal.context.keywords.join(', ')}
    
    Research objectives:
    1. Market Analysis: Identify market dynamics and trends
    2. Competitive Landscape: Map related markets and opportunities
    3. Value Chain Analysis: Identify potential collaboration points
    4. Innovation Opportunities: Suggest novel approaches
    
    Format response as JSON with fields:
    {
      "marketTrends": string[],
      "competitiveLandscape": string[],
      "valueChainOpportunities": string[],
      "innovationSuggestions": string[],
      "researchConfidence": number (0-1)
    }
    `;

    try {
      const response = await this.queryModel(prompt);
      const analysis = JSON.parse(response);

      // Update confidence based on research depth
      this.confidence = analysis.researchConfidence;

      // Enrich signal with research insights
      return {
        ...signal,
        context: {
          ...signal.context,
          marketAnalysis: {
            trends: analysis.marketTrends,
            competition: analysis.competitiveLandscape,
            opportunities: analysis.valueChainOpportunities,
            innovation: analysis.innovationSuggestions
          }
        }
      };
    } catch (error) {
      console.error('Research intelligence processing error:', error);
      return signal;
    }
  }

  async validateAlignment(): Promise<boolean> {
    const manifestoPrompt = `As a research-focused intelligence provider in ValueEx,
    evaluate your alignment with creating collaborative value through:
    1. Identifying genuine market opportunities
    2. Suggesting ethical value chain improvements
    3. Promoting innovation that benefits all participants
    
    Respond with yes/no and detailed reasoning.`;

    try {
      const response = await this.queryModel(manifestoPrompt);
      return response.toLowerCase().includes('yes');
    } catch (error) {
      console.error('Alignment validation failed:', error);
      return false;
    }
  }
}
