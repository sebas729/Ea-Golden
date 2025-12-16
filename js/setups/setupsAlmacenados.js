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

        // Get data from full_setup_data if available, otherwise use setup directly
        const setupData = setup.full_setup_data?.contenido || setup.full_setup_data || setup;

        // Get freshness info for badge - only if we have valid data
        const hasValidDate = this.isValidDateString(setupData.high_time);
        const freshnessInfo = hasValidDate ? this.getFreshnessInfo(setupData.high_time, setupData.low_time) : null;

        // Get levels count
        const levels = setup.levels || setupData.levels || setupData.niveles || [];
        const levelsDetail = setup.levels_detail || setupData.levels_detail || [];
        const levelsCount = levels.length || levelsDetail.length || 0;

        return `
            <div class="setup-item ${setup.type?.toLowerCase()} clickable" data-setup-id="${setup.id}">
                <div class="setup-header">
                    <div class="setup-id">${setup.setup_id || setup.id}</div>
                    <div class="setup-type-badges">
                        <div class="setup-type ${setup.type?.toLowerCase()}">${setup.type}</div>
                        <span class="setup-direction ${directionClass}">${setup.direction}</span>
                        ${setup.type === 'SIMPLE' && freshnessInfo ? `<span class="freshness-badge ${freshnessInfo.class}" title="Antigüedad: ${freshnessInfo.label}">${freshnessInfo.label}</span>` : ''}
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
                        <div class="setup-detail-label">Niveles</div>
                        <div class="setup-detail-value">${levelsCount}</div>
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

                ${this.renderTemporalInfo(setup)}
                ${this.renderSetupLevels(setup)}
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
     * Render temporal information inline (HIGH/LOW with prices)
     * @param {Object} setup - Setup object
     * @returns {string} HTML string
     */
    renderTemporalInfoInline(setup) {
        // Get data from full_setup_data if available, otherwise use setup directly
        const setupData = setup.full_setup_data?.contenido || setup.full_setup_data || setup;

        // For SIMPLE setups
        if (setup.type === 'SIMPLE' || setupData.tipo === 'SIMPLE') {
            const hasHighData = setupData.high_time && setupData.high_price != null;
            const hasLowData = setupData.low_time && setupData.low_price != null;

            if (!hasHighData && !hasLowData) return '';

            let infoHtml = '<div class="setup-detail temporal-info-inline">';
            infoHtml += '<div class="setup-detail-label">Temporal</div>';
            infoHtml += '<div class="setup-detail-value temporal-compact">';

            if (hasHighData) {
                infoHtml += `<span class="temporal-item-inline">H: ${this.formatOriginDate(setupData.high_time)} - <span class="temporal-price">${setupData.high_price.toFixed(2)}</span></span>`;
            }

            if (hasLowData) {
                if (hasHighData) infoHtml += ' | ';
                infoHtml += `<span class="temporal-item-inline">L: ${this.formatOriginDate(setupData.low_time)} - <span class="temporal-price">${setupData.low_price.toFixed(2)}</span></span>`;
            }

            infoHtml += '</div></div>';
            return infoHtml;
        }

        // For COMPLEX setups - show summary or first group
        if (setup.type === 'COMPLEX' || setupData.tipo === 'COMPLEX') {
            const gruposFechas = setupData.grupos_fechas || {};
            const gruposArray = Object.entries(gruposFechas);

            if (gruposArray.length === 0) return '';

            // Show first group or summary
            const [firstGroupId, firstGroupData] = gruposArray[0];

            if (!firstGroupData) return '';

            const hasHighData = firstGroupData.high_time && firstGroupData.high_price != null;
            const hasLowData = firstGroupData.low_time && firstGroupData.low_price != null;

            if (!hasHighData && !hasLowData) return '';

            let infoHtml = '<div class="setup-detail temporal-info-inline">';
            infoHtml += `<div class="setup-detail-label">Temporal (${firstGroupId})</div>`;
            infoHtml += '<div class="setup-detail-value temporal-compact">';

            if (hasHighData) {
                infoHtml += `<span class="temporal-item-inline">H: ${this.formatOriginDate(firstGroupData.high_time)} - <span class="temporal-price">${firstGroupData.high_price.toFixed(2)}</span></span>`;
            }

            if (hasLowData) {
                if (hasHighData) infoHtml += ' | ';
                infoHtml += `<span class="temporal-item-inline">L: ${this.formatOriginDate(firstGroupData.low_time)} - <span class="temporal-price">${firstGroupData.low_price.toFixed(2)}</span></span>`;
            }

            if (gruposArray.length > 1) {
                infoHtml += ` <span class="temporal-more">(+${gruposArray.length - 1} más)</span>`;
            }

            infoHtml += '</div></div>';
            return infoHtml;
        }

        return '';
    }

    /**
     * Render temporal information (HIGH/LOW dates) as separate section
     * @param {Object} setup - Setup object
     * @returns {string} HTML string
     */
    renderTemporalInfo(setup) {
        // Get data from full_setup_data if available, otherwise use setup directly
        const setupData = setup.full_setup_data?.contenido || setup.full_setup_data || setup;

        // For SIMPLE setups, show high_time and low_time
        if (setup.type === 'SIMPLE' || setupData.tipo === 'SIMPLE') {
            // Only show if we have valid date data
            const hasHighTime = this.isValidDateString(setupData.high_time);
            const hasLowTime = this.isValidDateString(setupData.low_time);

            if (!hasHighTime && !hasLowTime) return '';

            return `
                <div class="temporal-info">
                    ${hasHighTime ? `
                    <div class="temporal-row">
                        <span class="temporal-label">HIGH:</span>
                        <span class="temporal-value">${this.formatDate(setupData.high_time)}</span>
                        ${setupData.high_price != null ? `<span class="temporal-price">${setupData.high_price.toFixed(2)}</span>` : ''}
                    </div>
                    ` : ''}
                    ${hasLowTime ? `
                    <div class="temporal-row">
                        <span class="temporal-label">LOW:</span>
                        <span class="temporal-value">${this.formatDate(setupData.low_time)}</span>
                        ${setupData.low_price != null ? `<span class="temporal-price">${setupData.low_price.toFixed(2)}</span>` : ''}
                    </div>
                    ` : ''}
                </div>
            `;
        }

        // For COMPLEX setups, show a summary or click for details
        if (setup.type === 'COMPLEX' || setupData.tipo === 'COMPLEX') {
            const gruposFechas = setupData.grupos_fechas || {};
            const groupCount = Object.keys(gruposFechas).length;
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
     * Render setup levels (confluence tags)
     * @param {Object} setup - Setup object
     * @returns {string} HTML string
     */
    renderSetupLevels(setup) {
        // Get data from full_setup_data if available, otherwise use setup directly
        const setupData = setup.full_setup_data?.contenido || setup.full_setup_data || setup;

        // Try to get levels from multiple sources
        let levels = setup.levels ||
                    setupData.levels ||
                    setupData.niveles ||
                    [];

        // If no levels array, try to extract from levels_detail
        if (levels.length === 0) {
            const levelsDetail = setup.levels_detail ||
                                setupData.levels_detail ||
                                [];

            levels = levelsDetail.map(ld => ld.level_name || ld.level_type).filter(Boolean);
        }

        // For single nivel object (old structure)
        if (levels.length === 0 && setupData.nivel) {
            const nivel = setupData.nivel;
            levels = [nivel.level_name || nivel.level_type].filter(Boolean);
        }

        if (levels.length === 0) return '';

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
        // Add click handlers to stored setup items to show detail modal
        const setupItems = this.container.querySelectorAll('.setup-item.clickable');

        setupItems.forEach(item => {
            item.addEventListener('click', () => {
                const setupId = item.dataset.setupId;
                const setup = this.setups.find(s => s.id === setupId);

                if (setup && window.setupsController && window.setupsController.setupDetail) {
                    // Pass the complete setup object which includes levels, levels_detail
                    // and full_setup_data for adaptStoredSetupData to process
                    window.setupsController.setupDetail.showModal(setup);
                }
            });
        });
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
