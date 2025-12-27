/**
 * Confluences Manager
 * Handles display and management of confluence zones
 */

import { getScoreClass } from '../shared/constants.js';

export class ConfluencesManager {
    constructor() {
        this.confluences = {};
        this.summaryContainer = null;
        this.zonesContainer = null;
    }

    /**
     * Initialize the confluences manager
     */
    async init() {
        this.summaryContainer = document.getElementById('confluences-summary');
        this.zonesContainer = document.getElementById('confluences-zones');

        if (!this.summaryContainer || !this.zonesContainer) {
            throw new Error('Confluences containers not found');
        }


    }

    /**
     * Update confluences with new data
     * @param {Object} confluences - Confluences data object
     */
    async update(confluences) {
        try {
            this.confluences = confluences || {};
            this.renderSummary();
            this.renderZones();
        } catch (error) {
            console.error('Error updating confluences:', error);
            this.showError('Error al cargar las confluencias');
        }
    }

    /**
     * Render confluences summary
     */
    renderSummary() {
        if (!this.summaryContainer) return;

        const total = this.confluences.total || 0;
        const byStrength = this.confluences.by_strength || {};

        const summaryHtml = `
            <div class="confluence-summary-card">
                <div class="confluence-summary-value">${total}</div>
                <div class="confluence-summary-label">Total Zonas</div>
            </div>

            <div class="confluence-summary-card">
                <div class="confluence-summary-value">${byStrength.ALTA || 0}</div>
                <div class="confluence-summary-label">Fortaleza Alta</div>
            </div>

            <div class="confluence-summary-card">
                <div class="confluence-summary-value">${byStrength.MEDIA || 0}</div>
                <div class="confluence-summary-label">Fortaleza Media</div>
            </div>

            <div class="confluence-summary-card">
                <div class="confluence-summary-value">${byStrength.BAJA || 0}</div>
                <div class="confluence-summary-label">Fortaleza Baja</div>
            </div>
        `;

        this.summaryContainer.innerHTML = summaryHtml;
    }

    /**
     * Render confluence zones
     */
    renderZones() {
        if (!this.zonesContainer) return;

        const zones = this.confluences.zones || [];

        if (zones.length === 0) {
            this.zonesContainer.innerHTML = this.renderEmptyState();
            return;
        }

        const zonesHtml = zones.map(zone => this.renderZone(zone)).join('');
        this.zonesContainer.innerHTML = zonesHtml;
    }

    /**
     * Render a single confluence zone
     * @param {Object} zone - Zone object
     * @returns {string} HTML string
     */
    renderZone(zone) {
        const strengthClass = this.getStrengthClass(zone.strength);
        const scoreClass = this.getScoreClass(zone.score);

        return `
            <div class="confluence-zone" data-zone-id="${zone.id}">
                <div class="zone-header">
                    <div class="zone-id">Zona ${zone.id}</div>
                    <div class="zone-strength ${strengthClass}">${zone.strength}</div>
                </div>

                <div class="zone-details">
                    <div class="setup-detail">
                        <div class="setup-detail-label">Rango Precio</div>
                        <div class="setup-detail-value">
                            ${zone.range_min.toFixed(2)} - ${zone.range_max.toFixed(2)}
                        </div>
                    </div>

                    <div class="setup-detail">
                        <div class="setup-detail-label">Rango Pips</div>
                        <div class="setup-detail-value">${zone.range_pips.toFixed(1)} pips</div>
                    </div>

                    <div class="setup-detail">
                        <div class="setup-detail-label">Score</div>
                        <div class="setup-detail-value ${scoreClass}">${zone.score.toFixed(1)}</div>
                    </div>

                    <div class="setup-detail">
                        <div class="setup-detail-label">Niveles</div>
                        <div class="setup-detail-value">${zone.levels_count}</div>
                    </div>

                    <div class="setup-detail">
                        <div class="setup-detail-label">TF Dominante</div>
                        <div class="setup-detail-value">${zone.dominant_timeframe}</div>
                    </div>
                </div>

                ${this.renderZoneLevels(zone.levels)}
                ${this.renderZoneIndicator(zone)}
            </div>
        `;
    }

    /**
     * Render zone levels
     * @param {Array} levels - Array of level strings
     * @returns {string} HTML string
     */
    renderZoneLevels(levels) {
        if (!levels || levels.length === 0) return '';

        const levelsHtml = levels.map(level => `<span class="level-tag">${level}</span>`).join('');

        return `
            <div class="setup-levels">
                <div class="setup-detail-label">Niveles en la Zona:</div>
                <div class="levels-list">
                    ${levelsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Render zone visual indicator
     * @param {Object} zone - Zone object
     * @returns {string} HTML string
     */
    renderZoneIndicator(zone) {
        const strengthPercentage = this.getStrengthPercentage(zone.strength);
        const strengthColor = this.getStrengthColor(zone.strength);

        return `
            <div class="zone-indicator">
                <div class="zone-indicator-label">Fortaleza de la Zona</div>
                <div class="zone-indicator-bar">
                    <div class="zone-indicator-fill"
                         style="width: ${strengthPercentage}%; background-color: ${strengthColor}">
                    </div>
                </div>
                <div class="zone-indicator-text">${zone.strength} (${zone.score.toFixed(1)})</div>
            </div>
        `;
    }

    /**
     * Render empty state
     * @returns {string} HTML string
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🗺️</div>
                <h3>No hay zonas de confluencia</h3>
                <p>No se detectaron zonas de confluencia en el análisis actual.</p>
                <button class="refresh-button" onclick="loadSetupsData(true)">
                    🔄 Actualizar Datos
                </button>
            </div>
        `;
    }

    /**
     * Get CSS class for strength
     * @param {string} strength - Strength level
     * @returns {string} CSS class
     */
    getStrengthClass(strength) {
        switch (strength?.toUpperCase()) {
            case 'ALTA': return 'strength-alta';
            case 'MEDIA': return 'strength-media';
            case 'BAJA': return 'strength-baja';
            default: return 'strength-media';
        }
    }

    /**
     * Get CSS class for score
     * @param {number} score - Zone score
     * @returns {string} CSS class
     */
    getScoreClass(score) {
        return getScoreClass(score);
    }

    /**
     * Get strength percentage for visual indicator
     * @param {string} strength - Strength level
     * @returns {number} Percentage (0-100)
     */
    getStrengthPercentage(strength) {
        switch (strength?.toUpperCase()) {
            case 'ALTA': return 90;
            case 'MEDIA': return 60;
            case 'BAJA': return 30;
            default: return 50;
        }
    }

    /**
     * Get strength color for visual indicator
     * @param {string} strength - Strength level
     * @returns {string} CSS color
     */
    getStrengthColor(strength) {
        switch (strength?.toUpperCase()) {
            case 'ALTA': return 'var(--green-accent)';
            case 'MEDIA': return 'var(--yellow-accent)';
            case 'BAJA': return 'var(--red-accent)';
            default: return 'var(--blue-accent)';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.zonesContainer) {
            this.zonesContainer.innerHTML = `
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

        if (this.summaryContainer) {
            this.summaryContainer.innerHTML = `
                <div class="confluence-summary-card">
                    <div class="confluence-summary-value">-</div>
                    <div class="confluence-summary-label">Error</div>
                </div>
            `;
        }
    }

    /**
     * Get confluence zones by strength
     * @param {string} strength - Strength level to filter by
     * @returns {Array} Filtered zones
     */
    getZonesByStrength(strength) {
        const zones = this.confluences.zones || [];
        return zones.filter(zone => zone.strength?.toUpperCase() === strength?.toUpperCase());
    }

    /**
     * Get strongest confluence zone
     * @returns {Object|null} Strongest zone
     */
    getStrongestZone() {
        const zones = this.confluences.zones || [];
        if (zones.length === 0) return null;

        return zones.reduce((strongest, current) => {
            if (!strongest) return current;

            // First compare by strength level
            const strengthOrder = { 'ALTA': 3, 'MEDIA': 2, 'BAJA': 1 };
            const currentStrengthValue = strengthOrder[current.strength?.toUpperCase()] || 0;
            const strongestStrengthValue = strengthOrder[strongest.strength?.toUpperCase()] || 0;

            if (currentStrengthValue > strongestStrengthValue) {
                return current;
            } else if (currentStrengthValue === strongestStrengthValue) {
                // If same strength level, compare by score
                return current.score > strongest.score ? current : strongest;
            }

            return strongest;
        });
    }

    /**
     * Get zones within price range
     * @param {number} minPrice - Minimum price
     * @param {number} maxPrice - Maximum price
     * @returns {Array} Zones within range
     */
    getZonesInPriceRange(minPrice, maxPrice) {
        const zones = this.confluences.zones || [];
        return zones.filter(zone => {
            return zone.range_min <= maxPrice && zone.range_max >= minPrice;
        });
    }

    /**
     * Get confluence statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        const zones = this.confluences.zones || [];
        const byStrength = this.confluences.by_strength || {};

        return {
            totalZones: zones.length,
            byStrength: byStrength,
            averageScore: zones.length > 0 ?
                zones.reduce((sum, zone) => sum + zone.score, 0) / zones.length : 0,
            maxScore: zones.length > 0 ?
                Math.max(...zones.map(zone => zone.score)) : 0,
            averageRange: zones.length > 0 ?
                zones.reduce((sum, zone) => sum + zone.range_pips, 0) / zones.length : 0
        };
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            confluences: this.confluences,
            statistics: this.getStatistics(),
            strongestZone: this.getStrongestZone()
        };
    }
}