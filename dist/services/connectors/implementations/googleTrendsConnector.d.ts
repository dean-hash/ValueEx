import { DataConnector } from '../dataConnector';
import type { TrendData } from '../../../types/demandTypes';
export declare class GoogleTrendsConnector extends DataConnector {
    private readonly baseUrl;
    private readonly apiKey;
    constructor(apiKey: string);
    fetchTrendData(query: string): Promise<TrendData>;
    private validateResponse;
    private parseTrendData;
    private makeRequest;
}
