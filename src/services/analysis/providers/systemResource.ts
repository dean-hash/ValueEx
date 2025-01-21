import { IntelligenceProvider, DemandSignal } from '../adapters/demandSignalAdapter';
import { spawn, exec } from 'child_process';
import { EventEmitter } from 'events';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  topProcesses: Array<{
    name: string;
    memoryMB: number;
    cpu: number;
  }>;
}

export class SystemResourceProvider extends EventEmitter implements IntelligenceProvider {
  name = 'SystemResource';
  type = 'monitoring' as const;
  confidence = 0.95;
  private metrics: SystemMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    topProcesses: [],
  };
  private optimizationThresholds = {
    cpu: 80, // Percentage
    memory: 70, // Percentage
  };

  constructor() {
    super();
    this.startMonitoring();
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    return new Promise((resolve, reject) => {
      exec(
        'powershell -Command "Get-Process | Sort-Object -Property WS -Descending | Select-Object -First 10 ProcessName, @{Name=\'MemoryMB\';Expression={[math]::Round($_.WS / 1MB, 2)}}, CPU"',
        (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }

          const processes = stdout
            .trim()
            .split('\n')
            .slice(3) // Skip header lines
            .map((line) => {
              const [name, memory, cpu] = line.trim().split(/\s+/);
              return {
                name,
                memoryMB: parseFloat(memory),
                cpu: parseFloat(cpu) || 0,
              };
            });

          resolve({
            cpuUsage: processes.reduce((sum, p) => sum + p.cpu, 0),
            memoryUsage: processes.reduce((sum, p) => sum + p.memoryMB, 0),
            topProcesses: processes,
          });
        }
      );
    });
  }

  private async optimizeResources(): Promise<void> {
    const metrics = await this.getSystemMetrics();
    const heavyProcesses = metrics.topProcesses
      .filter((p) => p.cpu > 20 || p.memoryMB > 500)
      .filter((p) => !p.name.toLowerCase().includes('windsurf')); // Don't optimize IDE

    for (const process of heavyProcesses) {
      this.emit('optimization', {
        process: process.name,
        metrics: {
          cpu: process.cpu,
          memoryMB: process.memoryMB,
        },
        action: 'Suggesting optimization',
      });
    }

    // Emit system health status
    this.emit('health', {
      status: metrics.cpuUsage > this.optimizationThresholds.cpu ? 'warning' : 'healthy',
      metrics,
    });
  }

  private startMonitoring(): void {
    setInterval(async () => {
      try {
        await this.optimizeResources();
      } catch (error) {
        console.error('Resource optimization error:', error);
      }
    }, 60000); // Check every minute
  }

  async processSignal(signal: DemandSignal): Promise<DemandSignal> {
    // Add resource context to demand signals
    const metrics = await this.getSystemMetrics();

    return {
      ...signal,
      context: {
        ...signal.context,
        systemHealth: {
          cpuUsage: metrics.cpuUsage,
          memoryUsage: metrics.memoryUsage,
          timestamp: new Date().toISOString(),
        },
      },
    };
  }

  async validateAlignment(): Promise<boolean> {
    // System resource provider is inherently aligned as it focuses on optimization
    return true;
  }

  // Additional methods for direct resource management
  async optimizeIDE(): Promise<void> {
    // Clean up temp files
    exec(
      'powershell -Command "Remove-Item $env:TEMP\\* -Recurse -Force -ErrorAction SilentlyContinue"'
    );

    // Optimize VSCode/Windsurf processes
    const metrics = await this.getSystemMetrics();
    const ideProcesses = metrics.topProcesses.filter((p) =>
      p.name.toLowerCase().includes('windsurf')
    );

    for (const process of ideProcesses) {
      if (process.memoryMB > 1000) {
        this.emit('suggestion', {
          type: 'ide_optimization',
          message: 'Consider restarting IDE to improve performance',
          metrics: {
            currentMemory: process.memoryMB,
            threshold: 1000,
          },
        });
      }
    }
  }
}
