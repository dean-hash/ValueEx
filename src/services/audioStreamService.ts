import { 
  Call,
  CallClient,
  CallAgent,
  AudioDeviceInfo,
  RemoteParticipant,
  CallEndReason
} from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { EventEmitter } from 'events';

export class AudioStreamService extends EventEmitter {
  private callClient: CallClient;
  private callAgent: CallAgent | null = null;
  private call: Call | null = null;
  private deviceManager: any;
  private activeStream: MediaStream | null = null;

  constructor() {
    super();
    this.callClient = new CallClient();
  }

  async initialize(tokenCredential: AzureCommunicationTokenCredential) {
    try {
      this.callAgent = await this.callClient.createCallAgent(tokenCredential);
      this.deviceManager = await this.callClient.getDeviceManager();
      this.setupEventListeners();
    } catch (error) {
      throw new Error(`Failed to initialize audio service: ${error}`);
    }
  }

  private setupEventListeners() {
    if (!this.callAgent) throw new Error('Call agent not initialized');

    this.callAgent.on('callsUpdated', ({ added, removed }) => {
      added.forEach(call => this.handleCallAdded(call));
      removed.forEach(call => this.handleCallRemoved(call));
    });
  }

  private handleCallAdded(call: Call) {
    call.on('stateChanged', () => {
      this.emit('callStateChanged', call.state);
    });

    call.on('remoteParticipantsUpdated', ({ added, removed }) => {
      added.forEach(participant => this.handleParticipantAdded(participant));
      removed.forEach(participant => this.handleParticipantRemoved(participant));
    });
  }

  private handleCallRemoved(call: Call) {
    this.emit('callEnded', call.callEndReason);
  }

  private handleParticipantAdded(participant: RemoteParticipant) {
    participant.on('audioStreamsUpdated', ({ added }) => {
      added.forEach(stream => {
        this.activeStream = stream;
        this.emit('audioStreamAvailable', stream);
      });
    });
  }

  private handleParticipantRemoved(participant: RemoteParticipant) {
    this.emit('participantLeft', participant);
  }

  async joinCall(meetingUrl: string): Promise<void> {
    try {
      if (!this.callAgent) throw new Error('Call agent not initialized');
      
      this.call = await this.callAgent.join({ meetingLink: meetingUrl });
      
      // Mute local audio initially
      await this.call.mute();
      
      this.emit('callJoined', this.call);
    } catch (error) {
      throw new Error(`Failed to join call: ${error}`);
    }
  }

  async leaveCall(): Promise<void> {
    try {
      if (this.call) {
        await this.call.hangUp();
        this.call = null;
      }
    } catch (error) {
      throw new Error(`Failed to leave call: ${error}`);
    }
  }

  async startAudioStream(): Promise<MediaStream> {
    try {
      if (!this.deviceManager) throw new Error('Device manager not initialized');
      
      const microphone = await this.selectMicrophone();
      const speaker = await this.selectSpeaker();
      
      await this.deviceManager.selectMicrophone(microphone);
      await this.deviceManager.selectSpeaker(speaker);
      
      if (!this.call) throw new Error('No active call');
      await this.call.unmute();
      
      return this.activeStream!;
    } catch (error) {
      throw new Error(`Failed to start audio stream: ${error}`);
    }
  }

  private async selectMicrophone(): Promise<AudioDeviceInfo> {
    const microphones = await this.deviceManager.getMicrophones();
    return microphones[0] || null;
  }

  private async selectSpeaker(): Promise<AudioDeviceInfo> {
    const speakers = await this.deviceManager.getSpeakers();
    return speakers[0] || null;
  }

  async stopAudioStream(): Promise<void> {
    try {
      if (this.call) {
        await this.call.mute();
      }
      this.activeStream = null;
    } catch (error) {
      throw new Error(`Failed to stop audio stream: ${error}`);
    }
  }
}
