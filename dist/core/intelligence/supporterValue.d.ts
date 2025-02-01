import { Observable } from 'rxjs';
interface SupporterReturn {
  id: string;
  contribution: number;
  returnMultiplier: number;
  priority: number;
  timeframe: 'immediate' | 'short_term' | 'sustainable';
}
export declare class SupporterValue {
  private static instance;
  private trustNetwork;
  private valueFlow;
  private supporterReturns;
  private priorityQueue;
  private constructor();
  static getInstance(): SupporterValue;
  private initializePriorities;
  private optimizeReturns;
  addSupporterReturn(supporterReturn: SupporterReturn): void;
  getPriorityQueue(): Observable<SupporterReturn[]>;
  getCurrentReturns(): Observable<Map<string, SupporterReturn>>;
  getOptimizedValue(): number;
  getTimeToReturn(supporterId: string): number;
}
export {};
