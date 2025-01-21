import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the NetworkGraph to avoid SSR issues with D3
const DemandNetwork = dynamic(() => import('../src/visualization/DemandNetwork'), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="dashboard-container">
      <header>
        <h1>Demand Insights Dashboard</h1>
        <div className="time-controls">
          <select id="timeRange">
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </header>

      <main>
        <div className="grid-container">
          <section className="network-section">
            <h2>Demand Signal Network</h2>
            <DemandNetwork />
            <div id="signal-details" className="details-panel"></div>
          </section>

          <section className="patterns-section">
            <h2>Emerging Patterns</h2>
            <div id="emerging-patterns" className="pattern-list"></div>
          </section>

          <section className="metrics-section">
            <h2>Key Metrics</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Active Signals</h3>
                <div id="active-signals-count" className="metric-value">
                  0
                </div>
              </div>
              <div className="metric-card">
                <h3>Average Confidence</h3>
                <div id="avg-confidence" className="metric-value">
                  0%
                </div>
              </div>
              <div className="metric-card">
                <h3>Strong Patterns</h3>
                <div id="strong-patterns-count" className="metric-value">
                  0
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
