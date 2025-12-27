/**
 * Trade Form Manager
 * Handles the trade execution form logic and validation
 */

import { tradeService } from '../services/tradeService.js';

export class TradeFormManager {
    constructor() {
        this.form = null;
        this.buyButton = null;
        this.sellButton = null;
        this.actionInput = null;
        this.submitButton = null;
        this.resultCard = null;
        this.resultContent = null;
        this.resultTitle = null;
        this.isSubmitting = false;
        this.currentAction = 'BUY';
    }

    /**
     * Initialize the trade form manager
     */
    async init() {
        try {


            // Get form elements
            this.form = document.getElementById('tradeForm');
            this.buyButton = document.getElementById('buyButton');
            this.sellButton = document.getElementById('sellButton');
            this.actionInput = document.getElementById('action');
            this.submitButton = document.getElementById('submitButton');
            this.resultCard = document.getElementById('resultCard');
            this.resultContent = document.getElementById('resultContent');
            this.resultTitle = document.getElementById('resultTitle');

            if (!this.form) {
                throw new Error('Trade form not found');
            }

            this.setupEventListeners();

        } catch (error) {
            console.error('Failed to initialize TradeFormManager:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Action button handlers
        if (this.buyButton) {
            this.buyButton.addEventListener('click', () => this.setAction('BUY'));
        }

        if (this.sellButton) {
            this.sellButton.addEventListener('click', () => this.setAction('SELL'));
        }

        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Input validation
        const inputs = this.form.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateInput(input));
        });
    }

    /**
     * Set trade action (BUY/SELL)
     * @param {string} action - BUY or SELL
     */
    setAction(action) {
        this.currentAction = action;

        if (this.actionInput) {
            this.actionInput.value = action;
        }

        // Update button states
        if (this.buyButton && this.sellButton) {
            if (action === 'BUY') {
                this.buyButton.classList.add('active');
                this.sellButton.classList.remove('active');
            } else {
                this.sellButton.classList.add('active');
                this.buyButton.classList.remove('active');
            }
        }
    }

    /**
     * Validate individual input
     * @param {HTMLInputElement} input - Input element
     */
    validateInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);

        if (isNaN(value) || value < min || value > max) {
            input.classList.add('invalid');
            input.classList.remove('valid');
        } else {
            input.classList.add('valid');
            input.classList.remove('invalid');
        }
    }

    /**
     * Handle form submission
     * @param {Event} event - Submit event
     */
    async handleSubmit(event) {
        event.preventDefault();

        if (this.isSubmitting) {
            return;
        }

        try {
            // Hide previous results
            this.hideResult();

            // Get form data
            const formData = new FormData(this.form);
            const tradeData = {
                symbol: formData.get('symbol'),
                action: formData.get('action'),
                volume: formData.get('volume'),
                slPips: formData.get('slPips'),
                tpPips: formData.get('tpPips'),
                comment: formData.get('comment')
            };

            // Validate trade data
            const validation = tradeService.validateTradeData(tradeData);
            if (!validation.isValid) {
                this.showError('Validación Fallida', validation.errors);
                return;
            }

            // Confirm execution
            const confirmed = await this.confirmExecution(tradeData);
            if (!confirmed) {
                return;
            }

            // Execute trade
            this.setLoadingState(true);
            const result = await tradeService.executeTrade(tradeData);

            // Show success result
            this.showSuccess(result, tradeData);

        } catch (error) {
            console.error('Error executing trade:', error);
            this.showError('Error de Ejecución', [error.message]);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Confirm trade execution with user
     * @param {Object} tradeData - Trade data
     * @returns {Promise<boolean>} User confirmation
     */
    async confirmExecution(tradeData) {
        const message = `
¿Confirmar ejecución de trade?

Acción: ${tradeData.action}
Volumen: ${tradeData.volume} lotes
Stop Loss: ${tradeData.slPips} pips
Take Profit: ${tradeData.tpPips} pips

Esta acción enviará una orden de mercado al broker.
        `.trim();

        return confirm(message);
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoadingState(loading) {
        this.isSubmitting = loading;

        if (this.submitButton) {
            this.submitButton.disabled = loading;
            if (loading) {
                this.submitButton.classList.add('loading');
                this.submitButton.querySelector('.button-text').textContent = 'Ejecutando...';
            } else {
                this.submitButton.classList.remove('loading');
                this.submitButton.querySelector('.button-text').textContent = 'Ejecutar Trade';
            }
        }
    }

    /**
     * Show success result
     * @param {Object} result - API result
     * @param {Object} tradeData - Original trade data
     */
    showSuccess(result, tradeData) {
        if (!this.resultCard || !this.resultContent || !this.resultTitle) {
            return;
        }

        this.resultTitle.innerHTML = '✅ Trade Ejecutado Exitosamente';
        this.resultCard.classList.remove('error');
        this.resultCard.classList.add('success');

        const html = `
            <div class="result-details">
                <div class="result-item">
                    <span class="result-label">Ticket</span>
                    <span class="result-value highlight">#${result.ticket || 'N/A'}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Acción</span>
                    <span class="result-value">${tradeData.action}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Precio de Ejecución</span>
                    <span class="result-value highlight">${result.price ? result.price.toFixed(2) : 'N/A'}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Volumen</span>
                    <span class="result-value">${tradeData.volume} lotes</span>
                </div>
                <div class="result-item">
                    <span class="result-label">SL / TP</span>
                    <span class="result-value">${tradeData.slPips} / ${tradeData.tpPips} pips</span>
                </div>
                ${result.retcode ? `
                <div class="result-item">
                    <span class="result-label">Código de Retorno</span>
                    <span class="result-value">${result.retcode}</span>
                </div>
                ` : ''}
            </div>
            ${result.message ? `
            <div class="result-message">
                ${result.message}
            </div>
            ` : ''}
        `;

        this.resultContent.innerHTML = html;
        this.resultCard.style.display = 'block';

        // Scroll to result
        this.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Show error result
     * @param {string} title - Error title
     * @param {Array<string>} errors - Error messages
     */
    showError(title, errors) {
        if (!this.resultCard || !this.resultContent || !this.resultTitle) {
            return;
        }

        this.resultTitle.innerHTML = `❌ ${title}`;
        this.resultCard.classList.remove('success');
        this.resultCard.classList.add('error');

        const errorList = errors.map(error => `<li>${error}</li>`).join('');

        const html = `
            <div class="result-message">
                <ul style="text-align: left; padding-left: 1.5rem; margin: 0;">
                    ${errorList}
                </ul>
            </div>
        `;

        this.resultContent.innerHTML = html;
        this.resultCard.style.display = 'block';

        // Scroll to result
        this.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Hide result card
     */
    hideResult() {
        if (this.resultCard) {
            this.resultCard.style.display = 'none';
        }
    }

    /**
     * Reset form to defaults
     */
    resetForm() {
        if (this.form) {
            this.form.reset();
        }
        this.setAction('BUY');
        this.hideResult();

        // Clear validation classes
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.remove('valid', 'invalid');
        });
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            currentAction: this.currentAction,
            isSubmitting: this.isSubmitting
        };
    }
}
