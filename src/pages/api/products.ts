import { NextApiRequest, NextApiResponse } from 'next';
import { AwinClient } from '../../services/affiliate/awinClient';
import { OpportunityMatcher } from '../../services/affiliate/opportunityMatcher';

const awinClient = new AwinClient(process.env.AWIN_API_TOKEN || '29f5f656-d632-4cdd-b0c1-e4ad3f1fd0e2');
const matcher = new OpportunityMatcher(awinClient);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const matches = await matcher.findHighValueMatches();
    return res.status(200).json(matches);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
