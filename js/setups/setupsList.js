/**
 * Setups List Manager
 * Handles display and management of active setups list
 */

import { setupsApi } from '../services/setupsApi.js';

export class SetupsListManager {
    constructor() {
        this.setups = [];
        this.filteredSetups = [];
        this.currentFilter = 'ALL';
        this.currentSort = 'proximity';

        this.container = null;
        this.typeFilter = null;
        this.sortFilter = null;
    }

    /**
     * Initialize the setups list manager
     */
    async init() {
        this.container = document.getElementById('setups-list');
        this.typeFilter = document.getElementById('typeFilter');
        this.sortFilter = document.getElementById('sortFilter');

        if (!this.container) {
            throw new Error('Setups list container not found');
        }

        console.log('SetupsListManager initialized');
    }

    /**
     * Update setups list with new data
     * @param {Array} setups - Array of setup objects
     */
    async update(setups) {
        try {
            this.setups = setups || [];
            this.applyFiltersAndSorting();
            this.render();
        } catch (error) {
            console.error('Error updating setups list:', error);
            this.showError('Error al cargar la lista de setups');
        }
    }

    /**
     * Apply current filters and sorting
     */
    applyFiltersAndSorting() {
        // Apply type filter
        this.filteredSetups = this.setups.filter(setup => {
            if (this.currentFilter === 'ALL') return true;
            return setup.type === this.currentFilter;
        });

        // Apply sorting
        this.applySorting();
    }

    /**
     * Apply filters based on current selections
     */
    applyFilters() {
        if (this.typeFilter) {
            this.currentFilter = this.typeFilter.value;
        }
        this.applyFiltersAndSorting();
        this.render();
    }

    /**
     * Apply sorting based on current selection
     */
    applySorting() {
        if (this.sortFilter) {
            this.currentSort = this.sortFilter.value;
        }

        switch (this.currentSort) {
            case 'proximity':
                this.filteredSetups = setupsApi.sortSetupsByProximity(this.filteredSetups);
                break;
            case 'score':
                this.filteredSetups = setupsApi.sortSetupsByScore(this.filteredSetups);
                break;
            case 'timeframe':
                this.filteredSetups.sort((a, b) => {
                    const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
                    return timeframes.indexOf(a.timeframe) - timeframes.indexOf(b.timeframe);
                });
                break;
            default:
                this.filteredSetups = setupsApi.sortSetupsByProximity(this.filteredSetups);
        }

        if (this.container && this.setups.length > 0) {
            this.render();
        }
    }

    /**
     * Render the setups list
     */
    render() {
        if (!this.container) return;

        if (this.filteredSetups.length === 0) {
            this.container.innerHTML = this.renderEmptyState();
            return;
        }

        const setupsHtml = this.filteredSetups.map(setup => this.renderSetupItem(setup)).join('');
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
        const formattedSetup = setupsApi.formatSetupForDisplay(setup);
        const distanceClass = this.getDistanceClass(setup.distance_pips);
        const scoreClass = this.getScoreClass(setup.score);

        return `
            <div class="setup-item" onclick="showSetupDetail('${setup.id}')" data-setup-id="${setup.id}">
                <div class="setup-header">
                    <div class="setup-id">${setup.id}</div>
                    <div class="setup-type ${setup.type.toLowerCase()}">${setup.type}</div>
                </div>

                <div class="setup-details">
                    <div class="setup-detail">
                        <div class="setup-detail-label">Precio</div>
                        <div class="setup-detail-value">${formattedSetup.formattedPrice}</div>
                    </div>

                    <div class="setup-detail">
                        <div class="setup-detail-label">Distancia</div>
                        <div class="setup-detail-value ${distanceClass}">${formattedSetup.formattedDistance}</div>
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
                        <div class="setup-detail-label">Niveles</div>
                        <div class="setup-detail-value">${setup.levels_count}</div>
                    </div>

                    <div class="setup-detail">
                        <div class="setup-detail-label">Estado</div>
                        <div class="setup-detail-value">
                            <span class="setup-status status-${setup.status.toLowerCase()}">${setup.status}</span>
                        </div>
                    </div>
                </div>

                ${this.renderSetupLevels(setup.levels)}
            </div>
        `;
    }

    /**
     * Render setup levels
     * @param {Array} levels - Array of level strings
     * @returns {string} HTML string
     */
    renderSetupLevels(levels) {
        if (!levels || levels.length === 0) return '';

        const levelsHtml = levels.map(level => `<span class="level-tag">${level}</span>`).join('');

        return `
            <div class="setup-levels">
                <div class="levels-list">
                    ${levelsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Render empty state
     * @returns {string} HTML string
     */
    renderEmptyState() {
        const filterText = this.currentFilter === 'ALL' ? '' : ` (${this.currentFilter})`;

        return `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No hay setups disponibles${filterText}</h3>
                <p>No se encontraron setups que coincidan con los filtros actuales.</p>
                <button class="refresh-button" onclick="loadSetupsData(true)">
                    🔄 Actualizar Datos
                </button>
            </div>
        `;
    }

    /**
     * Get CSS class for distance styling
     * @param {number} distance - Distance in pips
     * @returns {string} CSS class
     */
    getDistanceClass(distance) {
        if (distance <= 10) return 'distance-close';
        if (distance <= 30) return 'distance-moderate';
        return 'distance-far';
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
        // Setup item click handlers are added via onclick in HTML
        // This could be improved to use event delegation

        // Make showSetupDetail globally available
        window.showSetupDetail = (setupId) => {
            const setup = this.setups.find(s => s.id === setupId);
            if (setup && window.setupsController) {
                window.setupsController.setupDetail.showModal(setup);
            }
        };
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
                    <button class="refresh-button" onclick="loadSetupsData(true)">
                        🔄 Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Get filtered setups count by type
     * @returns {Object} Count by type
     */
    getSetupsCount() {
        const grouped = setupsApi.groupSetupsByType(this.setups);
        return {
            total: this.setups.length,
            complex: (grouped.COMPLEX || []).length,
            simple: (grouped.SIMPLE || []).length,
            filtered: this.filteredSetups.length
        };
    }

    /**
     * Get setups within distance threshold
     * @param {number} threshold - Distance threshold in pips
     * @returns {Array} Close setups
     */
    getCloseSetups(threshold = 20) {
        return this.setups.filter(setup => setup.distance_pips <= threshold);
    }

    /**
     * Get highest scoring setup
     * @returns {Object|null} Best setup
     */
    getBestSetup() {
        if (this.setups.length === 0) return null;
        return this.setups.reduce((best, current) =>
            current.score > best.score ? current : best
        );
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            setups: this.setups,
            filteredSetups: this.filteredSetups,
            currentFilter: this.currentFilter,
            currentSort: this.currentSort,
            counts: this.getSetupsCount()
        };
    }
}