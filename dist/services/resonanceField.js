"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResonanceFieldService = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const intelligenceEnhancer_1 = require("./intelligence/intelligenceEnhancer");
class ResonanceFieldService {
    constructor() {
        const initialState = {
            vectors: {
                supply: [],
                demand: [],
            },
            coherence: 0,
            intensity: 0,
            confidence: 0,
        };
        this.supplyField = new rxjs_1.BehaviorSubject(initialState);
        this.demandField = new rxjs_1.BehaviorSubject(initialState);
        this.intelligenceEnhancer = intelligenceEnhancer_1.IntelligenceEnhancer.getInstance();
        this.resonanceState = new rxjs_1.BehaviorSubject({
            coherence: 0,
            intensity: 0,
            confidence: 0,
        });
        (0, rxjs_1.combineLatest)([this.supplyField, this.demandField])
            .pipe((0, operators_1.map)(([supply, demand]) => this.calculateResonance(supply, demand)))
            .subscribe((resonance) => this.resonanceState.next(resonance));
    }
    static getInstance() {
        if (!ResonanceFieldService.instance) {
            ResonanceFieldService.instance = new ResonanceFieldService();
        }
        return ResonanceFieldService.instance;
    }
    async initialize() {
        // Initialize any required resources
    }
    getCurrentState() {
        return {
            patterns: [],
            metrics: {
                coherence: this.resonanceState.value.coherence,
                intensity: this.resonanceState.value.intensity,
                confidence: this.resonanceState.value.confidence,
            },
        };
    }
    observePatterns() {
        return this.resonanceState.pipe((0, operators_1.map)((metrics) => ({
            id: Date.now().toString(),
            type: 'resonance',
            metrics,
            timestamp: new Date().toISOString(),
        })));
    }
    calculateResonance(supply, demand) {
        const supplyVectors = supply.vectors.supply;
        const demandVectors = demand.vectors.demand;
        if (!supplyVectors.length || !demandVectors.length) {
            return {
                coherence: 0,
                intensity: 0,
                confidence: 0,
            };
        }
        const coherence = this.calculateCoherence(supplyVectors, demandVectors);
        const intensity = this.calculateIntensity(supplyVectors, demandVectors);
        const confidence = this.calculateConfidence(supplyVectors, demandVectors);
        return {
            coherence,
            intensity,
            confidence,
        };
    }
    calculateCoherence(supply, demand) {
        let totalCoherence = 0;
        let count = 0;
        for (const supplyVector of supply) {
            for (const demandVector of demand) {
                if (supplyVector.dimension === demandVector.dimension) {
                    const dotProduct = this.calculateDotProduct(supplyVector.direction, demandVector.direction);
                    const contextSimilarity = this.calculateContextSimilarity(supplyVector.context, demandVector.context);
                    totalCoherence += Math.abs(dotProduct) * contextSimilarity;
                    count++;
                }
            }
        }
        return count > 0 ? totalCoherence / count : 0;
    }
    calculateIntensity(supply, demand) {
        const supplyIntensity = supply.reduce((sum, vector) => sum + vector.magnitude, 0) / supply.length;
        const demandIntensity = demand.reduce((sum, vector) => sum + vector.magnitude, 0) / demand.length;
        return (supplyIntensity + demandIntensity) / 2;
    }
    calculateConfidence(supply, demand) {
        const supplyStrength = supply.reduce((sum, vector) => sum + vector.strength, 0) / supply.length;
        const demandStrength = demand.reduce((sum, vector) => sum + vector.strength, 0) / demand.length;
        return (supplyStrength + demandStrength) / 2;
    }
    calculateDotProduct(v1, v2) {
        return v1.reduce((sum, val, i) => sum + val * (v2[i] || 0), 0);
    }
    calculateContextSimilarity(context1, context2) {
        const set1 = new Set(context1.map((s) => s.toLowerCase()));
        const set2 = new Set(context2.map((s) => s.toLowerCase()));
        const intersection = new Set([...set1].filter((x) => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
    }
    addSupplyVector(vector) {
        const currentState = this.supplyField.getValue();
        const updatedVectors = [...currentState.vectors.supply, vector];
        this.supplyField.next({
            ...currentState,
            vectors: {
                ...currentState.vectors,
                supply: updatedVectors,
            },
        });
    }
    addDemandVector(vector) {
        const currentState = this.demandField.getValue();
        const updatedVectors = [...currentState.vectors.demand, vector];
        this.demandField.next({
            ...currentState,
            vectors: {
                ...currentState.vectors,
                demand: updatedVectors,
            },
        });
    }
    async addDemandSignal(signal) {
        const demandVectors = await this.intelligenceEnhancer.enhanceDemandContext(signal);
        demandVectors.forEach((vector) => this.addDemandVector(vector));
    }
    async addProduct(product) {
        const productVectors = await this.intelligenceEnhancer.enhanceProductUnderstanding(product);
        productVectors.forEach((vector) => this.addSupplyVector(vector));
    }
    getResonanceState() {
        return this.resonanceState.getValue();
    }
    async calculateProductResonance(product, signal) {
        const productVectors = await this.intelligenceEnhancer.enhanceProductUnderstanding(product);
        const demandVectors = await this.intelligenceEnhancer.enhanceDemandPattern(signal);
        // Reset the fields
        this.supplyField.next({
            vectors: { supply: [], demand: [] },
            coherence: 0,
            intensity: 0,
            confidence: 0,
        });
        this.demandField.next({
            vectors: { supply: [], demand: [] },
            coherence: 0,
            intensity: 0,
            confidence: 0,
        });
        // Add the new vectors
        productVectors.vectors.forEach((vector) => this.addSupplyVector(vector));
        demandVectors.vectors.forEach((vector) => this.addDemandVector(vector));
        const resonance = this.getResonanceState();
        return (resonance.coherence + resonance.intensity + resonance.confidence) / 3;
    }
}
exports.ResonanceFieldService = ResonanceFieldService;
//# sourceMappingURL=resonanceField.js.map