import { EventEmitter } from 'events';
export interface IntelligenceEvent {
  sourceId: string;
  type: 'external' | 'internal';
  operation: string;
  status?: 'success' | 'error';
  params?: Record<string, any>;
  data?: any;
  error?: string;
}
declare class IntelligenceCoordinator extends EventEmitter {
  private static instance;
  private sources;
  private constructor();
  static getInstance(): IntelligenceCoordinator;
  private setupEventHandlers;
  private handleRequest;
  private handleResponse;
  private handleError;
  getSources(): string[];
}
export default IntelligenceCoordinator;
