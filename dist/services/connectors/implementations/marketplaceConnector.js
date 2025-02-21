"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceConnector = void 0;
const configService_1 = require("../../../config/configService");
const dataConnector_1 = require("../dataConnector");
const signalContentAnalyzer_1 = require("../../analysis/signalContentAnalyzer");
const demandSignalEnhancer_1 = require("../../analysis/demandSignalEnhancer");
const intelligenceCoordinator_1 = require("../../analysis/intelligenceCoordinator");
const trendAnalyzer_1 = require("../../analysis/trendAnalyzer");
const socialMediaConnector_1 = require("./socialMediaConnector");
const marketTrendAdapter_1 = require("../../analysis/adapters/marketTrendAdapter");
const operators_1 = require("rxjs/operators");
class MarketplaceConnector extends dataConnector_1.DataConnector {
    constructor(config) {
        super({ type: 'marketplace', id: 'marketplace_connector' });
        this.signalAnalyzer = signalContentAnalyzer_1.SignalContentAnalyzer.getInstance();
        this.signalEnhancer = demandSignalEnhancer_1.DemandSignalEnhancer.getInstance();
        this.intelligenceCoordinator = intelligenceCoordinator_1.IntelligenceCoordinator.getInstance();
        this.trendAnalyzer = trendAnalyzer_1.TrendAnalyzer.getInstance();
        this.socialMediaConnector = new socialMediaConnector_1.SocialMediaConnector({
            platform: 'marketplace',
            endpoint: configService_1.configService.get('SOCIAL_API_ENDPOINT'),
            streamEndpoint: configService_1.configService.get('SOCIAL_STREAM_ENDPOINT'),
        });
        this.marketTrendAdapter = marketTrendAdapter_1.MarketTrendAdapter.getInstance();
        this.amazonEndpoint = config.amazonEndpoint;
        this.ebayEndpoint = config.ebayEndpoint;
    }
    async fetchMarketData(category) {
        const response = await this.makeRequest(`${this.amazonEndpoint}/categories/${category}`);
        const data = await response.json();
        return this.validateResponse(data);
    }
    async fetchProductData(productId) {
        const response = await this.makeRequest(`${this.amazonEndpoint}/products/${productId}`);
        const data = await response.json();
        return this.validateResponse(data);
    }
    async fetchPriceHistory(productId) {
        const response = await this.makeRequest(`${this.amazonEndpoint}/products/${productId}/prices`);
        const data = await response.json();
        return this.validateResponse(data);
    }
    calculateDemandScore(data) {
        // Implement demand score calculation
        return 0.5;
    }
    calculateConfidence(data) {
        // Implement confidence calculation
        return 0.8;
    }
    calculateMarketSentiment(response) {
        // Ensure we don't conflict with base class by making this more specific
        if ('averageRating' in response.metadata) {
            return response.metadata.averageRating ?? 0.5;
        }
        return 0.5; // Default neutral sentiment
    }
    calculateSentiment(metadata) {
        // Override base class method to use averageRating if available
        if ('averageRating' in metadata) {
            return metadata.averageRating ?? 0.5;
        }
        return 0.5; // Default neutral sentiment
    }
    async calculateUrgency(metadata) {
        // Get trend analysis
        const trendMetrics = await this.trendAnalyzer.analyzeTrend({
            ...metadata,
            source: 'marketplace',
        });
        // Enhance with social media trends
        const socialTrends = await this.socialMediaConnector.fetchTrendingTopics(metadata.category, metadata.region || 'global');
        // Adapt market trends
        const marketTrend = this.marketTrendAdapter.getTrend(metadata.category, metadata.region || 'global');
        // 1. Enhance the signal with our Digital Intelligence
        const enhancedSignal = await this.signalEnhancer
            .enhanceSignal({
            ...metadata,
            trends: {
                trendMetrics,
                socialTrends,
                marketTrend,
            },
        })
            .pipe((0, operators_1.mergeMap)(async (contextualSignal) => {
            // Analyze content and motivation with trend context
            const contentMetrics = await this.signalAnalyzer.analyzeContent({
                ...metadata,
                context: contextualSignal,
                trends: {
                    trendMetrics,
                    socialTrends,
                    marketTrend,
                },
            });
            // Get coordinated intelligence insights
            const insights = await this.intelligenceCoordinator.coordinateInsights(metadata.id, 'motivation');
            return {
                signal: contextualSignal,
                content: contentMetrics,
                insights,
                trends: {
                    trendMetrics,
                    socialTrends,
                    marketTrend,
                },
            };
        }))
            .toPromise();
        if (!enhancedSignal)
            return 0.5;
        const { signal: contextualSignal, content: contentMetrics, insights, trends } = enhancedSignal;
        // 2. Extract motivation factors with trend context
        const motivationFactors = {
            social: this.extractSocialMotivation(contextualSignal, contentMetrics, insights, trends),
            practical: this.extractPracticalMotivation(contextualSignal, contentMetrics, insights, trends),
            emotional: this.extractEmotionalMotivation(contextualSignal, contentMetrics, insights, trends),
            milestone: this.extractMilestoneMotivation(contextualSignal, contentMetrics, insights, trends),
        };
        // 3. Calculate trend-aware weights
        const weights = this.calculateDynamicWeights(motivationFactors, metadata, trends);
        const urgencyFactors = [];
        // 4. Price analysis with manipulation detection
        if (metadata.price) {
            const priceUrgency = await this.calculatePriceUrgency(metadata.price, metadata, contextualSignal);
            urgencyFactors.push({
                value: priceUrgency,
                weight: weights.price,
            });
        }
        // 5. Network effect with enhanced context
        if (metadata.networkSignals) {
            const networkUrgency = await this.calculateNetworkUrgency(metadata.networkSignals, contextualSignal);
            urgencyFactors.push({
                value: networkUrgency,
                weight: weights.network,
            });
        }
        // 6. Milestone proximity with contextual understanding
        if (metadata.milestones?.length > 0) {
            const milestoneUrgency = this.calculateMilestoneUrgency(metadata.milestones, contextualSignal, insights);
            urgencyFactors.push({
                value: milestoneUrgency,
                weight: weights.milestone,
            });
        }
        // 7. Engagement with deeper understanding
        if (metadata.passiveEngagement) {
            const engagementUrgency = this.calculateEngagementUrgency(metadata.passiveEngagement, contextualSignal, contentMetrics);
            urgencyFactors.push({
                value: engagementUrgency,
                weight: weights.engagement,
            });
        }
        // Add other factors with their AI-adjusted weights...
        if (metadata.stockLevel) {
            urgencyFactors.push({
                value: Math.max(0, 1 - metadata.stockLevel / 100),
                weight: weights.stock,
            });
        }
        if (metadata.averageRating) {
            urgencyFactors.push({
                value: metadata.averageRating / 5,
                weight: weights.rating,
            });
        }
        // Calculate final urgency
        const totalWeight = urgencyFactors.reduce((sum, factor) => sum + factor.weight, 0);
        return (urgencyFactors.reduce((sum, factor) => sum + factor.value * factor.weight, 0) / totalWeight);
    }
    extractSocialMotivation(signal, metrics, insights, trends) {
        const trendFactor = trends.trendMetrics.organicGrowth * 0.2;
        const socialTrendStrength = this.calculateSocialTrendStrength(trends.socialTrends) * 0.2;
        return (signal.relatedSignals.length * 0.15 + // Network effect
            metrics.communityEngagement.quality * 0.2 + // Quality of social engagement
            metrics.communityEngagement.sustainability * 0.15 + // Long-term social value
            (insights.socialContext?.strength || 0) * 0.1 + // AI-derived social context
            trendFactor + // Organic trend growth
            socialTrendStrength // Social media trend strength
        );
    }
    extractPracticalMotivation(signal, metrics, insights, trends) {
        const marketValidation = trends.trendMetrics.marketValidation * 0.2;
        const marketTrendStrength = (trends.marketTrend?.strength || 0) * 0.2;
        return (metrics.practicalValue * 0.3 + // Direct practical value
            metrics.detailDepth * 0.2 + // Level of practical consideration
            (insights.practicalContext?.strength || 0) * 0.1 + // AI-derived practical context
            marketValidation + // Market validation from trends
            marketTrendStrength // Market trend strength
        );
    }
    extractEmotionalMotivation(signal, metrics, insights, trends) {
        const trendSentiment = this.calculateTrendSentiment(trends) * 0.2;
        const socialMomentum = trends.trendMetrics.sustainedInterest * 0.2;
        return (Math.abs(signal.sentiment.score) * 0.2 + // Strength of emotional response
            signal.sentiment.magnitude * 0.2 + // Intensity of emotion
            (insights.emotionalContext?.strength || 0) * 0.2 + // AI-derived emotional context
            trendSentiment + // Sentiment from trends
            socialMomentum // Sustained interest in trends
        );
    }
    extractMilestoneMotivation(signal, metrics, insights, trends) {
        const trendUrgency = trends.trendMetrics.realWorldImpact * 0.2;
        const marketMomentum = (trends.marketTrend?.velocity || 0) * 0.2;
        return ((insights.temporalUrgency || 0) * 0.2 + // AI-detected time pressure
            (insights.eventSignificance || 0) * 0.2 + // Importance of milestone
            (insights.socialPressure || 0) * 0.2 + // Related social expectations
            trendUrgency + // Real-world impact urgency
            marketMomentum // Market trend velocity
        );
    }
    calculateSocialTrendStrength(trends) {
        if (!trends?.length)
            return 0;
        return (trends.reduce((strength, trend) => {
            const recency = Math.exp(-0.1 * ((Date.now() - trend.timestamp) / (1000 * 60 * 60))); // Decay over hours
            const volume = Math.min(trend.volume / 1000, 1); // Normalize volume
            const engagement = Math.min(trend.engagement / 100, 1); // Normalize engagement
            return strength + recency * volume * engagement;
        }, 0) / trends.length);
    }
    calculateTrendSentiment(trends) {
        const socialSentiment = trends.socialTrends?.reduce((sum, trend) => sum + (trend.sentiment || 0), 0) /
            (trends.socialTrends?.length || 1);
        const marketSentiment = trends.marketTrend?.sentiment || 0;
        const trendMetricsSentiment = trends.trendMetrics?.sentiment || 0;
        return (socialSentiment + marketSentiment + trendMetricsSentiment) / 3;
    }
    calculateDynamicWeights(motivationFactors, metadata, trends) {
        // Start with base weights
        const weights = {
            price: 0.15,
            stock: 0.1,
            rating: 0.1,
            velocity: 0.1,
            milestone: 0.25,
            network: 0.2,
            engagement: 0.1,
        };
        // Adjust based on dominant motivation
        const dominantMotivation = Object.entries(motivationFactors).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        // Get trend strength
        const trendStrength = Math.min((trends.trendMetrics?.organicGrowth || 0) +
            this.calculateSocialTrendStrength(trends.socialTrends) +
            (trends.marketTrend?.strength || 0), 1);
        // Dynamic adjustment based on motivation strength and trends
        switch (dominantMotivation) {
            case 'social':
                weights.network *= 1.5 + trendStrength * 0.5; // Up to 2x boost from trends
                weights.engagement *= 1.3 + trendStrength * 0.3;
                weights.milestone *= 0.8;
                break;
            case 'practical':
                weights.price *= 1.4 + trendStrength * 0.4;
                weights.stock *= 1.3 + trendStrength * 0.3;
                weights.rating *= 1.2 + trendStrength * 0.2;
                break;
            case 'emotional':
                weights.engagement *= 1.4 + trendStrength * 0.4;
                weights.rating *= 1.3 + trendStrength * 0.3;
                weights.network *= 1.2 + trendStrength * 0.2;
                break;
            case 'milestone':
                weights.milestone *= 1.6 + trendStrength * 0.4;
                weights.stock *= 1.2 + trendStrength * 0.2;
                weights.velocity *= 1.2 + trendStrength * 0.2;
                break;
        }
        // Normalize weights
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        Object.keys(weights).forEach((key) => {
            weights[key] /= total;
        });
        return weights;
    }
    calculateNetworkUrgency(signals, contextualSignal) {
        const urgencyFactors = [];
        // 1. Direct relationships (immediate family, close friends)
        if (signals.directRelations) {
            const directScore = signals.directRelations.reduce((score, relation) => {
                // Higher weights for closer relationships
                const relationWeights = {
                    immediate_family: 1.0,
                    close_friend: 0.8,
                    family: 0.6,
                    friend: 0.4,
                    acquaintance: 0.2,
                };
                return score + (relationWeights[relation.type] || 0.1);
            }, 0);
            urgencyFactors.push(Math.min(directScore / 5, 1)); // Cap at 5 strong relationships
        }
        // 2. Shared interests/activities
        if (signals.sharedInterests) {
            const interestScore = signals.sharedInterests.reduce((score, interest) => {
                return score + (interest.strength || 0.5);
            }, 0);
            urgencyFactors.push(Math.min(interestScore / 10, 1)); // Cap at 10 strong interests
        }
        // 3. Recent interactions
        if (signals.recentInteractions) {
            const now = Date.now();
            const interactionScore = signals.recentInteractions.reduce((score, interaction) => {
                const daysAgo = (now - interaction.timestamp) / (1000 * 60 * 60 * 24);
                return score + Math.max(0, 1 - daysAgo / 30); // Higher weight for more recent interactions
            }, 0);
            urgencyFactors.push(Math.min(interactionScore / 5, 1)); // Cap at 5 recent strong interactions
        }
        return urgencyFactors.length > 0
            ? urgencyFactors.reduce((sum, score) => sum + score, 0) / urgencyFactors.length
            : 0;
    }
    calculatePriceUrgency(currentPrice, metadata, contextualSignal) {
        const { averagePrice, historicalPrices = [], competitorPrices = [], seasonalFactors = {}, demandSignals = {}, } = metadata;
        // 1. Basic price comparison (lower is better)
        const priceRatio = currentPrice / averagePrice;
        let urgency = 1 - Math.min(priceRatio, 1);
        // 2. Check for price manipulation signals
        const priceManipulationScore = this.detectPriceManipulation(currentPrice, historicalPrices, seasonalFactors, demandSignals);
        // Boost urgency if we detect artificial price inflation attempts
        if (priceManipulationScore > 0) {
            // The more manipulation we detect, the more we boost genuine good prices
            urgency *= 1 + priceManipulationScore;
        }
        // 3. Compare against competitor landscape
        if (competitorPrices.length > 0) {
            const lowestCompetitor = Math.min(...competitorPrices);
            const competitorRatio = currentPrice / lowestCompetitor;
            // Boost urgency significantly if we're beating manipulated competitor prices
            if (competitorRatio < 1 && priceManipulationScore > 0) {
                urgency *= 1.5; // Strong boost for beating manipulated prices
            }
        }
        // 4. Historical price analysis
        if (historicalPrices.length > 0) {
            const recentPrices = historicalPrices.slice(-30); // Last 30 data points
            const minRecent = Math.min(...recentPrices);
            // If current price is near historical minimum, increase urgency
            if (currentPrice <= minRecent * 1.1) {
                // Within 10% of recent minimum
                urgency *= 1.3;
            }
        }
        return Promise.resolve(Math.min(urgency, 1)); // Cap at 1
    }
    detectPriceManipulation(currentPrice, historicalPrices, seasonalFactors, demandSignals) {
        let manipulationScore = 0;
        // 1. Check for artificial price inflation before "discounts"
        if (historicalPrices.length >= 14) {
            // Need at least 2 weeks of data
            const recentPrices = historicalPrices.slice(-14);
            const avgBeforeDiscount = recentPrices.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
            const avgAfterDiscount = recentPrices.slice(-7).reduce((a, b) => a + b, 0) / 7;
            if (avgBeforeDiscount > avgAfterDiscount * 1.5) {
                // 50% markup before discount
                manipulationScore += 0.3;
            }
        }
        // 2. Check for unjustified seasonal markup
        const currentSeason = this.getCurrentSeason();
        const expectedSeasonalIncrease = seasonalFactors[currentSeason] || 1;
        const actualIncrease = currentPrice / (historicalPrices[0] || currentPrice);
        if (actualIncrease > expectedSeasonalIncrease * 1.5) {
            manipulationScore += 0.2;
        }
        // 3. Check for demand-based price gouging
        if (demandSignals.urgency > 0.8 && demandSignals.priceIncrease > 0.3) {
            manipulationScore += 0.4;
        }
        // 4. Check for coordinated price increases
        if (demandSignals.competitorCoordination > 0.7) {
            manipulationScore += 0.3;
        }
        return Math.min(manipulationScore, 1);
    }
    getCurrentSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4)
            return 'spring';
        if (month >= 5 && month <= 7)
            return 'summer';
        if (month >= 8 && month <= 10)
            return 'fall';
        return 'winter';
    }
    calculateMilestoneUrgency(milestones, contextualSignal, insights) {
        const now = Date.now();
        const urgencyScores = milestones.map((milestone) => {
            const daysUntil = (milestone.date - now) / (1000 * 60 * 60 * 24);
            return Math.min(Math.max(0, 1 - daysUntil / 7), 1) * milestone.importance;
        });
        return Math.max(...urgencyScores);
    }
    calculateEngagementUrgency(engagement, contextualSignal, contentMetrics) {
        const engagementScores = {
            likes: (engagement.likes || 0) * 1,
            shares: (engagement.shares || 0) * 2,
            comments: (engagement.comments || 0) * 1.5,
            saves: (engagement.saves || 0) * 1.8,
            clicks: (engagement.clicks || 0) * 0.5,
        };
        const totalPossibleScore = Object.values(engagementScores).reduce((sum, score) => sum + score, 0);
        const normalizedEngagement = totalPossibleScore > 0 ? Math.min(totalPossibleScore / 1000, 1) : 0;
        return normalizedEngagement;
    }
    async getAmazonCategoryData(category) {
        const response = await this.fetchMarketData(category);
        return [
            {
                timestamp: Date.now(),
                value: response.averagePrice,
                source: 'amazon',
                type: 'category_demand',
                metadata: {
                    category,
                    totalProducts: response.totalProducts,
                    averagePrice: response.averagePrice,
                    trendingProducts: response.metadata.trendingProducts,
                    averageRating: response.metadata.averageRating,
                },
                confidence: this.calculateSentiment(response.metadata),
            },
        ];
    }
    async getEbayListings(category) {
        const response = await this.fetchMarketData(category);
        const listings = response.metadata.trendingProducts || [];
        const averagePrice = listings.reduce((sum, item) => sum + item.price, 0) / (listings.length || 1);
        return [
            {
                timestamp: Date.now(),
                value: averagePrice,
                source: 'ebay',
                type: 'category_demand',
                metadata: {
                    category,
                    itemCount: listings.length,
                    averagePrice,
                    listings,
                    averageRating: response.metadata.averageRating,
                },
                confidence: this.calculateSentiment(response.metadata),
            },
        ];
    }
    calculateAveragePrice(items) {
        if (!items || items.length === 0)
            return 0;
        const total = items.reduce((sum, item) => sum + (item.price || 0), 0);
        return total / items.length;
    }
    async fetchAmazonData(category) {
        const response = await this.makeRequest(`${this.amazonEndpoint}/products?category=${category}`);
        return response.json();
    }
    async fetchEbayData(query) {
        const response = await this.makeRequest(`${this.ebayEndpoint}/search?q=${query}`);
        return response.json();
    }
    async makeRequest(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    }
    validateResponse(data) {
        if (!data) {
            throw new Error('Invalid response data');
        }
        return data;
    }
}
exports.MarketplaceConnector = MarketplaceConnector;
//# sourceMappingURL=marketplaceConnector.js.map