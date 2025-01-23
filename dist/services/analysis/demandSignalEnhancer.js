"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandSignalEnhancer = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const natural_1 = __importDefault(require("natural"));
class DemandSignalEnhancer {
    constructor() {
        this.recentSignals = [];
        this.CONTEXT_WINDOW_SIZE = 100; // Keep last 100 signals for context
        this.tokenizer = new natural_1.default.WordTokenizer();
        this.tfidf = new natural_1.default.TfIdf();
        this.initializeTopicModels();
    }
    static getInstance() {
        if (!DemandSignalEnhancer.instance) {
            DemandSignalEnhancer.instance = new DemandSignalEnhancer();
        }
        return DemandSignalEnhancer.instance;
    }
    initializeTopicModels() {
        // Initialize with common demand-related terms
        this.tfidf.addDocument('price cost affordable expensive budget');
        this.tfidf.addDocument('quality premium luxury high-end');
        this.tfidf.addDocument('urgent immediate quick fast delivery');
        this.tfidf.addDocument('comparison alternative similar better');
    }
    enhanceSignal(signal) {
        return (0, rxjs_1.from)([signal]).pipe((0, operators_1.map)((sig) => this.addSentiment(sig)), (0, operators_1.map)((sig) => this.addTopics(sig)), (0, operators_1.map)((sig) => this.findRelatedSignals(sig)), (0, operators_1.map)((sig) => this.calculateContextualConfidence(sig)), (0, operators_1.map)((sig) => {
            this.updateContextWindow(sig);
            return sig;
        }));
    }
    addSentiment(signal) {
        const analyzer = new natural_1.default.SentimentAnalyzer('English', natural_1.default.PorterStemmer, 'afinn');
        const tokens = this.tokenizer.tokenize(signal.intent);
        const sentimentScore = analyzer.getSentiment(tokens);
        return {
            ...signal,
            sentiment: {
                score: sentimentScore,
                magnitude: Math.abs(sentimentScore),
            },
            topics: [], // Will be filled by addTopics
        };
    }
    addTopics(signal) {
        this.tfidf.addDocument(signal.intent);
        const terms = this.tfidf.listTerms(this.tfidf.documents.length - 1);
        const topics = terms
            .filter((term) => term.tfidf > 5) // Only significant terms
            .map((term) => term.term)
            .slice(0, 3); // Top 3 topics
        return {
            ...signal,
            topics,
        };
    }
    calculateConfidenceBoost(signal) {
        // Boost confidence based on sentiment magnitude and topic relevance
        const topicBoost = signal.topics.length * 0.1; // 0.1 per relevant topic
        const sentimentBoost = signal.sentiment.magnitude * 0.2; // Up to 0.2 for strong sentiment
        return {
            ...signal,
            confidence: Math.min(1, signal.confidence + topicBoost + sentimentBoost),
        };
    }
    findRelatedSignals(signal) {
        const related = this.recentSignals
            .map((existingSignal) => ({
            signal: existingSignal,
            relationship: this.calculateRelationship(signal, existingSignal),
        }))
            .filter((rel) => rel.relationship > 0.3) // Only keep strong relationships
            .sort((a, b) => b.relationship - a.relationship)
            .slice(0, 5); // Keep top 5 related signals
        return {
            ...signal,
            relatedSignals: related,
            contextualConfidence: signal.confidence,
        };
    }
    calculateRelationship(signal1, signal2) {
        const topicSimilarity = this.calculateTopicOverlap(signal1.topics, signal2.topics);
        const sentimentSimilarity = 1 - Math.abs(signal1.sentiment.score - signal2.sentiment.score);
        const timeSimilarity = this.calculateTimeProximity(signal1.timestamp, signal2.timestamp);
        return topicSimilarity * 0.5 + sentimentSimilarity * 0.3 + timeSimilarity * 0.2;
    }
    calculateContextualConfidence(signal) {
        if (signal.relatedSignals.length === 0)
            return signal;
        // Boost confidence based on supporting evidence from related signals
        const relationshipStrengths = signal.relatedSignals.map((rel) => rel.relationship);
        const averageStrength = relationshipStrengths.reduce((a, b) => a + b, 0) / relationshipStrengths.length;
        // Boost confidence by up to 20% based on supporting evidence
        const confidenceBoost = averageStrength * 0.2;
        return {
            ...signal,
            contextualConfidence: Math.min(1, signal.confidence + confidenceBoost),
        };
    }
    updateContextWindow(signal) {
        this.recentSignals.push(signal);
        if (this.recentSignals.length > this.CONTEXT_WINDOW_SIZE) {
            this.recentSignals.shift(); // Remove oldest signal
        }
    }
    calculateTopicOverlap(topics1, topics2) {
        const set1 = new Set(topics1);
        const set2 = new Set(topics2);
        const intersection = new Set([...set1].filter((x) => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
    }
    calculateTimeProximity(time1, time2) {
        const hoursDiff = Math.abs(time1.getTime() - time2.getTime()) / (1000 * 60 * 60);
        return Math.max(0, 1 - hoursDiff / 24); // Decay over 24 hours
    }
    async clusterSignals(signals) {
        if (signals.length < 2)
            return signals;
        // Create TF-IDF vectors for clustering
        const vectors = signals.map((signal) => {
            const vector = new natural_1.default.TfIdf();
            vector.addDocument(signal.intent);
            return vector;
        });
        // Simple k-means clustering
        const k = Math.min(3, Math.floor(signals.length / 2));
        const clusters = await this.kMeansClustering(vectors, k);
        return signals.map((signal, index) => ({
            ...signal,
            cluster: `cluster_${clusters[index]}`,
        }));
    }
    async kMeansClustering(vectors, k) {
        // Simple k-means implementation
        // Returns cluster assignments for each vector
        // This is a placeholder - in production we'd use a more robust clustering library
        return vectors.map((_, index) => index % k);
    }
}
exports.DemandSignalEnhancer = DemandSignalEnhancer;
//# sourceMappingURL=demandSignalEnhancer.js.map