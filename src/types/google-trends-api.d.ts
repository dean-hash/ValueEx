declare module 'google-trends-api' {
  interface TrendsOptions {
    keyword: string;
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
    property?: string;
    resolution?: string;
  }

  interface InterestOverTimeResult {
    default: {
      timelineData: Array<{
        time: string;
        formattedTime: string;
        formattedAxisTime: string;
        value: number[];
        hasData: boolean;
      }>;
    };
  }

  interface RelatedQueriesResult {
    default: {
      rankedList: Array<{
        rankedKeyword: Array<{
          query: string;
          value: number;
          link: string;
          hasData: boolean;
        }>;
      }>;
    };
  }

  interface RegionalInterestResult {
    default: {
      geoMapData: Array<{
        geoCode: string;
        geoName: string;
        value: number[];
        hasData: boolean;
      }>;
    };
  }

  function interestOverTime(options: TrendsOptions): Promise<string>;
  function relatedQueries(options: TrendsOptions): Promise<string>;
  function interestByRegion(options: TrendsOptions): Promise<string>;

  export default {
    interestOverTime,
    relatedQueries,
    interestByRegion,
  };
}
