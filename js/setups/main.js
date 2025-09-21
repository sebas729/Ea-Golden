/**
 * Setups Main Controller
 * Coordinates all setups functionality and manages application state
 */

import { setupsApi } from '../services/setupsApi.js';
import { SetupsListManager } from './setupsList.js';
import { ConfluencesManager } from './confluences.js';
import { StatisticsManager } from './statistics.js';
import { SetupDetailManager } from './setupDetail.js';
import { ProximityManager } from './proximity.js';
import { AutoRefreshManager } from './autoRefresh.js';

export class SetupsMainController {
    constructor() {
        this.currentData = null;
        this.isLoading = false;
        this.currentTab = 'dashboard';

        // Initialize managers
        this.setupsList = new SetupsListManager();
        this.confluences = new ConfluencesManager();
        this.statistics = new StatisticsManager();
        this.setupDetail = new SetupDetailManager();
        this.proximity = new ProximityManager();
        this.autoRefresh = new AutoRefreshManager();

        // Bind methods
        this.loadSetupsData = this.loadSetupsData.bind(this);
        this.showTab = this.showTab.bind(this);
        this.handleError = this.handleError.bind(this);
        this.showNotification = this.showNotification.bind(this);

        // Make globally available
        window.loadSetupsData = this.loadSetupsData;
        window.showSetupsTab = this.showTab;
        window.closeSetupModal = () => this.setupDetail.closeModal();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Setups Trading Dashboard...');

            // Setup event listeners
            this.setupEventListeners();

            // Initialize managers
            await this.initializeManagers();

            // Load initial data
            await this.loadSetupsData();

            // Start auto-refresh
            this.autoRefresh.start(() => this.loadSetupsData());

            console.log('Setups Trading Dashboard initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Setups Dashboard:', error);
            this.handleError(error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh button
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.loadSetupsData(true); // Force refresh
            });
        }

        // Filter controls
        const typeFilter = document.getElementById('typeFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.setupsList.applyFilters();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                this.setupsList.applySorting();
            });
        }

        // Proximity threshold slider
        const proximityThreshold = document.getElementById('proximityThreshold');
        const proximityValue = document.getElementById('proximityValue');

        if (proximityThreshold && proximityValue) {
            proximityThreshold.addEventListener('input', (e) => {
                const value = e.target.value;
                proximityValue.textContent = value;
                this.proximity.updateThreshold(parseInt(value));
            });
        }

        // Modal close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.setupDetail.closeModal();
            }
        });
    }

    /**
     * Initialize all managers
     */
    async initializeManagers() {
        try {
            await Promise.all([
                this.setupsList.init(),
                this.confluences.init(),
                this.statistics.init(),
                this.setupDetail.init(),
                this.proximity.init(),
                this.autoRefresh.init()
            ]);
        } catch (error) {
            console.error('Error initializing managers:', error);
            throw error;
        }
    }

    /**
     * Load setups data from API
     * @param {boolean} forceRefresh - Force refresh from server
     */
    async loadSetupsData(forceRefresh = false) {
        if (this.isLoading && !forceRefresh) {
            console.log('Already loading data, skipping...');
            return;
        }

        try {
            this.isLoading = true;
            this.showLoading(true);

            console.log('Loading setups data...');

            // If force refresh, call refresh endpoint first
            if (forceRefresh) {
                this.showNotification('🔄 Actualizando datos...', 'info');
                await setupsApi.refreshSetups(true);
            }

            // Load main data
            const data = await setupsApi.getActiveSetups();

            if (!data) {
                throw new Error('No data received from API');
            }

            this.currentData = data;

            // Update all components
            await this.updateAllComponents(data);


            // Show success notification for manual refresh
            if (forceRefresh) {
                this.showNotification('✅ Datos actualizados correctamente', 'success');
            }

            this.showLoading(false);
            this.showMainContent(true);

            console.log('Setups data loaded successfully');

        } catch (error) {
            console.error('Error loading setups data:', error);
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Update all components with new data
     * @param {Object} data - API response data
     */
    async updateAllComponents(data) {
        try {
            // Update summary cards
            this.updateSummaryCards(data.summary);

            // Update active tab content
            switch (this.currentTab) {
                case 'dashboard':
                    await this.setupsList.update(data.setups || []);
                    break;
                case 'confluences':
                    await this.confluences.update(data.confluences || {});
                    break;
                case 'statistics':
                    await this.statistics.update(data.pipeline_stats || {});
                    break;
                case 'proximity':
                    await this.proximity.update(data.setups || []);
                    break;
            }

            // Update system status
            this.updateSystemStatus(data.pipeline_stats?.success_rate || 0);

        } catch (error) {
            console.error('Error updating components:', error);
            throw error;
        }
    }

    /**
     * Update summary cards with new data
     * @param {Object} summary - Summary data
     */
    updateSummaryCards(summary) {
        if (!summary) return;

        // Total setups
        const totalElement = document.getElementById('totalSetups');
        const complexElement = document.getElementById('complexCount');
        const simpleElement = document.getElementById('simpleCount');

        if (totalElement) totalElement.textContent = summary.total || 0;
        if (complexElement) complexElement.textContent = summary.complex || 0;
        if (simpleElement) simpleElement.textContent = summary.simple || 0;

        // Current price
        const priceElement = document.getElementById('currentPrice');
        const directionElement = document.getElementById('direction');

        if (priceElement && summary.current_price) {
            priceElement.textContent = summary.current_price.toFixed(2);
        }
        if (directionElement && summary.direction) {
            directionElement.textContent = summary.direction;
            directionElement.className = `summary-detail ${summary.direction.toLowerCase()}`;
        }

        // Closest setup
        const closestElement = document.getElementById('closestSetup');
        const distanceElement = document.getElementById('closestDistance');

        if (closestElement && summary.closest_setup) {
            closestElement.textContent = summary.closest_setup;
        }
        if (distanceElement && summary.closest_distance_pips !== undefined) {
            distanceElement.textContent = `${summary.closest_distance_pips.toFixed(1)} pips`;
        }

        // Average score
        const avgScoreElement = document.getElementById('averageScore');
        const maxScoreElement = document.getElementById('maxScore');

        if (avgScoreElement && summary.average_score !== undefined) {
            avgScoreElement.textContent = summary.average_score.toFixed(1);
        }
        if (maxScoreElement && summary.max_score !== undefined) {
            maxScoreElement.textContent = summary.max_score.toFixed(1);
        }
    }


    /**
     * Update system status indicator
     * @param {number} successRate - Success rate percentage
     */
    updateSystemStatus(successRate) {
        const statusElement = document.getElementById('systemStatus');
        if (statusElement) {
            if (successRate >= 95) {
                statusElement.textContent = 'Óptimo';
                statusElement.style.color = 'var(--green-accent)';
            } else if (successRate >= 80) {
                statusElement.textContent = 'Bueno';
                statusElement.style.color = 'var(--yellow-accent)';
            } else {
                statusElement.textContent = 'Degradado';
                statusElement.style.color = 'var(--red-accent)';
            }
        }
    }

    /**
     * Show/hide loading state
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
     * Show/hide main content
     * @param {boolean} show - Show main content
     */
    showMainContent(show) {
        const mainContentElement = document.getElementById('main-content');
        if (mainContentElement) {
            mainContentElement.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Show tab content
     * @param {string} tabName - Tab to show
     */
    async showTab(tabName) {
        // Update active tab
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Activate selected tab
        const selectedButton = Array.from(document.querySelectorAll('.tab-button'))
            .find(btn => btn.onclick.toString().includes(tabName));
        const selectedContent = document.getElementById(tabName);

        if (selectedButton) selectedButton.classList.add('active');
        if (selectedContent) selectedContent.classList.add('active');

        // Load tab-specific data if needed
        if (this.currentData) {
            switch (tabName) {
                case 'dashboard':
                    await this.setupsList.update(this.currentData.setups || []);
                    break;
                case 'confluences':
                    await this.confluences.update(this.currentData.confluences || {});
                    break;
                case 'statistics':
                    // Load fresh statistics data
                    try {
                        const statsData = await setupsApi.getStatistics();
                        await this.statistics.update(statsData);
                    } catch (error) {
                        console.error('Error loading statistics:', error);
                        await this.statistics.update(this.currentData.pipeline_stats || {});
                    }
                    break;
                case 'proximity':
                    await this.proximity.update(this.currentData.setups || []);
                    break;
            }
        }
    }

    /**
     * Handle errors
     * @param {Error} error - Error to handle
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

        this.showNotification(`❌ ${error.message}`, 'error');
    }

    /**
     * Show notification toast
     * @param {string} message - Message to show
     * @param {string} type - Type: success, error, info, warning
     */
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageElement = document.getElementById('notificationMessage');
        const iconElement = document.getElementById('notificationIcon');

        if (!notification || !messageElement || !iconElement) return;

        // Set icon based on type
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        iconElement.textContent = icons[type] || icons.info;
        messageElement.textContent = message;

        // Show notification
        notification.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    /**
     * Get current application state
     * @returns {Object} Current state
     */
    getState() {
        return {
            currentData: this.currentData,
            currentTab: this.currentTab,
            isLoading: this.isLoading
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const controller = new SetupsMainController();
        await controller.init();

        // Make controller globally available for debugging
        window.setupsController = controller;

    } catch (error) {
        console.error('Failed to initialize Setups Trading Dashboard:', error);
    }
});