"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandSignalAdapter = void 0;
const events_1 = require("events");
const marketTrendAdapter_1 = require("./marketTrendAdapter");
class DemandSignalAdapter extends events_1.EventEmitter {
    constructor() {
        super();
        this.recentSignals = new Map();
        this.predictions = new Map();
        this.intelligenceProviders = [];
        this.marketTrends = marketTrendAdapter_1.MarketTrendAdapter.getInstance();
        this.setupPredictionCycle();
    }
    static getInstance() {
        if (!DemandSignalAdapter.instance) {
            DemandSignalAdapter.instance = new DemandSignalAdapter();
        }
        return DemandSignalAdapter.instance;
    }
    setupPredictionCycle() {
        // Update predictions every 15 minutes
        setInterval(() => {
            this.updatePredictions();
        }, 900000);
    }
    async addSignal(signal) {
        try {
            const enrichedSignal = await this.enrichSignal(signal);
            // Store in recent signals
            const sourceSignals = this.recentSignals.get(signal.source) || [];
            sourceSignals.push(enrichedSignal);
            this.recentSignals.set(signal.source, sourceSignals);
            // Cleanup old signals (older than 24 hours)
            const cutoff = Date.now() - 24 * 60 * 60 * 1000;
            this.recentSignals.set(signal.source, sourceSignals.filter((s) => s.timestamp > cutoff));
            try {
                // Add to market trends
                await this.marketTrends.addSignal(signal.source, signal.timestamp.toString(), {
                    timestamp: signal.timestamp.toString(),
                    value: signal.confidence,
                    source: signal.type,
                    keywords: signal.context.keywords,
                    confidence: this.calculateSignalConfidence(signal),
                });
            }
            catch (error) {
                console.error('Failed to add signal to market trends:', error instanceof Error ? error.message : String(error));
                // Continue execution - market trends failure shouldn't block signal processing
            }
            // Emit signal processed event
            this.emit('signal:processed', {
                source: signal.source,
                timestamp: signal.timestamp,
                confidence: signal.confidence,
            });
        }
        catch (error) {
            this.emit('signal:error', {
                source: signal.source,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error; // Re-throw to let caller handle the error
        }
    }
    calculateSignalConfidence(signal) {
        // Base confidence by signal type
        const typeConfidence = {
            explicit: 0.8,
            implicit: 0.6,
            inferred: 0.9,
        }[signal.type];
        // Adjust based on context
        const contextScore = (signal.context.keywords.length > 0 ? 0.2 : 0) +
            ((signal.context.relatedCategories?.length ?? 0) > 0 ? 0.2 : 0) +
            (signal.context.sentiment !== undefined ? 0.1 : 0);
        return Math.min(typeConfidence + contextScore, 1);
    }
    async updatePredictions() {
        for (const [key, signals] of this.recentSignals.entries()) {
            if (signals.length === 0)
                continue;
            const [source, timestamp] = key.split('_');
            const marketTrend = this.marketTrends.getTrend(source, timestamp);
            if (!marketTrend)
                continue;
            const prediction = await this.generatePrediction(signals, marketTrend);
            this.predictions.set(key, prediction);
            this.emit('prediction:updated', prediction);
        }
    }
    async generatePrediction(signals, marketTrend) {
        const latestSignal = signals[signals.length - 1];
        const source = latestSignal.source;
        const timestamp = latestSignal.timestamp;
        // Calculate base demand from recent signals
        const recentStrength = signals
            .slice(-6) // Last 1.5 hours (assuming 15-min updates)
            .reduce((sum, s) => sum + s.confidence, 0) / 6;
        // Factor in market trend
        const trendImpact = marketTrend.trend * marketTrend.velocity;
        // Calculate seasonal factors
        const seasonalImpact = this.calculateSeasonalImpact(signals);
        // Combine factors
        const factors = [
            {
                type: 'recent_signals',
                impact: recentStrength,
                confidence: 0.9,
            },
            {
                type: 'market_trend',
                impact: trendImpact,
                confidence: 0.7,
            },
            {
                type: 'seasonality',
                impact: seasonalImpact.impact,
                confidence: seasonalImpact.confidence,
            },
        ];
        // Calculate predicted demand
        const predictedDemand = factors.reduce((sum, factor) => sum + factor.impact * factor.confidence, 0) /
            factors.reduce((sum, factor) => sum + factor.confidence, 0);
        // Calculate overall confidence
        const confidence = factors.reduce((sum, factor) => sum + factor.confidence, 0) / factors.length;
        return {
            source,
            timestamp,
            predictedDemand,
            confidence,
            factors,
        };
    }
    calculateSeasonalImpact(signals) {
        const hourlyPatterns = new Array(24).fill(0);
        const hourlyCounts = new Array(24).fill(0);
        signals.forEach((signal) => {
            const hour = new Date(signal.timestamp).getHours();
            hourlyPatterns[hour] += signal.confidence;
            hourlyCounts[hour]++;
        });
        const hourlyAverages = hourlyPatterns.map((total, i) => hourlyCounts[i] > 0 ? total / hourlyCounts[i] : 0);
        const currentHour = new Date().getHours();
        const impact = hourlyAverages[currentHour];
        // Confidence based on sample size
        const confidence = Math.min(hourlyCounts[currentHour] / 10, 1);
        return { impact, confidence };
    }
    registerIntelligenceProvider(provider) {
        this.intelligenceProviders.push(provider);
        this.emit('intelligence:registered', provider.name);
    }
    async enrichSignal(signal) {
        let enrichedSignal = { ...signal };
        for (const provider of this.intelligenceProviders) {
            try {
                enrichedSignal = await provider.processSignal(enrichedSignal);
                this.emit('intelligence:processed', {
                    provider: provider.name,
                    confidence: provider.confidence,
                });
            }
            catch (error) {
                this.emit('intelligence:error', {
                    provider: provider.name,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        return enrichedSignal;
    }
    getPrediction(source, timestamp) {
        const key = `${source}_${timestamp}`;
        return this.predictions.get(key) || null;
    }
    getAllPredictions() {
        return Array.from(this.predictions.values());
    }
}
exports.DemandSignalAdapter = DemandSignalAdapter;
//# sourceMappingURL=demandSignalAdapter.js.map