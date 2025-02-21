"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qa_1 = require("./core/qa");
const intelligenceField_1 = require("./core/unified/intelligenceField");
async function initializeSystem() {
    console.log('Initializing ValueEx system...');
    // Initialize resonance field
    const resonanceField = intelligenceField_1.ResonanceField.getInstance();
    await resonanceField.initialize();
    // Initialize QA system
    const qa = qa_1.qaSystem;
    // Set up global error handling
    process.on('uncaughtException', (error) => {
        qa.handleError(error);
    });
    process.on('unhandledRejection', (reason, promise) => {
        qa.handleRejection(reason, promise);
    });
    // Start monitoring
    const status = qa.getSystemStatus();
    console.log('System initialized:', status);
}
initializeSystem().catch(console.error);
//# sourceMappingURL=startup.js.map