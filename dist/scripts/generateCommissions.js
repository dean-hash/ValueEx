"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const awinConnector_1 = require("../services/connectors/implementations/awinConnector");
async function generateCommissions() {
    const awin = awinConnector_1.AwinConnector.getInstance();
    console.log('Starting Commission Generation...\n');
    // Check current commissions
    const currentCommissions = await awin.getActiveCommissions();
    console.log(`Current Active Commissions: $${currentCommissions.toFixed(2)}\n`);
    // Get and display high-value opportunities
    console.log('Generating High-Value Opportunities...');
    await awin.optimizeCommissions();
}
generateCommissions().catch(console.error);
//# sourceMappingURL=generateCommissions.js.map