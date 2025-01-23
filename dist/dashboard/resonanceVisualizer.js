"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResonanceVisualizer = void 0;
const intelligenceField_1 = require("../core/unified/intelligenceField");
const revenueTracker_1 = require("../services/affiliate/revenueTracker");
const chart_js_1 = require("chart.js");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class ResonanceVisualizer {
    constructor(containerId) {
        this.containerId = containerId;
        this.field = intelligenceField_1.UnifiedIntelligenceField.getInstance();
        this.revenue = revenueTracker_1.RevenueTracker.getInstance();
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
        this.charts.set('resonance', new chart_js_1.Chart(ctx, {
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
        }));
        // Subscribe to resonance patterns
        this.field.observeResonancePatterns().subscribe((pattern) => {
            const chart = this.charts.get('resonance');
            if (!chart)
                return;
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
            chart.update('none'); // Update without animation
        });
    }
    createMatchingMetrics() {
        const ctx = this.getContext('matching-metrics');
        this.charts.set('matching', new chart_js_1.Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Supply Strength', 'Demand Alignment', 'Value Flow', 'Pattern Coherence'],
                datasets: [
                    {
                        label: 'Current State',
                        data: [0, 0, 0, 0],
                    },
                ],
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 1,
                    },
                },
            },
        }));
        // Update metrics every 5 seconds
        setInterval(() => this.updateMatchingMetrics(), 5000);
    }
    createIncomeTracker() {
        const ctx = this.getContext('income-tracker');
        this.charts.set('income', new chart_js_1.Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Verified Income',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
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
        }));
        // Subscribe to verified income events
        this.revenue.observeVerifiedIncome().subscribe((income) => {
            const chart = this.charts.get('income');
            if (!chart || !chart.data)
                return;
            // Initialize labels array if undefined
            if (!chart.data.labels) {
                chart.data.labels = [];
            }
            const date = new Date().toLocaleDateString();
            chart.data.labels.push(date);
            // Keep last 30 days
            if (chart.data.labels.length > 30) {
                chart.data.labels = chart.data.labels.slice(-30);
            }
            chart.data.datasets[0].data.push(income.amount);
            // Keep last 30 days
            if (chart.data.datasets[0].data.length > 30) {
                chart.data.datasets[0].data = chart.data.datasets[0].data.slice(-30);
            }
            chart.update();
        });
    }
    createPatternInteractions() {
        const ctx = this.getContext('pattern-interactions');
        this.charts.set('patterns', new chart_js_1.Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [
                    {
                        label: 'Pattern Interactions',
                        data: [],
                    },
                ],
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Time' } },
                    y: { title: { display: true, text: 'Value' } },
                },
            },
        }));
        // Combine resonance and income streams
        (0, rxjs_1.combineLatest)([this.field.observeResonancePatterns(), this.revenue.observeVerifiedIncome()])
            .pipe((0, operators_1.map)(([pattern, income]) => ({
            x: Date.now(),
            y: income.amount,
            r: pattern.coherence * 20,
        })))
            .subscribe((data) => {
            const chart = this.charts.get('patterns');
            if (!chart || !chart.data)
                return;
            // Initialize labels array if undefined
            if (!chart.data.labels) {
                chart.data.labels = [];
            }
            chart.data.datasets[0].data.push(data);
            // Keep last 50 interactions
            if (chart.data.datasets[0].data.length > 50) {
                chart.data.datasets[0].data.shift();
            }
            chart.data.labels.push(new Date().toLocaleTimeString());
            // Keep last 50 interactions
            if (chart.data.labels.length > 50) {
                chart.data.labels = chart.data.labels.slice(-50);
            }
            chart.update('none');
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
        if (!chart)
            return;
        // Calculate current metrics
        const metrics = await this.calculateCurrentMetrics();
        chart.data.datasets[0].data = [
            metrics.supplyStrength,
            metrics.demandAlignment,
            metrics.valueFlow,
            metrics.patternCoherence,
        ];
        chart.update();
    }
    async calculateCurrentMetrics() {
        // In real implementation, these would be calculated from actual data
        return {
            supplyStrength: Math.random(),
            demandAlignment: Math.random(),
            valueFlow: Math.random(),
            patternCoherence: Math.random(),
        };
    }
}
exports.ResonanceVisualizer = ResonanceVisualizer;
//# sourceMappingURL=resonanceVisualizer.js.map