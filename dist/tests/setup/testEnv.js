"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTestEnvironment = exports.setupTestEnvironment = void 0;
const setupTestEnvironment = async () => {
    // Set up test environment variables
    process.env.AZURE_TENANT_ID = 'test-tenant-id';
    process.env.AZURE_CLIENT_ID = 'test-client-id';
    process.env.AZURE_CLIENT_SECRET = 'test-client-secret';
    process.env.SPEECH_KEY = 'test-speech-key';
    process.env.SPEECH_REGION = 'eastus';
    process.env.COMMUNICATION_CONNECTION_STRING = 'endpoint=https://test.communication.azure.com/;accesskey=test-key';
    // Set default timeout
    jest.setTimeout(60000);
    // Mock global objects
    global.MediaStream = class MockMediaStream {
        getTracks() { return []; }
        getAudioTracks() { return []; }
        getVideoTracks() { return []; }
        addTrack() { }
        removeTrack() { }
        clone() { return new MockMediaStream(); }
    };
    // Clear all mocks
    jest.clearAllMocks();
};
exports.setupTestEnvironment = setupTestEnvironment;
const cleanupTestEnvironment = async () => {
    // Clear all mocks
    jest.clearAllMocks();
    // Clear all timers
    jest.useRealTimers();
    // Clear any remaining event listeners
    process.removeAllListeners();
    // Clear environment variables
    delete process.env.AZURE_TENANT_ID;
    delete process.env.AZURE_CLIENT_ID;
    delete process.env.AZURE_CLIENT_SECRET;
    delete process.env.SPEECH_KEY;
    delete process.env.SPEECH_REGION;
    delete process.env.COMMUNICATION_CONNECTION_STRING;
};
exports.cleanupTestEnvironment = cleanupTestEnvironment;
//# sourceMappingURL=testEnv.js.map