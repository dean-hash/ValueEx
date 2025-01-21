import { NextRequest, NextResponse } from 'next/server';
import { PortfolioAnalyzer } from '../../../../../src/services/domain/portfolioAnalyzer';

export async function GET(request: NextRequest, { params }: { params: { domain: string } }) {
  try {
    const analyzer = PortfolioAnalyzer.getInstance();
    const recommendations = await analyzer.getAffiliateRecommendations(params.domain);
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error(`Error getting affiliate recommendations for ${params.domain}:`, error);
    return NextResponse.json({ error: 'Failed to get affiliate recommendations' }, { status: 500 });
  }
}
