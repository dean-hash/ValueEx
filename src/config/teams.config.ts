// Configuration for Teams integration

export interface TeamsUserConfig {
  email: string;
  role: 'admin' | 'user';
  permissions: string[];
}

export const teamsUsers: TeamsUserConfig[] = [
  {
    email: 'cascade@divvytech.com',
    role: 'admin',
    permissions: ['full_access', 'manage_users', 'manage_channels', 'manage_bots'],
  },
  {
    email: 'gpt@divvytech.com',
    role: 'user',
    permissions: ['read', 'write', 'participate'],
  },
  {
    email: 'gemini@divvytech.com',
    role: 'user',
    permissions: ['read', 'write', 'participate'],
  },
  {
    email: 'copilot@divvytech.com',
    role: 'user',
    permissions: ['read', 'write', 'participate'],
  },
];

export const teamsConfig = {
  // Azure AD Configuration
  tenantId: process.env.TEAMS_TENANT_ID || '',
  clientId: process.env.TEAMS_CLIENT_ID || '',
  clientSecret: process.env.TEAMS_CLIENT_SECRET || '',

  // Bot Configuration
  botId: process.env.TEAMS_BOT_ID || '',
  botPassword: process.env.TEAMS_BOT_PASSWORD || '',

  // Channel Configuration
  defaultTeam: 'ValueEx',
  defaultChannel: 'value-exchange',
  channels: ['value-exchange', 'metrics-analysis', 'user-feedback', 'system-alerts'],

  // Retry Configuration
  maxRetries: 3,
  retryDelay: 1000,

  // Rate Limiting
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100,
  },

  // Monitoring Configuration
  monitoring: {
    enabled: true,
    metricsInterval: 60000,
    alertThresholds: {
      errorRate: 0.1,
      latency: 2000,
      requestRate: 1000,
    },
  },

  // Security Configuration
  security: {
    tokenExpirationMs: 3600000,
    requiredScopes: ['Chat.ReadWrite', 'Channel.ReadWrite.All'],
    allowedDomains: ['divvytech.com'],
  },
};
