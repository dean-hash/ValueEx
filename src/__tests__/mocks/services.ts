import { EventEmitter } from 'events';
import { Product } from '../../types/productTypes';
import { DemandPattern } from '../../types/demandTypes';
import { DemandSignal } from '../../types/resonanceTypes';
import {
  ITeamsIntegration,
  IAudioStreamService,
  ISpeechService,
  IResonanceFieldService,
  IDynamicsService,
  IBusinessCentralService,
  IAwinService,
  ValueCreationMetrics,
  MeetingInfo,
  EfficiencyMetrics,
  AffiliateMetrics,
  AudioStreamConfig
} from '../../types/serviceTypes';

// Mock Audio Stream
export class MockMediaStream implements MediaStream {
  private _active = true;
  private tracks: MockAudioTrack[] = [new MockAudioTrack()];
  id: string = `mock-stream-${Date.now()}`;
  active: boolean = true;

  getAudioTracks(): MediaStreamTrack[] {
    return this.tracks as unknown as MediaStreamTrack[];
  }

  getTracks(): MediaStreamTrack[] {
    return this.tracks as unknown as MediaStreamTrack[];
  }

  getVideoTracks(): MediaStreamTrack[] {
    return [];
  }

  getTrackById(): MediaStreamTrack | null {
    return null;
  }

  addTrack(): void {}
  removeTrack(): void {}
  clone(): MediaStream {
    return new MockMediaStream();
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
    return true;
  }
}

class MockAudioTrack implements MediaStreamTrack {
  enabled = true;
  id = `mock-track-${Date.now()}`;
  kind = 'audio' as const;
  label = 'mock-audio-track';
  muted = false;
  readyState: MediaStreamTrackState = 'live';
  
  getSettings(): MediaTrackSettings {
    return {
      channelCount: 2,
      sampleRate: 48000,
      sampleSize: 16,
      echoCancellation: true,
      autoGainControl: true,
      noiseSuppression: true
    };
  }

  applyConstraints(): Promise<void> {
    return Promise.resolve();
  }

  clone(): MediaStreamTrack {
    return new MockAudioTrack();
  }

  getCapabilities(): MediaTrackCapabilities {
    return {};
  }

  getConstraints(): MediaTrackConstraints {
    return {};
  }

  stop(): void {
    this.readyState = 'ended';
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
    return true;
  }
}

// Mock Teams Client
export class MockTeamsClient extends EventEmitter implements ITeamsIntegration {
  async initialize(): Promise<void> {}

  async createMeeting(subject: string): Promise<MeetingInfo> {
    return {
      joinUrl: `https://teams.microsoft.com/l/meetup-join/test-${Date.now()}`,
      threadId: `thread-${Date.now()}`,
      subject
    };
  }

  async startMeeting(subject: string): Promise<MeetingInfo> {
    return this.createMeeting(subject);
  }

  async joinMeeting(url: string) {
    this.emit('meetingJoined', { url });
    return {
      user: { id: 'test-user' },
      recognizer: {}
    };
  }
}

// Mock Audio Service
export class MockAudioService implements IAudioStreamService {
  async startAudioStream(): Promise<MediaStream> {
    return new MockMediaStream();
  }

  async stopAudioStream(): Promise<void> {}
}

// Mock Speech Service
export class MockSpeechService implements ISpeechService {
  async textToSpeech(text: string): Promise<ArrayBuffer> {
    return new ArrayBuffer(text.length * 2);
  }

  async speechToText(): Promise<string> {
    return 'Mock transcribed text';
  }
}

// Mock Resonance Field Service
export class MockResonanceFieldService implements IResonanceFieldService {
  async measureValueCreation(
    product: Product,
    pattern: DemandPattern
  ): Promise<ValueCreationMetrics> {
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

  async calculateConsumerValue(
    product: Product,
    pattern: DemandPattern,
    signals: DemandSignal[]
  ): Promise<number> {
    return 85.0;
  }

  async calculateMerchantValue(
    product: Product,
    signals: DemandSignal[]
  ): Promise<number> {
    return 90.0;
  }
}

// Mock Dynamics Service
export class MockDynamicsService implements IDynamicsService {
  async getMarketPrice(product: Product): Promise<number> {
    return product.price;
  }

  async getTraditionalCAC(category: string): Promise<number> {
    return 50.0;
  }
}

// Mock Business Central Service
export class MockBusinessCentralService implements IBusinessCentralService {
  async getEfficiencyMetrics(): Promise<EfficiencyMetrics> {
    return {
      processingTime: 120,
      conversionRate: 0.15,
      costPerLead: 25.0
    };
  }
}

// Mock Awin Service
export class MockAwinService implements IAwinService {
  async getAffiliateMetrics(): Promise<AffiliateMetrics> {
    return {
      clicks: 1000,
      conversions: 50,
      revenue: 5000.0,
      commission: 250.0
    };
  }
}
