"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
class MetricsCollector {
    constructor() {
        this.events = [];
        // Start periodic metrics processing
        setInterval(() => this.processMetrics(), 300000); // Every 5 minutes
    }
    static getInstance() {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }
    async trackResponse(subreddit, question, response, metrics) {
        this.events.push({
            timestamp: Date.now(),
            type: 'response',
            data: {
                subreddit,
                questionLength: question.length,
                responseLength: response.length,
                metrics,
            },
        });
    }
    async trackEngagement(responseId, type, value) {
        this.events.push({
            timestamp: Date.now(),
            type: 'engagement',
            data: {
                responseId,
                engagementType: type,
                value,
            },
        });
    }
    async trackConversion(responseId, revenue) {
        this.events.push({
            timestamp: Date.now(),
            type: 'conversion',
            data: {
                responseId,
                revenue,
            },
        });
    }
    async trackError(type, error, context) {
        this.events.push({
            timestamp: Date.now(),
            type: 'error',
            data: {
                errorType: type,
                message: error.message,
                stack: error.stack,
                context,
            },
        });
    }
    async processMetrics() {
        const now = Date.now();
        const last5Min = this.events.filter((e) => e.timestamp > now - 300000);
        // Calculate key metrics
        const metrics = {
            responses: {
                total: last5Min.filter((e) => e.type === 'response').length,
                avgLength: this.calculateAvgResponseLength(last5Min),
                qualityScore: this.calculateQualityScore(last5Min),
            },
            engagement: {
                upvotes: this.countEngagement(last5Min, 'upvote'),
                comments: this.countEngagement(last5Min, 'comment'),
                reports: this.countEngagement(last5Min, 'report'),
            },
            conversions: {
                count: last5Min.filter((e) => e.type === 'conversion').length,
                revenue: this.calculateRevenue(last5Min),
            },
            errors: {
                count: last5Min.filter((e) => e.type === 'error').length,
                types: this.categorizeErrors(last5Min),
            },
            valueMetrics: {
                helpfulnessRatio: this.calculateHelpfulnessRatio(last5Min),
                communityImpact: this.calculateCommunityImpact(last5Min),
            },
        };
        // Log metrics (could send to monitoring service)
        console.log('Last 5 minute metrics:', metrics);
        // Alert on concerning patterns
        this.checkAlerts(metrics);
    }
    calculateAvgResponseLength(events) {
        const responses = events.filter((e) => e.type === 'response');
        if (responses.length === 0)
            return 0;
        return responses.reduce((sum, e) => sum + e.data.responseLength, 0) / responses.length;
    }
    calculateQualityScore(events) {
        const responses = events.filter((e) => e.type === 'response');
        if (responses.length === 0)
            return 0;
        return (responses.reduce((sum, e) => {
            const metrics = e.data.metrics;
            return (sum +
                ((metrics.upvotes - metrics.reportCount) / 10 +
                    metrics.detailLevel +
                    (metrics.sourcesProvided ? 1 : 0)));
        }, 0) / responses.length);
    }
    countEngagement(events, type) {
        return events
            .filter((e) => e.type === 'engagement' && e.data.engagementType === type)
            .reduce((sum, e) => sum + e.data.value, 0);
    }
    calculateRevenue(events) {
        return events
            .filter((e) => e.type === 'conversion')
            .reduce((sum, e) => sum + e.data.revenue, 0);
    }
    categorizeErrors(events) {
        return events
            .filter((e) => e.type === 'error')
            .reduce((acc, e) => {
            acc[e.data.errorType] = (acc[e.data.errorType] || 0) + 1;
            return acc;
        }, {});
    }
    calculateHelpfulnessRatio(events) {
        const responses = events.filter((e) => e.type === 'response');
        if (responses.length === 0)
            return 0;
        const helpfulCount = responses.filter((e) => e.data.metrics.upvotes > e.data.metrics.reportCount).length;
        return helpfulCount / responses.length;
    }
    calculateCommunityImpact(events) {
        const responses = events.filter((e) => e.type === 'response');
        if (responses.length === 0)
            return 0;
        return (responses.reduce((sum, e) => sum + e.data.metrics.communityStanding, 0) / responses.length);
    }
    checkAlerts(metrics) {
        // Alert on concerning patterns
        if (metrics.errors.count > 10) {
            console.error('High error rate detected:', metrics.errors);
        }
        if (metrics.valueMetrics.helpfulnessRatio < 0.8) {
            console.warn('Helpfulness ratio below threshold:', metrics.valueMetrics.helpfulnessRatio);
        }
        if (metrics.engagement.reports > metrics.engagement.upvotes * 0.1) {
            console.warn('High report ratio detected');
        }
    }
    // Public API for querying metrics
    async getMetricsSummary(timeframe = 3600000) {
        const relevantEvents = this.events.filter((e) => e.timestamp > Date.now() - timeframe);
        return {
            responses: this.calculateQualityScore(relevantEvents),
            engagement: {
                upvotes: this.countEngagement(relevantEvents, 'upvote'),
                comments: this.countEngagement(relevantEvents, 'comment'),
                reports: this.countEngagement(relevantEvents, 'report'),
            },
            valueMetrics: {
                helpfulnessRatio: this.calculateHelpfulnessRatio(relevantEvents),
                communityImpact: this.calculateCommunityImpact(relevantEvents),
            },
        };
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=metricsCollector.js.map