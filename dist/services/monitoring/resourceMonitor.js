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
exports.ResourceMonitor = void 0;
const events_1 = require("events");
const metrics_1 = require("./metrics");
const logger_1 = require("../../utils/logger");
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
class ResourceMonitor extends events_1.EventEmitter {
    constructor(metricsCollector) {
        super();
        this.snapshots = [];
        this.MAX_SNAPSHOTS = 1000;
        this.ALERT_THRESHOLDS = {
            cpu: 80, // 80% usage
            memory: 85, // 85% usage
            disk: 90, // 90% usage
            latency: 1000, // 1 second
        };
        this.metrics = metricsCollector || new metrics_1.MetricsCollector();
    }
    startMonitoring(interval = 5000) {
        if (this.monitoringTimer) {
            return;
        }
        this.monitoringTimer = setInterval(async () => {
            try {
                const snapshot = await this.captureSnapshot();
                this.snapshots.push(snapshot);
                // Maintain snapshot window
                if (this.snapshots.length > this.MAX_SNAPSHOTS) {
                    this.snapshots.shift();
                }
                // Update metrics
                this.updateMetrics(snapshot);
            }
            catch (error) {
                logger_1.logger.error('Error in resource monitoring:', error);
            }
        }, interval);
    }
    stopMonitoring() {
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = undefined;
        }
    }
    async captureSnapshot() {
        try {
            const cpuUsage = process.cpuUsage();
            const memUsage = process.memoryUsage();
            const snapshot = {
                timestamp: Date.now(),
                cpu: {
                    usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
                    load: os.loadavg(),
                },
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    heapUsed: memUsage.heapUsed,
                    heapTotal: memUsage.heapTotal,
                },
                disk: await this.getDiskUsage(),
                network: await this.getNetworkMetrics(),
            };
            this.checkThresholds(snapshot);
            return snapshot;
        }
        catch (error) {
            logger_1.logger.error('Error capturing resource snapshot:', error);
            throw error;
        }
    }
    async getDiskUsage() {
        return new Promise((resolve, reject) => {
            fs.statfs('.', (err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }
                const total = stats.blocks * stats.bsize;
                const free = stats.bfree * stats.bsize;
                const used = total - free;
                resolve({
                    total,
                    free,
                    used,
                });
            });
        });
    }
    async getNetworkMetrics() {
        try {
            // Get network interface stats
            const networkInterfaces = os.networkInterfaces();
            let bytesIn = 0;
            let bytesOut = 0;
            // Sum up bytes across all interfaces
            Object.values(networkInterfaces).forEach((interfaces) => {
                interfaces.forEach((iface) => {
                    if (!iface.internal) {
                        bytesIn += iface.bytes?.received || 0;
                        bytesOut += iface.bytes?.sent || 0;
                    }
                });
            });
            // Measure latency with a simple ping
            const startTime = Date.now();
            await new Promise((resolve) => setTimeout(resolve, 100));
            const latency = Date.now() - startTime;
            return {
                latency,
                bytesIn,
                bytesOut,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting network metrics:', error);
            return {
                latency: 0,
                bytesIn: 0,
                bytesOut: 0,
            };
        }
    }
    async getMemoryUsage() {
        const memUsage = process.memoryUsage();
        const previousSnapshots = this.snapshots.slice(-10);
        let leakCount = 0;
        if (previousSnapshots.length >= 10) {
            const memoryTrend = previousSnapshots.map((s) => s.memory.used);
            const isIncreasing = memoryTrend.every((val, i) => i === 0 || val > memoryTrend[i - 1]);
            if (isIncreasing && memUsage.heapUsed > memUsage.heapTotal * 0.8) {
                leakCount++;
            }
        }
        return {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            free: memUsage.heapTotal - memUsage.heapUsed,
            leaks: leakCount,
        };
    }
    updateMetrics(snapshot) {
        this.metrics.recordApiMetrics('system', {
            requests: 1,
            errors: 0,
            latency: 0,
        });
    }
    async getResourceSnapshots(seconds) {
        const cutoff = Date.now() - seconds * 1000;
        return this.snapshots.filter((s) => s.timestamp >= cutoff);
    }
    clearHistory() {
        this.snapshots = [];
    }
    checkThresholds(snapshot) {
        // TO DO: implement threshold checking
    }
}
exports.ResourceMonitor = ResourceMonitor;
//# sourceMappingURL=resourceMonitor.js.map