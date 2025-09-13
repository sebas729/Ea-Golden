/**
 * Timeframe Cards Module
 * Handles the display and interaction of timeframe analysis cards
 */

import { Utils } from '../shared/utils.js';

export class TimeframeCards {
    constructor() {
        this.reportData = null;
        this.grid = null;
    }

    populate(reportData) {
        this.reportData = reportData;
        this.grid = document.getElementById('timeframes-grid');

        if (!this.grid) {
            console.error('Timeframes grid element not found');
            return;
        }

        if (!reportData.timeframes || !Array.isArray(reportData.timeframes)) {
            console.warn('No timeframes data available');
            this.showEmptyState();
            return;
        }

        try {
            this.clearGrid();
            this.renderTimeframes();
            console.log(`Rendered ${reportData.timeframes.length} timeframe cards`);
        } catch (error) {
            console.error('Error populating timeframes:', error);
            this.showErrorState(error.message);
        }
    }

    clearGrid() {
        if (this.grid) {
            this.grid.innerHTML = '';
        }
    }

    renderTimeframes() {
        this.reportData.timeframes.forEach(timeframe => {
            const card = this.createTimeframeCard(timeframe);
            this.grid.appendChild(card);
        });
    }

    createTimeframeCard(timeframe) {
        // Support both old and new JSON structure
        const isBullish = (timeframe.trend_status === 'bullish') || (timeframe.trend === 'BUY');

        // Check for order block in both structures
        let hasOB = false;
        let obPrice = null;
        let obStatus = '';

        if (timeframe.order_block && timeframe.order_block.found) {
            // Old structure
            hasOB = timeframe.order_block.found;
            obPrice = timeframe.order_block.price;
            obStatus = '✅ Order Block encontrado';
        } else if (timeframe.optimal_order_block && timeframe.optimal_order_block.status) {
            // New structure
            hasOB = timeframe.optimal_order_block.status.includes('encontrado');
            obPrice = timeframe.optimal_order_block.price;
            obStatus = timeframe.optimal_order_block.status;
        }

        // Market structure handling
        const marketData = timeframe.market_structure || timeframe.price_data;
        const highValue = marketData.high.value || marketData.high.price;
        const lowValue = marketData.low.value || marketData.low.price;
        const highDateTime = marketData.high.datetime;
        const lowDateTime = marketData.low.datetime;

        // Range calculation
        const range = marketData.range || (marketData.range_pips ? Math.round(marketData.range_pips) : Math.round((highValue - lowValue) * 10000));

        // Fibonacci levels
        const fibLevels = timeframe.fibonacci_levels || timeframe.price_data || {};
        const fib50 = fibLevels.level_50_percent || fibLevels['50_percent'];
        const fib618 = fibLevels.level_618_percent || fibLevels['618_percent'];
        const fib786 = fibLevels.level_786_percent || fibLevels['786_percent'];

        // Position info
        const positionData = timeframe.position || timeframe.price_position || {};
        const positionStatus = positionData.status;
        const positionDistance = positionData.distance || positionData.pips;
        const positionDirection = positionData.direction || positionData.location;

        // Analysis window
        let windowDays = 'N/A';
        if (timeframe.market_structure && timeframe.market_structure.analysis_window) {
            windowDays = timeframe.market_structure.analysis_window;
        } else if (timeframe.analysis_window && timeframe.analysis_window.days) {
            windowDays = timeframe.analysis_window.days;
        } else if (timeframe.analysis_window) {
            windowDays = timeframe.analysis_window;
        } else if (marketData.analysis_window) {
            windowDays = marketData.analysis_window;
        }

        const card = document.createElement('div');
        card.className = 'card clickable-hint';

        // Add click event to navigate to OB Dinámicos
        card.addEventListener('click', () => {
            if (window.navigateToObDynamics) {
                window.navigateToObDynamics(timeframe.timeframe_general);
            }
        });

        card.innerHTML = `
            <div class="card-header">
                <div class="timeframe">${timeframe.timeframe_general}</div>
                <div class="trend-badge ${!isBullish ? 'bearish' : ''}">
                    TENDENCIA ${timeframe.trend.toUpperCase()}
                </div>
            </div>

            <div class="price-levels">
                <div class="level">
                    <div class="level-label">HIGH</div>
                    <div class="level-value high-value">${highValue.toFixed(5)}</div>
                    <div class="level-datetime">${highDateTime}</div>
                </div>
                <div class="level">
                    <div class="level-label">LOW</div>
                    <div class="level-value low-value">${lowValue.toFixed(5)}</div>
                    <div class="level-datetime">${lowDateTime}</div>
                </div>
            </div>

            <div class="metrics">
                <div class="metric">
                    <div class="metric-label">RANGO</div>
                    <div class="metric-value">${range}</div>
                </div>
                ${timeframe.stophunt_price ? `
                <div class="metric">
                    <div class="metric-label">STOPHUNT</div>
                    <div class="metric-value" style="color: #00d4aa;">${timeframe.stophunt_price.toFixed(5)}</div>
                </div>
                ` : `
                <div class="metric">
                    <div class="metric-label">NIVEL 50%</div>
                    <div class="metric-value" style="color: #fbbf24;">${fib50 ? fib50.toFixed(5) : 'N/A'}</div>
                </div>
                `}
            </div>

            <div class="fibonacci-levels">
                <div class="fib-title">Niveles de activación</div>
                ${fib50 ? `
                <div class="fib-level">
                    <span class="fib-label">Nivel 50%</span>
                    <span style="color: #fbbf24;">${fib50.toFixed(5)}</span>
                </div>
                ` : ''}
                ${fib618 ? `
                <div class="fib-level">
                    <span class="fib-label">Nivel 61.8%</span>
                    <span style="color: #a855f7;">${fib618.toFixed(5)}</span>
                </div>
                ` : ''}
                ${fib786 ? `
                <div class="fib-level">
                    <span class="fib-label">Nivel 78.6%</span>
                    <span style="color: #f97316;">${fib786.toFixed(5)}</span>
                </div>
                ` : ''}
                ${hasOB && obPrice ? `
                <div class="fib-level">
                    <span class="fib-label">OB Óptimo</span>
                    <span style="color: #00d4aa;">${obPrice.toFixed(5)}</span>
                </div>
                ` : ''}
                ${timeframe.stophunt_price ? `
                <div class="fib-level">
                    <span class="fib-label">STOPHUNT</span>
                    <span style="color: #00d4aa;">${timeframe.stophunt_price.toFixed(5)}</span>
                </div>
                ` : ''}
            </div>

            ${timeframe.optimal_order_block && timeframe.optimal_order_block.scoring_result ? `
            <div class="scoring-info">
                <div class="score-title">Score del OB Óptimo [${timeframe.optimal_order_block.origin_timeframe || timeframe.optimal_order_block.timeframe || 'N/A'}]: ${timeframe.optimal_order_block.scoring_result.final_score.toFixed(3)}</div>
                <div class="score-breakdown">
                    ${Object.entries(timeframe.optimal_order_block.scoring_result.components).map(([key, component]) => `
                        <div class="score-component">
                            <span class="score-label">${key}:</span>
                            <span class="score-value">${component.weighted.toFixed(3)}</span>
                        </div>
                    `).join('')}
                </div>
                ${timeframe.optimal_order_block.selection_summary ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 215, 0, 0.2);">
                    <div class="score-component">
                        <span class="score-label">Total OBs Analizados:</span>
                        <span class="score-value">${timeframe.optimal_order_block.selection_summary.total_obs_analyzed}</span>
                    </div>
                    <div class="score-component" style="grid-column: 1 / -1;">
                        <span class="score-label">Razón de Selección:</span>
                        <span class="score-value" style="font-size: 10px;">${timeframe.optimal_order_block.selection_summary.selection_reason}</span>
                    </div>
                </div>
                ` : ''}
            </div>
            ` : ''}

            <div class="position-info">
                <div>
                    <div class="position-label">POSICIÓN</div>
                    <div class="position-value">
                        ${positionStatus} ${typeof positionDistance === 'string' ? positionDistance : ((positionDirection === 'above' || positionDirection === 'ABOVE') ? '+' : '') + Math.round(positionDistance) + ' pips'}
                    </div>
                </div>
            </div>

            <div class="volume-indicator">
                <span class="volume-label">Ventana: ${windowDays} ${typeof windowDays === 'number' || (typeof windowDays === 'string' && !windowDays.includes('días')) ? 'días' : ''}</span>
                <span class="volume-value">
                    ${obStatus || (hasOB ? '✅ Order Block encontrado' : '❌ Order Block no encontrado')}
                </span>
            </div>

            ${timeframe.level_activation_status ? `
                <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(255, 255, 255, 0.02); border-radius: 6px; border: 1px solid var(--border);">
                    <div style="font-size: 0.85rem; font-weight: 600; color: var(--accent); margin-bottom: 0.5rem;">🔄 Estado de Niveles:</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem;">
                        <span><strong>Total:</strong> <span style="color: var(--text-primary);">${timeframe.level_activation_status.total_levels || 0}</span></span>
                        <span><strong>Activos:</strong> <span style="color: #00d4aa;">${timeframe.level_activation_status.active_levels || 0}</span></span>
                        <span><strong>Desactivados:</strong> <span style="color: #f44336;">${timeframe.level_activation_status.deactivated_levels || 0}</span></span>
                    </div>
                    ${timeframe.level_activation_status.active_level_details && timeframe.level_activation_status.active_level_details.length > 0 ? `
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">
                            <strong>Niveles Activos:</strong>
                            <div style="margin-top: 0.25rem;">
                                ${timeframe.level_activation_status.active_level_details.map(level => `
                                    <div style="margin: 0.125rem 0;">
                                        • ${level.name}: ${level.value} ${level.is_active ? '✅' : '❌'}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        `;

        return card;
    }

    showEmptyState() {
        if (this.grid) {
            this.grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <p>No timeframe data available</p>
                </div>
            `;
        }
    }

    showErrorState(message) {
        if (this.grid) {
            this.grid.innerHTML = `
                <div class="error">
                    <h3>❌ Error</h3>
                    <p>${Utils.escapeHtml(message)}</p>
                </div>
            `;
        }
    }

    // Get timeframe data by name
    getTimeframeData(timeframeName) {
        if (!this.reportData || !this.reportData.timeframes) return null;

        return this.reportData.timeframes.find(tf => tf.timeframe === timeframeName);
    }

    // Highlight specific timeframe card
    highlightTimeframe(timeframeName) {
        const cards = this.grid?.querySelectorAll('.card');
        if (!cards) return;

        cards.forEach(card => {
            card.classList.remove('highlighted');
            if (card.getAttribute('data-timeframe') === timeframeName) {
                card.classList.add('highlighted');
                Utils.scrollToElement(card);
            }
        });
    }
}