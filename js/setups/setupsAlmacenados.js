/**
 * Setups Almacenados Manager
 * Handles display and management of stored setups (historical record)
 */

import { setupsAlmacenadosApi } from '../services/setupsAlmacenadosApi.js';

export class SetupsAlmacenadosManager {
    constructor() {
        this.setups = [];
        this.currentPage = 1;
        this.pageSize = 50;
        this.totalPages = 1;
        this.totalCount = 0;

        // Filters
        this.currentTimeframeFilter = 'ALL';
        this.currentTypeFilter = 'ALL';
        this.currentMinScore = 0;

        // DOM elements
        this.container = null;
        this.timeframeFilter = null;
        this.typeFilter = null;
        this.minScoreFilter = null;
        this.prevPageButton = null;
        this.nextPageButton = null;
        this.pageInfo = null;
    }

    /**
     * Initialize the setups almacenados manager
     */
    async init() {
        this.container = document.getElementById('almacenados-list');
        this.timeframeFilter = document.getElementById('almacenadosTimeframeFilter');
        this.typeFilter = document.getElementById('almacenadosTypeFilter');
        this.minScoreFilter = document.getElementById('almacenadosMinScoreFilter');
        this.prevPageButton = document.getElementById('almacenadosPrevPage');
        this.nextPageButton = document.getElementById('almacenadosNextPage');
        this.pageInfo = document.getElementById('almacenadosPageInfo');

        if (!this.container) {
            throw new Error('Setups almacenados container not found');
        }

        // Setup event listeners
        this.setupEventListeners();

        console.log('SetupsAlmacenadosManager initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Filter change listeners
        if (this.timeframeFilter) {
            this.timeframeFilter.addEventListener('change', () => {
                this.currentTimeframeFilter = this.timeframeFilter.value;
                this.currentPage = 1; // Reset to first page
                this.update();
            });
        }

        if (this.typeFilter) {
            this.typeFilter.addEventListener('change', () => {
                this.currentTypeFilter = this.typeFilter.value;
                this.currentPage = 1; // Reset to first page
                this.update();
            });
        }

        if (this.minScoreFilter) {
            this.minScoreFilter.addEventListener('change', () => {
                this.currentMinScore = parseFloat(this.minScoreFilter.value) || 0;
                this.currentPage = 1; // Reset to first page
                this.update();
            });
        }

        // Pagination listeners
        if (this.prevPageButton) {
            this.prevPageButton.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.update();
                }
            });
        }

        if (this.nextPageButton) {
            this.nextPageButton.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.update();
                }
            });
        }
    }

    /**
     * Update setups almacenados with fresh data from API
     */
    async update() {
        try {
            // Build filters object
            const filters = {};

            if (this.currentTimeframeFilter !== 'ALL') {
                filters.timeframe = this.currentTimeframeFilter;
            }

            if (this.currentTypeFilter !== 'ALL') {
                filters.type = this.currentTypeFilter;
            }

            if (this.currentMinScore > 0) {
                filters.min_score = this.currentMinScore;
            }

            // Fetch data from API
            const data = await setupsAlmacenadosApi.getStoredSetups(
                this.currentPage,
                this.pageSize,
                filters
            );

            // Update state
            this.setups = data.setups || [];
            this.currentPage = data.page || 1;
            this.totalPages = data.total_pages || 1;
            this.totalCount = data.total_count || 0;

            // Render
            this.render();
            this.updatePaginationControls();

        } catch (error) {
            console.error('Error updating setups almacenados:', error);
            this.showError('Error al cargar los setups almacenados');
        }
    }

    /**
     * Render the setups list
     */
    render() {
        if (!this.container) return;

        if (this.setups.length === 0) {
            this.container.innerHTML = this.renderEmptyState();
            return;
        }

        const setupsHtml = this.setups.map(setup => this.renderSetupItem(setup)).join('');
        this.container.innerHTML = setupsHtml;

        // Add click event listeners
        this.addEventListeners();
    }

    /**
     * Render a single setup item
     * @param {Object} setup - Setup object
     * @returns {string} HTML string
     */
    renderSetupItem(setup) {
        const formattedSetup = setupsAlmacenadosApi.formatSetupForDisplay(setup);
        const scoreClass = this.getScoreClass(setup.score);
        const directionClass = setup.direction?.toLowerCase() || '';

        return `
            <div class="setup-item ${setup.type?.toLowerCase()}" data-setup-id="${setup.id}">
                <div class="setup-header">
                    <div class="setup-id">${setup.setup_id || setup.id}</div>
                    <div class="setup-type-badges">
                        <div class="setup-type ${setup.type?.toLowerCase()}">${setup.type}</div>
                        <span class="setup-direction ${directionClass}">${setup.direction}</span>
                    </div>
                </div>

                <div class="setup-details">
                    <div class="setup-detail">
                        <div class="setup-detail-label">Precio</div>
                        <div class="setup-detail-value">${formattedSetup.formattedPrice}</div>
                    </div>

                    <div class="setup-detail">
                        <div class="setup-detail-label">Score</div>
                        <div class="setup-detail-value ${scoreClass}">${formattedSetup.formattedScore}</div>
                    </div>

                    <div class="setup-detail">
                        <div class="setup-detail-label">Timeframe</div>
                        <div class="setup-detail-value">${setup.timeframe}</div>
                    </div>

                    <div class="setup-detail">
                        <div class="setup-detail-label">Group ID</div>
                        <div class="setup-detail-value">${setup.group_id || 'N/A'}</div>
                    </div>

                    <div class="setup-detail">
                        <div class="setup-detail-label">Almacenado</div>
                        <div class="setup-detail-value">${formattedSetup.formattedDate}</div>
                    </div>

                    <div class="setup-detail">
                        <div class="setup-detail-label">Origen</div>
                        <div class="setup-detail-value">${this.formatOriginDate(setup.origin_timestamp)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format origin timestamp
     * @param {string} isoString - ISO date string
     * @returns {string} Formatted date
     */
    formatOriginDate(isoString) {
        if (!isoString) return 'N/A';

        try {
            const date = new Date(isoString);
            return new Intl.DateTimeFormat('es-ES', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (error) {
            return 'N/A';
        }
    }

    /**
     * Update pagination controls
     */
    updatePaginationControls() {
        if (this.pageInfo) {
            this.pageInfo.textContent =
                `Página ${this.currentPage} de ${this.totalPages} (${this.totalCount} total)`;
        }

        if (this.prevPageButton) {
            this.prevPageButton.disabled = this.currentPage === 1;
        }

        if (this.nextPageButton) {
            this.nextPageButton.disabled = this.currentPage === this.totalPages;
        }
    }

    /**
     * Render empty state
     * @returns {string} HTML string
     */
    renderEmptyState() {
        const filterText = this.getActiveFiltersText();

        return `
            <div class="empty-state">
                <div class="empty-icon">💾</div>
                <h3>No hay setups almacenados${filterText}</h3>
                <p>No se encontraron setups que coincidan con los filtros actuales.</p>
                ${this.hasActiveFilters() ? `
                    <button class="refresh-button" onclick="window.setupsController.setupsAlmacenados.clearFilters()">
                        🔄 Limpiar Filtros
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get active filters text
     * @returns {string} Filter description
     */
    getActiveFiltersText() {
        const filters = [];

        if (this.currentTimeframeFilter !== 'ALL') {
            filters.push(this.currentTimeframeFilter);
        }

        if (this.currentTypeFilter !== 'ALL') {
            filters.push(this.currentTypeFilter);
        }

        if (this.currentMinScore > 0) {
            filters.push(`Score ≥ ${this.currentMinScore}`);
        }

        return filters.length > 0 ? ` (${filters.join(', ')})` : '';
    }

    /**
     * Check if any filters are active
     * @returns {boolean} Has active filters
     */
    hasActiveFilters() {
        return this.currentTimeframeFilter !== 'ALL' ||
               this.currentTypeFilter !== 'ALL' ||
               this.currentMinScore > 0;
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentTimeframeFilter = 'ALL';
        this.currentTypeFilter = 'ALL';
        this.currentMinScore = 0;
        this.currentPage = 1;

        // Update UI
        if (this.timeframeFilter) this.timeframeFilter.value = 'ALL';
        if (this.typeFilter) this.typeFilter.value = 'ALL';
        if (this.minScoreFilter) this.minScoreFilter.value = '0';

        // Reload data
        this.update();
    }

    /**
     * Get CSS class for score styling
     * @param {number} score - Setup score
     * @returns {string} CSS class
     */
    getScoreClass(score) {
        if (score >= 7.0) return 'score-excellent';
        if (score >= 5.0) return 'score-good';
        if (score >= 3.0) return 'score-fair';
        return 'score-poor';
    }

    /**
     * Add event listeners to setup items
     */
    addEventListeners() {
        // For now, stored setups don't have detail modals
        // Could be added in the future if needed
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="refresh-button" onclick="window.setupsController.setupsAlmacenados.update()">
                        🔄 Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            setups: this.setups,
            currentPage: this.currentPage,
            pageSize: this.pageSize,
            totalPages: this.totalPages,
            totalCount: this.totalCount,
            filters: {
                timeframe: this.currentTimeframeFilter,
                type: this.currentTypeFilter,
                minScore: this.currentMinScore
            }
        };
    }

    /**
     * Get summary statistics
     * @returns {Promise<Object>} Summary data
     */
    async getSummary() {
        try {
            return await setupsAlmacenadosApi.getSummary();
        } catch (error) {
            console.error('Error fetching summary:', error);
            return null;
        }
    }

    /**
     * Get detailed statistics
     * @returns {Promise<Object>} Statistics data
     */
    async getStatistics() {
        try {
            return await setupsAlmacenadosApi.getStatistics();
        } catch (error) {
            console.error('Error fetching statistics:', error);
            return null;
        }
    }
}
