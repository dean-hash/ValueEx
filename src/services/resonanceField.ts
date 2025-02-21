import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DemandSignal,
  ResonanceMetrics,
  ResonanceState,
  ResonanceVector,
  Vector,
} from '../types/resonanceTypes';
import { IntelligenceEnhancer } from './intelligence/intelligenceEnhancer';
import { AwinProduct } from '../types/awin';
import { IResonanceField } from '../interfaces/resonanceField';
import { ResonancePattern } from '../types/resonancePattern';

export class ResonanceFieldService implements IResonanceField {
  private static instance: ResonanceFieldService;
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

    this.resonanceState = new BehaviorSubject<ResonanceMetrics>({
      coherence: 0,
      intensity: 0,
      confidence: 0,
    });

    combineLatest([this.supplyField, this.demandField])
      .pipe(map(([supply, demand]) => this.calculateResonance(supply, demand)))
      .subscribe((resonance) => this.resonanceState.next(resonance));
  }

  public static getInstance(): ResonanceFieldService {
    if (!ResonanceFieldService.instance) {
      ResonanceFieldService.instance = new ResonanceFieldService();
    }
    return ResonanceFieldService.instance;
  }

  public async initialize(): Promise<void> {
    // Initialize any required resources
  }

  public getCurrentState() {
    return {
      patterns: [],
      metrics: {
        coherence: this.resonanceState.value.coherence,
        intensity: this.resonanceState.value.intensity,
        confidence: this.resonanceState.value.confidence,
      },
    };
  }

  public observePatterns(): Observable<ResonancePattern> {
    return this.resonanceState.pipe(
      map((metrics) => ({
        id: Date.now().toString(),
        type: 'resonance',
        metrics,
        timestamp: new Date().toISOString(),
      }))
    );
  }

  private calculateResonance(supply: ResonanceState, demand: ResonanceState): ResonanceMetrics {
    const supplyVectors = supply.vectors.supply;
    const demandVectors = demand.vectors.demand;

    if (!supplyVectors.length || !demandVectors.length) {
      return {
        coherence: 0,
        intensity: 0,
        confidence: 0,
      };
    }

    const coherence = this.calculateCoherence(supplyVectors, demandVectors);
    const intensity = this.calculateIntensity(supplyVectors, demandVectors);
    const confidence = this.calculateConfidence(supplyVectors, demandVectors);

    return {
      coherence,
      intensity,
      confidence,
    };
  }

  private calculateCoherence(supply: ResonanceVector[], demand: ResonanceVector[]): number {
    let totalCoherence = 0;
    let count = 0;

    for (const supplyVector of supply) {
      for (const demandVector of demand) {
        if (supplyVector.dimension === demandVector.dimension) {
          const dotProduct = this.calculateDotProduct(
            supplyVector.direction,
            demandVector.direction
          );
          const contextSimilarity = this.calculateContextSimilarity(
            supplyVector.context,
            demandVector.context
          );
          totalCoherence += Math.abs(dotProduct) * contextSimilarity;
          count++;
        }
      }
    }

    return count > 0 ? totalCoherence / count : 0;
  }

  private calculateIntensity(supply: ResonanceVector[], demand: ResonanceVector[]): number {
    const supplyIntensity =
      supply.reduce((sum, vector) => sum + vector.magnitude, 0) / supply.length;
    const demandIntensity =
      demand.reduce((sum, vector) => sum + vector.magnitude, 0) / demand.length;

    return (supplyIntensity + demandIntensity) / 2;
  }

  private calculateConfidence(supply: ResonanceVector[], demand: ResonanceVector[]): number {
    const supplyStrength = supply.reduce((sum, vector) => sum + vector.strength, 0) / supply.length;
    const demandStrength = demand.reduce((sum, vector) => sum + vector.strength, 0) / demand.length;

    return (supplyStrength + demandStrength) / 2;
  }

  private calculateDotProduct(v1: number[], v2: number[]): number {
    return v1.reduce((sum, val, i) => sum + val * (v2[i] || 0), 0);
  }

  private calculateContextSimilarity(context1: string[], context2: string[]): number {
    const set1 = new Set(context1.map((s) => s.toLowerCase()));
    const set2 = new Set(context2.map((s) => s.toLowerCase()));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
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

  public async addDemandSignal(signal: DemandSignal): Promise<void> {
    const demandVectors = await this.intelligenceEnhancer.enhanceDemandContext(signal);
    demandVectors.forEach((vector: Vector) => this.addDemandVector(vector));
  }

  public async addProduct(product: AwinProduct): Promise<void> {
    const productVectors = await this.intelligenceEnhancer.enhanceProductUnderstanding(product);
    productVectors.forEach((vector: Vector) => this.addSupplyVector(vector));
  }

  public getResonanceState(): ResonanceMetrics {
    return this.resonanceState.getValue();
  }

  public async calculateProductResonance(
    product: AwinProduct,
    signal: DemandSignal
  ): Promise<number> {
    const productVectors = await this.intelligenceEnhancer.enhanceProductUnderstanding(product);
    const demandVectors = await this.intelligenceEnhancer.enhanceDemandPattern(signal);

    // Reset the fields
    this.supplyField.next({
      vectors: { supply: [], demand: [] },
      coherence: 0,
      intensity: 0,
      confidence: 0,
    });
    this.demandField.next({
      vectors: { supply: [], demand: [] },
      coherence: 0,
      intensity: 0,
      confidence: 0,
    });

    // Add the new vectors
    productVectors.vectors.forEach((vector) => this.addSupplyVector(vector));
    demandVectors.vectors.forEach((vector) => this.addDemandVector(vector));

    const resonance = this.getResonanceState();
    return (resonance.coherence + resonance.intensity + resonance.confidence) / 3;
  }
}
