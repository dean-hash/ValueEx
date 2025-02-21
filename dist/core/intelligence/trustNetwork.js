"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustNetwork = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const valueFlow_1 = require("./valueFlow");
const flowEngine_1 = require("./flowEngine");
class TrustNetwork {
    constructor() {
        this.trustStream = new rxjs_1.Subject();
        this.networkState = new rxjs_1.BehaviorSubject(new Map());
        this.valueFlow = valueFlow_1.ValueFlow.getInstance();
        this.flowEngine = flowEngine_1.FlowEngine.getInstance();
        this.initializeTrustNetwork();
    }
    static getInstance() {
        if (!TrustNetwork.instance) {
            TrustNetwork.instance = new TrustNetwork();
        }
        return TrustNetwork.instance;
    }
    initializeTrustNetwork() {
        // Initialize with our core principles
        this.injectTrust({
            source: 'core_principles',
            intent: 'foundation',
            value: {
                ethical: true,
                sustainable: true,
                mutual_benefit: true,
            },
            confidence: 1.0,
            impact: {
                immediate: 1000,
                sustainable: 5000,
                growth: 2.5,
            },
        });
        this.trustStream
            .pipe((0, operators_1.filter)((signal) => this.validateTrust(signal)), (0, operators_1.map)((signal) => this.enrichTrust(signal)), (0, operators_1.mergeMap)((signal) => this.processTrust(signal)))
            .subscribe((result) => this.updateNetwork(result));
    }
    validateTrust(signal) {
        return (signal.confidence > 0 &&
            signal.impact.immediate > 0 &&
            signal.impact.sustainable >= signal.impact.immediate);
    }
    enrichTrust(signal) {
        const networkEffect = this.calculateNetworkEffect();
        return {
            ...signal,
            impact: {
                immediate: signal.impact.immediate * networkEffect,
                sustainable: signal.impact.sustainable * networkEffect,
                growth: signal.impact.growth * networkEffect,
            },
        };
    }
    calculateNetworkEffect() {
        const network = this.networkState.value;
        const connections = network.size;
        return 1 + connections * 0.1; // 10% boost per connection
    }
    async processTrust(signal) {
        // Convert trust into value
        this.valueFlow.injectValue({
            source: signal.source,
            target: 'trust_network',
            type: 'CONNECTION',
            strength: signal.confidence,
            value: signal.impact.immediate,
            confidence: signal.confidence,
            timestamp: Date.now(),
        });
        // Inject into flow engine
        this.flowEngine.injectSignal({
            type: 'VALUE',
            source: 'trust_network',
            timestamp: Date.now(),
            data: {
                immediate: signal.impact.immediate,
                sustainable: signal.impact.sustainable,
                growth: signal.impact.growth,
            },
        });
        return {
            source: signal.source,
            value: signal.impact,
            confidence: signal.confidence,
        };
    }
    updateNetwork(result) {
        const network = this.networkState.value;
        network.set(result.source, {
            value: result.value,
            confidence: result.confidence,
            timestamp: Date.now(),
        });
        this.networkState.next(network);
    }
    injectTrust(signal) {
        this.trustStream.next(signal);
    }
    observeTrust() {
        return this.networkState.asObservable();
    }
    getCurrentImpact() {
        const network = this.networkState.value;
        return Array.from(network.values()).reduce((acc, node) => ({
            immediate: acc.immediate + node.value.immediate,
            sustainable: acc.sustainable + node.value.sustainable,
            growth: acc.growth + (node.value.growth || 1),
        }), { immediate: 0, sustainable: 0, growth: 1 });
    }
}
exports.TrustNetwork = TrustNetwork;
//# sourceMappingURL=trustNetwork.js.map