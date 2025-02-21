import OpenAI from 'openai';
export declare class OpenAIClient {
    private static instance;
    private client;
    private constructor();
    static getInstance(): OpenAIClient;
    getClient(): OpenAI;
    createChatCompletion(messages: OpenAI.Chat.ChatCompletionMessageParam[], options?: Partial<OpenAI.Chat.ChatCompletionCreateParams>): Promise<OpenAI.Chat.ChatCompletion>;
    createJSONCompletion<T>(messages: OpenAI.Chat.ChatCompletionMessageParam[], options?: Partial<OpenAI.Chat.ChatCompletionCreateParams>): Promise<T | null>;
}
