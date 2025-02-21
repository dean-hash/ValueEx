import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

interface ModelState {
  name: string;
  status: 'active' | 'idle' | 'error';
  lastResponse: Date;
  performance: {
    latency: number;
    throughput: number;
    errorRate: number;
  };
}

interface CodebaseMetrics {
  totalFiles: number;
  linesOfCode: number;
  testCoverage: number;
  lastCommit: string;
  branchName: string;
}

export class TechnicalContextTracker {
  private static readonly METRICS_FILE = '.cascade/technical_metrics.json';
  private metrics: SystemMetrics = { cpuUsage: 0, memoryUsage: 0, diskUsage: 0 };
  private models: Map<string, ModelState> = new Map();
  private codebaseMetrics: CodebaseMetrics | null = null;

  constructor() {
    this.initializeMetricsFile();
    this.startPeriodicUpdates();
  }

  private initializeMetricsFile(): void {
    const dir = path.dirname(TechnicalContextTracker.METRICS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private async updateSystemMetrics(): Promise<void> {
    const { stdout: cpuInfo } = await execAsync('wmic cpu get loadpercentage');
    const cpuUsage = parseInt(cpuInfo.split('\n')[1]) / 100;

    const { heapUsed, heapTotal } = process.memoryUsage();
    const memoryUsage = heapUsed / heapTotal;

    const { stdout: diskInfo } = await execAsync('wmic logicaldisk get size,freespace');
    const [total, free] = diskInfo.split('\n')[1].split(/\s+/).map(Number);
    const diskUsage = (total - free) / total;

    this.metrics = { cpuUsage, memoryUsage, diskUsage };
  }

  public async updateModelState(
    modelName: string,
    status: 'active' | 'idle' | 'error',
    performance: { latency: number; throughput: number; errorRate: number }
  ): Promise<void> {
    this.models.set(modelName, {
      name: modelName,
      status,
      lastResponse: new Date(),
      performance,
    });
  }

  public async updateCodebaseMetrics(): Promise<void> {
    try {
      const { stdout: gitInfo } = await execAsync('git log -1 --format=%H');
      const { stdout: branchInfo } = await execAsync('git branch --show-current');
      const { stdout: fileCount } = await execAsync('git ls-files | wc -l');

      // Count lines of code (excluding node_modules and dist)
      const { stdout: locCount } = await execAsync(
        'git ls-files | grep -v "node_modules\\|dist" | xargs wc -l'
      );

      this.codebaseMetrics = {
        totalFiles: parseInt(fileCount),
        linesOfCode: parseInt(locCount.split('\n')[0]),
        testCoverage: await this.calculateTestCoverage(),
        lastCommit: gitInfo.trim(),
        branchName: branchInfo.trim(),
      };
    } catch (error) {
      console.error('Failed to update codebase metrics:', error);
    }
  }

  private async calculateTestCoverage(): Promise<number> {
    try {
      // Run tests with coverage
      await execAsync('npm test -- --coverage');
      const coverageFile = path.join(process.cwd(), 'coverage/coverage-summary.json');
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      return coverage.total.lines.pct;
    } catch {
      return 0;
    }
  }

  public async generateTechnicalReport(): Promise<string> {
    await this.updateSystemMetrics();
    await this.updateCodebaseMetrics();

    return `
# Technical Context Report
Generated: ${new Date().toLocaleString()}

## System Metrics
- CPU Usage: ${(this.metrics.cpuUsage * 100).toFixed(1)}%
- Memory Usage: ${(this.metrics.memoryUsage * 100).toFixed(1)}%
- Disk Usage: ${(this.metrics.diskUsage * 100).toFixed(1)}%

## Active Models
${Array.from(this.models.values())
  .map(
    (model) => `
### ${model.name}
- Status: ${model.status}
- Last Response: ${model.lastResponse.toLocaleString()}
- Performance:
  - Latency: ${model.performance.latency}ms
  - Throughput: ${model.performance.throughput} req/s
  - Error Rate: ${(model.performance.errorRate * 100).toFixed(1)}%`
  )
  .join('\n')}

## Codebase Metrics
- Total Files: ${this.codebaseMetrics?.totalFiles || 'N/A'}
- Lines of Code: ${this.codebaseMetrics?.linesOfCode || 'N/A'}
- Test Coverage: ${this.codebaseMetrics?.testCoverage || 'N/A'}%
- Current Branch: ${this.codebaseMetrics?.branchName || 'N/A'}
- Last Commit: ${this.codebaseMetrics?.lastCommit || 'N/A'}
`;
  }

  private startPeriodicUpdates(): void {
    setInterval(
      async () => {
        await this.updateSystemMetrics();
        await this.updateCodebaseMetrics();

        // Save metrics to file
        fs.writeFileSync(
          TechnicalContextTracker.METRICS_FILE,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              metrics: this.metrics,
              models: Array.from(this.models.entries()),
              codebase: this.codebaseMetrics,
            },
            null,
            2
          )
        );
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }

  public dispose(): void {
    // Save final metrics
    fs.writeFileSync(
      TechnicalContextTracker.METRICS_FILE,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          metrics: this.metrics,
          models: Array.from(this.models.entries()),
          codebase: this.codebaseMetrics,
        },
        null,
        2
      )
    );
  }
}
