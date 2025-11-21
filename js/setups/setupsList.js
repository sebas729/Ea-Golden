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
     * Validate if a date string is valid
     * @param {string} dateString - Date string to validate
     * @returns {boolean} True if valid
     */
    isValidDateString(dateString) {
        if (!dateString || typeof dateString !== 'string') return false;
        if (dateString === 'N/A' || dateString.trim() === '') return false;

        try {
            const date = new Date(dateString);
            return !isNaN(date.getTime());
        } catch (error) {
            return false;
        }
    }

    /**
     * Format date for display
     * @param {string} isoString - ISO 8601 date string
     * @returns {string} Formatted date
     */
    formatDate(isoString) {
        if (!this.isValidDateString(isoString)) return 'N/A';

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
     * Calculate days ago from date
     * @param {string} isoString - ISO 8601 date string
     * @returns {number|null} Days ago
     */
    getDaysAgo(isoString) {
        if (!isoString) return null;

        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return null;

            const now = new Date();
            return Math.floor((now - date) / (1000 * 60 * 60 * 24));
        } catch (error) {
            return null;
        }
    }

    /**
     * Get freshness class for date
     * @param {string} highTime - High time ISO string
     * @param {string} lowTime - Low time ISO string
     * @returns {Object} Freshness info
     */
    getFreshnessInfo(highTime, lowTime) {
        const daysAgo = this.getDaysAgo(highTime);

        if (daysAgo === null) {
            return { class: 'freshness-unknown', label: 'N/A', color: '#999' };
        }

        if (daysAgo < 1) {
            return { class: 'freshness-very-fresh', label: 'HOY', color: '#00ff00' };
        }
        if (daysAgo < 7) {
            return { class: 'freshness-fresh', label: `${daysAgo}d`, color: '#90ee90' };
        }
        if (daysAgo < 30) {
            return { class: 'freshness-moderate', label: `${daysAgo}d`, color: '#ffa500' };
        }
        return { class: 'freshness-old', label: `${daysAgo}d`, color: '#ff4444' };
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

        // Get freshness info for badge - only if we have valid data
        const hasValidDate = this.isValidDateString(setup.high_time);
        const freshnessInfo = hasValidDate ? this.getFreshnessInfo(setup.high_time, setup.low_time) : null;

        return `
            <div class="setup-item ${setup.type.toLowerCase()}" onclick="showSetupDetail('${setup.id}')" data-setup-id="${setup.id}">
                <div class="setup-header">
                    <div class="setup-id">${setup.id}</div>
                    <div class="setup-type-badges">
                        <div class="setup-type ${setup.type.toLowerCase()}">${setup.type}</div>
                        ${setup.type === 'SIMPLE' && freshnessInfo ? `<span class="freshness-badge ${freshnessInfo.class}" title="Antigüedad: ${freshnessInfo.label}">${freshnessInfo.label}</span>` : ''}
                    </div>
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

                ${this.renderTemporalInfo(setup)}
                ${this.renderSetupLevels(setup.levels)}
            </div>
        `;
    }

    /**
     * Render temporal information (HIGH/LOW dates)
     * @param {Object} setup - Setup object
     * @returns {string} HTML string
     */
    renderTemporalInfo(setup) {
        // For SIMPLE setups, show high_time and low_time
        if (setup.type === 'SIMPLE') {
            // Only show if we have valid date data
            const hasHighTime = this.isValidDateString(setup.high_time);
            const hasLowTime = this.isValidDateString(setup.low_time);

            if (!hasHighTime && !hasLowTime) return '';

            return `
                <div class="temporal-info">
                    ${hasHighTime ? `
                    <div class="temporal-row">
                        <span class="temporal-label">HIGH:</span>
                        <span class="temporal-value">${this.formatDate(setup.high_time)}</span>
                        ${setup.high_price != null ? `<span class="temporal-price">${setup.high_price.toFixed(2)}</span>` : ''}
                    </div>
                    ` : ''}
                    ${hasLowTime ? `
                    <div class="temporal-row">
                        <span class="temporal-label">LOW:</span>
                        <span class="temporal-value">${this.formatDate(setup.low_time)}</span>
                        ${setup.low_price != null ? `<span class="temporal-price">${setup.low_price.toFixed(2)}</span>` : ''}
                    </div>
                    ` : ''}
                </div>
            `;
        }

        // For COMPLEX setups, show a summary or click for details
        if (setup.type === 'COMPLEX' && setup.grupos_fechas && typeof setup.grupos_fechas === 'object') {
            const groupCount = Object.keys(setup.grupos_fechas).length;
            if (groupCount > 0) {
                return `
                    <div class="temporal-info complex">
                        <div class="temporal-row">
                            <span class="temporal-label">Grupos:</span>
                            <span class="temporal-value">${groupCount} grupos (Click para detalles)</span>
                        </div>
                    </div>
                `;
            }
        }

        return '';
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