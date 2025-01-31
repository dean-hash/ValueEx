import express, { Request, Response } from 'express';
import path from 'path';
import { logger } from './utils/logger';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;

// Serve static files from the visualization directory
app.use(express.static(path.join(__dirname, 'visualization')));

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  logger.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Serve the dashboard
app.get('/', (_req: Request, res: Response) => {
  try {
    res.sendFile(path.join(__dirname, 'visualization', 'dashboard.html'));
  } catch (error) {
    logger.error('Error serving dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

app
  .listen(port, () => {
    logger.info(`Dashboard running at http://localhost:${port}`);
  })
  .on('error', (error: Error) => {
    logger.error('Server failed to start:', error);
    process.exit(1);
  });
