/**
 * Login Page Controller
 * Handles login form interactions and authentication
 */

import { authService } from './authService.js';

class LoginController {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.rememberMeInput = document.getElementById('rememberMe');
        this.loginButton = document.getElementById('loginButton');
        this.buttonText = document.getElementById('buttonText');
        this.buttonLoader = document.getElementById('buttonLoader');
        this.loginError = document.getElementById('loginError');
        this.errorMessage = document.getElementById('errorMessage');
        this.passwordToggle = document.getElementById('passwordToggle');

        this.isLoading = false;

        this.init();
    }

    /**
     * Initialize login controller
     */
    init() {
        // Check if already authenticated
        if (authService.isAuthenticated()) {
            this.redirectToApp();
            return;
        }

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Password toggle
        this.passwordToggle.addEventListener('click', () => this.togglePassword());

        // Input validation on blur
        this.usernameInput.addEventListener('blur', () => this.validateUsername());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());

        // Clear errors on input
        this.usernameInput.addEventListener('input', () => this.clearFieldError('username'));
        this.passwordInput.addEventListener('input', () => this.clearFieldError('password'));

        // Enter key support
        this.usernameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.passwordInput.focus();
            }
        });

        this.passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.form.dispatchEvent(new Event('submit'));
            }
        });
    }

    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();

        if (this.isLoading) return;

        // Clear previous errors
        this.clearAllErrors();

        // Validate inputs
        if (!this.validateInputs()) {
            return;
        }

        // Start loading
        this.setLoading(true);

        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;
        const rememberMe = this.rememberMeInput.checked;

        try {
            const result = await authService.login(username, password, rememberMe);

            if (result.success) {
                this.showSuccess('¡Login exitoso! Redirigiendo...');

                // Small delay for user feedback
                setTimeout(() => {
                    this.redirectToApp();
                }, 1000);
            } else {
                this.showError(result.message);
                this.setLoading(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Error interno del sistema');
            this.setLoading(false);
        }
    }

    /**
     * Validate form inputs
     */
    validateInputs() {
        let isValid = true;

        // Validate username
        if (!this.validateUsername()) {
            isValid = false;
        }

        // Validate password
        if (!this.validatePassword()) {
            isValid = false;
        }

        return isValid;
    }

    /**
     * Validate username field
     */
    validateUsername() {
        const username = this.usernameInput.value.trim();

        if (!username) {
            this.showFieldError('username', 'El usuario es requerido');
            return false;
        }

        if (username.length < 3) {
            this.showFieldError('username', 'El usuario debe tener al menos 3 caracteres');
            return false;
        }

        this.clearFieldError('username');
        this.usernameInput.classList.add('success');
        return true;
    }

    /**
     * Validate password field
     */
    validatePassword() {
        const password = this.passwordInput.value;

        if (!password) {
            this.showFieldError('password', 'La contraseña es requerida');
            return false;
        }

        if (password.length < 6) {
            this.showFieldError('password', 'La contraseña debe tener al menos 6 caracteres');
            return false;
        }

        this.clearFieldError('password');
        this.passwordInput.classList.add('success');
        return true;
    }

    /**
     * Show field-specific error
     */
    showFieldError(fieldName, message) {
        const input = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);

        if (input && errorElement) {
            input.classList.add('error');
            input.classList.remove('success');
            errorElement.textContent = message; // textContent is safe
            errorElement.classList.add('show');
        }
    }

    /**
     * Clear field-specific error
     */
    clearFieldError(fieldName) {
        const input = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);

        if (input && errorElement) {
            input.classList.remove('error');
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
    }

    /**
     * Clear all errors
     */
    clearAllErrors() {
        this.clearFieldError('username');
        this.clearFieldError('password');
        this.loginError.style.display = 'none';

        // Remove success states too
        this.usernameInput.classList.remove('success');
        this.passwordInput.classList.remove('success');
    }

    /**
     * Show login error
     */
    showError(message) {
        this.errorMessage.textContent = message; // textContent is safe
        this.loginError.style.display = 'block';
        this.loginError.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (this.loginError.style.display === 'block') {
                this.loginError.style.display = 'none';
                this.loginError.classList.remove('show');
            }
        }, 5000);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Convert error div to success temporarily
        this.errorMessage.textContent = message; // textContent is safe
        this.loginError.style.background = 'rgba(16, 185, 129, 0.1)';
        this.loginError.style.borderColor = 'rgba(16, 185, 129, 0.2)';
        this.loginError.style.color = '#10b981';
        this.loginError.style.display = 'block';
        this.loginError.classList.add('show');
    }

    /**
     * Toggle password visibility
     */
    togglePassword() {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        this.passwordToggle.textContent = isPassword ? '🙈' : '👁️';
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        this.loginButton.disabled = loading;

        if (loading) {
            this.buttonText.style.display = 'none';
            this.buttonLoader.style.display = 'flex';
        } else {
            this.buttonText.style.display = 'inline';
            this.buttonLoader.style.display = 'none';
        }
    }

    /**
     * Redirect to main application
     */
    redirectToApp() {
        // Get intended destination from URL params or default to index
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('returnTo') || 'index.html';

        // Validate return URL to prevent open redirects
        const allowedPaths = ['index.html', 'economicCalendar_modular.html', '/'];

        if (allowedPaths.includes(returnTo) || returnTo.startsWith('/')) {
            window.location.href = returnTo;
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new LoginController());
} else {
    new LoginController();
}