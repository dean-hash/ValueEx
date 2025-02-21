import { config } from 'dotenv';
import winston from 'winston';

// Load test environment variables
config({ path: '.env.test' });

// Configure test logger
export const testLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: 'logs/test.log',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
});
