import { DemandConfidence } from './resonanceField';
interface DeliveryChannel {
  type: 'email' | 'sms' | 'push' | 'direct_message' | 'notification';
  priority: number;
  constraints: {
    timeOfDay?: {
      start: number;
      end: number;
    };
    frequency?: number;
    cooldown?: number;
  };
  preferences?: {
    optIn: boolean;
    preferredTimes?: number[];
    blackoutPeriods?: {
      start: number;
      end: number;
    }[];
  };
}
interface DeliveryContext {
  confidence: DemandConfidence;
  timeContext: {
    localTime: Date;
    timezone: string;
    dayOfWeek: number;
  };
  userContext: {
    recentInteractions: number;
    responseRate: number;
    channelPreferences: Map<string, number>;
  };
  valueContext: {
    potentialValue: number;
    timeValue: number;
    opportunityCost: number;
  };
}
export declare class DeliveryOrchestrator {
  private readonly CONFIDENCE_THRESHOLDS;
  private readonly CHANNEL_HIERARCHY;
  orchestrateDelivery(context: DeliveryContext): Promise<{
    channel: DeliveryChannel;
    timing: Date;
    priority: number;
  }>;
  private calculateUrgency;
  private selectChannel;
  private isChannelAvailable;
  private determineTiming;
  private findNextOptimalTime;
  private calculatePriority;
  private getFallbackChannel;
}
export {};
