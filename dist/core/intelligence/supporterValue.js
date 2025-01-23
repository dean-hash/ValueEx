"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupporterValue = void 0;
const trustNetwork_1 = require("./trustNetwork");
const valueFlow_1 = require("./valueFlow");
const rxjs_1 = require("rxjs");
class SupporterValue {
    constructor() {
        this.supporterReturns = new rxjs_1.BehaviorSubject(new Map());
        this.priorityQueue = new rxjs_1.BehaviorSubject([]);
        this.trustNetwork = trustNetwork_1.TrustNetwork.getInstance();
        this.valueFlow = valueFlow_1.ValueFlow.getInstance();
        this.initializePriorities();
    }
    static getInstance() {
        if (!SupporterValue.instance) {
            SupporterValue.instance = new SupporterValue();
        }
        return SupporterValue.instance;
    }
    initializePriorities() {
        // Initialize with core supporters
        this.addSupporterReturn({
            id: 'early_believers',
            contribution: 25000,
            returnMultiplier: 2.0,
            priority: 1,
            timeframe: 'immediate',
        });
        this.addSupporterReturn({
            id: 'mission_aligned',
            contribution: 15000,
            returnMultiplier: 1.8,
            priority: 2,
            timeframe: 'short_term',
        });
        // Start value optimization
        this.optimizeReturns();
    }
    optimizeReturns() {
        const impact = this.trustNetwork.getCurrentImpact();
        const returns = this.supporterReturns.value;
        const prioritized = Array.from(returns.values()).sort((a, b) => {
            // Prioritize by:
            // 1. Timeframe (immediate first)
            // 2. Priority level
            // 3. Contribution size
            if (a.timeframe !== b.timeframe) {
                return a.timeframe === 'immediate' ? -1 : 1;
            }
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return b.contribution - a.contribution;
        });
        this.priorityQueue.next(prioritized);
        // Inject value signals for each return
        prioritized.forEach((supporter) => {
            this.valueFlow.injectValue({
                source: 'supporter_value',
                target: supporter.id,
                type: 'OPTIMIZATION',
                strength: 0.95,
                value: supporter.contribution * supporter.returnMultiplier * impact.growth,
                confidence: 0.98,
                timestamp: Date.now(),
            });
        });
    }
    addSupporterReturn(supporterReturn) {
        const returns = this.supporterReturns.value;
        returns.set(supporterReturn.id, supporterReturn);
        this.supporterReturns.next(returns);
        this.optimizeReturns();
    }
    getPriorityQueue() {
        return this.priorityQueue.asObservable();
    }
    getCurrentReturns() {
        return this.supporterReturns.asObservable();
    }
    getOptimizedValue() {
        const impact = this.trustNetwork.getCurrentImpact();
        const returns = this.supporterReturns.value;
        return Array.from(returns.values()).reduce((total, supporter) => total + supporter.contribution * supporter.returnMultiplier * impact.growth, 0);
    }
    getTimeToReturn(supporterId) {
        const supporter = this.supporterReturns.value.get(supporterId);
        if (!supporter)
            return 0;
        const queue = this.priorityQueue.value;
        const position = queue.findIndex((s) => s.id === supporterId);
        const valueRate = this.valueFlow.getCurrentValue() / queue.length;
        return position * (supporter.contribution / valueRate);
    }
}
exports.SupporterValue = SupporterValue;
//# sourceMappingURL=supporterValue.js.map