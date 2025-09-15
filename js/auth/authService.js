/**
 * Authentication Service
 * Handles JWT token management and user authentication
 */

export class AuthService {
    constructor() {
        this.baseUrl = 'https://securityfilter-golden.onrender.com/api';
        this.tokenKey = 'ea_golden_token';
        this.userKey = 'ea_golden_user';
        this.csrfTokenKey = 'ea_golden_csrf';
        this.loginUrl = '/login';
        this.currentUser = null;
        this.csrfToken = null;

        // Initialize from storage
        this.loadFromStorage();

        // Initialize CSRF token
        this.initializeCSRF();
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
            console.log('Fetching CSRF token...');

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
                    console.log('CSRF token obtained');
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
            console.log('Server response:', data);

            // Validate response structure - token is in data.access_token
            const token = data.data?.access_token || data.token || data.access_token;
            if (!token) {
                console.error('Expected token not found in response:', data);
                throw new Error('Token no recibido del servidor');
            }

            // Store authentication data
            this.storeAuthData(token, data.data?.user || data.user || { username }, rememberMe, data.data?.refresh_token || data.refresh_token);

            console.log('Login successful');
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
                console.log('Backend notified of logout');
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

        console.log('User logged out');

        // Redirect to login if not already there
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        const token = localStorage.getItem(this.tokenKey);

        if (!token || !this.currentUser) {
            return false;
        }

        // Check if token is expired
        if (this.isTokenExpired(token)) {
            this.logout();
            return false;
        }

        return true;
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
            console.log('Attempting token refresh...');

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

            // Update stored tokens
            const newAccessToken = data.token || data.access_token;
            if (newAccessToken) {
                localStorage.setItem(this.tokenKey, newAccessToken);

                // Update refresh token if provided
                if (data.refresh_token) {
                    localStorage.setItem('ea_golden_refresh_token', data.refresh_token);
                }

                console.log('Token refresh successful');
                return true;
            }

            throw new Error('No access token in refresh response');

        } catch (error) {
            console.error('Token refresh failed:', error);
            // If refresh fails, logout user
            this.logout();
            return false;
        }
    }

    /**
     * Force token validation with server and get auth status
     * @returns {Promise<Object|boolean>} Auth status object or false if invalid
     */
    async validateToken() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const response = await fetch(`${this.baseUrl}/auth-status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const authStatus = await response.json();
                console.log('Auth status:', authStatus);
                return authStatus;
            } else if (response.status === 401) {
                // Try to refresh token before giving up
                const refreshSuccessful = await this.refreshToken();
                if (refreshSuccessful) {
                    // Retry with new token
                    return await this.validateToken();
                } else {
                    this.logout(false); // Don't call backend since we're already invalid
                    return false;
                }
            } else {
                console.warn('Auth status check failed:', response.status);
                return false;
            }
        } catch (error) {
            console.warn('Token validation failed:', error);
            return false; // Don't logout on network errors
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