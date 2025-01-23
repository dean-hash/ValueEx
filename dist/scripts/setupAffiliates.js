"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const logger_1 = require("../utils/logger");
async function getAutoApprovePrograms() {
    // Real programs with auto-approval or quick approval
    return [
        {
            program: 'Amazon Associates',
            url: 'https://affiliate-program.amazon.com/signup',
            autoApprove: true,
            requiredInfo: ['website', 'traffic_source', 'topics'],
            commission: '1-10% based on category',
        },
        {
            program: 'ClickBank',
            url: 'https://accounts.clickbank.com/signup/',
            autoApprove: true,
            requiredInfo: ['payment_info', 'website'],
            commission: 'Up to 75% on digital products',
        },
        {
            program: 'ShareASale',
            url: 'https://account.shareasale.com/signup',
            autoApprove: true,
            requiredInfo: ['website', 'promotion_methods'],
            commission: 'Varies by merchant, many AI tools',
        },
    ];
}
async function main() {
    try {
        console.log('\nChecking Auto-Approve Affiliate Programs...');
        console.log('=====================================');
        const programs = await getAutoApprovePrograms();
        console.log('\nAvailable Programs:');
        programs.forEach((program, index) => {
            console.log(`\n${index + 1}. ${program.program}`);
            console.log(`   URL: ${program.url}`);
            console.log(`   Commission: ${program.commission}`);
            console.log(`   Required Info: ${program.requiredInfo.join(', ')}`);
        });
        console.log('\nNext Steps:');
        console.log('1. Start with Amazon Associates - largest marketplace with AI/ML books and courses');
        console.log('2. Set up ClickBank for digital AI products');
        console.log('3. Use ShareASale for AI tool vendors');
    }
    catch (error) {
        logger_1.logger.error('Error checking affiliate programs', error);
    }
}
main();
//# sourceMappingURL=setupAffiliates.js.map