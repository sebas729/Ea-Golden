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
        if (!this.reportData || this.isGenerating) {
            return Promise.reject(new Error('No hay datos de reporte disponibles o ya se está generando'));
        }

        // Actualizar mensaje inicial si existe
        const initialMessage = document.querySelector('#ob-charts-container .initial-message h3');
        if (initialMessage) {
            initialMessage.textContent = '⚙️ Procesando datos...';
        }

        this.isGenerating = true;

        try {
            const result = await apiClient.processObReport(this.reportData);

            if (result.success) {
                // Los datos están en result.data, no en result.ob_dynamics
                this.obDynamicsData = result.data;

                // Establecer variables globales para compatibilidad
                window.obDynamicsData = this.obDynamicsData;
                window.currentObTimeframe = this.currentObTimeframe;

                this.renderObDynamics();
                return Promise.resolve(this.obDynamicsData);
            } else {
                throw new Error(result.error || result.message || 'Error procesando OB');
            }

        } catch (error) {
            console.error('Error generating OB dynamics:', error);
            this.showError(error.message);
            return Promise.reject(error);
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
        window.currentObTimeframe = timeframe;
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

        if (!tfData || !tfData.charts) {
            container.innerHTML = '<div class="initial-message"><p>No hay gráficos disponibles para ' + Utils.escapeHtml(timeframe) + '</p></div>';
            return;
        }

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

        chartKeys.forEach((chartTf, index) => {
            const btn = document.createElement('button');
            btn.textContent = `Gráfico ${chartTf}`;
            btn.className = index === 0 ? 'chart-btn active' : 'chart-btn';
            btn.onclick = () => {
                // Actualizar botones activos
                container.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Renderizar solo el gráfico seleccionado
                const chartContainer = document.getElementById('ob-charts-container');
                chartContainer.innerHTML = '';
                this.renderSingleChart(timeframe, chartTf, true);
            };
            container.appendChild(btn);
        });
    }

    renderSingleChart(mainTf, chartTf, directRender = false) {
        const tfData = this.obDynamicsData.timeframes[mainTf];
        const chartData = tfData.charts[chartTf];

        if (!chartData || !chartData.chart_json) return;

        const container = document.getElementById('ob-charts-container');

        // Crear contenedor principal del gráfico
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'unified-chart-container';

        // Crear div para el gráfico directamente con ID específico
        const chartDiv = document.createElement('div');
        chartDiv.id = `chart-${mainTf}-${chartTf}`.replace(/[^a-zA-Z0-9]/g, '-');
        chartDiv.style.width = '100%';
        chartDiv.style.height = '650px';

        chartWrapper.appendChild(chartDiv);

        // Metadata opcional
        if (chartData.metadata) {
            const metadata = document.createElement('div');
            metadata.className = 'chart-metadata';
            metadata.innerHTML = `
                <div style="margin: 1rem 0; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 6px; font-size: 0.9rem;">
                    <strong>📊 Información del Gráfico:</strong><br>
                    <span style="color: var(--text-secondary);">TF: ${Utils.escapeHtml(chartTf)} | Generado: ${Utils.escapeHtml(chartData.metadata.generated_at || 'N/A')}</span>
                    ${chartData.metadata.zoom_info ? `<br><span style="color: var(--text-muted); font-size: 0.8rem;">Zoom: ${Utils.escapeHtml(chartData.metadata.zoom_info.period)} (${Utils.escapeHtml(chartData.metadata.zoom_info.start)} - ${Utils.escapeHtml(chartData.metadata.zoom_info.end)})</span>` : ''}
                </div>
            `;
            chartWrapper.appendChild(metadata);
        }

        if (directRender) {
            container.innerHTML = '';
        }
        container.appendChild(chartWrapper);

        // Renderizar con Plotly
        try {
            const plotlyData = JSON.parse(chartData.chart_json);

            // Ajustar layout para el diseño unificado
            if (plotlyData.layout) {
                plotlyData.layout.height = 650;
                plotlyData.layout.margin = { l: 80, r: 80, t: 80, b: 80 };
                plotlyData.layout.font = { size: 12 };
                if (plotlyData.layout.xaxis) {
                    plotlyData.layout.xaxis.tickfont = { size: 11 };
                }
                if (plotlyData.layout.yaxis) {
                    plotlyData.layout.yaxis.tickfont = { size: 11 };
                }
            }

            if (window.Plotly) {
                window.Plotly.newPlot(chartDiv.id, plotlyData.data, plotlyData.layout, {
                    responsive: true,
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['select2d', 'lasso2d'],
                    toImageButtonOptions: {
                        format: 'png',
                        filename: `OB_Chart_${mainTf}_${chartTf}`,
                        height: 650,
                        width: 1400,
                        scale: 2
                    }
                });
            } else {
                chartDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">❌ Plotly.js no está cargado</div>';
            }
        } catch (error) {
            console.error('Error rendering chart:', error);
            chartDiv.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--error);">❌ Error al renderizar gráfico: ${Utils.escapeHtml(error.message)}</div>`;
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
        return window.fibonacciReport.obDynamics.generateObDynamics();
    }
    return Promise.reject(new Error('OB Dynamics not initialized'));
};

window.switchObTimeframe = function(timeframe) {
    if (window.fibonacciReport && window.fibonacciReport.obDynamics) {
        window.fibonacciReport.obDynamics.switchObTimeframe(timeframe);
        window.currentObTimeframe = timeframe;
    }
};

window.selectSpecificChart = function(chartTimeframe) {
    if (window.fibonacciReport && window.fibonacciReport.obDynamics) {
        window.fibonacciReport.obDynamics.selectSpecificChart(chartTimeframe);
    }
};

// Function to navigate and switch with chart
window.navigateToObDynamicsWithChart = function(mainTimeframe, chartTimeframe) {
    if (window.fibonacciReport && window.fibonacciReport.obDynamics) {
        window.fibonacciReport.navigateToObDynamicsWithChart(mainTimeframe, chartTimeframe);
    }
};

window.navigateToObDynamics = function(timeframe) {
    if (window.fibonacciReport && window.fibonacciReport.obDynamics) {
        window.fibonacciReport.navigateToObDynamics(timeframe);
    }
};