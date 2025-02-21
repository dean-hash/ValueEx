"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const teamsIntegration_1 = require("./services/teamsIntegration");
const audioStreamService_1 = require("./services/audioStreamService");
const speechService_1 = require("./services/speechService");
const resonanceField_1 = require("./services/resonanceField");
const revenueMetricsService_1 = require("./services/revenueMetricsService");
const dynamics365_1 = require("./integrations/dynamics365");
const businessCentral_1 = require("./integrations/businessCentral");
const awinService_1 = require("./services/awinService");
const errorHandler_1 = require("./utils/errorHandler");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Initialize services
const teamsService = new teamsIntegration_1.TeamsIntegration();
const audioService = new audioStreamService_1.AudioStreamService();
const speechService = new speechService_1.SpeechService();
const resonanceField = new resonanceField_1.ResonanceFieldService();
const dynamicsService = new dynamics365_1.DynamicsService();
const bcService = new businessCentral_1.BusinessCentralService();
const awinService = new awinService_1.AwinService();
const valueCreation = new revenueMetricsService_1.ValueCreationService(resonanceField, awinService, dynamicsService, bcService);
// Error handling
app.use(errorHandler_1.ErrorHandler.handleError);
// Initialize Teams integration
teamsService.initialize().catch(console.error);
// API Routes
app.post('/api/meetings/start', async (req, res) => {
    try {
        const { subject } = req.body;
        const meeting = await teamsService.startMeeting(subject);
        res.json(meeting);
    }
    catch (error) {
        errorHandler_1.ErrorHandler.handleError(error);
        res.status(500).json({ error: 'Failed to start meeting' });
    }
});
app.post('/api/value/measure', async (req, res) => {
    try {
        const { product, pattern } = req.body;
        const metrics = await valueCreation.measureValueCreation(product, pattern);
        res.json(metrics);
    }
    catch (error) {
        errorHandler_1.ErrorHandler.handleError(error);
        res.status(500).json({ error: 'Failed to measure value' });
    }
});
app.post('/api/speech/transcribe', async (req, res) => {
    try {
        const { audioConfig } = req.body;
        const text = await speechService.speechToText(audioConfig);
        res.json({ text });
    }
    catch (error) {
        errorHandler_1.ErrorHandler.handleError(error);
        res.status(500).json({ error: 'Failed to transcribe speech' });
    }
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`ValueEx MVP running on port ${port}`);
});
//# sourceMappingURL=index.js.map