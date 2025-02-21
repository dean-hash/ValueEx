"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
class Logger {
    constructor() {
        this.logBuffer = [];
        this.MAX_BUFFER_SIZE = 1000;
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    log(level, message, context, error) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            error,
        };
        // Add to buffer
        this.logBuffer.push(entry);
        // Trim buffer if too large
        if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
            this.logBuffer = this.logBuffer.slice(-this.MAX_BUFFER_SIZE);
        }
        // Console output in development
        if (process.env.NODE_ENV === 'development') {
            const contextStr = context ? ` ${JSON.stringify(context)}` : '';
            if (error) {
                console.error(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`, error);
            }
            else {
                console.log(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`);
            }
        }
    }
    debug(message, context) {
        this.log('debug', message, context);
    }
    info(message, context) {
        this.log('info', message, context);
    }
    warn(message, context) {
        this.log('warn', message, context);
    }
    error(message, error, context) {
        this.log('error', message, context, error);
    }
    getRecentLogs(count = 100, level) {
        let logs = this.logBuffer;
        if (level) {
            logs = logs.filter((log) => log.level === level);
        }
        return logs.slice(-count);
    }
    clearLogs() {
        this.logBuffer = [];
    }
}
exports.Logger = Logger;
exports.logger = Logger.getInstance();
//# sourceMappingURL=logger.js.map