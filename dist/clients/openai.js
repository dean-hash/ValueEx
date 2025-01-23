"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIClient = void 0;
const openai_1 = __importDefault(require("openai"));
const configService_1 = require("../config/configService");
class OpenAIClient {
    constructor() {
        const apiKey = configService_1.configService.getOpenAIKey();
        if (!apiKey || apiKey.trim() === '') {
            throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY in your environment variables.');
        }
        this.client = new openai_1.default({
            apiKey: apiKey,
            maxRetries: 3,
            timeout: 30000,
        });
    }
    static getInstance() {
        if (!OpenAIClient.instance) {
            OpenAIClient.instance = new OpenAIClient();
        }
        return OpenAIClient.instance;
    }
    getClient() {
        return this.client;
    }
    // Helper method for common chat completion requests
    async createChatCompletion(messages, options = {}) {
        try {
            const completion = await this.client.chat.completions.create({
                model: options.model || 'gpt-4-turbo-preview',
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens,
                ...options,
                stream: false, // Ensure we get a ChatCompletion not a Stream
            });
            return completion;
        }
        catch (error) {
            if (error instanceof openai_1.default.APIError) {
                // Handle rate limits
                if (error.status === 429) {
                    console.warn('OpenAI rate limit reached. Implementing exponential backoff...');
                    // Could implement retry logic here
                }
                // Handle invalid API key
                if (error.status === 401) {
                    console.error('Invalid OpenAI API key. Please check your configuration.');
                }
            }
            throw error;
        }
    }
    // Helper for JSON responses
    async createJSONCompletion(messages, options = {}) {
        try {
            const completion = await this.createChatCompletion(messages, {
                ...options,
                response_format: { type: 'json_object' },
                temperature: options.temperature ?? 0, // Default to 0 for JSON
            });
            const content = completion.choices[0]?.message?.content;
            return content ? JSON.parse(content) : null;
        }
        catch (error) {
            console.error('Error creating JSON completion:', error);
            return null;
        }
    }
}
exports.OpenAIClient = OpenAIClient;
//# sourceMappingURL=openai.js.map