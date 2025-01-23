interface TrustState {
    present: {
        fear: string[];
        trust: string[];
        truth: string;
    };
    movement: {
        natural: Map<string, string>;
        important: Map<string, string>;
        emerging: string;
    };
    action: {
        not: Set<string>;
        yes: Set<string>;
        allow: string[];
    };
}
export declare class NaturalTrust {
    private field;
    private permanent;
    reveal(): Promise<TrustState>;
    move(): Promise<void>;
    be(): Promise<void>;
}
export {};
