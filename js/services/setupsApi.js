/**
 * Setups API Service
 * Module 7: Integration Gateway API Consumer
 * Handles all setups-related API calls with JWT authentication
 */

import { apiClient } from '../shared/api.js';
import { getScoreLabelEN } from '../shared/constants.js';

export class SetupsApiService {
    constructor() {
        this.baseEndpoint = '/security-filter/setups';
        this.healthEndpoint = '/security-filter/setups/health';
    }

    /**
     * Get complete active setups with confluences and statistics
     * Main dashboard endpoint with comprehensive data
     * @returns {Promise<Object>} Complete setups data
     */
    async getActiveSetups() {
        try {

            const data = await apiClient.get(`${this.baseEndpoint}/active`);

            return data;
        } catch (error) {
            console.error('Error fetching active setups:', error);
            throw new Error(`Failed to load active setups: ${error.message}`);
        }
    }

    /**
     * Get condensed summary for widgets/small cards
     * Fast endpoint for frequent updates
     * @returns {Promise<Object>} Summary data
     */
    async getSetupsSummary() {
        try {

            const data = await apiClient.get(`${this.baseEndpoint}/summary`);

            return data;
        } catch (error) {
            console.error('Error fetching setups summary:', error);
            throw new Error(`Failed to load setups summary: ${error.message}`);
        }
    }

    /**
     * Get detailed information for a specific setup
     * @param {string} setupId - Setup ID (e.g., "C1", "S2")
     * @returns {Promise<Object>} Setup detail with analysis
     */
    async getSetupDetail(setupId) {
        try {

            const data = await apiClient.get(`${this.baseEndpoint}/${setupId}`);

            return data;
        } catch (error) {
            console.error(`Error fetching setup ${setupId}:`, error);
            throw new Error(`Failed to load setup ${setupId}: ${error.message}`);
        }
    }

    /**
     * Get confluence zones information
     * @returns {Promise<Object>} Confluence zones data
     */
    async getConfluences() {
        try {

            const data = await apiClient.get(`${this.baseEndpoint}/confluences`);

            return data;
        } catch (error) {
            console.error('Error fetching confluences:', error);
            throw new Error(`Failed to load confluences: ${error.message}`);
        }
    }

    /**
     * Get system statistics and performance metrics
     * @returns {Promise<Object>} Statistics data
     */
    async getStatistics() {
        try {

            const data = await apiClient.get(`${this.baseEndpoint}/statistics`);

            return data;
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw new Error(`Failed to load statistics: ${error.message}`);
        }
    }

    /**
     * Force system refresh/update
     * @param {boolean} force - Force refresh even if recent update
     * @returns {Promise<Object>} Refresh result
     */
    async refreshSetups(force = false) {
        try {

            const queryParams = force ? '?force=true' : '';
            const data = await apiClient.post(`${this.baseEndpoint}/refresh${queryParams}`);

            return data;
        } catch (error) {
            console.error('Error refreshing setups:', error);
            throw new Error(`Failed to refresh setups: ${error.message}`);
        }
    }

    /**
     * Get system health status
     * @returns {Promise<Object>} Health status
     */
    async getStatus() {
        try {

            const data = await apiClient.get(`${this.baseEndpoint}/status`);

            return data;
        } catch (error) {
            console.error('Error fetching system status:', error);
            throw new Error(`Failed to get system status: ${error.message}`);
        }
    }

    /**
     * Get setups filtered by type
     * @param {string} setupType - "SIMPLE" or "COMPLEX"
     * @returns {Promise<Object>} Filtered setups
     */
    async getSetupsByType(setupType) {
        try {

            const data = await apiClient.get(`${this.baseEndpoint}/by-type/${setupType}`);

            return data;
        } catch (error) {
            console.error(`Error fetching ${setupType} setups:`, error);
            throw new Error(`Failed to load ${setupType} setups: ${error.message}`);
        }
    }

    /**
     * Get setups ordered by proximity to current price
     * @param {number} maxDistancePips - Maximum distance in pips (1.0 - 1000.0)
     * @returns {Promise<Object>} Setups by proximity
     */
    async getSetupsByProximity(maxDistancePips = 50.0) {
        try {

            const queryParams = `?max_distance_pips=${maxDistancePips}`;
            const data = await apiClient.get(`${this.baseEndpoint}/by-proximity${queryParams}`);

            return data;
        } catch (error) {
            console.error('Error fetching proximity setups:', error);
            throw new Error(`Failed to load proximity setups: ${error.message}`);
        }
    }

    /**
     * Get general system health
     * @returns {Promise<Object>} General health status
     */
    async getHealth() {
        try {

            const data = await apiClient.get(this.healthEndpoint);

            return data;
        } catch (error) {
            console.error('Error fetching general health:', error);
            throw new Error(`Failed to get general health: ${error.message}`);
        }
    }

    /**
     * Utility method to check if setup is close to current price
     * @param {Object} setup - Setup object
     * @param {number} threshold - Distance threshold in pips
     * @returns {boolean} Is setup close
     */
    isSetupClose(setup, threshold = 20.0) {
        return setup.distance_pips <= threshold;
    }

    /**
     * Utility method to get setup quality level based on score
     * @param {number} score - Setup score (0-10)
     * @returns {string} Quality level
     */
    getSetupQuality(score) {
        return getScoreLabelEN(score);
    }

    /**
     * Utility method to format setup for display
     * @param {Object} setup - Raw setup object
     * @returns {Object} Formatted setup
     */
    formatSetupForDisplay(setup) {
        return {
            ...setup,
            qualityLevel: this.getSetupQuality(setup.score),
            isClose: this.isSetupClose(setup),
            formattedPrice: setup.price.toFixed(2),
            formattedDistance: `${setup.distance_pips.toFixed(1)} pips`,
            formattedScore: setup.score.toFixed(1)
        };
    }

    /**
     * Utility method to group setups by type
     * @param {Array} setups - Array of setups
     * @returns {Object} Grouped setups
     */
    groupSetupsByType(setups) {
        return setups.reduce((groups, setup) => {
            const type = setup.type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(setup);
            return groups;
        }, {});
    }

    /**
     * Utility method to sort setups by proximity
     * @param {Array} setups - Array of setups
     * @returns {Array} Sorted setups
     */
    sortSetupsByProximity(setups) {
        return [...setups].sort((a, b) => a.distance_pips - b.distance_pips);
    }

    /**
     * Utility method to sort setups by score
     * @param {Array} setups - Array of setups
     * @returns {Array} Sorted setups
     */
    sortSetupsByScore(setups) {
        return [...setups].sort((a, b) => b.score - a.score);
    }
}

// Create singleton instance
export const setupsApi = new SetupsApiService();

// Export for global access
window.setupsApi = setupsApi;