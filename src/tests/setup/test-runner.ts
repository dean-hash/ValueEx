import { spawn } from 'child_process';
import { resolve } from 'path';

interface TestJob {
    name: string;
    pattern: string;
}

const jobs: TestJob[] = [
    {
        name: 'Teams Integration',
        pattern: 'src/tests/integration/teams/TeamsIntegration.test.ts'
    },
    {
        name: 'Matching Engine',
        pattern: 'src/core/matching/__tests__'
    },
    {
        name: 'Unit Tests',
        pattern: 'src/tests/unit'
    }
];

async function runTest(job: TestJob): Promise<boolean> {
    return new Promise((resolve) => {
        console.log(`\n🚀 Running ${job.name} tests...\n`);
        
        const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const jest = spawn(npm, ['test', '--', job.pattern, '--verbose'], {
            stdio: 'inherit',
            shell: true
        });
        
        jest.on('close', (code) => {
            if (code === 0) {
                console.log(`\n✅ ${job.name} tests passed\n`);
                resolve(true);
            } else {
                console.log(`\n❌ ${job.name} tests failed\n`);
                resolve(false);
            }
        });
    });
}

async function runAllTests() {
    console.log('\n🔄 Starting parallel test execution...\n');
    
    const results = await Promise.all(
        jobs.map(job => runTest(job))
    );
    
    const allPassed = results.every(passed => passed);
    
    if (allPassed) {
        console.log('\n✅ All test suites passed!\n');
        process.exit(0);
    } else {
        console.log('\n❌ Some test suites failed\n');
        process.exit(1);
    }
}

runAllTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
});
