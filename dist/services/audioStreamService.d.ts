import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { EventEmitter } from 'events';
export declare class AudioStreamService extends EventEmitter {
  private callClient;
  private callAgent;
  private call;
  private deviceManager;
  private activeStream;
  constructor();
  initialize(tokenCredential: AzureCommunicationTokenCredential): Promise<void>;
  private setupEventListeners;
  private handleCallAdded;
  private handleCallRemoved;
  private handleParticipantAdded;
  private handleParticipantRemoved;
  joinCall(meetingUrl: string): Promise<void>;
  leaveCall(): Promise<void>;
  startAudioStream(): Promise<MediaStream>;
  private selectMicrophone;
  private selectSpeaker;
  stopAudioStream(): Promise<void>;
}
