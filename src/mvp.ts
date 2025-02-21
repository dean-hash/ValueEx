import express from 'express';
import { TeamsService, ValueService } from './services/minimal';
import { requestLogger, errorLogger, getHealthMetrics } from './monitoring';

const app = express();
app.use(express.json());
app.use(requestLogger);

// Initialize services
const teamsService = new TeamsService();
const valueService = new ValueService();

// Initialize Teams integration
teamsService.initialize().catch(console.error);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json(getHealthMetrics());
});

// API Routes
app.post('/api/meetings/start', async (req, res, next) => {
  try {
    const { subject } = req.body;
    if (!subject) {
      throw new Error('Meeting subject is required');
    }
    const meeting = await teamsService.startMeeting(subject);
    res.json(meeting);
  } catch (error) {
    next(error);
  }
});

app.post('/api/value/measure', async (req, res, next) => {
  try {
    const { product, pattern } = req.body;
    if (!product || !pattern) {
      throw new Error('Product and pattern are required');
    }
    const metrics = await valueService.measureValue(product, pattern);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use(errorLogger);
app.use((error: Error, req: any, res: any, next: any) => {
  console.error('Error:', error);
  res.status(500).json({ error: error.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`ValueEx MVP running on port ${port}`);
});
