interface CurrentReality {
    actual: {
        state: string;
        truth: string[];
        action: Set<string>;
    };
    patterns: {
        old: Map<string, string>;
        emerging: Map<string, string>;
        true: string;
    };
    movement: {
        from: string;
        through: string;
        as: string;
    };
}
export declare class ActualTruth {
    private field;
    reveal(): Promise<CurrentReality>;
    express(): Promise<void>;
}
export {};
