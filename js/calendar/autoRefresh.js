/**
 * Auto Refresh Module
 */

export class AutoRefresh {
    constructor() {
        this.interval = null;
        this.refreshInterval = 5 * 60 * 1000; // 5 minutes
        this.isEnabled = false;
    }

    start(refreshCallback) {
        this.refreshCallback = refreshCallback;
        this.enable();
    }

    enable() {
        if (this.isEnabled) return;

        this.isEnabled = true;
        this.interval = setInterval(() => {
            if (this.refreshCallback) {
                this.refreshCallback();
            }
        }, this.refreshInterval);


    }

    disable() {
        if (!this.isEnabled) return;

        this.isEnabled = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }


    }

    stop() {
        this.disable();
    }
}

// Handle page visibility changes to pause/resume auto-refresh
document.addEventListener('visibilitychange', () => {
    if (window.economicCalendar && window.economicCalendar.autoRefresh) {
        if (document.hidden) {
            window.economicCalendar.autoRefresh.disable();
        } else {
            window.economicCalendar.autoRefresh.enable();
        }
    }
});

// Stop auto-refresh before page unload
window.addEventListener('beforeunload', () => {
    if (window.economicCalendar && window.economicCalendar.autoRefresh) {
        window.economicCalendar.autoRefresh.stop();
    }
});