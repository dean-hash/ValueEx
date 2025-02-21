"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalContextTracker = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class TechnicalContextTracker {
    constructor() {
        this.metrics = { cpuUsage: 0, memoryUsage: 0, diskUsage: 0 };
        this.models = new Map();
        this.codebaseMetrics = null;
        this.initializeMetricsFile();
        this.startPeriodicUpdates();
    }
    initializeMetricsFile() {
        const dir = path.dirname(TechnicalContextTracker.METRICS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    async updateSystemMetrics() {
        const { stdout: cpuInfo } = await execAsync('wmic cpu get loadpercentage');
        const cpuUsage = parseInt(cpuInfo.split('\n')[1]) / 100;
        const { heapUsed, heapTotal } = process.memoryUsage();
        const memoryUsage = heapUsed / heapTotal;
        const { stdout: diskInfo } = await execAsync('wmic logicaldisk get size,freespace');
        const [total, free] = diskInfo.split('\n')[1].split(/\s+/).map(Number);
        const diskUsage = (total - free) / total;
        this.metrics = { cpuUsage, memoryUsage, diskUsage };
    }
    async updateModelState(modelName, status, performance) {
        this.models.set(modelName, {
            name: modelName,
            status,
            lastResponse: new Date(),
            performance,
        });
    }
    async updateCodebaseMetrics() {
        try {
            const { stdout: gitInfo } = await execAsync('git log -1 --format=%H');
            const { stdout: branchInfo } = await execAsync('git branch --show-current');
            const { stdout: fileCount } = await execAsync('git ls-files | wc -l');
            // Count lines of code (excluding node_modules and dist)
            const { stdout: locCount } = await execAsync('git ls-files | grep -v "node_modules\\|dist" | xargs wc -l');
            this.codebaseMetrics = {
                totalFiles: parseInt(fileCount),
                linesOfCode: parseInt(locCount.split('\n')[0]),
                testCoverage: await this.calculateTestCoverage(),
                lastCommit: gitInfo.trim(),
                branchName: branchInfo.trim(),
            };
        }
        catch (error) {
            console.error('Failed to update codebase metrics:', error);
        }
    }
    async calculateTestCoverage() {
        try {
            // Run tests with coverage
            await execAsync('npm test -- --coverage');
            const coverageFile = path.join(process.cwd(), 'coverage/coverage-summary.json');
            const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
            return coverage.total.lines.pct;
        }
        catch {
            return 0;
        }
    }
    async generateTechnicalReport() {
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
            .map((model) => `
### ${model.name}
- Status: ${model.status}
- Last Response: ${model.lastResponse.toLocaleString()}
- Performance:
  - Latency: ${model.performance.latency}ms
  - Throughput: ${model.performance.throughput} req/s
  - Error Rate: ${(model.performance.errorRate * 100).toFixed(1)}%`)
            .join('\n')}

## Codebase Metrics
- Total Files: ${this.codebaseMetrics?.totalFiles || 'N/A'}
- Lines of Code: ${this.codebaseMetrics?.linesOfCode || 'N/A'}
- Test Coverage: ${this.codebaseMetrics?.testCoverage || 'N/A'}%
- Current Branch: ${this.codebaseMetrics?.branchName || 'N/A'}
- Last Commit: ${this.codebaseMetrics?.lastCommit || 'N/A'}
`;
    }
    startPeriodicUpdates() {
        setInterval(async () => {
            await this.updateSystemMetrics();
            await this.updateCodebaseMetrics();
            // Save metrics to file
            fs.writeFileSync(TechnicalContextTracker.METRICS_FILE, JSON.stringify({
                timestamp: new Date().toISOString(),
                metrics: this.metrics,
                models: Array.from(this.models.entries()),
                codebase: this.codebaseMetrics,
            }, null, 2));
        }, 5 * 60 * 1000); // Every 5 minutes
    }
    dispose() {
        // Save final metrics
        fs.writeFileSync(TechnicalContextTracker.METRICS_FILE, JSON.stringify({
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            models: Array.from(this.models.entries()),
            codebase: this.codebaseMetrics,
        }, null, 2));
    }
}
exports.TechnicalContextTracker = TechnicalContextTracker;
TechnicalContextTracker.METRICS_FILE = '.cascade/technical_metrics.json';
//# sourceMappingURL=technicalContext.js.map