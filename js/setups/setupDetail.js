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
                year: 'numeric',
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
     * @param {number} daysAgo - Days ago
     * @returns {string} CSS class
     */
    getFreshnessClass(daysAgo) {
        if (daysAgo === null) return 'freshness-unknown';
        if (daysAgo < 1) return 'freshness-very-fresh';
        if (daysAgo < 7) return 'freshness-fresh';
        if (daysAgo < 30) return 'freshness-moderate';
        return 'freshness-old';
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
            const setupId = setup.setup_id || setup.id;
            const setupType = setup.tipo || setup.type;

            // Determine if this is a stored setup or active setup
            // Stored setups have UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
            // Active setups have format C123 or S456
            const isStoredSetup = setupId && setupId.includes('-') && setupId.length > 20;

            console.log('[SetupDetail] Setup ID:', setupId, 'Is Stored?', isStoredSetup);

            this.modalTitle.textContent = `Setup ${setupId} - ${setupType}`;
            this.modalBody.innerHTML = this.renderLoadingState();
            this.modal.style.display = 'flex';

            let detailData;

            if (isStoredSetup) {
                // For stored setups, use the data we already have
                // Adapt to the structure expected by renderModalContent
                detailData = this.adaptStoredSetupData(setup);
            } else {
                // For active setups, load detailed information from API
                detailData = await setupsApi.getSetupDetail(setupId);
            }

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
     * Adapt stored setup data to match the structure expected by renderModalContent
     * @param {Object} storedSetup - Stored setup object
     * @returns {Object} Adapted data structure
     */
    adaptStoredSetupData(storedSetup) {
        // Extract data from contenido if it exists
        const contenido = storedSetup.contenido || storedSetup;

        // Determine type from multiple possible sources
        const setupType = storedSetup.tipo || contenido.tipo || storedSetup.type || 'SIMPLE';

        // Build setup object in expected format
        const setup = {
            id: storedSetup.setup_id || storedSetup.id,
            setup_id: storedSetup.setup_id || storedSetup.id,
            type: setupType,
            tipo: setupType,
            price: contenido.precio_activacion || storedSetup.precio_activacion || storedSetup.price || 0,
            timeframe: contenido.timeframe_dominante || storedSetup.timeframe_dominante || storedSetup.timeframe || 'N/A',
            score: storedSetup.score || 0,
            status: 'STORED',
            direction: storedSetup.direction || contenido.direccion || 'BUY',
            distance_pips: 0, // Stored setups don't have distance

            // Temporal information
            high_time: contenido.high_time || storedSetup.high_time,
            low_time: contenido.low_time || storedSetup.low_time,
            high_price: contenido.high_price != null ? contenido.high_price : storedSetup.high_price,
            low_price: contenido.low_price != null ? contenido.low_price : storedSetup.low_price,

            // Grupos fechas for COMPLEX setups
            grupos_fechas: contenido.grupos_fechas || storedSetup.grupos_fechas,

            // Levels information - extract from multiple sources
            levels: (() => {
                let levels = storedSetup.levels || contenido.levels || contenido.niveles || [];

                // Check if levels array contains objects instead of strings
                if (levels.length > 0 && typeof levels[0] === 'object' && levels[0] !== null) {
                    // Extract level names from objects
                    levels = levels.map(l => l.level_name || l.level_type).filter(Boolean);
                }

                // If no levels array, try to extract from levels_detail
                if (levels.length === 0) {
                    const levelsDetail = storedSetup.levels_detail || contenido.levels_detail || [];
                    levels = levelsDetail.map(ld => ld.level_name || ld.level_type).filter(Boolean);
                }

                // For single nivel object (old structure)
                if (levels.length === 0 && contenido.nivel) {
                    levels = [contenido.nivel.level_name || contenido.nivel.level_type].filter(Boolean);
                }

                return levels;
            })(),
            levels_count: (() => {
                const levels = storedSetup.levels || contenido.levels || contenido.niveles || [];
                const levelsDetail = storedSetup.levels_detail || contenido.levels_detail || [];
                return levels.length || levelsDetail.length || (contenido.nivel ? 1 : 0);
            })(),
            levels_detail: (() => {
                let levelsDetail = storedSetup.levels_detail || contenido.levels_detail || [];
                // Handle old structure with single nivel object
                if (levelsDetail.length === 0 && contenido.nivel) {
                    levelsDetail = [{
                        level_name: contenido.nivel.level_name,
                        level_type: contenido.nivel.level_type,
                        price: contenido.nivel.value,  // Map 'value' to 'price'
                        timeframe: contenido.nivel.timeframe,
                        group_id: contenido.nivel.group_id,
                        high_time: contenido.high_time,
                        low_time: contenido.low_time
                    }];
                }
                return levelsDetail;
            })()};

        // Build minimal analysis object
        const analysis = {
            complexity: setup.type,
            quality_score: storedSetup.score || 0,
            proximity_to_market: 0,
            recommended_action: 'Este es un setup almacenado. Revisa la información temporal y niveles para análisis histórico.'
        };

        return {
            setup: setup,
            analysis: analysis,
            related_setups: [],
            market_context: {
                total_setups: 0,
                direccion: setup.direction || 'N/A',
                precio_actual: setup.price,
                calidad_general: setup.score >= 7 ? 'Excelente' :
                                setup.score >= 5 ? 'Buena' :
                                setup.score >= 3 ? 'Regular' : 'Baja'
            }
        };
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
                ${this.renderTemporalInformation(setup)}
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
                        <div class="metric-value">${analysis.timeframe_strength || 'Desconocida'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render temporal information section (HIGH/LOW dates)
     * @param {Object} setup - Setup object
     * @returns {string} HTML string
     */
    renderTemporalInformation(setup) {
        // SIMPLE setups: Show high_time and low_time directly
        if (setup.type === 'SIMPLE') {
            // Only show if we have valid date data
            const hasHighTime = this.isValidDateString(setup.high_time);
            const hasLowTime = this.isValidDateString(setup.low_time);

            if (!hasHighTime && !hasLowTime) return '';

            const highDays = this.getDaysAgo(setup.high_time);
            const lowDays = this.getDaysAgo(setup.low_time);
            const highClass = this.getFreshnessClass(highDays);
            const lowClass = this.getFreshnessClass(lowDays);

            return `
                <div class="temporal-section">
                    <h3>⏰ Información Temporal</h3>
                    <div class="temporal-grid">
                        ${hasHighTime ? `
                        <div class="temporal-item">
                            <div class="temporal-label">HIGH Formado</div>
                            <div class="temporal-value">${this.formatDate(setup.high_time)}</div>
                            ${setup.high_price != null ? `<div class="temporal-price">Precio: ${setup.high_price.toFixed(2)}</div>` : ''}
                            <div class="temporal-age ${highClass}">
                                ${highDays !== null ? (highDays === 0 ? 'HOY' : `${highDays} días`) : 'N/A'}
                            </div>
                        </div>
                        ` : ''}
                        ${hasLowTime ? `
                        <div class="temporal-item">
                            <div class="temporal-label">LOW Formado</div>
                            <div class="temporal-value">${this.formatDate(setup.low_time)}</div>
                            ${setup.low_price != null ? `<div class="temporal-price">Precio: ${setup.low_price.toFixed(2)}</div>` : ''}
                            <div class="temporal-age ${lowClass}">
                                ${lowDays !== null ? (lowDays === 0 ? 'HOY' : `${lowDays} días`) : 'N/A'}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // COMPLEX setups: Show grupos_fechas table
        if (setup.type === 'COMPLEX' && setup.grupos_fechas && typeof setup.grupos_fechas === 'object') {
            const grupos = Object.entries(setup.grupos_fechas);
            if (grupos.length === 0) return '';

            const gruposHtml = grupos.map(([groupId, fechas]) => {
                const highDays = this.getDaysAgo(fechas.high_time);
                const lowDays = this.getDaysAgo(fechas.low_time);
                const highClass = this.getFreshnessClass(highDays);
                const lowClass = this.getFreshnessClass(lowDays);

                return `
                    <tr>
                        <td class="group-name">${groupId}</td>
                        <td>
                            <div class="date-cell">${this.formatDate(fechas.high_time)}</div>
                            ${fechas.high_price != null ? `<div class="price-cell">${fechas.high_price.toFixed(2)}</div>` : ''}
                            <div class="age-cell ${highClass}">
                                ${highDays !== null ? (highDays === 0 ? 'HOY' : `${highDays}d`) : 'N/A'}
                            </div>
                        </td>
                        <td>
                            <div class="date-cell">${this.formatDate(fechas.low_time)}</div>
                            ${fechas.low_price != null ? `<div class="price-cell">${fechas.low_price.toFixed(2)}</div>` : ''}
                            <div class="age-cell ${lowClass}">
                                ${lowDays !== null ? (lowDays === 0 ? 'HOY' : `${lowDays}d`) : 'N/A'}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="temporal-section">
                    <h3>⏰ Información Temporal por Grupo</h3>
                    <div class="grupos-fechas-table-container">
                        <table class="grupos-fechas-table">
                            <thead>
                                <tr>
                                    <th>Grupo</th>
                                    <th>HIGH</th>
                                    <th>LOW</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${gruposHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        return '';
    }

    /**
     * Render setup levels detail section
     * @param {Object} setup - Setup object
     * @returns {string} HTML string
     */
    renderSetupLevelsDetail(setup) {
        // For stored setups, adaptStoredSetupData() already processed the data
        // and placed levels_detail directly in setup object
        // For active setups, the data comes from API and is also in setup object
        const levels = setup.levels_detail || [];
        let simpleLevels = setup.levels || [];

        // If no simple levels array, try to extract from levels_detail
        if (simpleLevels.length === 0 && levels.length > 0) {
            simpleLevels = levels.map(ld => ld.level_name || ld.level_type).filter(Boolean);
        }

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
        const levelsHtml = levels.map(level => {
            // Check if level has valid date information
            const hasHighTime = this.isValidDateString(level.high_time);
            const hasLowTime = this.isValidDateString(level.low_time);
            const hasDateInfo = hasHighTime || hasLowTime;

            return `
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
                    ${hasDateInfo ? `
                        <div class="level-dates">
                            ${hasHighTime ? `
                            <div class="level-date-item">
                                <span class="level-date-label">H:</span>
                                <span class="level-date-value">${this.formatDate(level.high_time)}</span>
                            </div>
                            ` : ''}
                            ${hasLowTime ? `
                            <div class="level-date-item">
                                <span class="level-date-label">L:</span>
                                <span class="level-date-value">${this.formatDate(level.low_time)}</span>
                            </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

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
                        <div class="context-value direction-${(marketContext.direccion || '').toLowerCase()}">
                            ${marketContext.direccion || 'N/A'}
                        </div>
                    </div>
                    <div class="context-item">
                        <div class="context-label">Precio Actual</div>
                        <div class="context-value">${marketContext.precio_actual?.toFixed(2) || 'N/A'}</div>
                    </div>
                    <div class="context-item">
                        <div class="context-label">Calidad General</div>
                        <div class="context-value">${marketContext.calidad_general || 'N/A'}</div>
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