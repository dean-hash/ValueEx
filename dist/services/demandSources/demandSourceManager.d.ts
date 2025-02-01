import { ScrapedDemandSignal } from '../../types/demandTypes';
export interface DemandSource {
  name: string;
  weight: number;
  scrape(query: string, options?: any): Promise<ScrapedDemandSignal[]>;
  validateSignal(signal: ScrapedDemandSignal): boolean;
}
export declare class DemandSourceManager {
  private sources;
  private sourceWeights;
  constructor();
  registerSource(name: string, source: DemandSource, weight: number): void;
  private normalizeWeights;
  gatherDemandSignals(query: string, options?: any): Promise<ScrapedDemandSignal[]>;
  private aggregateSignals;
  private getSignalKey;
  private aggregateSignalGroup;
  private rankSignals;
}
