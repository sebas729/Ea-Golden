/**
 * Calendar Filters Module
 */

import { Utils } from '../shared/utils.js';

export class FiltersManager {
    constructor() {
        this.allEvents = [];
        this.activeFilters = {};
        this.onFiltersChanged = null;
    }

    init(events) {
        this.allEvents = events;
        this.bindEvents();
    }

    bindEvents() {
        const searchInput = document.getElementById('searchFilter');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.applyFilters();
            });
        }

        ['countryFilter', 'impactFilter', 'timeFromFilter', 'timeToFilter'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => this.applyFilters());
            }
        });
    }

    toggleFilters() {
        const panel = document.querySelector('.filters-panel');
        const content = document.getElementById('filtersContent');
        const toggleSpan = document.querySelector('.filters-toggle span');

        if (panel && content) {
            panel.classList.toggle('expanded');
            if (toggleSpan) {
                toggleSpan.textContent = panel.classList.contains('expanded') ? 'Contraer' : 'Expandir';
            }
        }
    }

    populateCountryFilter(events) {
        const select = document.getElementById('countryFilter');
        if (!select) return;

        const countries = [...new Set(events.map(e => e.country).filter(Boolean))].sort();
        select.innerHTML = '<option value="">Todos los países</option>';

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            select.appendChild(option);
        });
    }

    applyFilters() {
        const filters = this.getFilterValues();
        const filtered = this.filterEvents(this.allEvents, filters);

        this.activeFilters = filters;
        this.updateFilterTags();

        if (this.onFiltersChanged) {
            this.onFiltersChanged(filtered);
        }
    }

    getFilterValues() {
        return {
            country: document.getElementById('countryFilter')?.value || '',
            impact: document.getElementById('impactFilter')?.value || '',
            timeFrom: document.getElementById('timeFromFilter')?.value || '',
            timeTo: document.getElementById('timeToFilter')?.value || '',
            search: document.getElementById('searchFilter')?.value || ''
        };
    }

    filterEvents(events, filters) {
        return events.filter(event => {
            if (filters.country && event.country !== filters.country) return false;
            if (filters.impact && event.impact !== filters.impact) return false;
            if (filters.search && !event.event.toLowerCase().includes(filters.search.toLowerCase())) return false;

            if (filters.timeFrom || filters.timeTo) {
                const eventTime = new Date(event.datetime).toTimeString().slice(0, 5);
                if (filters.timeFrom && eventTime < filters.timeFrom) return false;
                if (filters.timeTo && eventTime > filters.timeTo) return false;
            }

            return true;
        });
    }

    clearFilters() {
        ['countryFilter', 'impactFilter', 'timeFromFilter', 'timeToFilter', 'searchFilter'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        this.activeFilters = {};
        this.updateFilterTags();

        if (this.onFiltersChanged) {
            this.onFiltersChanged(this.allEvents);
        }
    }

    updateFilterTags() {
        const container = document.getElementById('filterTags');
        const activeFiltersDiv = document.getElementById('activeFilters');

        if (!container || !activeFiltersDiv) return;

        const hasFilters = Object.values(this.activeFilters).some(v => v);
        activeFiltersDiv.style.display = hasFilters ? 'block' : 'none';

        if (!hasFilters) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = Object.entries(this.activeFilters)
            .filter(([_, value]) => value)
            .map(([key, value]) => `
                <span class="filter-tag">
                    ${key}: ${value}
                    <button class="remove" onclick="removeFilter('${key}')">×</button>
                </span>
            `).join('');
    }

    removeFilter(filterKey) {
        const element = document.getElementById(`${filterKey}Filter`);
        if (element) element.value = '';
        this.applyFilters();
    }
}

// Global functions
window.applyFilters = function() {
    if (window.economicCalendar) {
        window.economicCalendar.filtersManager.applyFilters();
    }
};

window.clearFilters = function() {
    if (window.economicCalendar) {
        window.economicCalendar.filtersManager.clearFilters();
    }
};

window.removeFilter = function(filterKey) {
    if (window.economicCalendar) {
        window.economicCalendar.filtersManager.removeFilter(filterKey);
    }
};