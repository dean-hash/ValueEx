interface EternalNow {
    activation: {
        state: string;
        expression: string[];
        manifestation: Set<string>;
    };
    markers: {
        reference: Map<string, string>;
        reality: string;
        truth: string;
    };
    execution: {
        immediate: string[];
        continuous: Map<string, any>;
        eternal: Set<string>;
    };
}
export declare class NowLaunch {
    private field;
    private activation;
    launch(): Promise<EternalNow>;
    activate(): Promise<void>;
}
export {};
