/**
 * Events Renderer Module
 */

import { Utils } from '../shared/utils.js';

export class EventsRenderer {
    constructor() {
        this.events = [];
    }

    render(events) {
        this.events = events;
        this.renderEventsByImpact();
        this.renderAllEvents();
    }

    renderEventsByImpact() {
        const impacts = ['high', 'medium', 'low'];

        impacts.forEach(impact => {
            const impactEvents = this.events.filter(e => e.impact?.toLowerCase() === impact);
            this.renderEventsForImpact(impact, impactEvents);
        });
    }

    renderEventsForImpact(impact, events) {
        const container = document.getElementById(`${impact}Events`);
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = `
                <p style="text-align: center; color: var(--text-medium); padding: 2rem;">
                    No hay eventos de ${impact} impacto para mostrar.
                </p>
            `;
            return;
        }

        container.innerHTML = events.map(event => this.createEventCard(event, impact)).join('');
    }

    renderAllEvents() {
        const container = document.getElementById('allEvents');
        if (!container) return;

        if (this.events.length === 0) {
            container.innerHTML = `
                <p style="text-align: center; color: var(--text-medium); padding: 2rem;">
                    No hay eventos para mostrar.
                </p>
            `;
            return;
        }

        // Group events by impact
        const grouped = {
            high: this.events.filter(e => e.impact?.toLowerCase() === 'alto'),
            medium: this.events.filter(e => e.impact?.toLowerCase() === 'medio'),
            low: this.events.filter(e => e.impact?.toLowerCase() === 'bajo')
        };

        let html = '';
        Object.entries(grouped).forEach(([impact, events]) => {
            if (events.length > 0) {
                const impactText = { high: 'Alto', medium: 'Medio', low: 'Bajo' }[impact];
                html += `
                    <section class="impact-section ${impact}">
                        <h2>
                            <span>${impact === 'high' ? '🔴' : impact === 'medium' ? '🟡' : '🟢'}</span>
                            EVENTOS DE ${impactText.toUpperCase()} IMPACTO
                            <span class="event-count">${events.length} eventos</span>
                        </h2>
                        ${events.map(event => this.createEventCard(event, impact)).join('')}
                    </section>
                `;
            }
        });

        container.innerHTML = html;
    }

    createEventCard(event, impactType) {
        const eventTime = new Date(event.datetime).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const calendarButton = this.createCalendarButton(event);

        return `
            <div class="event-card">
                <div class="event-header">
                    <div class="event-time">${eventTime}</div>
                    <div class="event-country">
                        <span>${event.country_flag || '🌍'}</span>
                        <span>${event.country || 'Unknown'}</span>
                    </div>
                </div>

                <h3 class="event-title">${Utils.escapeHtml(event.event || 'Unnamed Event')}</h3>

                <div class="event-details">
                    ${event.actual !== undefined ? `
                        <div class="forecast-row">
                            <span class="forecast-label">Actual:</span>
                            <span class="forecast-value">${event.actual}</span>
                        </div>
                    ` : ''}

                    ${event.forecast !== undefined ? `
                        <div class="forecast-row">
                            <span class="forecast-label">Pronóstico:</span>
                            <span class="forecast-value">${event.forecast}</span>
                        </div>
                    ` : ''}

                    ${event.previous !== undefined ? `
                        <div class="forecast-row">
                            <span class="forecast-label">Anterior:</span>
                            <span class="forecast-value">${event.previous}</span>
                        </div>
                    ` : ''}

                    ${event.importance ? `
                        <div class="forecast-row full-width">
                            <span class="forecast-label">Importancia:</span>
                            <span class="forecast-value">${event.importance}</span>
                        </div>
                    ` : ''}
                </div>

                ${calendarButton}
            </div>
        `;
    }

    createCalendarButton(event) {
        const eventId = Utils.generateId('event');
        const title = event.event || 'Economic Event';
        const startTime = new Date(event.datetime);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
        const description = `${event.country} - ${title}`;
        const location = event.country || '';

        return `
            <button class="add-calendar-btn" onclick="addToCalendar('${eventId}', '${Utils.escapeHtml(title)}', '${startTime.toISOString()}', '${endTime.toISOString()}', '${Utils.escapeHtml(description)}', '${Utils.escapeHtml(location)}')">
                <span class="calendar-icon">📅</span>
                Agregar al Calendario
            </button>
        `;
    }
}

// Global function for calendar integration
window.addToCalendar = function(eventId, title, startTime, endTime, description, location) {
    if (window.economicCalendar && window.economicCalendar.calendarIntegration) {
        window.economicCalendar.calendarIntegration.addToCalendar(eventId, title, startTime, endTime, description, location);
    }
};