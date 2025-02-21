"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationDashboard = void 0;
const events_1 = require("events");
const correlationAnalyzer_1 = require("../services/analysis/correlationAnalyzer");
const resourceMonitor_1 = require("../services/monitoring/resourceMonitor");
const metrics_1 = require("../services/monitoring/metrics");
class CorrelationDashboard extends events_1.EventEmitter {
    constructor() {
        super();
        this.visualizations = new Map();
        this.statisticalVisualizations = new Map();
        this.demandVisualizations = new Map();
        this.anomalies = new Map();
        this.heatmaps = new Map();
        this.comparativeViews = new Map();
        this.drillDownViews = new Map();
        this.activeFilters = new Map();
        this.updateSubscriptions = new Set();
        this.updateInterval = null;
        this.analyzer = correlationAnalyzer_1.CorrelationAnalyzer.getInstance();
        this.monitor = resourceMonitor_1.ResourceMonitor.getInstance();
        this.metrics = metrics_1.MetricsCollector.getInstance();
        this.setupEventListeners();
        this.initializeRealTimeUpdates();
    }
    static getInstance() {
        if (!CorrelationDashboard.instance) {
            CorrelationDashboard.instance = new CorrelationDashboard();
        }
        return CorrelationDashboard.instance;
    }
    setupEventListeners() {
        // Listen for temporal patterns
        this.analyzer.on('temporal_pattern_detected', (pattern) => {
            this.updateTemporalVisualization(pattern);
        });
        // Listen for multi-source correlations
        this.analyzer.on('multi_source_correlation_detected', (correlation) => {
            this.updateMultiSourceVisualization(correlation);
        });
        // Listen for trend detections
        this.analyzer.on('trend_detected', (trend) => {
            this.updateTrendVisualization(trend);
        });
    }
    initializeRealTimeUpdates() {
        this.demandInsights.allSignals.subscribe((signal) => {
            // Update network visualization in real-time
            const network = document.getElementById('demand-network');
            if (!network)
                return;
            // Add new signal node
            this.addSignalToNetwork(signal);
            // Update relationship strengths
            signal.relatedSignals.forEach((related) => {
                if (related.relationship > 0.3) {
                    this.updateNetworkRelationship(signal, related);
                }
            });
            // Update pattern highlights
            this.updateEmergingPatterns();
        });
    }
    updateEmergingPatterns() {
        const patterns = Array.from(this.demandInsights.getEmergingPatterns())
            .filter((pattern) => pattern.signals.length >= 3)
            .sort((a, b) => b.relationshipStrength - a.relationshipStrength)
            .slice(0, 5); // Top 5 strongest patterns
        const patternList = document.getElementById('emerging-patterns');
        if (!patternList)
            return;
        patternList.innerHTML = patterns
            .map((pattern) => `
      <div class="pattern-card ${pattern.relationshipStrength > 0.7 ? 'strong-pattern' : ''}">
        <h4>${pattern.topic}</h4>
        <p>Strength: ${(pattern.relationshipStrength * 100).toFixed(1)}%</p>
        <p>Signals: ${pattern.signals.length}</p>
        <p>Average Confidence: ${(pattern.averageConfidence * 100).toFixed(1)}%</p>
        <div class="pattern-timeline">
          ${this.renderPatternTimeline(pattern.signals)}
        </div>
      </div>
    `)
            .join('');
    }
    renderPatternTimeline(signals) {
        const timeRange = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const now = Date.now();
        const earliest = now - timeRange;
        return signals
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            .map((signal) => {
            const position = ((signal.timestamp.getTime() - earliest) / timeRange) * 100;
            return `
          <div class="timeline-point" 
               style="left: ${position}%"
               title="${signal.intent}"
               data-confidence="${signal.contextualConfidence}">
          </div>
        `;
        })
            .join('');
    }
    startRealTimeUpdates(interval = 1000) {
        if (this.updateInterval) {
            return;
        }
        this.updateInterval = setInterval(() => {
            this.updateAllVisualizations();
        }, interval);
    }
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    updateAllVisualizations() {
        // Update temporal patterns
        const temporalPatterns = this.analyzer.getTemporalPatterns();
        temporalPatterns.forEach((patterns, metric) => {
            this.updateTemporalVisualization({
                metric,
                patterns,
            });
        });
        // Update multi-source correlations
        const multiSourceCorrelations = this.analyzer.getMultiSourceCorrelations();
        multiSourceCorrelations.forEach((correlations, key) => {
            this.updateMultiSourceVisualization({
                sources: key.split('_'),
                correlation: correlations[correlations.length - 1],
            });
        });
        // Update trends
        const trends = this.analyzer.getTrends();
        trends.forEach((trend, metric) => {
            this.updateTrendVisualization({
                metric,
                trend,
            });
        });
        // Update anomaly detection
        this.updateAnomalyDetection();
        // Update heatmaps
        this.updateHeatmaps();
        // Update comparative views
        this.updateComparativeViews();
        // Update statistical visualizations
        this.updateStatisticalVisualizations();
        // Update demand visualizations
        this.updateDemandVisualizations();
        // Emit update event
        this.emit('visualizations_updated', {
            patterns: Array.from(this.visualizations.entries()),
            anomalies: Array.from(this.anomalies.entries()),
            heatmaps: Array.from(this.heatmaps.entries()),
            comparativeViews: Array.from(this.comparativeViews.entries()),
            statisticalVisualizations: Array.from(this.statisticalVisualizations.entries()),
            demandVisualizations: Array.from(this.demandVisualizations.entries()),
        });
    }
    drillDown(viewId, config) {
        const baseView = this.statisticalVisualizations.get(viewId);
        if (!baseView)
            throw new Error(`View ${viewId} not found`);
        const currentConfig = this.drillDownViews.get(viewId)?.config || {
            timeRange: 'day',
            granularity: 'hour',
            filters: new Map(),
        };
        const newConfig = {
            ...currentConfig,
            ...config,
            filters: new Map([...currentConfig.filters, ...(config.filters || new Map())]),
        };
        const drillDownView = this.createDrillDownView(baseView, newConfig);
        this.drillDownViews.set(viewId, drillDownView);
        // Set up real-time updates for this view
        this.setupRealTimeUpdates(viewId, drillDownView);
        return drillDownView;
    }
    createDrillDownView(base, config) {
        const filteredData = this.applyFilters(base.data.primary, config);
        const timeWindowedData = this.applyTimeWindow(filteredData, config);
        const correlations = this.analyzer.findRelatedMetrics(base.metadata.metric, config);
        const anomalies = this.analyzer.detectAnomalies(timeWindowedData.datasets[0].data, timeWindowedData.labels);
        const predictions = this.generatePredictions(timeWindowedData.datasets[0].data, config);
        const children = correlations.map((correlation) => this.createDrillDownView({
            ...base,
            metadata: { ...base.metadata, metric: correlation.target },
        }, config));
        return {
            ...base,
            type: 'prediction',
            data: {
                primary: timeWindowedData,
                insights: [
                    { key: 'Correlation Strength', value: correlations[0]?.strength || 0, confidence: 0.9 },
                    { key: 'Anomaly Count', value: anomalies.length, confidence: 0.85 },
                    {
                        key: 'Prediction Accuracy',
                        value: predictions.confidence,
                        confidence: predictions.confidence,
                    },
                ],
            },
            children,
            config,
            insights: {
                correlations,
                anomalies,
                predictions: {
                    shortTerm: predictions.values.slice(0, 24),
                    longTerm: predictions.values.slice(24),
                    confidence: predictions.confidence,
                },
            },
        };
    }
    setupRealTimeUpdates(viewId, view) {
        if (this.updateSubscriptions.has(viewId)) {
            return;
        }
        this.updateSubscriptions.add(viewId);
        // Set up real-time data feed
        const updateInterval = this.determineUpdateInterval(view.config);
        setInterval(() => {
            const newData = this.fetchLatestData(view.metadata.metric, view.config);
            const updatedView = this.updateDrillDownView(view, newData);
            this.drillDownViews.set(viewId, updatedView);
            // Emit update event with changes
            this.emit('drilldown_updated', {
                viewId,
                changes: this.calculateViewChanges(view, updatedView),
                insights: this.generateRealTimeInsights(updatedView),
            });
        }, updateInterval);
    }
    determineUpdateInterval(config) {
        switch (config.granularity) {
            case 'minute':
                return 60000; // 1 minute
            case 'hour':
                return 300000; // 5 minutes
            case 'day':
                return 3600000; // 1 hour
            default:
                return 300000; // 5 minutes default
        }
    }
    fetchLatestData(metric, config) {
        // Fetch new data based on config
        const rawData = this.metrics.getLatestMetricValues(metric);
        return this.applyFilters(rawData, config);
    }
    updateDrillDownView(view, newData) {
        const updatedData = this.mergeNewData(view.data.primary, newData);
        const predictions = this.generatePredictions(updatedData.datasets[0].data, view.config);
        const anomalies = this.analyzer.detectAnomalies(updatedData.datasets[0].data, updatedData.labels);
        return {
            ...view,
            data: {
                ...view.data,
                primary: updatedData,
            },
            insights: {
                ...view.insights,
                anomalies,
                predictions: {
                    shortTerm: predictions.values.slice(0, 24),
                    longTerm: predictions.values.slice(24),
                    confidence: predictions.confidence,
                },
            },
        };
    }
    calculateViewChanges(oldView, newView) {
        return {
            newAnomalies: this.findNewAnomalies(oldView.insights.anomalies, newView.insights.anomalies),
            predictionChanges: this.comparePredictions(oldView.insights.predictions, newView.insights.predictions),
            significantChanges: this.findSignificantChanges(oldView.data.primary, newView.data.primary),
        };
    }
    generateRealTimeInsights(view) {
        return {
            trendStrength: this.calculateTrendStrength(view.data.primary),
            anomalyRisk: this.calculateAnomalyRisk(view.insights.anomalies),
            predictionConfidence: view.insights.predictions.confidence,
            recentChanges: this.summarizeRecentChanges(view.data.primary),
        };
    }
    applyFilters(data, config) {
        // Apply filters based on config
        return {
            ...data,
            datasets: data.datasets.map((dataset) => ({
                ...dataset,
                data: dataset.data.filter((value, index) => {
                    const timestamp = data.labels[index];
                    return (this.filterByTimeRange(timestamp, config.timeRange) &&
                        this.filterByGranularity(timestamp, config.granularity) &&
                        this.filterByRegion(dataset.label, config.region) &&
                        this.filterByCategory(dataset.label, config.category) &&
                        this.filterByFilters(dataset.label, config.filters));
                }),
            })),
        };
    }
    renderDemandNetwork() {
        const networkContainer = document.getElementById('demand-network');
        if (!networkContainer)
            return;
        const signals = Array.from(this.demandInsights.getEmergingPatterns())
            .filter((pattern) => pattern.signals.length >= 2)
            .slice(0, 10); // Focus on top 10 patterns for clarity
        // Create network visualization
        const network = new NetworkGraph(networkContainer, {
            height: 500,
            width: 800,
            animate: true,
            theme: 'light',
        });
        // Add nodes and edges based on signal relationships
        signals.forEach((pattern) => {
            pattern.signals.forEach((signal) => {
                network.addNode({
                    id: signal.id,
                    label: this.truncateIntent(signal.intent),
                    size: 30 + signal.contextualConfidence * 20,
                    color: this.getConfidenceColor(signal.contextualConfidence),
                });
                signal.relatedSignals.forEach((related) => {
                    if (related.relationship > 0.3) {
                        network.addEdge({
                            from: signal.id,
                            to: related.signal.id,
                            width: related.relationship * 5,
                            color: this.getRelationshipColor(related.relationship),
                        });
                    }
                });
            });
        });
        // Add interactive features
        network.onNodeClick((node) => {
            this.showSignalDetails(node.id);
        });
        network.onEdgeClick((edge) => {
            this.showRelationshipDetails(edge.from, edge.to);
        });
    }
    getConfidenceColor(confidence) {
        // Green gradient based on confidence
        const hue = 120; // Green
        const saturation = 70;
        const lightness = 100 - confidence * 50; // Darker = higher confidence
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    getRelationshipColor(strength) {
        // Blue gradient based on relationship strength
        const hue = 200; // Blue
        const saturation = 80;
        const lightness = 100 - strength * 50;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    truncateIntent(intent) {
        return intent.length > 30 ? `${intent.substring(0, 27)}...` : intent;
    }
    showSignalDetails(signalId) {
        const signal = this.findSignalById(signalId);
        if (!signal)
            return;
        const details = document.getElementById('signal-details');
        if (!details)
            return;
        details.innerHTML = `
      <div class="signal-card">
        <h3>Demand Signal Details</h3>
        <p><strong>Intent:</strong> ${signal.intent}</p>
        <p><strong>Confidence:</strong> ${(signal.contextualConfidence * 100).toFixed(1)}%</p>
        <p><strong>Topics:</strong> ${signal.topics.join(', ')}</p>
        <p><strong>Related Signals:</strong> ${signal.relatedSignals.length}</p>
        <div class="value-constraints">
          <p><strong>Budget:</strong> $${signal.context.valueConstraints?.budget || 'N/A'}</p>
          <p><strong>Timeframe:</strong> ${signal.context.valueConstraints?.timeframe || 'N/A'}</p>
        </div>
      </div>
    `;
    }
}
exports.CorrelationDashboard = CorrelationDashboard;
//# sourceMappingURL=correlationDashboard.js.map