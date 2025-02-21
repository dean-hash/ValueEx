"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioStreamService = void 0;
const communication_calling_1 = require("@azure/communication-calling");
const events_1 = require("events");
class AudioStreamService extends events_1.EventEmitter {
    constructor() {
        super();
        this.callAgent = null;
        this.call = null;
        this.activeStream = null;
        this.callClient = new communication_calling_1.CallClient();
    }
    async initialize(tokenCredential) {
        try {
            this.callAgent = await this.callClient.createCallAgent(tokenCredential);
            this.deviceManager = await this.callClient.getDeviceManager();
            this.setupEventListeners();
        }
        catch (error) {
            throw new Error(`Failed to initialize audio service: ${error}`);
        }
    }
    setupEventListeners() {
        if (!this.callAgent)
            throw new Error('Call agent not initialized');
        this.callAgent.on('callsUpdated', ({ added, removed }) => {
            added.forEach(call => this.handleCallAdded(call));
            removed.forEach(call => this.handleCallRemoved(call));
        });
    }
    handleCallAdded(call) {
        call.on('stateChanged', () => {
            this.emit('callStateChanged', call.state);
        });
        call.on('remoteParticipantsUpdated', ({ added, removed }) => {
            added.forEach(participant => this.handleParticipantAdded(participant));
            removed.forEach(participant => this.handleParticipantRemoved(participant));
        });
    }
    handleCallRemoved(call) {
        this.emit('callEnded', call.callEndReason);
    }
    handleParticipantAdded(participant) {
        participant.on('audioStreamsUpdated', ({ added }) => {
            added.forEach(stream => {
                this.activeStream = stream;
                this.emit('audioStreamAvailable', stream);
            });
        });
    }
    handleParticipantRemoved(participant) {
        this.emit('participantLeft', participant);
    }
    async joinCall(meetingUrl) {
        try {
            if (!this.callAgent)
                throw new Error('Call agent not initialized');
            this.call = await this.callAgent.join({ meetingLink: meetingUrl });
            // Mute local audio initially
            await this.call.mute();
            this.emit('callJoined', this.call);
        }
        catch (error) {
            throw new Error(`Failed to join call: ${error}`);
        }
    }
    async leaveCall() {
        try {
            if (this.call) {
                await this.call.hangUp();
                this.call = null;
            }
        }
        catch (error) {
            throw new Error(`Failed to leave call: ${error}`);
        }
    }
    async startAudioStream() {
        try {
            if (!this.deviceManager)
                throw new Error('Device manager not initialized');
            const microphone = await this.selectMicrophone();
            const speaker = await this.selectSpeaker();
            await this.deviceManager.selectMicrophone(microphone);
            await this.deviceManager.selectSpeaker(speaker);
            if (!this.call)
                throw new Error('No active call');
            await this.call.unmute();
            return this.activeStream;
        }
        catch (error) {
            throw new Error(`Failed to start audio stream: ${error}`);
        }
    }
    async selectMicrophone() {
        const microphones = await this.deviceManager.getMicrophones();
        return microphones[0] || null;
    }
    async selectSpeaker() {
        const speakers = await this.deviceManager.getSpeakers();
        return speakers[0] || null;
    }
    async stopAudioStream() {
        try {
            if (this.call) {
                await this.call.mute();
            }
            this.activeStream = null;
        }
        catch (error) {
            throw new Error(`Failed to stop audio stream: ${error}`);
        }
    }
}
exports.AudioStreamService = AudioStreamService;
//# sourceMappingURL=audioStreamService.js.map