/**
 * OB Dynamics Module
 * Handles the OB dynamics charts and interactions
 */

import { apiClient } from '../shared/api.js';
import { Utils } from '../shared/utils.js';

export class ObDynamics {
    constructor() {
        this.reportData = null;
        this.obDynamicsData = null;
        this.currentObTimeframe = 'H1';
        this.isGenerating = false;
    }

    initialize(reportData) {
        this.reportData = reportData;
        this.generateObDynamics();
    }

    async generateObDynamics() {
        if (!this.reportData || this.isGenerating) return;

        this.isGenerating = true;

        try {
            const result = await apiClient.processObReport(this.reportData);

            if (result.success) {
                this.obDynamicsData = result.ob_dynamics;
                this.renderObDynamics();
            } else {
                throw new Error(result.error || result.message || 'Error procesando OB');
            }

        } catch (error) {
            console.error('Error generating OB dynamics:', error);
            this.showError(error.message);
        } finally {
            this.isGenerating = false;
        }
    }

    renderObDynamics() {
        if (!this.obDynamicsData) return;

        this.renderUnifiedTimeframeSelector();
        this.renderObChart(this.currentObTimeframe);
        this.showControls();
    }

    renderUnifiedTimeframeSelector() {
        const container = document.getElementById('timeframe-buttons');
        if (!container) return;

        const timeframes = Object.keys(this.obDynamicsData.timeframes);
        container.innerHTML = '';

        timeframes.forEach(tf => {
            const button = document.createElement('button');
            button.className = `timeframe-btn ${tf === this.currentObTimeframe ? 'active' : ''}`;
            button.textContent = tf;
            button.onclick = () => this.switchObTimeframe(tf);
            container.appendChild(button);
        });
    }

    switchObTimeframe(timeframe) {
        this.currentObTimeframe = timeframe;
        this.renderObChart(timeframe);
        this.updateActiveButtons();
    }

    switchTimeframeWithChart(mainTimeframe, chartTimeframe) {
        this.currentObTimeframe = mainTimeframe;
        this.renderObChart(mainTimeframe);
        this.updateActiveButtons();
        setTimeout(() => this.selectSpecificChart(chartTimeframe), 100);
    }

    renderObChart(timeframe) {
        const container = document.getElementById('ob-charts-container');
        if (!container) return;

        const tfData = this.obDynamicsData.timeframes[timeframe];
        if (!tfData) return;

        const chartKeys = Object.keys(tfData.charts);
        this.renderChartSelector(chartKeys, timeframe);

        if (chartKeys.length > 0) {
            this.renderSingleChart(timeframe, chartKeys[0], true);
        }
    }

    renderChartSelector(chartKeys, timeframe) {
        const container = document.getElementById('chart-buttons');
        if (!container) return;

        container.innerHTML = '';

        chartKeys.forEach(chartTf => {
            const btn = document.createElement('button');
            btn.className = 'chart-btn';
            btn.textContent = chartTf;
            btn.onclick = () => this.renderSingleChart(timeframe, chartTf);
            container.appendChild(btn);
        });
    }

    renderSingleChart(mainTf, chartTf, directRender = false) {
        const tfData = this.obDynamicsData.timeframes[mainTf];
        const chartData = tfData.charts[chartTf];
        if (!chartData) return;

        const container = document.getElementById('ob-charts-container');
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'unified-chart-container';

        const chartDiv = document.createElement('div');
        chartDiv.id = Utils.generateId('chart');
        chartDiv.style.width = '100%';
        chartDiv.style.height = '500px';

        chartWrapper.appendChild(chartDiv);

        if (chartData.metadata) {
            const metadata = document.createElement('div');
            metadata.className = 'chart-metadata';
            metadata.innerHTML = `
                <p><strong>Timeframe:</strong> ${chartTf}</p>
                <p><strong>Generated:</strong> ${Utils.formatDateTime(chartData.metadata.generated_at)}</p>
                ${chartData.metadata.zoom_info ? `<p><strong>Zoom:</strong> ${chartData.metadata.zoom_info.period} (${chartData.metadata.zoom_info.start} to ${chartData.metadata.zoom_info.end})</p>` : ''}
            `;
            chartWrapper.appendChild(metadata);
        }

        if (directRender) {
            container.innerHTML = '';
        }
        container.appendChild(chartWrapper);

        try {
            const plotlyData = JSON.parse(chartData.chart_json);
            if (window.Plotly) {
                window.Plotly.newPlot(chartDiv.id, plotlyData.data, plotlyData.layout, {responsive: true});
            }
        } catch (error) {
            console.error('Error rendering chart:', error);
        }
    }

    selectSpecificChart(chartTimeframe) {
        const chartButtons = document.querySelectorAll('#chart-buttons .chart-btn');
        chartButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === chartTimeframe) {
                btn.classList.add('active');
                btn.click();
            }
        });
    }

    updateActiveButtons() {
        // Update timeframe buttons
        document.querySelectorAll('#timeframe-buttons .timeframe-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === this.currentObTimeframe);
        });

        // Update current timeframe label
        const label = document.getElementById('current-tf-label');
        if (label) {
            label.textContent = `${this.currentObTimeframe}:`;
        }
    }

    showControls() {
        const controls = document.getElementById('unified-controls');
        if (controls) {
            Utils.showElement(controls, 'flex');
        }
    }

    showError(message) {
        const container = document.getElementById('ob-charts-container');
        if (container) {
            container.innerHTML = `
                <div class="error" style="text-align: center; padding: 2rem;">
                    <h3>❌ Error</h3>
                    <p>${Utils.escapeHtml(message)}</p>
                </div>
            `;
        }
    }
}

// Global functions for backward compatibility
window.generateObDynamics = function() {
    if (window.fibonacciReport && window.fibonacciReport.obDynamics) {
        window.fibonacciReport.obDynamics.generateObDynamics();
    }
};

window.switchObTimeframe = function(timeframe) {
    if (window.fibonacciReport && window.fibonacciReport.obDynamics) {
        window.fibonacciReport.obDynamics.switchObTimeframe(timeframe);
    }
};

window.selectSpecificChart = function(chartTimeframe) {
    if (window.fibonacciReport && window.fibonacciReport.obDynamics) {
        window.fibonacciReport.obDynamics.selectSpecificChart(chartTimeframe);
    }
};