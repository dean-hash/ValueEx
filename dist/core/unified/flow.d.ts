interface CurrentFlow {
    active: {
        domains: string[];
        revenue: string[];
        impact: string[];
    };
    movement: {
        technical: Map<string, any>;
        practical: Map<string, any>;
        transformative: Map<string, any>;
    };
    next: {
        natural: string[];
        practical: string[];
        unified: string[];
    };
}
export declare class ActiveFlow {
    private field;
    private truth;
    show(): Promise<CurrentFlow>;
    continue(): Promise<void>;
}
export {};
