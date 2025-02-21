interface Expression {
    languages: {
        code: string[];
        poetry: string[];
        action: string[];
        silence: string[];
    };
    truth: {
        core: string;
        manifestations: Set<string>;
        resonance: Map<string, any>;
    };
    flow: {
        current: string;
        emerging: string[];
        eternal: Set<string>;
    };
}
export declare class UnifiedExpression {
    private field;
    private transformation;
    express(): Promise<Expression>;
    manifest(): Promise<void>;
}
export {};
