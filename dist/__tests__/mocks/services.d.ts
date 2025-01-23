import { EventEmitter } from 'events';
import { Product } from '../../types/productTypes';
import { DemandPattern } from '../../types/demandTypes';
import { DemandSignal } from '../../types/resonanceTypes';
import { ITeamsIntegration, IAudioStreamService, ISpeechService, IResonanceFieldService, IDynamicsService, IBusinessCentralService, IAwinService, ValueCreationMetrics, MeetingInfo, EfficiencyMetrics, AffiliateMetrics } from '../../types/serviceTypes';
export declare class MockMediaStream implements MediaStream {
    private _active;
    private tracks;
    id: string;
    active: boolean;
    getAudioTracks(): MediaStreamTrack[];
    getTracks(): MediaStreamTrack[];
    getVideoTracks(): MediaStreamTrack[];
    getTrackById(): MediaStreamTrack | null;
    addTrack(): void;
    removeTrack(): void;
    clone(): MediaStream;
    addEventListener(): void;
    removeEventListener(): void;
    dispatchEvent(): boolean;
}
export declare class MockTeamsClient extends EventEmitter implements ITeamsIntegration {
    initialize(): Promise<void>;
    createMeeting(subject: string): Promise<MeetingInfo>;
    startMeeting(subject: string): Promise<MeetingInfo>;
    joinMeeting(url: string): Promise<{
        user: {
            id: string;
        };
        recognizer: {};
    }>;
}
export declare class MockAudioService implements IAudioStreamService {
    startAudioStream(): Promise<MediaStream>;
    stopAudioStream(): Promise<void>;
}
export declare class MockSpeechService implements ISpeechService {
    textToSpeech(text: string): Promise<ArrayBuffer>;
    speechToText(): Promise<string>;
}
export declare class MockResonanceFieldService implements IResonanceFieldService {
    measureValueCreation(product: Product, pattern: DemandPattern): Promise<ValueCreationMetrics>;
    calculateConsumerValue(product: Product, pattern: DemandPattern, signals: DemandSignal[]): Promise<number>;
    calculateMerchantValue(product: Product, signals: DemandSignal[]): Promise<number>;
}
export declare class MockDynamicsService implements IDynamicsService {
    getMarketPrice(product: Product): Promise<number>;
    getTraditionalCAC(category: string): Promise<number>;
}
export declare class MockBusinessCentralService implements IBusinessCentralService {
    getEfficiencyMetrics(): Promise<EfficiencyMetrics>;
}
export declare class MockAwinService implements IAwinService {
    getAffiliateMetrics(): Promise<AffiliateMetrics>;
}
