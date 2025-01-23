"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleTrendsScraper = void 0;
const logger_1 = require("../../utils/logger");
const google_trends_api_1 = __importDefault(require("google-trends-api"));
const intelligenceCoordinator_1 = __importDefault(require("../../utils/intelligenceCoordinator"));
const localIntelligence_1 = require("../analysis/localIntelligence");
class GoogleTrendsScraper {
    constructor() {
        this.name = 'googleTrends';
        this.coordinator = intelligenceCoordinator_1.default.getInstance();
        this.localIntelligence = localIntelligence_1.LocalIntelligence.getInstance();
    }
    async scrape(query, options) {
        try {
            logger_1.logger.info('Starting Google Trends scrape', { query });
            const [interestOverTime, relatedQueries, regionalInterest] = await Promise.all([
                this.getInterestOverTime(query),
                this.getRelatedQueries(query),
                this.getRegionalInterest(query),
            ]);
            logger_1.logger.info('Got Google Trends data', {
                timelinePoints: interestOverTime.length,
                relatedQueries: relatedQueries.length,
                regions: Object.keys(regionalInterest).length,
            });
            const trendMetrics = this.analyzeTrends(interestOverTime, regionalInterest);
            let signal = this.createSignal(query, trendMetrics, relatedQueries);
            // Enrich signal with local intelligence
            signal = await this.localIntelligence.enrichSignal(signal);
            this.coordinator.emit('source:enriched', {
                sourceId: 'google_trends',
                type: 'external',
                operation: 'enrichSignal',
                status: 'success',
                data: signal,
            });
            return [signal];
        }
        catch (error) {
            logger_1.logger.error('Error scraping Google Trends', { error: error.message, query });
            throw error;
        }
    }
    async getInterestOverTime(query) {
        try {
            this.coordinator.emit('source:request', {
                sourceId: 'google_trends',
                type: 'external',
                operation: 'interestOverTime',
                params: { query },
            });
            const result = await google_trends_api_1.default.interestOverTime({
                keyword: query,
                startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            });
            const data = JSON.parse(result);
            let timelineData = [];
            if (data?.default?.timelineData) {
                timelineData = data.default.timelineData.map((point) => ({
                    time: point.time || '',
                    value: point.value?.[0] || 0,
                    formattedTime: point.formattedTime || '',
                }));
            }
            this.coordinator.emit('source:response', {
                sourceId: 'google_trends',
                type: 'external',
                operation: 'interestOverTime',
                status: 'success',
                data: timelineData,
            });
            return timelineData;
        }
        catch (error) {
            this.coordinator.emit('source:error', {
                sourceId: 'google_trends',
                type: 'external',
                operation: 'interestOverTime',
                error: error.message,
            });
            throw error;
        }
    }
    async getRegionalInterest(query) {
        try {
            this.coordinator.emit('source:request', {
                sourceId: 'google_trends',
                type: 'external',
                operation: 'regionalInterest',
                params: { query },
            });
            const result = await google_trends_api_1.default.interestByRegion({
                keyword: query,
                resolution: 'COUNTRY',
            });
            const data = JSON.parse(result);
            const regionalData = {};
            if (data?.default?.geoMapData) {
                data.default.geoMapData.forEach((region) => {
                    if (region.geoName && region.value?.[0] !== undefined) {
                        regionalData[region.geoName] = region.value[0];
                    }
                });
            }
            this.coordinator.emit('source:response', {
                sourceId: 'google_trends',
                type: 'external',
                operation: 'regionalInterest',
                status: 'success',
                data: regionalData,
            });
            return regionalData;
        }
        catch (error) {
            this.coordinator.emit('source:error', {
                sourceId: 'google_trends',
                type: 'external',
                operation: 'regionalInterest',
                error: error.message,
            });
            throw error;
        }
    }
    async getRelatedQueries(query) {
        try {
            this.coordinator.emit('source:request', {
                sourceId: 'google_trends',
                type: 'external',
                operation: 'relatedQueries',
                params: { query },
            });
            const result = await google_trends_api_1.default.relatedQueries({
                keyword: query,
            });
            const data = JSON.parse(result);
            let queries = [];
            if (data?.default?.rankedList?.[0]?.rankedKeyword) {
                queries = data.default.rankedList[0].rankedKeyword
                    .map((item) => item.query)
                    .slice(0, 5);
            }
            this.coordinator.emit('source:response', {
                sourceId: 'google_trends',
                type: 'external',
                operation: 'relatedQueries',
                status: 'success',
                data: queries,
            });
            return queries;
        }
        catch (error) {
            this.coordinator.emit('source:error', {
                sourceId: 'google_trends',
                type: 'external',
                operation: 'relatedQueries',
                error: error.message,
            });
            throw error;
        }
    }
    analyzeTrends(timelineData, regionalData) {
        const values = timelineData.map((d) => d.value);
        const volume = Math.max(...values);
        const momentum = this.calculateMomentum(values);
        const velocity = this.calculateVelocity(values);
        const acceleration = this.calculateAcceleration(values);
        const seasonality = this.calculateSeasonality(values);
        const geographicSpread = regionalData;
        return {
            volume,
            momentum,
            velocity,
            acceleration,
            seasonality,
            geographicSpread,
        };
    }
    calculateMomentum(values) {
        const recentValues = values.slice(-7); // Last week
        return recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    }
    calculateVelocity(values) {
        const changes = values.slice(1).map((v, i) => v - values[i]);
        return changes.reduce((a, b) => a + b, 0) / changes.length;
    }
    calculateAcceleration(values) {
        const velocities = values.slice(1).map((v, i) => v - values[i]);
        const accelerations = velocities.slice(1).map((v, i) => v - velocities[i]);
        return accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
    }
    calculateSeasonality(values) {
        // Simple seasonality score based on variance
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance) / mean;
    }
    createSignal(query, metrics, relatedQueries) {
        const now = new Date().toISOString();
        return {
            id: `gt_${query}_${Date.now()}`,
            query,
            title: `Google Trends: ${query}`,
            content: `Trend analysis for "${query}" with related queries: ${relatedQueries.join(', ')}`,
            url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}`,
            timestamp: now,
            trendMetrics: metrics,
            confidence: {
                overall: 0.85,
                factors: {
                    textQuality: 0.9,
                    communityEngagement: 0.8,
                    authorCredibility: 0.95,
                    contentRelevance: 0.85,
                    temporalRelevance: 0.9,
                },
            },
            context: {
                thread: {
                    id: `gt_${query}`,
                    depth: 0,
                    isOriginalPost: true,
                },
                author: {
                    id: 'google_trends',
                    domainActivity: 1,
                },
                community: {
                    name: 'Google Trends',
                    topicRelevance: 0.9,
                    activityLevel: 1,
                },
            },
            analysis: {
                sentiment: 0,
                topics: [
                    {
                        name: query,
                        confidence: 1,
                        keywords: relatedQueries,
                    },
                ],
                pricePoints: [],
                features: {},
                relationships: {
                    relatedThreads: [],
                    crossReferences: [],
                    temporalConnections: [],
                },
            },
            metadata: {
                processingTime: Date.now(),
                extractionVersion: '1.0.0',
                dataQualityScore: 0.9,
                source: 'google_trends',
                sourceWeight: 0.8,
            },
        };
    }
    validateSignal(signal) {
        return (!!signal.id &&
            !!signal.timestamp &&
            !!signal.trendMetrics &&
            typeof signal.trendMetrics.momentum === 'number' &&
            typeof signal.trendMetrics.volume === 'number' &&
            typeof signal.trendMetrics.velocity === 'number' &&
            typeof signal.trendMetrics.acceleration === 'number' &&
            typeof signal.trendMetrics.seasonality === 'number' &&
            !!signal.trendMetrics.geographicSpread);
    }
}
exports.GoogleTrendsScraper = GoogleTrendsScraper;
//# sourceMappingURL=googleTrendsScraper.js.map