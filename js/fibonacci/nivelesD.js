/**
 * Niveles D Section Module
 */

import { Utils } from '../shared/utils.js';

export class NivelesDSection {
    constructor() {
        this.reportData = null;
    }

    populate(reportData) {
        this.reportData = reportData;
        const container = document.getElementById('niveles-d-content');
        if (!container) return;

        try {
            this.renderNivelesDContent(container);
        } catch (error) {
            console.error('Error populating Niveles D:', error);
            container.innerHTML = `<div class="error">Error loading data: ${error.message}</div>`;
        }
    }

    renderNivelesDContent(container) {
        if (!this.reportData.unified_trends?.unified_analysis) {
            container.innerHTML = '<p>No deactivation data available</p>';
            return;
        }

        const groups = this.reportData.unified_trends.unified_analysis;
        let html = '<div class="unified-analysis-grid">';

        groups.forEach((group, index) => {
            const groupCard = this.createGroupCard(group, index + 1);
            html += groupCard;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    createGroupCard(group, cardNumber) {
        const groupId = group.unified_id.replace('UNIFIED_', '');
        const dominantTf = group.dominant_timeframe;
        const timeframes = group.unified_timeframes.join(', ');
        const direction = group.trend_direction || 'BUY';
        const rangePips = group.range_pips || (Math.abs(group.high - group.low) * 10);
        const highDate = Utils.formatDateTime(group.high_datetime);
        const lowDate = Utils.formatDateTime(group.low_datetime);

        const levelActivationData = this.getLevelActivationForGroup(groupId, dominantTf);
        const levelsHtml = this.createLevelsDisplay(group, levelActivationData);

        return `
            <div class="group-card">
                <div class="group-header">
                    <h3 class="group-title">Grupo ${cardNumber} - ${groupId}</h3>
                    <div class="group-meta">
                        <span>TF Dominante: ${dominantTf}</span>
                        <span>Dirección: ${direction}</span>
                    </div>
                </div>
                <div class="group-details">
                    <div class="detail-item">
                        <span class="detail-label">Timeframes</span>
                        <span class="detail-value">${timeframes}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Rango</span>
                        <span class="detail-value">${Math.round(rangePips)} pips</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">High</span>
                        <span class="detail-value">${Utils.formatNumber(group.high)} (${highDate})</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Low</span>
                        <span class="detail-value">${Utils.formatNumber(group.low)} (${lowDate})</span>
                    </div>
                </div>
                ${levelsHtml}
            </div>
        `;
    }

    createLevelsDisplay(group, levelActivationData) {
        const levels = [];

        // Add Fibonacci levels
        if (group.fibonacci_50) levels.push({ type: '50%', price: group.fibonacci_50 });
        if (group.fibonacci_618) levels.push({ type: '61.8%', price: group.fibonacci_618 });
        if (group.fibonacci_786) levels.push({ type: '78.6%', price: group.fibonacci_786 });

        if (levels.length === 0) return '';

        let levelsHtml = '<div class="levels-container"><h4 class="levels-title">Estado de Niveles</h4><div class="levels-grid">';

        levels.forEach(level => {
            const isActive = this.isLevelActive(level, levelActivationData);
            const statusClass = isActive ? 'active' : 'inactive';
            const statusText = isActive ? 'Activo' : 'Inactivo';

            levelsHtml += `
                <div class="level-item">
                    <span class="level-name">${this.getLevelTypeDisplay(level.type)}</span>
                    <span class="level-status ${statusClass}">${statusText}</span>
                </div>
            `;
        });

        levelsHtml += '</div></div>';
        return levelsHtml;
    }

    getLevelActivationForGroup(groupId, dominantTf) {
        if (!this.reportData.timeframes) return null;

        const timeframeData = this.reportData.timeframes.find(tf =>
            tf.timeframe === dominantTf &&
            tf.activation_levels &&
            tf.activation_levels.active_level_details
        );

        return timeframeData?.activation_levels;
    }

    isLevelActive(level, levelActivationData) {
        if (!levelActivationData || !levelActivationData.active_level_details) return false;

        const activeLevels = levelActivationData.active_level_details;
        const matchingLevel = activeLevels.find(activeLevel => {
            const levelPrice = parseFloat(level.price);
            const activePrice = parseFloat(activeLevel.value);
            const tolerance = Math.abs(levelPrice * 0.0001);
            return Math.abs(levelPrice - activePrice) <= tolerance;
        });

        return !!matchingLevel;
    }

    getLevelTypeDisplay(type) {
        const typeMap = {
            '50%': 'Fib 50%',
            '61.8%': 'Fib 61.8%',
            '78.6%': 'Fib 78.6%',
            'resistance': 'Resistencia',
            'support': 'Soporte'
        };
        return typeMap[type] || type;
    }
}