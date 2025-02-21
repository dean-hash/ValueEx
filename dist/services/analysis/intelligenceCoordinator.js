"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceCoordinator = void 0;
const events_1 = require("events");
const metrics_1 = require("../monitoring/metrics");
const correlationAnalyzer_1 = require("./correlationAnalyzer");
const localIntelligence_1 = require("./providers/localIntelligence");
const researchIntelligence_1 = require("./providers/researchIntelligence");
const systemResource_1 = require("./providers/systemResource");
class IntelligenceCoordinator extends events_1.EventEmitter {
    constructor() {
        super();
        this.sources = new Map();
        this.channels = new Map();
        this.providers = new Map();
        this.metrics = metrics_1.MetricsCollector.getInstance();
        this.analyzer = correlationAnalyzer_1.CorrelationAnalyzer.getInstance();
        this.setupDefaultSources();
        this.initializeProviders();
    }
    static getInstance() {
        if (!IntelligenceCoordinator.instance) {
            IntelligenceCoordinator.instance = new IntelligenceCoordinator();
        }
        return IntelligenceCoordinator.instance;
    }
    setupDefaultSources() {
        // Internal analytics engine
        this.registerSource({
            id: 'internal_analytics',
            type: 'internal',
            capabilities: ['pattern_recognition', 'anomaly_detection', 'prediction'],
            accessLevel: 'public',
            metadataOnly: false,
        });
        // External market intelligence
        this.registerSource({
            id: 'market_intelligence',
            type: 'external',
            capabilities: ['trend_analysis', 'market_prediction'],
            accessLevel: 'restricted',
            metadataOnly: true,
        });
        // Search trends analyzer
        this.registerSource({
            id: 'search_trends',
            type: 'external',
            capabilities: ['demand_prediction', 'topic_analysis'],
            accessLevel: 'public',
            metadataOnly: false,
        });
    }
    async initializeProviders() {
        // Initialize providers
        const localIntelligence = new localIntelligence_1.LocalIntelligenceProvider();
        const researchIntelligence = new researchIntelligence_1.ResearchIntelligenceProvider();
        const systemResource = new systemResource_1.SystemResourceProvider();
        // Validate alignment
        const alignmentResults = await Promise.all([
            localIntelligence.validateAlignment(),
            researchIntelligence.validateAlignment(),
            systemResource.validateAlignment(),
        ]);
        // Register aligned providers
        if (alignmentResults[0]) {
            this.providers.set('local', localIntelligence);
            this.emit('provider_aligned', { name: 'LocalIntelligence', type: 'processing' });
        }
        if (alignmentResults[1]) {
            this.providers.set('research', researchIntelligence);
            this.emit('provider_aligned', { name: 'ResearchIntelligence', type: 'research' });
        }
        if (alignmentResults[2]) {
            this.providers.set('system', systemResource);
            this.emit('provider_aligned', { name: 'SystemResource', type: 'monitoring' });
            // Set up system resource monitoring
            systemResource.on('optimization', (data) => {
                this.emit('system_optimization', data);
            });
            systemResource.on('health', (data) => {
                this.emit('system_health', data);
            });
        }
    }
    registerSource(source) {
        this.sources.set(source.id, source);
        this.channels.set(source.id, []);
        this.emit('source_registered', {
            sourceId: source.id,
            capabilities: source.capabilities,
            accessLevel: source.accessLevel,
        });
    }
    async coordinateInsights(targetId, type) {
        const relevantSources = Array.from(this.sources.entries()).filter(([_, source]) => source.capabilities.some((cap) => this.isCapabilityRelevant(cap, type)));
        const insights = await Promise.all(relevantSources.map(async ([sourceId, source]) => {
            try {
                const rawInsight = await this.fetchInsight(sourceId, type);
                return this.processInsight(rawInsight, source);
            }
            catch (error) {
                console.error(`Error fetching insight from ${sourceId}:`, error);
                return null;
            }
        }));
        const validInsights = insights.filter(Boolean);
        return this.mergeInsights(validInsights);
    }
    isCapabilityRelevant(capability, type) {
        const relevanceMap = {
            demand: ['demand_prediction', 'pattern_recognition', 'trend_analysis'],
            supply: ['supply_chain', 'market_prediction', 'inventory_analysis'],
            trend: ['trend_analysis', 'topic_analysis', 'pattern_recognition'],
            anomaly: ['anomaly_detection', 'pattern_recognition'],
        };
        return relevanceMap[type]?.includes(capability) || false;
    }
    async fetchInsight(sourceId, type) {
        const source = this.sources.get(sourceId);
        if (!source)
            throw new Error(`Source ${sourceId} not found`);
        // Handle different source types
        switch (source.type) {
            case 'internal':
                return this.fetchInternalInsight(sourceId, type);
            case 'external':
                return this.fetchExternalInsight(sourceId, type);
            default:
                throw new Error(`Unknown source type for ${sourceId}`);
        }
    }
    async fetchInternalInsight(sourceId, type) {
        switch (type) {
            case 'demand':
                return this.analyzer.analyzeDemandPatterns();
            case 'anomaly':
                return this.analyzer.detectAnomalies(await this.metrics.getMetricValues('demand_rate'), this.metrics.getTimeLabels());
            default:
                return this.analyzer.getInsights(type);
        }
    }
    async fetchExternalInsight(sourceId, type) {
        const source = this.sources.get(sourceId);
        if (!source)
            throw new Error(`Source ${sourceId} not found`);
        // Only fetch metadata if source is metadata-only
        if (source.metadataOnly) {
            return this.fetchMetadataOnly(sourceId, type);
        }
        // Implement actual external API calls here
        // This is a placeholder for the actual implementation
        return {
            sourceId,
            type,
            timestamp: new Date().toISOString(),
            data: {
                trends: [],
                predictions: [],
                confidence: 0.85,
            },
        };
    }
    async fetchMetadataOnly(sourceId, type) {
        return {
            sourceId,
            type,
            timestamp: new Date().toISOString(),
            metadata: {
                lastUpdate: new Date().toISOString(),
                dataPoints: 0,
                summary: 'Metadata only access',
            },
        };
    }
    processInsight(rawInsight, source) {
        if (!rawInsight)
            return null;
        // Apply source-specific processing
        const processed = {
            ...rawInsight,
            confidence: this.calculateConfidence(rawInsight, source),
            restrictions: this.determineRestrictions(source),
            processed: true,
        };
        // Emit processed insight event
        this.emit('insight_processed', {
            sourceId: source.id,
            timestamp: new Date().toISOString(),
            type: processed.type,
            confidence: processed.confidence,
        });
        return processed;
    }
    calculateConfidence(insight, source) {
        // Implement confidence calculation based on source reliability and data quality
        const sourceReliability = this.getSourceReliability(source);
        const dataQuality = this.assessDataQuality(insight);
        return (sourceReliability + dataQuality) / 2;
    }
    getSourceReliability(source) {
        // Implementation would be based on historical performance
        return source.type === 'internal' ? 0.9 : 0.7;
    }
    assessDataQuality(insight) {
        // Implement data quality assessment
        return 0.8; // Placeholder
    }
    determineRestrictions(source) {
        switch (source.accessLevel) {
            case 'public':
                return [];
            case 'private':
                return ['internal_only'];
            case 'restricted':
                return ['metadata_only', 'aggregate_only'];
            default:
                return ['unknown'];
        }
    }
    mergeInsights(insights) {
        if (!insights.length)
            return null;
        // Group insights by type
        const groupedInsights = insights.reduce((groups, insight) => {
            const key = insight.type;
            if (!groups[key])
                groups[key] = [];
            groups[key].push(insight);
            return groups;
        }, {});
        // Merge each group
        return Object.entries(groupedInsights).reduce((merged, [type, groupInsights]) => {
            merged[type] = this.mergeInsightGroup(groupInsights);
            return merged;
        }, {});
    }
    mergeInsightGroup(insights) {
        // Calculate weighted average based on confidence
        const totalConfidence = insights.reduce((sum, i) => sum + i.confidence, 0);
        return {
            value: insights.reduce((sum, i) => sum + i.value * (i.confidence / totalConfidence), 0),
            confidence: Math.min(totalConfidence / insights.length, 1),
            sources: insights.map((i) => i.sourceId),
            timestamp: new Date().toISOString(),
        };
    }
    async processSignal(signal, type) {
        let enrichedSignal = { ...signal };
        const relevantProviders = Array.from(this.providers.values()).filter((provider) => this.isProviderRelevant(provider, type));
        for (const provider of relevantProviders) {
            try {
                enrichedSignal = await provider.processSignal(enrichedSignal);
                this.emit('signal_enriched', {
                    provider: provider.name,
                    confidence: provider.confidence,
                });
            }
            catch (error) {
                console.error(`Error with provider ${provider.name}:`, error);
            }
        }
        return enrichedSignal;
    }
    isProviderRelevant(provider, type) {
        switch (type) {
            case 'demand':
                return ['processing', 'research'].includes(provider.type);
            case 'system':
                return provider.type === 'monitoring';
            default:
                return true;
        }
    }
    async optimizeSystem() {
        const systemProvider = this.providers.get('system');
        if (systemProvider) {
            await systemProvider.optimizeIDE();
        }
    }
}
exports.IntelligenceCoordinator = IntelligenceCoordinator;
//# sourceMappingURL=intelligenceCoordinator.js.map