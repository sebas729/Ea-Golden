/**
 * Navigation Menu Controller
 * Handles hamburger menu toggle functionality and user session
 */

export class NavigationMenu {
    constructor() {
        this.authService = null;
        this.init();
    }

    async init() {
        await this.initAuthService();
        this.bindEvents();
        this.setActiveMenuItem();
        this.updateUserInfo();
    }

    /**
     * Initialize auth service reference
     */
    async initAuthService() {
        try {
            const authModule = await import('../auth/authService.js');
            this.authService = authModule.authService;
        } catch (error) {
            console.warn('Auth service not available in menu:', error.message);
        }
    }

    bindEvents() {
        // Add click event to hamburger menu
        const hamburger = document.querySelector('.hamburger-menu');
        if (hamburger) {
            hamburger.addEventListener('click', () => this.toggleMenu());
        }

        // Add click event to overlay
        const overlay = document.getElementById('menuOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.toggleMenu());
        }

        // Add logout button listener
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }

        // Add escape key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        const menu = document.getElementById('sideMenu');
        const overlay = document.getElementById('menuOverlay');
        const hamburger = document.querySelector('.hamburger-menu');

        if (menu && overlay && hamburger) {
            menu.classList.toggle('active');
            overlay.classList.toggle('active');
            hamburger.classList.toggle('active');
        }
    }

    closeMenu() {
        const menu = document.getElementById('sideMenu');
        const overlay = document.getElementById('menuOverlay');
        const hamburger = document.querySelector('.hamburger-menu');

        if (menu && overlay && hamburger) {
            menu.classList.remove('active');
            overlay.classList.remove('active');
            hamburger.classList.remove('active');
        }
    }

    setActiveMenuItem() {
        const currentPage = window.location.pathname.split('/').pop();
        const menuItems = document.querySelectorAll('.menu-item');

        menuItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            if (href && href.includes(currentPage)) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Update user information in the menu
     */
    updateUserInfo() {
        const userNameElement = document.getElementById('userName');

        if (this.authService && this.authService.isAuthenticated()) {
            const user = this.authService.getCurrentUser();
            if (user && userNameElement) {
                // Prefer full_name, fallback to username
                const displayName = user.full_name || user.username || 'Usuario';
                userNameElement.textContent = displayName;
            }
        } else {
            if (userNameElement) {
                userNameElement.textContent = 'Usuario';
            }
        }
    }

    /**
     * Handle logout button click
     */
    handleLogout() {
        if (this.authService) {
            // Show confirmation dialog
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {

                this.authService.logout();
            }
        } else {
            console.warn('Auth service not available for logout');
            // Fallback: redirect to login
            window.location.href = 'login.html';
        }
    }
}

// Global function for backward compatibility
window.toggleMenu = function() {
    if (window.navigationMenu) {
        window.navigationMenu.toggleMenu();
    }
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationMenu = new NavigationMenu();
});