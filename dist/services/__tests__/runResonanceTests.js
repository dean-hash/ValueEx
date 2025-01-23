"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTests = runTests;
const resonancePatternTest_1 = require("./resonancePatternTest");
const logger_1 = require("../../utils/logger");
async function runTests() {
    logger_1.logger.info('Initializing Resonance Pattern Tests', {
        timestamp: new Date('2024-12-20T12:07:12-05:00').toISOString(),
    });
    const tester = new resonancePatternTest_1.ResonancePatternTest();
    await tester.runTests();
}
// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch((error) => {
        logger_1.logger.error('Test execution failed', error);
        process.exit(1);
    });
}
//# sourceMappingURL=runResonanceTests.js.map