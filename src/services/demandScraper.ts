import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer';
import fetch from 'node-fetch';
import { ScrapedDemandSignal } from '../types/demandTypes';

interface RedditPost {
    title: string;
    selftext: string;
    score: number;
    num_comments: number;
    created_utc: number;
    permalink: string;
    url: string;
    upvote_ratio: number;
    total_awards_received: number;
    author: string;
    subreddit_subscribers: number;
    over_18: boolean;
}

interface RedditComment {
    body: string;
    score: number;
    author: string;
    created_utc: number;
    total_awards_received: number;
    controversiality: number;
    replies?: {
        data: {
            children: Array<{
                data: RedditComment;
            }>;
        };
    };
}

interface RedditApiResponse {
    data: {
        children: Array<{
            data: RedditPost;
        }>;
    };
}

interface RedditCommentsResponse extends Array<{
    data: {
        children: Array<{
            data: RedditComment;
        }>;
    };
}> {}

interface PricePoint {
    value: number;
    currency: string;
    confidence: number;
    context: string;
}

interface Feature {
    name: string;
    sentiment: number;
    mentions: number;
    context: string[];
}

export class DemandScraper {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private readonly currencyPatterns = {
        USD: /\$\d+(?:\.\d{2})?/g,
        EUR: /€\d+(?:\.\d{2})?/g,
        GBP: /£\d+(?:\.\d{2})?/g,
        JPY: /¥\d+/g,
        INR: /₹\d+(?:\.\d{2})?/g,
        generic: /\d+(?:\.\d{2})?\s*(?:dollars|euros|pounds)/gi
    };

    private readonly featureCategories = {
        scent: ['smell', 'scent', 'fragrance', 'aroma', 'notes', 'olfactory', 'nose'],
        performance: ['performance', 'longevity', 'lasting', 'duration', 'wear time', 'projection', 'sillage', 'trail'],
        quality: ['quality', 'authentic', 'genuine', 'fake', 'batch', 'formulation', 'ingredients'],
        packaging: ['bottle', 'packaging', 'design', 'presentation', 'cap', 'sprayer', 'atomizer'],
        occasion: ['formal', 'casual', 'office', 'date', 'evening', 'daily', 'special occasion', 'signature'],
        season: ['summer', 'winter', 'spring', 'fall', 'autumn', 'seasonal', 'hot weather', 'cold weather'],
        gender: ['masculine', 'feminine', 'unisex', 'gender', 'men', 'women'],
        comparison: ['similar', 'different', 'better', 'worse', 'alternative', 'clone', 'dupe']
    };

    private readonly sentimentIndicators = {
        strong_positive: ['amazing', 'excellent', 'perfect', 'holy grail', 'masterpiece', 'outstanding', 'phenomenal', 'incredible'],
        positive: ['good', 'nice', 'like', 'enjoy', 'recommend', 'pleasant', 'satisfied', 'worth'],
        weak_positive: ['decent', 'okay', 'fine', 'acceptable', 'reasonable', 'fair'],
        neutral: ['neutral', 'moderate', 'average', 'standard', 'typical'],
        weak_negative: ['meh', 'mediocre', 'underwhelming', 'overpriced', 'disappointing'],
        negative: ['bad', 'poor', 'dislike', 'avoid', 'wouldn\'t recommend', 'not worth'],
        strong_negative: ['terrible', 'horrible', 'awful', 'waste', 'garbage', 'disgusting', 'repulsive']
    };

    private requestQueue: Array<() => Promise<any>> = [];
    private isProcessingQueue = false;
    private lastRequestTime = 0;
    private readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 5000; // 5 seconds

    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

    private metrics = {
        requestsTotal: 0,
        requestsSuccess: 0,
        requestsError: 0,
        signalsProcessed: 0,
        signalsValid: 0,
        signalsInvalid: 0,
        processingTimeMs: 0,
        cacheHits: 0,
        cacheMisses: 0,
        rateLimitHits: 0
    };

    private startTime: number = Date.now();

    private logger = {
        info: (message: string, context?: any) => {
            console.info(`[DemandScraper] ${message}`, context ? context : '');
        },
        warn: (message: string, context?: any) => {
            console.warn(`[DemandScraper] ${message}`, context ? context : '');
        },
        error: (message: string, error?: any) => {
            console.error(`[DemandScraper] ${message}`, error ? error : '');
        }
    };

    public getMetrics(): any {
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
            cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0 
                ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 
                : 0
        };
    }

    async initialize(): Promise<void> {
        try {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            this.page = await this.browser.newPage();
            await this.page.setViewport({ width: 1280, height: 800 });
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        } catch (error: unknown) {
            this.logger.error('Error initializing browser:', { error: String(error) });
            throw error;
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }

    private async processQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            if (request) {
                const timeSinceLastRequest = Date.now() - this.lastRequestTime;
                if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
                    await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
                }
                
                try {
                    await request();
                } catch (error) {
                    this.logger.error('Error processing queued request:', error);
                }
                
                this.lastRequestTime = Date.now();
            }
        }

        this.isProcessingQueue = false;
    }

    private async queueRequest(url: string): Promise<any> {
        let retries = 0;
        const executeRequest = async (): Promise<any> => {
            try {
                const cachedData = this.cache.get(url);
                if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_TTL) {
                    this.metrics.cacheHits++;
                    return cachedData.data;
                }
                this.metrics.cacheMisses++;

                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                this.cache.set(url, { data, timestamp: Date.now() });
                this.metrics.requestsSuccess++;
                return data;
            } catch (error) {
                this.metrics.requestsError++;
                if (retries < this.MAX_RETRIES) {
                    retries++;
                    this.logger.warn(`Request failed, retrying (${retries}/${this.MAX_RETRIES})...`, { url, error });
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
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
                } catch (error) {
                    reject(error);
                }
            });

            this.processQueue();
        });
    }

    private sanitizeText(text: string): string {
        return text
            .replace(/[^\w\s$€£¥.,!?-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private validateSignal(signal: ScrapedDemandSignal): boolean {
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
            if (!factors.textQuality || !factors.communityEngagement ||
                !factors.authorCredibility || !factors.contentRelevance ||
                !factors.temporalRelevance) {
                this.logger.warn('Missing confidence factors');
                return false;
            }

            // Validate metadata
            if (!signal.metadata.processingTime || !signal.metadata.extractionVersion ||
                typeof signal.metadata.dataQualityScore !== 'number') {
                this.logger.warn('Invalid metadata');
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error('Error validating signal', error);
            return false;
        }
    }

    private extractRedditSignalFromJson(post: any): ScrapedDemandSignal {
        try {
            const signal: ScrapedDemandSignal = {
                id: post.id || '',
                title: post.title || '',
                content: post.selftext || '',
                url: post.permalink ? `https://reddit.com${post.permalink}` : '',
                timestamp: new Date(post.created_utc * 1000).toISOString(),
                confidence: {
                    overall: 0,
                    factors: {
                        textQuality: 0,
                        communityEngagement: 0,
                        authorCredibility: 0,
                        contentRelevance: 0,
                        temporalRelevance: 0
                    }
                },
                context: {
                    thread: {
                        id: post.id || '',
                        parentId: post.parent_id,
                        depth: post.depth || 0,
                        isOriginalPost: !post.parent_id
                    },
                    author: {
                        id: post.author || '',
                        karmaScore: post.author_karma,
                        accountAge: post.author_created_utc ?
                            (Date.now() / 1000 - post.author_created_utc) / (24 * 60 * 60) : undefined,
                        domainActivity: undefined
                    },
                    community: {
                        name: post.subreddit || '',
                        size: post.subreddit_subscribers,
                        topicRelevance: this.calculateTopicRelevance(post),
                        activityLevel: undefined
                    }
                },
                analysis: {
                    sentiment: this.analyzeSentiment(post.title + ' ' + post.selftext),
                    topics: this.extractTopics(post.title, post.selftext),
                    pricePoints: this.extractPricePoints(post.title + ' ' + post.selftext),
                    features: this.extractFeatures(post.title, post.selftext),
                    relationships: {
                        relatedThreads: [],
                        crossReferences: [],
                        temporalConnections: []
                    }
                },
                metadata: {
                    processingTime: Date.now(),
                    extractionVersion: '1.0.0',
                    dataQualityScore: 0
                }
            };

            // Calculate confidence scores
            signal.confidence.factors = {
                textQuality: this.calculateTextQuality(post.title, post.selftext),
                communityEngagement: this.calculateEngagementScore(post),
                authorCredibility: this.calculateAuthorCredibility(post),
                contentRelevance: this.calculateContentRelevance(post),
                temporalRelevance: this.calculateTemporalRelevance(post.created_utc)
            };

            // Calculate overall confidence
            signal.confidence.overall = Object.values(signal.confidence.factors)
                .reduce((sum, score) => sum + score, 0) / 5;

            // Calculate data quality score
            signal.metadata.dataQualityScore = this.calculateDataQualityScore(signal);

            return signal;
        } catch (error) {
            this.logger.error('Error extracting signal from JSON', error);
            throw error;
        }
    }

    private processRedditComment(comment: any): ScrapedDemandSignal | null {
        try {
            const signal = this.extractRedditSignalFromJson({
                ...comment,
                title: '',
                selftext: comment.body,
                depth: comment.depth || 0
            });

            return this.validateSignal(signal) ? signal : null;
        } catch (error) {
            this.logger.error('Error processing Reddit comment', error);
            return null;
        }
    }

    private extractFeatures(title: string, content: string): { [category: string]: Array<{ name: string; sentiment: number; confidence: number; mentions: number; context: string[]; }> } {
        const text = `${title} ${content}`.toLowerCase();
        const features: { [category: string]: Array<{ name: string; sentiment: number; confidence: number; mentions: number; context: string[]; }> } = {};

        // Define feature categories and their patterns
        const featurePatterns = {
            'UI/UX': [
                'interface', 'design', 'layout', 'usability', 'responsive',
                'accessibility', 'navigation', 'theme', 'dark mode', 'light mode'
            ],
            'Performance': [
                'speed', 'fast', 'slow', 'performance', 'efficient',
                'memory', 'cpu', 'resource', 'optimization', 'loading'
            ],
            'Security': [
                'security', 'privacy', 'encryption', 'authentication',
                'password', 'protection', 'vulnerability', 'safe', 'breach'
            ],
            'Integration': [
                'integration', 'api', 'plugin', 'extension', 'addon',
                'compatibility', 'sync', 'connection', 'import', 'export'
            ],
            'Pricing': [
                'price', 'cost', 'subscription', 'free', 'premium',
                'trial', 'plan', 'tier', 'payment', 'discount'
            ]
        };

        // Process each category
        for (const [category, patterns] of Object.entries(featurePatterns)) {
            const categoryFeatures: Array<{ name: string; sentiment: number; confidence: number; mentions: number; context: string[]; }> = [];

            for (const pattern of patterns) {
                const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
                const matches = text.match(regex);
                
                if (matches) {
                    const mentions = matches.length;
                    const contexts: string[] = [];
                    let lastIndex = 0;

                    // Extract context for each mention
                    while ((lastIndex = text.indexOf(pattern, lastIndex)) !== -1) {
                        const start = Math.max(0, text.lastIndexOf('.', lastIndex) + 1);
                        const end = text.indexOf('.', lastIndex + pattern.length);
                        const context = text.slice(
                            start,
                            end !== -1 ? end : undefined
                        ).trim();
                        
                        if (context) {
                            contexts.push(context);
                        }
                        
                        lastIndex += pattern.length;
                    }

                    // Calculate sentiment for this feature
                    const featureSentiment = this.calculateFeatureSentiment(contexts);
                    
                    // Calculate confidence based on mentions and context quality
                    const confidence = Math.min(
                        (mentions * 0.3) + // More mentions increase confidence
                        (contexts.length * 0.4) + // More context increases confidence
                        (Math.abs(featureSentiment) * 0.3), // Strong sentiment increases confidence
                        1
                    );

                    categoryFeatures.push({
                        name: pattern,
                        sentiment: featureSentiment,
                        confidence,
                        mentions,
                        context: contexts
                    });
                }
            }

            if (categoryFeatures.length > 0) {
                features[category] = categoryFeatures;
            }
        }

        return features;
    }

    private calculateFeatureSentiment(contexts: string[]): number {
        let totalSentiment = 0;
        let weightedCount = 0;

        for (const context of contexts) {
            const words = context.split(/\s+/);
            let contextSentiment = 0;
            let contextWeight = 1;

            for (const word of words) {
                if (this.sentimentIndicators.strong_positive.includes(word)) {
                    contextSentiment += 2;
                    contextWeight += 0.5;
                } else if (this.sentimentIndicators.positive.includes(word)) {
                    contextSentiment += 1;
                    contextWeight += 0.3;
                } else if (this.sentimentIndicators.strong_negative.includes(word)) {
                    contextSentiment -= 2;
                    contextWeight += 0.5;
                } else if (this.sentimentIndicators.negative.includes(word)) {
                    contextSentiment -= 1;
                    contextWeight += 0.3;
                }
            }

            totalSentiment += contextSentiment * contextWeight;
            weightedCount += contextWeight;
        }

        return weightedCount > 0 ? Math.max(-1, Math.min(1, totalSentiment / weightedCount)) : 0;
    }

    private extractTopics(title: string, content: string): Array<{ name: string; confidence: number; keywords: string[]; }> {
        const text = `${title} ${content}`.toLowerCase();
        const topics: Array<{ name: string; confidence: number; keywords: string[]; }> = [];

        // Define topic patterns with associated keywords
        const topicPatterns = [
            {
                name: 'Price Sensitivity',
                patterns: ['cost', 'price', 'expensive', 'cheap', 'worth', 'value', 'money', 'budget', 'affordable'],
                keywords: new Set<string>()
            },
            {
                name: 'Feature Request',
                patterns: ['need', 'want', 'wish', 'should have', 'missing', 'add', 'implement', 'feature'],
                keywords: new Set<string>()
            },
            {
                name: 'Alternative Search',
                patterns: ['alternative', 'instead', 'similar', 'like', 'other than', 'replacement', 'switch from'],
                keywords: new Set<string>()
            },
            {
                name: 'Quality Concern',
                patterns: ['quality', 'reliable', 'stable', 'buggy', 'issue', 'problem', 'broken'],
                keywords: new Set<string>()
            },
            {
                name: 'User Experience',
                patterns: ['interface', 'ui', 'ux', 'easy', 'difficult', 'intuitive', 'confusing', 'simple'],
                keywords: new Set<string>()
            }
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
                        const patternIndex = words.findIndex(w => w.includes(pattern));
                        
                        if (patternIndex !== -1) {
                            const startIdx = Math.max(0, patternIndex - contextWindow);
                            const endIdx = Math.min(words.length, patternIndex + contextWindow);
                            
                            // Add contextual keywords
                            words.slice(startIdx, endIdx).forEach(word => {
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
                    keywords: Array.from(topic.keywords)
                });
            }
        }

        // Sort by confidence
        return topics.sort((a, b) => b.confidence - a.confidence);
    }

    private calculateTextQuality(title: string, content: string): number {
        const factors = {
            length: 0,
            formatting: 0,
            uniqueWords: 0,
            coherence: 0
        };

        // Length score (0-1)
        const totalLength = (title?.length || 0) + (content?.length || 0);
        factors.length = Math.min(totalLength / 1000, 1);

        // Formatting score (0-1)
        const hasGoodFormatting = /^[A-Z].*[.!?]$/.test(title) && // Proper capitalization and punctuation
            !/(.)\1{4,}/.test(title) && // No character spam
            !/[A-Z]{5,}/.test(title); // No excessive caps
        factors.formatting = hasGoodFormatting ? 1 : 0.5;

        // Unique words score (0-1)
        const words = `${title} ${content}`.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        factors.uniqueWords = Math.min(uniqueWords.size / 100, 1);

        // Coherence score (0-1)
        factors.coherence = this.calculateCoherence(title, content);

        // Calculate weighted average
        return (
            factors.length * 0.3 +
            factors.formatting * 0.2 +
            factors.uniqueWords * 0.2 +
            factors.coherence * 0.3
        );
    }

    private calculateEngagementScore(post: any): number {
        const scores = {
            upvoteRatio: (post.data?.upvote_ratio || 0.5) * 0.3,
            numComments: Math.min((post.data?.num_comments || 0) / 100, 1) * 0.3,
            awards: Math.min((post.data?.total_awards_received || 0) / 10, 1) * 0.2,
            age: Math.max(0, 1 - (Date.now() / 1000 - post.data.created_utc) / (180 * 24 * 60 * 60)) * 0.2
        };

        return Object.values(scores).reduce((a, b) => a + b, 0);
    }

    private calculateAuthorCredibility(post: any): number {
        if (!post.data?.author || post.data.author === '[deleted]') return 0;

        const factors = {
            karmaScore: Math.min((post.data.author_karma || 0) / 10000, 1) * 0.4,
            accountAge: post.data.author_created_utc ? 
                Math.min((Date.now() / 1000 - post.data.author_created_utc) / (365 * 24 * 60 * 60), 1) * 0.3 : 0,
            verifiedEmail: (post.data.author_verified || false) ? 0.3 : 0
        };

        return Object.values(factors).reduce((a, b) => a + b, 0);
    }

    private calculateContentRelevance(post: any): number {
        const relevanceFactors = {
            titleRelevance: this.calculateKeywordRelevance(post.data?.title || ''),
            contentRelevance: this.calculateKeywordRelevance(post.data?.selftext || ''),
            subredditRelevance: this.calculateSubredditRelevance(post.data?.subreddit || '')
        };

        return (
            relevanceFactors.titleRelevance * 0.4 +
            relevanceFactors.contentRelevance * 0.3 +
            relevanceFactors.subredditRelevance * 0.3
        );
    }

    private calculateTemporalRelevance(timestamp: number): number {
        const ageInDays = (Date.now() / 1000 - timestamp) / (24 * 60 * 60);
        return Math.max(0, 1 - (ageInDays / 365)); // Linear decay over one year
    }

    private calculateOverallConfidence(factors: any): number {
        return (
            factors.textQuality * 0.25 +
            factors.communityEngagement * 0.2 +
            factors.authorCredibility * 0.2 +
            factors.contentRelevance * 0.25 +
            factors.temporalRelevance * 0.1
        );
    }

    private calculateDataQualityScore(signal: ScrapedDemandSignal): number {
        const factors = {
            confidence: signal.confidence.overall * 0.4,
            completeness: this.calculateCompleteness(signal) * 0.3,
            consistency: this.calculateConsistency(signal) * 0.3
        };

        return Object.values(factors).reduce((a, b) => a + b, 0);
    }

    private calculateKeywordRelevance(text: string = ''): number {
        const keywords = new Set([
            'need', 'want', 'looking for', 'alternative to',
            'better than', 'instead of', 'recommend', 'suggestion',
            'help find', 'similar to', 'price', 'cost',
            'worth', 'value', 'quality', 'feature'
        ]);

        const words = text.toLowerCase().split(/\s+/);
        const matches = words.filter(word => keywords.has(word));
        
        return Math.min(matches.length / 3, 1);
    }

    private calculateSubredditRelevance(subreddit: string): number {
        const relevantSubreddits = new Set([
            'technology', 'software', 'gadgets', 'tech',
            'programming', 'computers', 'hardware', 'apps',
            'productivity', 'startup', 'entrepreneur'
        ]);

        return relevantSubreddits.has(subreddit.toLowerCase()) ? 1 : 0.5;
    }

    private calculateTopicRelevance(post: any): number {
        const relevantTopics = new Map([
            ['technology', 1.0],
            ['software', 1.0],
            ['programming', 0.9],
            ['webdev', 0.9],
            ['computers', 0.8],
            ['techsupport', 0.8],
            ['gadgets', 0.7],
            ['hardware', 0.7],
            ['apps', 0.7],
            ['productivity', 0.6],
            ['startup', 0.6],
            ['entrepreneur', 0.6]
        ]);

        const subreddit = post.data?.subreddit.toLowerCase();
        
        // Direct match
        if (relevantTopics.has(subreddit)) {
            return relevantTopics.get(subreddit)!;
        }

        // Partial match
        for (const [topic, score] of relevantTopics.entries()) {
            if (subreddit.includes(topic)) {
                return score * 0.8; // Slightly lower confidence for partial matches
            }
        }

        // Check title and content for topic relevance
        const text = `${post.data?.title} ${post.data?.selftext}`.toLowerCase();
        let topicMatches = 0;

        for (const topic of relevantTopics.keys()) {
            if (text.includes(topic)) {
                topicMatches++;
            }
        }

        return Math.min(topicMatches / 3, 0.5); // Cap at 0.5 for text-only matches
    }

    private calculateCoherence(title: string, content: string): number {
        // Simple coherence check based on shared keywords
        const titleWords = new Set(title.toLowerCase().split(/\s+/));
        const contentWords = content.toLowerCase().split(/\s+/);
        
        const sharedWords = contentWords.filter(word => titleWords.has(word));
        return Math.min(sharedWords.length / 5, 1);
    }

    private calculateCompleteness(signal: ScrapedDemandSignal): number {
        const requiredFields = [
            signal.id,
            signal.title,
            signal.content,
            signal.url,
            signal.timestamp,
            signal.analysis.sentiment,
            signal.context.thread.id,
            signal.context.author.id,
            signal.context.community.name
        ];

        return requiredFields.filter(Boolean).length / requiredFields.length;
    }

    private calculateConsistency(signal: ScrapedDemandSignal): number {
        const checks = [
            signal.confidence.overall >= 0 && signal.confidence.overall <= 1,
            signal.analysis.sentiment >= -1 && signal.analysis.sentiment <= 1,
            new Date(signal.timestamp).getTime() > 0,
            signal.metadata.dataQualityScore >= 0 && signal.metadata.dataQualityScore <= 1,
            signal.confidence.factors.textQuality >= 0 && signal.confidence.factors.textQuality <= 1,
            signal.confidence.factors.communityEngagement >= 0 && signal.confidence.factors.communityEngagement <= 1,
            signal.confidence.factors.authorCredibility >= 0 && signal.confidence.factors.authorCredibility <= 1,
            signal.confidence.factors.contentRelevance >= 0 && signal.confidence.factors.contentRelevance <= 1,
            signal.confidence.factors.temporalRelevance >= 0 && signal.confidence.factors.temporalRelevance <= 1
        ];

        return checks.filter(Boolean).length / checks.length;
    }

    private async getCommentsFromJson(subreddit: string, postId: string): Promise<RedditComment[]> {
        try {
            const response = await fetch(
                `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`
            );
            const data = await response.json() as RedditCommentsResponse;
            return data[1]?.data?.children?.map(child => child.data) || [];
        } catch (error: unknown) {
            this.logger.error('Error getting comments:', { error: String(error) });
            return [];
        }
    }

    private analyzeCommentsFromJson(comments: RedditComment[]): {
        depth: number;
        pricePoints: PricePoint[];
        features: Record<string, Feature[]>;
        averageSentiment: number;
        uniqueCommenters: number;
        controversyScore: number;
    } {
        const analysis = {
            depth: 0,
            pricePoints: [] as PricePoint[],
            features: {} as Record<string, Feature[]>,
            averageSentiment: 0,
            uniqueCommenters: 0,
            controversyScore: 0,
            _commenters: new Set<string>() // Temporary set for tracking
        };

        let totalSentiment = 0;
        let commentCount = 0;

        const processComment = (comment: RedditComment, depth: number) => {
            if (!comment || !comment.body) return;

            // Track unique commenters
            if (comment.author) {
                analysis._commenters.add(comment.author);
            }

            // Extract price points
            const prices = this.extractPricePoints(comment.body);
            analysis.pricePoints.push(...prices);

            // Extract and categorize features
            const features = this.extractFeatures(comment.body);
            const categorizedFeatures = this.categorizeFeatures(features);
            Object.entries(categorizedFeatures).forEach(([category, newFeatures]) => {
                if (!analysis.features[category]) {
                    analysis.features[category] = [];
                }
                newFeatures.forEach(feature => {
                    const existing = analysis.features[category].find(f => f.name === feature.name);
                    if (existing) {
                        existing.mentions += feature.mentions;
                        existing.sentiment = (existing.sentiment * existing.mentions + feature.sentiment) / (existing.mentions + 1);
                        existing.context.push(...feature.context);
                    } else {
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
                comment.replies.data.children.forEach(child => {
                    processComment(child.data, depth + 1);
                });
            }
        };

        comments.forEach(comment => processComment(comment, 0));

        // Calculate final metrics
        analysis.averageSentiment = commentCount > 0 ? totalSentiment / commentCount : 0;
        analysis.controversyScore = analysis.controversyScore / (comments.length || 1);
        analysis.uniqueCommenters = analysis._commenters.size;

        // Remove temporary set and return the rest
        const { _commenters, ...result } = analysis;
        return result;
    }

    private categorizeFeatures(features: { [category: string]: Array<{ name: string; sentiment: number; confidence: number; mentions: number; context: string[]; }> }): { [category: string]: Array<{ name: string; sentiment: number; confidence: number; mentions: number; context: string[]; }> } {
        return features;
    }

    private extractPricePoints(text: string): Array<{ value: number; currency: string; confidence: number; context: string; }> {
        const pricePoints: Array<{ value: number; currency: string; confidence: number; context: string; }> = [];
        
        // Currency patterns
        const currencyPatterns = {
            'USD': ['\\$', 'usd', 'dollars?'],
            'EUR': ['€', 'eur', 'euros?'],
            'GBP': ['£', 'gbp', 'pounds?'],
            'JPY': ['¥', 'jpy', 'yen'],
            'AUD': ['aud', 'australian dollars?'],
            'CAD': ['cad', 'canadian dollars?']
        };

        // Build regex pattern for all currencies
        const currencySymbols = Object.values(currencyPatterns).flat().join('|');
        const pricePattern = new RegExp(
            `(?:${currencySymbols})\\s*\\d+(?:[,.]\\d{1,2})?|\\d+(?:[,.]\\d{1,2})?\\s*(?:${currencySymbols})`,
            'gi'
        );

        // Find all price mentions
        let match;
        while ((match = pricePattern.exec(text)) !== null) {
            const priceText = match[0];
            
            // Extract numeric value and currency
            const numericValue = parseFloat(priceText.replace(/[^\d.]/g, ''));
            let currency = 'USD'; // Default currency
            
            // Determine currency from match
            for (const [curr, patterns] of Object.entries(currencyPatterns)) {
                if (patterns.some(pattern => new RegExp(pattern, 'i').test(priceText))) {
                    currency = curr;
                    break;
                }
            }

            // Extract context (sentence containing the price)
            const contextStart = Math.max(0, text.lastIndexOf('.', match.index) + 1);
            const contextEnd = text.indexOf('.', match.index + priceText.length);
            const context = text.slice(
                contextStart,
                contextEnd !== -1 ? contextEnd : undefined
            ).trim();

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
                context
            });
        }

        // Sort by confidence and remove duplicates
        return pricePoints
            .sort((a, b) => b.confidence - a.confidence)
            .filter((price, index, self) =>
                index === self.findIndex(p => 
                    p.value === price.value && 
                    p.currency === price.currency
                )
            );
    }

    private calculatePriceConfidence(context: string): number {
        let confidence = 0.5; // Base confidence

        // Increase confidence based on price-related keywords
        const priceKeywords = ['price', 'cost', 'paid', 'bought', 'purchased', 'retail', 'sale'];
        priceKeywords.forEach(keyword => {
            if (context.toLowerCase().includes(keyword)) {
                confidence += 0.1;
            }
        });

        // Decrease confidence for uncertain language
        const uncertaintyKeywords = ['about', 'around', 'maybe', 'approximately', 'guess'];
        uncertaintyKeywords.forEach(keyword => {
            if (context.toLowerCase().includes(keyword)) {
                confidence -= 0.1;
            }
        });

        return Math.min(Math.max(confidence, 0), 1);
    }

    private calculateSentiment(title: string, content: string): number {
        const text = `${title} ${content}`.toLowerCase();
        let score = 0;
        let wordCount = 0;

        // Process each word
        const words = text.split(/\s+/);
        for (const word of words) {
            if (this.sentimentIndicators.strong_positive.includes(word)) {
                score += 2;
                wordCount++;
            } else if (this.sentimentIndicators.positive.includes(word)) {
                score += 1;
                wordCount++;
            } else if (this.sentimentIndicators.strong_negative.includes(word)) {
                score -= 2;
                wordCount++;
            } else if (this.sentimentIndicators.negative.includes(word)) {
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

    private analyzeSentiment(text: string): number {
        let sentiment = 0;
        const lowerText = text.toLowerCase();

        // Calculate weighted sentiment
        Object.entries(this.sentimentIndicators).forEach(([strength, words]) => {
            const weight = {
                'strong_positive': 3,
                'positive': 2,
                'weak_positive': 1,
                'neutral': 0,
                'weak_negative': -1,
                'negative': -2,
                'strong_negative': -3
            }[strength] || 0;

            words.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = (text.match(regex) || []).length;
                sentiment += matches * weight;
            });
        });

        // Adjust for negations
        const negations = ['not', 'no', 'never', 'don\'t', 'doesn\'t', 'didn\'t', 'won\'t', 'wouldn\'t', 'couldn\'t', 'shouldn\'t'];
        negations.forEach(negation => {
            const regex = new RegExp(`${negation}\\s+\\w+`, 'gi');
            const matches = (text.match(regex) || []).length;
            sentiment -= matches; // Reduce sentiment for negated words
        });

        // Normalize to [-1, 1] range
        return Math.tanh(sentiment / 5);
    }

    private calculateAuthorCredibility(post: any): number {
        const scores = {
            karmaScore: Math.min((post.data?.author_karma || 0) / 10000, 1) * 0.4,
            accountAge: post.data?.author_created_utc ?
                Math.min((Date.now() / 1000 - post.data.author_created_utc) / (365 * 24 * 60 * 60), 1) * 0.3 : 0,
            verifiedEmail: (post.data?.author_verified || false) ? 0.3 : 0
        };

        return Object.values(scores).reduce((sum, score) => sum + score, 0);
    }

    private calculateContentRelevance(post: any): number {
        const scores = {
            titleRelevance: this.calculateTitleRelevance(post.data?.title || ''),
            contentLength: Math.min((post.data?.selftext?.length || 0) / 1000, 1) * 0.3,
            subredditRelevance: this.calculateSubredditRelevance(post.data?.subreddit || '')
        };

        return Object.values(scores).reduce((sum, score) => sum + score, 0) / 3;
    }

    private calculateSubredditRelevance(subreddit: string): number {
        const relevantSubreddits = new Set([
            'technology', 'software', 'programming', 'webdev',
            'techsupport', 'computers', 'gadgets', 'productivity'
        ]);

        return relevantSubreddits.has(subreddit.toLowerCase()) ? 1 : 0.5;
    }

    private calculateTitleRelevance(title: string): number {
        const keywords = [
            'need', 'looking', 'recommend', 'suggestion', 'alternative',
            'software', 'app', 'tool', 'solution', 'platform'
        ];

        const titleWords = title.toLowerCase().split(/\s+/);
        const matchCount = keywords.filter(keyword => 
            titleWords.some(word => word.includes(keyword))
        ).length;

        return Math.min(matchCount / 3, 1);
    }

    private calculateEngagementScore(post: any): number {
        const scores = {
            upvotes: Math.min((post.data?.score || 0) / 100, 1) * 0.4,
            comments: Math.min((post.data?.num_comments || 0) / 50, 1) * 0.3,
            awards: Math.min((post.data?.total_awards_received || 0) / 5, 1) * 0.2,
            ratio: (post.data?.upvote_ratio || 0.5) * 0.1
        };

        return Object.values(scores).reduce((sum, score) => sum + score, 0);
    }

    private calculateTextQuality(title: string, content: string): number {
        const scores = {
            length: Math.min((title.length + content.length) / 1000, 1) * 0.3,
            formatting: this.calculateFormattingScore(content) * 0.2,
            coherence: this.calculateCoherence(title, content) * 0.3,
            readability: this.calculateReadabilityScore(content) * 0.2
        };

        return Object.values(scores).reduce((sum, score) => sum + score, 0);
    }

    private calculateReadabilityScore(text: string): number {
        // Simple readability score based on average word and sentence length
        const sentences = text.split(/[.!?]+/).filter(Boolean);
        const words = text.split(/\s+/).filter(Boolean);
        
        if (sentences.length === 0 || words.length === 0) {
            return 0;
        }

        const avgWordsPerSentence = words.length / sentences.length;
        const avgWordLength = words.join('').length / words.length;

        // Ideal: 15-20 words per sentence, 4-5 characters per word
        const sentenceScore = Math.max(0, 1 - Math.abs(avgWordsPerSentence - 17.5) / 17.5);
        const wordScore = Math.max(0, 1 - Math.abs(avgWordLength - 4.5) / 4.5);

        return (sentenceScore + wordScore) / 2;
    }

    private calculateFormattingScore(text: string): number {
        const scores = {
            paragraphs: Math.min(text.split(/\n\s*\n/).length / 3, 1) * 0.3,
            punctuation: (text.match(/[.!?]/g)?.length || 0) / (text.length / 50) * 0.3,
            formatting: (text.match(/[*_~`]|\b[A-Z]{2,}\b/g)?.length || 0) / (text.length / 100) * 0.2,
            links: (text.match(/\[([^\]]+)\]\(([^)]+)\)/g)?.length || 0) / 3 * 0.2
        };

        return Object.values(scores).reduce((sum, score) => Math.min(sum + score, 1), 0);
    }

    public async scrapeReddit(subreddit: string, query: string): Promise<ScrapedDemandSignal[]> {
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
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data?.data?.children) {
                this.logger.warn(`No data found for query`, { requestId, query });
                return [];
            }

            const signals: ScrapedDemandSignal[] = [];
            for (const post of data.data.children) {
                try {
                    this.metrics.signalsProcessed++;
                    const signal = this.extractRedditSignalFromJson(post.data);
                    if (signal && this.validateSignal(signal)) {
                        this.metrics.signalsValid++;
                        signals.push(signal);
                    } else {
                        this.metrics.signalsInvalid++;
                        this.logger.warn(`Invalid signal detected`, { 
                            requestId,
                            postId: post.data.id,
                            title: post.data.title
                        });
                    }
                } catch (error) {
                    this.logger.error(`Error processing post`, { 
                        requestId,
                        postId: post.data.id,
                        error 
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
                invalidSignals: this.metrics.signalsInvalid
            });
            
            return signals;
        } catch (error) {
            this.metrics.requestsError++;
            this.logger.error(`Error scraping Reddit`, { requestId, error });
            return [];
        }
    }
}
