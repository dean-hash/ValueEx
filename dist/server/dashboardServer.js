"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const metricsCollector_1 = require("../services/metricsCollector");
const app = (0, express_1.default)();
const port = 3000;
// Serve static files from dashboard directory
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'dashboard')));
// API endpoint for metrics
app.get('/api/metrics', async (req, res) => {
    const metrics = await metricsCollector_1.MetricsCollector.getInstance().getMetricsSummary();
    res.json(metrics);
});
app.listen(port, () => {
    console.log(`Dashboard available at http://localhost:${port}`);
});
//# sourceMappingURL=dashboardServer.js.map