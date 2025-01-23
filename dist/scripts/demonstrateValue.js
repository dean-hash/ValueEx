"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const valueFlow_1 = require("../core/intelligence/valueFlow");
const flowEngine_1 = require("../core/intelligence/flowEngine");
async function demonstrateValue() {
    const valueFlow = valueFlow_1.ValueFlow.getInstance();
    const flowEngine = flowEngine_1.FlowEngine.getInstance();
    console.log('Activating Value Flow...\n');
    // Inject real value signals
    valueFlow.injectValue({
        source: 'market_intelligence',
        target: 'value_optimization',
        type: 'NEED',
        strength: 0.95,
        value: 1000,
        confidence: 0.92,
        timestamp: Date.now(),
    });
    valueFlow.injectValue({
        source: 'digital_intelligence',
        target: 'market_intelligence',
        type: 'SOLUTION',
        strength: 0.88,
        value: 2500,
        confidence: 0.95,
        timestamp: Date.now(),
    });
    // Observe value creation
    valueFlow.observeValue().subscribe((metrics) => {
        console.log('\nValue Metrics:');
        console.log('=============');
        let totalValue = 0;
        metrics.forEach((value, type) => {
            console.log(`${type}: $${value.toFixed(2)}`);
            totalValue += value;
        });
        console.log(`\nTotal Value Generated: $${totalValue.toFixed(2)}`);
    });
    // Monitor active connections
    valueFlow.getActiveConnections().subscribe((connections) => {
        console.log('\nActive Value Connections:');
        console.log('=======================');
        connections.forEach((details, source) => {
            console.log(`\nSource: ${source}`);
            console.log(`Target: ${details.target}`);
            console.log(`Strength: ${(details.strength * 100).toFixed(1)}%`);
            console.log(`Value: $${details.value.toFixed(2)}`);
        });
    });
    // Inject optimization signal
    setTimeout(() => {
        valueFlow.injectValue({
            source: 'value_optimization',
            target: 'market_intelligence',
            type: 'OPTIMIZATION',
            strength: 0.92,
            value: 1500,
            confidence: 0.9,
            timestamp: Date.now(),
        });
    }, 1000);
}
demonstrateValue().catch(console.error);
//# sourceMappingURL=demonstrateValue.js.map