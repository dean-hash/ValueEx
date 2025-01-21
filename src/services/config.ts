export class ConfigService {
  private config: Record<string, any>;

  constructor() {
    this.config = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
      },
      awin: {
        apiKey: process.env.AWIN_API_KEY,
        publisherId: process.env.AWIN_PUBLISHER_ID,
      },
      monitoring: {
        metricsInterval: 60000, // 1 minute
        resourceCheckInterval: 300000, // 5 minutes
      },
    };
  }

  getOpenAIConfig() {
    return this.config.openai;
  }

  getAwinConfig() {
    return this.config.awin;
  }

  getMonitoringConfig() {
    return this.config.monitoring;
  }
}
