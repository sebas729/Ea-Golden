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
        const impactTexts = { 'high': 'Alto', 'medium': 'Medio', 'low': 'Bajo' };

        impacts.forEach(impact => {
            const impactEvents = this.events.filter(e => {
                const eventImpact = e.impacto?.toLowerCase();
                const targetImpact = impactTexts[impact]?.toLowerCase();
                return eventImpact === targetImpact;
            });
            this.renderEventsForImpact(impact, impactEvents, impactTexts[impact]);
        });
    }

    renderEventsForImpact(impact, events, impactText) {
        const container = document.getElementById(`${impact}Events`);
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = `
                <p style="text-align: center; color: var(--text-medium); padding: 2rem;">
                    No hay eventos de ${impactText.toLowerCase()} impacto para hoy.
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
            high: this.events.filter(e => e.impacto?.toLowerCase() === 'alto'),
            medium: this.events.filter(e => e.impacto?.toLowerCase() === 'medio'),
            low: this.events.filter(e => e.impacto?.toLowerCase() === 'bajo')
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
        const impactIcons = {
            'high': '🔴',
            'medium': '🟡',
            'low': '🟢'
        };

        const impactTexts = {
            'high': 'Alto impacto',
            'medium': 'Medio impacto',
            'low': 'Bajo impacto'
        };

        let eventTitle = event.evento || 'Evento sin título';
        if (event.periodo) eventTitle += ` (${event.periodo})`;
        if (event.pais) eventTitle += ` (${event.pais})`;

        let detailsHtml = '';
        if (event.pronostico || event.anterior) {
            detailsHtml = '<div class="event-details">';

            if (event.pronostico) {
                detailsHtml += `
                    <div class="forecast-row">
                        <span class="forecast-label">Pronóstico:</span>
                        <span class="forecast-value">${event.pronostico}</span>
                    </div>
                `;
            }

            if (event.anterior) {
                detailsHtml += `
                    <div class="forecast-row">
                        <span class="forecast-label">Anterior:</span>
                        <span class="forecast-value">${event.anterior}</span>
                    </div>
                `;
            }

            detailsHtml += '</div>';
        }

        // Crear enlace de calendario
        const calendarLink = this.createCalendarLink(event);

        return `
            <div class="event">
                <div class="event-header">
                    <span class="event-time">${event.hora || '00:00'}</span>
                    <span class="event-impact impact-${impactType}">${impactIcons[impactType]} ${impactTexts[impactType]}</span>
                </div>
                <div class="event-title">${eventTitle}</div>
                ${detailsHtml}
                ${calendarLink}
            </div>
        `;
    }

    createCalendarLink(event) {
        // Get date from the calendar data
        const fecha = window.economicCalendar?.allEvents?.length > 0 ?
            new Date().toISOString().split('T')[0] :
            new Date().toISOString().split('T')[0];

        // Convert fecha y hora to ISO format
        const eventDate = new Date(`${fecha}T${event.hora || '00:00'}:00`);
        const endDate = new Date(eventDate.getTime() + 30 * 60000); // +30 minutos

        let eventTitle = event.evento || 'Evento Económico';
        if (event.pais) eventTitle += ` - ${event.pais}`;

        let details = `📊 Evento: ${event.evento || 'N/A'}\n`;
        if (event.periodo) details += `📅 Período: ${event.periodo}\n`;
        if (event.pais) details += `🌐 País: ${event.pais}\n`;
        if (event.pronostico) details += `📈 Pronóstico: ${event.pronostico}\n`;
        if (event.anterior) details += `📉 Anterior: ${event.anterior}\n`;
        details += `⚡ Impacto: ${event.impacto || 'N/A'}`;

        // Create unique ID for event
        const eventId = btoa(event.evento + event.hora).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);

        return `
            <button onclick="addToCalendar('${eventId}', '${eventTitle.replace(/'/g, "\\'")}', '${eventDate.toISOString()}', '${endDate.toISOString()}', '${details.replace(/'/g, "\\\'")}', '${event.pais || ''}')" class="add-calendar-btn">
                <span class="calendar-icon">📅</span>
                Agregar al Calendario
            </button>
        `;
    }
}

// Global function for calendar integration - copied from original
window.addToCalendar = function(eventId, title, startTime, endTime, description, location) {
    // Detectar si es un dispositivo Apple
    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isApple || isSafari) {
        // Intentar crear archivo .ics para Apple Calendar
        const icsContent = createICSFile(eventId, title, startTime, endTime, description, location);
        downloadICSFile(icsContent, title);
    } else {
        // Usar Google Calendar para otros dispositivos
        openGoogleCalendar(title, startTime, endTime, description, location);
    }
};

// Helper functions for calendar integration
function createICSFile(eventId, title, startTime, endTime, description, location) {
    const formatDate = (date) => {
        return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Economic Calendar//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${eventId}@economiccalendar.com`,
        `DTSTART:${formatDate(startTime)}`,
        `DTEND:${formatDate(endTime)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
        `LOCATION:${location}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
}

function downloadICSFile(icsContent, filename) {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function openGoogleCalendar(title, startTime, endTime, description, location) {
    const formatDateGoogle = (date) => {
        return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDateGoogle(startTime)}/${formatDateGoogle(endTime)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}&sf=true&output=xml`;

    window.open(calendarUrl, '_blank');
}