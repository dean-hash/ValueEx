'use client';

import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import styles from '@/styles/DomainDashboard.module.css';

interface DomainMetrics {
  domain: string;
  estimatedValue: number;
  seoValue: number;
  marketDemand: number;
  affiliatePotential: number;
  recommendedStrategy: string;
  niche: string;
}

interface AffiliateRecommendation {
  network: string;
  relevance: number;
  averageCommission: string;
  products: string[];
}

export default function DomainDashboard(): React.ReactElement {
  const [domains, setDomains] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<DomainMetrics[]>([]);
  const [affiliateRecs, setAffiliateRecs] = useState<{ [key: string]: AffiliateRecommendation[] }>(
    {}
  );

  useEffect(() => {
    // Load domains and their metrics
    fetchDomainData();
  }, []);

  const fetchDomainData = async (): Promise<void> => {
    try {
      const response = await fetch('/api/domains');
      const domainList = await response.json();
      setDomains(domainList);

      // Fetch metrics for each domain
      const metricsPromises = domainList.map(async (domain: string) => {
        const metricsResponse = await fetch(`/api/domains/${domain}/metrics`);
        return metricsResponse.json();
      });

      const domainMetrics = await Promise.all(metricsPromises);
      setMetrics(domainMetrics);

      // Fetch affiliate recommendations
      const affiliatePromises = domainList.map(async (domain: string) => {
        const recResponse = await fetch(`/api/domains/${domain}/affiliate-recommendations`);
        const recommendations = await recResponse.json();
        return { domain, recommendations };
      });

      const affiliateData = await Promise.all(affiliatePromises);
      const affiliateMap = affiliateData.reduce((acc, { domain, recommendations }) => {
        acc[domain] = recommendations;
        return acc;
      }, {});
      setAffiliateRecs(affiliateMap);
    } catch (error) {
      console.error('Error fetching domain data:', error);
    }
  };

  const valueChartData = {
    labels: domains,
    datasets: [
      {
        label: 'Estimated Domain Value ($)',
        data: metrics.map((m) => m.estimatedValue),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const nicheData = metrics.reduce((acc, metric) => {
    acc[metric.niche] = (acc[metric.niche] || 0) + 1;
    return acc;
  }, {});

  const nicheChartData = {
    labels: Object.keys(nicheData),
    datasets: [
      {
        data: Object.values(nicheData),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
  };

  return (
    <div className={styles.container}>
      <h1 className="text-3xl font-bold mb-8">Domain Portfolio Analysis</h1>

      <div className={styles.chartGrid}>
        <div className={styles.chart}>
          <h2 className="text-xl font-semibold mb-4">Domain Values</h2>
          <Bar data={valueChartData} options={{ responsive: true }} />
        </div>
        <div className={styles.chart}>
          <h2 className="text-xl font-semibold mb-4">Portfolio Distribution</h2>
          <Pie data={nicheChartData} options={{ responsive: true }} />
        </div>
      </div>

      <div className={styles.metricsTable}>
        <h2 className="text-xl font-semibold mb-4">Domain Metrics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">Domain</th>
                <th className="px-4 py-2">Est. Value</th>
                <th className="px-4 py-2">SEO Value</th>
                <th className="px-4 py-2">Market Demand</th>
                <th className="px-4 py-2">Affiliate Potential</th>
                <th className="px-4 py-2">Strategy</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.domain}>
                  <td className="px-4 py-2">{metric.domain}</td>
                  <td className="px-4 py-2">${metric.estimatedValue.toLocaleString()}</td>
                  <td className="px-4 py-2">{(metric.seoValue * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2">{(metric.marketDemand * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2">{(metric.affiliatePotential * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2">{metric.recommendedStrategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.affiliateSection}>
        <h2 className="text-xl font-semibold mb-4">Affiliate Opportunities</h2>
        {domains.map((domain) => (
          <div key={domain} className="mb-8">
            <h3 className="text-lg font-semibold mb-2">{domain}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {affiliateRecs[domain]?.map((rec, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow p-4">
                  <h4 className="font-semibold text-blue-800">{rec.network}</h4>
                  <p>Relevance: {(rec.relevance * 100).toFixed(1)}%</p>
                  <p>Commission: {rec.averageCommission}</p>
                  <p>Products: {rec.products.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
