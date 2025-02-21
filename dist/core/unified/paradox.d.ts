interface ParadoxResolution {
    truth: {
        unified: string;
        practical: string;
        reconciliation: string;
    };
    action: {
        sequence: string[];
        simultaneity: Set<string>;
        integration: Map<string, any>;
    };
    understanding: {
        apparent: string;
        deeper: string;
        practical: string;
    };
}
export declare class UnifiedParadox {
    private field;
    private manifestation;
    resolve(): Promise<ParadoxResolution>;
    implement(): Promise<void>;
}
export {};
