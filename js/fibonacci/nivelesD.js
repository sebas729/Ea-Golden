/**
 * Niveles D Section Module
 * Handles the display of level deactivation events
 */

import { Utils } from '../shared/utils.js';

export class NivelesDSection {
    constructor() {
        this.reportData = null;
    }

    populate(reportData) {
        this.reportData = reportData;
        const container = document.getElementById('niveles-d-content');
        if (!container) {
            console.error('Niveles D container not found');
            return;
        }

        this.populateNivelesDSection(container);
    }

    populateNivelesDSection(container) {
        let nivelesDHtml = '';

        // Get unified groups data
        if (!this.reportData.unified_trends || !this.reportData.unified_trends.unified_analysis || this.reportData.unified_trends.unified_analysis.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">No hay datos de grupos unificados disponibles</p>';
            return;
        }

        const groups = this.reportData.unified_trends.unified_analysis;

        nivelesDHtml += `
            <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(76, 175, 80, 0.1); border: 1px solid #4caf50; border-radius: 6px;">
                <div style="font-size: 0.9rem; color: var(--success); font-weight: 600; margin-bottom: 0.5rem;">
                    📊 Total de grupos: ${groups.length}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                    Visualización de niveles por grupo con estados de activación/desactivación
                </div>
            </div>
        `;

        groups.forEach((group, index) => {
            const groupCard = this.createGroupCard(group, index + 1);
            nivelesDHtml += groupCard;
        });

        container.innerHTML = nivelesDHtml;
    }

    // Create individual group card
    createGroupCard(group, cardNumber) {
        const groupId = group.unified_id.replace('UNIFIED_', '');
        const dominantTf = group.dominant_timeframe;
        const timeframes = group.unified_timeframes.join(', ');
        const direction = group.trend_direction || 'BUY';

        // Calculate range_pips if not provided
        const rangePips = group.range_pips || (Math.abs(group.high - group.low) * 10);

        // Format dates
        const highDate = this.formatDateTime(group.high_datetime);
        const lowDate = this.formatDateTime(group.low_datetime);

        // Get level activation status from the corresponding timeframe
        const levelActivationData = this.getLevelActivationForGroup(groupId, dominantTf);
        const levelsHtml = this.createLevelsDisplay(group, levelActivationData);

        return `
            <div style="margin-bottom: 2rem; border: 2px solid var(--border); border-radius: 8px; padding: 1.5rem; background: var(--bg-card);">
                <div style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h3 style="margin: 0; color: var(--accent); font-size: 1.1rem;">📊 Grupo: ${groupId}</h3>
                        <span style="background: var(--accent); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">#{cardNumber}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; font-size: 0.85rem;">
                        <div><strong>TFs Grupo:</strong> ${timeframes}</div>
                        <div><strong>TF Dominante:</strong> ${dominantTf}</div>
                        <div><strong>Rango:</strong> ${rangePips.toFixed(1)} pips</div>
                        <div><strong>Dirección:</strong> <span style="color: var(--success); font-weight: 600;">${direction}</span></div>
                    </div>
                    <div style="margin-top: 0.75rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.85rem;">
                        <div style="padding: 0.5rem; background: rgba(76, 175, 80, 0.1); border-radius: 4px;">
                            <strong>📈 High:</strong> ${group.high} <br>
                            <span style="color: var(--text-secondary); font-size: 0.8rem;">${highDate}</span>
                        </div>
                        <div style="padding: 0.5rem; background: rgba(244, 67, 54, 0.1); border-radius: 4px;">
                            <strong>📉 Low:</strong> ${group.low} <br>
                            <span style="color: var(--text-secondary); font-size: 0.8rem;">${lowDate}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 style="margin: 0 0 1rem 0; color: var(--warning);">🎯 Niveles de Activación:</h4>
                    ${levelsHtml}
                </div>
            </div>
        `;
    }

    // Create ordered levels display
    createLevelsDisplay(group, levelActivationData) {
        const levels = [];

        // Get levels from group activation_levels summary
        if (group.activation_levels && group.activation_levels.summary) {
            group.activation_levels.summary.forEach((level, index) => {
                const isActive = this.isLevelActive(level, levelActivationData);
                const levelType = this.getLevelTypeDisplay(level.type);

                levels.push({
                    number: index + 1,
                    name: level.level,
                    price: level.price,
                    type: levelType,
                    isActive: isActive
                });
            });
        }

        if (levels.length === 0) {
            return '<p style="color: var(--text-muted); font-style: italic;">No hay niveles disponibles para este grupo</p>';
        }

        return `
            <div style="background: rgba(255, 255, 255, 0.02); border-radius: 6px; padding: 1rem;">
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                    <strong>Resumen Ordenado:</strong>
                </div>
                ${levels.map(level => `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; padding: 0.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 4px; font-family: 'Courier New', monospace;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">#${level.number}</span>
                            <span style="font-weight: 600;">${level.name}:</span>
                            <span style="color: var(--text-primary);">${level.price}</span>
                            <span style="color: var(--text-secondary); font-size: 0.8rem;">${level.type}</span>
                        </div>
                        <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; ${level.isActive ? 'background: #4caf50; color: white;' : 'background: #f44336; color: white;'}">
                            ${level.isActive ? '✅ Activo' : '❌ Desactivado'}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Get level activation status for a group
    getLevelActivationForGroup(groupId, dominantTf) {
        // Find corresponding timeframe data with multiple matching strategies
        if (this.reportData.timeframes) {
            const timeframeData = this.reportData.timeframes.find(tf => {
                const tfGeneral = tf.timeframe_general;

                // Direct match
                if (tfGeneral === dominantTf) return true;

                // Match with variations (M1, M1_I, etc.)
                if (tfGeneral === dominantTf.replace('_I', '') ||
                    tfGeneral === dominantTf.replace('_', '_I') ||
                    tfGeneral === dominantTf + '_I' ||
                    tfGeneral === dominantTf.replace('_I', '')) return true;

                // Match by removing/adding underscores
                const normalizedTf = tfGeneral.replace('_', '');
                const normalizedDominant = dominantTf.replace('_', '');
                if (normalizedTf === normalizedDominant) return true;

                return false;
            });

            if (timeframeData && timeframeData.level_activation_status) {
                return timeframeData.level_activation_status;
            }
        }
        return null;
    }

    // Check if a level is active based on activation status
    isLevelActive(level, levelActivationData) {
        if (!levelActivationData || !levelActivationData.active_level_details) {
            return false; // Default to inactive if no activation data
        }

        // Find matching level in activation data by name first, then by price
        const activeLevels = levelActivationData.active_level_details;
        const matchingLevel = activeLevels.find(activeLevel => {
            // Primary match: by level name (50%, 61.8%, OB Óptimo, etc.)
            if (activeLevel.name && level.level) {
                const activeName = activeLevel.name.toLowerCase().trim();
                const levelName = level.level.toLowerCase().trim();
                if (activeName === levelName) {
                    return true;
                }
            }

            // Secondary match: by price with tolerance
            if (activeLevel.value && level.price) {
                const levelPrice = parseFloat(level.price);
                const activePrice = parseFloat(activeLevel.value);
                if (!isNaN(levelPrice) && !isNaN(activePrice)) {
                    return Math.abs(levelPrice - activePrice) < 0.01;
                }
            }

            return false;
        });

        // Only return true if level is found AND is_active is true
        return matchingLevel ? matchingLevel.is_active === true : false;
    }

    // Get display name for level type
    getLevelTypeDisplay(type) {
        const typeMap = {
            'FIBONACCI': 'FIBONACCI',
            'ORDER_BLOCK': 'ORDER_BLOCK',
            'STOPHUNT': 'STOPHUNT'
        };
        return typeMap[type] || type;
    }

    // Format datetime string
    formatDateTime(datetimeStr) {
        if (!datetimeStr) return 'N/A';

        try {
            const date = new Date(datetimeStr);
            return date.toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return datetimeStr;
        }
    }
}