import { logger } from '../utils/logger';

interface SecurityConfig {
  enableAuditLogging: boolean;
  sensitiveKeys: string[];
  sanitizationRules: Record<string, RegExp>;
}

class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig = {
    enableAuditLogging: true,
    sensitiveKeys: ['api_key', 'apikey', 'secret', 'password', 'token', 'credential'],
    sanitizationRules: {
      apiKey: /(['"]\s*)(sk-[a-zA-Z0-9]{48})(\s*['"])/g,
      email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g,
    },
  };

  private constructor() {
    this.initializeSecurityMonitoring();
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  private initializeSecurityMonitoring(): void {
    process.on('uncaughtException', (error) => {
      this.handleSecurityError(error);
    });

    process.on('unhandledRejection', (reason) => {
      this.handleSecurityError(reason as Error);
    });
  }

  private handleSecurityError(error: Error): void {
    const sanitizedError = this.sanitizeError(error);
    logger.error('Security Error:', sanitizedError);
  }

  sanitizeError(error: Error): Error {
    let errorString = error.stack || error.message;

    // Sanitize sensitive information
    Object.entries(this.config.sanitizationRules).forEach(([key, regex]) => {
      errorString = errorString.replace(regex, `[REDACTED_${key.toUpperCase()}]`);
    });

    error.message = errorString;
    return error;
  }

  sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.config.sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

export const securityManager = SecurityManager.getInstance();
