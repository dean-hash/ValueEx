// Dashboard data management
class DashboardManager {
  constructor() {
    this.charts = {};
    this.lastUpdate = Date.now();
    this.visualizer = new ResonanceVisualizer();
    this.field = UnifiedIntelligenceField.getInstance();
    this.analyzer = new DomainAnalyzer();
    this.connector = GoDaddyConnector.getInstance();
    this.portfolioAnalyzer = PortfolioAnalyzer.getInstance();
    this.domainValueChart = null;
    this.nicheDistributionChart = null;
    this.activeDomains = [];

    this.initializeCharts();
    this.startPolling();
    this.startMonitoring();
    this.loadDomains();
  }

  initializeCharts() {
    const chartConfigs = {
      response: {
        label: 'Responses',
        color: '#3498db',
      },
      helpfulness: {
        label: 'Helpfulness',
        color: '#2ecc71',
      },
      conversion: {
        label: 'Conversions',
        color: '#f1c40f',
      },
      standing: {
        label: 'Standing',
        color: '#9b59b6',
      },
      error: {
        label: 'Errors',
        color: '#e74c3c',
      },
      revenue: {
        label: 'Revenue',
        color: '#1abc9c',
      },
    };

    for (const [key, config] of Object.entries(chartConfigs)) {
      this.charts[key] = new Chart(
        document.getElementById(`${key}Chart`).getContext('2d'),
        this.createChartConfig(config.label, config.color)
      );
    }
  }

  createChartConfig(label, color) {
    return {
      type: 'line',
      data: {
        labels: Array(12).fill(''),
        datasets: [
          {
            label,
            data: Array(12).fill(0),
            borderColor: color,
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  async startPolling() {
    setInterval(() => this.updateMetrics(), 5000);
  }

  async updateMetrics() {
    try {
      const response = await fetch('/api/metrics');
      const metrics = await response.json();

      this.updateValue('responseRate', metrics.responses.total, '/hr');
      this.updateValue('helpfulnessRatio', metrics.valueMetrics.helpfulnessRatio * 100, '%');
      this.updateValue('conversionRate', metrics.conversions.rate * 100, '%');
      this.updateValue('communityStanding', metrics.valueMetrics.communityImpact * 100, '%');
      this.updateValue('errorRate', metrics.errors.rate * 100, '%');
      this.updateValue('revenue', metrics.conversions.revenue, '$');

      this.updateCharts(metrics);
      this.checkAlerts(metrics);
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }

  updateValue(id, value, suffix = '') {
    const element = document.getElementById(id);
    const formattedValue = typeof value === 'number' ? value.toFixed(1) + suffix : value;

    element.textContent = formattedValue;

    // Update color based on thresholds
    element.className = 'metric-value ' + this.getValueClass(id, value);
  }

  getValueClass(id, value) {
    const thresholds = {
      helpfulnessRatio: [80, 90],
      errorRate: [5, 2],
      communityStanding: [70, 85],
    };

    if (!thresholds[id]) return '';

    const [warning, good] = thresholds[id];
    if (value >= good) return 'good';
    if (value >= warning) return 'warning';
    return 'bad';
  }

  updateCharts(metrics) {
    for (const [key, chart] of Object.entries(this.charts)) {
      const newData = metrics[key].history || [];

      chart.data.labels = newData.map((d) => new Date(d.timestamp).toLocaleTimeString());
      chart.data.datasets[0].data = newData.map((d) => d.value);

      chart.update('none');
    }
  }

  checkAlerts(metrics) {
    const alerts = [];

    if (metrics.errors.rate > 0.05) {
      alerts.push(`High error rate: ${(metrics.errors.rate * 100).toFixed(1)}%`);
    }
    if (metrics.valueMetrics.helpfulnessRatio < 0.8) {
      alerts.push(
        `Low helpfulness ratio: ${(metrics.valueMetrics.helpfulnessRatio * 100).toFixed(1)}%`
      );
    }
    if (metrics.valueMetrics.communityImpact < 0.7) {
      alerts.push(
        `Community standing needs attention: ${(metrics.valueMetrics.communityImpact * 100).toFixed(1)}%`
      );
    }

    const alertsDiv = document.getElementById('alerts');
    if (alerts.length > 0) {
      alertsDiv.style.display = 'block';
      alertsDiv.textContent = alerts.join(' | ');
    } else {
      alertsDiv.style.display = 'none';
    }
  }

  async initializeMonetizationCharts() {
    this.visualizer.initializeCharts();
    await this.updateMonetizationMetrics();
  }

  async updateMonetizationMetrics() {
    try {
      // Fetch and analyze domains
      const domains = await this.connector.listDomains();
      const analysisResults = await Promise.all(
        domains.map((domain) => this.analyzer.analyzeDomain(domain))
      );

      // Update domain portfolio metrics
      document.getElementById('domainCount').textContent = domains.length;
      const totalValue = analysisResults.reduce((sum, result) => sum + result.estimatedValue, 0);
      document.getElementById('totalValue').textContent = `$${totalValue.toLocaleString()}`;

      // Update affiliate metrics
      const affiliateMetrics = await this.getAffiliateMetrics();
      document.getElementById('activePrograms').textContent = affiliateMetrics.activePrograms;
      document.getElementById('monthlyRevenue').textContent =
        `$${affiliateMetrics.monthlyRevenue.toLocaleString()}`;

      // Update growth metrics
      const growthMetrics = this.calculateGrowthMetrics(analysisResults);
      document.getElementById('growthScore').textContent =
        `${(growthMetrics.score * 100).toFixed(0)}%`;
      document.getElementById('opportunities').textContent = growthMetrics.opportunities;

      // Update charts
      this.visualizer.updateDomainMetrics(domains[0]);
      this.visualizer.updateAffiliatePerformance(domains);
    } catch (error) {
      console.error('Error updating monetization metrics:', error);
    }
  }

  async getAffiliateMetrics() {
    // This would normally come from your affiliate tracking system
    return {
      activePrograms: 5,
      monthlyRevenue: 2500,
    };
  }

  calculateGrowthMetrics(analysisResults) {
    const averageResonance =
      analysisResults.reduce((sum, result) => sum + result.resonanceScore, 0) /
      analysisResults.length;
    const highPotentialCount = analysisResults.filter(
      (result) => result.resonanceScore > 0.8
    ).length;

    return {
      score: averageResonance,
      opportunities: highPotentialCount,
    };
  }

  startMonitoring() {
    // Update metrics every 5 minutes
    setInterval(() => this.updateMonetizationMetrics(), 5 * 60 * 1000);

    // Update resonance visualization more frequently
    setInterval(() => {
      const resonanceData = this.field.getFieldState();
      this.visualizer.updateCharts(resonanceData);
    }, 1000);
  }

  async loadDomains() {
    try {
      const response = await fetch('/api/domains');
      this.activeDomains = await response.json();
    } catch (error) {
      console.error('Error loading domains:', error);
      // Use sample data for testing
      this.activeDomains = [
        'alerion.ai',
        'collaborativeintelligence.pro',
        'divvytech.com',
        'aoa.associates',
        'because.farm',
        'divvy.earth',
      ];
    }
  }

  async initializeDomainPortfolioVisualization() {
    // Domain Value Chart
    const valueCtx = document.getElementById('domainValueChart').getContext('2d');
    const domainValues = await Promise.all(
      this.activeDomains.map(async (domain) => {
        const metrics = await this.portfolioAnalyzer.analyzeDomainMetrics(domain);
        return metrics.estimatedValue;
      })
    );

    this.domainValueChart = new Chart(valueCtx, {
      type: 'bar',
      data: {
        labels: this.activeDomains,
        datasets: [
          {
            label: 'Estimated Domain Value ($)',
            data: domainValues,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    // Niche Distribution Chart
    const nicheCtx = document.getElementById('nicheDistributionChart').getContext('2d');
    const nicheData = await this.getNicheDistribution();

    this.nicheDistributionChart = new Chart(nicheCtx, {
      type: 'pie',
      data: {
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
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          title: {
            display: true,
            text: 'Domain Portfolio by Niche',
          },
        },
      },
    });
  }

  async getNicheDistribution() {
    const distribution = {};
    for (const domain of this.activeDomains) {
      const metrics = await this.portfolioAnalyzer.analyzeDomainMetrics(domain);
      distribution[metrics.niche] = (distribution[metrics.niche] || 0) + 1;
    }
    return distribution;
  }

  async updateDomainMetricsTable() {
    const tbody = document.getElementById('domainMetricsBody');
    tbody.innerHTML = '';

    for (const domain of this.activeDomains) {
      const metrics = await this.portfolioAnalyzer.analyzeDomainMetrics(domain);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${domain}</td>
        <td>$${metrics.estimatedValue.toLocaleString()}</td>
        <td>${(metrics.seoValue * 100).toFixed(1)}%</td>
        <td>${(metrics.marketDemand * 100).toFixed(1)}%</td>
        <td>${(metrics.affiliatePotential * 100).toFixed(1)}%</td>
        <td>${metrics.recommendedStrategy}</td>
      `;
      tbody.appendChild(row);
    }
  }

  async updateAffiliateOpportunities() {
    const container = document.getElementById('affiliateOpportunities');
    container.innerHTML = '';

    for (const domain of this.activeDomains) {
      const recommendations = await this.portfolioAnalyzer.getAffiliateRecommendations(domain);
      const domainSection = document.createElement('div');
      domainSection.className = 'mb-3';
      domainSection.innerHTML = `
        <h6>${domain}</h6>
        <div class="row">
          ${recommendations
            .map(
              (rec) => `
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h6 class="card-title">${rec.network}</h6>
                  <p class="card-text">
                    Relevance: ${(rec.relevance * 100).toFixed(1)}%<br>
                    Commission: ${rec.averageCommission}<br>
                    Products: ${rec.products.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
      container.appendChild(domainSection);
    }
  }
}

// Initialize dashboard
const dashboard = new DashboardManager();
