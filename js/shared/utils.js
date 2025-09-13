/**
 * Shared Utility Functions
 * Common functions used across both pages
 */

export class Utils {
    /**
     * Format DateTime from ISO string to readable format
     * @param {string} isoString - ISO datetime string
     * @returns {string} Formatted datetime
     */
    static formatDateTime(isoString) {
        if (!isoString) return 'N/A';

        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return 'Invalid Date';

            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            };

            return date.toLocaleString('es-ES', options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Error';
        }
    }

    /**
     * Format DateTime for shorter display
     * @param {string} datetimeStr - Datetime string
     * @returns {string} Short formatted datetime
     */
    static formatDateTimeShort(datetimeStr) {
        if (!datetimeStr) return 'N/A';

        try {
            const date = new Date(datetimeStr);
            if (isNaN(date.getTime())) return 'Invalid';

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');

            return `${day}/${month} ${hours}:${minutes}`;
        } catch (error) {
            console.error('Error formatting short date:', error);
            return 'Error';
        }
    }

    /**
     * Show loading state for an element
     * @param {HTMLElement} element - Element to show loading in
     * @param {string} message - Loading message
     */
    static showLoading(element, message = 'Cargando...') {
        if (!element) return;

        element.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        element.style.display = 'flex';
    }

    /**
     * Show error state for an element
     * @param {HTMLElement} element - Element to show error in
     * @param {string} message - Error message
     */
    static showError(element, message = 'Error al cargar los datos') {
        if (!element) return;

        element.innerHTML = `
            <div class="error">
                <h3>❌ Error</h3>
                <p>${message}</p>
            </div>
        `;
        element.style.display = 'block';
    }

    /**
     * Hide an element
     * @param {HTMLElement} element - Element to hide
     */
    static hideElement(element) {
        if (element) {
            element.style.display = 'none';
        }
    }

    /**
     * Show an element
     * @param {HTMLElement} element - Element to show
     * @param {string} display - Display type
     */
    static showElement(element, display = 'block') {
        if (element) {
            element.style.display = display;
        }
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    static escapeHtml(text) {
        if (!text) return '';

        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const result = document.execCommand('copy');
                textArea.remove();
                return result;
            }
        } catch (error) {
            console.error('Failed to copy text:', error);
            return false;
        }
    }

    /**
     * Format number with proper decimal places
     * @param {number|string} value - Value to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number
     */
    static formatNumber(value, decimals = 5) {
        if (value === null || value === undefined || value === '') return '-';

        const num = parseFloat(value);
        if (isNaN(num)) return '-';

        return num.toFixed(decimals);
    }

    /**
     * Create a safe DOM element with text content
     * @param {string} tag - HTML tag name
     * @param {string} text - Text content
     * @param {string} className - CSS class name
     * @returns {HTMLElement} Created element
     */
    static createElement(tag, text = '', className = '') {
        const element = document.createElement(tag);
        if (text) element.textContent = text;
        if (className) element.className = className;
        return element;
    }

    /**
     * Generate random ID
     * @param {string} prefix - ID prefix
     * @returns {string} Random ID
     */
    static generateId(prefix = 'id') {
        return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Wait for specified milliseconds
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise} Promise that resolves after waiting
     */
    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if in viewport
     */
    static isInViewport(element) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Scroll element into view smoothly
     * @param {HTMLElement} element - Element to scroll to
     * @param {string} behavior - Scroll behavior
     */
    static scrollToElement(element, behavior = 'smooth') {
        if (element && element.scrollIntoView) {
            element.scrollIntoView({
                behavior,
                block: 'start',
                inline: 'nearest'
            });
        }
    }

    /**
     * Local storage helpers with error handling
     */
    static storage = {
        /**
         * Get item from localStorage
         * @param {string} key - Storage key
         * @param {*} defaultValue - Default value if not found
         * @returns {*} Stored value or default
         */
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return defaultValue;
            }
        },

        /**
         * Set item in localStorage
         * @param {string} key - Storage key
         * @param {*} value - Value to store
         * @returns {boolean} Success status
         */
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error writing to localStorage:', error);
                return false;
            }
        },

        /**
         * Remove item from localStorage
         * @param {string} key - Storage key
         */
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error removing from localStorage:', error);
                return false;
            }
        }
    };
}

// Export for ES6 modules and global access
window.Utils = Utils;