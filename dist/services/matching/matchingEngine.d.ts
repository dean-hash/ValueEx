import { DemandSignal } from '../analysis/adapters/demandSignalAdapter';
export interface Match {
  id: string;
  name: string;
  quality: number;
  features?: string[];
  opportunities?: string[];
  recommendations?: string[];
}
export declare class MatchingEngine {
  findMatches(signal: DemandSignal): Promise<Match[]>;
}
