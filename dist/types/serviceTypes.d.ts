export interface ValueCreationMetrics {
  consumerValue: number;
  merchantValue: number;
  valueExValue: number;
  matchQuality: number;
  timestamp: Date;
  realTimeMetrics: {
    revenue: number;
    costs: number;
    profitMargin: number;
    customerEngagement: number;
  };
}
export interface TeamsConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}
export interface SpeechConfig {
  speechKey: string;
  speechRegion: string;
}
export interface CommunicationConfig {
  connectionString: string;
}
export interface AudioStreamConfig {
  stream: MediaStream;
}
export interface MeetingInfo {
  joinUrl: string;
  threadId: string;
  subject: string;
}
export interface UserToken {
  user: {
    id: string;
  };
  token: string;
  expiresOn: Date;
}
export interface EfficiencyMetrics {
  processingTime: number;
  conversionRate: number;
  costPerLead: number;
}
export interface AffiliateMetrics {
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
}
export interface ITeamsIntegration {
  initialize(): Promise<void>;
  createMeeting(subject: string): Promise<MeetingInfo>;
  startMeeting(subject: string): Promise<MeetingInfo>;
  joinMeeting(url: string): Promise<any>;
}
export interface IAudioStreamService {
  startAudioStream(): Promise<MediaStream>;
  stopAudioStream(): Promise<void>;
}
export interface ISpeechService {
  textToSpeech(text: string): Promise<ArrayBuffer>;
  speechToText(config?: AudioStreamConfig): Promise<string>;
}
export interface IResonanceFieldService {
  measureValueCreation(product: any, pattern: any): Promise<ValueCreationMetrics>;
  calculateConsumerValue(product: any, pattern: any, signals: any[]): Promise<number>;
  calculateMerchantValue(product: any, signals: any[]): Promise<number>;
}
export interface IDynamicsService {
  getMarketPrice(product: any): Promise<number>;
  getTraditionalCAC(category: string): Promise<number>;
}
export interface IBusinessCentralService {
  getEfficiencyMetrics(): Promise<EfficiencyMetrics>;
}
export interface IAwinService {
  getAffiliateMetrics(): Promise<AffiliateMetrics>;
}
