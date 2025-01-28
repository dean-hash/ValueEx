import axios from 'axios';

export class GoogleTrendsConnector {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getInterestOverTime(keyword: string): Promise<any> {
    try {
      const response = await axios.get(`https://trends.google.com/trends/api/explore`, {
        params: {
          hl: 'en-US',
          tz: -120,
          req: JSON.stringify({
            comparisonItem: [{ keyword, geo: 'US', time: 'today 12-m' }],
            category: 0,
            property: '',
          }),
          apiKey: this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Google Trends data:', error);
      return null;
    }
  }

  async getRelatedQueries(keyword: string): Promise<any> {
    try {
      const response = await axios.get(`https://trends.google.com/trends/api/relatedQueries`, {
        params: {
          hl: 'en-US',
          tz: -120,
          req: JSON.stringify({
            keyword,
            geo: 'US',
            time: 'today 12-m',
          }),
          apiKey: this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching related queries:', error);
      return null;
    }
  }
}
