import { DataConnector } from '../dataConnector';
import type { TrendData, RelatedQueryData, RegionalInterestData } from '../../../types/demandTypes';

interface GoogleTrendsResponse {
  readonly data: {
    readonly timelineData: Array<{
      readonly time: string;
      readonly value: number[];
      readonly formattedTime: string;
    }>;
    readonly averages?: number[];
    readonly status: string;
  };
}

export class GoogleTrendsConnector extends DataConnector {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    super({ type: 'trends', id: 'google-trends' });
    this.baseUrl = 'https://trends.google.com/trends/api';
    this.apiKey = apiKey;
  }

  public async fetchTrendData(query: string): Promise<TrendData> {
    if (!query.trim()) {
      throw new Error('Query cannot be empty');
    }

    try {
      const response = await this.makeRequest('/dailytrends', { query, geo: 'US' });
      const data = await this.validateResponse(response);
      return this.parseTrendData(data, query);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch trend data: ${error.message}`);
      }
      throw new Error('Unknown error occurred while fetching trend data');
    }
  }

  private async validateResponse(response: Response): Promise<GoogleTrendsResponse> {
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.timelineData) {
      throw new Error('Invalid response format from Google Trends API');
    }

    return data;
  }

  private parseTrendData(response: GoogleTrendsResponse, query: string): TrendData {
    const latestDataPoint = response.data.timelineData[response.data.timelineData.length - 1];

    if (!latestDataPoint) {
      throw new Error('No trend data available');
    }

    return {
      query,
      timestamp: new Date(parseInt(latestDataPoint.time) * 1000).toISOString(),
      value: latestDataPoint.value[0] || 0,
      metadata: {
        formattedTime: latestDataPoint.formattedTime,
        average: response.data.averages?.[0] || 0,
        status: response.data.status,
      },
    };
  }

  private async makeRequest(endpoint: string, params: Record<string, string>): Promise<Response> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }
}
