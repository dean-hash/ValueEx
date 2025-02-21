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
exports.ContextMonitor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
class ContextMonitor extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.metrics = {
            contextSize: 0,
            memoryUsage: 0,
            responseLatency: 0,
            contextContinuity: 1,
        };
        this.metricsLog = [];
        this.logStream = null;
        this.checkInterval = null;
        this.lastCheck = Date.now();
        this.CHECK_INTERVAL = 5000; // 5 seconds
        this.config = config;
        this.LOG_FILE = path.join('.cascade', 'logs', 'context.log');
        this.METRICS_FILE = path.join('.cascade', 'metrics.json');
        this.initializeLogging();
        this.initialize();
    }
    initializeLogging() {
        if (this.config.logging.enabled) {
            const logDir = path.dirname(this.config.logging.file);
            fs.mkdirSync(logDir, { recursive: true });
            this.logStream = fs.createWriteStream(this.config.logging.file, { flags: 'a' });
            this.logStream.on('error', (err) => {
                console.error('Error writing to log file:', err);
            });
        }
    }
    async initialize() {
        try {
            // Ensure log directory exists
            await fs.promises.mkdir(path.join('.cascade', 'logs'), { recursive: true });
            // Start periodic checks
            this.checkInterval = setInterval(() => this.checkContextContinuity(), this.CHECK_INTERVAL);
            this.log('info', 'Context monitor initialized');
        }
        catch (error) {
            console.error('Failed to initialize context monitor:', error);
        }
    }
    async checkContextContinuity() {
        const now = Date.now();
        const timeSinceLastCheck = now - this.lastCheck;
        // Check for unusual gaps in monitoring
        if (timeSinceLastCheck > this.CHECK_INTERVAL * 2) {
            this.emit('contextLoss', {
                reason: 'monitoring_gap',
                duration: timeSinceLastCheck,
            });
        }
        // Update metrics
        await this.updateMetric('contextContinuity', 1.0);
        this.lastCheck = now;
        // Check for context loss
        if (this.metrics.contextContinuity < this.config.alerts.contextLoss.threshold) {
            this.log('warning', `Context continuity degraded: ${this.metrics.contextContinuity.toFixed(2)}`);
            this.emit('contextLoss', {
                continuity: this.metrics.contextContinuity,
                timestamp: now,
            });
        }
        // Update metrics
        this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        // Performance degradation check
        if (this.metrics.memoryUsage > this.config.alerts.performanceDegradation.threshold) {
            this.log('warning', `High memory usage detected: ${this.metrics.memoryUsage.toFixed(2)}MB`);
            this.emit('performanceDegradation', {
                memoryUsage: this.metrics.memoryUsage,
                timestamp: now,
            });
        }
    }
    async updateMetric(name, value) {
        const metric = {
            timestamp: new Date().toISOString(),
            metric: name,
            value,
        };
        this.metricsLog.push(metric);
        try {
            await fs.promises.writeFile(this.METRICS_FILE, JSON.stringify(this.metricsLog, null, 2));
        }
        catch (error) {
            console.error('Failed to write metrics:', error);
        }
        if (name === 'contextContinuity') {
            this.metrics.contextContinuity = value;
        }
    }
    log(level, message) {
        const logEntry = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}\n`;
        fs.appendFile(this.LOG_FILE, logEntry, (error) => {
            if (error) {
                console.error('Failed to write to log file:', error);
            }
        });
        // Emit events for important log levels
        if (level === 'warn' || level === 'error') {
            this.emit('contextAlert', { level, message });
        }
        if (this.logStream) {
            this.logStream.write(logEntry);
        }
    }
    getMetrics() {
        return [...this.metricsLog];
    }
    dispose() {
        clearInterval(this.checkInterval);
        if (this.logStream) {
            this.logStream.end();
        }
        this.log('info', 'Context monitor disposed');
    }
}
exports.ContextMonitor = ContextMonitor;
//# sourceMappingURL=contextMonitor.js.map