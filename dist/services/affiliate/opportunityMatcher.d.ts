import { AwinClient } from './awinClient';
export declare class OpportunityMatcher {
  private readonly awinClient;
  constructor(awinClient: AwinClient);
  findHighValueMatches(): Promise<any>;
  private calculateOpportunityValue;
  private assessMatchQuality;
  private getMarketDemandScore;
  private generateQuickStartGuide;
}
