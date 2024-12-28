import { z } from 'zod';

const configSchema = z.object({
  awin: z.object({
    apiToken: z.string(),
    publisherId: z.string(),
  }),
  environment: z.enum(['development', 'production', 'test']).default('development'),
});

type Config = z.infer<typeof configSchema>;

// Load configuration from environment variables
const config: Config = {
  awin: {
    apiToken: process.env.AWIN_API_TOKEN || '29f5f656-d632-4cdd-b0c1-e4ad3f1fd0e2',
    publisherId: process.env.AWIN_PUBLISHER_ID || '671175',
  },
  environment: (process.env.NODE_ENV as Config['environment']) || 'development',
};

// Validate configuration
configSchema.parse(config);

export { config, Config };
