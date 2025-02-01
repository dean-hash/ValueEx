import { ProfitablePrograms } from './profitablePrograms';

async function testOpportunities() {
    const profitablePrograms = ProfitablePrograms.getInstance();
    
    try {
        console.log('Generating Revenue Opportunities...');
        const opportunities = await profitablePrograms.generateRevenueOpportunities();
        
        console.log('\nTop Revenue Opportunities:');
        opportunities.forEach((opp, index) => {
            console.log(`\n${index + 1}. ${opp.program.name}`);
            console.log(`   Expected Value: $${opp.program.expectedValue.toFixed(2)}`);
            console.log('   Fiverr Matches:');
            opp.fiverrMatches.forEach(match => {
                console.log(`   - ${match.keyword} (Relevance: ${match.relevance})`);
                console.log(`     Link: ${match.fiverrLink}`);
            });
            console.log(`   Total Opportunity Value: $${opp.totalOpportunity.toFixed(2)}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

testOpportunities();
