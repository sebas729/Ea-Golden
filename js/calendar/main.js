/**
 * Economic Calendar Main Module
 */

import { apiClient } from '../shared/api.js';
import { Utils } from '../shared/utils.js';
import { FiltersManager } from './filters.js';
import { EventsRenderer } from './events.js';
import { CalendarIntegration } from './calendar-integration.js';
import { AutoRefresh } from './autoRefresh.js';

export class EconomicCalendar {
    constructor() {
        this.allEvents = [];
        this.filteredEvents = [];
        this.isLoading = false;

        this.filtersManager = new FiltersManager();
        this.eventsRenderer = new EventsRenderer();
        this.calendarIntegration = new CalendarIntegration();
        this.autoRefresh = new AutoRefresh();

        this.init();
    }

    init() {
        console.log('Initializing Economic Calendar...');
        this.bindEvents();
        this.loadFromAPI();
        // Auto-refresh disabled
        // this.autoRefresh.start(() => this.loadFromAPI());
    }

    bindEvents() {
        const loadBtn = document.getElementById('loadBtn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadFromAPI());
        }

        // Setup filters
        this.filtersManager.onFiltersChanged = (events) => {
            this.filteredEvents = events;
            this.renderEvents();
        };

        this.filtersManager.init(this.allEvents);
    }

    async loadFromAPI() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);
        this.disableButtons(true);

        try {
            console.log('Loading economic calendar data...');
            const data = await apiClient.getEconomicCalendar();
            console.log('Datos recibidos:', data);

            if (data && data.eventos_economicos) {
                // Combinar todos los arrays de eventos por impacto
                const eventosEconomicos = data.eventos_economicos;
                this.allEvents = [
                    ...(eventosEconomicos.eventos_alto_impacto || []),
                    ...(eventosEconomicos.eventos_medio_impacto || []),
                    ...(eventosEconomicos.eventos_bajo_impacto || [])
                ];
                console.log(`Loaded ${this.allEvents.length} events`);
                this.filteredEvents = [...this.allEvents];
                this.filtersManager.populateCountryFilter(this.allEvents);
                this.renderEvents();
                this.updateLastUpdateTime();
                this.hideError();
                console.log(`Loaded ${this.allEvents.length} events`);
            } else {
                throw new Error('La respuesta no contiene la estructura esperada "eventos_economicos"');
            }

        } catch (error) {
            console.error('Error loading calendar data:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
            this.showLoading(false);
            this.disableButtons(false);
        }
    }

    renderEvents() {
        this.eventsRenderer.render(this.filteredEvents);
        this.updateEventCounts();
    }

    updateEventCounts() {
        const impacts = { high: 0, medium: 0, low: 0 };

        this.filteredEvents.forEach(event => {
            const impact = event.impacto?.toLowerCase();
            if (impact === 'alto') {
                impacts.high++;
            } else if (impact === 'medio') {
                impacts.medium++;
            } else if (impact === 'bajo') {
                impacts.low++;
            }
        });

        Object.entries(impacts).forEach(([impact, count]) => {
            const element = document.getElementById(`${impact}Count`);
            if (element) {
                element.textContent = `${count} eventos`;
            }
        });
    }

    updateLastUpdateTime() {
        const now = new Date().toLocaleString('es-ES');
        ['lastUpdate', 'lastUpdate2'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = now;
            }
        });
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.classList.toggle('hidden', !show);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');

        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    disableButtons(disable) {
        const loadBtn = document.getElementById('loadBtn');
        if (loadBtn) {
            loadBtn.disabled = disable;
        }
    }
}

// Global functions for backward compatibility
window.loadFromAPI = function() {
    if (window.economicCalendar) {
        window.economicCalendar.loadFromAPI();
    }
};

window.toggleFilters = function() {
    if (window.economicCalendar) {
        window.economicCalendar.filtersManager.toggleFilters();
    }
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.economicCalendar = new EconomicCalendar();
});