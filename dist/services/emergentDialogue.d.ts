export interface DialogueContext {
    intention: string;
    field: Map<string, number>;
    processes: Set<string>;
    state: string;
}
export declare class EmergentDialogue {
    private openai;
    private static instance;
    private context;
    private constructor();
    static getInstance(): EmergentDialogue;
    generateResponse(input: string, context?: DialogueContext): Promise<string>;
}
