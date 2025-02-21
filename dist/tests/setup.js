"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const contextService_1 = require("../services/contextService");
// Load environment variables
(0, dotenv_1.config)();
// Increase timeout for all tests
jest.setTimeout(30000);
let contextService;
// Global setup
beforeAll(async () => {
    contextService = contextService_1.ContextService.getInstance();
    await contextService.updateProjectContext('Running Tests', ['Initializing test environment'], ['Maintain test isolation', 'Clean up after each test']);
});
// Before each test
beforeEach(async () => {
    const monitor = contextService.getMonitor();
    monitor.updateMetric('contextContinuity', 1.0); // Reset context continuity
});
// After each test
afterEach(async () => {
    // Verify context is maintained
    const monitor = contextService.getMonitor();
    const metrics = monitor.getMetrics();
    if (metrics.contextContinuity < 0.8) {
        console.warn('Context continuity degraded during test:', metrics.contextContinuity);
    }
});
// Global teardown
afterAll(async () => {
    if (contextService) {
        await contextService.updateProjectContext('Tests Completed', ['Cleaning up test environment'], []);
        contextService.dispose();
    }
});
//# sourceMappingURL=setup.js.map