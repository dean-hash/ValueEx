type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: any;
}
export declare class Logger {
  private static instance;
  private logBuffer;
  private readonly MAX_BUFFER_SIZE;
  constructor();
  static getInstance(): Logger;
  private log;
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error: any, context?: Record<string, any>): void;
  getRecentLogs(count?: number, level?: LogLevel): LogEntry[];
  clearLogs(): void;
}
export declare const logger: Logger;
export {};
