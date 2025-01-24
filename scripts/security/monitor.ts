import { securityManager } from '../../src/config/security';
import { logger } from '../../src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

class SecurityMonitor {
  private excludedDirs = ['node_modules', '.git', 'dist', 'build', '.next'];

  async scanDirectory(dir: string): Promise<void> {
    const files = await fs.promises.readdir(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.promises.stat(fullPath);

      if (stat.isDirectory()) {
        if (!this.excludedDirs.includes(file)) {
          await this.scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        await this.scanFile(fullPath);
      }
    }
  }

  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const sanitized = securityManager.sanitizeObject({ content });

      if (sanitized.content !== content) {
        logger.warn(`Potential sensitive data found in: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Error scanning file ${filePath}:`, error);
    }
  }
}

const monitor = new SecurityMonitor();
monitor
  .scanDirectory(process.cwd())
  .then(() => logger.info('Security scan complete'))
  .catch((error) => logger.error('Security scan failed:', error));
