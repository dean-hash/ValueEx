import axios from 'axios';
import { logger } from '../../utils/logger';
import { TrendData } from '../../types/trends';

interface TrendResponse {
  data: TrendData[];
  status: string;
}

interface RelatedQueriesResponse {
  default: {
    rankedKeyword: {
      query: string;
      value: number;
    }[];
  };
}

export class GoogleTrendsConnector {
  private static instance: GoogleTrendsConnector;
  private apiKey: string;

  private constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public static getInstance(apiKey: string): GoogleTrendsConnector {
    if (!GoogleTrendsConnector.instance) {
      GoogleTrendsConnector.instance = new GoogleTrendsConnector(apiKey);
    }
    return GoogleTrendsConnector.instance;
  }

  public async getInterestOverTime(keyword: string): Promise<TrendResponse> {
    try {
      const response = await axios.get(
        `https://trends.google.com/trends/api/widgetdata/interest-over-time`,
        {
          params: {
            keyword,
            apiKey: this.apiKey,
          },
        }
      );

      if (!response.data) {
        return {
          data: [],
          status: 'error',
        };
      }

      return response.data;
    } catch (error) {
      logger.error('Error getting interest over time:', error);
      return {
        data: [],
        status: 'error',
      };
    }
  }

  public async getRelatedQueries(keyword: string): Promise<RelatedQueriesResponse> {
    try {
      const response = await axios.get(
        `https://trends.google.com/trends/api/widgetdata/related-queries`,
        {
          params: {
            keyword,
            apiKey: this.apiKey,
          },
        }
      );

      if (!response.data) {
        return {
          default: {
            rankedKeyword: [],
          },
        };
      }

      return response.data;
    } catch (error) {
      logger.error('Error getting related queries:', error);
      return {
        default: {
          rankedKeyword: [],
        },
      };
    }
  }
}
