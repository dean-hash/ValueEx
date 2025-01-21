export class Logger {
  private static instance: Logger;

  constructor() {
    if (!Logger.instance) {
      Logger.instance = this;
    }
    return Logger.instance;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  info(message: string, meta?: Record<string, any>) {
    console.log(`[INFO] ${message}`, meta || '');
  }

  warn(message: string, meta?: Record<string, any>) {
    console.warn(`[WARN] ${message}`, meta || '');
  }

  error(message: string, meta?: Record<string, any>) {
    console.error(`[ERROR] ${message}`, meta || '');
  }

  debug(message: string, meta?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  }
}
