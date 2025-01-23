"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const logger_1 = require("./logger");
class IntelligenceCoordinator extends events_1.EventEmitter {
    constructor() {
        super();
        this.sources = new Set();
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!IntelligenceCoordinator.instance) {
            IntelligenceCoordinator.instance = new IntelligenceCoordinator();
        }
        return IntelligenceCoordinator.instance;
    }
    setupEventHandlers() {
        this.on('source:request', this.handleRequest.bind(this));
        this.on('source:response', this.handleResponse.bind(this));
        this.on('source:error', this.handleError.bind(this));
    }
    handleRequest(event) {
        this.sources.add(event.sourceId);
        logger_1.logger.debug('Intelligence request received', event);
    }
    handleResponse(event) {
        logger_1.logger.debug('Intelligence response received', event);
    }
    handleError(event) {
        logger_1.logger.error('Intelligence error occurred', event);
    }
    getSources() {
        return Array.from(this.sources);
    }
}
exports.default = IntelligenceCoordinator;
//# sourceMappingURL=intelligenceCoordinator.js.map