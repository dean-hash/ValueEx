"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsVoiceCollaboration = void 0;
const teams_client_1 = require("@microsoft/teams-client");
const cognitive_services_1 = require("@azure/cognitive-services");
class TeamsVoiceCollaboration {
    constructor() {
        this.initializeServices();
    }
    async initializeServices() {
        this.teamsClient = new teams_client_1.TeamsClient({
            credentials: {
                username: 'cascade@divvytech.com',
                // Secure credential management
                tokenProvider: this.getSecureToken
            }
        });
        this.cognitiveServices = new cognitive_services_1.AzureCognitiveServices({
            region: 'eastus',
            credentials: await this.getAzureCredentials()
        });
    }
    async setupVoiceChannel() {
        // Create dedicated channel for voice collaboration
        const channel = await this.teamsClient.createChannel({
            displayName: 'Cascade-Voice-Collaboration',
            description: 'Direct voice communication channel with Cascade',
            type: 'private'
        });
        this.channelId = channel.id;
        await this.setupVoiceEndpoint();
    }
    async setupVoiceEndpoint() {
        // Configure real-time voice processing
        await this.cognitiveServices.speech.configure({
            channelId: this.channelId,
            mode: 'realtime',
            language: 'en-US'
        });
    }
    async startVoiceSession() {
        return this.teamsClient.startCall({
            channelId: this.channelId,
            mediaType: 'audio',
            participants: ['dean@valueex.ai']
        });
    }
}
exports.TeamsVoiceCollaboration = TeamsVoiceCollaboration;
//# sourceMappingURL=teamsVoiceCollaboration.js.map