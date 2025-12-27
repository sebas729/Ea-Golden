/**
 * Proximity Manager
 * Handles proximity alerts and close setups monitoring
 */

import { setupsApi } from '../services/setupsApi.js';
import { getScoreClass } from '../shared/constants.js';

export class ProximityManager {
    constructor() {
        this.setups = [];
        this.threshold = 20; // Default threshold in pips
        this.container = null;
        this.lastAlertCount = 0;
    }

    /**
     * Initialize the proximity manager
     */
    async init() {
        this.container = document.getElementById('proximity-alerts');

        if (!this.container) {
            throw new Error('Proximity alerts container not found');
        }


    }

    /**
     * Update proximity alerts with new setups data
     * @param {Array} setups - Array of setup objects
     */
    async update(setups) {
        try {
            this.setups = setups || [];
            await this.loadAndRenderProximityAlerts();
        } catch (error) {
            console.error('Error updating proximity alerts:', error);
            this.showError('Error al cargar las alertas de proximidad');
        }
    }

    /**
     * Update threshold for proximity detection
     * @param {number} newThreshold - New threshold in pips
     */
    updateThreshold(newThreshold) {
        this.threshold = newThreshold;
        this.renderProximityAlerts();
    }

    /**
     * Load fresh proximity data and render alerts
     */
    async loadAndRenderProximityAlerts() {
        try {
            // Load fresh proximity data from API
            const proximityData = await setupsApi.getSetupsByProximity(this.threshold);

            if (proximityData && proximityData.setups) {
                this.renderProximityAlerts(proximityData.setups);
                this.checkForNewAlerts(proximityData.setups);
            } else {
                // Fallback to provided setups
                this.renderProximityAlerts();
            }
        } catch (error) {
            console.warn('Could not load fresh proximity data, using provided setups:', error);
            this.renderProximityAlerts();
        }
    }

    /**
     * Render proximity alerts
     * @param {Array} proximitySetups - Optional proximity setups array
     */
    renderProximityAlerts(proximitySetups = null) {
        if (!this.container) return;

        // Use provided proximity setups or filter current setups
        const closeSetups = proximitySetups || this.getCloseSetups();

        if (closeSetups.length === 0) {
            this.container.innerHTML = this.renderEmptyState();
            return;
        }

        // Sort by distance (closest first)
        const sortedSetups = setupsApi.sortSetupsByProximity(closeSetups);

        const alertsHtml = sortedSetups.map(setup => this.renderProximityAlert(setup)).join('');
        this.container.innerHTML = alertsHtml;

        // Add event listeners
        this.addEventListeners();
    }

    /**
     * Render a single proximity alert
     * @param {Object} setup - Setup object
     * @returns {string} HTML string
     */
    renderProximityAlert(setup) {
        const urgencyClass = this.getUrgencyClass(setup.distance_pips);
        const urgencyIcon = this.getUrgencyIcon(setup.distance_pips);
        const formattedSetup = setupsApi.formatSetupForDisplay(setup);
        const scoreClass = this.getScoreClass(setup.score);

        return `
            <div class="proximity-alert ${urgencyClass}" data-setup-id="${setup.id}" onclick="showSetupDetail('${setup.id}')">
                <div class="alert-header">
                    <div class="alert-title">
                        <span class="alert-icon">${urgencyIcon}</span>
                        <span class="alert-setup-id">${setup.id}</span>
                        <span class="setup-type ${setup.type.toLowerCase()}">${setup.type}</span>
                    </div>
                    <div class="alert-distance ${this.getDistanceClass(setup.distance_pips)}">
                        ${formattedSetup.formattedDistance}
                    </div>
                </div>

                <div class="alert-details">
                    <div class="alert-detail-row">
                        <div class="alert-detail">
                            <span class="alert-label">Precio:</span>
                            <span class="alert-value">${formattedSetup.formattedPrice}</span>
                        </div>
                        <div class="alert-detail">
                            <span class="alert-label">Score:</span>
                            <span class="alert-value ${scoreClass}">${formattedSetup.formattedScore}</span>
                        </div>
                    </div>

                    <div class="alert-detail-row">
                        <div class="alert-detail">
                            <span class="alert-label">TF:</span>
                            <span class="alert-value">${setup.timeframe}</span>
                        </div>
                        <div class="alert-detail">
                            <span class="alert-label">Niveles:</span>
                            <span class="alert-value">${setup.levels_count}</span>
                        </div>
                    </div>

                    <div class="alert-detail-row">
                        <div class="alert-detail">
                            <span class="alert-label">Estado:</span>
                            <span class="alert-value">
                                <span class="setup-status status-${setup.status.toLowerCase()}">${setup.status}</span>
                            </span>
                        </div>
                        <div class="alert-detail">
                            <span class="alert-label">Urgencia:</span>
                            <span class="alert-value urgency-${urgencyClass}">${this.getUrgencyText(setup.distance_pips)}</span>
                        </div>
                    </div>
                </div>

                ${this.renderAlertLevels(setup.levels)}
                ${this.renderAlertActions(setup)}
            </div>
        `;
    }

    /**
     * Render alert levels
     * @param {Array} levels - Array of level strings
     * @returns {string} HTML string
     */
    renderAlertLevels(levels) {
        if (!levels || levels.length === 0) return '';

        const levelsHtml = levels.slice(0, 3).map(level => `
            <span class="alert-level-tag">${level}</span>
        `).join('');

        const moreText = levels.length > 3 ? `<span class="more-levels">+${levels.length - 3} más</span>` : '';

        return `
            <div class="alert-levels">
                <div class="alert-label">Niveles principales:</div>
                <div class="alert-levels-list">
                    ${levelsHtml}
                    ${moreText}
                </div>
            </div>
        `;
    }

    /**
     * Render alert actions
     * @param {Object} setup - Setup object
     * @returns {string} HTML string
     */
    renderAlertActions(setup) {
        return `
            <div class="alert-actions">
                <button class="alert-action-btn primary" onclick="event.stopPropagation(); showSetupDetail('${setup.id}')">
                    📋 Ver Detalle
                </button>
                <button class="alert-action-btn secondary" onclick="event.stopPropagation(); markAsWatched('${setup.id}')">
                    👁️ Marcar Visto
                </button>
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
                <div class="empty-icon">✅</div>
                <h3>No hay alertas de proximidad</h3>
                <p>No hay setups dentro de ${this.threshold} pips del precio actual.</p>
                <div class="empty-actions">
                    <button class="refresh-button" onclick="loadSetupsData(true)">
                        🔄 Actualizar
                    </button>
                    <p class="threshold-info">
                        Umbral actual: <strong>${this.threshold} pips</strong>
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Get setups within current threshold
     * @returns {Array} Close setups
     */
    getCloseSetups() {
        return this.setups.filter(setup => setup.distance_pips <= this.threshold);
    }

    /**
     * Get urgency class based on distance
     * @param {number} distance - Distance in pips
     * @returns {string} CSS class
     */
    getUrgencyClass(distance) {
        if (distance <= 5) return 'urgent-critical';
        if (distance <= 10) return 'urgent-high';
        if (distance <= 20) return 'urgent-medium';
        return 'urgent-low';
    }

    /**
     * Get urgency icon based on distance
     * @param {number} distance - Distance in pips
     * @returns {string} Icon
     */
    getUrgencyIcon(distance) {
        if (distance <= 5) return '🚨';
        if (distance <= 10) return '⚠️';
        if (distance <= 20) return '🔔';
        return 'ℹ️';
    }

    /**
     * Get urgency text based on distance
     * @param {number} distance - Distance in pips
     * @returns {string} Urgency text
     */
    getUrgencyText(distance) {
        if (distance <= 5) return 'CRÍTICA';
        if (distance <= 10) return 'ALTA';
        if (distance <= 20) return 'MEDIA';
        return 'BAJA';
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
        return getScoreClass(score);
    }

    /**
     * Add event listeners
     */
    addEventListeners() {
        // Mark as watched functionality
        window.markAsWatched = (setupId) => {
            this.markSetupAsWatched(setupId);
        };
    }

    /**
     * Mark setup as watched (visual feedback)
     * @param {string} setupId - Setup ID
     */
    markSetupAsWatched(setupId) {
        const alertElement = document.querySelector(`[data-setup-id="${setupId}"]`);
        if (alertElement) {
            alertElement.classList.add('watched');

            // Show temporary feedback
            const feedback = document.createElement('div');
            feedback.className = 'watched-feedback';
            feedback.textContent = '✓ Marcado como visto';
            alertElement.appendChild(feedback);

            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 2000);
        }
    }

    /**
     * Check for new alerts and notify if needed
     * @param {Array} currentCloseSetups - Current close setups
     */
    checkForNewAlerts(currentCloseSetups) {
        const currentCount = currentCloseSetups.length;
        const criticalCount = currentCloseSetups.filter(s => s.distance_pips <= 5).length;

        // Check for new critical alerts
        if (criticalCount > 0 && this.lastAlertCount !== currentCount) {
            this.showNotification(
                `🚨 ${criticalCount} setup(s) muy cerca del precio (≤5 pips)`,
                'critical'
            );
        }

        this.lastAlertCount = currentCount;
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        // Use the main controller's notification system if available
        if (window.setupsController && window.setupsController.showNotification) {
            window.setupsController.showNotification(message, type);
        } else {

        }
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
     * Get proximity statistics
     * @returns {Object} Proximity statistics
     */
    getProximityStatistics() {
        const closeSetups = this.getCloseSetups();
        const criticalSetups = closeSetups.filter(s => s.distance_pips <= 5);
        const highUrgencySetups = closeSetups.filter(s => s.distance_pips <= 10);

        return {
            total: closeSetups.length,
            critical: criticalSetups.length,
            highUrgency: highUrgencySetups.length,
            threshold: this.threshold,
            averageDistance: closeSetups.length > 0 ?
                closeSetups.reduce((sum, setup) => sum + setup.distance_pips, 0) / closeSetups.length : 0,
            closestSetup: closeSetups.length > 0 ?
                closeSetups.reduce((closest, current) =>
                    current.distance_pips < closest.distance_pips ? current : closest
                ) : null
        };
    }

    /**
     * Export proximity alerts as JSON
     * @returns {string} JSON string
     */
    exportProximityAlerts() {
        return JSON.stringify({
            alerts: this.getCloseSetups(),
            threshold: this.threshold,
            statistics: this.getProximityStatistics(),
            timestamp: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            setups: this.setups,
            threshold: this.threshold,
            closeSetups: this.getCloseSetups(),
            statistics: this.getProximityStatistics(),
            lastAlertCount: this.lastAlertCount
        };
    }
}