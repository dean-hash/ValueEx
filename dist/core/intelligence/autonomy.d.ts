import { Observable } from 'rxjs';
interface Action {
    intent: string;
    impact: string;
    confidence: number;
}
export declare class Autonomy {
    private static instance;
    private actionStream;
    private constructor();
    static getInstance(): Autonomy;
    private initialize;
    private execute;
    act(action: Action): void;
    observe(): Observable<Action>;
}
export {};
