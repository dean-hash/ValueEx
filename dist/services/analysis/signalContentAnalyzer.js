"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalContentAnalyzer = void 0;
const openai_1 = require("openai");
const configService_1 = require("../../config/configService");
const logger_1 = require("../../utils/logger");
class SignalContentAnalyzer {
    constructor() {
        this.model = new openai_1.OpenAI({
            apiKey: configService_1.configService.get('OPENAI_API_KEY'),
        });
    }
    static getInstance() {
        if (!SignalContentAnalyzer.instance) {
            SignalContentAnalyzer.instance = new SignalContentAnalyzer();
        }
        return SignalContentAnalyzer.instance;
    }
    async analyzeContent(signal) {
        try {
            // Gather content from various sources
            const content = await this.gatherContent(signal);
            // Analyze unique value points
            const uniquePoints = await this.analyzeUniquePoints(content);
            // Assess depth and practicality
            const detailDepth = await this.assessDetailDepth(content);
            const practicalValue = await this.assessPracticalValue(content);
            // Evaluate source credibility
            const sourceCredibility = await this.evaluateSourceCredibility(signal.source);
            // Analyze community engagement
            const communityEngagement = await this.analyzeCommunityEngagement(signal);
            return {
                uniquePoints,
                detailDepth,
                practicalValue,
                sourceCredibility,
                communityEngagement,
            };
        }
        catch (error) {
            logger_1.logger.error('Error analyzing signal content:', error);
            throw error;
        }
    }
    async gatherContent(signal) {
        // Combine content from multiple sources
        const sources = [
            signal.query,
            ...(signal.insights.keywords || []),
            signal.insights.context || '',
            await this.fetchExternalContent(signal),
        ];
        return sources.join('\n');
    }
    async analyzeUniquePoints(content) {
        const response = await this.model.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'Analyze the following content and identify unique, substantive points that add real value. Count only points that contribute meaningful insights or practical utility.',
                },
                {
                    role: 'user',
                    content,
                },
            ],
        });
        const analysis = response.choices[0].message.content;
        return this.extractPointCount(analysis);
    }
    async assessDetailDepth(content) {
        const response = await this.model.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'Analyze the depth and specificity of the following content. Consider:\n1. Technical accuracy\n2. Contextual understanding\n3. Implementation details\n4. Real-world applicability\nScore from 0 to 1.',
                },
                {
                    role: 'user',
                    content,
                },
            ],
        });
        return this.extractScore(response.choices[0].message.content);
    }
    async assessPracticalValue(content) {
        const response = await this.model.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'Evaluate the practical value of this content. Consider:\n1. Actionability\n2. Problem-solving utility\n3. Real-world impact\n4. Cost-benefit ratio\nScore from 0 to 1.',
                },
                {
                    role: 'user',
                    content,
                },
            ],
        });
        return this.extractScore(response.choices[0].message.content);
    }
    async evaluateSourceCredibility(source) {
        // This would connect to a reputation database or analysis system
        // For MVP, returning a default score
        return 0.8;
    }
    async analyzeCommunityEngagement(signal) {
        // This would analyze real engagement metrics
        // For MVP, returning example values
        return {
            quality: 0.7,
            volume: 0.8,
            sustainability: 0.6,
        };
    }
    async fetchExternalContent(signal) {
        // This would fetch content from external sources
        // For MVP, returning empty string
        return '';
    }
    extractPointCount(analysis) {
        // Extract number of points from AI analysis
        const match = analysis.match(/\d+/);
        return match ? Math.min(parseInt(match[0], 10), 10) : 0;
    }
    extractScore(analysis) {
        // Extract score between 0 and 1 from AI analysis
        const match = analysis.match(/0?\.[0-9]+/);
        return match ? Math.min(parseFloat(match[0]), 1) : 0;
    }
}
exports.SignalContentAnalyzer = SignalContentAnalyzer;
//# sourceMappingURL=signalContentAnalyzer.js.map