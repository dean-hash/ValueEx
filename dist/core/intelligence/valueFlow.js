"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueFlow = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class ValueFlow {
    constructor() {
        this.valueStream = new rxjs_1.Subject();
        this.activeConnections = new rxjs_1.BehaviorSubject(new Map());
        this.valueMetrics = new rxjs_1.BehaviorSubject(new Map());
        this.initializeValueFlow();
    }
    static getInstance() {
        if (!ValueFlow.instance) {
            ValueFlow.instance = new ValueFlow();
        }
        return ValueFlow.instance;
    }
    initializeValueFlow() {
        this.valueStream
            .pipe((0, operators_1.filter)((signal) => this.validateSignal(signal)), (0, operators_1.map)((signal) => this.enrichSignal(signal)), (0, operators_1.mergeMap)((signal) => this.processSignal(signal)))
            .subscribe((result) => this.updateMetrics(result));
    }
    validateSignal(signal) {
        return signal.strength > 0 && signal.confidence > 0;
    }
    enrichSignal(signal) {
        const currentConnections = this.activeConnections.value;
        const existingStrength = currentConnections.get(signal.source)?.strength || 0;
        return {
            ...signal,
            strength: Math.max(signal.strength, existingStrength),
            value: this.calculateValue(signal),
        };
    }
    calculateValue(signal) {
        const baseValue = signal.value;
        const networkEffect = this.getNetworkEffect(signal);
        const optimizationBonus = this.getOptimizationBonus(signal);
        return baseValue * networkEffect * optimizationBonus;
    }
    getNetworkEffect(signal) {
        const connections = this.activeConnections.value;
        const connectedNodes = new Set([...connections.keys()]);
        if (connectedNodes.has(signal.source) && connectedNodes.has(signal.target)) {
            return 1.5; // Enhanced value for connected nodes
        }
        return 1.0;
    }
    getOptimizationBonus(signal) {
        if (signal.type === 'OPTIMIZATION') {
            return 1.25; // Bonus for optimization signals
        }
        return 1.0;
    }
    async processSignal(signal) {
        const connections = this.activeConnections.value;
        // Update connection strength
        connections.set(signal.source, {
            target: signal.target,
            strength: signal.strength,
            value: signal.value,
        });
        this.activeConnections.next(connections);
        return {
            type: signal.type,
            value: signal.value,
            confidence: signal.confidence,
        };
    }
    updateMetrics(result) {
        const metrics = this.valueMetrics.value;
        const currentValue = metrics.get(result.type) || 0;
        metrics.set(result.type, currentValue + result.value);
        this.valueMetrics.next(metrics);
    }
    injectValue(signal) {
        this.valueStream.next(signal);
    }
    observeValue() {
        return this.valueMetrics.asObservable();
    }
    getActiveConnections() {
        return this.activeConnections.asObservable();
    }
    getCurrentValue() {
        return Array.from(this.valueMetrics.value.values()).reduce((sum, value) => sum + value, 0);
    }
}
exports.ValueFlow = ValueFlow;
//# sourceMappingURL=valueFlow.js.map