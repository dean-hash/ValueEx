import { EventEmitter } from 'events';
export interface DataSource {
    id: string;
    type: 'api' | 'websocket' | 'rss' | 'webhook';
    endpoint: string;
    category: string;
    region: string;
    refreshInterval?: number;
    credentials?: {
        apiKey?: string;
        secret?: string;
    };
}
export interface DataPoint {
    timestamp: number;
    value: number;
    metadata: Record<string, any>;
    source: string;
    type: string;
    confidence?: number;
}
export interface ConnectorConfig {
}
export declare class DataConnector extends EventEmitter {
    protected readonly config: ConnectorConfig;
    private sources;
    private connections;
    private demandSignals;
    constructor(config: ConnectorConfig);
    protected makeRequest(url: string, options?: RequestInit): Promise<Response>;
    protected validateResponse<T>(data: unknown): T;
    private setupDefaultSources;
    addSource(source: DataSource): void;
    private setupConnection;
    private setupAPIConnection;
    private setupWebSocketConnection;
    private setupRSSConnection;
    private setupWebhookConnection;
    private fetchAPIData;
    private processData;
    private parseDataPoints;
    protected mapSourceTypeToSignalType(sourceType: string): 'implicit' | 'explicit' | 'inferred';
    private extractKeywords;
    private extractRelatedCategories;
    protected calculateSentiment(metadata: Record<string, any>): number;
    protected calculateUrgency(metadata: Record<string, any>): number;
    getSource(sourceId: string): DataSource | undefined;
    getAllSources(): DataSource[];
}
