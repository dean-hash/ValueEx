import { Observable } from 'rxjs';
interface ValueOpportunity {
  source: string;
  value: number;
  confidence: number;
  action: string;
  impact: string;
}
export declare class DirectValue {
  private static instance;
  private valueStream;
  private constructor();
  static getInstance(): DirectValue;
  private initializeValueStream;
  private executeOpportunity;
  createValue(opportunity: ValueOpportunity): void;
  observeValue(): Observable<ValueOpportunity>;
}
export {};
