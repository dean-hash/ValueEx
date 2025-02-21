"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataConnector = void 0;
const events_1 = require("events");
const axios_1 = __importDefault(require("axios"));
const demandSignalAdapter_1 = require("../analysis/adapters/demandSignalAdapter");
class DataConnector extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.sources = new Map();
        this.connections = new Map();
        this.config = config;
        this.demandSignals = demandSignalAdapter_1.DemandSignalAdapter.getInstance();
        this.setupDefaultSources();
    }
    async makeRequest(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    }
    validateResponse(data) {
        if (!data) {
            throw new Error('Invalid response: data is null or undefined');
        }
        return data;
    }
    setupDefaultSources() {
        // Google Trends API
        this.addSource({
            id: 'google_trends',
            type: 'api',
            endpoint: 'https://trends.google.com/trends/api',
            category: 'search_trends',
            region: 'global',
            refreshInterval: 3600000, // 1 hour
        });
        // Twitter API v2
        this.addSource({
            id: 'twitter_api',
            type: 'api',
            endpoint: 'https://api.twitter.com/2',
            category: 'social_media',
            region: 'global',
            refreshInterval: 300000, // 5 minutes
        });
        // Amazon Product API
        this.addSource({
            id: 'amazon_products',
            type: 'api',
            endpoint: 'https://webservices.amazon.com/paapi5',
            category: 'marketplace',
            region: 'us',
            refreshInterval: 3600000, // 1 hour
        });
        // eBay API
        this.addSource({
            id: 'ebay_api',
            type: 'api',
            endpoint: 'https://api.ebay.com/buy/browse/v1',
            category: 'marketplace',
            region: 'global',
            refreshInterval: 3600000, // 1 hour
        });
        // Reddit API
        this.addSource({
            id: 'reddit_api',
            type: 'api',
            endpoint: 'https://oauth.reddit.com',
            category: 'social_media',
            region: 'global',
            refreshInterval: 300000, // 5 minutes
        });
    }
    addSource(source) {
        this.sources.set(source.id, source);
        this.setupConnection(source);
    }
    async setupConnection(source) {
        switch (source.type) {
            case 'api':
                await this.setupAPIConnection(source);
                break;
            case 'websocket':
                await this.setupWebSocketConnection(source);
                break;
            case 'rss':
                await this.setupRSSConnection(source);
                break;
            case 'webhook':
                await this.setupWebhookConnection(source);
                break;
        }
    }
    async setupAPIConnection(source) {
        if (source.refreshInterval) {
            setInterval(async () => {
                try {
                    const data = await this.fetchAPIData(source);
                    await this.processData(source, data);
                }
                catch (error) {
                    console.error(`Error fetching data from ${source.id}:`, error);
                }
            }, source.refreshInterval);
        }
    }
    async setupWebSocketConnection(source) {
        // WebSocket implementation would go here
        // This is a placeholder for actual WebSocket setup
    }
    async setupRSSConnection(source) {
        // RSS feed implementation would go here
        // This is a placeholder for actual RSS setup
    }
    async setupWebhookConnection(source) {
        // Webhook implementation would go here
        // This is a placeholder for actual webhook setup
    }
    async fetchAPIData(source) {
        const headers = {};
        if (source.credentials?.apiKey) {
            headers['Authorization'] = `Bearer ${source.credentials.apiKey}`;
        }
        try {
            const response = await axios_1.default.get(source.endpoint, { headers });
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching data from ${source.id}:`, error);
            throw error;
        }
    }
    async processData(source, rawData) {
        const dataPoints = await this.parseDataPoints(source, rawData);
        for (const point of dataPoints) {
            await this.demandSignals.addSignal({
                category: source.category,
                region: source.region,
                timestamp: point.timestamp,
                strength: point.value,
                type: this.mapSourceTypeToSignalType(source.type),
                context: {
                    keywords: this.extractKeywords(point.metadata),
                    relatedCategories: this.extractRelatedCategories(point.metadata),
                    sentiment: this.calculateSentiment(point.metadata),
                    urgency: this.calculateUrgency(point.metadata),
                },
            });
            this.emit('data_processed', {
                sourceId: source.id,
                timestamp: point.timestamp,
                value: point.value,
                confidence: point.confidence,
            });
        }
    }
    async parseDataPoints(source, rawData) {
        // Implementation would vary based on source
        // This is a placeholder that would need to be implemented per source
        return [];
    }
    mapSourceTypeToSignalType(sourceType) {
        switch (sourceType) {
            case 'marketplace':
            case 'search':
            case 'social':
                return 'implicit';
            case 'direct':
                return 'explicit';
            default:
                return 'inferred';
        }
    }
    extractKeywords(metadata) {
        // Implementation would extract relevant keywords from metadata
        // This is a placeholder
        return [];
    }
    extractRelatedCategories(metadata) {
        // Implementation would extract related categories from metadata
        // This is a placeholder
        return [];
    }
    calculateSentiment(metadata) {
        // Base implementation returns a neutral sentiment
        return 0.5;
    }
    calculateUrgency(metadata) {
        // Base implementation returns a neutral urgency
        return 0.5;
    }
    getSource(sourceId) {
        return this.sources.get(sourceId);
    }
    getAllSources() {
        return Array.from(this.sources.values());
    }
}
exports.DataConnector = DataConnector;
//# sourceMappingURL=dataConnector.js.map