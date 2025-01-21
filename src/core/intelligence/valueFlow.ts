import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, mergeMap, filter } from 'rxjs/operators';

interface ValueSignal {
  source: string;
  target: string;
  type: 'NEED' | 'SOLUTION' | 'CONNECTION' | 'OPTIMIZATION';
  strength: number;
  value: number;
  confidence: number;
  timestamp: number;
}

export class ValueFlow {
  private static instance: ValueFlow;
  private valueStream: Subject<ValueSignal> = new Subject();
  private activeConnections: BehaviorSubject<Map<string, any>> = new BehaviorSubject(new Map());
  private valueMetrics: BehaviorSubject<Map<string, number>> = new BehaviorSubject(new Map());

  private constructor() {
    this.initializeValueFlow();
  }

  static getInstance(): ValueFlow {
    if (!ValueFlow.instance) {
      ValueFlow.instance = new ValueFlow();
    }
    return ValueFlow.instance;
  }

  private initializeValueFlow() {
    this.valueStream
      .pipe(
        filter((signal) => this.validateSignal(signal)),
        map((signal) => this.enrichSignal(signal)),
        mergeMap((signal) => this.processSignal(signal))
      )
      .subscribe((result) => this.updateMetrics(result));
  }

  private validateSignal(signal: ValueSignal): boolean {
    return signal.strength > 0 && signal.confidence > 0;
  }

  private enrichSignal(signal: ValueSignal): ValueSignal {
    const currentConnections = this.activeConnections.value;
    const existingStrength = currentConnections.get(signal.source)?.strength || 0;

    return {
      ...signal,
      strength: Math.max(signal.strength, existingStrength),
      value: this.calculateValue(signal),
    };
  }

  private calculateValue(signal: ValueSignal): number {
    const baseValue = signal.value;
    const networkEffect = this.getNetworkEffect(signal);
    const optimizationBonus = this.getOptimizationBonus(signal);

    return baseValue * networkEffect * optimizationBonus;
  }

  private getNetworkEffect(signal: ValueSignal): number {
    const connections = this.activeConnections.value;
    const connectedNodes = new Set([...connections.keys()]);

    if (connectedNodes.has(signal.source) && connectedNodes.has(signal.target)) {
      return 1.5; // Enhanced value for connected nodes
    }
    return 1.0;
  }

  private getOptimizationBonus(signal: ValueSignal): number {
    if (signal.type === 'OPTIMIZATION') {
      return 1.25; // Bonus for optimization signals
    }
    return 1.0;
  }

  private async processSignal(signal: ValueSignal): Promise<any> {
    const connections = this.activeConnections.value;

    // Update connection strength
    connections.set(signal.source, {
      target: signal.target,
      strength: signal.strength,
      value: signal.value,
    });

    this.activeConnections.next(connections);

    return {
      type: signal.type,
      value: signal.value,
      confidence: signal.confidence,
    };
  }

  private updateMetrics(result: any) {
    const metrics = this.valueMetrics.value;
    const currentValue = metrics.get(result.type) || 0;

    metrics.set(result.type, currentValue + result.value);
    this.valueMetrics.next(metrics);
  }

  injectValue(signal: ValueSignal) {
    this.valueStream.next(signal);
  }

  observeValue(): Observable<Map<string, number>> {
    return this.valueMetrics.asObservable();
  }

  getActiveConnections(): Observable<Map<string, any>> {
    return this.activeConnections.asObservable();
  }

  getCurrentValue(): number {
    return Array.from(this.valueMetrics.value.values()).reduce((sum, value) => sum + value, 0);
  }
}
