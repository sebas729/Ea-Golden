/**
 * Calendar Integration Module
 */

export class CalendarIntegration {
    addToCalendar(eventId, title, startTime, endTime, description, location) {
        // Create Google Calendar link
        const googleUrl = this.createGoogleCalendarUrl(title, startTime, endTime, description, location);

        // Create ICS file
        const icsContent = this.createICSFile(eventId, title, startTime, endTime, description, location);

        // Show options to user
        if (confirm('¿Agregar al calendario de Google?')) {
            this.openGoogleCalendar(googleUrl);
        } else if (confirm('¿Descargar archivo .ics para otros calendarios?')) {
            this.downloadICSFile(icsContent, `${eventId}.ics`);
        }
    }

    createGoogleCalendarUrl(title, startTime, endTime, description, location) {
        const formatGoogleDate = (dateStr) => {
            return new Date(dateStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            dates: `${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}`,
            details: description,
            location: location,
            trp: 'false'
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    createICSFile(eventId, title, startTime, endTime, description, location) {
        const formatICSDate = (dateStr) => {
            return new Date(dateStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Economic Calendar//Event//EN
BEGIN:VEVENT
UID:${eventId}@economiccalendar.local
DTSTAMP:${formatICSDate(new Date().toISOString())}
DTSTART:${formatICSDate(startTime)}
DTEND:${formatICSDate(endTime)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
    }

    openGoogleCalendar(url) {
        window.open(url, '_blank', 'width=600,height=600,scrollbars=yes,resizable=yes');
    }

    downloadICSFile(icsContent, filename) {
        try {
            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error downloading ICS file:', error);
            alert('Error al descargar el archivo. Por favor, intenta de nuevo.');
        }
    }
}