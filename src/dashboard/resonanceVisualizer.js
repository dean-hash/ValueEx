import { UnifiedIntelligenceField } from '../core/unified/intelligenceField.js';
import { RevenueTracker } from '../services/affiliate/revenueTracker.js';

export class ResonanceVisualizer {
  constructor() {
    this.charts = {};
  }

  initializeCharts() {
    this.initResonanceChart();
    this.initIncomeChart();
    this.initPatternChart();
    this.initCoherenceChart();
    this.initDomainMetricsChart();
    this.initAffiliatePerformanceChart();
  }

  initResonanceChart() {
    const ctx = document.getElementById('resonanceChart').getContext('2d');
    this.charts.resonance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Resonance Strength',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
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
  }

  initIncomeChart() {
    const ctx = document.getElementById('incomeChart').getContext('2d');
    this.charts.income = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Verified Income',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
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
  }

  initPatternChart() {
    const ctx = document.getElementById('patternChart').getContext('2d');
    this.charts.pattern = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: 'Resonance Patterns',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Strength',
            },
          },
        },
      },
    });
  }

  initCoherenceChart() {
    const ctx = document.getElementById('coherenceChart').getContext('2d');
    this.charts.coherence = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Amplitude', 'Coherence', 'Harmony', 'Impact', 'Reach'],
        datasets: [
          {
            label: 'Current Pattern',
            data: [0, 0, 0, 0, 0],
            fill: true,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            pointBackgroundColor: 'rgb(255, 99, 132)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(255, 99, 132)',
          },
        ],
      },
      options: {
        elements: {
          line: {
            borderWidth: 3,
          },
        },
      },
    });
  }

  initDomainMetricsChart() {
    const ctx = document.getElementById('domainMetricsChart').getContext('2d');
    this.charts.domainMetrics = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: [
          'SEO Value',
          'Market Demand',
          'Conversion Potential',
          'Affiliate Fit',
          'Brand Strength',
        ],
        datasets: [
          {
            label: 'Domain Metrics',
            data: [],
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 1,
          },
        },
      },
    });
  }

  initAffiliatePerformanceChart() {
    const ctx = document.getElementById('affiliatePerformanceChart').getContext('2d');
    this.charts.affiliatePerformance = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: 'Domain Performance',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Traffic Volume',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Conversion Rate',
            },
          },
        },
      },
    });
  }

  updateCharts(resonanceData) {
    // Update resonance chart
    this.charts.resonance.data.labels.push(new Date().toLocaleTimeString());
    this.charts.resonance.data.datasets[0].data.push(resonanceData.strength);
    if (this.charts.resonance.data.labels.length > 20) {
      this.charts.resonance.data.labels.shift();
      this.charts.resonance.data.datasets[0].data.shift();
    }
    this.charts.resonance.update();

    // Update pattern chart
    this.charts.pattern.data.datasets[0].data.push({
      x: Date.now(),
      y: resonanceData.strength,
      r: resonanceData.coherence * 10,
    });
    if (this.charts.pattern.data.datasets[0].data.length > 50) {
      this.charts.pattern.data.datasets[0].data.shift();
    }
    this.charts.pattern.update();

    // Update coherence chart
    this.charts.coherence.data.datasets[0].data = [
      resonanceData.amplitude || 0,
      resonanceData.coherence || 0,
      resonanceData.harmony || 0,
      resonanceData.impact || 0,
      resonanceData.reach || 0,
    ];
    this.charts.coherence.update();
  }

  updateDomainMetrics(domain) {
    const metrics = this.field.getDomainMetrics(domain);
    this.charts.domainMetrics.data.datasets[0].data = [
      metrics.seoValue,
      metrics.marketDemand,
      metrics.conversionPotential,
      metrics.affiliateFit,
      metrics.brandStrength,
    ];
    this.charts.domainMetrics.update();
  }

  updateAffiliatePerformance(domains) {
    this.charts.affiliatePerformance.data.datasets[0].data = domains.map((domain) => ({
      x: domain.trafficVolume,
      y: domain.conversionRate,
      r: domain.revenue * 10, // Bubble size proportional to revenue
      label: domain.name,
    }));
    this.charts.affiliatePerformance.update();
  }
}

export class ResonanceVisualizerForChartManagement {
  constructor(containerId) {
    this.containerId = containerId;
    this.field = UnifiedIntelligenceField.getInstance();
    this.revenue = RevenueTracker.getInstance();
    this.charts = new Map();

    this.initializeVisualizations();
  }

  initializeVisualizations() {
    // Real-time resonance patterns
    this.createResonanceGraph();

    // Supply/Demand matching
    this.createMatchingMetrics();

    // Income verification
    this.createIncomeTracker();

    // Pattern interactions
    this.createPatternInteractions();
  }

  createResonanceGraph() {
    const ctx = this.getContext('resonance-graph');
    this.charts.set(
      'resonance',
      new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Resonance Patterns',
              data: [],
            },
          ],
        },
        options: {
          scales: {
            x: { title: { display: true, text: 'Coherence' } },
            y: { title: { display: true, text: 'Strength' } },
          },
          animation: {
            duration: 0, // For real-time updates
          },
        },
      })
    );

    // Subscribe to resonance patterns
    this.field.observeResonancePatterns().subscribe((pattern) => {
      const chart = this.charts.get('resonance');
      if (!chart) return;

      pattern.affectedNodes.forEach((node) => {
        chart.data.datasets[0].data.push({
          x: pattern.coherence,
          y: node.resonanceStrength,
          r: node.harmonicFactor * 10, // Size based on harmonic factor
        });
      });

      // Keep last 100 points for performance
      if (chart.data.datasets[0].data.length > 100) {
        chart.data.datasets[0].data.shift();
      }

      chart.update('none');

      // Update metrics
      document.getElementById('coherence-value').textContent =
        `${(pattern.coherence * 100).toFixed(1)}%`;
      document.getElementById('strength-value').textContent =
        `${(pattern.affectedNodes[0]?.resonanceStrength * 100).toFixed(1)}%`;
    });
  }

  createMatchingMetrics() {
    const ctx = this.getContext('matching-metrics');
    this.charts.set(
      'matching',
      new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Supply Strength', 'Demand Alignment', 'Value Flow', 'Pattern Coherence'],
          datasets: [
            {
              label: 'Current State',
              data: [0, 0, 0, 0],
              fill: true,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgb(54, 162, 235)',
              pointBackgroundColor: 'rgb(54, 162, 235)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(54, 162, 235)',
            },
          ],
        },
        options: {
          elements: {
            line: {
              borderWidth: 3,
            },
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 1,
            },
          },
        },
      })
    );

    // Update metrics every 5 seconds
    setInterval(() => this.updateMatchingMetrics(), 5000);
  }

  createIncomeTracker() {
    const ctx = this.getContext('income-tracker');
    this.charts.set(
      'income',
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Verified Income',
              data: [],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
              fill: true,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'USD' },
            },
          },
        },
      })
    );

    // Subscribe to verified income events
    this.revenue.observeVerifiedIncome().subscribe((income) => {
      const chart = this.charts.get('income');
      if (!chart) return;

      const date = new Date().toLocaleDateString();
      chart.data.labels.push(date);
      chart.data.datasets[0].data.push(income.amount);

      // Keep last 30 days
      if (chart.data.labels.length > 30) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }

      chart.update();

      // Update metrics
      document.getElementById('daily-income').textContent = `$${income.amount.toFixed(2)}`;

      // Calculate monthly projection
      const monthlyProjection = income.amount * 30;
      document.getElementById('monthly-projection').textContent =
        `$${monthlyProjection.toFixed(2)}`;
    });
  }

  createPatternInteractions() {
    const ctx = this.getContext('pattern-interactions');
    this.charts.set(
      'patterns',
      new Chart(ctx, {
        type: 'bubble',
        data: {
          datasets: [
            {
              label: 'Pattern Interactions',
              data: [],
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgb(255, 99, 132)',
            },
          ],
        },
        options: {
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              title: { display: true, text: 'Time' },
            },
            y: {
              title: { display: true, text: 'Value' },
            },
          },
        },
      })
    );

    // Combine resonance and income streams
    this.field.observeResonancePatterns().subscribe((pattern) => {
      const chart = this.charts.get('patterns');
      if (!chart) return;

      const data = {
        x: Date.now(),
        y: pattern.coherence * 100,
        r: pattern.affectedNodes[0]?.resonanceStrength * 20 || 5,
      };

      chart.data.datasets[0].data.push(data);

      // Keep last 50 interactions
      if (chart.data.datasets[0].data.length > 50) {
        chart.data.datasets[0].data.shift();
      }

      chart.update('none');

      // Update metrics
      document.getElementById('interaction-strength').textContent =
        `${(pattern.coherence * 100).toFixed(1)}%`;
      document.getElementById('value-flow').textContent =
        `${((pattern.affectedNodes[0]?.resonanceStrength || 0) * 100).toFixed(1)}%`;
    });
  }

  getContext(id) {
    const canvas = document.createElement('canvas');
    canvas.id = id;
    document.getElementById(this.containerId)?.appendChild(canvas);
    return canvas.getContext('2d');
  }

  async updateMatchingMetrics() {
    const chart = this.charts.get('matching');
    if (!chart) return;

    // Calculate current metrics from field state
    const metrics = {
      supplyStrength: await this.field.calculateSupplyStrength(),
      demandAlignment: await this.field.calculateDemandAlignment(),
      valueFlow: await this.field.calculateValueFlow(),
      patternCoherence: await this.field.calculatePatternCoherence(),
    };

    chart.data.datasets[0].data = [
      metrics.supplyStrength,
      metrics.demandAlignment,
      metrics.valueFlow,
      metrics.patternCoherence,
    ];

    chart.update();

    // Update individual metrics
    document.getElementById('supply-strength').textContent =
      `${(metrics.supplyStrength * 100).toFixed(1)}%`;
    document.getElementById('demand-alignment').textContent =
      `${(metrics.demandAlignment * 100).toFixed(1)}%`;
  }
}
