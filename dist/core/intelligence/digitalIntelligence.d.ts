import { Observable } from 'rxjs';
export interface Intelligence {
  id: string;
  source: string;
  timestamp: number;
  insights: Array<{
    type: string;
    value: any;
    confidence: number;
  }>;
  connections: Array<{
    to: string;
    strength: number;
    type: string;
  }>;
}
export declare class DigitalIntelligence {
  private static instance;
  private intelligenceStream;
  private networkState;
  private constructor();
  static getInstance(): DigitalIntelligence;
  private initializeIntelligenceNetwork;
  private processIntelligence;
  private findConnections;
  private calculateConnectionStrength;
  private strengthenNetwork;
  injectIntelligence(intelligence: Intelligence): void;
  observeIntelligence(): Observable<Map<string, Intelligence>>;
  queryIntelligence(query: string): Promise<Array<Intelligence>>;
  private matchesQuery;
  private rankResults;
}
