"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandScraper = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const node_fetch_1 = __importDefault(require("node-fetch"));
class DemandScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.currencyPatterns = {
            USD: /\$\d+(?:\.\d{2})?/g,
            EUR: /€\d+(?:\.\d{2})?/g,
            GBP: /£\d+(?:\.\d{2})?/g,
            JPY: /¥\d+/g,
            INR: /₹\d+(?:\.\d{2})?/g,
            generic: /\d+(?:\.\d{2})?\s*(?:dollars|euros|pounds)/gi,
        };
        this.featureCategories = {
            scent: ['smell', 'scent', 'fragrance', 'aroma', 'notes', 'olfactory', 'nose'],
            performance: [
                'performance',
                'longevity',
                'lasting',
                'duration',
                'wear time',
                'projection',
                'sillage',
                'trail',
            ],
            quality: ['quality', 'authentic', 'genuine', 'fake', 'batch', 'formulation', 'ingredients'],
            packaging: ['bottle', 'packaging', 'design', 'presentation', 'cap', 'sprayer', 'atomizer'],
            occasion: [
                'formal',
                'casual',
                'office',
                'date',
                'evening',
                'daily',
                'special occasion',
                'signature',
            ],
            season: [
                'summer',
                'winter',
                'spring',
                'fall',
                'autumn',
                'seasonal',
                'hot weather',
                'cold weather',
            ],
            gender: ['masculine', 'feminine', 'unisex', 'gender', 'men', 'women'],
            comparison: ['similar', 'different', 'better', 'worse', 'alternative', 'clone', 'dupe'],
        };
        this.sentimentIndicators = {
            strong_positive: [
                'amazing',
                'excellent',
                'perfect',
                'holy grail',
                'masterpiece',
                'outstanding',
                'phenomenal',
                'incredible',
            ],
            positive: ['good', 'nice', 'like', 'enjoy', 'recommend', 'pleasant', 'satisfied', 'worth'],
            weak_positive: ['decent', 'okay', 'fine', 'acceptable', 'reasonable', 'fair'],
            neutral: ['neutral', 'moderate', 'average', 'standard', 'typical'],
            weak_negative: ['meh', 'mediocre', 'underwhelming', 'overpriced', 'disappointing'],
            negative: ['bad', 'poor', 'dislike', 'avoid', "wouldn't recommend", 'not worth'],
            strong_negative: [
                'terrible',
                'horrible',
                'awful',
                'waste',
                'garbage',
                'disgusting',
                'repulsive',
            ],
        };
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.lastRequestTime = 0;
        this.MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 5000; // 5 seconds
        this.cache = new Map();
        this.CACHE_TTL = 1000 * 60 * 60; // 1 hour
        this.metrics = {
            requestsTotal: 0,
            requestsSuccess: 0,
            requestsError: 0,
            signalsProcessed: 0,
            signalsValid: 0,
            signalsInvalid: 0,
            processingTimeMs: 0,
            cacheHits: 0,
            cacheMisses: 0,
            rateLimitHits: 0,
        };
        this.startTime = Date.now();
        this.logger = {
            info: (message, context) => {
                console.info(`[DemandScraper] ${message}`, context ? context : '');
            },
            warn: (message, context) => {
                console.warn(`[DemandScraper] ${message}`, context ? context : '');
            },
            error: (message, error) => {
                console.error(`[DemandScraper] ${message}`, error ? error : '');
            },
        };
    }
    getMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.startTime,
            cacheSize: this.cache.size,
            queueLength: this.requestQueue.length,
            averageProcessingTime: this.metrics.signalsProcessed > 0
                ? this.metrics.processingTimeMs / this.metrics.signalsProcessed
                : 0,
            successRate: this.metrics.requestsTotal > 0
                ? (this.metrics.requestsSuccess / this.metrics.requestsTotal) * 100
                : 0,
            validationRate: this.metrics.signalsProcessed > 0
                ? (this.metrics.signalsValid / this.metrics.signalsProcessed) * 100
                : 0,
            cacheHitRate: this.metrics.cacheHits + this.metrics.cacheMisses > 0
                ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
                : 0,
        };
    }
    async initialize() {
        try {
            this.browser = await puppeteer_1.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            this.page = await this.browser.newPage();
            await this.page.setViewport({ width: 1280, height: 800 });
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        }
        catch (error) {
            this.logger.error('Error initializing browser:', { error: String(error) });
            throw error;
        }
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
    async processQueue() {
        if (this.isProcessingQueue)
            return;
        this.isProcessingQueue = true;
        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            if (request) {
                const timeSinceLastRequest = Date.now() - this.lastRequestTime;
                if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
                    await new Promise((resolve) => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
                }
                try {
                    await request();
                }
                catch (error) {
                    this.logger.error('Error processing queued request:', error);
                }
                this.lastRequestTime = Date.now();
            }
        }
        this.isProcessingQueue = false;
    }
    async queueRequest(url) {
        let retries = 0;
        const executeRequest = async () => {
            try {
                const cachedData = this.cache.get(url);
                if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_TTL) {
                    this.metrics.cacheHits++;
                    return cachedData.data;
                }
                this.metrics.cacheMisses++;
                const response = await (0, node_fetch_1.default)(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    },
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                this.cache.set(url, { data, timestamp: Date.now() });
                this.metrics.requestsSuccess++;
                return data;
            }
            catch (error) {
                this.metrics.requestsError++;
                if (retries < this.MAX_RETRIES) {
                    retries++;
                    this.logger.warn(`Request failed, retrying (${retries}/${this.MAX_RETRIES})...`, {
                        url,
                        error,
                    });
                    await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
                    return executeRequest();
                }
                throw error;
            }
        };
        return new Promise((resolve, reject) => {
            this.requestQueue.push(async () => {
                try {
                    const result = await executeRequest();
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }
    sanitizeText(text) {
        return text
            .replace(/[^\w\s$€£¥.,!?-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    validateSignal(signal) {
        try {
            // Basic structure validation
            if (!signal.id || !signal.title || !signal.content || !signal.url || !signal.timestamp) {
                this.logger.warn('Missing required fields');
                return false;
            }
            // Validate confidence scores
            if (typeof signal.confidence.overall !== 'number' ||
                signal.confidence.overall < 0 ||
                signal.confidence.overall > 1) {
                this.logger.warn('Invalid confidence score', { confidence: signal.confidence.overall });
                return false;
            }
            // Validate sentiment
            if (typeof signal.analysis.sentiment !== 'number' ||
                signal.analysis.sentiment < -1 ||
                signal.analysis.sentiment > 1) {
                this.logger.warn('Invalid sentiment score', { sentiment: signal.analysis.sentiment });
                return false;
            }
            // Validate timestamp
            if (isNaN(new Date(signal.timestamp).getTime())) {
                this.logger.warn('Invalid timestamp');
                return false;
            }
            // Validate confidence factors
            const factors = signal.confidence.factors;
            if (!factors.textQuality ||
                !factors.communityEngagement ||
                !factors.authorCredibility ||
                !factors.contentRelevance ||
                !factors.temporalRelevance) {
                this.logger.warn('Missing confidence factors');
                return false;
            }
            // Validate metadata
            if (!signal.metadata.processingTime ||
                !signal.metadata.extractionVersion ||
                typeof signal.metadata.dataQualityScore !== 'number') {
                this.logger.warn('Invalid metadata');
                return false;
            }
            return true;
        }
        catch (error) {
            this.logger.error('Error validating signal', error);
            return false;
        }
    }
    extractRedditSignalFromJson(post) {
        const title = this.sanitizeText(post.title);
        const content = this.sanitizeText(post.selftext);
        const timestamp = new Date(post.created_utc * 1000).toISOString();
        // Calculate confidence factors
        const textQuality = this.calculateTextQuality(title, content);
        const communityEngagement = this.calculateEngagementScore(post);
        const authorCredibility = this.calculateAuthorCredibility(post);
        const contentRelevance = this.calculateContentRelevance(post);
        const temporalRelevance = this.calculateTemporalRelevance(post.created_utc);
        // Extract features and topics
        const features = this.extractFeatures(title, content);
        const topics = this.extractTopics(title, content);
        const pricePoints = this.extractPricePoints(content);
        // Calculate overall confidence
        const confidenceFactors = {
            textQuality,
            communityEngagement,
            authorCredibility,
            contentRelevance,
            temporalRelevance,
        };
        const overallConfidence = Object.values(confidenceFactors).reduce((sum, score) => sum + score, 0) / 5;
        return {
            id: post.permalink.split('/').slice(-2)[0],
            title,
            content,
            url: `https://reddit.com${post.permalink}`,
            timestamp,
            confidence: {
                overall: overallConfidence,
                factors: confidenceFactors,
            },
            context: {
                thread: {
                    id: post.permalink.split('/').slice(-2)[0],
                    depth: 0,
                    isOriginalPost: true,
                },
                author: {
                    id: post.author,
                    karmaScore: post.author_karma,
                    accountAge: post.author_created_utc
                        ? (Date.now() / 1000 - post.author_created_utc) / (24 * 60 * 60)
                        : undefined,
                },
                community: {
                    name: post.subreddit,
                    size: post.subreddit_subscribers,
                    topicRelevance: this.calculateTopicRelevance(post),
                    activityLevel: post.num_comments / 100, // Normalized to 0-1 range
                },
            },
            analysis: {
                sentiment: this.calculateSentiment(title, content),
                topics,
                pricePoints,
                features,
                relationships: {
                    relatedThreads: [],
                    crossReferences: [],
                    temporalConnections: [],
                },
            },
            metadata: {
                processingTime: Date.now(),
                extractionVersion: '1.0.0',
                dataQualityScore: this.calculateDataQualityScore({
                    id: post.permalink.split('/').slice(-2)[0],
                    title,
                    content,
                    url: `https://reddit.com${post.permalink}`,
                    timestamp,
                    confidence: {
                        overall: overallConfidence,
                        factors: confidenceFactors,
                    },
                    context: {
                        thread: {
                            id: post.permalink.split('/').slice(-2)[0],
                            depth: 0,
                            isOriginalPost: true,
                        },
                        author: {
                            id: post.author,
                        },
                        community: {
                            name: post.subreddit,
                            topicRelevance: this.calculateTopicRelevance(post),
                        },
                    },
                    analysis: {
                        sentiment: this.calculateSentiment(title, content),
                        topics,
                        pricePoints,
                        features,
                        relationships: {
                            relatedThreads: [],
                            crossReferences: [],
                            temporalConnections: [],
                        },
                    },
                    metadata: {
                        processingTime: Date.now(),
                        extractionVersion: '1.0.0',
                        dataQualityScore: 0,
                    },
                }),
            },
        };
    }
    processRedditComment(comment) {
        try {
            const signal = this.extractRedditSignalFromJson({
                ...comment,
                title: '',
                selftext: comment.body,
                depth: comment.depth || 0,
            });
            return this.validateSignal(signal) ? signal : null;
        }
        catch (error) {
            this.logger.error('Error processing Reddit comment', error);
            return null;
        }
    }
    extractFeatures(title, content) {
        // Combine title and content for analysis
        const text = `${title}\n${content}`;
        // Extract features using NLP analysis
        const features = {
            topics: [],
            entities: [],
            keywords: [],
            sentiments: [],
            concepts: [],
        };
        // Implement feature extraction logic here
        // This is a placeholder implementation
        features.topics.push({
            name: 'example_topic',
            sentiment: 0.8,
            confidence: 0.9,
            mentions: 1,
            context: ['example_context'],
        });
        return features;
    }
    extractTopics(title, content) {
        const text = `${title} ${content}`.toLowerCase();
        const topics = [];
        // Define topic patterns with associated keywords
        const topicPatterns = [
            {
                name: 'Price Sensitivity',
                patterns: [
                    'cost',
                    'price',
                    'expensive',
                    'cheap',
                    'worth',
                    'value',
                    'money',
                    'budget',
                    'affordable',
                ],
                keywords: new Set(),
            },
            {
                name: 'Feature Request',
                patterns: ['need', 'want', 'wish', 'should have', 'missing', 'add', 'implement', 'feature'],
                keywords: new Set(),
            },
            {
                name: 'Alternative Search',
                patterns: [
                    'alternative',
                    'instead',
                    'similar',
                    'like',
                    'other than',
                    'replacement',
                    'switch from',
                ],
                keywords: new Set(),
            },
            {
                name: 'Quality Concern',
                patterns: ['quality', 'reliable', 'stable', 'buggy', 'issue', 'problem', 'broken'],
                keywords: new Set(),
            },
            {
                name: 'User Experience',
                patterns: [
                    'interface',
                    'ui',
                    'ux',
                    'easy',
                    'difficult',
                    'intuitive',
                    'confusing',
                    'simple',
                ],
                keywords: new Set(),
            },
        ];
        // Process each topic
        for (const topic of topicPatterns) {
            let matchCount = 0;
            const contextWindow = 10; // Words before/after for context
            // Find matches and collect keywords
            for (const pattern of topic.patterns) {
                const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    matchCount += matches.length;
                    // Extract keywords around matches
                    let lastIndex = 0;
                    while ((lastIndex = text.indexOf(pattern, lastIndex)) !== -1) {
                        const start = text.lastIndexOf('.', lastIndex) + 1;
                        const end = text.indexOf('.', lastIndex + pattern.length);
                        const sentence = text.slice(start, end !== -1 ? end : undefined);
                        // Get surrounding words
                        const words = sentence.split(/\s+/);
                        const patternIndex = words.findIndex((w) => w.includes(pattern));
                        if (patternIndex !== -1) {
                            const startIdx = Math.max(0, patternIndex - contextWindow);
                            const endIdx = Math.min(words.length, patternIndex + contextWindow);
                            // Add contextual keywords
                            words.slice(startIdx, endIdx).forEach((word) => {
                                if (word.length > 3 && !topic.patterns.includes(word)) {
                                    topic.keywords.add(word);
                                }
                            });
                        }
                        lastIndex += pattern.length;
                    }
                }
            }
            if (matchCount > 0) {
                const confidence = Math.min(matchCount / 3, 1); // Normalize confidence
                topics.push({
                    name: topic.name,
                    confidence,
                    keywords: Array.from(topic.keywords),
                });
            }
        }
        // Sort by confidence
        return topics.sort((a, b) => b.confidence - a.confidence);
    }
    calculateTextQuality(title, content) {
        const titleLength = title?.length || 0;
        const contentLength = content?.length || 0;
        const hasValidLength = titleLength > 0 && contentLength > 0;
        return hasValidLength ? 1.0 : 0.0;
    }
    calculateEngagementScore(post) {
        if (!post)
            return 0;
        const score = post.score || 0;
        const numComments = post.num_comments || 0;
        const upvoteRatio = post.upvote_ratio || 0.5;
        const awards = post.total_awards_received || 0;
        // Normalize each metric to a 0-1 scale
        const normalizedScore = Math.min(score / 1000, 1);
        const normalizedComments = Math.min(numComments / 100, 1);
        const normalizedAwards = Math.min(awards / 10, 1);
        // Weight the metrics
        const weightedScore = normalizedScore * 0.4;
        const weightedComments = normalizedComments * 0.3;
        const weightedUpvoteRatio = upvoteRatio * 0.2;
        const weightedAwards = normalizedAwards * 0.1;
        // Calculate final engagement score
        return weightedScore + weightedComments + weightedUpvoteRatio + weightedAwards;
    }
    calculateAuthorCredibility(post) {
        if (!post || !post.author || post.author === '[deleted]') {
            return 0;
        }
        // Calculate account age score (if available)
        let ageScore = 0;
        if (post.author_created_utc) {
            const accountAgeInDays = (Date.now() / 1000 - post.author_created_utc) / (24 * 60 * 60);
            ageScore = Math.min(accountAgeInDays / 365, 1); // Cap at 1 year
        }
        // Calculate karma score (if available)
        let karmaScore = 0;
        if (post.author_karma) {
            karmaScore = Math.min(post.author_karma / 10000, 1); // Cap at 10k karma
        }
        // Calculate verification score
        const verificationScore = post.author_verified ? 1 : 0;
        // Weight the components
        const weightedAge = ageScore * 0.4;
        const weightedKarma = karmaScore * 0.4;
        const weightedVerification = verificationScore * 0.2;
        return weightedAge + weightedKarma + weightedVerification;
    }
    calculateContentRelevance(post) {
        if (!post || !post.title || !post.selftext) {
            return 0;
        }
        const text = `${post.title} ${post.selftext}`.toLowerCase();
        // Keywords that indicate demand-related content
        const demandKeywords = [
            'need',
            'want',
            'looking for',
            'recommend',
            'suggestion',
            'help',
            'advice',
            'opinion',
            'review',
            'compare',
            'alternative',
            'versus',
            'vs',
            'better than',
            'price',
            'cost',
            'worth',
            'value',
            'quality',
            'experience',
            'problem',
            'solution',
            'upgrade',
        ];
        // Count keyword matches
        let keywordMatches = 0;
        demandKeywords.forEach((keyword) => {
            if (text.includes(keyword)) {
                keywordMatches++;
            }
        });
        // Calculate base relevance score
        let relevanceScore = keywordMatches / (demandKeywords.length * 0.3); // Normalize to 0-1
        relevanceScore = Math.min(relevanceScore, 1); // Cap at 1
        // Boost score if post has substantial content
        const contentLength = text.length;
        const lengthBonus = Math.min(contentLength / 1000, 0.2); // Up to 0.2 bonus for length
        // Boost score if title is a question
        const isQuestion = post.title.includes('?');
        const questionBonus = isQuestion ? 0.1 : 0;
        // Calculate final score with bonuses
        return Math.min(relevanceScore + lengthBonus + questionBonus, 1);
    }
    calculateSubredditRelevance(subreddit) {
        const relevantSubreddits = ['business', 'entrepreneur', 'startups', 'marketing', 'ecommerce'];
        return relevantSubreddits.includes(subreddit.toLowerCase()) ? 1.0 : 0.5;
    }
    async getCommentsFromJson(subreddit, postId) {
        try {
            const response = await (0, node_fetch_1.default)(`https://www.reddit.com/r/${subreddit}/comments/${postId}.json`);
            const data = (await response.json());
            return data[1]?.data?.children?.map((child) => child.data) || [];
        }
        catch (error) {
            this.logger.error('Error getting comments:', { error: String(error) });
            return [];
        }
    }
    analyzeCommentsFromJson(comments) {
        const analysis = {
            depth: 0,
            pricePoints: [],
            features: {},
            averageSentiment: 0,
            uniqueCommenters: 0,
            controversyScore: 0,
            _commenters: new Set(), // Temporary set for tracking
        };
        let totalSentiment = 0;
        let commentCount = 0;
        const processComment = (comment, depth) => {
            if (!comment || !comment.body)
                return;
            // Track unique commenters
            if (comment.author) {
                analysis._commenters.add(comment.author);
            }
            // Extract price points
            const prices = this.extractPricePoints(comment.body);
            analysis.pricePoints.push(...prices);
            // Extract and categorize features
            const features = this.extractFeatures(comment.body, '');
            const categorizedFeatures = this.categorizeFeatures(features);
            Object.entries(categorizedFeatures).forEach(([category, newFeatures]) => {
                if (!analysis.features[category]) {
                    analysis.features[category] = [];
                }
                newFeatures.forEach((feature) => {
                    const existing = analysis.features[category].find((f) => f.name === feature.name);
                    if (existing) {
                        existing.mentions += feature.mentions;
                        existing.sentiment =
                            (existing.sentiment * existing.mentions + feature.sentiment) /
                                (existing.mentions + 1);
                        existing.context.push(...feature.context);
                    }
                    else {
                        analysis.features[category].push(feature);
                    }
                });
            });
            // Update depth
            analysis.depth = Math.max(analysis.depth, depth);
            // Analyze sentiment
            const sentiment = this.analyzeSentiment(comment.body);
            totalSentiment += sentiment * (comment.score || 1);
            commentCount++;
            // Calculate controversy
            analysis.controversyScore += comment.controversiality || 0;
            // Process replies recursively
            if (comment.replies?.data?.children) {
                comment.replies.data.children.forEach((child) => {
                    processComment(child.data, depth + 1);
                });
            }
        };
        comments.forEach((comment) => processComment(comment, 0));
        // Calculate final metrics
        analysis.averageSentiment = commentCount > 0 ? totalSentiment / commentCount : 0;
        analysis.controversyScore = analysis.controversyScore / (comments.length || 1);
        analysis.uniqueCommenters = analysis._commenters.size;
        // Remove temporary set and return the rest
        const { _commenters, ...result } = analysis;
        return result;
    }
    categorizeFeatures(features) {
        return features;
    }
    extractPricePoints(text) {
        const pricePoints = [];
        // Currency patterns
        const currencyPatterns = {
            USD: ['\\$', 'usd', 'dollars?'],
            EUR: ['€', 'eur', 'euros?'],
            GBP: ['£', 'gbp', 'pounds?'],
            JPY: ['¥', 'jpy', 'yen'],
            AUD: ['aud', 'australian dollars?'],
            CAD: ['cad', 'canadian dollars?'],
        };
        // Build regex pattern for all currencies
        const currencySymbols = Object.values(currencyPatterns).flat().join('|');
        const pricePattern = new RegExp(`(?:${currencySymbols})\\s*\\d+(?:[,.]\\d{1,2})?|\\d+(?:[,.]\\d{1,2})?\\s*(?:${currencySymbols})`, 'gi');
        // Find all price mentions
        let match;
        while ((match = pricePattern.exec(text)) !== null) {
            const priceText = match[0];
            // Extract numeric value and currency
            const numericValue = parseFloat(priceText.replace(/[^\d.]/g, ''));
            let currency = 'USD'; // Default currency
            // Determine currency from match
            for (const [curr, patterns] of Object.entries(currencyPatterns)) {
                if (patterns.some((pattern) => new RegExp(pattern, 'i').test(priceText))) {
                    currency = curr;
                    break;
                }
            }
            // Extract context (sentence containing the price)
            const contextStart = Math.max(0, text.lastIndexOf('.', match.index) + 1);
            const contextEnd = text.indexOf('.', match.index + priceText.length);
            const context = text.slice(contextStart, contextEnd !== -1 ? contextEnd : undefined).trim();
            // Calculate confidence based on various factors
            let confidence = 0.5; // Base confidence
            // Adjust confidence based on context quality
            confidence += context.length > 20 ? 0.2 : 0; // Longer context is better
            confidence += /\b(costs?|prices?|worth|value)\b/i.test(context) ? 0.2 : 0; // Price-related words
            confidence += /\bper\s+(month|year|annual(ly)?)\b/i.test(context) ? 0.1 : 0; // Time period mentions
            confidence += numericValue > 0 && numericValue < 10000 ? 0.1 : 0; // Reasonable price range
            // Normalize confidence
            confidence = Math.min(Math.max(confidence, 0), 1);
            pricePoints.push({
                value: numericValue,
                currency,
                confidence,
                context,
            });
        }
        // Sort by confidence and remove duplicates
        return pricePoints
            .sort((a, b) => b.confidence - a.confidence)
            .filter((price, index, self) => index === self.findIndex((p) => p.value === price.value && p.currency === price.currency));
    }
    calculatePriceConfidence(context) {
        let confidence = 0.5; // Base confidence
        // Increase confidence based on price-related keywords
        const priceKeywords = ['price', 'cost', 'paid', 'bought', 'purchased', 'retail', 'sale'];
        priceKeywords.forEach((keyword) => {
            if (context.toLowerCase().includes(keyword)) {
                confidence += 0.1;
            }
        });
        // Decrease confidence for uncertain language
        const uncertaintyKeywords = ['about', 'around', 'maybe', 'approximately', 'guess'];
        uncertaintyKeywords.forEach((keyword) => {
            if (context.toLowerCase().includes(keyword)) {
                confidence -= 0.1;
            }
        });
        return Math.min(Math.max(confidence, 0), 1);
    }
    calculateSentiment(title, content) {
        const text = `${title} ${content}`.toLowerCase();
        let score = 0;
        let wordCount = 0;
        // Process each word
        const words = text.split(/\s+/);
        for (const word of words) {
            if (this.sentimentIndicators.strong_positive.includes(word)) {
                score += 2;
                wordCount++;
            }
            else if (this.sentimentIndicators.positive.includes(word)) {
                score += 1;
                wordCount++;
            }
            else if (this.sentimentIndicators.strong_negative.includes(word)) {
                score -= 2;
                wordCount++;
            }
            else if (this.sentimentIndicators.negative.includes(word)) {
                score -= 1;
                wordCount++;
            }
        }
        // Consider negations
        const negations = ['not', 'no', 'never', "don't", 'cannot', "doesn't"];
        for (let i = 0; i < words.length - 1; i++) {
            if (negations.includes(words[i])) {
                // Invert the score for the next word if it's a sentiment word
                for (const pattern of Object.values(this.sentimentIndicators)) {
                    if (pattern.includes(words[i + 1])) {
                        score *= -1;
                        break;
                    }
                }
            }
        }
        // Normalize score to [-1, 1]
        return wordCount > 0 ? Math.max(-1, Math.min(1, score / wordCount)) : 0;
    }
    analyzeSentiment(text) {
        let sentiment = 0;
        const lowerText = text.toLowerCase();
        // Calculate weighted sentiment
        Object.entries(this.sentimentIndicators).forEach(([strength, words]) => {
            const weight = {
                strong_positive: 3,
                positive: 2,
                weak_positive: 1,
                neutral: 0,
                weak_negative: -1,
                negative: -2,
                strong_negative: -3,
            }[strength] || 0;
            words.forEach((word) => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = (text.match(regex) || []).length;
                sentiment += matches * weight;
            });
        });
        // Adjust for negations
        const negations = [
            'not',
            'no',
            'never',
            "don't",
            "doesn't",
            "didn't",
            "won't",
            "wouldn't",
            "couldn't",
            "shouldn't",
        ];
        negations.forEach((negation) => {
            const regex = new RegExp(`${negation}\\s+\\w+`, 'gi');
            const matches = (text.match(regex) || []).length;
            sentiment -= matches; // Reduce sentiment for negated words
        });
        // Normalize to [-1, 1] range
        return Math.tanh(sentiment / 5);
    }
    calculateTopicRelevance(post) {
        if (!post || !post.title || !post.selftext) {
            return 0;
        }
        const relevantTopics = new Map([
            ['technology', 1.0],
            ['software', 0.9],
            ['programming', 0.9],
            ['development', 0.8],
            ['web', 0.8],
            ['app', 0.8],
            ['mobile', 0.7],
            ['computer', 0.7],
            ['digital', 0.7],
            ['product', 0.6],
            ['service', 0.6],
            ['business', 0.5],
        ]);
        const text = `${post.title} ${post.selftext}`.toLowerCase();
        let relevanceScore = 0;
        let matchCount = 0;
        relevantTopics.forEach((weight, topic) => {
            if (text.includes(topic)) {
                relevanceScore += weight;
                matchCount++;
            }
        });
        return matchCount > 0 ? relevanceScore / matchCount : 0;
    }
    calculateTemporalRelevance(timestamp) {
        const ageInDays = (Date.now() / 1000 - timestamp) / (24 * 60 * 60);
        return Math.max(0, 1 - ageInDays / 365); // Linear decay over one year
    }
    calculateDataQualityScore(signal) {
        const factors = {
            confidence: signal.confidence.overall * 0.4,
            completeness: this.calculateCompleteness(signal) * 0.3,
            consistency: this.calculateConsistency(signal) * 0.3,
        };
        return Object.values(factors).reduce((a, b) => a + b, 0);
    }
    calculateCompleteness(signal) {
        const requiredFields = [
            signal.id,
            signal.title,
            signal.content,
            signal.url,
            signal.timestamp,
            signal.analysis.sentiment,
            signal.context.thread.id,
            signal.context.author.id,
            signal.context.community.name,
        ];
        return requiredFields.filter(Boolean).length / requiredFields.length;
    }
    calculateConsistency(signal) {
        const checks = [
            signal.confidence.overall >= 0 && signal.confidence.overall <= 1,
            signal.analysis.sentiment >= -1 && signal.analysis.sentiment <= 1,
            new Date(signal.timestamp).getTime() > 0,
            signal.metadata.dataQualityScore >= 0 && signal.metadata.dataQualityScore <= 1,
            signal.confidence.factors.textQuality >= 0 && signal.confidence.factors.textQuality <= 1,
            signal.confidence.factors.communityEngagement >= 0 &&
                signal.confidence.factors.communityEngagement <= 1,
            signal.confidence.factors.authorCredibility >= 0 &&
                signal.confidence.factors.authorCredibility <= 1,
            signal.confidence.factors.contentRelevance >= 0 &&
                signal.confidence.factors.contentRelevance <= 1,
            signal.confidence.factors.temporalRelevance >= 0 &&
                signal.confidence.factors.temporalRelevance <= 1,
        ];
        return checks.filter(Boolean).length / checks.length;
    }
    calculateCoherence(title, content) {
        // Simple coherence check based on shared keywords
        const titleWords = new Set(title.toLowerCase().split(/\s+/));
        const contentWords = content.toLowerCase().split(/\s+/);
        const sharedWords = contentWords.filter((word) => titleWords.has(word));
        return Math.min(sharedWords.length / 5, 1);
    }
    async scrapeReddit(subreddit, query) {
        const requestId = Math.random().toString(36).substring(7);
        this.logger.info(`Starting Reddit scrape`, { requestId, subreddit, query });
        try {
            // Validate input
            if (!subreddit || !query || /[^\w\s-]/.test(subreddit)) {
                this.logger.warn(`Invalid input parameters`, { requestId, subreddit, query });
                return [];
            }
            const startTime = Date.now();
            const encodedQuery = encodeURIComponent(query);
            const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodedQuery}&sort=relevance&t=year&limit=100`;
            this.logger.info(`Fetching data from Reddit`, { requestId, url });
            const response = await (0, node_fetch_1.default)(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data?.data?.children) {
                this.logger.warn(`No data found for query`, { requestId, query });
                return [];
            }
            const signals = [];
            for (const post of data.data.children) {
                try {
                    this.metrics.signalsProcessed++;
                    const signal = this.extractRedditSignalFromJson(post.data);
                    if (signal && this.validateSignal(signal)) {
                        this.metrics.signalsValid++;
                        signals.push(signal);
                    }
                    else {
                        this.metrics.signalsInvalid++;
                        this.logger.warn(`Invalid signal detected`, {
                            requestId,
                            postId: post.data.id,
                            title: post.data.title,
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`Error processing post`, {
                        requestId,
                        postId: post.data.id,
                        error,
                    });
                    continue;
                }
            }
            const duration = Date.now() - startTime;
            this.metrics.processingTimeMs += duration;
            this.logger.info(`Completed Reddit scrape`, {
                requestId,
                duration,
                totalSignals: signals.length,
                validSignals: this.metrics.signalsValid,
                invalidSignals: this.metrics.signalsInvalid,
            });
            return signals;
        }
        catch (error) {
            this.metrics.requestsError++;
            this.logger.error(`Error scraping Reddit`, { requestId, error });
            return [];
        }
    }
}
exports.DemandScraper = DemandScraper;
//# sourceMappingURL=demandScraper.js.map