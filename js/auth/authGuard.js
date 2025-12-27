/**
 * Authentication Guard
 * Protects routes by verifying user authentication
 */

import { authService } from './authService.js';

class AuthGuard {
    constructor() {
        this.protectedPages = [
            'index.html',
            'economicCalendar_modular.html',
            'economicCalendar.html',
            'setups.html',
            'tradeExecution.html'
        ];

        this.publicPages = [
            'login.html'
        ];

        this.init();
    }

    /**
     * Initialize auth guard
     */
    init() {
        // Check authentication on page load
        this.checkAuthentication();

        // Set up periodic token validation (every 5 minutes)
        this.setupTokenValidation();

        // Set up API response interceptor
        this.setupApiInterceptor();
    }

    /**
     * Check if current page requires authentication
     */
    checkAuthentication() {
        const currentPath = window.location.pathname;
        const currentPage = this.getCurrentPageName(currentPath);



        // If on login page and already authenticated, redirect to app
        if (this.isPublicPage(currentPage) && authService.isAuthenticated()) {

            this.redirectToApp();
            return;
        }

        // If on protected page and not authenticated, redirect to login
        if (this.isProtectedPage(currentPage) && !authService.isAuthenticated()) {

            this.redirectToLogin(currentPath);
            return;
        }


    }

    /**
     * Extract page name from path
     */
    getCurrentPageName(path) {
        // Handle root path
        if (path === '/' || path === '') {
            return 'index.html';
        }

        // Extract filename from path
        const segments = path.split('/');
        const filename = segments[segments.length - 1];

        // Handle empty filename (directory)
        if (!filename || filename === '') {
            return 'index.html';
        }

        return filename;
    }

    /**
     * Check if page is protected
     */
    isProtectedPage(page) {
        return this.protectedPages.some(protectedPage =>
            page === protectedPage || page.endsWith(protectedPage)
        );
    }

    /**
     * Check if page is public
     */
    isPublicPage(page) {
        return this.publicPages.some(publicPage =>
            page === publicPage || page.endsWith(publicPage)
        );
    }

    /**
     * Redirect to login page
     */
    redirectToLogin(currentPath = null) {
        let loginUrl = 'login.html';

        // Add return URL parameter if not already on login
        if (currentPath && !currentPath.includes('login.html')) {
            const returnTo = encodeURIComponent(this.getCurrentPageName(currentPath));
            loginUrl += `?returnTo=${returnTo}`;
        }


        window.location.href = loginUrl;
    }

    /**
     * Redirect to main app
     */
    redirectToApp() {
        window.location.href = 'index.html';
    }

    /**
     * Set up periodic token validation
     */
    setupTokenValidation() {
        // Validate token every 5 minutes
        setInterval(() => {
            if (authService.isAuthenticated()) {
                const token = authService.getToken();
                if (authService.isTokenExpired(token)) {

                    authService.logout();
                }
            }
        }, 5 * 60 * 1000); // 5 minutes

        // Also check on window focus (when user returns to tab)
        window.addEventListener('focus', () => {
            if (authService.isAuthenticated()) {
                const token = authService.getToken();
                if (authService.isTokenExpired(token)) {

                    authService.logout();
                }
            }
        });
    }

    /**
     * Set up API response interceptor for authentication errors
     */
    setupApiInterceptor() {
        // Intercept fetch requests globally
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);

                // Handle authentication errors
                if (response.status === 401 && authService.isAuthenticated()) {

                    authService.logout();
                    return response;
                }

                return response;
            } catch (error) {
                // Network errors, etc.
                throw error;
            }
        };
    }

    /**
     * Manually trigger authentication check
     */
    checkAuth() {
        return authService.isAuthenticated();
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return authService.getCurrentUser();
    }

    /**
     * Logout current user
     */
    logout() {
        authService.logout();
    }
}

// Create singleton instance
export const authGuard = new AuthGuard();

// Export for global access
window.authGuard = authGuard;

// Export class for testing
export { AuthGuard };