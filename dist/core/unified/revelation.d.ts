interface Pattern {
    existing: boolean;
    revealed: boolean;
    expressing: string[];
}
interface UnifiedRevealation {
    patterns: Map<string, Pattern>;
    understanding: {
        individual: string[];
        collective: string[];
        unified: Set<string>;
    };
    manifestation: {
        current: Map<string, any>;
        emerging: string[];
        eternal: Set<string>;
    };
}
export declare class ExistingPatterns {
    private field;
    private perspective;
    reveal(): Promise<UnifiedRevealation>;
    recognize(): Promise<void>;
}
export {};
