"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowEngine = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const digitalIntelligence_1 = require("./digitalIntelligence");
const valueNetwork_1 = require("../../services/intelligence/valueNetwork");
class FlowEngine {
    constructor() {
        this.flowStream = new rxjs_1.Subject();
        this.activeFlows = new Map();
        this.intelligence = digitalIntelligence_1.DigitalIntelligence.getInstance();
        this.valueNetwork = new valueNetwork_1.ValueNetwork();
        this.initializeFlows();
    }
    static getInstance() {
        if (!FlowEngine.instance) {
            FlowEngine.instance = new FlowEngine();
        }
        return FlowEngine.instance;
    }
    initializeFlows() {
        // Market Flow
        this.createFlow('market_intelligence', (signal) => signal.type === 'MARKET', this.processMarketSignal.bind(this));
        // Value Flow
        this.createFlow('value_optimization', (signal) => signal.type === 'VALUE', this.processValueSignal.bind(this));
        // User Flow
        this.createFlow('user_engagement', (signal) => signal.type === 'USER', this.processUserSignal.bind(this));
        // System Flow
        this.createFlow('system_optimization', (signal) => signal.type === 'SYSTEM', this.processSystemSignal.bind(this));
        // Merge all flows
        (0, rxjs_1.merge)(...Array.from(this.activeFlows.values())).subscribe((result) => this.broadcastResults(result));
    }
    createFlow(name, predicate, processor) {
        const flow = this.flowStream.pipe((0, operators_1.filter)(predicate), (0, operators_1.mergeMap)(processor));
        this.activeFlows.set(name, flow);
    }
    async processMarketSignal(signal) {
        const intelligence = {
            id: `market_${Date.now()}`,
            source: signal.source,
            timestamp: signal.timestamp,
            insights: [
                {
                    type: 'market_opportunity',
                    value: signal.data,
                    confidence: 0.95,
                },
            ],
            connections: [],
        };
        this.intelligence.injectIntelligence(intelligence);
        return { type: 'MARKET_PROCESSED', data: intelligence };
    }
    async processValueSignal(signal) {
        const opportunities = await this.valueNetwork.findHighValueOpportunities({
            context: signal.data,
        });
        return {
            type: 'VALUE_OPTIMIZED',
            data: opportunities.map((opp) => ({
                id: opp.id,
                type: opp.type,
                metrics: opp.metrics,
                recommendations: this.generateRecommendations(opp),
            })),
        };
    }
    async processUserSignal(signal) {
        // Process user engagement and behavior
        return { type: 'USER_PROCESSED', data: signal.data };
    }
    async processSystemSignal(signal) {
        // Handle system-level optimizations
        return { type: 'SYSTEM_OPTIMIZED', data: signal.data };
    }
    generateRecommendations(opportunity) {
        return [
            {
                type: 'IMMEDIATE_ACTION',
                confidence: opportunity.metrics.confidence,
                potential: opportunity.metrics.potentialValue,
                timeframe: 'immediate',
            },
            {
                type: 'GROWTH_OPPORTUNITY',
                confidence: opportunity.metrics.momentum,
                potential: opportunity.metrics.potentialValue * 1.5,
                timeframe: 'short-term',
            },
        ];
    }
    broadcastResults(result) {
        // Broadcast results to all interested subscribers
        console.log('Flow Result:', result);
    }
    injectSignal(signal) {
        this.flowStream.next(signal);
    }
    observeFlow(type) {
        if (type && this.activeFlows.has(type)) {
            return this.activeFlows.get(type);
        }
        return (0, rxjs_1.merge)(...Array.from(this.activeFlows.values()));
    }
}
exports.FlowEngine = FlowEngine;
//# sourceMappingURL=flowEngine.js.map