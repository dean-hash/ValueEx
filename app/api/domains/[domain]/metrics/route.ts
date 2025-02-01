import { NextRequest, NextResponse } from 'next/server';
import { PortfolioAnalyzer } from '@/services/domain/portfolioAnalyzer';
import { DomainMetrics } from '@/types/domain';

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
): Promise<NextResponse<DomainMetrics | { error: string }>> {
  try {
    const analyzer = PortfolioAnalyzer.getInstance();
    const metrics = await analyzer.getDomainMetrics(params.domain);

    if (!metrics) {
      return NextResponse.json({ error: 'Domain metrics not found' }, { status: 404 });
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error(`Error fetching metrics for domain ${params.domain}:`, error);
    return NextResponse.json({ error: 'Failed to fetch domain metrics' }, { status: 500 });
  }
}
