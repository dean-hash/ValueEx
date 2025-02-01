export declare class ServiceError extends Error {
  readonly code: string;
  readonly service: string;
  readonly recoverable: boolean;
  readonly originalError?: Error;
  constructor(
    message: string,
    code: string,
    service: string,
    recoverable?: boolean,
    originalError?: Error
  );
}
export declare class ErrorHandler {
  static handleError(error: Error | ServiceError): Promise<void>;
  private static handleServiceError;
  private static attemptRecovery;
  private static recoverTeamsService;
  private static recoverSpeechService;
  private static recoverCommunicationService;
  private static recoverMetricsService;
  private static refreshTokens;
  private static reconnectCall;
  private static restartSpeechRecognition;
  private static retrySpeechSynthesis;
  private static reconnectCommunication;
  private static retryMetricsProcessing;
}
