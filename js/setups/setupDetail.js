/**
 * Setup Detail Manager
 * Handles display of detailed setup information in modal
 */

import { setupsApi } from '../services/setupsApi.js';

export class SetupDetailManager {
    constructor() {
        this.modal = null;
        this.modalTitle = null;
        this.modalBody = null;
        this.currentSetup = null;
        this.isLoading = false;
    }

    /**
     * Initialize the setup detail manager
     */
    async init() {
        this.modal = document.getElementById('setupDetailModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');

        if (!this.modal || !this.modalTitle || !this.modalBody) {
            throw new Error('Setup detail modal elements not found');
        }

        this.setupEventListeners();
        console.log('SetupDetailManager initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // ESC key handler is managed by main controller

        // Click outside modal to close
        const overlay = this.modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeModal());
        }

        // Close button handler is added via onclick in HTML
    }

    /**
     * Show modal with setup details
     * @param {Object} setup - Setup object to display
     */
    async showModal(setup) {
        if (!setup || this.isLoading) return;

        try {
            this.isLoading = true;
            this.currentSetup = setup;

            // Show modal immediately with basic info
            this.modalTitle.textContent = `Setup ${setup.id} - ${setup.type}`;
            this.modalBody.innerHTML = this.renderLoadingState();
            this.modal.style.display = 'flex';

            // Load detailed information
            const detailData = await setupsApi.getSetupDetail(setup.id);

            // Render complete modal content
            this.renderModalContent(detailData);

        } catch (error) {
            console.error('Error loading setup detail:', error);
            this.renderErrorState(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.currentSetup = null;
        }
    }

    /**
     * Render loading state
     * @returns {string} HTML string
     */
    renderLoadingState() {
        return `
            <div class="modal-loading">
                <div class="spinner"></div>
                <p>Cargando detalles del setup...</p>
            </div>
        `;
    }

    /**
     * Render error state
     * @param {string} message - Error message
     */
    renderErrorState(message) {
        this.modalBody.innerHTML = `
            <div class="modal-error">
                <div class="error-icon">❌</div>
                <h3>Error al cargar detalles</h3>
                <p>${message}</p>
                <button class="refresh-button" onclick="setupsController.setupDetail.showModal(setupsController.setupDetail.currentSetup)">
                    🔄 Reintentar
                </button>
            </div>
        `;
    }

    /**
     * Render complete modal content
     * @param {Object} detailData - Complete setup detail data
     */
    renderModalContent(detailData) {
        if (!detailData || !detailData.setup) {
            this.renderErrorState('No se pudo cargar la información del setup');
            return;
        }

        const setup = detailData.setup;
        const analysis = detailData.analysis || {};
        const relatedSetups = detailData.related_setups || [];
        const marketContext = detailData.market_context || {};

        const content = `
            <div class="setup-detail-modal">
                ${this.renderSetupHeader(setup)}
                ${this.renderSetupMetrics(setup, analysis)}
                ${this.renderSetupLevelsDetail(setup)}
                ${this.renderMarketContext(marketContext)}
                ${this.renderAnalysis(analysis)}
                ${this.renderRelatedSetups(relatedSetups)}
            </div>
        `;

        this.modalBody.innerHTML = content;
    }

    /**
     * Render setup header section
     * @param {Object} setup - Setup object
     * @returns {string} HTML string
     */
    renderSetupHeader(setup) {
        const typeClass = setup.type?.toLowerCase() || 'simple';
        const statusClass = setup.status?.toLowerCase() || 'pending';
        const formattedSetup = setupsApi.formatSetupForDisplay(setup);

        return `
            <div class="setup-header-detail">
                <div class="setup-main-info">
                    <div class="setup-id-large">${setup.id}</div>
                    <div class="setup-badges">
                        <span class="setup-type ${typeClass}">${setup.type}</span>
                        <span class="setup-status status-${statusClass}">${setup.status}</span>
                    </div>
                </div>
                <div class="setup-price-info">
                    <div class="setup-price">${formattedSetup.formattedPrice}</div>
                    <div class="setup-distance ${this.getDistanceClass(setup.distance_pips)}">
                        ${formattedSetup.formattedDistance}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render setup metrics section
     * @param {Object} setup - Setup object
     * @param {Object} analysis - Analysis data
     * @returns {string} HTML string
     */
    renderSetupMetrics(setup, analysis) {
        const scoreClass = this.getScoreClass(setup.score);

        return `
            <div class="setup-metrics">
                <h3>📊 Métricas del Setup</h3>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <div class="metric-label">Score de Calidad</div>
                        <div class="metric-value ${scoreClass}">${setup.score?.toFixed(1) || 'N/A'}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Timeframe Principal</div>
                        <div class="metric-value">${setup.timeframe || 'N/A'}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Cantidad de Niveles</div>
                        <div class="metric-value">${setup.levels_count || 0}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Complejidad</div>
                        <div class="metric-value">${analysis.complexity || 'N/A'}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Proximidad al Mercado</div>
                        <div class="metric-value">${analysis.proximity_to_market?.toFixed(1) || 'N/A'} pips</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Fortaleza de TF</div>
                        <div class="metric-value">${analysis.timeframe_strength || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render setup levels detail section
     * @param {Object} setup - Setup object
     * @returns {string} HTML string
     */
    renderSetupLevelsDetail(setup) {
        const levels = setup.levels_detail || [];
        const simpleLevels = setup.levels || [];

        return `
            <div class="setup-levels-detail">
                <h3>🎯 Niveles del Setup</h3>
                ${levels.length > 0 ? this.renderDetailedLevels(levels) : this.renderSimpleLevels(simpleLevels)}
            </div>
        `;
    }

    /**
     * Render detailed levels
     * @param {Array} levels - Detailed levels array
     * @returns {string} HTML string
     */
    renderDetailedLevels(levels) {
        const levelsHtml = levels.map(level => `
            <div class="level-detail-item">
                <div class="level-header">
                    <span class="level-name">${level.level_name || 'N/A'}</span>
                    <span class="level-type">${level.level_type || 'N/A'}</span>
                </div>
                <div class="level-info">
                    <span class="level-price">Precio: ${level.price?.toFixed(2) || 'N/A'}</span>
                    <span class="level-timeframe">TF: ${level.timeframe || 'N/A'}</span>
                    <span class="level-group">Grupo: ${level.group_id || 'N/A'}</span>
                </div>
            </div>
        `).join('');

        return `<div class="levels-detail-list">${levelsHtml}</div>`;
    }

    /**
     * Render simple levels
     * @param {Array} levels - Simple levels array
     * @returns {string} HTML string
     */
    renderSimpleLevels(levels) {
        if (levels.length === 0) {
            return '<p class="no-levels">No hay información detallada de niveles disponible.</p>';
        }

        const levelsHtml = levels.map(level => `
            <span class="level-tag-modal">${level}</span>
        `).join('');

        return `<div class="simple-levels-list">${levelsHtml}</div>`;
    }

    /**
     * Render market context section
     * @param {Object} marketContext - Market context data
     * @returns {string} HTML string
     */
    renderMarketContext(marketContext) {
        return `
            <div class="market-context">
                <h3>📈 Contexto del Mercado</h3>
                <div class="context-grid">
                    <div class="context-item">
                        <div class="context-label">Total de Setups</div>
                        <div class="context-value">${marketContext.total_setups || 0}</div>
                    </div>
                    <div class="context-item">
                        <div class="context-label">Dirección del Mercado</div>
                        <div class="context-value direction-${(marketContext.direction || '').toLowerCase()}">
                            ${marketContext.direction || 'N/A'}
                        </div>
                    </div>
                    <div class="context-item">
                        <div class="context-label">Fortaleza de Tendencia</div>
                        <div class="context-value">${marketContext.trend_strength || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render analysis section
     * @param {Object} analysis - Analysis data
     * @returns {string} HTML string
     */
    renderAnalysis(analysis) {
        return `
            <div class="setup-analysis">
                <h3>🔍 Análisis Recomendado</h3>
                <div class="analysis-content">
                    <div class="recommendation">
                        <strong>Acción Recomendada:</strong>
                        <p>${analysis.recommended_action || 'No hay recomendación específica disponible.'}</p>
                    </div>
                    ${this.renderQualityIndicators(analysis)}
                </div>
            </div>
        `;
    }

    /**
     * Render quality indicators
     * @param {Object} analysis - Analysis data
     * @returns {string} HTML string
     */
    renderQualityIndicators(analysis) {
        return `
            <div class="quality-indicators">
                <div class="quality-item">
                    <div class="quality-label">Score de Calidad</div>
                    <div class="quality-bar">
                        <div class="quality-fill" style="width: ${(analysis.quality_score || 0) * 10}%"></div>
                    </div>
                    <div class="quality-value">${analysis.quality_score?.toFixed(1) || 'N/A'}/10</div>
                </div>
            </div>
        `;
    }

    /**
     * Render related setups section
     * @param {Array} relatedSetups - Related setups array
     * @returns {string} HTML string
     */
    renderRelatedSetups(relatedSetups) {
        if (!relatedSetups || relatedSetups.length === 0) {
            return `
                <div class="related-setups">
                    <h3>🔗 Setups Relacionados</h3>
                    <p class="no-related">No hay setups relacionados en el área.</p>
                </div>
            `;
        }

        const setupsHtml = relatedSetups.map(setup => `
            <div class="related-setup-item" onclick="showSetupDetail('${setup.id}')">
                <div class="related-setup-header">
                    <span class="related-setup-id">${setup.id}</span>
                    <span class="related-setup-type ${setup.type?.toLowerCase()}">${setup.type}</span>
                </div>
                <div class="related-setup-info">
                    <span>Precio: ${setup.price?.toFixed(2) || 'N/A'}</span>
                    <span>Distancia: ${setup.distance_pips?.toFixed(1) || 'N/A'} pips</span>
                </div>
            </div>
        `).join('');

        return `
            <div class="related-setups">
                <h3>🔗 Setups Relacionados</h3>
                <div class="related-setups-list">
                    ${setupsHtml}
                </div>
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
     * Check if modal is currently open
     * @returns {boolean} Is modal open
     */
    isModalOpen() {
        return this.modal && this.modal.style.display === 'flex';
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            isOpen: this.isModalOpen(),
            currentSetup: this.currentSetup,
            isLoading: this.isLoading
        };
    }
}