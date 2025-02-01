import { Observable } from 'rxjs';
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
export declare class TrustNetwork {
  private static instance;
  private valueFlow;
  private flowEngine;
  private trustStream;
  private networkState;
  private constructor();
  static getInstance(): TrustNetwork;
  private initializeTrustNetwork;
  private validateTrust;
  private enrichTrust;
  private calculateNetworkEffect;
  private processTrust;
  private updateNetwork;
  injectTrust(signal: TrustSignal): void;
  observeTrust(): Observable<Map<string, any>>;
  getCurrentImpact(): {
    immediate: number;
    sustainable: number;
    growth: number;
  };
}
export {};
