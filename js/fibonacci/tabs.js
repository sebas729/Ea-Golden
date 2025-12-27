/**
 * Tab Management Module
 * Handles tab switching and navigation
 */

export class TabManager {
    constructor() {
        this.activeTab = 'analysis';
        this.init();
    }

    init() {
        this.bindEvents();
        this.showTab(this.activeTab);
    }

    bindEvents() {
        // Bind tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('onclick')?.match(/showTab\('(.+?)'\)/)?.[1];
                if (tabName) {
                    this.showTab(tabName);
                }
            });
        });
    }

    showTab(tabName) {
        // Hide all tab contents
        const contents = document.querySelectorAll('.tab-content');
        contents.forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all buttons
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(button => {
            button.classList.remove('active');
        });

        // Show target tab content
        const targetContent = document.getElementById(tabName);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        // Activate corresponding button
        const targetButton = Array.from(buttons).find(button => {
            const onclick = button.getAttribute('onclick');
            return onclick && onclick.includes(`'${tabName}'`);
        });

        if (targetButton) {
            targetButton.classList.add('active');
        }

        this.activeTab = tabName;


        // Trigger tab-specific initialization if needed
        this.onTabSwitch(tabName);
    }

    onTabSwitch(tabName) {
        // Handle tab-specific logic when switching
        switch (tabName) {
            case 'ob-dynamics':
                // Trigger OB dynamics initialization if needed
                const event = new CustomEvent('obDynamicsTabOpened');
                document.dispatchEvent(event);
                break;
            case 'order-blocks':
                // Scroll to top of order blocks content
                const orderBlocksContent = document.getElementById('order-blocks-content');
                if (orderBlocksContent) {
                    orderBlocksContent.scrollTop = 0;
                }
                break;
            case 'notes':
                // Any notes-specific initialization
                break;
            case 'config':
                // Any config-specific initialization
                break;
            default:
                break;
        }
    }

    getActiveTab() {
        return this.activeTab;
    }

    isTabActive(tabName) {
        return this.activeTab === tabName;
    }
}

// Global function for backward compatibility
window.showTab = function(tabName) {
    if (window.fibonacciReport && window.fibonacciReport.tabManager) {
        window.fibonacciReport.tabManager.showTab(tabName);
    }
};