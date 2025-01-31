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
  AudioStreamConfig,
} from '../../types/serviceTypes';
import type {
  MediaStream,
  MediaStreamTrack,
  MediaStreamTrackState,
  MediaTrackSettings,
  MediaTrackCapabilities,
  MediaTrackConstraints,
  EventListener,
  Event,
} from '../../types/common';

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

  getTrackById(id: string): MediaStreamTrack | null {
    return (this.tracks.find((track) => track.id === id) as unknown as MediaStreamTrack) || null;
  }

  addTrack(track: MediaStreamTrack): void {
    this.tracks.push(track as unknown as MockAudioTrack);
  }

  removeTrack(track: MediaStreamTrack): void {
    const index = this.tracks.findIndex((t) => t.id === track.id);
    if (index !== -1) {
      this.tracks.splice(index, 1);
    }
  }

  clone(): MediaStream {
    return new MockMediaStream();
  }

  addEventListener(type: string, listener: EventListener): void {}
  removeEventListener(type: string, listener: EventListener): void {}
  dispatchEvent(event: Event): boolean {
    return true;
  }
}

// Mock Audio Track
export class MockAudioTrack implements MediaStreamTrack {
  enabled = true;
  id = `mock-track-${Date.now()}`;
  kind = 'audio' as const;
  label = 'mock-audio-track';
  muted = false;
  readyState: MediaStreamTrackState = 'live';
  isolated = false;
  contentHint = '';

  getSettings(): MediaTrackSettings {
    return {
      deviceId: this.id,
      groupId: 'mock-group',
      sampleRate: 48000,
      sampleSize: 16,
      channelCount: 2,
    };
  }

  getCapabilities(): MediaTrackCapabilities {
    return {
      deviceId: this.id,
      groupId: 'mock-group',
      sampleRate: { min: 44100, max: 48000 },
      sampleSize: { min: 16, max: 24 },
      channelCount: { min: 1, max: 2 },
    };
  }

  getConstraints(): MediaTrackConstraints {
    return {};
  }

  async applyConstraints(): Promise<void> {}

  clone(): MediaStreamTrack {
    return new MockAudioTrack();
  }

  stop(): void {
    this.readyState = 'ended';
  }

  addEventListener(type: string, listener: EventListener): void {}
  removeEventListener(type: string, listener: EventListener): void {}
  dispatchEvent(event: Event): boolean {
    return true;
  }
}

// Mock Teams Client
export class MockTeamsClient implements ITeamsIntegration {
  private emitter = new EventEmitter();

  async initialize(): Promise<void> {}

  async createMeeting(subject: string): Promise<MeetingInfo> {
    return {
      id: `mock-meeting-${Date.now()}`,
      subject,
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      url: 'https://mock-teams-meeting.com',
    };
  }

  async startMeeting(subject: string): Promise<MeetingInfo> {
    return this.createMeeting(subject);
  }

  async joinMeeting(url: string): Promise<void> {}
}

// Mock Audio Service
export class MockAudioService implements IAudioStreamService {
  private config: AudioStreamConfig = {
    sampleRate: 48000,
    channelCount: 2,
    sampleSize: 16,
  };

  async startAudioStream(): Promise<MediaStream> {
    return new MockMediaStream();
  }

  async stopAudioStream(): Promise<void> {}
}

// Mock Speech Service
export class MockSpeechService implements ISpeechService {
  async textToSpeech(text: string): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }

  async speechToText(): Promise<string> {
    return 'mock transcription';
  }
}

// Mock Resonance Field Service
export class MockResonanceFieldService implements IResonanceFieldService {
  async measureValueCreation(
    product: Product,
    pattern: DemandPattern
  ): Promise<ValueCreationMetrics> {
    return {
      consumerValue: 100,
      merchantValue: 50,
      networkValue: 25,
      totalValue: 175,
    };
  }

  async calculateConsumerValue(
    product: Product,
    pattern: DemandPattern,
    signals: DemandSignal[]
  ): Promise<number> {
    return 100;
  }

  async calculateMerchantValue(product: Product, signals: DemandSignal[]): Promise<number> {
    return 50;
  }
}

// Mock Dynamics Service
export class MockDynamicsService implements IDynamicsService {
  async getMarketPrice(product: Product): Promise<number> {
    return 99.99;
  }

  async getTraditionalCAC(category: string): Promise<number> {
    return 50;
  }
}

// Mock Business Central Service
export class MockBusinessCentralService implements IBusinessCentralService {
  async getEfficiencyMetrics(): Promise<EfficiencyMetrics> {
    return {
      processingTime: 100,
      resourceUtilization: 0.8,
      costPerTransaction: 1.5,
    };
  }
}

// Mock Awin Service
export class MockAwinService implements IAwinService {
  async getAffiliateMetrics(): Promise<AffiliateMetrics> {
    return {
      clicks: 1000,
      conversions: 50,
      revenue: 5000,
      commission: 250,
    };
  }
}
