"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthMetrics = exports.errorLogger = exports.requestLogger = void 0;
var winston_1 = __importDefault(require("winston"));
var perf_hooks_1 = require("perf_hooks");
// Configure Winston logger
var logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' })
    ]
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple()
    }));
}
// Performance metrics
var metrics = {
    requestCount: 0,
    avgResponseTime: 0,
    errors: 0,
    lastError: null
};
// Middleware for request logging and metrics
var requestLogger = function (req, res, next) {
    var start = perf_hooks_1.performance.now();
    metrics.requestCount++;
    // Log request
    logger.info({
        type: 'request',
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body
    });
    // Track response
    res.on('finish', function () {
        var duration = perf_hooks_1.performance.now() - start;
        metrics.avgResponseTime = (metrics.avgResponseTime + duration) / 2;
        logger.info({
            type: 'response',
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: duration
        });
    });
    next();
};
exports.requestLogger = requestLogger;
// Error logging middleware
var errorLogger = function (err, req, res, next) {
    metrics.errors++;
    metrics.lastError = err;
    logger.error({
        type: 'error',
        message: err.message,
        stack: err.stack,
        method: req.method,
        path: req.path
    });
    next(err);
};
exports.errorLogger = errorLogger;
// Health check endpoint data
var getHealthMetrics = function () {
    var _a;
    return ({
        status: 'healthy',
        uptime: process.uptime(),
        metrics: {
            requestCount: metrics.requestCount,
            avgResponseTime: metrics.avgResponseTime.toFixed(2) + 'ms',
            errorCount: metrics.errors,
            lastError: (_a = metrics.lastError) === null || _a === void 0 ? void 0 : _a.message
        }
    });
};
exports.getHealthMetrics = getHealthMetrics;
