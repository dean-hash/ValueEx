"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandInsights = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const demandSignalEnhancer_1 = require("./analysis/demandSignalEnhancer");
const metrics_1 = require("./monitoring/metrics");
class DemandInsights {
    constructor() {
        this.emailSignals = new rxjs_1.Subject();
        this.publicSignals = new rxjs_1.Subject();
        this.directSignals = new rxjs_1.Subject();
        this.patterns = new Map();
        this.enhancer = demandSignalEnhancer_1.DemandSignalEnhancer.getInstance();
        this.metrics = metrics_1.MetricsCollector.getInstance();
        // Merge and enhance all signal sources with context awareness
        this.allSignals = (0, rxjs_1.merge)(this.emailSignals, this.publicSignals, this.directSignals).pipe((0, operators_1.mergeMap)((signal) => this.enhancer.enhanceSignal(signal)), (0, operators_1.map)((signal) => this.updatePatterns(signal)));
        // Subscribe to process signals and update metrics
        this.allSignals.subscribe((signal) => {
            this.metrics.trackSignal({
                type: signal.source,
                confidence: signal.contextualConfidence,
                hasRelatedSignals: signal.relatedSignals.length > 0,
                topRelationshipStrength: signal.relatedSignals[0]?.relationship || 0,
            });
        });
    }
    updatePatterns(signal) {
        // Group related signals by their primary topics
        signal.topics.forEach((topic) => {
            if (!this.patterns.has(topic)) {
                this.patterns.set(topic, []);
            }
            const topicPatterns = this.patterns.get(topic);
            topicPatterns.push(signal);
            // Keep only recent patterns
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            this.patterns.set(topic, topicPatterns.filter((s) => s.timestamp > oneDayAgo));
        });
        return signal;
    }
    getEmergingPatterns() {
        return new rxjs_1.Observable((subscriber) => {
            const patterns = Array.from(this.patterns.entries())
                .map(([topic, signals]) => ({
                topic,
                signals,
                averageConfidence: signals.reduce((acc, sig) => acc + sig.contextualConfidence, 0) / signals.length,
                relationshipStrength: this.calculatePatternStrength(signals),
            }))
                .filter((pattern) => pattern.signals.length >= 3) // Only patterns with sufficient support
                .sort((a, b) => b.averageConfidence - a.averageConfidence);
            subscriber.next(patterns);
        });
    }
    calculatePatternStrength(signals) {
        if (signals.length < 2)
            return 0;
        // Calculate average relationship strength between all signals in the pattern
        let totalStrength = 0;
        let relationships = 0;
        for (let i = 0; i < signals.length; i++) {
            for (let j = i + 1; j < signals.length; j++) {
                const relationship = signals[i].relatedSignals.find((rel) => rel.signal === signals[j])?.relationship || 0;
                totalStrength += relationship;
                relationships++;
            }
        }
        return totalStrength / relationships;
    }
    async processEmailInsight(intent, context, preservePrivacy = true) {
        if (preservePrivacy) {
            // Remove any PII or sensitive details
            intent = this.sanitizeIntent(intent);
            context = this.sanitizeContext(context);
        }
        this.emailSignals.next({
            source: 'email',
            intent,
            context: {
                urgency: this.calculateUrgency(context),
                specificity: this.calculateSpecificity(intent),
                valueConstraints: this.extractValueConstraints(context),
            },
            timestamp: new Date(),
            confidence: 0.8, // Base confidence for explicit email signals
        });
    }
    sanitizeIntent(intent) {
        // Remove names, emails, phone numbers, etc.
        return intent
            .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
            .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
            .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');
    }
    sanitizeContext(context) {
        // Deep clone and sanitize context object
        const sanitized = JSON.parse(JSON.stringify(context));
        this.recursiveSanitize(sanitized);
        return sanitized;
    }
    recursiveSanitize(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = this.sanitizeIntent(obj[key]);
            }
            else if (typeof obj[key] === 'object') {
                this.recursiveSanitize(obj[key]);
            }
        }
    }
    calculateUrgency(context) {
        // Implement urgency calculation based on:
        // - Time-related keywords
        // - Repetition of request
        // - Expression intensity
        return 0.5; // Placeholder
    }
    calculateSpecificity(intent) {
        // Implement specificity calculation based on:
        // - Detail level
        // - Concrete requirements
        // - Quantifiable elements
        return 0.7; // Placeholder
    }
    extractValueConstraints(context) {
        // Extract budget, timeframe, and other constraints
        return {}; // Placeholder
    }
}
exports.DemandInsights = DemandInsights;
//# sourceMappingURL=demandInsights.js.map