"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAwinService = exports.MockBusinessCentralService = exports.MockDynamicsService = exports.MockResonanceService = exports.MockSpeechService = exports.MockAudioService = exports.MockTeamsService = void 0;
const events_1 = require("events");
class MockTeamsService {
    constructor() {
        this.emitter = new events_1.EventEmitter();
    }
    async initialize() { }
    async createMeeting(subject) {
        return {
            joinUrl: `https://teams.mock.com/meeting/${Date.now()}`,
            threadId: `thread-${Date.now()}`,
            subject
        };
    }
    async startMeeting(subject) {
        return this.createMeeting(subject);
    }
    async joinMeeting(url) {
        this.emitter.emit('meetingJoined', { url });
        return {
            user: { id: 'mock-user' },
            recognizer: {}
        };
    }
}
exports.MockTeamsService = MockTeamsService;
class MockAudioService {
    async startAudioStream() {
        return new global.MediaStream();
    }
    async stopAudioStream() { }
}
exports.MockAudioService = MockAudioService;
class MockSpeechService {
    async textToSpeech(text) {
        return new ArrayBuffer(text.length * 2);
    }
    async speechToText() {
        return 'Mock transcribed text';
    }
}
exports.MockSpeechService = MockSpeechService;
class MockResonanceService {
    async measureValueCreation() {
        return {
            consumerValue: 85.0,
            merchantValue: 90.0,
            valueExValue: 25.0,
            matchQuality: 0.92,
            timestamp: new Date(),
            realTimeMetrics: {
                revenue: 100,
                costs: 50,
                profitMargin: 0.5,
                customerEngagement: 0.85
            }
        };
    }
    async calculateConsumerValue() {
        return 85.0;
    }
    async calculateMerchantValue() {
        return 90.0;
    }
}
exports.MockResonanceService = MockResonanceService;
class MockDynamicsService {
    async getMarketPrice() {
        return 100.0;
    }
    async getTraditionalCAC() {
        return 50.0;
    }
}
exports.MockDynamicsService = MockDynamicsService;
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
//# sourceMappingURL=mockServices.js.map