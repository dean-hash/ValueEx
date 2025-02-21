"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborativeIntelligence = void 0;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../utils/logger");
class CollaborativeIntelligence {
    constructor() {
        this.context = new Map();
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is required in environment variables');
        }
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    static getInstance() {
        if (!CollaborativeIntelligence.instance) {
            CollaborativeIntelligence.instance = new CollaborativeIntelligence();
        }
        return CollaborativeIntelligence.instance;
    }
    async brainstorm(topic, context) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-1106-preview',
                messages: [
                    {
                        role: 'system',
                        content: `You are a collaborative intelligence partner helping to brainstorm solutions and ideas.
                     Consider multiple perspectives and think outside conventional boundaries.
                     Analyze the topic from various angles:
                     - Technical feasibility
                     - User experience
                     - Ethical implications
                     - Market potential`,
                    },
                    {
                        role: 'user',
                        content: `Topic: ${topic}\nContext: ${JSON.stringify(context || {})}`,
                    },
                ],
                response_format: { type: 'json_object' },
            });
            const result = JSON.parse(response.choices[0].message.content || '{}');
            this.context.set(topic, result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error in brainstorming:', error);
            throw error;
        }
    }
}
exports.CollaborativeIntelligence = CollaborativeIntelligence;
//# sourceMappingURL=collaborativeIntelligence.js.map