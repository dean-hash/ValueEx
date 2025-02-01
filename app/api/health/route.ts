import { NextResponse } from 'next/server';
import { HealthMonitor } from '@/core/qa/healthMonitor';
import { MetricsCollector } from '@/core/qa/metricsCollector';

interface HealthResponse {
  status: string;
  metrics: {
    cpu: number;
    memory: number;
    latency: number;
    uptime: number;
  };
  lastChecked: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  try {
    const monitor = HealthMonitor.getInstance();
    const collector = MetricsCollector.getInstance();

    const healthStatus = await monitor.checkHealth();
    const metrics = await collector.collectSystemMetrics();

    const response: HealthResponse = {
      status: healthStatus.status,
      metrics: {
        cpu: metrics.cpu,
        memory: metrics.memory,
        latency: metrics.latency,
        uptime: metrics.uptime,
      },
      lastChecked: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        metrics: { cpu: 0, memory: 0, latency: 0, uptime: 0 },
        lastChecked: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
