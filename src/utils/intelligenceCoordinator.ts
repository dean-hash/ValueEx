import { EventEmitter } from 'events';
import { logger } from './logger';

export interface IntelligenceEvent {
  sourceId: string;
  type: 'external' | 'internal';
  operation: string;
  status?: 'success' | 'error';
  params?: Record<string, any>;
  data?: any;
  error?: string;
}

class IntelligenceCoordinator extends EventEmitter {
  private static instance: IntelligenceCoordinator;
  private sources: Set<string> = new Set();

  private constructor() {
    super();
    this.setupEventHandlers();
  }

  public static getInstance(): IntelligenceCoordinator {
    if (!IntelligenceCoordinator.instance) {
      IntelligenceCoordinator.instance = new IntelligenceCoordinator();
    }
    return IntelligenceCoordinator.instance;
  }

  private setupEventHandlers() {
    this.on('source:request', this.handleRequest.bind(this));
    this.on('source:response', this.handleResponse.bind(this));
    this.on('source:error', this.handleError.bind(this));
  }

  private handleRequest(event: IntelligenceEvent) {
    this.sources.add(event.sourceId);
    logger.debug('Intelligence request received', event);
  }

  private handleResponse(event: IntelligenceEvent) {
    logger.debug('Intelligence response received', event);
  }

  private handleError(event: IntelligenceEvent) {
    logger.error('Intelligence error occurred', event);
  }

  public getSources(): string[] {
    return Array.from(this.sources);
  }
}

export default IntelligenceCoordinator;
