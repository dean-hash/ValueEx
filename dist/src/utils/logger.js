"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
var Logger = /** @class */ (function () {
    function Logger() {
        this.logBuffer = [];
        this.MAX_BUFFER_SIZE = 1000;
    }
    Logger.getInstance = function () {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    };
    Logger.prototype.log = function (level, message, context, error) {
        var entry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            context: context,
            error: error,
        };
        // Add to buffer
        this.logBuffer.push(entry);
        // Trim buffer if too large
        if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
            this.logBuffer = this.logBuffer.slice(-this.MAX_BUFFER_SIZE);
        }
        // Console output in development
        if (process.env.NODE_ENV === 'development') {
            var contextStr = context ? " ".concat(JSON.stringify(context)) : '';
            if (error) {
                console.error("[".concat(entry.timestamp, "] ").concat(level.toUpperCase(), ": ").concat(message).concat(contextStr), error);
            }
            else {
                console.log("[".concat(entry.timestamp, "] ").concat(level.toUpperCase(), ": ").concat(message).concat(contextStr));
            }
        }
    };
    Logger.prototype.debug = function (message, context) {
        this.log('debug', message, context);
    };
    Logger.prototype.info = function (message, context) {
        this.log('info', message, context);
    };
    Logger.prototype.warn = function (message, context) {
        this.log('warn', message, context);
    };
    Logger.prototype.error = function (message, error, context) {
        this.log('error', message, context, error);
    };
    Logger.prototype.getRecentLogs = function (count, level) {
        if (count === void 0) { count = 100; }
        var logs = this.logBuffer;
        if (level) {
            logs = logs.filter(function (log) { return log.level === level; });
        }
        return logs.slice(-count);
    };
    Logger.prototype.clearLogs = function () {
        this.logBuffer = [];
    };
    return Logger;
}());
exports.Logger = Logger;
exports.logger = Logger.getInstance();
