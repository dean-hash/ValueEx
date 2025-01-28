import { NextApiRequest, NextApiResponse } from 'next';
import { MetricsCollector } from '../../services/metrics/metricsCollector';
import { logger } from '../../utils/logger';

interface StatsResponse {
  totalMatches: number;
  averageMatchScore: number;
  totalProducts: number;
  topCategories: { category: string; count: number }[];
  lastUpdated: string;
}

const metrics = MetricsCollector.getInstance();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse>
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({
      totalMatches: 0,
      averageMatchScore: 0,
      totalProducts: 0,
      topCategories: [],
      lastUpdated: new Date().toISOString(),
    });
    return;
  }

  try {
    const stats = await metrics.getMetrics();

    res.status(200).json({
      totalMatches: stats.totalMatches,
      averageMatchScore: stats.averageMatchScore,
      totalProducts: stats.totalProducts,
      topCategories: stats.topCategories,
      lastUpdated: stats.lastUpdated,
    });
  } catch (error) {
    logger.error('Error in stats endpoint:', error);
    res.status(500).json({
      totalMatches: 0,
      averageMatchScore: 0,
      totalProducts: 0,
      topCategories: [],
      lastUpdated: new Date().toISOString(),
    });
  }
}
