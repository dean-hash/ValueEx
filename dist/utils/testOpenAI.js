"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gptService_1 = require("../services/gptService");
const dotenv_1 = require("dotenv");
const logger_1 = require("./logger");
// Load environment variables
(0, dotenv_1.config)();
async function testOpenAIConnection() {
    try {
        const gptService = gptService_1.GPTService.getInstance();
        logger_1.logger.info('Testing OpenAI connection...');
        const result = await gptService.analyzeMarketOpportunity('test product');
        logger_1.logger.info('Connection successful!');
        logger_1.logger.info('Test result:', result);
    }
    catch (error) {
        logger_1.logger.error('Error testing OpenAI connection:', error);
    }
}
// Run the test
testOpenAIConnection();
//# sourceMappingURL=testOpenAI.js.map