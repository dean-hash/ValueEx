import { DemandSource } from './demandSource';
import { ScrapedDemandSignal } from '../../types/demandTypes';
export declare class GoogleTrendsScraper implements DemandSource {
  name: string;
  private coordinator;
  private localIntelligence;
  constructor();
  scrape(query: string, options?: any): Promise<ScrapedDemandSignal[]>;
  private getInterestOverTime;
  private getRegionalInterest;
  private getRelatedQueries;
  private analyzeTrends;
  private calculateMomentum;
  private calculateVelocity;
  private calculateAcceleration;
  private calculateSeasonality;
  private createSignal;
  validateSignal(signal: ScrapedDemandSignal): boolean;
}
