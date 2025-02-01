import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, mergeMap, filter } from 'rxjs/operators';
import { ValueFlow } from './valueFlow';
import { FlowEngine } from './flowEngine';

interface TrustMetrics {
  trustScore: number;
  reliability: number;
  engagement: number;
  lastUpdate: Date;
}

interface TrustSignal {
  source: string;
  intent: string;
  value: any;
  confidence: number;
  impact: {
    immediate: number;
    sustainable: number;
    growth: number;
  };
}

interface NetworkNode {
  value: {
    immediate: number;
    sustainable: number;
    growth: number;
  };
  confidence: number;
  timestamp: number;
}

export class TrustNetwork {
  private static instance: TrustNetwork;
  private valueFlow: ValueFlow;
  private flowEngine: FlowEngine;
  private trustStream: Subject<TrustSignal> = new Subject();
  private networkState: BehaviorSubject<Map<string, NetworkNode>> = new BehaviorSubject(new Map());

  private constructor() {
    this.valueFlow = ValueFlow.getInstance();
    this.flowEngine = FlowEngine.getInstance();
    this.initializeTrustNetwork();
  }

  static getInstance(): TrustNetwork {
    if (!TrustNetwork.instance) {
      TrustNetwork.instance = new TrustNetwork();
    }
    return TrustNetwork.instance;
  }

  private initializeTrustNetwork() {
    // Initialize with our core principles
    this.injectTrust({
      source: 'core_principles',
      intent: 'foundation',
      value: {
        ethical: true,
        sustainable: true,
        mutual_benefit: true,
      },
      confidence: 1.0,
      impact: {
        immediate: 1000,
        sustainable: 5000,
        growth: 2.5,
      },
    });

    this.trustStream
      .pipe(
        filter((signal) => this.validateTrust(signal)),
        map((signal) => this.enrichTrust(signal)),
        mergeMap((signal) => this.processTrust(signal))
      )
      .subscribe((result) => this.updateNetwork(result));
  }

  private validateTrust(signal: TrustSignal): boolean {
    return (
      signal.confidence > 0 &&
      signal.impact.immediate > 0 &&
      signal.impact.sustainable >= signal.impact.immediate
    );
  }

  private enrichTrust(signal: TrustSignal): TrustSignal {
    const networkEffect = this.calculateNetworkEffect();
    return {
      ...signal,
      impact: {
        immediate: signal.impact.immediate * networkEffect,
        sustainable: signal.impact.sustainable * networkEffect,
        growth: signal.impact.growth * networkEffect,
      },
    };
  }

  private calculateNetworkEffect(): number {
    const network = this.networkState.value;
    const connections = network.size;
    return 1 + connections * 0.1; // 10% boost per connection
  }

  private async processTrust(signal: TrustSignal): Promise<NetworkNode> {
    // Convert trust into value
    this.valueFlow.injectValue({
      source: signal.source,
      target: 'trust_network',
      type: 'CONNECTION',
      strength: signal.confidence,
      value: signal.impact.immediate,
      confidence: signal.confidence,
      timestamp: Date.now(),
    });

    // Inject into flow engine
    this.flowEngine.injectSignal({
      type: 'VALUE',
      source: 'trust_network',
      timestamp: Date.now(),
      data: {
        immediate: signal.impact.immediate,
        sustainable: signal.impact.sustainable,
        growth: signal.impact.growth,
      },
    });

    return {
      value: signal.impact,
      confidence: signal.confidence,
      timestamp: Date.now(),
    };
  }

  private updateNetwork(result: NetworkNode) {
    const network = this.networkState.value;
    network.set(result.value.immediate.toString(), result);
    this.networkState.next(network);
  }

  injectTrust(signal: TrustSignal) {
    this.trustStream.next(signal);
  }

  observeTrust(): Observable<Map<string, NetworkNode>> {
    return this.networkState.asObservable();
  }

  getCurrentImpact(): { immediate: number; sustainable: number; growth: number } {
    const network = this.networkState.value;
    return Array.from(network.values()).reduce(
      (acc, node) => ({
        immediate: acc.immediate + node.value.immediate,
        sustainable: acc.sustainable + node.value.sustainable,
        growth: acc.growth + (node.value.growth || 1),
      }),
      { immediate: 0, sustainable: 0, growth: 1 }
    );
  }
}
