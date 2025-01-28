import { NextApiRequest, NextApiResponse } from 'next';
import { MatchingEngine } from '../../services/matching/matchingEngine';
import { logger } from '../../utils/logger';

interface Match {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  matchScore: number;
  tags: string[];
  url: string;
}

interface MatchRequest {
  query: string;
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    categories?: string[];
    tags?: string[];
  };
  limit?: number;
}

interface MatchResponse {
  matches: Match[];
  totalResults: number;
  executionTime: number;
}

const matchingEngine = MatchingEngine.getInstance();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MatchResponse>
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({
      matches: [],
      totalResults: 0,
      executionTime: 0,
    });
    return;
  }

  try {
    const startTime = Date.now();
    const { query, filters, limit = 10 } = req.body as MatchRequest;

    if (!query) {
      res.status(400).json({
        matches: [],
        totalResults: 0,
        executionTime: 0,
      });
      return;
    }

    const matches = await matchingEngine.findMatches(query, filters);
    const limitedMatches = matches.slice(0, limit).map((product) => ({
      id: product.id,
      title: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      matchScore: product.matchScore,
      tags: product.tags,
      url: product.url,
    }));

    res.status(200).json({
      matches: limitedMatches,
      totalResults: matches.length,
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Error in match endpoint:', error);
    res.status(500).json({
      matches: [],
      totalResults: 0,
      executionTime: 0,
    });
  }
}
