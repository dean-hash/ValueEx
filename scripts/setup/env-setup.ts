import { logger } from '../../src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

class EnvSetup {
  private envPath = path.join(process.cwd(), '.env');
  private envExamplePath = path.join(process.cwd(), '.env.example');

  async setup(): Promise<void> {
    try {
      // Check if .env exists
      if (!fs.existsSync(this.envPath)) {
        logger.info('Creating new .env file from template...');
        fs.copyFileSync(this.envExamplePath, this.envPath);
      }

      // Load current env file
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const exampleContent = fs.readFileSync(this.envExamplePath, 'utf8');

      // Find missing variables
      const missingVars = this.findMissingVariables(envContent, exampleContent);

      if (missingVars.length > 0) {
        logger.warn('Missing environment variables detected:', missingVars);
        logger.info('Please set these variables in your .env file');
      }

      // Validate environment variables
      this.validateEnvVariables();

      logger.info('Environment setup complete! 🚀');
    } catch (error) {
      logger.error('Error during environment setup:', error);
      throw error;
    }
  }

  private findMissingVariables(envContent: string, exampleContent: string): string[] {
    const exampleVars = this.parseEnvFile(exampleContent);
    const currentVars = this.parseEnvFile(envContent);

    return exampleVars.filter((v) => !currentVars.includes(v));
  }

  private parseEnvFile(content: string): string[] {
    return content
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'))
      .map((line) => line.split('=')[0]);
  }

  private validateEnvVariables(): void {
    const requiredVars = [
      'OPENAI_API_KEY', 
      'EMAIL_HOST', 
      'EMAIL_USER', 
      'DATABASE_URL',
      // Firebase Configuration
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_DATABASE_URL',
      // Gemini Configuration
      'GEMINI_API_KEY'
    ];

    const missingRequired = requiredVars.filter((varName) => !process.env[varName]);

    if (missingRequired.length > 0) {
      logger.warn('Required environment variables not set:', missingRequired);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new EnvSetup();
  setup
    .setup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
