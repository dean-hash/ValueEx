"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.ServiceError = void 0;
class ServiceError extends Error {
    constructor(message, code, service, recoverable = true, originalError) {
        super(message);
        this.code = code;
        this.service = service;
        this.recoverable = recoverable;
        this.originalError = originalError;
        this.name = 'ServiceError';
    }
}
exports.ServiceError = ServiceError;
class ErrorHandler {
    static async handleError(error) {
        if (error instanceof ServiceError) {
            await this.handleServiceError(error);
        }
        else {
            console.error('Unexpected error:', error);
            throw error;
        }
    }
    static async handleServiceError(error) {
        console.error(`[${error.service}] Error ${error.code}: ${error.message}`);
        if (error.recoverable) {
            await this.attemptRecovery(error);
        }
        else {
            throw error;
        }
    }
    static async attemptRecovery(error) {
        switch (error.service) {
            case 'Teams':
                await this.recoverTeamsService(error);
                break;
            case 'Speech':
                await this.recoverSpeechService(error);
                break;
            case 'Communication':
                await this.recoverCommunicationService(error);
                break;
            case 'Metrics':
                await this.recoverMetricsService(error);
                break;
            default:
                throw error;
        }
    }
    static async recoverTeamsService(error) {
        switch (error.code) {
            case 'AUTH_FAILED':
                // Attempt to refresh token
                await this.refreshTokens();
                break;
            case 'CALL_DROPPED':
                // Attempt to rejoin call
                await this.reconnectCall();
                break;
            default:
                throw error;
        }
    }
    static async recoverSpeechService(error) {
        switch (error.code) {
            case 'RECOGNITION_FAILED':
                // Restart speech recognition
                await this.restartSpeechRecognition();
                break;
            case 'SYNTHESIS_FAILED':
                // Retry text-to-speech
                await this.retrySpeechSynthesis();
                break;
            default:
                throw error;
        }
    }
    static async recoverCommunicationService(error) {
        switch (error.code) {
            case 'TOKEN_EXPIRED':
                await this.refreshTokens();
                break;
            case 'CONNECTION_LOST':
                await this.reconnectCommunication();
                break;
            default:
                throw error;
        }
    }
    static async recoverMetricsService(error) {
        switch (error.code) {
            case 'PROCESSING_FAILED':
                // Retry metrics processing
                await this.retryMetricsProcessing();
                break;
            default:
                throw error;
        }
    }
    // Recovery implementations
    static async refreshTokens() {
        // Implement token refresh logic
    }
    static async reconnectCall() {
        // Implement call reconnection logic
    }
    static async restartSpeechRecognition() {
        // Implement speech recognition restart logic
    }
    static async retrySpeechSynthesis() {
        // Implement speech synthesis retry logic
    }
    static async reconnectCommunication() {
        // Implement communication reconnection logic
    }
    static async retryMetricsProcessing() {
        // Implement metrics processing retry logic
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=errorHandler.js.map