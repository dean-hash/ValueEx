import { Observable, Subject, merge, from } from 'rxjs';
import { map, mergeMap, filter, tap } from 'rxjs/operators';
import { DigitalIntelligence, Intelligence } from './digitalIntelligence';
import { ValueNetwork, ValueNode } from '../../services/intelligence/valueNetwork';

interface FlowSignal {
  type: 'MARKET' | 'USER' | 'SYSTEM' | 'VALUE';
  source: string;
  data: any;
  timestamp: number;
}

export class FlowEngine {
  private static instance: FlowEngine;
  private intelligence: DigitalIntelligence;
  private valueNetwork: ValueNetwork;
  private flowStream: Subject<FlowSignal> = new Subject();
  private activeFlows: Map<string, Observable<any>> = new Map();

  private constructor() {
    this.intelligence = DigitalIntelligence.getInstance();
    this.valueNetwork = new ValueNetwork();
    this.initializeFlows();
  }

  static getInstance(): FlowEngine {
    if (!FlowEngine.instance) {
      FlowEngine.instance = new FlowEngine();
    }
    return FlowEngine.instance;
  }

  private initializeFlows() {
    // Market Flow
    this.createFlow(
      'market_intelligence',
      (signal) => signal.type === 'MARKET',
      this.processMarketSignal.bind(this)
    );

    // Value Flow
    this.createFlow(
      'value_optimization',
      (signal) => signal.type === 'VALUE',
      this.processValueSignal.bind(this)
    );

    // User Flow
    this.createFlow(
      'user_engagement',
      (signal) => signal.type === 'USER',
      this.processUserSignal.bind(this)
    );

    // System Flow
    this.createFlow(
      'system_optimization',
      (signal) => signal.type === 'SYSTEM',
      this.processSystemSignal.bind(this)
    );

    // Merge all flows
    merge(...Array.from(this.activeFlows.values())).subscribe((result) =>
      this.broadcastResults(result)
    );
  }

  private createFlow(
    name: string,
    predicate: (signal: FlowSignal) => boolean,
    processor: (signal: FlowSignal) => Promise<any>
  ) {
    const flow = this.flowStream.pipe(filter(predicate), mergeMap(processor));
    this.activeFlows.set(name, flow);
  }

  private async processMarketSignal(signal: FlowSignal): Promise<any> {
    const intelligence: Intelligence = {
      id: `market_${Date.now()}`,
      source: signal.source,
      timestamp: signal.timestamp,
      insights: [
        {
          type: 'market_opportunity',
          value: signal.data,
          confidence: 0.95,
        },
      ],
      connections: [],
    };

    this.intelligence.injectIntelligence(intelligence);
    return { type: 'MARKET_PROCESSED', data: intelligence };
  }

  private async processValueSignal(signal: FlowSignal): Promise<any> {
    const opportunities = await this.valueNetwork.findHighValueOpportunities({
      context: signal.data,
    });

    return {
      type: 'VALUE_OPTIMIZED',
      data: opportunities.map((opp) => ({
        id: opp.id,
        type: opp.type,
        metrics: opp.metrics,
        recommendations: this.generateRecommendations(opp),
      })),
    };
  }

  private async processUserSignal(signal: FlowSignal): Promise<any> {
    // Process user engagement and behavior
    return { type: 'USER_PROCESSED', data: signal.data };
  }

  private async processSystemSignal(signal: FlowSignal): Promise<any> {
    // Handle system-level optimizations
    return { type: 'SYSTEM_OPTIMIZED', data: signal.data };
  }

  private generateRecommendations(opportunity: ValueNode): any[] {
    return [
      {
        type: 'IMMEDIATE_ACTION',
        confidence: opportunity.metrics.confidence,
        potential: opportunity.metrics.potentialValue,
        timeframe: 'immediate',
      },
      {
        type: 'GROWTH_OPPORTUNITY',
        confidence: opportunity.metrics.momentum,
        potential: opportunity.metrics.potentialValue * 1.5,
        timeframe: 'short-term',
      },
    ];
  }

  private broadcastResults(result: any) {
    // Broadcast results to all interested subscribers
    console.log('Flow Result:', result);
  }

  injectSignal(signal: FlowSignal) {
    this.flowStream.next(signal);
  }

  observeFlow(type?: string): Observable<any> {
    if (type && this.activeFlows.has(type)) {
      return this.activeFlows.get(type)!;
    }
    return merge(...Array.from(this.activeFlows.values()));
  }
}
