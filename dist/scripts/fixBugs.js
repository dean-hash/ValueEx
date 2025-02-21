"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bugFixer_1 = require("../core/qa/bugFixer");
const intelligenceField_1 = require("../core/unified/intelligenceField");
const path_1 = __importDefault(require("path"));
async function main() {
    console.log('Starting autonomous bug fixing process...');
    const resonanceField = intelligenceField_1.ResonanceField.getInstance();
    await resonanceField.initialize();
    const bugFixer = bugFixer_1.BugFixer.getInstance();
    // Event handlers for monitoring progress
    bugFixer.on('fix-applied', (data) => {
        console.log(`✅ Fixed ${path_1.default.basename(data.file)} (${data.type}) with ${data.confidence * 100}% confidence`);
    });
    bugFixer.on('fix-failed', (data) => {
        console.log(`❌ Failed to fix ${path_1.default.basename(data.file)}: ${data.error}`);
    });
    // Start fixing bugs in the src directory
    const srcDir = path_1.default.join(process.cwd(), 'src');
    await bugFixer.startFixing(srcDir);
    // Regular status updates
    const statusInterval = setInterval(() => {
        const status = bugFixer.getFixStatus();
        console.log('\nCurrent Status:');
        console.log(`Pending fixes: ${status.pendingFixes}`);
        console.log(`Fixed files: ${status.fixedFiles}`);
        console.log(`Total fixes applied: ${status.totalFixes}`);
    }, 5000);
    // Handle process termination
    process.on('SIGINT', () => {
        clearInterval(statusInterval);
        console.log('\nGracefully shutting down...');
        process.exit(0);
    });
}
main().catch(console.error);
//# sourceMappingURL=fixBugs.js.map