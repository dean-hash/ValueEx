"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const digitalIntelligence_1 = require("../../services/digitalIntelligence");
const demandValidator_1 = require("../../services/mvp/demandValidator");
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const intelligence = new digitalIntelligence_1.DigitalIntelligence();
        const validator = demandValidator_1.DemandValidator.getInstance();
        const analysis = await intelligence.analyzeNeed(content);
        const validation = await validator.validateDemand(content);
        return res.status(200).json({ analysis, validation });
    }
    catch (error) {
        console.error('Error analyzing demand:', error);
        return res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=analyze-demand.js.map