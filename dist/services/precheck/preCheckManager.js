"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreCheckManager = void 0;
const demandScraper_1 = require("../demandScraper");
const passiveEngagementAnalyzer_1 = require("../passiveEngagementAnalyzer");
const metricsCollector_1 = require("../metrics/metricsCollector");
class PreCheckManager {
    constructor() {
        this.platformRequirements = {
            amazon: {
                minContentPages: 3,
                minTrafficDaily: 100,
                minEngagementRate: 0.1,
                requiredElements: ['privacy-policy', 'terms-of-service', 'about'],
                contentQualityThreshold: 0.8,
            },
            ebay: {
                minContentPages: 2,
                minTrafficDaily: 50,
                minEngagementRate: 0.05,
                requiredElements: ['contact', 'about'],
                contentQualityThreshold: 0.7,
            },
        };
        this.demandScraper = new demandScraper_1.DemandScraper();
        this.engagementAnalyzer = new passiveEngagementAnalyzer_1.PassiveEngagementAnalyzer();
        this.metricsCollector = metricsCollector_1.MetricsCollector.getInstance();
    }
    static getInstance() {
        if (!PreCheckManager.instance) {
            PreCheckManager.instance = new PreCheckManager();
        }
        return PreCheckManager.instance;
    }
    async validateApplication(requirements) {
        const platform = this.platformRequirements[requirements.platform];
        const results = {
            isReady: false,
            score: 0,
            requirements: {},
            recommendations: [],
        };
        // Domain validation
        const domainCheck = await this.validateDomain(requirements.domain);
        results.requirements.domain = domainCheck;
        if (!domainCheck.passed) {
            results.recommendations.push(domainCheck.recommendation);
        }
        // Content validation
        const contentCheck = await this.validateContent(requirements.contentUrls, platform.minContentPages, platform.contentQualityThreshold);
        results.requirements.content = contentCheck;
        if (!contentCheck.passed) {
            results.recommendations.push(contentCheck.recommendation);
        }
        // Traffic validation
        const trafficCheck = await this.validateTraffic(requirements.trafficMetrics, platform.minTrafficDaily);
        results.requirements.traffic = trafficCheck;
        if (!trafficCheck.passed) {
            results.recommendations.push(trafficCheck.recommendation);
        }
        // Calculate overall score and readiness
        const scores = Object.values(results.requirements).map((r) => r.score);
        results.score = scores.reduce((a, b) => a + b, 0) / scores.length;
        results.isReady =
            results.score >= 0.8 && !Object.values(results.requirements).some((r) => !r.passed);
        return results;
    }
    async validateDomain(domain) {
        // Basic domain validation
        const hasSSL = domain.startsWith('https://');
        const isCustomDomain = !domain.includes('.wordpress.com') && !domain.includes('.blogspot.com');
        return {
            passed: hasSSL && isCustomDomain,
            score: hasSSL && isCustomDomain ? 1 : 0.5,
            recommendation: !hasSSL
                ? 'Enable SSL for your domain'
                : !isCustomDomain
                    ? 'Use a custom domain instead of a free subdomain'
                    : undefined,
        };
    }
    async validateContent(urls, minPages, qualityThreshold) {
        const hasEnoughPages = urls.length >= minPages;
        const qualityScores = await Promise.all(urls.map((url) => this.demandScraper.calculateContentRelevance({
            title: url,
            content: '', // We'll need to fetch content
            subreddit: '',
        })));
        const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
        const meetsQuality = avgQuality >= qualityThreshold;
        return {
            passed: hasEnoughPages && meetsQuality,
            score: (hasEnoughPages ? 0.5 : 0) + (meetsQuality ? 0.5 : 0),
            recommendation: !hasEnoughPages
                ? `Add at least ${minPages - urls.length} more content pages`
                : !meetsQuality
                    ? 'Improve content quality to meet platform standards'
                    : undefined,
        };
    }
    async validateTraffic(metrics, minDaily) {
        if (!metrics || !minDaily) {
            return {
                passed: false,
                score: 0,
                recommendation: 'Set up analytics to track traffic metrics',
            };
        }
        const hasEnoughTraffic = (metrics.dailyVisitors || 0) >= minDaily;
        const trafficScore = Math.min((metrics.dailyVisitors || 0) / minDaily, 1);
        return {
            passed: hasEnoughTraffic,
            score: trafficScore,
            recommendation: !hasEnoughTraffic
                ? `Increase daily traffic to at least ${minDaily} visitors`
                : undefined,
        };
    }
}
exports.PreCheckManager = PreCheckManager;
//# sourceMappingURL=preCheckManager.js.map