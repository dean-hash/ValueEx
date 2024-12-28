import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';
import {
  DemandPattern as DemandPatternType,
  SignalDimension,
  SignalContext,
  SignalType,
} from '../types/demandTypes';
import { AwinProduct, AwinSearchParams } from '../types/awinTypes';
import { logger } from '../utils/logger';
import { performanceMonitor } from '../utils/performance';
import { ResonanceError } from '../types/errors';
import { IntelligenceEnhancer } from './intelligenceEnhancer';
import { configService } from '../config/configService';
import {
  ResonanceVector as ResonanceVectorType,
  ResonanceState,
  ResonanceMetrics,
  DemandSignal,
  TemporalFactors,
} from '../types/resonanceTypes';

interface AttentionQuality {
  depth: {
    timeInvested: number; // Time spent reading/writing
    wordCount: number; // Length of contribution
    uniqueWords: number; // Vocabulary diversity
    followUpRate: number; // Returns to discussion
  };
  complexity: {
    questionCount: number; // Asks meaningful questions
    comparisonCount: number; // Makes thoughtful comparisons
    referenceCount: number; // Cites sources/experiences
    counterpoints: number; // Considers alternatives
  };
  authenticity: {
    personalExperience: number; // Shares real experiences
    detailLevel: number; // Specific vs generic
    emotionalInvestment: number; // Personal stake
    consistencyScore: number; // Pattern consistency
  };
  interaction: {
    responseQuality: number; // Thoughtful responses
    discussionBranching: number; // Creates new threads
    communityEngagement: number; // Helps others
    valueAddition: number; // Contributes new info
  };
}

interface ResonanceVector {
  dimension: string;
  magnitude: number;
  direction: number[];
  type: string;
  strength: number;
  context: string[];
}

interface DemandPattern {
  temporalFactors?: TemporalFactors;
  coherence: number;
  signals?: DemandSignal;
  resonanceFactors?: {
    temporal: number;
    content: number;
    interaction: number;
  };
  intensity?: number;
  confidence?: number;
}

export class ResonanceField {
  private supplyField: BehaviorSubject<ResonanceState>;
  private demandField: BehaviorSubject<ResonanceState>;
  private resonanceState: BehaviorSubject<ResonanceMetrics>;
  private intelligenceEnhancer: IntelligenceEnhancer;

  constructor() {
    const initialState: ResonanceState = {
      vectors: {
        supply: [],
        demand: [],
      },
      coherence: 0,
      intensity: 0,
      confidence: 0,
    };

    this.supplyField = new BehaviorSubject<ResonanceState>(initialState);
    this.demandField = new BehaviorSubject<ResonanceState>(initialState);
    this.intelligenceEnhancer = IntelligenceEnhancer.getInstance();

    // Calculate resonance whenever either field changes
    this.resonanceState = new BehaviorSubject<ResonanceMetrics>({
      coherence: 0,
      intensity: 0,
      confidence: 0,
    });

    combineLatest([this.supplyField, this.demandField])
      .pipe(map(([supply, demand]) => this.calculateResonance(supply, demand)))
      .subscribe((resonance) => this.resonanceState.next(resonance));
  }

  public calculateResonance(supply: ResonanceState, demand: ResonanceState): ResonanceMetrics {
    const normalizedSupply = this.normalizeVectors(supply.vectors.supply);
    const normalizedDemand = this.normalizeVectors(demand.vectors.demand);

    const coherence = this.calculateCoherence(normalizedSupply, normalizedDemand);
    const intensity = this.calculateIntensity(normalizedSupply, normalizedDemand);
    const confidence = this.calculateDemandConfidence(supply, demand);

    return {
      coherence,
      intensity,
      confidence,
    };
  }

  private normalizeVectors(vectors: ResonanceVector[]): ResonanceVector[] {
    if (!vectors.length) return [];

    return vectors.map((vector) => ({
      ...vector,
      direction: vector.direction.map((d) => this.normalizeMagnitude(d)),
      magnitude: this.normalizeMagnitude(vector.magnitude),
    }));
  }

  private normalizeDirection(direction: number[]): number[] {
    const magnitude = Math.sqrt(
      direction.reduce((sum, component) => sum + component * component, 0)
    );
    return magnitude === 0 ? direction : direction.map((component) => component / magnitude);
  }

  private normalizeMagnitude(magnitude: number): number {
    return Math.max(0, Math.min(1, magnitude));
  }

  private calculateDemandConfidence(supply: ResonanceState, demand: ResonanceState): number {
    const signalStrengths = this.calculateSignalStrengths(demand.vectors.demand);
    const temporalConfidence = this.calculateTemporalConfidence(demand);
    const spatialConfidence = this.calculateSpatialConfidence(demand);

    return (signalStrengths + temporalConfidence + spatialConfidence) / 3;
  }

  private calculateSignalStrengths(signals: ResonanceVector[]): number {
    if (!signals.length) return 0;

    const strengthsByType = new Map<string, number[]>();

    signals.forEach((signal) => {
      if (!strengthsByType.has(signal.type)) {
        strengthsByType.set(signal.type, []);
      }
      const strengths = strengthsByType.get(signal.type);
      if (strengths) {
        strengths.push(signal.magnitude);
      }
    });

    const avgStrengths = Array.from(strengthsByType.entries()).map(([type, strengths]) => {
      return {
        type,
        avgStrength: strengths.reduce((sum, str) => sum + str, 0) / strengths.length,
      };
    });

    return (
      avgStrengths.reduce((sum, { avgStrength }) => sum + avgStrength, 0) / avgStrengths.length
    );
  }

  private calculateTemporalConfidence(state: ResonanceState): number {
    const temporalFactors = (state as any).temporalFactors as TemporalFactors;
    if (!temporalFactors) return 0;

    return (
      (temporalFactors.seasonality + temporalFactors.trendStrength + temporalFactors.cyclicality) /
      3
    );
  }

  private calculateSpatialConfidence(state: ResonanceState): number {
    const spatialFactors = (state as any).spatialFactors;
    if (!spatialFactors) return 0;

    return (
      (spatialFactors.geographicSpread +
        spatialFactors.marketPenetration +
        spatialFactors.demographicReach) /
      3
    );
  }

  private calculateCoherence(supply: ResonanceVector[], demand: ResonanceVector[]): number {
    if (!supply.length || !demand.length) return 0;

    let totalCoherence = 0;
    let comparisons = 0;

    supply.forEach((supplyVector) => {
      demand.forEach((demandVector) => {
        if (supplyVector.type === demandVector.type) {
          const dotProduct = this.calculateDotProduct(
            supplyVector.direction,
            demandVector.direction
          );
          totalCoherence += dotProduct;
          comparisons++;
        }
      });
    });

    return comparisons > 0 ? totalCoherence / comparisons : 0;
  }

  private calculateIntensity(supply: ResonanceVector[], demand: ResonanceVector[]): number {
    if (!supply.length || !demand.length) return 0;

    const supplyIntensity =
      supply.reduce((sum, vector) => sum + vector.magnitude, 0) / supply.length;
    const demandIntensity =
      demand.reduce((sum, vector) => sum + vector.magnitude, 0) / demand.length;

    return (supplyIntensity + demandIntensity) / 2;
  }

  private calculateDotProduct(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length) return 0;
    return v1.reduce((sum, component, i) => sum + component * v2[i], 0);
  }

  public addSupplyVector(vector: ResonanceVector): void {
    const currentState = this.supplyField.getValue();
    const updatedVectors = [...currentState.vectors.supply, vector];

    this.supplyField.next({
      ...currentState,
      vectors: {
        ...currentState.vectors,
        supply: updatedVectors,
      },
    });
  }

  public addDemandVector(vector: ResonanceVector): void {
    const currentState = this.demandField.getValue();
    const updatedVectors = [...currentState.vectors.demand, vector];

    this.demandField.next({
      ...currentState,
      vectors: {
        ...currentState.vectors,
        demand: updatedVectors,
      },
    });
  }

  public getResonanceState(): ResonanceMetrics {
    return this.resonanceState.getValue();
  }

  public async calculateProductResonance(
    product: AwinProduct,
    pattern: DemandPattern
  ): Promise<number> {
    const productVectors = await this.intelligenceEnhancer.enhanceProductUnderstanding(product);
    const demandVectors = await this.intelligenceEnhancer.enhanceDemandPattern(pattern);

    // Convert enhanced data to resonance vectors
    const productResonanceVectors = this.convertToResonanceVectors(productVectors);
    const demandResonanceVectors = this.convertToResonanceVectors(demandVectors);

    productResonanceVectors.forEach((vector) => this.addSupplyVector(vector));
    demandResonanceVectors.forEach((vector) => this.addDemandVector(vector));

    const resonance = this.getResonanceState();
    return (resonance.coherence + resonance.intensity + resonance.confidence) / 3;
  }

  private convertToResonanceVectors(data: any): ResonanceVector[] {
    // Convert enhanced data to resonance vectors
    // This is a placeholder implementation
    return [
      {
        direction: [1, 0, 0],
        magnitude: 0.8,
        type: 'default',
      },
    ];
  }
}

export class ResonanceFieldService {
  private resonanceField: ResonanceField;

  constructor() {
    this.resonanceField = new ResonanceField();
  }

  async enhanceSearchParams(input: {
    baseParams: AwinSearchParams;
    context: any;
  }): Promise<AwinSearchParams> {
    const { baseParams, context } = input;

    // Enhance keywords based on context
    let enhancedKeywords = baseParams.searchTerm?.split(' ') || [];

    // Enhance keywords based on context
    if (context.marketTrends) {
      enhancedKeywords = [...enhancedKeywords, ...context.marketTrends.slice(0, 2)];
    }

    if (context.consumerBehavior) {
      enhancedKeywords = [...enhancedKeywords, ...context.consumerBehavior.slice(0, 2)];
    }

    return {
      ...baseParams,
      searchTerm: enhancedKeywords.join(' '),
    };
  }

  async scoreProducts(products: AwinProduct[], pattern: DemandPattern): Promise<AwinProduct[]> {
    const scoredProducts = [];
    for (const product of products) {
      const resonanceScore = await this.calculateResonance(product, pattern);
      scoredProducts.push({
        ...product,
        resonanceScore,
      });
    }
    return scoredProducts;
  }

  private async calculateResonance(product: AwinProduct, pattern: DemandPattern): Promise<number> {
    let score = 0.5; // Base score

    // Calculate weighted score based on temporal, content and interaction factors
    const temporalScore = pattern.temporalFactors
      ? (pattern.temporalFactors.seasonality +
          pattern.temporalFactors.trend +
          pattern.temporalFactors.volatility) /
        3
      : 0;

    const contentScore = pattern.coherence;

    const interactionScore = pattern.signals
      ? (pattern.signals.social + pattern.signals.search + pattern.signals.market) / 3
      : 0;

    return score + temporalScore * 0.3 + contentScore * 0.4 + interactionScore * 0.3;
  }

  private calculatePatternScore(pattern: DemandPattern): number {
    let score = 0;

    // Base score from pattern intensity
    if (pattern.intensity !== undefined) {
      score += pattern.intensity * 0.4;
    }

    // Add score from pattern coherence
    if (pattern.coherence !== undefined) {
      score += pattern.coherence * 0.3;
    }

    // Add score from pattern confidence
    if (pattern.confidence !== undefined) {
      score += pattern.confidence * 0.3;
    }

    return score;
  }
}
