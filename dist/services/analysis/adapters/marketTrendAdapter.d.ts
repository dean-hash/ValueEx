import { EventEmitter } from 'events';
interface MarketTrend {
  category: string;
  region: string;
  trend: number;
  velocity: number;
  signals: {
    source: string;
    strength: number;
    keywords: string[];
  }[];
}
interface TrendSignal {
  timestamp: string;
  value: number;
  source: string;
  keywords: string[];
  confidence: number;
}
export declare class MarketTrendAdapter extends EventEmitter {
  private static instance;
  private activeSignals;
  private trendCache;
  private constructor();
  static getInstance(): MarketTrendAdapter;
  private setupSignalProcessing;
  addSignal(category: string, region: string, signal: TrendSignal): Promise<void>;
  private processSignals;
  private calculateTrend;
  private calculateVelocity;
  private calculateSourceStrength;
  private extractKeywords;
  getTrend(category: string, region: string): MarketTrend | null;
  getAllTrends(): MarketTrend[];
  private processActiveSignals;
}
export {};
