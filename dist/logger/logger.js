"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    constructor() {
        if (!Logger.instance) {
            Logger.instance = this;
        }
        return Logger.instance;
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    info(message, meta) {
        console.log(`[INFO] ${message}`, meta || '');
    }
    warn(message, meta) {
        console.warn(`[WARN] ${message}`, meta || '');
    }
    error(message, meta) {
        console.error(`[ERROR] ${message}`, meta || '');
    }
    debug(message, meta) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${message}`, meta || '');
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map