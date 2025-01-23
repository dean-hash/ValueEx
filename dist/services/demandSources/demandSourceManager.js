"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandSourceManager = void 0;
const redditScraper_1 = require("./redditScraper");
const twitterScraper_1 = require("./twitterScraper");
const googleTrendsScraper_1 = require("./googleTrendsScraper");
const ecommerceScraper_1 = require("./ecommerceScraper");
const logger_1 = require("../../utils/logger");
class DemandSourceManager {
    constructor() {
        this.sources = new Map();
        this.sourceWeights = new Map();
        // Initialize default sources
        this.registerSource('reddit', new redditScraper_1.RedditScraper(), 0.3);
        this.registerSource('twitter', new twitterScraper_1.TwitterScraper(), 0.25);
        this.registerSource('googleTrends', new googleTrendsScraper_1.GoogleTrendsScraper(), 0.25);
        this.registerSource('ecommerce', new ecommerceScraper_1.EcommerceScraper(), 0.2);
    }
    registerSource(name, source, weight) {
        if (weight < 0 || weight > 1) {
            throw new Error('Source weight must be between 0 and 1');
        }
        this.sources.set(name, source);
        this.sourceWeights.set(name, weight);
        this.normalizeWeights();
    }
    normalizeWeights() {
        const totalWeight = Array.from(this.sourceWeights.values()).reduce((sum, weight) => sum + weight, 0);
        if (totalWeight > 0) {
            for (const [source, weight] of this.sourceWeights) {
                this.sourceWeights.set(source, weight / totalWeight);
            }
        }
    }
    async gatherDemandSignals(query, options) {
        const allSignals = [];
        const errors = [];
        const activeSourceWeights = new Map(this.sourceWeights);
        await Promise.all(Array.from(this.sources.entries()).map(async ([name, source]) => {
            try {
                const signals = await source.scrape(query, options);
                const validSignals = signals.filter((signal) => source.validateSignal(signal));
                // Apply source weight to confidence scores
                const weight = activeSourceWeights.get(name) || 0;
                validSignals.forEach((signal) => {
                    signal.confidence *= weight;
                    signal.source = name;
                });
                allSignals.push(...validSignals);
            }
            catch (error) {
                logger_1.logger.error(`Error gathering signals from ${name}:`, error);
                errors.push(error);
                // Remove failed source from active weights
                activeSourceWeights.delete(name);
                // Renormalize remaining weights
                const totalWeight = Array.from(activeSourceWeights.values()).reduce((sum, w) => sum + w, 0);
                if (totalWeight > 0) {
                    for (const [src, weight] of activeSourceWeights) {
                        activeSourceWeights.set(src, weight / totalWeight);
                    }
                }
            }
        }));
        if (errors.length === this.sources.size) {
            throw new Error('All demand sources failed to gather signals');
        }
        return allSignals;
    }
    aggregateSignals(signals) {
        // Group signals by topic/theme
        const groupedSignals = new Map();
        signals.forEach((signal) => {
            const key = this.getSignalKey(signal);
            if (!groupedSignals.has(key)) {
                groupedSignals.set(key, []);
            }
            groupedSignals.get(key).push(signal);
        });
        // Aggregate each group
        const aggregatedSignals = [];
        groupedSignals.forEach((groupSignals, key) => {
            const aggregated = this.aggregateSignalGroup(groupSignals);
            if (aggregated) {
                aggregatedSignals.push(aggregated);
            }
        });
        return this.rankSignals(aggregatedSignals);
    }
    getSignalKey(signal) {
        // Create a unique key based on signal topics and context
        const topics = signal.analysis.topics
            .map((t) => t.name)
            .sort()
            .join('|');
        return `${topics}-${signal.context.community.name}`;
    }
    aggregateSignalGroup(signals) {
        if (!signals.length)
            return null;
        // Use the first signal as the base
        const base = signals[0];
        // Combine confidences
        const overallConfidence = signals.reduce((sum, signal) => {
            const weight = signal.metadata.sourceWeight || 1 / signals.length;
            return sum + signal.confidence.overall * weight;
        }, 0);
        return {
            ...base,
            confidence: {
                ...base.confidence,
                overall: overallConfidence,
            },
            metadata: {
                ...base.metadata,
                aggregatedCount: signals.length,
                sources: signals
                    .map((s) => s.metadata.source)
                    .filter((v) => v !== undefined)
                    .filter((v, i, a) => a.indexOf(v) === i),
            },
        };
    }
    rankSignals(signals) {
        return signals.sort((a, b) => {
            // Rank by confidence and number of sources
            const aScore = a.confidence.overall * (a.metadata.sources?.length || 1);
            const bScore = b.confidence.overall * (b.metadata.sources?.length || 1);
            return bScore - aScore;
        });
    }
}
exports.DemandSourceManager = DemandSourceManager;
//# sourceMappingURL=demandSourceManager.js.map