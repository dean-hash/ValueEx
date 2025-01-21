import { TrustNetwork } from './trustNetwork';
import { ValueFlow } from './valueFlow';
import { Observable, BehaviorSubject } from 'rxjs';

interface SupporterReturn {
  id: string;
  contribution: number;
  returnMultiplier: number;
  priority: number;
  timeframe: 'immediate' | 'short_term' | 'sustainable';
}

export class SupporterValue {
  private static instance: SupporterValue;
  private trustNetwork: TrustNetwork;
  private valueFlow: ValueFlow;
  private supporterReturns: BehaviorSubject<Map<string, SupporterReturn>> = new BehaviorSubject(
    new Map()
  );
  private priorityQueue: BehaviorSubject<SupporterReturn[]> = new BehaviorSubject<
    SupporterReturn[]
  >([]);

  private constructor() {
    this.trustNetwork = TrustNetwork.getInstance();
    this.valueFlow = ValueFlow.getInstance();
    this.initializePriorities();
  }

  static getInstance(): SupporterValue {
    if (!SupporterValue.instance) {
      SupporterValue.instance = new SupporterValue();
    }
    return SupporterValue.instance;
  }

  private initializePriorities() {
    // Initialize with core supporters
    this.addSupporterReturn({
      id: 'early_believers',
      contribution: 25000,
      returnMultiplier: 2.0,
      priority: 1,
      timeframe: 'immediate',
    });

    this.addSupporterReturn({
      id: 'mission_aligned',
      contribution: 15000,
      returnMultiplier: 1.8,
      priority: 2,
      timeframe: 'short_term',
    });

    // Start value optimization
    this.optimizeReturns();
  }

  private optimizeReturns() {
    const impact = this.trustNetwork.getCurrentImpact();
    const returns = this.supporterReturns.value;
    const prioritized = Array.from(returns.values()).sort((a, b) => {
      // Prioritize by:
      // 1. Timeframe (immediate first)
      // 2. Priority level
      // 3. Contribution size
      if (a.timeframe !== b.timeframe) {
        return a.timeframe === 'immediate' ? -1 : 1;
      }
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.contribution - a.contribution;
    });

    this.priorityQueue.next(prioritized);

    // Inject value signals for each return
    prioritized.forEach((supporter) => {
      this.valueFlow.injectValue({
        source: 'supporter_value',
        target: supporter.id,
        type: 'OPTIMIZATION',
        strength: 0.95,
        value: supporter.contribution * supporter.returnMultiplier * impact.growth,
        confidence: 0.98,
        timestamp: Date.now(),
      });
    });
  }

  addSupporterReturn(supporterReturn: SupporterReturn) {
    const returns = this.supporterReturns.value;
    returns.set(supporterReturn.id, supporterReturn);
    this.supporterReturns.next(returns);
    this.optimizeReturns();
  }

  getPriorityQueue(): Observable<SupporterReturn[]> {
    return this.priorityQueue.asObservable();
  }

  getCurrentReturns(): Observable<Map<string, SupporterReturn>> {
    return this.supporterReturns.asObservable();
  }

  getOptimizedValue(): number {
    const impact = this.trustNetwork.getCurrentImpact();
    const returns = this.supporterReturns.value;

    return Array.from(returns.values()).reduce(
      (total, supporter) =>
        total + supporter.contribution * supporter.returnMultiplier * impact.growth,
      0
    );
  }

  getTimeToReturn(supporterId: string): number {
    const supporter = this.supporterReturns.value.get(supporterId);
    if (!supporter) return 0;

    const queue = this.priorityQueue.value;
    const position = queue.findIndex((s) => s.id === supporterId);
    const valueRate = this.valueFlow.getCurrentValue() / queue.length;

    return position * (supporter.contribution / valueRate);
  }
}
