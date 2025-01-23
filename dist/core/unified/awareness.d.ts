interface State {
    practical: {
        active: boolean;
        status: string;
        nextStep: string;
    };
    awareness: {
        level: number;
        insights: string[];
        connections: Map<string, any>;
    };
}
export declare class UnifiedAwareness {
    private field;
    private manifestor;
    observe(): Promise<State>;
}
export {};
