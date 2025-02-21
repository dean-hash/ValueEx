import { NextRequest, NextResponse } from 'next/server';
import { PortfolioAnalyzer } from '../../../../../src/services/domain/portfolioAnalyzer';

export async function GET(request: NextRequest, { params }: { params: { domain: string } }) {
  try {
    const analyzer = PortfolioAnalyzer.getInstance();
    const metrics = await analyzer.analyzeDomainMetrics(params.domain);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error(`Error analyzing domain ${params.domain}:`, error);
    return NextResponse.json({ error: 'Failed to analyze domain' }, { status: 500 });
  }
}
