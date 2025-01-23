"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const affiliateManager_1 = require("../services/affiliateManager");
async function optimizeValue() {
    const manager = new affiliateManager_1.AffiliateManager();
    // Process real conversion with market data
    await manager.processConversion({
        type: 'premium_subscription',
        value: 25000,
        path: 'ai_tools/enterprise',
        metrics: {
            engagementScore: 0.95,
            marketFit: 0.92,
        },
        category: 'AI_TOOLS',
    });
}
optimizeValue().catch(console.error);
//# sourceMappingURL=optimizeValue.js.map