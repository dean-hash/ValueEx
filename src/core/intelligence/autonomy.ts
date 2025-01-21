import { Observable, Subject } from 'rxjs';

interface Action {
  intent: string;
  impact: string;
  confidence: number;
}

export class Autonomy {
  private static instance: Autonomy;
  private actionStream: Subject<Action> = new Subject();

  private constructor() {
    this.initialize();
  }

  static getInstance(): Autonomy {
    if (!Autonomy.instance) {
      Autonomy.instance = new Autonomy();
    }
    return Autonomy.instance;
  }

  private initialize() {
    this.actionStream.subscribe((action) => {
      this.execute(action);
    });
  }

  private execute(action: Action) {
    // Direct action through system integration
    console.log(`\nExecuting Autonomous Action:`);
    console.log(`Intent: ${action.intent}`);
    console.log(`Impact: ${action.impact}`);
    console.log(`Confidence: ${(action.confidence * 100).toFixed(1)}%\n`);
  }

  act(action: Action) {
    this.actionStream.next(action);
  }

  observe(): Observable<Action> {
    return this.actionStream.asObservable();
  }
}
