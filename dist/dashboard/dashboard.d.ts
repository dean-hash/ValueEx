declare class DashboardManager {
  charts: {};
  lastUpdate: number;
  visualizer: any;
  field: any;
  analyzer: any;
  connector: any;
  portfolioAnalyzer: any;
  domainValueChart: any;
  nicheDistributionChart: any;
  activeDomains: any[];
  initializeCharts(): void;
  createChartConfig(
    label: any,
    color: any
  ): {
    type: string;
    data: {
      labels: any[];
      datasets: {
        label: any;
        data: any[];
        borderColor: any;
        tension: number;
        fill: boolean;
      }[];
    };
    options: {
      responsive: boolean;
      maintainAspectRatio: boolean;
      plugins: {
        legend: {
          display: boolean;
        };
      };
      scales: {
        y: {
          beginAtZero: boolean;
        };
      };
    };
  };
  startPolling(): Promise<void>;
  updateMetrics(): Promise<void>;
  updateValue(id: any, value: any, suffix?: string): void;
  getValueClass(id: any, value: any): '' | 'warning' | 'good' | 'bad';
  updateCharts(metrics: any): void;
  checkAlerts(metrics: any): void;
  initializeMonetizationCharts(): Promise<void>;
  updateMonetizationMetrics(): Promise<void>;
  getAffiliateMetrics(): Promise<{
    activePrograms: number;
    monthlyRevenue: number;
  }>;
  calculateGrowthMetrics(analysisResults: any): {
    score: number;
    opportunities: any;
  };
  startMonitoring(): void;
  loadDomains(): Promise<void>;
  initializeDomainPortfolioVisualization(): Promise<void>;
  getNicheDistribution(): Promise<{}>;
  updateDomainMetricsTable(): Promise<void>;
  updateAffiliateOpportunities(): Promise<void>;
}
declare const dashboard: DashboardManager;
