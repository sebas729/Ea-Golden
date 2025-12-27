/**
 * Auto Refresh Manager
 * Handles automatic data refresh and polling functionality
 */

export class AutoRefreshManager {
    constructor() {
        this.isActive = false;
        this.interval = null;
        this.refreshCallback = null;
        this.refreshIntervalMs = 30000; // 30 seconds default
        this.lastRefreshTime = null;
        this.errorCount = 0;
        this.maxErrors = 3;
        this.backoffMultiplier = 1;
        this.statusElement = null;
    }

    /**
     * Initialize the auto refresh manager
     */
    async init() {
        this.statusElement = document.getElementById('autoRefreshStatus');

    }

    /**
     * Start auto refresh
     * @param {Function} callback - Function to call for refresh
     * @param {number} intervalMs - Refresh interval in milliseconds
     */
    start(callback, intervalMs = this.refreshIntervalMs) {
        if (this.isActive) {

            return;
        }

        this.refreshCallback = callback;
        this.refreshIntervalMs = intervalMs;
        this.isActive = true;
        this.errorCount = 0;
        this.backoffMultiplier = 1;

        this.scheduleNextRefresh();
        this.updateStatus('Activo');


    }

    /**
     * Stop auto refresh
     */
    stop() {
        if (this.interval) {
            clearTimeout(this.interval);
            this.interval = null;
        }

        this.isActive = false;
        this.updateStatus('Inactivo');


    }

    /**
     * Pause auto refresh temporarily
     */
    pause() {
        if (this.interval) {
            clearTimeout(this.interval);
            this.interval = null;
        }

        this.updateStatus('Pausado');

    }

    /**
     * Resume auto refresh from pause
     */
    resume() {
        if (this.isActive && !this.interval) {
            this.scheduleNextRefresh();
            this.updateStatus('Activo');

        }
    }

    /**
     * Schedule next refresh
     */
    scheduleNextRefresh() {
        if (!this.isActive || !this.refreshCallback) return;

        const effectiveInterval = this.refreshIntervalMs * this.backoffMultiplier;

        this.interval = setTimeout(async () => {
            await this.performRefresh();
        }, effectiveInterval);
    }

    /**
     * Perform refresh operation
     */
    async performRefresh() {
        if (!this.isActive || !this.refreshCallback) return;

        try {

            this.updateStatus('Actualizando...');

            await this.refreshCallback();

            // Reset error count on successful refresh
            this.errorCount = 0;
            this.backoffMultiplier = 1;
            this.lastRefreshTime = new Date();

            this.updateStatus('Activo');


            // Schedule next refresh
            this.scheduleNextRefresh();

        } catch (error) {
            console.error('Auto refresh error:', error);
            this.handleRefreshError(error);
        }
    }

    /**
     * Handle refresh errors with exponential backoff
     * @param {Error} error - The error that occurred
     */
    handleRefreshError(error) {
        this.errorCount++;

        if (this.errorCount >= this.maxErrors) {
            console.error(`Auto refresh failed ${this.maxErrors} times, stopping auto refresh`);
            this.stop();
            this.updateStatus('Error - Detenido');
            this.showErrorNotification('Auto-refresh detenido debido a errores repetidos');
            return;
        }

        // Exponential backoff
        this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, 8); // Max 8x delay

        const nextRefreshSeconds = (this.refreshIntervalMs * this.backoffMultiplier) / 1000;
        this.updateStatus(`Error - Reintentar en ${Math.round(nextRefreshSeconds)}s`);

        console.warn(`Auto refresh error ${this.errorCount}/${this.maxErrors}, retrying with ${this.backoffMultiplier}x delay`);

        // Schedule next refresh with backoff
        this.scheduleNextRefresh();
    }

    /**
     * Update refresh interval
     * @param {number} newIntervalMs - New interval in milliseconds
     */
    updateInterval(newIntervalMs) {
        this.refreshIntervalMs = newIntervalMs;

        if (this.isActive) {
            // Restart with new interval
            this.stop();
            this.start(this.refreshCallback, newIntervalMs);
        }


    }

    /**
     * Force immediate refresh
     */
    async forceRefresh() {
        if (!this.refreshCallback) {
            console.warn('No refresh callback available');
            return;
        }

        try {

            this.updateStatus('Actualización manual...');

            // Clear current timeout
            if (this.interval) {
                clearTimeout(this.interval);
                this.interval = null;
            }

            // Perform refresh
            await this.refreshCallback();

            this.lastRefreshTime = new Date();
            this.errorCount = 0;
            this.backoffMultiplier = 1;

            // Resume normal schedule if auto refresh is active
            if (this.isActive) {
                this.scheduleNextRefresh();
                this.updateStatus('Activo');
            } else {
                this.updateStatus('Manual');
            }



        } catch (error) {
            console.error('Force refresh error:', error);
            this.updateStatus('Error manual');
            throw error; // Re-throw for caller to handle
        }
    }

    /**
     * Update status display
     * @param {string} status - Status text
     */
    updateStatus(status) {
        if (this.statusElement) {
            this.statusElement.textContent = status;

            // Add appropriate styling based on status
            this.statusElement.className = 'auto-refresh-status';

            if (status.includes('Error')) {
                this.statusElement.classList.add('status-error');
            } else if (status.includes('Pausado') || status.includes('Inactivo')) {
                this.statusElement.classList.add('status-paused');
            } else if (status.includes('Actualizando')) {
                this.statusElement.classList.add('status-updating');
            } else {
                this.statusElement.classList.add('status-active');
            }
        }
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     */
    showErrorNotification(message) {
        // Use the main controller's notification system if available
        if (window.setupsController && window.setupsController.showNotification) {
            window.setupsController.showNotification(message, 'error');
        } else {
            console.error(`Auto refresh error: ${message}`);
        }
    }

    /**
     * Get time until next refresh
     * @returns {number} Seconds until next refresh
     */
    getTimeUntilNextRefresh() {
        if (!this.isActive || !this.interval) return 0;

        // This is approximate since we don't track the exact setTimeout start time
        return Math.round(this.refreshIntervalMs * this.backoffMultiplier / 1000);
    }

    /**
     * Get time since last refresh
     * @returns {string} Formatted time since last refresh
     */
    getTimeSinceLastRefresh() {
        if (!this.lastRefreshTime) return 'Nunca';

        const now = new Date();
        const diffMs = now - this.lastRefreshTime;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);

        if (diffMinutes > 0) {
            return `${diffMinutes}m ${diffSeconds % 60}s`;
        } else {
            return `${diffSeconds}s`;
        }
    }

    /**
     * Check if refresh is overdue
     * @returns {boolean} Is refresh overdue
     */
    isRefreshOverdue() {
        if (!this.lastRefreshTime) return true;

        const now = new Date();
        const diffMs = now - this.lastRefreshTime;
        const overdueThreshold = this.refreshIntervalMs * 2; // 2x normal interval

        return diffMs > overdueThreshold;
    }

    /**
     * Get refresh statistics
     * @returns {Object} Refresh statistics
     */
    getStatistics() {
        return {
            isActive: this.isActive,
            interval: this.refreshIntervalMs,
            lastRefresh: this.lastRefreshTime,
            timeSinceLastRefresh: this.getTimeSinceLastRefresh(),
            timeUntilNextRefresh: this.getTimeUntilNextRefresh(),
            errorCount: this.errorCount,
            backoffMultiplier: this.backoffMultiplier,
            isOverdue: this.isRefreshOverdue()
        };
    }

    /**
     * Set visibility change handler to pause/resume on tab visibility
     */
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {

                this.pause();
            } else {

                this.resume();
            }
        });
    }

    /**
     * Set network status handlers
     */
    setupNetworkHandling() {
        window.addEventListener('online', () => {

            if (this.isActive && !this.interval) {
                this.resume();
            }
        });

        window.addEventListener('offline', () => {

            this.pause();
        });
    }

    /**
     * Enable smart refresh features
     */
    enableSmartFeatures() {
        this.setupVisibilityHandling();
        this.setupNetworkHandling();

    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            isActive: this.isActive,
            refreshInterval: this.refreshIntervalMs,
            lastRefreshTime: this.lastRefreshTime,
            errorCount: this.errorCount,
            backoffMultiplier: this.backoffMultiplier,
            statistics: this.getStatistics()
        };
    }

    /**
     * Reset error state
     */
    resetErrors() {
        this.errorCount = 0;
        this.backoffMultiplier = 1;

    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stop();
        this.refreshCallback = null;

    }
}