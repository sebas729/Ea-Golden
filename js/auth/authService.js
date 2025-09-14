/**
 * Authentication Service
 * Handles JWT token management and user authentication
 */

export class AuthService {
    constructor() {
        this.baseUrl = 'https://eagolden.online/api';
        this.tokenKey = 'ea_golden_token';
        this.userKey = 'ea_golden_user';
        this.loginUrl = '/login';
        this.currentUser = null;

        // Initialize from storage
        this.loadFromStorage();
    }

    /**
     * Load authentication data from localStorage
     */
    loadFromStorage() {
        try {
            const token = localStorage.getItem(this.tokenKey);
            const userData = localStorage.getItem(this.userKey);

            if (token && userData) {
                this.currentUser = JSON.parse(userData);
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
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
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

            // Validate response structure
            if (!data.token) {
                throw new Error('Token no recibido del servidor');
            }

            // Store authentication data
            this.storeAuthData(data.token, data.user || { username }, rememberMe);

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
     * @param {string} token - JWT token
     * @param {Object} user - User data
     * @param {boolean} rememberMe - Whether to persist session
     */
    storeAuthData(token, user, rememberMe) {
        this.currentUser = {
            username: user.username,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe
        };

        // Always use localStorage for simplicity
        // In production, you might want to use sessionStorage for non-persistent sessions
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
    }

    /**
     * Logout user and clear stored data
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);

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
     * Refresh token if needed (placeholder for future implementation)
     * @returns {Promise<boolean>} True if refresh successful
     */
    async refreshToken() {
        // This would be implemented if your backend supports refresh tokens
        console.warn('Token refresh not implemented');
        return false;
    }

    /**
     * Force token validation with server
     * @returns {Promise<boolean>} True if token is valid
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
                return true;
            } else {
                this.logout();
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