/**
 * Trade List Manager
 * Handles display and management of active trades
 */

import { tradeService } from '../services/tradeService.js';

export class TradeListManager {
    constructor() {
        this.trades = [];
        this.isLoading = false;
        this.container = null;
        this.loadingElement = null;
        this.emptyElement = null;
        this.refreshButton = null;
    }

    /**
     * Initialize the trade list manager
     */
    async init() {
        try {
            console.log('Initializing TradeListManager...');

            this.container = document.getElementById('trades-list');
            this.loadingElement = document.getElementById('trades-loading');
            this.emptyElement = document.getElementById('trades-empty');
            this.refreshButton = document.getElementById('refreshTradesButton');

            if (!this.container) {
                throw new Error('Trades list container not found');
            }

            this.setupEventListeners();
            console.log('TradeListManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TradeListManager:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', () => {
                this.loadTrades();
            });
        }
    }

    /**
     * Load active trades from API
     */
    async loadTrades() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this.showLoading(true);
            this.hideEmpty();

            const data = await tradeService.getActiveTrades();
            // Handle both array response and object with trades property
            this.trades = Array.isArray(data) ? data : (data.trades || []);

            this.render();
        } catch (error) {
            console.error('Error loading active trades:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    /**
     * Render trades list
     */
    render() {
        if (!this.container) return;

        if (this.trades.length === 0) {
            this.showEmpty();
            return;
        }

        this.hideEmpty();

        const tradesHtml = this.trades.map(trade => this.renderTradeItem(trade)).join('');
        this.container.innerHTML = tradesHtml;
    }

    /**
     * Render a single trade item
     * @param {Object} trade - Trade object
     * @returns {string} HTML string
     */
    renderTradeItem(trade) {
        // API uses 'type' field instead of 'action'
        const tradeType = trade.type || trade.action;
        const actionClass = tradeType === 'BUY' ? 'trade-buy' : 'trade-sell';
        const profitClass = trade.profit >= 0 ? 'profit-positive' : 'profit-negative';
        const profitSign = trade.profit >= 0 ? '+' : '';

        return `
            <div class="trade-item ${actionClass}" data-ticket="${trade.ticket}">
                <div class="trade-header">
                    <div class="trade-ticket">
                        <span class="ticket-label">#${trade.ticket}</span>
                        <span class="trade-action-badge ${actionClass}">${tradeType}</span>
                    </div>
                    <button class="close-trade-button" onclick="closeTrade('${trade.ticket}')" title="Cerrar trade">
                        ✕
                    </button>
                </div>

                <div class="trade-body">
                    <div class="trade-info-grid">
                        <div class="trade-info-item">
                            <span class="info-label">Símbolo</span>
                            <span class="info-value">${trade.symbol || 'XAUUSD'}</span>
                        </div>
                        <div class="trade-info-item">
                            <span class="info-label">Volumen</span>
                            <span class="info-value">${trade.volume || 0} lotes</span>
                        </div>
                        <div class="trade-info-item">
                            <span class="info-label">Precio Apertura</span>
                            <span class="info-value">${trade.open_price ? trade.open_price.toFixed(2) : 'N/A'}</span>
                        </div>
                        <div class="trade-info-item">
                            <span class="info-label">Precio Actual</span>
                            <span class="info-value">${trade.current_price ? trade.current_price.toFixed(2) : 'N/A'}</span>
                        </div>
                        <div class="trade-info-item">
                            <span class="info-label">SL</span>
                            <span class="info-value">${trade.sl ? trade.sl.toFixed(2) : 'N/A'}</span>
                        </div>
                        <div class="trade-info-item">
                            <span class="info-label">TP</span>
                            <span class="info-value">${trade.tp ? trade.tp.toFixed(2) : 'N/A'}</span>
                        </div>
                    </div>

                    <div class="trade-profit ${profitClass}">
                        <span class="profit-label">P&L</span>
                        <span class="profit-value">${profitSign}${trade.profit ? trade.profit.toFixed(2) : '0.00'} USD</span>
                    </div>

                    ${trade.comment ? `
                    <div class="trade-comment">
                        <span class="comment-label">Comentario:</span>
                        <span class="comment-value">${trade.comment}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Close a specific trade
     * @param {string} ticket - Trade ticket number
     */
    async closeTrade(ticket) {
        const confirmed = confirm(`¿Cerrar trade #${ticket}?\n\nEsta acción no se puede deshacer.`);
        if (!confirmed) return;

        try {
            const button = document.querySelector(`[data-ticket="${ticket}"] .close-trade-button`);
            if (button) {
                button.disabled = true;
                button.textContent = '⏳';
            }

            const result = await tradeService.closeTrade(ticket);

            // Show success message
            this.showSuccessMessage(`Trade #${ticket} cerrado exitosamente`);

            // Reload trades list
            await this.loadTrades();

        } catch (error) {
            console.error('Error closing trade:', error);
            alert(`Error al cerrar trade: ${error.message}`);

            // Re-enable button
            const button = document.querySelector(`[data-ticket="${ticket}"] .close-trade-button`);
            if (button) {
                button.disabled = false;
                button.textContent = '✕';
            }
        }
    }

    /**
     * Show loading state
     * @param {boolean} show - Show loading
     */
    showLoading(show) {
        if (this.loadingElement) {
            this.loadingElement.style.display = show ? 'flex' : 'none';
        }
        if (this.container && show) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Show empty state
     */
    showEmpty() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        if (this.emptyElement) {
            this.emptyElement.style.display = 'block';
        }
    }

    /**
     * Hide empty state
     */
    hideEmpty() {
        if (this.emptyElement) {
            this.emptyElement.style.display = 'none';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="trades-error">
                    <div class="error-icon">❌</div>
                    <h3>Error al cargar trades</h3>
                    <p>${message}</p>
                    <button class="refresh-button" onclick="window.tradeController.tradeList.loadTrades()">
                        🔄 Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        // Create temporary success notification
        const notification = document.createElement('div');
        notification.className = 'trade-notification success';
        notification.innerHTML = `
            <span class="notification-icon">✅</span>
            <span class="notification-message">${message}</span>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Update trades data
     * @param {Array} trades - Array of trade objects
     */
    async update(trades) {
        this.trades = trades || [];
        this.render();
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            trades: this.trades,
            isLoading: this.isLoading,
            tradesCount: this.trades.length
        };
    }
}

// Make closeTrade globally available
window.closeTrade = function(ticket) {
    if (window.tradeController && window.tradeController.tradeList) {
        window.tradeController.tradeList.closeTrade(ticket);
    }
};
