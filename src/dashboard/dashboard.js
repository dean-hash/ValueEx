// Dashboard data management
class DashboardManager {
    constructor() {
        this.charts = {};
        this.lastUpdate = Date.now();
        this.initializeCharts();
        this.startPolling();
    }

    initializeCharts() {
        const chartConfigs = {
            response: {
                label: 'Responses',
                color: '#3498db'
            },
            helpfulness: {
                label: 'Helpfulness',
                color: '#2ecc71'
            },
            conversion: {
                label: 'Conversions',
                color: '#f1c40f'
            },
            standing: {
                label: 'Standing',
                color: '#9b59b6'
            },
            error: {
                label: 'Errors',
                color: '#e74c3c'
            },
            revenue: {
                label: 'Revenue',
                color: '#1abc9c'
            }
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
                datasets: [{
                    label,
                    data: Array(12).fill(0),
                    borderColor: color,
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
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
        const formattedValue = typeof value === 'number' ? 
            value.toFixed(1) + suffix : 
            value;
        
        element.textContent = formattedValue;
        
        // Update color based on thresholds
        element.className = 'metric-value ' + this.getValueClass(id, value);
    }

    getValueClass(id, value) {
        const thresholds = {
            helpfulnessRatio: [80, 90],
            errorRate: [5, 2],
            communityStanding: [70, 85]
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
            
            chart.data.labels = newData.map(d => 
                new Date(d.timestamp).toLocaleTimeString()
            );
            chart.data.datasets[0].data = newData.map(d => d.value);
            
            chart.update('none');
        }
    }

    checkAlerts(metrics) {
        const alerts = [];

        if (metrics.errors.rate > 0.05) {
            alerts.push(`High error rate: ${(metrics.errors.rate * 100).toFixed(1)}%`);
        }
        if (metrics.valueMetrics.helpfulnessRatio < 0.8) {
            alerts.push(`Low helpfulness ratio: ${(metrics.valueMetrics.helpfulnessRatio * 100).toFixed(1)}%`);
        }
        if (metrics.valueMetrics.communityImpact < 0.7) {
            alerts.push(`Community standing needs attention: ${(metrics.valueMetrics.communityImpact * 100).toFixed(1)}%`);
        }

        const alertsDiv = document.getElementById('alerts');
        if (alerts.length > 0) {
            alertsDiv.style.display = 'block';
            alertsDiv.textContent = alerts.join(' | ');
        } else {
            alertsDiv.style.display = 'none';
        }
    }
}

// Initialize dashboard
const dashboard = new DashboardManager();
