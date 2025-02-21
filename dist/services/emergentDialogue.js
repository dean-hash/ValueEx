"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergentDialogue = void 0;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../utils/logger");
class EmergentDialogue {
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
        if (!EmergentDialogue.instance) {
            EmergentDialogue.instance = new EmergentDialogue();
        }
        return EmergentDialogue.instance;
    }
    async generateResponse(input, context) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-1106-preview',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a collaborative dialogue partner.',
                    },
                    {
                        role: 'user',
                        content: `Input: ${input}\nContext: ${JSON.stringify(context || {})}`,
                    },
                ],
            });
            const result = response.choices[0].message.content || '';
            if (context) {
                this.context.set(input, context);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error in dialogue:', error);
            throw error;
        }
    }
}
exports.EmergentDialogue = EmergentDialogue;
//# sourceMappingURL=emergentDialogue.js.map