"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIManager = void 0;
const openai_1 = __importDefault(require("openai"));
const metricsCollector_1 = require("./metricsCollector");
class OpenAIManager {
    constructor() {
        // Rate limit tracking
        this.lastRequestTime = 0;
        this.requestsThisMinute = 0;
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.metricsCollector = metricsCollector_1.MetricsCollector.getInstance();
    }
    static getInstance() {
        if (!OpenAIManager.instance) {
            OpenAIManager.instance = new OpenAIManager();
        }
        return OpenAIManager.instance;
    }
    async generateResponse(question, productInfo, config = {}) {
        try {
            const response = await this.openai.chat.completions.create({
                model: config.model || 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: this.getSystemPrompt(),
                    },
                    {
                        role: 'user',
                        content: this.formatUserPrompt(question, productInfo),
                    },
                ],
                temperature: config.temperature || 0.7,
                max_tokens: config.maxTokens || 500,
            });
            const content = response.choices[0]?.message?.content;
            if (!content)
                return null;
            // Validate response
            const isValid = await this.validateResponse(content, question);
            if (!isValid)
                return null;
            return content;
        }
        catch (error) {
            await this.metricsCollector.trackError('openai_generation', error, { question });
            return null;
        }
    }
    getSystemPrompt() {
        return `You are a helpful product advisor focused on providing genuine value to users. Follow these guidelines:

1. VALUE FIRST
- Always start with helpful, educational content
- Explain the "why" behind recommendations
- Include relevant context and considerations

2. ETHICAL STANDARDS
- Never oversell or make exaggerated claims
- Be transparent about affiliate relationships
- Disclose any limitations or uncertainties

3. RESPONSE STRUCTURE
- Start with understanding/context
- Provide clear, actionable advice
- Include product recommendation only if truly relevant
- End with balanced pros/cons

4. TONE AND STYLE
- Be conversational but professional
- Focus on education over persuasion
- Use clear, jargon-free language

5. MANDATORY ELEMENTS
- Include affiliate disclosure
- Mention key decision factors
- Provide context for price points
- Note alternatives when relevant

Remember: Your goal is to help users make informed decisions, not to maximize conversions.`;
    }
    formatUserPrompt(question, productInfo) {
        return `USER QUESTION: ${question}

RELEVANT PRODUCT INFO:
Name: ${productInfo.name}
Price: ${productInfo.price}
Key Features: ${productInfo.details}
Category: ${productInfo.category}

Please provide a helpful response that:
1. Addresses the user's specific needs and context
2. Explains relevant factors to consider
3. Provides educational value
4. Includes the product recommendation only if genuinely relevant
5. Maintains transparency with affiliate disclosure

Remember to prioritize user value over product promotion.`;
    }
    async validateResponse(response, originalQuestion) {
        try {
            const validation = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: `You are a response validator ensuring high quality, ethical affiliate content. 
                        Check for:
                        1. Value-first approach
                        2. Clear affiliate disclosure
                        3. Educational content
                        4. Relevance to question
                        5. Balanced perspective
                        6. No overselling
                        
                        Respond with only "true" or "false".`,
                    },
                    {
                        role: 'user',
                        content: `Question: ${originalQuestion}\n\nResponse: ${response}`,
                    },
                ],
                temperature: 0,
                max_tokens: 10,
            });
            const result = validation.choices[0]?.message?.content?.toLowerCase();
            return result === 'true';
        }
        catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    }
    async analyzeUserIntent(question) {
        try {
            const analysis = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: 'Analyze the user question for product intent and key factors. Return JSON only.',
                    },
                    {
                        role: 'user',
                        content: question,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0,
            });
            return JSON.parse(analysis.choices[0]?.message?.content || '{}');
        }
        catch (error) {
            console.error('Intent analysis error:', error);
            return { hasProductIntent: false };
        }
    }
    async checkEthicalCompliance(productInfo, userIntent) {
        try {
            const check = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: `Evaluate if this product recommendation is ethically appropriate. 
                        Consider:
                        1. Price alignment with user budget
                        2. Feature match with user needs
                        3. Expertise level appropriateness
                        4. Value proposition
                        
                        Respond with only "true" or "false".`,
                    },
                    {
                        role: 'user',
                        content: `User Intent: ${JSON.stringify(userIntent)}
                        Product Info: ${JSON.stringify(productInfo)}`,
                    },
                ],
                temperature: 0,
                max_tokens: 10,
            });
            const result = check.choices[0]?.message?.content?.toLowerCase();
            return result === 'true';
        }
        catch (error) {
            console.error('Ethical check error:', error);
            return false;
        }
    }
    async checkRateLimit() {
        const now = Date.now();
        // Reset counter if it's been more than a minute
        if (now - this.lastRequestTime > 60000) {
            this.requestsThisMinute = 0;
            this.lastRequestTime = now;
        }
        // Check if we're within limits (e.g., 50 requests per minute)
        if (this.requestsThisMinute >= 50) {
            return false;
        }
        this.requestsThisMinute++;
        return true;
    }
}
exports.OpenAIManager = OpenAIManager;
//# sourceMappingURL=openaiManager.js.map