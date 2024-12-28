import { BehaviorSubject } from 'rxjs';
import { logger } from '../utils/logger';
import { DemandConfidence } from './resonanceField';

interface DeliveryChannel {
  type: 'email' | 'sms' | 'push' | 'direct_message' | 'notification';
  priority: number; // 1-5, higher = more urgent
  constraints: {
    timeOfDay?: { start: number; end: number };
    frequency?: number; // Max deliveries per day
    cooldown?: number; // Minutes between messages
  };
  preferences?: {
    optIn: boolean;
    preferredTimes?: number[];
    blackoutPeriods?: { start: number; end: number }[];
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
    timeValue: number; // How time-sensitive is this
    opportunityCost: number;
  };
}

export class DeliveryOrchestrator {
  private readonly CONFIDENCE_THRESHOLDS = {
    IMMEDIATE: 0.9, // Highest urgency - use most direct channel
    HIGH: 0.8, // Important - use preferred direct channel
    MEDIUM: 0.6, // Standard - use normal channels
    LOW: 0.4, // Optional - use passive channels
  };

  private readonly CHANNEL_HIERARCHY = new Map<number, DeliveryChannel[]>([
    [5, [{ type: 'sms', priority: 5, constraints: { frequency: 1 } }]],
    [4, [{ type: 'direct_message', priority: 4, constraints: { frequency: 3 } }]],
    [3, [{ type: 'push', priority: 3, constraints: { frequency: 5 } }]],
    [2, [{ type: 'email', priority: 2, constraints: { frequency: 10 } }]],
    [1, [{ type: 'notification', priority: 1, constraints: { frequency: 20 } }]],
  ]);

  async orchestrateDelivery(context: DeliveryContext): Promise<{
    channel: DeliveryChannel;
    timing: Date;
    priority: number;
  }> {
    // Calculate overall urgency
    const urgency = this.calculateUrgency(context);

    // Select appropriate channel
    const channel = await this.selectChannel(urgency, context);

    // Determine optimal timing
    const timing = this.determineTiming(channel, context);

    // Calculate priority for the delivery system
    const priority = this.calculatePriority(urgency, context);

    logger.info('Delivery orchestrated', {
      urgency,
      channel: channel.type,
      timing,
      priority,
    });

    return { channel, timing, priority };
  }

  private calculateUrgency(context: DeliveryContext): number {
    const { confidence, valueContext } = context;

    // Combine confidence score with value and time sensitivity
    const baseUrgency = confidence.confidenceScore;
    const valueUrgency = valueContext.potentialValue * valueContext.timeValue;

    // Weight factors
    return baseUrgency * 0.6 + valueUrgency * 0.4;
  }

  private async selectChannel(urgency: number, context: DeliveryContext): Promise<DeliveryChannel> {
    // Get appropriate channels based on urgency threshold
    let priority = 1;
    if (urgency >= this.CONFIDENCE_THRESHOLDS.IMMEDIATE) priority = 5;
    else if (urgency >= this.CONFIDENCE_THRESHOLDS.HIGH) priority = 4;
    else if (urgency >= this.CONFIDENCE_THRESHOLDS.MEDIUM) priority = 3;
    else if (urgency >= this.CONFIDENCE_THRESHOLDS.LOW) priority = 2;

    // Get channels for this priority
    const channels = this.CHANNEL_HIERARCHY.get(priority) || [];

    // Filter by constraints and preferences
    const validChannels = channels.filter((channel) => this.isChannelAvailable(channel, context));

    // Return best channel or fallback
    return validChannels[0] || this.getFallbackChannel();
  }

  private isChannelAvailable(channel: DeliveryChannel, context: DeliveryContext): boolean {
    const { timeContext, userContext } = context;

    // Check time constraints
    if (channel.constraints.timeOfDay) {
      const hour = timeContext.localTime.getHours();
      if (hour < channel.constraints.timeOfDay.start || hour > channel.constraints.timeOfDay.end) {
        return false;
      }
    }

    // Check frequency constraints
    if (channel.constraints.frequency) {
      const recentDeliveries = userContext.recentInteractions;
      if (recentDeliveries >= channel.constraints.frequency) {
        return false;
      }
    }

    // Check user preferences
    if (channel.preferences) {
      if (!channel.preferences.optIn) return false;

      // Check preferred times
      if (channel.preferences.preferredTimes) {
        const hour = timeContext.localTime.getHours();
        if (!channel.preferences.preferredTimes.includes(hour)) {
          return false;
        }
      }

      // Check blackout periods
      if (channel.preferences.blackoutPeriods) {
        const now = timeContext.localTime.getTime();
        const inBlackout = channel.preferences.blackoutPeriods.some(
          (period) => now >= period.start && now <= period.end
        );
        if (inBlackout) return false;
      }
    }

    return true;
  }

  private determineTiming(channel: DeliveryChannel, context: DeliveryContext): Date {
    const { timeContext, valueContext } = context;
    const now = timeContext.localTime;

    // If high time value, send immediately
    if (valueContext.timeValue > 0.8) {
      return now;
    }

    // Otherwise, find next optimal time
    return this.findNextOptimalTime(channel, context);
  }

  private findNextOptimalTime(channel: DeliveryChannel, context: DeliveryContext): Date {
    const { timeContext } = context;
    let candidateTime = new Date(timeContext.localTime);

    // If channel has preferred times, use next preferred time
    if (channel.preferences?.preferredTimes) {
      const currentHour = candidateTime.getHours();
      const nextPreferredHour = channel.preferences.preferredTimes.find(
        (hour) => hour > currentHour
      );

      if (nextPreferredHour) {
        candidateTime.setHours(nextPreferredHour, 0, 0, 0);
      } else {
        // No preferred times today, try tomorrow
        candidateTime.setDate(candidateTime.getDate() + 1);
        candidateTime.setHours(channel.preferences.preferredTimes[0], 0, 0, 0);
      }
    }

    return candidateTime;
  }

  private calculatePriority(urgency: number, context: DeliveryContext): number {
    const { valueContext } = context;

    // Combine urgency with value factors
    return Math.min(
      10,
      Math.round(urgency * 0.4 + valueContext.potentialValue * 0.3 + valueContext.timeValue * 0.3) *
        10
    );
  }

  private getFallbackChannel(): DeliveryChannel {
    // Always have a fallback delivery method
    return {
      type: 'notification',
      priority: 1,
      constraints: {
        frequency: 20,
      },
    };
  }
}
