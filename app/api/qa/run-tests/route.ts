import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import testResults from '../../../../test-results.json';

export async function POST() {
  try {
    const testSuites = [
      {
        name: 'Unit Tests',
        description: 'Testing individual components and functions',
        results: [],
      },
      {
        name: 'Integration Tests',
        description: 'Testing API endpoints and data flow',
        results: [],
      },
      {
        name: 'E2E Tests',
        description: 'Testing complete user flows',
        results: [],
      },
    ];

    // Run Jest tests
    const jestProcess = spawn('npm', ['test', '--', '--json', '--outputFile=test-results.json']);

    await new Promise((resolve, reject) => {
      jestProcess.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Jest process exited with code ${code}`));
        }
      });
    });

    // Parse test results
    let failed = 0;

    testResults.testResults.forEach((suite: any) => {
      suite.testResults.forEach((test: any) => {
        const result = {
          name: test.title,
          status: test.status === 'passed' ? 'passed' : 'failed',
          duration: test.duration,
          message: test.failureMessages?.join('\n'),
        };

        if (result.status === 'failed') failed++;

        // Add result to appropriate test suite
        if (test.ancestorTitles.includes('Unit Tests')) {
          testSuites[0].results.push(result);
        } else if (test.ancestorTitles.includes('Integration Tests')) {
          testSuites[1].results.push(result);
        } else {
          testSuites[2].results.push(result);
        }
      });
    });

    return NextResponse.json({
      suites: testSuites,
      failed,
    });
  } catch (error) {
    console.error('Error running tests:', error);
    return NextResponse.json({ error: 'Failed to run tests' }, { status: 500 });
  }
}
