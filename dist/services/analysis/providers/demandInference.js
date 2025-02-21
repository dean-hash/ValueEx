"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandInference = void 0;
const events_1 = require("events");
const natural = __importStar(require("natural"));
const uuid_1 = require("uuid");
class DemandInference extends events_1.EventEmitter {
    constructor() {
        super();
        this.confidenceThreshold = 0.7;
        this.minKeywords = 3;
        this.maxSignals = 10;
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
        this.classifier = new natural.BayesClassifier();
        this.initializeClassifier();
    }
    async initializeClassifier() {
        // Train the classifier with sample data
        // In production, this would load from a proper dataset
        this.classifier.addDocument('price cost budget money', 'price_sensitive');
        this.classifier.addDocument('fast quick urgent immediate', 'urgent');
        this.classifier.addDocument('compare review difference between', 'research');
        this.classifier.addDocument('buy purchase acquire', 'purchase_intent');
        this.classifier.train();
    }
    async inferFromBehavior(data) {
        const inferences = [];
        // Analyze search patterns
        if (data.searches.length >= this.minKeywords) {
            const searchInference = await this.analyzeSearchPatterns(data.searches);
            if (searchInference.confidence >= this.confidenceThreshold) {
                inferences.push(searchInference);
            }
        }
        // Analyze viewed items
        if (data.viewedItems.length > 0) {
            const viewInference = await this.analyzeViewingPatterns(data.viewedItems);
            if (viewInference.confidence >= this.confidenceThreshold) {
                inferences.push(viewInference);
            }
        }
        // Analyze interactions if available
        if (data.interactions?.length) {
            const interactionInference = await this.analyzeInteractions(data.interactions);
            if (interactionInference.confidence >= this.confidenceThreshold) {
                inferences.push(interactionInference);
            }
        }
        // Convert inferences to signals
        return this.convertToSignals(inferences, data.context);
    }
    async analyzeSearchPatterns(searches) {
        const keywords = this.extractRelevantKeywords(searches);
        const categories = await this.categorizeKeywords(keywords);
        const intent = this.classifier.classify(searches.join(' '));
        const urgency = this.calculateUrgency(searches);
        const sentiment = this.analyzeSentiment(searches);
        return {
            type: 'search_pattern',
            confidence: this.calculateConfidence(keywords.length, categories.length),
            keywords,
            categories,
            context: {
                urgency,
                sentiment,
                intent,
            },
        };
    }
    async analyzeViewingPatterns(items) {
        const keywords = this.extractRelevantKeywords(items);
        const categories = await this.categorizeKeywords(keywords);
        const intent = this.classifier.classify(items.join(' '));
        return {
            type: 'view_pattern',
            confidence: this.calculateConfidence(keywords.length, categories.length) * 0.8,
            keywords,
            categories,
            context: {
                urgency: 0.5,
                sentiment: 0,
                intent,
            },
        };
    }
    async analyzeInteractions(interactions) {
        if (!interactions)
            return this.createEmptyInference();
        const totalDuration = interactions.reduce((sum, i) => sum + i.duration, 0);
        const avgDuration = totalDuration / interactions.length;
        const recentInteractions = interactions.filter((i) => Date.now() - i.timestamp < 24 * 60 * 60 * 1000);
        const keywords = this.extractRelevantKeywords(interactions.map((i) => i.item));
        const categories = await this.categorizeKeywords(keywords);
        const intent = this.classifier.classify(interactions.map((i) => i.type).join(' '));
        return {
            type: 'interaction_pattern',
            confidence: this.calculateInteractionConfidence(avgDuration, recentInteractions.length),
            keywords,
            categories,
            context: {
                urgency: this.calculateInteractionUrgency(recentInteractions),
                sentiment: 0,
                intent,
            },
        };
    }
    extractRelevantKeywords(texts) {
        const tokens = texts.flatMap((text) => this.tokenizer.tokenize(text.toLowerCase()) || []);
        const uniqueTokens = [...new Set(tokens)];
        // Add documents to TF-IDF
        uniqueTokens.forEach((token) => this.tfidf.addDocument([token]));
        // Get top keywords by TF-IDF score
        return uniqueTokens
            .map((token) => ({ token, score: this.calculateTfIdfScore(token) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, this.maxSignals)
            .map((item) => item.token);
    }
    async categorizeKeywords(keywords) {
        // In production, this would use a proper categorization service
        const categories = new Set();
        keywords.forEach((keyword) => {
            if (keyword.includes('price') || keyword.includes('cost'))
                categories.add('pricing');
            if (keyword.includes('fast') || keyword.includes('quick'))
                categories.add('urgency');
            if (keyword.includes('compare') || keyword.includes('review'))
                categories.add('research');
        });
        return Array.from(categories);
    }
    calculateConfidence(keywordCount, categoryCount) {
        const keywordWeight = Math.min(keywordCount / this.minKeywords, 1);
        const categoryWeight = Math.min(categoryCount / 2, 1);
        return keywordWeight * 0.6 + categoryWeight * 0.4;
    }
    calculateInteractionConfidence(avgDuration, recentCount) {
        const durationWeight = Math.min(avgDuration / 60000, 1); // Max 1 minute
        const recentWeight = Math.min(recentCount / 5, 1); // Max 5 recent interactions
        return durationWeight * 0.7 + recentWeight * 0.3;
    }
    calculateInteractionUrgency(recentInteractions) {
        if (!recentInteractions?.length)
            return 0;
        const timeGaps = recentInteractions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, -1)
            .map((_, i) => recentInteractions[i].timestamp - recentInteractions[i + 1].timestamp);
        const avgGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
        return Math.max(0, 1 - avgGap / (60 * 60 * 1000)); // Higher urgency for shorter gaps
    }
    calculateUrgency(searches) {
        const urgentWords = ['urgent', 'immediate', 'quick', 'fast', 'asap'];
        const urgentCount = searches.filter((s) => urgentWords.some((w) => s.toLowerCase().includes(w))).length;
        return Math.min(urgentCount / searches.length, 1);
    }
    analyzeSentiment(texts) {
        // In production, this would use a proper sentiment analysis service
        const positiveWords = ['good', 'great', 'excellent', 'best', 'perfect'];
        const negativeWords = ['bad', 'poor', 'worst', 'terrible', 'awful'];
        let sentiment = 0;
        texts.forEach((text) => {
            const lower = text.toLowerCase();
            positiveWords.forEach((word) => {
                if (lower.includes(word))
                    sentiment += 0.2;
            });
            negativeWords.forEach((word) => {
                if (lower.includes(word))
                    sentiment -= 0.2;
            });
        });
        return Math.max(-1, Math.min(1, sentiment));
    }
    createEmptyInference() {
        return {
            type: 'empty',
            confidence: 0,
            keywords: [],
            categories: [],
            context: {
                urgency: 0,
                sentiment: 0,
                intent: 'unknown',
            },
        };
    }
    convertToSignals(inferences, context) {
        return inferences.map((inference) => ({
            id: (0, uuid_1.v4)(),
            source: 'demand_inference',
            timestamp: Date.now(),
            type: 'inferred',
            confidence: inference.confidence,
            context: {
                keywords: inference.keywords,
                relatedCategories: inference.categories,
                sentiment: inference.context.sentiment,
                urgency: inference.context.urgency,
                matches: [],
            },
            requirements: {
                features: inference.keywords,
                constraints: {
                    ...(context?.location && { location: context.location }),
                    timeline: inference.context.urgency > 0.7 ? 'urgent' : 'normal',
                },
            },
            category: inference.categories[0] || 'unknown',
        }));
    }
    calculateTfIdfScore(token) {
        let score = 0;
        const docs = this.tfidf.documents;
        if (!docs)
            return 0;
        // Get the number of documents
        const documentCount = Object.keys(docs).length;
        if (documentCount === 0)
            return 0;
        // Calculate term frequency in each document
        let termFrequency = 0;
        let docsWithTerm = 0;
        Object.values(docs).forEach((doc) => {
            if (doc && typeof doc === 'object' && doc[token]) {
                termFrequency += doc[token];
                docsWithTerm++;
            }
        });
        // Calculate IDF
        const idf = Math.log(documentCount / (1 + docsWithTerm));
        // Final TF-IDF score
        score = termFrequency * idf;
        return score;
    }
    async consolidateSignals(signals) {
        // Group signals by source and type
        const groups = new Map();
        signals.forEach((signal) => {
            const key = `${signal.source}_${signal.type}`;
            const group = groups.get(key) || [];
            group.push(signal);
            groups.set(key, group);
        });
        // Consolidate each group
        return Array.from(groups.values()).map((group) => this.mergeSignals(group));
    }
    mergeSignals(signals) {
        if (signals.length === 0) {
            throw new Error('Cannot merge empty signal array');
        }
        if (signals.length === 1) {
            return signals[0];
        }
        const base = signals[0];
        const keywords = new Set();
        const categories = new Set();
        let totalConfidence = 0;
        let totalSentiment = 0;
        let totalUrgency = 0;
        signals.forEach((signal) => {
            signal.context.keywords.forEach((kw) => keywords.add(kw));
            signal.context.relatedCategories?.forEach((cat) => categories.add(cat));
            totalConfidence += signal.confidence;
            totalSentiment += signal.context.sentiment;
            totalUrgency += signal.context.urgency;
        });
        return {
            ...base,
            confidence: totalConfidence / signals.length,
            context: {
                ...base.context,
                keywords: Array.from(keywords),
                relatedCategories: Array.from(categories),
                sentiment: totalSentiment / signals.length,
                urgency: totalUrgency / signals.length,
            },
        };
    }
}
exports.DemandInference = DemandInference;
//# sourceMappingURL=demandInference.js.map