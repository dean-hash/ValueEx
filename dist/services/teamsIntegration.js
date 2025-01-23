"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsIntegration = void 0;
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const getGraphToken_1 = require("../../scripts/getGraphToken");
const communicationService_1 = require("./communicationService");
const speechService_1 = require("./speechService");
const revenueMetricsService_1 = require("./revenueMetricsService");
class TeamsIntegration {
    constructor() {
        this.communicationService = new communicationService_1.CommunicationService();
        this.speechService = new speechService_1.SpeechService();
        this.metricsService = new revenueMetricsService_1.RevenueMetricsService();
    }
    async initialize() {
        const config = await (0, getGraphToken_1.getGraphToken)();
        const authProvider = {
            getAccessToken: async () => config.token
        };
        this.graphClient = microsoft_graph_client_1.Client.initWithMiddleware({
            authProvider
        });
    }
    async startMeeting(subject) {
        const meeting = await this.graphClient.api('/me/onlineMeetings')
            .post({
            startDateTime: new Date().toISOString(),
            subject,
            lobbyBypassSettings: {
                scope: 'everyone'
            }
        });
        return {
            joinUrl: meeting.joinUrl,
            threadId: meeting.chatInfo.threadId
        };
    }
    async joinMeeting(meetingUrl) {
        const { user, token } = await this.communicationService.createUserAndToken();
        const credential = await this.communicationService.getTokenCredential(token);
        // Set up real-time speech processing
        const onSpeechRecognized = async (text) => {
            // Process speech through revenue metrics
            const metrics = await this.metricsService.processRealTimeMetrics(text);
            // Generate and speak response based on metrics
            const response = await this.generateResponse(metrics);
            const audioData = await this.speechService.textToSpeech(response);
            // Send audio to meeting
            await this.sendAudioToMeeting(audioData);
        };
        // Start speech recognition
        const audioConfig = {}; // Configure based on meeting audio stream
        const recognizer = await this.speechService.startContinuousRecognition(audioConfig, onSpeechRecognized);
        return {
            user,
            recognizer
        };
    }
    async generateResponse(metrics) {
        // Implement response generation logic based on metrics
        return `Processing metrics: Revenue impact ${metrics.revenue}`;
    }
    async sendAudioToMeeting(audioData) {
        // Implement audio sending logic
        // This will use the Teams real-time media API
    }
    async leaveMeeting(user, recognizer) {
        await this.speechService.stopContinuousRecognition(recognizer);
        await this.communicationService.revokeTokens(user);
        await this.communicationService.deleteUser(user);
    }
}
exports.TeamsIntegration = TeamsIntegration;
//# sourceMappingURL=teamsIntegration.js.map