import { NextApiRequest, NextApiResponse } from 'next';
import { PortfolioAnalyzer } from '../../../../src/services/domain/portfolioAnalyzer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { domain } = req.query;

  if (!domain || Array.isArray(domain)) {
    return res.status(400).json({ message: 'Invalid domain parameter' });
  }

  try {
    const analyzer = PortfolioAnalyzer.getInstance();
    const recommendations = await analyzer.getAffiliateRecommendations(domain);
    res.status(200).json(recommendations);
  } catch (error) {
    console.error(`Error getting affiliate recommendations for ${domain}:`, error);
    res.status(500).json({ message: 'Error getting affiliate recommendations' });
  }
}
