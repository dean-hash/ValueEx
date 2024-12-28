import express from 'express';
import path from 'path';
import { MetricsCollector } from '../services/metricsCollector';

const app = express();
const port = 3000;

// Serve static files from dashboard directory
app.use(express.static(path.join(__dirname, '..', 'dashboard')));

// API endpoint for metrics
app.get('/api/metrics', async (req, res) => {
  const metrics = await MetricsCollector.getInstance().getMetricsSummary();
  res.json(metrics);
});

app.listen(port, () => {
  console.log(`Dashboard available at http://localhost:${port}`);
});
