import { EventEmitter } from 'events';
interface ValueFlow {
  source: string;
  amount: number;
  timestamp: Date;
  impactCategory: 'education' | 'research' | 'community' | 'development';
  beneficiary: string;
  transparencyHash: string;
}
interface ImpactMetrics {
  directBeneficiaries: number;
  communityGrowth: number;
  resourcesDistributed: number;
  collaborationScore: number;
}
export declare class ValueDistributionManager extends EventEmitter {
  private static instance;
  private flows;
  private metrics;
  private constructor();
  static getInstance(): ValueDistributionManager;
  recordValueFlow(flow: Omit<ValueFlow, 'timestamp' | 'transparencyHash'>): Promise<string>;
  private generateTransparencyHash;
  getImpactMetrics(category: string): Promise<ImpactMetrics | null>;
  private updateMetrics;
  private calculateCollaborationScore;
  private initializeMetrics;
  generateTransparencyReport(): Promise<string>;
}
export {};
