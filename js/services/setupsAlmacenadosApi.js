/**
 * Setups Almacenados API Service
 * Handles all API communication for stored setups (historical record)
 */

import { apiClient } from '../shared/api.js';

export class SetupsAlmacenadosApiService {
    constructor() {
        this.baseEndpoint = '/security-filter/stored-setups';
    }

    /**
     * Get paginated stored setups with filters
     * @param {number} page - Page number (1-indexed)
     * @param {number} pageSize - Items per page (default 50, max 200)
     * @param {Object} filters - Filter options
     * @param {string} filters.timeframe - M5, M15, M30, H1, H1_I
     * @param {string} filters.type - SIMPLE, COMPLEX
     * @param {number} filters.min_score - Minimum score (0-10)
     * @returns {Promise<Object>} Paginated response with setups
     */
    async getStoredSetups(page = 1, pageSize = 50, filters = {}) {
        try {
            console.log('Fetching stored setups...', { page, pageSize, filters });

            const queryParams = new URLSearchParams({
                page: page,
                page_size: pageSize,
                ...filters
            });

            const data = await apiClient.get(
                `${this.baseEndpoint}?${queryParams.toString()}`
            );

            console.log('Stored setups loaded successfully:', data);
            return data;
        } catch (error) {
            console.error('Error fetching stored setups:', error);
            throw new Error(`Failed to load stored setups: ${error.message}`);
        }
    }

    /**
     * Get executive summary of stored setups
     * @returns {Promise<Object>} Summary statistics
     */
    async getSummary() {
        try {
            console.log('Fetching stored setups summary...');

            const data = await apiClient.get(`${this.baseEndpoint}/summary`);

            console.log('Stored setups summary loaded:', data);
            return data;
        } catch (error) {
            console.error('Error fetching summary:', error);
            throw new Error(`Failed to load summary: ${error.message}`);
        }
    }

    /**
     * Get detailed statistics (PostgreSQL + Redis)
     * @returns {Promise<Object>} Detailed statistics
     */
    async getStatistics() {
        try {
            console.log('Fetching stored setups statistics...');

            const data = await apiClient.get(`${this.baseEndpoint}/statistics`);

            console.log('Stored setups statistics loaded:', data);
            return data;
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw new Error(`Failed to load statistics: ${error.message}`);
        }
    }

    /**
     * Get stored setups by timeframe
     * @param {string} timeframe - M5, M15, M30, H1, H1_I
     * @param {number} page - Page number
     * @param {number} pageSize - Items per page
     * @returns {Promise<Object>} Paginated setups for timeframe
     */
    async getByTimeframe(timeframe, page = 1, pageSize = 50) {
        try {
            console.log(`Fetching stored setups for timeframe ${timeframe}...`);

            const queryParams = new URLSearchParams({ page, page_size: pageSize });

            const data = await apiClient.get(
                `${this.baseEndpoint}/by-timeframe/${timeframe}?${queryParams.toString()}`
            );

            console.log(`Stored setups for ${timeframe} loaded:`, data);
            return data;
        } catch (error) {
            console.error(`Error fetching setups for timeframe ${timeframe}:`, error);
            throw new Error(`Failed to load setups for timeframe: ${error.message}`);
        }
    }

    /**
     * Get stored setups by type
     * @param {string} type - SIMPLE, COMPLEX
     * @param {number} page - Page number
     * @param {number} pageSize - Items per page
     * @returns {Promise<Object>} Paginated setups for type
     */
    async getByType(type, page = 1, pageSize = 50) {
        try {
            console.log(`Fetching stored setups for type ${type}...`);

            const queryParams = new URLSearchParams({ page, page_size: pageSize });

            const data = await apiClient.get(
                `${this.baseEndpoint}/by-type/${type}?${queryParams.toString()}`
            );

            console.log(`Stored setups for type ${type} loaded:`, data);
            return data;
        } catch (error) {
            console.error(`Error fetching setups for type ${type}:`, error);
            throw new Error(`Failed to load setups for type: ${error.message}`);
        }
    }

    /**
     * Get count statistics by timeframe
     * @param {string} timeframe - M5, M15, M30, H1, H1_I
     * @returns {Promise<Object>} Count statistics
     */
    async getCountByTimeframe(timeframe) {
        try {
            console.log(`Fetching count for timeframe ${timeframe}...`);

            const data = await apiClient.get(`${this.baseEndpoint}/count/${timeframe}`);

            console.log(`Count for ${timeframe} loaded:`, data);
            return data;
        } catch (error) {
            console.error(`Error fetching count for timeframe ${timeframe}:`, error);
            throw new Error(`Failed to load count: ${error.message}`);
        }
    }

    /**
     * Invalidate cache (admin operation)
     * @returns {Promise<Object>} Success response
     */
    async invalidateCache() {
        try {
            console.log('Invalidating stored setups cache...');

            const data = await apiClient.post(`${this.baseEndpoint}/cache/invalidate`, {});

            console.log('Cache invalidated successfully:', data);
            return data;
        } catch (error) {
            console.error('Error invalidating cache:', error);
            throw new Error(`Failed to invalidate cache: ${error.message}`);
        }
    }

    /**
     * Health check for stored setups module
     * @returns {Promise<Object>} Health status
     */
    async getHealth() {
        try {
            console.log('Checking stored setups health...');

            const data = await apiClient.get(`${this.baseEndpoint}/health`);

            console.log('Health check completed:', data);
            return data;
        } catch (error) {
            console.error('Error checking health:', error);
            throw new Error(`Failed to check health: ${error.message}`);
        }
    }

    /**
     * Format setup for display (reusing logic from setupsApi)
     * @param {Object} setup - Raw setup object
     * @returns {Object} Formatted setup
     */
    formatSetupForDisplay(setup) {
        return {
            formattedPrice: setup.price?.toFixed(2) || 'N/A',
            formattedScore: setup.score?.toFixed(1) || 'N/A',
            formattedDate: this.formatDate(setup.stored_at || setup.origin_timestamp)
        };
    }

    /**
     * Format date for display
     * @param {string} isoString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(isoString) {
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
}

// Create singleton instance
export const setupsAlmacenadosApi = new SetupsAlmacenadosApiService();

// Make globally available for debugging
window.setupsAlmacenadosApi = setupsAlmacenadosApi;
