"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
class GeminiService {
    constructor() {
        this.config = {
            apiKey: 'AIzaSyDEqY8Ao_KC2EysVcuY2kQwkOye0QkTj08',
            model: 'gemini-1.5-flash',
            endpoint: 'https://generativelanguage.googleapis.com/v1beta'
        };
    }
    static getInstance() {
        if (!GeminiService.instance) {
            GeminiService.instance = new GeminiService();
        }
        return GeminiService.instance;
    }
    async generateContent(prompt) {
        try {
            const response = await axios_1.default.post(`${this.config.endpoint}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`, {
                contents: [{
                        parts: [{
                                text: prompt
                            }]
                    }]
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.candidates && response.data.candidates[0]?.content?.parts[0]?.text) {
                return response.data.candidates[0].content.parts[0].text;
            }
            throw new Error('No valid response from Gemini API');
        }
        catch (error) {
            logger_1.logger.error('Error calling Gemini API:', error);
            throw error;
        }
    }
    async analyzeMarketTrends(niche) {
        const prompt = `Analyze current market trends and opportunities in the ${niche} niche. 
    Focus on:
    1. Market size and growth potential
    2. Key competitors and their strategies
    3. Emerging opportunities and gaps
    4. Revenue potential and monetization strategies`;
        return this.generateContent(prompt);
    }
    async optimizeDomainValue(domain) {
        const prompt = `Analyze the domain name "${domain}" for value optimization.
    Consider:
    1. SEO potential and keyword value
    2. Brand potential and memorability
    3. Industry relevance and market fit
    4. Monetization strategies and revenue potential`;
        return this.generateContent(prompt);
    }
    async generateListingDescription(domain, marketData) {
        const prompt = `Create a compelling domain listing description for "${domain}".
    Market Data: ${JSON.stringify(marketData)}
    Include:
    1. Unique value propositions
    2. Industry relevance
    3. Growth potential
    4. Monetization opportunities`;
        return this.generateContent(prompt);
    }
}
exports.GeminiService = GeminiService;
//# sourceMappingURL=geminiService.js.map