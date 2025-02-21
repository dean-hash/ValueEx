import express from 'express';
import { TeamsIntegration } from './services/teamsIntegration';
import { AudioStreamService } from './services/audioStreamService';
import { SpeechService } from './services/speechService';
import { ResonanceFieldService } from './services/resonanceField';
import { ValueCreationService } from './services/revenueMetricsService';
import { DynamicsService } from './integrations/dynamics365';
import { BusinessCentralService } from './integrations/businessCentral';
import { AwinService } from './services/awinService';
import { ErrorHandler } from './utils/errorHandler';

const app = express();
app.use(express.json());

// Initialize services
const teamsService = new TeamsIntegration();
const audioService = new AudioStreamService();
const speechService = new SpeechService();
const resonanceField = new ResonanceFieldService();
const dynamicsService = new DynamicsService();
const bcService = new BusinessCentralService();
const awinService = new AwinService();
const valueCreation = new ValueCreationService(
  resonanceField,
  awinService,
  dynamicsService,
  bcService
);

// Error handling
app.use(ErrorHandler.handleError);

// Initialize Teams integration
teamsService.initialize().catch(console.error);

// API Routes
app.post('/api/meetings/start', async (req, res) => {
  try {
    const { subject } = req.body;
    const meeting = await teamsService.startMeeting(subject);
    res.json(meeting);
  } catch (error) {
    ErrorHandler.handleError(error);
    res.status(500).json({ error: 'Failed to start meeting' });
  }
});

app.post('/api/value/measure', async (req, res) => {
  try {
    const { product, pattern } = req.body;
    const metrics = await valueCreation.measureValueCreation(product, pattern);
    res.json(metrics);
  } catch (error) {
    ErrorHandler.handleError(error);
    res.status(500).json({ error: 'Failed to measure value' });
  }
});

app.post('/api/speech/transcribe', async (req, res) => {
  try {
    const { audioConfig } = req.body;
    const text = await speechService.speechToText(audioConfig);
    res.json({ text });
  } catch (error) {
    ErrorHandler.handleError(error);
    res.status(500).json({ error: 'Failed to transcribe speech' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`ValueEx MVP running on port ${port}`);
});
