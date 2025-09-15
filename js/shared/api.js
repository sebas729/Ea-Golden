/**
 * Shared API Functions
 * Common API handling functionality with JWT authentication
 */

export class ApiClient {
    constructor() {
        this.baseUrl = 'http://localhost:8009/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        this.timeout = 60000; // 60 seconds (1 minute)

        // Import auth service dynamically to avoid circular dependencies
        this.authService = null;
        this.initAuthService();
    }

    /**
     * Initialize auth service reference
     */
    async initAuthService() {
        try {
            // Dynamic import to avoid circular dependency
            const authModule = await import('../auth/authService.js');
            this.authService = authModule.authService;
        } catch (error) {
            console.warn('Auth service not available:', error.message);
        }
    }

    /**
     * Get authentication headers
     * @returns {Object} Headers with authentication if available
     */
    async getAuthHeaders() {
        // Ensure auth service is loaded
        if (!this.authService) {
            await this.initAuthService();
        }

        if (this.authService && this.authService.isAuthenticated()) {
            return this.authService.getAuthHeader();
        }
        return {};
    }

    /**
     * Make HTTP request with timeout and error handling
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Response data
     */
    async request(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            // Merge headers with authentication and CSRF
            const authHeaders = await this.getAuthHeaders();
            const csrfHeaders = this.authService?.getCSRFHeaders?.() || {};
            const headers = {
                ...this.defaultHeaders,
                ...authHeaders,
                ...csrfHeaders,
                ...options.headers
            };


            const response = await fetch(url, {
                headers,
                signal: controller.signal,
                ...options
            });

            clearTimeout(timeoutId);

            // Handle authentication errors
            if (response.status === 401) {
                if (this.authService) {
                    // Try to refresh token before giving up
                    const refreshSuccessful = await this.authService.refreshToken();

                    if (refreshSuccessful) {
                        // Retry the request with new token
                        clearTimeout(timeoutId);
                        return this.request(url, options);
                    } else {
                        this.authService.handleAuthError(response);
                    }
                }
                throw new Error('Authentication failed');
            }

            if (!response.ok) {
                // Try to get error message from response
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    // If response is not JSON, use default error message
                }

                throw new Error(errorMessage);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please try again');
            }

            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Network error - please check your connection');
            }

            throw error;
        }
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response data
     */
    async get(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        return this.request(url, { method: 'GET', ...options });
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response data
     */
    async post(endpoint, data = null, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        return this.request(url, {
            method: 'POST',
            body: data ? JSON.stringify(data) : null,
            ...options
        });
    }

    /**
     * Fetch Fibonacci report data
     * @returns {Promise<Object>} Fibonacci report data
     */
    async getFibonacciReport() {
        try {
            console.log('Fetching Fibonacci report...');
            const data = await this.get('/security-filter/fibonacci-report');
            console.log('Fibonacci report loaded successfully');
            return data;
        } catch (error) {
            console.error('Error fetching Fibonacci report:', error);
            throw new Error(`Failed to load Fibonacci report: ${error.message}`);
        }
    }

    /**
     * Fetch economic calendar data
     * @returns {Promise<Object>} Economic calendar data
     */
    async getEconomicCalendar() {
        try {
            console.log('Fetching economic calendar...');
            const data = await this.get('/security-filter/economic-calendar');
            console.log('Economic calendar loaded successfully');
            return data;
        } catch (error) {
            console.error('Error fetching economic calendar:', error);
            throw new Error(`Failed to load economic calendar: ${error.message}`);
        }
    }

    /**
     * Process OB report data
     * @param {Object} reportData - Report data to process
     * @returns {Promise<Object>} Processed OB data
     */
    async processObReport(reportData) {
        try {
            console.log('Processing OB report...');

            // Use the same logic as the original
            let payload;
            if (reportData.fibonacci_strategy_report) {
                // If already has the complete structure, use as is
                payload = reportData;
            } else {
                // If we only have internal data, wrap in expected structure
                payload = {
                    fibonacci_strategy_report: reportData
                };
            }

            console.log('Data sent to endpoint:', payload);

            const data = await this.post('/security-filter/process-ob-report', payload);
            console.log('OB report processed successfully');
            return data;
        } catch (error) {
            console.error('Error processing OB report:', error);
            throw new Error(`Failed to process OB report: ${error.message}`);
        }
    }

    /**
     * Login user with credentials
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} Login response
     */
    async login(username, password) {
        try {
            console.log('Attempting login...');
            const data = await this.post('/login', {
                username: username.trim(),
                password: password
            });
            console.log('Login API call successful');
            return data;
        } catch (error) {
            console.error('Login API error:', error);
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    /**
     * Validate JWT token
     * @returns {Promise<Object>} Validation response
     */
    async validateToken() {
        try {
            console.log('Validating token...');
            const data = await this.get('/validate-token');
            console.log('Token validation successful');
            return data;
        } catch (error) {
            console.error('Token validation error:', error);
            throw new Error(`Token validation failed: ${error.message}`);
        }
    }

    /**
     * Check API health
     * @returns {Promise<boolean>} API health status
     */
    async checkHealth() {
        try {
            await this.get('/health');
            return true;
        } catch (error) {
            console.warn('API health check failed:', error);
            return false;
        }
    }

    /**
     * Retry mechanism for failed requests
     * @param {Function} requestFn - Request function to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} delay - Delay between retries in ms
     * @returns {Promise<*>} Request result
     */
    async withRetry(requestFn, maxRetries = 3, delay = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                console.warn(`Request attempt ${attempt} failed:`, error.message);

                if (attempt < maxRetries) {
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                }
            }
        }

        throw lastError;
    }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for global access
window.apiClient = apiClient;