import { NextApiRequest, NextApiResponse } from 'next';
import { RevenueTracker } from '../../services/affiliate/revenueTracker';
import { logger } from '../../utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const revenueTracker = RevenueTracker.getInstance();
    const stats = await revenueTracker.getStats();
    const recentEvents = logger.getRevenueEvents().slice(-10);
    
    return res.status(200).json({
      ...stats,
      recentEvents
    });
  } catch (error) {
    logger.error('Error getting stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
