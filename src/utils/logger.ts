import winston from 'winston';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: any;
}

interface RevenueEvent {
  type: string;
  amount: number;
  timestamp: string;
}

class Logger {
  private static instance: Logger;
  private logger: winston.Logger;
  private revenueEvents: RevenueEvent[] = [];

  private constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
      ...(error && { error }),
    };

    this.logger.log(level, entry);
  }

  trackRevenueEvent(event: RevenueEvent) {
    this.revenueEvents.push(event);
    this.log('info', `Revenue event: ${event.type}`, event);
  }

  getRevenueEvents(): RevenueEvent[] {
    return this.revenueEvents;
  }

  error(message: string, error?: any, context?: Record<string, any>) {
    this.log('error', message, context, error);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  getRecentLogs(): LogEntry[] {
    // Return empty array as we're using console transport
    return [];
  }

  clearLogs(): void {
    // Not implemented as we're using console transport
  }
}

export const logger = Logger.getInstance();
