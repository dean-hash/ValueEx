"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAwinService = exports.MockBusinessCentralService = exports.MockDynamicsService = exports.MockResonanceFieldService = exports.MockSpeechService = exports.MockAudioService = exports.MockTeamsClient = exports.MockMediaStream = void 0;
const events_1 = require("events");
// Mock Audio Stream
class MockMediaStream {
    constructor() {
        this._active = true;
        this.tracks = [new MockAudioTrack()];
        this.id = `mock-stream-${Date.now()}`;
        this.active = true;
    }
    getAudioTracks() {
        return this.tracks;
    }
    getTracks() {
        return this.tracks;
    }
    getVideoTracks() {
        return [];
    }
    getTrackById() {
        return null;
    }
    addTrack() { }
    removeTrack() { }
    clone() {
        return new MockMediaStream();
    }
    addEventListener() { }
    removeEventListener() { }
    dispatchEvent() {
        return true;
    }
}
exports.MockMediaStream = MockMediaStream;
class MockAudioTrack {
    constructor() {
        this.enabled = true;
        this.id = `mock-track-${Date.now()}`;
        this.kind = 'audio';
        this.label = 'mock-audio-track';
        this.muted = false;
        this.readyState = 'live';
    }
    getSettings() {
        return {
            channelCount: 2,
            sampleRate: 48000,
            sampleSize: 16,
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true
        };
    }
    applyConstraints() {
        return Promise.resolve();
    }
    clone() {
        return new MockAudioTrack();
    }
    getCapabilities() {
        return {};
    }
    getConstraints() {
        return {};
    }
    stop() {
        this.readyState = 'ended';
    }
    addEventListener() { }
    removeEventListener() { }
    dispatchEvent() {
        return true;
    }
}
// Mock Teams Client
class MockTeamsClient extends events_1.EventEmitter {
    async initialize() { }
    async createMeeting(subject) {
        return {
            joinUrl: `https://teams.microsoft.com/l/meetup-join/test-${Date.now()}`,
            threadId: `thread-${Date.now()}`,
            subject
        };
    }
    async startMeeting(subject) {
        return this.createMeeting(subject);
    }
    async joinMeeting(url) {
        this.emit('meetingJoined', { url });
        return {
            user: { id: 'test-user' },
            recognizer: {}
        };
    }
}
exports.MockTeamsClient = MockTeamsClient;
// Mock Audio Service
class MockAudioService {
    async startAudioStream() {
        return new MockMediaStream();
    }
    async stopAudioStream() { }
}
exports.MockAudioService = MockAudioService;
// Mock Speech Service
class MockSpeechService {
    async textToSpeech(text) {
        return new ArrayBuffer(text.length * 2);
    }
    async speechToText() {
        return 'Mock transcribed text';
    }
}
exports.MockSpeechService = MockSpeechService;
// Mock Resonance Field Service
class MockResonanceFieldService {
    async measureValueCreation(product, pattern) {
        return {
            consumerValue: 85.0,
            merchantValue: 90.0,
            valueExValue: 25.0,
            matchQuality: 0.92,
            timestamp: new Date(),
            realTimeMetrics: {
                revenue: product.price * 0.1,
                costs: product.price * 0.05,
                profitMargin: 0.5,
                customerEngagement: 0.85
            }
        };
    }
    async calculateConsumerValue(product, pattern, signals) {
        return 85.0;
    }
    async calculateMerchantValue(product, signals) {
        return 90.0;
    }
}
exports.MockResonanceFieldService = MockResonanceFieldService;
// Mock Dynamics Service
class MockDynamicsService {
    async getMarketPrice(product) {
        return product.price;
    }
    async getTraditionalCAC(category) {
        return 50.0;
    }
}
exports.MockDynamicsService = MockDynamicsService;
// Mock Business Central Service
class MockBusinessCentralService {
    async getEfficiencyMetrics() {
        return {
            processingTime: 120,
            conversionRate: 0.15,
            costPerLead: 25.0
        };
    }
}
exports.MockBusinessCentralService = MockBusinessCentralService;
// Mock Awin Service
class MockAwinService {
    async getAffiliateMetrics() {
        return {
            clicks: 1000,
            conversions: 50,
            revenue: 5000.0,
            commission: 250.0
        };
    }
}
exports.MockAwinService = MockAwinService;
//# sourceMappingURL=services.js.map