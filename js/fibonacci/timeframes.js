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

    generateLevelItems(timeframe) {
        // Get Fibonacci levels
        const fibLevels = timeframe.fibonacci_levels || timeframe.price_data || {};
        const fib50 = fibLevels.level_50_percent || fibLevels['50_percent'];
        const fib618 = fibLevels.level_618_percent || fibLevels['618_percent'];
        const fib786 = fibLevels.level_786_percent || fibLevels['786_percent'];
        const fib100 = fibLevels.level_100_percent || fibLevels['100_percent'];

        // Get OB data - check both old and new structures
        let hasOB = false;
        let obPrice = null;

        if (timeframe.order_block && timeframe.order_block.ob_price) {
            // Old structure
            hasOB = true;
            obPrice = timeframe.order_block.ob_price;
        } else if (timeframe.optimal_order_block && timeframe.optimal_order_block.price) {
            // New structure
            hasOB = true;
            obPrice = timeframe.optimal_order_block.price;
        }

        let levelItems = '';

        // Add Fibonacci levels
        if (fib50) {
            levelItems += `
                <div class="level-item">
                    <span class="level-name">Nivel 50%</span>
                    <span class="level-value">${fib50.toFixed(5)}</span>
                </div>
            `;
        }

        if (fib618) {
            levelItems += `
                <div class="level-item">
                    <span class="level-name">Nivel 61.8%</span>
                    <span class="level-value">${fib618.toFixed(5)}</span>
                </div>
            `;
        }

        if (fib786) {
            levelItems += `
                <div class="level-item">
                    <span class="level-name">Nivel 78.6%</span>
                    <span class="level-value">${fib786.toFixed(5)}</span>
                </div>
            `;
        }

        if (obPrice) {
            levelItems += `
                <div class="level-item">
                    <span class="level-name">OB Óptimo</span>
                    <span class="level-value">${obPrice.toFixed(5)}</span>
                </div>
            `;
        }

        if (fib100) {
            levelItems += `
                <div class="level-item">
                    <span class="level-name">STOPHUNT</span>
                    <span class="level-value">${fib100.toFixed(5)}</span>
                </div>
            `;
        }

        return levelItems || '<div class="level-item"><span class="level-name">No hay niveles disponibles</span></div>';
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
        card.className = 'timeframe-card';

        // Add click event to navigate to OB Dinámicos
        card.addEventListener('click', () => {
            if (window.navigateToObDynamics) {
                window.navigateToObDynamics(timeframe.timeframe_general);
            }
        });

        // Remove level activation data access as counters are moved to Niveles D tab

        card.innerHTML = `
            <div class="card-header">
                <h2 class="timeframe">${timeframe.timeframe_general}</h2>
                <span class="trend-badge">Tendencia ${timeframe.trend.toUpperCase()}</span>
            </div>

            <div class="price-section">
                <div class="price-box">
                    <div class="price-label">High</div>
                    <div class="price-value high-price">${highValue.toFixed(5)}</div>
                    <div class="price-date">${highDateTime}</div>
                </div>
                <div class="price-box">
                    <div class="price-label">Low</div>
                    <div class="price-value low-price">${lowValue.toFixed(5)}</div>
                    <div class="price-date">${lowDateTime}</div>
                </div>
            </div>

            <div class="range-info">
                <div class="range-item">
                    <div class="range-label">Rango</div>
                    <div class="range-value">${range}</div>
                </div>
                <div class="range-item">
                    <div class="range-label">StopHunt</div>
                    <div class="range-value">${timeframe.stophunt_price ? timeframe.stophunt_price.toFixed(5) : fib50?.toFixed(5) || 'N/A'}</div>
                </div>
            </div>


            <div class="activation-levels">
                <div class="section-title">Niveles de Activación</div>
                ${this.generateLevelItems(timeframe)}
            </div>

            ${timeframe.optimal_order_block && timeframe.optimal_order_block.scoring_result ? `
            <div class="score-section">
                <div class="score-header">
                    <div class="score-title">Score del OB Óptimo [${timeframe.optimal_order_block.origin_timeframe || timeframe.timeframe_general}]</div>
                    <div class="score-value">${timeframe.optimal_order_block.scoring_result.final_score.toFixed(3)}</div>
                </div>
                <div class="score-details">
                    ${Object.entries(timeframe.optimal_order_block.scoring_result.components).slice(0, 3).map(([key, component]) => `
                        <div class="score-item">
                            <div class="score-item-label">${key}</div>
                            <div class="score-item-value">${component.weighted.toFixed(3)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div class="position-section">
                <div class="position-title">POSICIÓN</div>
                <div class="position-value">
                    ${positionStatus || 'N/A'} ${typeof positionDistance === 'string' ? positionDistance : ((positionDirection === 'above' || positionDirection === 'ABOVE') ? '+' : '') + Math.round(positionDistance) + ' pips'}
                </div>
                <div class="position-details">
                    <span>Ventana: ${windowDays} ${typeof windowDays === 'number' || (typeof windowDays === 'string' && !windowDays.includes('días')) ? 'días' : ''}</span>
                    <span class="pulse">${hasOB ? 'Order Block encontrado' : 'Order Block no encontrado'}</span>
                </div>
            </div>

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