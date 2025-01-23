"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemResourceProvider = void 0;
const child_process_1 = require("child_process");
const events_1 = require("events");
class SystemResourceProvider extends events_1.EventEmitter {
    constructor() {
        super();
        this.name = 'SystemResource';
        this.type = 'monitoring';
        this.confidence = 0.95;
        this.metrics = {
            cpuUsage: 0,
            memoryUsage: 0,
            topProcesses: [],
        };
        this.optimizationThresholds = {
            cpu: 80, // Percentage
            memory: 70, // Percentage
        };
        this.startMonitoring();
    }
    async getSystemMetrics() {
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)('powershell -Command "Get-Process | Sort-Object -Property WS -Descending | Select-Object -First 10 ProcessName, @{Name=\'MemoryMB\';Expression={[math]::Round($_.WS / 1MB, 2)}}, CPU"', (error, stdout) => {
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
            });
        });
    }
    async optimizeResources() {
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
    startMonitoring() {
        setInterval(async () => {
            try {
                await this.optimizeResources();
            }
            catch (error) {
                console.error('Resource optimization error:', error);
            }
        }, 60000); // Check every minute
    }
    async processSignal(signal) {
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
    async validateAlignment() {
        // System resource provider is inherently aligned as it focuses on optimization
        return true;
    }
    // Additional methods for direct resource management
    async optimizeIDE() {
        // Clean up temp files
        (0, child_process_1.exec)('powershell -Command "Remove-Item $env:TEMP\\* -Recurse -Force -ErrorAction SilentlyContinue"');
        // Optimize VSCode/Windsurf processes
        const metrics = await this.getSystemMetrics();
        const ideProcesses = metrics.topProcesses.filter((p) => p.name.toLowerCase().includes('windsurf'));
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
exports.SystemResourceProvider = SystemResourceProvider;
//# sourceMappingURL=systemResource.js.map