'use client';

import React, { useState, useEffect } from 'react';
import styles from './QADashboard.module.css';

interface TestResult {
  name: string;
  status: 'running' | 'passed' | 'failed' | 'pending';
  message?: string;
  duration?: number;
}

interface TestSuite {
  name: string;
  description: string;
  results: TestResult[];
}

export default function QADashboard() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<string>('');

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallStatus('Running all tests...');

    try {
      const response = await fetch('/api/qa/run-tests', {
        method: 'POST',
      });
      const result = await response.json();
      setTestSuites(result.suites);
      setOverallStatus(result.failed === 0 ? 'All tests passed!' : `${result.failed} tests failed`);
    } catch (error) {
      setOverallStatus('Error running tests');
      console.error('Error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'green';
      case 'failed':
        return 'red';
      case 'running':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>ValueEx QA Dashboard</h1>
        <button className={styles.runButton} onClick={runAllTests} disabled={isRunning}>
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </header>

      <div className={styles.status}>
        <h2>
          Overall Status:{' '}
          <span style={{ color: getStatusColor(overallStatus) }}>{overallStatus}</span>
        </h2>
      </div>

      <div className={styles.suites}>
        {testSuites.map((suite, index) => (
          <div key={index} className={styles.suite}>
            <h3>{suite.name}</h3>
            <p>{suite.description}</p>
            <div className={styles.results}>
              {suite.results.map((result, rIndex) => (
                <div
                  key={rIndex}
                  className={styles.result}
                  style={{ borderColor: getStatusColor(result.status) }}
                >
                  <span className={styles.testName}>{result.name}</span>
                  <span className={styles.status} style={{ color: getStatusColor(result.status) }}>
                    {result.status}
                  </span>
                  {result.duration && <span className={styles.duration}>{result.duration}ms</span>}
                  {result.message && <p className={styles.message}>{result.message}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
