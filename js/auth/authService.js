/**
 * Authentication Service
 * Handles JWT token management and user authentication
 */

import { config } from '../config.js';

export class AuthService {
    constructor() {
        this.baseUrl = config.API_BASE_URL;
        this.tokenKey = 'ea_golden_token';
        this.userKey = 'ea_golden_user';
        this.csrfTokenKey = 'ea_golden_csrf';
        this.loginUrl = '/login';
        this.currentUser = null;
        this.csrfToken = null;
        this.refreshTimer = null;

        // Initialize from storage
        this.loadFromStorage();

        // Initialize CSRF token
        this.initializeCSRF();

        // Start auto-refresh if user is authenticated
        if (this.isAuthenticated()) {
            this.startAutoRefresh();
        }
    }

    /**
     * Load authentication data from localStorage
     */
    loadFromStorage() {
        try {
            const token = localStorage.getItem(this.tokenKey);
            const userData = localStorage.getItem(this.userKey);
            const csrfToken = localStorage.getItem(this.csrfTokenKey);

            if (token && userData) {
                this.currentUser = JSON.parse(userData);
                this.csrfToken = csrfToken;

                // Verify token is still valid (basic check)
                if (this.isTokenExpired(token)) {
                    this.logout();
                }
            }
        } catch (error) {
            console.warn('Error loading auth data from storage:', error);
            this.logout();
        }
    }

    /**
     * Initialize CSRF token from server
     */
    async initializeCSRF() {
        if (!this.csrfToken) {
            await this.fetchCSRFToken();
        }
    }

    /**
     * Fetch CSRF token from server
     * @returns {Promise<string|null>} CSRF token or null
     */
    async fetchCSRFToken() {
        try {


            const response = await fetch(`${this.baseUrl}/csrf-token`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.csrfToken = data.csrf_token || data.token;

                if (this.csrfToken) {
                    localStorage.setItem(this.csrfTokenKey, this.csrfToken);

                    return this.csrfToken;
                }
            }

            console.warn('Failed to fetch CSRF token');
            return null;
        } catch (error) {
            // Handle CORS errors gracefully - CSRF may not be required
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                console.warn('CORS error fetching CSRF token - proceeding without CSRF token');
            } else {
                console.warn('Error fetching CSRF token:', error);
            }
            return null;
        }
    }

    /**
     * Get CSRF headers for requests
     * @returns {Object} CSRF headers or empty object
     */
    getCSRFHeaders() {
        if (this.csrfToken) {
            return {
                'X-CSRF-Token': this.csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            };
        }
        return {};
    }

    /**
     * Check if token is expired (basic JWT parsing)
     * @param {string} token - JWT token
     * @returns {boolean} True if expired
     */
    isTokenExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;
            return payload.exp < now;
        } catch (error) {
            console.warn('Error parsing token:', error);
            return true; // Assume expired if can't parse
        }
    }

    /**
     * Login user with credentials
     * @param {string} username - Username
     * @param {string} password - Password
     * @param {boolean} rememberMe - Whether to persist session
     * @returns {Promise<Object>} Login result
     */
    async login(username, password, rememberMe = false) {
        try {
            const response = await fetch(`${this.baseUrl}${this.loginUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Debug: Log response structure


            // Validate response structure - token is in data.access_token
            const token = data.data?.access_token || data.token || data.access_token;
            if (!token) {
                console.error('Expected token not found in response:', data);
                throw new Error('Token no recibido del servidor');
            }

            // Store authentication data
            this.storeAuthData(token, data.data?.user || data.user || { username }, rememberMe, data.data?.refresh_token || data.refresh_token);



            // Start auto-refresh timer for new session
            this.startAutoRefresh();

            return {
                success: true,
                user: this.currentUser,
                message: data.message || 'Login exitoso'
            };

        } catch (error) {
            console.error('Login error:', error);

            // Provide user-friendly error messages
            let userMessage = 'Error de conexión';

            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                userMessage = 'Credenciales incorrectas';
            } else if (error.message.includes('429')) {
                userMessage = 'Demasiados intentos. Intenta más tarde';
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                userMessage = 'Error de conexión al servidor';
            } else if (error.message.includes('timeout')) {
                userMessage = 'Tiempo de espera agotado';
            } else if (error.message) {
                userMessage = error.message;
            }

            return {
                success: false,
                message: userMessage
            };
        }
    }

    /**
     * Store authentication data
     * @param {string} token - JWT access token
     * @param {Object} user - User data
     * @param {boolean} rememberMe - Whether to persist session
     * @param {string} refreshToken - JWT refresh token (optional)
     */
    storeAuthData(token, user, rememberMe, refreshToken = null) {
        this.currentUser = {
            username: user.username,
            full_name: user.full_name || user.username,
            email: user.email || '',
            role: user.role || 'user',
            is_admin: user.is_admin || false,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe
        };

        // Store tokens
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));

        // Store refresh token if provided
        if (refreshToken) {
            localStorage.setItem('ea_golden_refresh_token', refreshToken);
        }
    }

    /**
     * Logout user and clear stored data
     * @param {boolean} callBackend - Whether to notify backend of logout
     */
    async logout(callBackend = true) {
        const token = this.getToken();

        // Notify backend if requested and token is available
        if (callBackend && token) {
            try {
                await fetch(`${this.baseUrl}/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        token: token
                    })
                });

            } catch (error) {
                console.warn('Failed to notify backend of logout:', error);
                // Continue with local logout even if backend notification fails
            }
        }

        // Clear local data
        this.currentUser = null;
        this.csrfToken = null;
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem('ea_golden_refresh_token');
        localStorage.removeItem(this.csrfTokenKey);

        // Stop auto-refresh timer
        this.stopAutoRefresh();



        // Redirect to login if not already there
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    /**
     * Check if user is authenticated (local check only)
     * @param {boolean} skipServerValidation - Skip server validation for quick checks
     * @returns {boolean} True if authenticated locally
     */
    isAuthenticated(skipServerValidation = true) {
        const token = localStorage.getItem(this.tokenKey);

        if (!token || !this.currentUser) {
            return false;
        }

        // Quick local token expiration check
        if (this.isTokenExpired(token)) {
            if (!skipServerValidation) {
                // Try refresh before giving up
                this.refreshToken().catch(() => this.logout());
            } else {
                this.logout();
            }
            return false;
        }

        return true;
    }

    /**
     * Check if user is authenticated with server validation
     * @returns {Promise<boolean>} True if authenticated on server
     */
    async isAuthenticatedWithValidation() {
        // First check local authentication
        if (!this.isAuthenticated()) {
            return false;
        }

        // Then validate with server
        const validationResult = await this.validateToken();
        return !!validationResult;
    }

    /**
     * Get current user data
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get stored JWT token
     * @returns {string|null} JWT token or null
     */
    getToken() {
        if (this.isAuthenticated()) {
            return localStorage.getItem(this.tokenKey);
        }
        return null;
    }

    /**
     * Get authorization header for API requests
     * @returns {Object} Authorization header or empty object
     */
    getAuthHeader() {
        const token = this.getToken();
        if (token) {
            return {
                'Authorization': `Bearer ${token}`
            };
        }
        return {};
    }

    /**
     * Refresh access token using stored refresh token
     * @returns {Promise<boolean>} True if refresh successful
     */
    async refreshToken() {
        const refreshToken = localStorage.getItem('ea_golden_refresh_token');

        if (!refreshToken) {
            console.warn('No refresh token available');
            return false;
        }

        try {


            const response = await fetch(`${this.baseUrl}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: refreshToken
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle nested response structure like login
            const newAccessToken = data.data?.access_token || data.token || data.access_token;
            if (newAccessToken) {
                localStorage.setItem(this.tokenKey, newAccessToken);

                // Update refresh token if provided
                const newRefreshToken = data.data?.refresh_token || data.refresh_token;
                if (newRefreshToken) {
                    localStorage.setItem('ea_golden_refresh_token', newRefreshToken);
                }

                // Update user data if provided
                if (data.data?.user || data.user) {
                    const userData = data.data?.user || data.user;
                    this.currentUser = {
                        ...this.currentUser,
                        ...userData
                    };
                    localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
                }


                return true;
            }

            throw new Error('No access token in refresh response');

        } catch (error) {
            console.error('Token refresh failed:', error);

            // Handle different error scenarios
            if (error.message.includes('401') || error.message.includes('403')) {
                console.warn('Refresh token invalid or expired, logging out');
                this.logout(false); // Don't call backend since refresh failed
            } else if (error.message.includes('Failed to fetch')) {
                console.warn('Network error during refresh, keeping current session');
                return false; // Don't logout on network errors
            } else {
                // Other errors might indicate token issues
                this.logout(false);
            }

            return false;
        }
    }

    /**
     * Auto-refresh token if it's close to expiration
     * @param {number} bufferMinutes - Minutes before expiration to trigger refresh
     * @returns {Promise<boolean>} True if refresh was attempted and successful
     */
    async autoRefreshToken(bufferMinutes = 5) {
        const token = this.getToken();
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;
            const expirationBuffer = bufferMinutes * 60; // Convert to seconds
            const timeToExpiry = payload.exp - now;

            // If token expires within buffer time, refresh it
            if (timeToExpiry <= expirationBuffer && timeToExpiry > 0) {

                return await this.refreshToken();
            }

            return true; // Token is still valid
        } catch (error) {
            console.warn('Error checking token expiration:', error);
            return false;
        }
    }

    /**
     * Start automatic token refresh timer
     * @param {number} intervalMinutes - Check interval in minutes
     */
    startAutoRefresh(intervalMinutes = 10) {
        // Clear existing timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        // Only start if authenticated
        if (!this.isAuthenticated()) {
            return;
        }

        this.refreshTimer = setInterval(async () => {
            if (this.isAuthenticated()) {
                await this.autoRefreshToken();
            } else {
                // Stop timer if no longer authenticated
                this.stopAutoRefresh();
            }
        }, intervalMinutes * 60 * 1000); // Convert to milliseconds


    }

    /**
     * Stop automatic token refresh timer
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;

        }
    }

    /**
     * Validate token with server using new /validate-token endpoint
     * @returns {Promise<Object|boolean>} Validation result or false if invalid
     */
    async validateToken() {
        const token = this.getToken();
        if (!token) return false;

        try {


            const response = await fetch(`${this.baseUrl}/validate-token`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const validationResult = await response.json();


                // Update stored user data with fresh info from server
                if (validationResult.user) {
                    this.currentUser = {
                        ...this.currentUser,
                        ...validationResult.user,
                        loginTime: this.currentUser?.loginTime || new Date().toISOString()
                    };
                    localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
                }

                return validationResult;
            } else if (response.status === 401) {
                console.warn('Token invalid or expired');
                // Try to refresh token before giving up
                const refreshSuccessful = await this.refreshToken();
                if (refreshSuccessful) {
                    // Retry validation with new token

                    return await this.validateToken();
                } else {
                    console.warn('Token refresh failed, logging out user');
                    this.logout(false); // Don't call backend since token is already invalid
                    return false;
                }
            } else {
                console.warn('Token validation failed:', response.status);

                // Handle different error status codes
                if (response.status === 403) {
                    console.warn('Token validation forbidden - user may be deactivated');
                    this.logout(false);
                    return false;
                } else if (response.status >= 500) {
                    // Server error - don't logout, might be temporary
                    console.warn('Server error during validation - keeping session');
                    return false;
                }

                return false;
            }
        } catch (error) {
            console.warn('Token validation request failed:', error);

            // Don't logout on network errors - might be temporary connectivity issues
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.warn('Network error during validation - keeping session');
                return false;
            }

            // Other errors might indicate token issues
            return false;
        }
    }

    /**
     * Handle authentication errors from API responses
     * @param {Response} response - Fetch response
     * @returns {boolean} True if auth error was handled
     */
    handleAuthError(response) {
        if (response.status === 401) {
            console.warn('Authentication expired, logging out...');
            this.logout();
            return true;
        }
        return false;
    }
}

// Create singleton instance
export const authService = new AuthService();

// Export for global access
window.authService = authService;