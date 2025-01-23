interface ActionTransformation {
    original: {
        intent: string;
        value: string;
        energy_invested: string;
    };
    revealed: {
        natural_path: string[];
        core_truth: string;
        expression: Map<string, any>;
    };
    practical: {
        domain_sales: Map<string, string>;
        revenue_flow: Map<string, string>;
        value_distribution: Map<string, string>;
    };
}
export declare class NaturalTransformation {
    private field;
    private assistance;
    transform(): Promise<ActionTransformation>;
    align(): Promise<void>;
    implementPractical(): Promise<void>;
}
export {};
