/**
 * Configuration Section Module
 * Handles the display of configuration and legend information
 */

import { Utils } from '../shared/utils.js';

export class ConfigSection {
    constructor() {
        this.reportData = null;
    }

    populate(reportData) {
        this.reportData = reportData;
        const configContainer = document.getElementById('config-content');
        const legendContainer = document.getElementById('legend-content');

        if (configContainer) {
            this.populateConfiguration(configContainer);
        }

        if (legendContainer) {
            this.populateLegend(legendContainer);
        }
    }

    populateConfiguration(configContainer) {
        // Configuration for both old and new structure
        if (!this.reportData.configuration && !this.reportData.trading_summary) {
            configContainer.innerHTML = '<p>Configuración no disponible en este reporte</p>';
        } else {
            let configHtml = '';

            // Old structure configuration
            if (this.reportData.configuration) {
                const activationLevels = this.reportData.configuration.activation_levels ?
                    Object.entries(this.reportData.configuration.activation_levels)
                        .map(([tf, level]) => `
                            <div class="config-item">
                                <span>${tf}</span>
                                <span class="config-value">${level}%</span>
                            </div>
                        `).join('') : '';

                configHtml += `
                    ${activationLevels ? `
                        <div class="config-section">
                            <h3>📋 Niveles de Activación:</h3>
                            ${activationLevels}
                        </div>
                    ` : ''}
                    ${this.reportData.configuration.order_blocks ? `
                        <div class="config-section">
                            <h3>🧩 Order Blocks:</h3>
                            <p>${this.reportData.configuration.order_blocks.description}</p>
                        </div>
                    ` : ''}
                    ${this.reportData.configuration.stophunt ? `
                        <div class="config-section">
                            <h3>🔥 Stophunt:</h3>
                            <p>${this.reportData.configuration.stophunt.description}</p>
                        </div>
                    ` : ''}
                `;
            }

            // New structure summary
            if (this.reportData.trading_summary) {
                configHtml += `
                    <div class="config-section">
                        <h3>📈 Resumen de Trading:</h3>
                        <div class="config-item">
                            <span>Tendencia Global:</span>
                            <span class="config-value">${this.reportData.trading_summary.global_trend}</span>
                        </div>
                        <div class="config-item">
                            <span>Confianza General:</span>
                            <span class="config-value">${this.reportData.trading_summary.overall_confidence}</span>
                        </div>
                        ${this.reportData.trading_summary.dynamic_deactivation_enabled !== undefined ? `
                            <div class="config-item">
                                <span>🔄 Desactivación Dinámica:</span>
                                <span class="config-value" style="color: ${this.reportData.trading_summary.dynamic_deactivation_enabled ? '#00d4aa' : '#f44336'}">${this.reportData.trading_summary.dynamic_deactivation_enabled ? 'ACTIVADA' : 'DESACTIVADA'}</span>
                            </div>
                            ${this.reportData.trading_summary.dynamic_deactivation_enabled ? `
                                <div class="config-item">
                                    <span>📊 Niveles Desactivados:</span>
                                    <span class="config-value">${this.reportData.trading_summary.total_deactivated_levels || 0}</span>
                                </div>
                                <div class="config-item">
                                    <span>✅ Niveles Activos:</span>
                                    <span class="config-value">${this.reportData.trading_summary.active_levels_remaining || 0}</span>
                                </div>
                            ` : ''}
                        ` : ''}
                        ${this.reportData.trading_summary.best_institutional_ob ? `
                            <div class="config-item">
                                <span>Mejor OB Institucional:</span>
                                <span class="config-value">${this.reportData.trading_summary.best_institutional_ob.timeframe_resume} @ ${this.reportData.trading_summary.best_institutional_ob.entry}</span>
                            </div>
                            <div class="config-item">
                                <span>Score del Mejor OB:</span>
                                <span class="config-value">${this.reportData.trading_summary.best_institutional_ob.score.toFixed(3)}</span>
                            </div>
                            <div class="config-item">
                                <span>Confianza del OB:</span>
                                <span class="config-value">${this.reportData.trading_summary.best_institutional_ob.confidence}</span>
                            </div>
                        ` : ''}
                    </div>
                `;
            }

            // Summary for old structure
            if (this.reportData.summary && !this.reportData.trading_summary) {
                configHtml += `
                    <div class="config-section">
                        <h3>📈 Resumen del Análisis:</h3>
                        <div class="config-item">
                            <span>Timeframes Analizados:</span>
                            <span class="config-value">${this.reportData.summary.total_timeframes_analyzed}</span>
                        </div>
                        <div class="config-item">
                            <span>Timeframes Alcistas:</span>
                            <span class="config-value">${this.reportData.summary.bullish_timeframes}</span>
                        </div>
                        <div class="config-item">
                            <span>Timeframes Bajistas:</span>
                            <span class="config-value">${this.reportData.summary.bearish_timeframes}</span>
                        </div>
                        <div class="config-item">
                            <span>Total Order Blocks:</span>
                            <span class="config-value">${this.reportData.summary.order_blocks_found.total}</span>
                        </div>
                        <div class="config-item">
                            <span>Tendencia Dominante:</span>
                            <span class="config-value">${this.reportData.summary.overall_trend}</span>
                        </div>
                    </div>
                `;
            }

            configContainer.innerHTML = configHtml;
        }
    }

    populateLegend(legendContainer) {
        // Legend (enhanced for new structure)
        legendContainer.innerHTML = `
            <div class="config-item">
                <span>BUY/Bullish:</span>
                <span>Tendencia alcista</span>
            </div>
            <div class="config-item">
                <span>SELL/Bearish:</span>
                <span>Tendencia bajista</span>
            </div>
            <div class="config-item">
                <span>Order Block Óptimo:</span>
                <span>OB seleccionado por algoritmo de scoring</span>
            </div>
            <div class="config-item">
                <span>Score:</span>
                <span>Puntuación de calidad del Order Block</span>
            </div>
            <div class="config-item">
                <span>Confluence:</span>
                <span>Confluencia entre diferentes timeframes</span>
            </div>
            <div class="config-item">
                <span>50% Level:</span>
                <span>Nivel de retroceso de Fibonacci</span>
            </div>
        `;
    }
}