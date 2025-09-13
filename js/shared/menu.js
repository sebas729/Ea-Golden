/**
 * Navigation Menu Controller
 * Handles hamburger menu toggle functionality
 */

export class NavigationMenu {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setActiveMenuItem();
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