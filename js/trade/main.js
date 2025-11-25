/**
 * Trade Execution Main Controller
 * Coordinates the trade execution module
 */

import { TradeFormManager } from './tradeForm.js';

export class TradeMainController {
    constructor() {
        this.isLoading = false;
        this.tradeForm = null;
    }

    /**
     * Initialize the trade execution module
     */
    async init() {
        try {
            console.log('Initializing Trade Execution Module...');

            this.setupEventListeners();
            await this.initializeManagers();
            await this.loadInitialData();

            console.log('Trade Execution Module initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Trade Execution Module:', error);
            this.handleError(error);
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refresh();
            });
        }
    }

    /**
     * Initialize all managers
     */
    async initializeManagers() {
        try {
            this.tradeForm = new TradeFormManager();
            await this.tradeForm.init();
        } catch (error) {
            console.error('Error initializing managers:', error);
            throw error;
        }
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            this.showLoading(true);

            // For trade execution, we just need to show the form
            // No initial data loading required

            this.showLoading(false);
            this.showMainContent(true);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.handleError(error);
        }
    }

    /**
     * Refresh the module
     */
    async refresh() {
        try {
            console.log('Refreshing Trade Execution Module...');

            // Reset form to initial state
            if (this.tradeForm) {
                this.tradeForm.resetForm();
            }

            // Optionally reload any data
            await this.loadInitialData();

            console.log('Refresh complete');
        } catch (error) {
            console.error('Error refreshing:', error);
            this.handleError(error);
        }
    }

    /**
     * Show loading state
     * @param {boolean} show - Show loading
     */
    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        const mainContentElement = document.getElementById('main-content');
        const errorElement = document.getElementById('error');

        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
        if (mainContentElement && !show) {
            mainContentElement.style.display = 'block';
        }
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Show main content
     * @param {boolean} show - Show main content
     */
    showMainContent(show) {
        const mainContentElement = document.getElementById('main-content');
        if (mainContentElement) {
            mainContentElement.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Handle errors
     * @param {Error} error - Error object
     */
    handleError(error) {
        console.error('Application error:', error);

        this.showLoading(false);
        this.showMainContent(false);

        const errorElement = document.getElementById('error');
        const errorMessageElement = document.getElementById('error-message');

        if (errorElement) {
            errorElement.style.display = 'block';
        }
        if (errorMessageElement) {
            errorMessageElement.textContent = error.message || 'Error desconocido';
        }
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            isLoading: this.isLoading,
            tradeForm: this.tradeForm ? this.tradeForm.getState() : null
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const controller = new TradeMainController();
        await controller.init();

        // Make globally available
        window.tradeController = controller;
    } catch (error) {
        console.error('Failed to initialize Trade Execution Module:', error);
    }
});
