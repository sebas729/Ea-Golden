/**
 * Trade Execution Main Controller
 * Coordinates the trade execution module
 */

import { TradeFormManager } from './tradeForm.js';
import { TradeListManager } from './tradeList.js';

export class TradeMainController {
    constructor() {
        this.isLoading = false;
        this.tradeForm = null;
        this.tradeList = null;
        this.currentTab = 'execution';
    }

    /**
     * Initialize the trade execution module
     */
    async init() {
        try {


            this.setupEventListeners();
            await this.initializeManagers();
            await this.loadInitialData();


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
            this.tradeList = new TradeListManager();

            await this.tradeForm.init();
            await this.tradeList.init();
        } catch (error) {
            console.error('Error initializing managers:', error);
            throw error;
        }
    }

    /**
     * Show specific tab
     * @param {string} tabName - Tab name (execution or active)
     */
    async showTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButton = Array.from(document.querySelectorAll('.tab-button'))
            .find(btn => btn.onclick && btn.onclick.toString().includes(tabName));
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const activeContent = document.getElementById(tabName);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        // Load tab-specific data
        if (tabName === 'active' && this.tradeList) {
            await this.tradeList.loadTrades();
        }
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            // For trade execution, we just need to show the form
            // No initial data loading required - show content directly
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


            // Reset form to initial state
            if (this.tradeForm) {
                this.tradeForm.resetForm();
            }

            // Optionally reload any data
            await this.loadInitialData();


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
            currentTab: this.currentTab,
            tradeForm: this.tradeForm ? this.tradeForm.getState() : null,
            tradeList: this.tradeList ? this.tradeList.getState() : null
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

        // Make showTab globally available
        window.showTradeTab = (tabName) => {
            controller.showTab(tabName);
        };
    } catch (error) {
        console.error('Failed to initialize Trade Execution Module:', error);
    }
});
