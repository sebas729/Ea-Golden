/**
 * Trade Service
 * Handles all trade execution and management API calls
 * Uses Security Filter with JWT authentication
 */

import { apiClient } from '../shared/api.js';

export class TradeService {
    constructor() {
        this.baseEndpoint = '/security-filter/trade';
    }

    /**
     * Execute a manual trade
     * @param {Object} tradeData - Trade execution parameters
     * @param {string} tradeData.symbol - Trading symbol (XAUUSD)
     * @param {string} tradeData.action - BUY or SELL
     * @param {number} tradeData.volume - Lot size (0.01 - 10.0)
     * @param {number} tradeData.slPips - Stop loss in pips
     * @param {number} tradeData.tpPips - Take profit in pips
     * @param {string} tradeData.comment - Optional comment
     * @returns {Promise<Object>} Execution result with ticket and price
     */
    async executeTrade(tradeData) {
        try {
            console.log('Executing trade...', tradeData);

            const payload = {
                symbol: tradeData.symbol,
                action: tradeData.action,
                volume: parseFloat(tradeData.volume),
                sl_pips: parseInt(tradeData.slPips),
                tp_pips: parseInt(tradeData.tpPips),
                comment: tradeData.comment || 'MANUAL_WEB'
            };

            const data = await apiClient.post(`${this.baseEndpoint}/execute`, payload);
            console.log('Trade executed successfully:', data);
            return data;
        } catch (error) {
            console.error('Error executing trade:', error);
            throw new Error(`Failed to execute trade: ${error.message}`);
        }
    }

    /**
     * Get active trades
     * @returns {Promise<Object>} Active trades data
     */
    async getActiveTrades() {
        try {
            console.log('Fetching active trades...');
            const data = await apiClient.get(`${this.baseEndpoint}/active`);
            console.log('Active trades loaded successfully');
            return data;
        } catch (error) {
            console.error('Error fetching active trades:', error);
            throw new Error(`Failed to load active trades: ${error.message}`);
        }
    }

    /**
     * Get trade history
     * @param {number} limit - Number of trades to fetch
     * @returns {Promise<Object>} Trade history
     */
    async getTradeHistory(limit = 50) {
        try {
            console.log('Fetching trade history...');
            const data = await apiClient.get(`${this.baseEndpoint}/history?limit=${limit}`);
            console.log('Trade history loaded successfully');
            return data;
        } catch (error) {
            console.error('Error fetching trade history:', error);
            throw new Error(`Failed to load trade history: ${error.message}`);
        }
    }

    /**
     * Close a specific trade
     * @param {string} ticket - Trade ticket number
     * @returns {Promise<Object>} Close result
     */
    async closeTrade(ticket) {
        try {
            console.log(`Closing trade ${ticket}...`);
            const data = await apiClient.post(`${this.baseEndpoint}/${ticket}/close`);
            console.log('Trade closed successfully');
            return data;
        } catch (error) {
            console.error('Error closing trade:', error);
            throw new Error(`Failed to close trade: ${error.message}`);
        }
    }

    /**
     * Validate trade parameters before execution
     * @param {Object} tradeData - Trade parameters
     * @returns {Object} Validation result with isValid and errors
     */
    validateTradeData(tradeData) {
        const errors = [];

        // Validate symbol
        if (!tradeData.symbol || tradeData.symbol !== 'XAUUSD') {
            errors.push('Symbol must be XAUUSD');
        }

        // Validate action
        if (!tradeData.action || !['BUY', 'SELL'].includes(tradeData.action)) {
            errors.push('Action must be BUY or SELL');
        }

        // Validate volume
        const volume = parseFloat(tradeData.volume);
        if (isNaN(volume) || volume < 0.01 || volume > 10.0) {
            errors.push('Volume must be between 0.01 and 10.0');
        }

        // Validate SL
        const slPips = parseInt(tradeData.slPips);
        if (isNaN(slPips) || slPips < 1 || slPips > 1000) {
            errors.push('Stop Loss must be between 1 and 1000 pips');
        }

        // Validate TP
        const tpPips = parseInt(tradeData.tpPips);
        if (isNaN(tpPips) || tpPips < 1 || tpPips > 4000) {
            errors.push('Take Profit must be between 1 and 4000 pips');
        }

        // Validate comment length
        if (tradeData.comment && tradeData.comment.length > 50) {
            errors.push('Comment must be 50 characters or less');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Create singleton instance
export const tradeService = new TradeService();

// Export for global access if needed
if (typeof window !== 'undefined') {
    window.tradeService = tradeService;
}
