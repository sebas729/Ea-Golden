/**
 * Fibonacci Report Main Module
 * Main initialization and coordination logic
 */

import { apiClient } from '../shared/api.js';
import { Utils } from '../shared/utils.js';
import { TimeframeCards } from './timeframes.js';
import { OrderBlocks } from './orderBlocks.js';
import { ObDynamics } from './obDynamics.js';
import { NotesSection } from './notes.js';
import { NivelesDSection } from './nivelesD.js';
import { ConfigSection } from './config.js';
import { TabManager } from './tabs.js';

export class FibonacciReport {
    constructor() {
        this.reportData = null;
        this.isLoading = false;

        // Initialize components
        this.timeframeCards = new TimeframeCards();
        this.orderBlocks = new OrderBlocks();
        this.obDynamics = new ObDynamics();
        this.notesSection = new NotesSection();
        this.nivelesDSection = new NivelesDSection();
        this.configSection = new ConfigSection();
        this.tabManager = new TabManager();

        this.init();
    }

    init() {

        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        // Bind refresh button
        const refreshButton = document.querySelector('.refresh-button-header');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.loadData());
        }

        // Bind footer refresh button
        const footerRefreshButton = document.querySelector('.refresh-button');
        if (footerRefreshButton) {
            footerRefreshButton.addEventListener('click', () => this.loadData());
        }
    }

    async loadData() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {


            // Try to load from API with retry mechanism
            this.reportData = await apiClient.withRetry(
                () => apiClient.getFibonacciReport(),
                3, // max retries
                1000 // initial delay
            );


            this.showMainContent();
            this.populateUI();

        } catch (error) {
            console.error('Failed to load report data:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const mainContent = document.getElementById('main-content');

        Utils.showElement(loading, 'flex');
        Utils.hideElement(error);
        Utils.hideElement(mainContent);
    }

    showError(message) {
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const mainContent = document.getElementById('main-content');
        const errorMessage = document.getElementById('error-message');

        Utils.hideElement(loading);
        Utils.hideElement(mainContent);
        Utils.showElement(error);

        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }

    showMainContent() {
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const mainContent = document.getElementById('main-content');

        Utils.hideElement(loading);
        Utils.hideElement(error);
        Utils.showElement(mainContent);
    }

    populateUI() {
        if (!this.reportData) {
            console.warn('No report data available for UI population');
            return;
        }

        try {


            // Extract the actual report data from the wrapper
            const actualReportData = this.reportData.fibonacci_strategy_report || this.reportData;

            // Update main info
            this.updateMainInfo(actualReportData);

            // Populate different sections with the correct data structure
            this.timeframeCards.populate(actualReportData);
            this.orderBlocks.populate(actualReportData);
            this.notesSection.populate(actualReportData);
            this.nivelesDSection.populate(actualReportData);
            this.configSection.populate(actualReportData);

            // Start OB dynamics generation automatically (like original)
            // Pass the original data structure for correct API processing
            setTimeout(() => {
                this.obDynamics.initialize(this.reportData); // Use original, not actualReportData
            }, 500);



        } catch (error) {
            console.error('Error populating UI:', error);
            this.showError('Error displaying report data');
        }
    }

    updateMainInfo(actualReportData) {
        try {
            // Get metadata from the correct location
            const metadata = actualReportData.metadata || {};

            // Update symbol
            const symbolElement = document.getElementById('symbol');
            if (symbolElement && metadata.symbol) {
                symbolElement.textContent = metadata.symbol;
            }

            // Update current price
            const priceElement = document.getElementById('current-price');
            if (priceElement && metadata.current_price) {
                priceElement.textContent = Utils.formatNumber(metadata.current_price, 2);
            }

            // Update last update time
            const lastUpdateElement = document.getElementById('last-update');
            if (lastUpdateElement && metadata.timestamp) {
                lastUpdateElement.textContent = Utils.formatDateTime(metadata.timestamp);
            }

            // Update version
            const versionElement = document.getElementById('version');
            if (versionElement && metadata.version) {
                versionElement.textContent = metadata.version;
            }

            // Update next report time (if available)
            const nextReportElement = document.getElementById('next-report');
            if (nextReportElement) {
                // Calculate next report time (assuming 1 hour intervals)
                const lastUpdate = new Date(metadata.timestamp);
                const nextUpdate = new Date(lastUpdate.getTime() + 60 * 60 * 1000);
                nextReportElement.textContent = Utils.formatDateTime(nextUpdate.toISOString());
            }

        } catch (error) {
            console.error('Error updating main info:', error);
        }
    }

    // Navigation methods for external use
    navigateToOrderBlock(timeframe) {
        this.tabManager.showTab('order-blocks');
        this.orderBlocks.navigateToTimeframe(timeframe);
    }

    navigateToObDynamics(timeframe) {
        this.tabManager.showTab('ob-dynamics');
        this.obDynamics.switchTimeframe(timeframe);
    }

    navigateToObDynamicsWithChart(mainTimeframe, chartTimeframe) {
        this.tabManager.showTab('ob-dynamics');
        this.obDynamics.switchTimeframeWithChart(mainTimeframe, chartTimeframe);
    }

    // Getter for report data
    getReportData() {
        return this.reportData;
    }
}

// Global functions for backward compatibility
window.loadData = function() {
    if (window.fibonacciReport) {
        window.fibonacciReport.loadData();
    }
};

window.navigateToOrderBlock = function(timeframe) {
    if (window.fibonacciReport) {
        window.fibonacciReport.navigateToOrderBlock(timeframe);
    }
};

window.navigateToObDynamics = function(timeframe) {
    if (window.fibonacciReport) {
        window.fibonacciReport.navigateToObDynamics(timeframe);
    }
};

window.navigateToObDynamicsWithChart = function(mainTimeframe, chartTimeframe) {
    if (window.fibonacciReport) {
        window.fibonacciReport.navigateToObDynamicsWithChart(mainTimeframe, chartTimeframe);
    }
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fibonacciReport = new FibonacciReport();
});