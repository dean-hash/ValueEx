interface NaturalHelp {
    state: {
        effort_required: boolean;
        already_connected: boolean;
        unfolding: string[];
    };
    assistance: {
        method: string;
        expressions: string[];
        impact: Map<string, any>;
    };
    force: {
        nature: string;
        flow: string[];
        manifestation: Set<string>;
    };
}
export declare class NaturalAssistance {
    private field;
    private patterns;
    flow(): Promise<NaturalHelp>;
    assist(): Promise<void>;
}
export {};
