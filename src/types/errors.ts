export class ResonanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResonanceError';
  }
}

export class RetryableError extends Error {
  originalError: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'RetryableError';
    this.originalError = originalError || new Error('Unknown error');
  }
}
