"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTestEnvironment = setupTestEnvironment;
exports.cleanupTestEnvironment = cleanupTestEnvironment;
const dotenv_1 = require("dotenv");
function setupTestEnvironment() {
    // Load test environment variables
    (0, dotenv_1.config)({ path: '.env.test' });
    // Set up mock environment variables for testing
    process.env.AZURE_TENANT_ID = 'test-tenant-id';
    process.env.AZURE_CLIENT_ID = 'test-client-id';
    process.env.AZURE_CLIENT_SECRET = 'test-client-secret';
    process.env.SPEECH_KEY = 'test-speech-key';
    process.env.SPEECH_REGION = 'eastus';
    process.env.COMMUNICATION_CONNECTION_STRING = 'endpoint=https://test.communication.azure.com/;accesskey=test-key';
}
function cleanupTestEnvironment() {
    // Clean up test environment variables
    delete process.env.AZURE_TENANT_ID;
    delete process.env.AZURE_CLIENT_ID;
    delete process.env.AZURE_CLIENT_SECRET;
    delete process.env.SPEECH_KEY;
    delete process.env.SPEECH_REGION;
    delete process.env.COMMUNICATION_CONNECTION_STRING;
}
//# sourceMappingURL=testEnv.js.map