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
} from '../../types/serviceTypes';
export declare class MockTeamsService implements ITeamsIntegration {
  private emitter;
  initialize(): Promise<void>;
  createMeeting(subject: string): Promise<MeetingInfo>;
  startMeeting(subject: string): Promise<MeetingInfo>;
  joinMeeting(url: string): Promise<any>;
}
export declare class MockAudioService implements IAudioStreamService {
  startAudioStream(): Promise<MediaStream>;
  stopAudioStream(): Promise<void>;
}
export declare class MockSpeechService implements ISpeechService {
  textToSpeech(text: string): Promise<ArrayBuffer>;
  speechToText(): Promise<string>;
}
export declare class MockResonanceService implements IResonanceFieldService {
  measureValueCreation(): Promise<ValueCreationMetrics>;
  calculateConsumerValue(): Promise<number>;
  calculateMerchantValue(): Promise<number>;
}
export declare class MockDynamicsService implements IDynamicsService {
  getMarketPrice(): Promise<number>;
  getTraditionalCAC(): Promise<number>;
}
export declare class MockBusinessCentralService implements IBusinessCentralService {
  getEfficiencyMetrics(): Promise<EfficiencyMetrics>;
}
export declare class MockAwinService implements IAwinService {
  getAffiliateMetrics(): Promise<AffiliateMetrics>;
}
