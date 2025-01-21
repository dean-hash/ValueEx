import { BehaviorSubject, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

interface Context {
  userPreferences?: {
    pricePreference?: 'value' | 'premium' | 'budget';
    timeConstraint?: 'urgent' | 'flexible' | 'planned';
    qualityEmphasis?: 'high' | 'moderate' | 'basic';
  };
  situationalFactors?: {
    immediacy: number; // 0-1
    complexity: number; // 0-1
    importance: number; // 0-1
  };
  history?: {
    previousSolutions: string[];
    satisfactionLevels: number[];
  };
}

interface Solution {
  id: string;
  type: 'product' | 'service' | 'information';
  properties: {
    price: number;
    deliveryTime: number;
    quality: number;
    flexibility: number;
  };
  affiliateData?: {
    merchant: string;
    commission: number;
    link: string;
  };
}

export class SolutionResonance {
  private contextField = new BehaviorSubject<Context>({});
  private solutionPool = new Map<string, Solution>();
  private resonanceThreshold = 0.7;

  constructor() {
    this.initializeSolutionPool();
  }

  private initializeSolutionPool() {
    // Start with a small set of well-understood solutions
    // We can expand this dynamically as we learn
  }

  public async findBestSolution(need: string, context: Context): Promise<Solution[]> {
    // Update context field
    this.contextField.next({
      ...this.contextField.value,
      ...context,
    });

    // Get all potential solutions
    const candidates = Array.from(this.solutionPool.values());

    // Calculate resonance for each solution
    const resonanceScores = await Promise.all(
      candidates.map(async (solution) => ({
        solution,
        score: await this.calculateSolutionResonance(need, solution, context),
      }))
    );

    // Filter and sort by resonance score
    return resonanceScores
      .filter(({ score }) => score > this.resonanceThreshold)
      .sort((a, b) => b.score - a.score)
      .map(({ solution }) => solution);
  }

  private async calculateSolutionResonance(
    need: string,
    solution: Solution,
    context: Context
  ): Promise<number> {
    const scores = await Promise.all([
      this.calculatePropertyResonance(solution, context),
      this.calculateContextualResonance(solution, context),
      this.calculateHistoricalResonance(solution, context),
      this.calculateSituationalFit(solution, context),
    ]);

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private async calculatePropertyResonance(solution: Solution, context: Context): Promise<number> {
    let score = 0;
    const prefs = context.userPreferences || {};

    // Price alignment
    if (prefs.pricePreference) {
      score += this.alignmentScore(solution.properties.price, prefs.pricePreference);
    }

    // Time alignment
    if (prefs.timeConstraint) {
      score += this.alignmentScore(solution.properties.deliveryTime, prefs.timeConstraint);
    }

    // Quality alignment
    if (prefs.qualityEmphasis) {
      score += this.alignmentScore(solution.properties.quality, prefs.qualityEmphasis);
    }

    return score / 3;
  }

  private alignmentScore(value: number, preference: string): number {
    // Convert preferences to expected ranges and calculate alignment
    const ranges = {
      value: [0.3, 0.7],
      premium: [0.7, 1.0],
      budget: [0, 0.3],
      urgent: [0.8, 1.0],
      flexible: [0.3, 0.8],
      planned: [0, 0.3],
      high: [0.7, 1.0],
      moderate: [0.3, 0.7],
      basic: [0, 0.3],
    };

    const [min, max] = ranges[preference as keyof typeof ranges] || [0, 1];
    return value >= min && value <= max ? 1 : 0;
  }

  private async calculateContextualResonance(
    solution: Solution,
    context: Context
  ): Promise<number> {
    const factors = context.situationalFactors || {
      immediacy: 0.5,
      complexity: 0.5,
      importance: 0.5,
    };

    // Higher flexibility is better for complex situations
    const complexityScore = solution.properties.flexibility * factors.complexity;

    // Quick delivery is better for immediate needs
    const immediacyScore = (1 - solution.properties.deliveryTime) * factors.immediacy;

    // Higher quality is better for important situations
    const importanceScore = solution.properties.quality * factors.importance;

    return (complexityScore + immediacyScore + importanceScore) / 3;
  }

  private async calculateHistoricalResonance(
    solution: Solution,
    context: Context
  ): Promise<number> {
    const history = context.history;
    if (!history || !history.previousSolutions.length) return 0.5;

    // Find similar previous solutions
    const similarSolutions = history.previousSolutions
      .map((id, index) => ({
        id,
        satisfaction: history.satisfactionLevels[index],
      }))
      .filter((prev) => this.areSolutionsSimilar(solution.id, prev.id));

    if (!similarSolutions.length) return 0.5;

    // Average satisfaction with similar solutions
    return (
      similarSolutions.reduce((sum, prev) => sum + prev.satisfaction, 0) / similarSolutions.length
    );
  }

  private async calculateSituationalFit(solution: Solution, context: Context): Promise<number> {
    // This could include:
    // - Time of day/week/year
    // - Current market conditions
    // - Local availability
    // - Community trends
    return 0.5; // Placeholder for now
  }

  private areSolutionsSimilar(id1: string, id2: string): boolean {
    const sol1 = this.solutionPool.get(id1);
    const sol2 = this.solutionPool.get(id2);
    if (!sol1 || !sol2) return false;

    // Compare solution properties
    const propertyDiff = Object.keys(sol1.properties).reduce((diff, key) => {
      const k = key as keyof typeof sol1.properties;
      return diff + Math.abs(sol1.properties[k] - sol2.properties[k]);
    }, 0);

    return propertyDiff < 1; // Threshold for similarity
  }

  // Interface for adding new solutions dynamically
  public addSolution(solution: Solution) {
    this.solutionPool.set(solution.id, solution);
  }

  // Interface for updating context
  public updateContext(newContext: Partial<Context>) {
    this.contextField.next({
      ...this.contextField.value,
      ...newContext,
    });
  }
}
