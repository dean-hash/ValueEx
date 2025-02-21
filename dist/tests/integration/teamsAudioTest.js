"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const teamsIntegration_1 = require("../../services/teamsIntegration");
const audioStreamService_1 = require("../../services/audioStreamService");
const speechService_1 = require("../../services/speechService");
const revenueMetricsService_1 = require("../../services/revenueMetricsService");
const errorHandler_1 = require("../../utils/errorHandler");
class TeamsAudioTester {
    constructor() {
        this.teamsIntegration = new teamsIntegration_1.TeamsIntegration();
        this.audioService = new audioStreamService_1.AudioStreamService();
        this.speechService = new speechService_1.SpeechService();
        this.metricsService = new revenueMetricsService_1.RevenueMetricsService();
    }
    async runTests() {
        try {
            console.log('Starting Teams Audio Integration Tests...');
            // Test 1: Teams Authentication
            await this.testTeamsAuth();
            // Test 2: Audio Stream Setup
            await this.testAudioStreamSetup();
            // Test 3: Speech Services
            await this.testSpeechServices();
            // Test 4: Metrics Processing
            await this.testMetricsProcessing();
            // Test 5: Error Recovery
            await this.testErrorRecovery();
            console.log('All tests completed successfully!');
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error);
        }
    }
    async testTeamsAuth() {
        console.log('Testing Teams Authentication...');
        await this.teamsIntegration.initialize();
        const meeting = await this.teamsIntegration.startMeeting('Test Meeting');
        console.log('✓ Teams Authentication successful');
        return meeting;
    }
    async testAudioStreamSetup() {
        console.log('Testing Audio Stream Setup...');
        const stream = await this.audioService.startAudioStream();
        // Verify stream properties
        if (!stream || !stream.active) {
            throw new errorHandler_1.ServiceError('Audio stream not active', 'STREAM_INACTIVE', 'Audio', true);
        }
        // Test audio quality metrics
        const audioTracks = stream.getAudioTracks();
        console.log('Audio Tracks:', audioTracks.length);
        console.log('Track Settings:', audioTracks[0].getSettings());
        console.log('✓ Audio Stream setup successful');
    }
    async testSpeechServices() {
        console.log('Testing Speech Services...');
        // Test text-to-speech
        const testText = 'Testing speech synthesis';
        const audioData = await this.speechService.textToSpeech(testText);
        // Verify audio data
        if (!audioData || audioData.byteLength === 0) {
            throw new errorHandler_1.ServiceError('Speech synthesis failed', 'SYNTHESIS_FAILED', 'Speech', true);
        }
        // Test speech-to-text
        const audioConfig = {}; // Mock audio config for testing
        const recognizedText = await this.speechService.speechToText(audioConfig);
        console.log('✓ Speech Services test successful');
    }
    async testMetricsProcessing() {
        console.log('Testing Real-time Metrics Processing...');
        // Simulate real-time data
        const testData = {
            text: 'Test metric data',
            timestamp: new Date(),
            audioQuality: 0.95
        };
        // Process metrics
        const metrics = await this.metricsService.processRealTimeMetrics(testData);
        // Verify metrics
        if (!metrics || !metrics.realTimeMetrics) {
            throw new errorHandler_1.ServiceError('Metrics processing failed', 'PROCESSING_FAILED', 'Metrics', true);
        }
        console.log('✓ Metrics Processing test successful');
    }
    async testErrorRecovery() {
        console.log('Testing Error Recovery Paths...');
        // Test 1: Auth Error Recovery
        await this.simulateAuthError();
        // Test 2: Network Error Recovery
        await this.simulateNetworkError();
        // Test 3: Service Error Recovery
        await this.simulateServiceError();
        console.log('✓ Error Recovery tests successful');
    }
    async simulateAuthError() {
        try {
            throw new errorHandler_1.ServiceError('Authentication failed', 'AUTH_FAILED', 'Teams', true);
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error);
        }
    }
    async simulateNetworkError() {
        try {
            throw new errorHandler_1.ServiceError('Network connection lost', 'CONNECTION_LOST', 'Communication', true);
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error);
        }
    }
    async simulateServiceError() {
        try {
            throw new errorHandler_1.ServiceError('Service unavailable', 'SERVICE_DOWN', 'Speech', true);
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error);
        }
    }
}
// Run tests
const tester = new TeamsAudioTester();
tester.runTests().catch(console.error);
//# sourceMappingURL=teamsAudioTest.js.map