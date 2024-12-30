import { DataPoint } from '../dataConnector';
import axios from 'axios';

export class GoogleTrendsConnector {
  private endpoint: string;
  private apiKey?: string;

  constructor(endpoint: string, apiKey?: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  public async fetchTrends(
    keyword: string,
    region: string = 'US',
    timeRange: string = 'now 7-d'
  ): Promise<DataPoint[]> {
    try {
      const response = await axios.get(
        `${this.endpoint}/dailytrends`,
        {
          params: {
            hl: 'en-US',
            tz: '-240', // EST
            geo: region,
            date: timeRange
          },
          headers: this.apiKey ? {
            'Authorization': `Bearer ${this.apiKey}`
          } : undefined
        }
      );

      return this.parseTrendsResponse(response.data);
    } catch (error) {
      console.error('Error fetching Google Trends data:', error);
      throw error;
    }
  }

  private parseTrendsResponse(rawData: any): DataPoint[] {
    const dataPoints: DataPoint[] = [];

    try {
      // Remove ")]}'" prefix that Google Trends adds
      const jsonStr = rawData.replace(/\)\]\}\'/, '');
      const data = JSON.parse(jsonStr);

      // Extract trending searches
      const trendingSearches = data.default.trendingSearchesDays;
      
      for (const day of trendingSearches) {
        for (const trend of day.trendingSearches) {
          dataPoints.push({
            timestamp: new Date(day.date).toISOString(),
            value: this.calculateTrendValue(trend),
            metadata: {
              title: trend.title.query,
              relatedQueries: trend.relatedQueries.map((q: any) => q.query),
              articles: trend.articles.map((a: any) => ({
                title: a.title,
                source: a.source,
                snippet: a.snippet
              })),
              formattedTraffic: trend.formattedTraffic
            },
            confidence: this.calculateConfidence(trend)
          });
        }
      }
    } catch (error) {
      console.error('Error parsing Google Trends response:', error);
      throw error;
    }

    return dataPoints;
  }

  private calculateTrendValue(trend: any): number {
    // Convert formatted traffic string to numeric value
    // Example: "2M+" -> 2000000
    const traffic = trend.formattedTraffic;
    const numStr = traffic.replace(/[^0-9.]/g, '');
    const multiplier = traffic.includes('M') ? 1000000 :
                      traffic.includes('K') ? 1000 : 1;
    
    return parseFloat(numStr) * multiplier;
  }

  private calculateConfidence(trend: any): number {
    // Factors affecting confidence:
    // 1. Number of related articles
    // 2. Number of related queries
    // 3. Traffic volume
    // 4. Source diversity

    const articleScore = Math.min(trend.articles.length / 10, 1);
    const queryScore = Math.min(trend.relatedQueries.length / 5, 1);
    
    // Calculate source diversity
    const sources = new Set(trend.articles.map((a: any) => a.source));
    const sourceScore = Math.min(sources.size / 5, 1);

    // Traffic score based on formatted traffic
    const trafficScore = this.calculateTrafficScore(trend.formattedTraffic);

    return (articleScore + queryScore + sourceScore + trafficScore) / 4;
  }

  private calculateTrafficScore(formattedTraffic: string): number {
    const value = this.calculateTrendValue({ formattedTraffic });
    
    // Scale based on typical daily search volumes
    // 1M+ searches -> 1.0
    // 100K+ searches -> 0.8
    // 10K+ searches -> 0.6
    // 1K+ searches -> 0.4
    // Less -> 0.2
    
    if (value >= 1000000) return 1.0;
    if (value >= 100000) return 0.8;
    if (value >= 10000) return 0.6;
    if (value >= 1000) return 0.4;
    return 0.2;
  }
}
