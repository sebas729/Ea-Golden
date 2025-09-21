/**
 * Statistics Manager
 * Handles display of system statistics and performance metrics
 */

import { setupsApi } from '../services/setupsApi.js';

export class StatisticsManager {
    constructor() {
        this.statistics = {};
        this.pipelineStatsContainer = null;
        this.performanceMetricsContainer = null;
        this.systemHealthContainer = null;
    }

    /**
     * Initialize the statistics manager
     */
    async init() {
        this.pipelineStatsContainer = document.getElementById('pipeline-stats');
        this.performanceMetricsContainer = document.getElementById('performance-metrics');
        this.systemHealthContainer = document.getElementById('system-health');

        if (!this.pipelineStatsContainer || !this.performanceMetricsContainer || !this.systemHealthContainer) {
            throw new Error('Statistics containers not found');
        }

        console.log('StatisticsManager initialized');
    }

    /**
     * Update statistics with new data
     * @param {Object} data - Statistics data object
     */
    async update(data) {
        try {
            // Load fresh statistics data
            const fullStats = await this.loadFullStatistics();
            this.statistics = fullStats || data || {};

            this.renderPipelineStats();
            this.renderPerformanceMetrics();
            this.renderSystemHealth();
        } catch (error) {
            console.error('Error updating statistics:', error);
            // Fallback to provided data
            this.statistics = data || {};
            this.renderPipelineStats();
            this.renderPerformanceMetrics();
            this.renderSystemHealth();
        }
    }

    /**
     * Load complete statistics from API
     * @returns {Promise<Object>} Full statistics data
     */
    async loadFullStatistics() {
        try {
            return await setupsApi.getStatistics();
        } catch (error) {
            console.warn('Could not load full statistics, using cached data:', error);
            return null;
        }
    }

    /**
     * Render pipeline statistics
     */
    renderPipelineStats() {
        if (!this.pipelineStatsContainer) return;

        const pipelineStats = this.statistics.pipeline_stats || this.statistics;

        const statsHtml = `
            <div class="stat-item">
                <div class="stat-label">Última Ejecución</div>
                <div class="stat-value">
                    ${this.formatDateTime(pipelineStats.last_run)}
                </div>
            </div>

            <div class="stat-item">
                <div class="stat-label">Tiempo de Ejecución</div>
                <div class="stat-value">
                    ${(pipelineStats.execution_time_ms || 0).toFixed(1)}
                    <span class="stat-unit">ms</span>
                </div>
            </div>

            <div class="stat-item">
                <div class="stat-label">Niveles Procesados</div>
                <div class="stat-value">${pipelineStats.levels_processed || 0}</div>
            </div>

            <div class="stat-item">
                <div class="stat-label">Confluencias Detectadas</div>
                <div class="stat-value">${pipelineStats.confluences_detected || 0}</div>
            </div>

            <div class="stat-item">
                <div class="stat-label">Setups Generados</div>
                <div class="stat-value">${pipelineStats.setups_generated || 0}</div>
            </div>

            <div class="stat-item">
                <div class="stat-label">Tasa de Éxito</div>
                <div class="stat-value ${this.getSuccessRateClass(pipelineStats.success_rate)}">
                    ${(pipelineStats.success_rate || 0).toFixed(1)}
                    <span class="stat-unit">%</span>
                </div>
            </div>
        `;

        this.pipelineStatsContainer.innerHTML = statsHtml;
    }

    /**
     * Render performance metrics
     */
    renderPerformanceMetrics() {
        if (!this.performanceMetricsContainer) return;

        const performanceMetrics = this.statistics.performance_metrics || {};

        const metricsHtml = `
            <div class="stat-item">
                <div class="stat-label">Tiempo Promedio de Actualización</div>
                <div class="stat-value">
                    ${(performanceMetrics.average_update_time || 0).toFixed(1)}
                    <span class="stat-unit">ms</span>
                </div>
            </div>

            <div class="stat-item">
                <div class="stat-label">Tasa de Éxito General</div>
                <div class="stat-value ${this.getSuccessRateClass(performanceMetrics.success_rate)}">
                    ${(performanceMetrics.success_rate || 0).toFixed(1)}
                    <span class="stat-unit">%</span>
                </div>
            </div>

            <div class="stat-item">
                <div class="stat-label">Total de Actualizaciones</div>
                <div class="stat-value">${performanceMetrics.total_updates || 0}</div>
            </div>

            <div class="stat-item">
                <div class="stat-label">Actualizaciones por Hora</div>
                <div class="stat-value">
                    ${this.calculateUpdatesPerHour(performanceMetrics.total_updates)}
                </div>
            </div>

            <div class="stat-item">
                <div class="stat-label">Tiempo de Actividad</div>
                <div class="stat-value">${this.calculateUptime()}</div>
            </div>

            <div class="stat-item">
                <div class="stat-label">Rendimiento General</div>
                <div class="stat-value ${this.getPerformanceClass(performanceMetrics)}">
                    ${this.calculateOverallPerformance(performanceMetrics)}
                </div>
            </div>
        `;

        this.performanceMetricsContainer.innerHTML = metricsHtml;
    }

    /**
     * Render system health indicators
     */
    renderSystemHealth() {
        if (!this.systemHealthContainer) return;

        const systemHealth = this.statistics.system_health || {};

        const healthHtml = `
            <div class="health-indicator">
                <div class="health-label">Integración Conectada</div>
                <div class="health-status ${systemHealth.integration_connected ? 'health-connected' : 'health-disconnected'}">
                    ${systemHealth.integration_connected ? 'CONECTADO' : 'DESCONECTADO'}
                </div>
            </div>

            <div class="health-indicator">
                <div class="health-label">Orchestrator Disponible</div>
                <div class="health-status ${systemHealth.orchestrator_available ? 'health-connected' : 'health-disconnected'}">
                    ${systemHealth.orchestrator_available ? 'DISPONIBLE' : 'NO DISPONIBLE'}
                </div>
            </div>

            <div class="health-indicator">
                <div class="health-label">Última Actualización</div>
                <div class="health-time">
                    ${this.formatDateTime(systemHealth.last_update)}
                </div>
            </div>

            <div class="health-indicator">
                <div class="health-label">Errores Recientes</div>
                <div class="health-status ${this.getErrorsClass(systemHealth.errors_count)}">
                    ${systemHealth.errors_count || 0} ERRORES
                </div>
            </div>

            <div class="health-indicator">
                <div class="health-label">Estado General del Sistema</div>
                <div class="health-status ${this.getOverallHealthClass(systemHealth)}">
                    ${this.getOverallHealthStatus(systemHealth)}
                </div>
            </div>
        `;

        this.systemHealthContainer.innerHTML = healthHtml;
    }

    /**
     * Format date/time for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date/time
     */
    formatDateTime(dateString) {
        if (!dateString) return 'No disponible';

        try {
            const date = new Date(dateString);
            return date.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return 'Formato inválido';
        }
    }

    /**
     * Get CSS class for success rate
     * @param {number} rate - Success rate percentage
     * @returns {string} CSS class
     */
    getSuccessRateClass(rate) {
        if (rate >= 95) return 'score-excellent';
        if (rate >= 80) return 'score-good';
        if (rate >= 60) return 'score-fair';
        return 'score-poor';
    }

    /**
     * Get CSS class for error count
     * @param {number} count - Error count
     * @returns {string} CSS class
     */
    getErrorsClass(count) {
        if (count === 0) return 'health-connected';
        if (count <= 5) return 'health-warning';
        return 'health-disconnected';
    }

    /**
     * Calculate updates per hour
     * @param {number} totalUpdates - Total updates
     * @returns {string} Updates per hour
     */
    calculateUpdatesPerHour(totalUpdates) {
        // Assuming system has been running for at least 1 hour
        // This is a simplified calculation
        const estimatedHours = Math.max(1, Math.floor(totalUpdates / 120)); // 2 updates per minute
        return Math.round(totalUpdates / estimatedHours).toString();
    }

    /**
     * Calculate system uptime
     * @returns {string} Uptime string
     */
    calculateUptime() {
        // This is a placeholder - in real implementation,
        // you would track actual start time
        return '24h 15m';
    }

    /**
     * Calculate overall performance score
     * @param {Object} metrics - Performance metrics
     * @returns {string} Performance rating
     */
    calculateOverallPerformance(metrics) {
        const successRate = metrics.success_rate || 0;
        const avgUpdateTime = metrics.average_update_time || 0;

        if (successRate >= 95 && avgUpdateTime <= 50) return 'EXCELENTE';
        if (successRate >= 80 && avgUpdateTime <= 100) return 'BUENO';
        if (successRate >= 60 && avgUpdateTime <= 200) return 'REGULAR';
        return 'DEFICIENTE';
    }

    /**
     * Get CSS class for performance
     * @param {Object} metrics - Performance metrics
     * @returns {string} CSS class
     */
    getPerformanceClass(metrics) {
        const performance = this.calculateOverallPerformance(metrics);
        switch (performance) {
            case 'EXCELENTE': return 'score-excellent';
            case 'BUENO': return 'score-good';
            case 'REGULAR': return 'score-fair';
            default: return 'score-poor';
        }
    }

    /**
     * Get overall health status
     * @param {Object} health - System health data
     * @returns {string} Health status
     */
    getOverallHealthStatus(health) {
        const isConnected = health.integration_connected && health.orchestrator_available;
        const hasErrors = (health.errors_count || 0) > 0;
        const isRecent = this.isRecentUpdate(health.last_update);

        if (isConnected && !hasErrors && isRecent) return 'SALUDABLE';
        if (isConnected && !hasErrors) return 'ESTABLE';
        if (isConnected && hasErrors) return 'CON PROBLEMAS';
        return 'CRÍTICO';
    }

    /**
     * Get CSS class for overall health
     * @param {Object} health - System health data
     * @returns {string} CSS class
     */
    getOverallHealthClass(health) {
        const status = this.getOverallHealthStatus(health);
        switch (status) {
            case 'SALUDABLE': return 'health-connected';
            case 'ESTABLE': return 'health-connected';
            case 'CON PROBLEMAS': return 'health-warning';
            default: return 'health-disconnected';
        }
    }

    /**
     * Check if update is recent (within last 5 minutes)
     * @param {string} lastUpdate - Last update timestamp
     * @returns {boolean} Is recent
     */
    isRecentUpdate(lastUpdate) {
        if (!lastUpdate) return false;

        try {
            const updateTime = new Date(lastUpdate);
            const now = new Date();
            const diffMs = now - updateTime;
            const diffMinutes = diffMs / (1000 * 60);
            return diffMinutes <= 5;
        } catch (error) {
            return false;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorHtml = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="refresh-button" onclick="loadSetupsData(true)">
                    🔄 Reintentar
                </button>
            </div>
        `;

        if (this.pipelineStatsContainer) {
            this.pipelineStatsContainer.innerHTML = errorHtml;
        }
        if (this.performanceMetricsContainer) {
            this.performanceMetricsContainer.innerHTML = errorHtml;
        }
        if (this.systemHealthContainer) {
            this.systemHealthContainer.innerHTML = errorHtml;
        }
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            statistics: this.statistics,
            overallHealth: this.getOverallHealthStatus(this.statistics.system_health || {}),
            performance: this.calculateOverallPerformance(this.statistics.performance_metrics || {}),
            lastUpdate: this.statistics.system_health?.last_update
        };
    }

    /**
     * Export statistics as JSON
     * @returns {string} JSON string
     */
    exportStatistics() {
        return JSON.stringify(this.statistics, null, 2);
    }

    /**
     * Get key performance indicators
     * @returns {Object} KPIs
     */
    getKPIs() {
        const pipelineStats = this.statistics.pipeline_stats || {};
        const performanceMetrics = this.statistics.performance_metrics || {};
        const systemHealth = this.statistics.system_health || {};

        return {
            successRate: pipelineStats.success_rate || 0,
            averageExecutionTime: pipelineStats.execution_time_ms || 0,
            setupsGenerated: pipelineStats.setups_generated || 0,
            confluencesDetected: pipelineStats.confluences_detected || 0,
            systemHealth: this.getOverallHealthStatus(systemHealth),
            errorsCount: systemHealth.errors_count || 0,
            lastUpdate: systemHealth.last_update
        };
    }
}