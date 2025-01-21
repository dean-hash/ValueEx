'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import styles from './Monitoring.module.css';

interface SystemStatus {
    health: any;
    metrics: Map<string, any[]>;
    optimizations: any[];
    resonance: any;
}

export default function MonitoringDashboard() {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                setStatus(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch system status');
                console.error(err);
            }
        };

        // Initial fetch
        fetchStatus();

        // Set up polling
        const interval = setInterval(fetchStatus, 5000);

        return () => clearInterval(interval);
    }, []);

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (!status) {
        return <div className={styles.loading}>Loading system status...</div>;
    }

    const getHealthColor = (health: string) => {
        switch (health) {
            case 'healthy': return 'green';
            case 'warning': return 'orange';
            case 'critical': return 'red';
            default: return 'gray';
        }
    };

    const getMetricsData = (metrics: Map<string, any[]>) => {
        const datasets = [];
        for (const [name, values] of Object.entries(metrics)) {
            datasets.push({
                label: name,
                data: values.map(v => v.value),
                fill: false,
                borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
                tension: 0.1
            });
        }

        return {
            labels: Array(datasets[0]?.data.length || 0).fill(''),
            datasets
        };
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>System Monitoring</h1>
                <div 
                    className={styles.healthIndicator}
                    style={{ backgroundColor: getHealthColor(status.health.status) }}
                >
                    System Health: {status.health.status}
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2>Metrics</h2>
                    <div className={styles.chart}>
                        <Line 
                            data={getMetricsData(status.metrics)}
                            options={{
                                responsive: true,
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className={styles.card}>
                    <h2>Recent Optimizations</h2>
                    <ul className={styles.optimizations}>
                        {status.optimizations.map((opt, index) => (
                            <li key={index}>
                                <strong>{opt.strategy}</strong>
                                <span>{new Date(opt.timestamp).toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.card}>
                    <h2>Resonance Field Status</h2>
                    <div className={styles.resonance}>
                        <pre>{JSON.stringify(status.resonance, null, 2)}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
