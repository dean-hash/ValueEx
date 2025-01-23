export interface GoogleTrendsTimelineData {
    time: string;
    value: number[];
    formattedTime: string;
}
export interface GoogleTrendsResult {
    default: {
        timelineData: GoogleTrendsTimelineData[];
        averages?: number[];
        keywords?: string[];
    };
}
export interface TrendData {
    time: string;
    value: number;
    formattedTime: string;
}
export interface TrendMetrics {
    momentum: number;
    volume: number;
    velocity: number;
    acceleration: number;
    seasonality: number;
    geographicSpread: Record<string, number>;
}
export interface RegionalInterestData {
    geoCode: string;
    geoName: string;
    value: number[];
}
export interface RelatedQueryData {
    query: string;
    value: number;
    formattedValue: string;
    link: string;
}
export interface GoogleTrendsError {
    message: string;
    status: string;
}
