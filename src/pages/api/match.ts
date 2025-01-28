import { NextApiRequest, NextApiResponse } from 'next';
import { RevenueTracker } from '../../services/affiliate/revenueTracker';
import { logger } from '../../utils/logger';

interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  affiliateUrl: string;
}

function getAffiliateUrl(productId: string, userId: string): string {
  const awinPubId = process.env.AWIN_PUBLISHER_ID;
  const clickRef = `${productId}:${userId}:${Date.now()}`;

  switch (productId) {
    case 'jasper':
      return `https://jasper.ai/?fpr=${awinPubId}&clickref=${clickRef}`;
    case 'midjourney':
      return `https://www.midjourney.com/account/?ref=${awinPubId}&clickref=${clickRef}`;
    case 'anthropic':
      return `https://www.anthropic.com/claude?ref=${awinPubId}&clickref=${clickRef}`;
    default:
      throw new Error(`Unknown product ID: ${productId}`);
  }
}

const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  {
    id: 'jasper',
    name: 'Jasper AI',
    description: 'AI writing assistant that helps you create content 10X faster',
    price: 49,
    affiliateUrl: '' // Will be set dynamically
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    description: 'Create beautiful artwork using artificial intelligence',
    price: 10,
    affiliateUrl: '' // Will be set dynamically
  },
  {
    id: 'anthropic',
    name: 'Claude',
    description: 'Advanced AI assistant for writing, analysis, and coding',
    price: 20,
    affiliateUrl: '' // Will be set dynamically
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, userId } = req.body;

    if (!query || !userId) {
      return res.status(400).json({ error: 'Query and userId are required' });
    }

    if (!process.env.AWIN_PUBLISHER_ID) {
      logger.error('AWIN_PUBLISHER_ID not set');
      return res.status(500).json({ error: 'Affiliate tracking not configured' });
    }

    logger.info(`Matching query "${query}" for user ${userId}`);

    // Simple matching based on query
    const matches = AFFILIATE_PRODUCTS.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase())
    ).map(product => ({
      ...product,
      affiliateUrl: getAffiliateUrl(product.id, userId)
    }));

    logger.info(`Found ${matches.length} matches for query "${query}"`);

    // Track each match as a revenue opportunity
    const revenueTracker = RevenueTracker.getInstance();
    for (const match of matches) {
      await revenueTracker.trackClick({
        productId: match.id,
        userId,
        query,
        timestamp: new Date(),
        affiliateUrl: match.affiliateUrl
      });
    }

    return res.status(200).json({ matches });
  } catch (error) {
    logger.error('Error in match API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
