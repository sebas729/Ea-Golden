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

        // Main card container
        const card = document.createElement('div');
        card.className = 'card clickable-hint';
        card.setAttribute('data-timeframe', timeframe.timeframe);

        // Add click handler for navigation to order blocks
        card.addEventListener('click', () => {
            if (window.navigateToOrderBlock) {
                window.navigateToOrderBlock(timeframe.timeframe);
            }
        });

        // Get market data
        const marketData = timeframe.market_structure || timeframe.price_data;
        const highValue = marketData.high.value || marketData.high.price;
        const lowValue = marketData.low.value || marketData.low.price;
        const highDateTime = marketData.high.datetime;
        const lowDateTime = marketData.low.datetime;

        // Calculate range
        const range = marketData.range || (marketData.range_pips ? Math.round(marketData.range_pips) : Math.round((highValue - lowValue) * 10000));

        // Get fibonacci levels
        const fibLevels = timeframe.fibonacci_levels || timeframe.price_data || {};
        const fib50 = fibLevels.level_50_percent || fibLevels['50_percent'];
        const fib618 = fibLevels.level_618_percent || fibLevels['618_percent'];
        const fib786 = fibLevels.level_786_percent || fibLevels['786_percent'];

        // Get position data
        const positionData = timeframe.position || timeframe.price_position || {};
        const positionStatus = positionData.status;
        const positionDistance = positionData.distance || positionData.pips;
        const positionDirection = positionData.direction || positionData.location;

        card.innerHTML = `
            <div class="card-header">
                <div class="timeframe">${timeframe.timeframe}</div>
                <div class="trend-badge ${isBullish ? 'bullish' : 'bearish'}">
                    ${isBullish ? 'BULLISH' : 'BEARISH'}
                </div>
            </div>

            <div class="price-levels">
                <div class="level">
                    <div class="level-label">HIGH</div>
                    <div class="level-value high-value">${Utils.formatNumber(highValue)}</div>
                    <div class="level-datetime">${Utils.formatDateTimeShort(highDateTime)}</div>
                </div>
                <div class="level">
                    <div class="level-label">LOW</div>
                    <div class="level-value low-value">${Utils.formatNumber(lowValue)}</div>
                    <div class="level-datetime">${Utils.formatDateTimeShort(lowDateTime)}</div>
                </div>
            </div>

            <div class="metrics">
                <div class="metric">
                    <div class="metric-label">RANGE</div>
                    <div class="metric-value">${range} pips</div>
                </div>
                <div class="metric">
                    <div class="metric-label">VOLUME</div>
                    <div class="metric-value">${timeframe.volume_strength || 'N/A'}</div>
                </div>
            </div>

            <div class="fibonacci-levels">
                <div class="fib-title">Fibonacci Levels</div>
                ${fib50 ? `<div class="fib-level">
                    <span class="fib-label">50%</span>
                    <span>${Utils.formatNumber(fib50)}</span>
                </div>` : ''}
                ${fib618 ? `<div class="fib-level">
                    <span class="fib-label">61.8%</span>
                    <span>${Utils.formatNumber(fib618)}</span>
                </div>` : ''}
                ${fib786 ? `<div class="fib-level">
                    <span class="fib-label">78.6%</span>
                    <span>${Utils.formatNumber(fib786)}</span>
                </div>` : ''}
            </div>

            ${positionStatus ? `<div class="position-info">
                <div class="position-label">Position</div>
                <div class="position-value">
                    ${positionStatus} (${positionDistance ? positionDistance + ' pips' : 'N/A'})
                </div>
            </div>` : ''}

            <div class="volume-indicator">
                <span class="volume-label">Strength</span>
                <span class="volume-value">${timeframe.market_strength || timeframe.volume_strength || 'Normal'}</span>
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