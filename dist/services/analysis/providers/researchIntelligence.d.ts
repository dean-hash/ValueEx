import { IntelligenceProvider, DemandSignal } from '../adapters/demandSignalAdapter';
export declare class ResearchIntelligenceProvider implements IntelligenceProvider {
  name: string;
  type: 'research';
  confidence: number;
  private model;
  constructor(model?: string);
  private queryModel;
  processSignal(signal: DemandSignal): Promise<DemandSignal>;
  validateAlignment(): Promise<boolean>;
}
