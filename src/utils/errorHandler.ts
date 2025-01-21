export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly service: string,
    public readonly recoverable: boolean = true,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class ErrorHandler {
  static async handleError(error: Error | ServiceError): Promise<void> {
    if (error instanceof ServiceError) {
      await this.handleServiceError(error);
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }

  private static async handleServiceError(error: ServiceError): Promise<void> {
    console.error(`[${error.service}] Error ${error.code}: ${error.message}`);
    
    if (error.recoverable) {
      await this.attemptRecovery(error);
    } else {
      throw error;
    }
  }

  private static async attemptRecovery(error: ServiceError): Promise<void> {
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

  private static async recoverTeamsService(error: ServiceError): Promise<void> {
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

  private static async recoverSpeechService(error: ServiceError): Promise<void> {
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

  private static async recoverCommunicationService(error: ServiceError): Promise<void> {
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

  private static async recoverMetricsService(error: ServiceError): Promise<void> {
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
  private static async refreshTokens(): Promise<void> {
    // Implement token refresh logic
  }

  private static async reconnectCall(): Promise<void> {
    // Implement call reconnection logic
  }

  private static async restartSpeechRecognition(): Promise<void> {
    // Implement speech recognition restart logic
  }

  private static async retrySpeechSynthesis(): Promise<void> {
    // Implement speech synthesis retry logic
  }

  private static async reconnectCommunication(): Promise<void> {
    // Implement communication reconnection logic
  }

  private static async retryMetricsProcessing(): Promise<void> {
    // Implement metrics processing retry logic
  }
}
