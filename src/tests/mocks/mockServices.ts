import { EventEmitter } from 'events';
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

export class MockTeamsService implements ITeamsIntegration {
  private emitter = new EventEmitter();

  async initialize(): Promise<void> {}

  async createMeeting(subject: string): Promise<MeetingInfo> {
    return {
      joinUrl: `https://teams.mock.com/meeting/${Date.now()}`,
      threadId: `thread-${Date.now()}`,
      subject
    };
  }

  async startMeeting(subject: string): Promise<MeetingInfo> {
    return this.createMeeting(subject);
  }

  async joinMeeting(url: string): Promise<any> {
    this.emitter.emit('meetingJoined', { url });
    return {
      user: { id: 'mock-user' },
      recognizer: {}
    };
  }
}

export class MockAudioService implements IAudioStreamService {
  async startAudioStream(): Promise<MediaStream> {
    return new (global.MediaStream as any)();
  }

  async stopAudioStream(): Promise<void> {}
}

export class MockSpeechService implements ISpeechService {
  async textToSpeech(text: string): Promise<ArrayBuffer> {
    return new ArrayBuffer(text.length * 2);
  }

  async speechToText(): Promise<string> {
    return 'Mock transcribed text';
  }
}

export class MockResonanceService implements IResonanceFieldService {
  async measureValueCreation(): Promise<ValueCreationMetrics> {
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

  async calculateConsumerValue(): Promise<number> {
    return 85.0;
  }

  async calculateMerchantValue(): Promise<number> {
    return 90.0;
  }
}

export class MockDynamicsService implements IDynamicsService {
  async getMarketPrice(): Promise<number> {
    return 100.0;
  }

  async getTraditionalCAC(): Promise<number> {
    return 50.0;
  }
}

export class MockBusinessCentralService implements IBusinessCentralService {
  async getEfficiencyMetrics(): Promise<EfficiencyMetrics> {
    return {
      processingTime: 120,
      conversionRate: 0.15,
      costPerLead: 25.0
    };
  }
}

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
