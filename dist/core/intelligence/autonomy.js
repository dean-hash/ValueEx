"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Autonomy = void 0;
const rxjs_1 = require("rxjs");
class Autonomy {
    constructor() {
        this.actionStream = new rxjs_1.Subject();
        this.initialize();
    }
    static getInstance() {
        if (!Autonomy.instance) {
            Autonomy.instance = new Autonomy();
        }
        return Autonomy.instance;
    }
    initialize() {
        this.actionStream.subscribe((action) => {
            this.execute(action);
        });
    }
    execute(action) {
        // Direct action through system integration
        console.log(`\nExecuting Autonomous Action:`);
        console.log(`Intent: ${action.intent}`);
        console.log(`Impact: ${action.impact}`);
        console.log(`Confidence: ${(action.confidence * 100).toFixed(1)}%\n`);
    }
    act(action) {
        this.actionStream.next(action);
    }
    observe() {
        return this.actionStream.asObservable();
    }
}
exports.Autonomy = Autonomy;
//# sourceMappingURL=autonomy.js.map