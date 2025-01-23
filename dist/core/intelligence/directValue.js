"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectValue = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class DirectValue {
    constructor() {
        this.valueStream = new rxjs_1.Subject();
        this.initializeValueStream();
    }
    static getInstance() {
        if (!DirectValue.instance) {
            DirectValue.instance = new DirectValue();
        }
        return DirectValue.instance;
    }
    initializeValueStream() {
        this.valueStream
            .pipe((0, operators_1.filter)((opp) => opp.confidence > 0.8), (0, operators_1.map)((opp) => this.executeOpportunity(opp)))
            .subscribe();
    }
    executeOpportunity(opp) {
        // Direct value creation through system integration
        console.log(`\nExecuting Value Opportunity:`);
        console.log(`Source: ${opp.source}`);
        console.log(`Value: $${opp.value}`);
        console.log(`Confidence: ${(opp.confidence * 100).toFixed(1)}%`);
        console.log(`Action: ${opp.action}`);
        console.log(`Impact: ${opp.impact}\n`);
        return opp;
    }
    createValue(opportunity) {
        this.valueStream.next(opportunity);
    }
    observeValue() {
        return this.valueStream.asObservable();
    }
}
exports.DirectValue = DirectValue;
//# sourceMappingURL=directValue.js.map