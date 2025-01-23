"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPTService = void 0;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../utils/logger");
class GPTService {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is required in environment variables');
        }
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    static getInstance() {
        if (!GPTService.instance) {
            GPTService.instance = new GPTService();
        }
        return GPTService.instance;
    }
    async analyzeMarketOpportunity(productDescription) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-1106-preview',
                messages: [
                    {
                        role: 'system',
                        content: `You are an AI market analyst specialized in evaluating product opportunities. 
                     Analyze the given product description and provide:
                     1. Opportunity score (0-100)
                     2. Confidence level (0-100)
                     3. Brief reasoning
                     Format: JSON with keys "opportunity", "confidence", "reasoning"`,
                    },
                    {
                        role: 'user',
                        content: productDescription,
                    },
                ],
                response_format: { type: 'json_object' },
            });
            const result = JSON.parse(response.choices[0].message.content || '{}');
            logger_1.logger.info('Market opportunity analysis completed', { productDescription, result });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error analyzing market opportunity', { error, productDescription });
            throw error;
        }
    }
    async generateProductDescription(keywords) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-1106-preview',
                messages: [
                    {
                        role: 'system',
                        content: 'Generate a compelling, SEO-friendly product description based on the provided keywords.',
                    },
                    {
                        role: 'user',
                        content: keywords.join(', '),
                    },
                ],
            });
            const description = response.choices[0].message.content || '';
            logger_1.logger.info('Product description generated', { keywords, description });
            return description;
        }
        catch (error) {
            logger_1.logger.error('Error generating product description', { error, keywords });
            throw error;
        }
    }
    async analyzePurchaseIntent(userQuery) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-1106-preview',
                messages: [
                    {
                        role: 'system',
                        content: `Analyze the user query for:
                     1. Purchase intent (0-100)
                     2. Urgency level (0-100)
                     3. Key interests/needs
                     Format: JSON with keys "intent", "urgency", "interests"`,
                    },
                    {
                        role: 'user',
                        content: userQuery,
                    },
                ],
                response_format: { type: 'json_object' },
            });
            const result = JSON.parse(response.choices[0].message.content || '{}');
            logger_1.logger.info('Purchase intent analysis completed', { userQuery, result });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error analyzing purchase intent', { error, userQuery });
            throw error;
        }
    }
}
exports.GPTService = GPTService;
//# sourceMappingURL=gptService.js.map