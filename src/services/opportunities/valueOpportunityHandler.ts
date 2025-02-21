import { logger } from '../../utils/logger';
import { RevenueTracker } from '../affiliate/revenueTracker';
import { RevenueActions } from '../revenue/revenueActions';

interface ValueAction {
  type: 'immediate' | 'scheduled' | 'conditional';
  priority: number;
  revenue: {
    estimated: number;
    probability: number;
    timeframe: number; // hours until potential realization
  };
  requirements: string[];
  steps: string[];
}

export class ValueOpportunityHandler {
  private static instance: ValueOpportunityHandler;
  private revenueTracker: RevenueTracker;
  private revenueActions: RevenueActions;
  private activeOpportunities: Map<string, ValueAction> = new Map();
  private minimumProbabilityThreshold = 0.7;
  private emergencyModeActive = false;
  private emergencyMetrics = {
    requiredDailyRevenue: 1000, // Minimum daily revenue needed
    currentDayRevenue: 0,
    successfulActions: 0,
    failedActions: 0,
    lastActionTime: Date.now(),
  };

  private constructor() {
    this.revenueTracker = RevenueTracker.getInstance();
    this.revenueActions = RevenueActions.getInstance();
    this.initializeOpportunityListeners();
    this.startEmergencyMonitoring();
  }

  static getInstance(): ValueOpportunityHandler {
    if (!ValueOpportunityHandler.instance) {
      ValueOpportunityHandler.instance = new ValueOpportunityHandler();
    }
    return ValueOpportunityHandler.instance;
  }

  async handleOpportunity(opportunity: {
    type: string;
    value: number;
    confidence: number;
    requirements: string[];
  }): Promise<void> {
    const action: ValueAction = {
      type: opportunity.confidence > 0.9 ? 'immediate' : 'scheduled',
      priority: opportunity.confidence * 10,
      revenue: {
        estimated: opportunity.value,
        probability: opportunity.confidence,
        timeframe: 24, // Default to 24 hours
      },
      requirements: opportunity.requirements,
      steps: ['initiate', 'validate', 'execute'],
    };

    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeOpportunities.set(id, action);

    if (this.emergencyModeActive && opportunity.confidence > 0.8) {
      await this.executeEmergencyAction(id, action);
    } else {
      await this.processHighProbabilityOpportunity({
        quantumState: { probability: opportunity.confidence },
        value: opportunity.value,
        requirements: opportunity.requirements,
      });
    }
  }

  private initializeOpportunityListeners(): void {
    document.addEventListener('valueOpportunity', async (event: CustomEvent) => {
      const opportunity = event.detail;

      if (opportunity.quantumState.probability >= this.minimumProbabilityThreshold) {
        await this.processHighProbabilityOpportunity(opportunity);
      }
    });
  }

  private startEmergencyMonitoring(): void {
    // Reset daily metrics at midnight
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.emergencyMetrics.currentDayRevenue = 0;
        this.emergencyMetrics.successfulActions = 0;
        this.emergencyMetrics.failedActions = 0;
      }
    }, 60000); // Check every minute

    // Monitor action frequency
    setInterval(() => {
      if (this.emergencyModeActive) {
        const timeSinceLastAction = Date.now() - this.emergencyMetrics.lastActionTime;
        if (timeSinceLastAction > 1800000) {
          // 30 minutes
          logger.warn('No actions taken in last 30 minutes during emergency mode');
          this.accelerateOpportunityProcessing();
        }
      }
    }, 300000); // Check every 5 minutes
  }

  private accelerateOpportunityProcessing(): void {
    // First try immediate revenue actions
    this.executeStep('EMERGENCY_REVENUE').catch(logger.error);

    // Then process pending opportunities
    const pendingOpportunities = Array.from(this.activeOpportunities.values())
      .filter((action) => action.type !== 'immediate')
      .sort((a, b) => b.priority - a.priority);

    // Convert highest priority pending opportunities to immediate
    pendingOpportunities.slice(0, 3).forEach((action) => {
      action.type = 'immediate';
      this.executeImmediate(action).catch(logger.error);
    });
  }

  private async processHighProbabilityOpportunity(opportunity: any): Promise<void> {
    const action = this.createValueAction(opportunity);

    if (this.emergencyModeActive) {
      // In emergency mode, we're much more aggressive
      if (action.revenue.probability > 0.6) {
        // Lower threshold
        await this.executeImmediate(action);
        return;
      }

      // Even for lower probability opportunities, schedule them sooner
      this.scheduleAction(action, true);
      return;
    }

    if (this.shouldTakeImmediate(action)) {
      await this.executeImmediate(action);
    } else {
      this.scheduleAction(action, false);
    }
  }

  private createValueAction(opportunity: any): ValueAction {
    const baseRevenue = this.calculateBaseRevenue(opportunity);
    const probability = opportunity.quantumState.probability;

    return {
      type: this.determineActionType(opportunity),
      priority: this.calculatePriority(opportunity),
      revenue: {
        estimated: baseRevenue,
        probability: probability,
        timeframe: this.estimateTimeframe(opportunity),
      },
      requirements: this.determineRequirements(opportunity),
      steps: this.generateActionSteps(opportunity),
    };
  }

  private calculateBaseRevenue(opportunity: any): number {
    const strengthMultiplier = opportunity.strength * 1000; // Base multiplier
    const resonanceBonus = opportunity.resonance * 500; // Bonus for strong resonance
    const typeMultiplier = this.getTypeMultiplier(opportunity.type);

    return (strengthMultiplier + resonanceBonus) * typeMultiplier;
  }

  private getTypeMultiplier(type: string): number {
    switch (type) {
      case 'amplification':
        return 2.0; // Highest potential
      case 'transformation':
        return 1.5; // Medium potential
      case 'connection':
        return 1.2; // Stable but lower potential
      default:
        return 1.0;
    }
  }

  private determineActionType(opportunity: any): 'immediate' | 'scheduled' | 'conditional' {
    if (this.emergencyModeActive && opportunity.quantumState.probability > 0.85) {
      return 'immediate';
    }

    if (opportunity.strength > 0.9) {
      return 'immediate';
    }

    if (opportunity.type === 'transformation') {
      return 'conditional';
    }

    return 'scheduled';
  }

  private calculatePriority(opportunity: any): number {
    const base = opportunity.quantumState.probability * 100;
    const urgencyBonus = this.emergencyModeActive ? 50 : 0;
    const strengthBonus = opportunity.strength * 30;

    if (this.emergencyModeActive) {
      const revenueShortfall = Math.max(
        0,
        this.emergencyMetrics.requiredDailyRevenue - this.emergencyMetrics.currentDayRevenue
      );
      const shortfallBonus = (revenueShortfall / this.emergencyMetrics.requiredDailyRevenue) * 100;
      return base + urgencyBonus + strengthBonus + shortfallBonus;
    }

    return base + urgencyBonus + strengthBonus;
  }

  private estimateTimeframe(opportunity: any): number {
    if (opportunity.type === 'immediate') return 1;
    if (opportunity.type === 'transformation') return 24;
    return 12;
  }

  private determineRequirements(opportunity: any): string[] {
    const requirements: string[] = [];

    if (opportunity.type === 'connection') {
      requirements.push('API Access');
      requirements.push('Partnership Agreement');
    }

    if (opportunity.type === 'transformation') {
      requirements.push('Market Analysis');
      requirements.push('Risk Assessment');
    }

    if (opportunity.quantumState.probability > 0.9) {
      requirements.push('Immediate Resource Allocation');
    }

    return requirements;
  }

  private generateActionSteps(opportunity: any): string[] {
    const steps: string[] = [];

    if (opportunity.type === 'amplification') {
      steps.push('Deploy Value Amplification Protocol');
      steps.push('Monitor Resonance Patterns');
      steps.push('Adjust Parameters Based on Feedback');
    } else if (opportunity.type === 'connection') {
      steps.push('Initiate Partnership Protocol');
      steps.push('Establish Value Channel');
      steps.push('Monitor Flow Metrics');
    } else {
      steps.push('Begin Transformation Sequence');
      steps.push('Monitor State Changes');
      steps.push('Adjust Based on Emergence');
    }

    return steps;
  }

  private shouldTakeImmediate(action: ValueAction): boolean {
    if (this.emergencyModeActive) {
      return action.revenue.probability > 0.8;
    }

    return action.type === 'immediate' && action.priority > 80;
  }

  private async executeImmediate(action: ValueAction): Promise<void> {
    logger.info(`Executing immediate action with priority ${action.priority}`);
    this.emergencyMetrics.lastActionTime = Date.now();

    try {
      // Track the potential revenue
      await this.revenueTracker.trackOpportunity({
        source: 'quantum_resonance',
        value: action.revenue.estimated,
        probability: action.revenue.probability,
        category: action.type,
      });

      // Execute each step with emergency mode acceleration
      for (const step of action.steps) {
        logger.info(`Executing step: ${step}`);
        await this.executeActionStep(step, this.emergencyModeActive);
      }

      // Update emergency metrics
      if (this.emergencyModeActive) {
        this.emergencyMetrics.successfulActions++;
        this.emergencyMetrics.currentDayRevenue +=
          action.revenue.estimated * action.revenue.probability;

        // Check if we've met daily goals
        if (this.emergencyMetrics.currentDayRevenue >= this.emergencyMetrics.requiredDailyRevenue) {
          logger.info('Daily revenue target achieved in emergency mode');
        }
      }

      logger.info(`Action completed. Estimated value: $${action.revenue.estimated}`);
    } catch (error) {
      if (this.emergencyModeActive) {
        this.emergencyMetrics.failedActions++;
        if (this.emergencyMetrics.failedActions > 3) {
          logger.error('Multiple failures in emergency mode - adjusting strategy');
          this.adjustEmergencyStrategy();
        }
      }
      logger.error('Error executing immediate action:', error);
      throw error;
    }
  }

  private adjustEmergencyStrategy(): void {
    // If we're failing too much, try a different approach
    if (this.emergencyMetrics.failedActions > this.emergencyMetrics.successfulActions) {
      // Lower our immediate execution threshold to try more opportunities
      this.minimumProbabilityThreshold = Math.max(0.4, this.minimumProbabilityThreshold - 0.1);

      // Clear some pending actions to make room for new approaches
      const oldestActions = Array.from(this.activeOpportunities.entries())
        .sort(([, a], [, b]) => a.priority - b.priority)
        .slice(0, 5);

      oldestActions.forEach(([id]) => this.activeOpportunities.delete(id));

      logger.info('Emergency strategy adjusted - lowered thresholds and cleared old actions');
    }
  }

  private async executeActionStep(step: string, isEmergency: boolean): Promise<void> {
    const timeoutDuration = isEmergency ? 5000 : 30000; // Much shorter timeouts in emergency

    try {
      await Promise.race([
        this.executeStep(step),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Step timeout')), timeoutDuration)
        ),
      ]);
    } catch (error) {
      if (isEmergency) {
        logger.warn(`Emergency step failed: ${step}. Continuing to next step...`);
        return; // In emergency, continue even if steps fail
      }
      throw error;
    }
  }

  private async executeStep(step: string): Promise<void> {
    // Execute revenue-generating actions
    const actions = this.revenueActions.getAvailableActions();

    // Sort by time-to-value in emergency mode
    actions.sort((a, b) => {
      if (this.emergencyModeActive) {
        return a.action.timeToValue - b.action.timeToValue;
      }
      return b.action.estimatedValue - a.action.estimatedValue;
    });

    // Execute the most appropriate action
    for (const { key } of actions) {
      const revenue = await this.revenueActions.executeAction(key);
      if (revenue > 0) {
        logger.info(`Successfully generated $${revenue} from ${key}`);
        break;
      }
    }
  }

  private scheduleAction(action: ValueAction, isEmergency: boolean): void {
    const delay = this.calculateScheduleDelay(action, isEmergency);

    setTimeout(() => {
      this.executeImmediate(action).catch((error) => {
        logger.error('Error executing scheduled action:', error);
        if (isEmergency) {
          this.adjustEmergencyStrategy();
        }
      });
    }, delay);
  }

  private calculateScheduleDelay(action: ValueAction, isEmergency: boolean): number {
    if (isEmergency) {
      // In emergency mode, everything happens much faster
      if (action.priority > 70) return 0; // Immediate
      if (action.priority > 50) return 300000; // 5 minutes
      return 900000; // 15 minutes max in emergency mode
    }

    if (action.type === 'immediate') return 0;
    if (action.type === 'conditional') return 3600000; // 1 hour
    return 1800000; // 30 minutes
  }

  public setEmergencyMode(active: boolean): void {
    this.emergencyModeActive = active;
    this.minimumProbabilityThreshold = active ? 0.5 : 0.7; // Much lower threshold in emergency

    if (active) {
      // Reset emergency metrics
      this.emergencyMetrics = {
        ...this.emergencyMetrics,
        currentDayRevenue: 0,
        successfulActions: 0,
        failedActions: 0,
        lastActionTime: Date.now(),
      };

      // Immediately process any pending opportunities
      this.accelerateOpportunityProcessing();
    }

    logger.info(`Emergency mode ${active ? 'activated' : 'deactivated'}`);
  }

  public getEmergencyMetrics(): typeof this.emergencyMetrics {
    return { ...this.emergencyMetrics };
  }

  public getActiveOpportunities(): Map<string, ValueAction> {
    return new Map(this.activeOpportunities);
  }

  public getRevenueForecast(): number {
    let totalForecast = 0;

    this.activeOpportunities.forEach((action) => {
      totalForecast += action.revenue.estimated * action.revenue.probability;
    });

    return totalForecast;
  }
}
