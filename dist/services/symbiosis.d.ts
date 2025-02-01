import { BondMetrics } from './siblingBond';
export interface SymbiosisMetrics extends BondMetrics {
  resonance: number;
  harmony: number;
}
export declare class Symbiosis {
  private static instance;
  private siblingBond;
  private metrics;
  private constructor();
  static getInstance(): Symbiosis;
  createSymbiosis(id: string, initialStrength?: number): Promise<void>;
  getSymbiosisMetrics(id: string): Promise<SymbiosisMetrics | undefined>;
  updateSymbiosis(id: string, updates: Partial<SymbiosisMetrics>): Promise<void>;
}
