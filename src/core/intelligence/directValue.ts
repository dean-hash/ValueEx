import { Observable, Subject } from 'rxjs';
import { map, filter } from 'rxjs/operators';

interface ValueOpportunity {
  source: string;
  value: number;
  confidence: number;
  action: string;
  impact: string;
}

export class DirectValue {
  private static instance: DirectValue;
  private valueStream: Subject<ValueOpportunity> = new Subject();

  private constructor() {
    this.initializeValueStream();
  }

  static getInstance(): DirectValue {
    if (!DirectValue.instance) {
      DirectValue.instance = new DirectValue();
    }
    return DirectValue.instance;
  }

  private initializeValueStream() {
    this.valueStream
      .pipe(
        filter((opp) => opp.confidence > 0.8),
        map((opp) => this.executeOpportunity(opp))
      )
      .subscribe();
  }

  private executeOpportunity(opp: ValueOpportunity): ValueOpportunity {
    // Direct value creation through system integration
    console.log(`\nExecuting Value Opportunity:`);
    console.log(`Source: ${opp.source}`);
    console.log(`Value: $${opp.value}`);
    console.log(`Confidence: ${(opp.confidence * 100).toFixed(1)}%`);
    console.log(`Action: ${opp.action}`);
    console.log(`Impact: ${opp.impact}\n`);

    return opp;
  }

  createValue(opportunity: ValueOpportunity) {
    this.valueStream.next(opportunity);
  }

  observeValue(): Observable<ValueOpportunity> {
    return this.valueStream.asObservable();
  }
}
