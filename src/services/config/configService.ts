class ConfigService {
  private config: Map<string, any> = new Map();

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    // Load from environment variables
    this.config.set('GOOGLE_TRENDS_API_KEY', process.env.GOOGLE_TRENDS_API_KEY || '');
    this.config.set('OLLAMA_API_URL', process.env.OLLAMA_API_URL || 'http://localhost:11434');
    this.config.set('MAX_BATCH_SIZE', parseInt(process.env.MAX_BATCH_SIZE || '10', 10));
    this.config.set('PROCESSING_TIMEOUT', parseInt(process.env.PROCESSING_TIMEOUT || '30000', 10));
    this.config.set('RETRY_ATTEMPTS', parseInt(process.env.RETRY_ATTEMPTS || '3', 10));
    this.config.set('CACHE_ENABLED', process.env.CACHE_ENABLED !== 'false');
  }

  get(key: string): any {
    return this.config.get(key);
  }

  set(key: string, value: any): void {
    this.config.set(key, value);
  }
}

export const configService = new ConfigService();
