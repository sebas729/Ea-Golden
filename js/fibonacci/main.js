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
        console.log('Initializing Fibonacci Report...');
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
            console.log('Loading Fibonacci report data...');

            // Try to load from API with retry mechanism
            this.reportData = await apiClient.withRetry(
                () => apiClient.getFibonacciReport(),
                3, // max retries
                1000 // initial delay
            );

            console.log('Report data loaded successfully:', this.reportData);
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
            console.log('Populating UI with report data...');

            // Update main info
            this.updateMainInfo();

            // Populate different sections
            this.timeframeCards.populate(this.reportData);
            this.orderBlocks.populate(this.reportData);
            this.notesSection.populate(this.reportData);
            this.nivelesDSection.populate(this.reportData);
            this.configSection.populate(this.reportData);

            // Start OB dynamics generation
            this.obDynamics.initialize(this.reportData);

            console.log('UI populated successfully');

        } catch (error) {
            console.error('Error populating UI:', error);
            this.showError('Error displaying report data');
        }
    }

    updateMainInfo() {
        try {
            // Update symbol
            const symbolElement = document.getElementById('symbol');
            if (symbolElement && this.reportData.symbol) {
                symbolElement.textContent = this.reportData.symbol;
            }

            // Update current price
            const priceElement = document.getElementById('current-price');
            if (priceElement && this.reportData.current_price) {
                priceElement.textContent = Utils.formatNumber(this.reportData.current_price, 5);
            }

            // Update last update time
            const lastUpdateElement = document.getElementById('last-update');
            if (lastUpdateElement && this.reportData.timestamp) {
                lastUpdateElement.textContent = Utils.formatDateTime(this.reportData.timestamp);
            }

            // Update version
            const versionElement = document.getElementById('version');
            if (versionElement && this.reportData.version) {
                versionElement.textContent = `v${this.reportData.version}`;
            }

            // Update next report time
            const nextReportElement = document.getElementById('next-report');
            if (nextReportElement && this.reportData.next_update) {
                nextReportElement.textContent = Utils.formatDateTime(this.reportData.next_update);
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