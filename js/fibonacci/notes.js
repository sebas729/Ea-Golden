/**
 * Notes Section Module
 * Handles the display of notes and additional information
 */

import { Utils } from '../shared/utils.js';

export class NotesSection {
    constructor() {
        this.reportData = null;
        this.container = null;
    }

    populate(reportData) {
        this.reportData = reportData;
        const container = document.getElementById('notes-content');
        if (!container) {
            console.error('Notes container not found');
            return;
        }

        this.populateNotesSection(container);
    }

    populateNotesSection(container) {
        if (!this.reportData.unified_trends) {
            container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">No hay datos de tendencias unificadas disponibles</p>';
            return;
        }

        const unifiedData = this.reportData.unified_trends;
        let notesHtml = '';

        // Unified Analysis Section
        if (unifiedData.unified_analysis && unifiedData.unified_analysis.length > 0) {
            notesHtml += `
                <div class="config-section">
                    <h3>🔄 Análisis Unificado</h3>
                    <div class="unified-analysis-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; margin-top: 1rem;">
                    ${unifiedData.unified_analysis.map(group => `
                        <div class="unified-analysis-card" style="display: flex; flex-direction: column; align-items: flex-start; padding: 1rem; background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px solid var(--border); box-shadow: var(--shadow); transition: transform 0.2s ease, box-shadow 0.2s ease;">
                            <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.5rem;">
                                <span style="font-weight: 600; color: var(--accent);">Grupo: ${group.unified_id.replace('UNIFIED_', '')}</span>
                                <span style="color: var(--success);">Dominante: ${group.dominant_timeframe}</span>
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <strong>Timeframes:</strong> <span class="config-value">${group.unified_timeframes.join(', ')}</span>
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <strong>HIGH:</strong> <span class="config-value">${group.high}</span>
                                ${group.high_datetime ? `<span style="color: var(--text-secondary); font-size: 0.85rem;"> (${group.high_datetime})</span>` : ''}
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <strong>LOW:</strong> <span class="config-value">${group.low}</span>
                                ${group.low_datetime ? `<span style="color: var(--text-secondary); font-size: 0.85rem;"> (${group.low_datetime})</span>` : ''}
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <strong>Rango:</strong> <span class="config-value">${group.range_pips.toFixed(1)} pips</span>
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <strong>Dirección:</strong> <span class="config-value">${group.trend_direction}</span>
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <strong>Razón de Unificación:</strong> <span class="config-value">${group.unification_reason}</span>
                            </div>
                            ${group.activation_levels ? `
                                <div style="margin-bottom: 1rem;">
                                    <strong>🎯 Niveles de Activación:</strong>
                                    ${group.activation_levels.summary ? `
                                        <div style="margin: 0.5rem -1rem 0 0; width: calc(100% + 1rem); background: rgba(255, 255, 255, 0.02); border-radius: 8px; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.08); display: block; box-sizing: border-box;">
                                            <div style="font-size: 0.85rem; font-weight: 600; color: var(--accent); margin-bottom: 0.5rem;">Resumen Ordenado:</div>
                                            ${group.activation_levels.summary.map((level, index) => `
                                                <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.25rem 0; padding: 0.25rem 0.5rem; border-radius: 4px; background: ${level.type === 'FIBONACCI' ? 'rgba(251, 191, 36, 0.1)' : level.type === 'ORDER_BLOCK' ? 'rgba(0, 212, 170, 0.1)' : 'rgba(244, 67, 54, 0.1)'};">
                                                    <span style="font-size: 0.8rem; color: var(--text-secondary);">#${index + 1} ${level.level}:</span>
                                                    <span style="font-size: 0.85rem; font-weight: 600; color: ${level.type === 'FIBONACCI' ? '#fbbf24' : level.type === 'ORDER_BLOCK' ? '#00d4aa' : '#f44336'};">${level.price.toFixed(2)}</span>
                                                    <span style="font-size: 0.75rem; color: var(--text-muted);">${level.type}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : `
                                        <div style="margin-left: 0; margin-right: 0; margin-top: 0.5rem; width: calc(100% + 0rem);">
                                            ${group.activation_levels.fibonacci ? `
                                                <div style="margin-bottom: 0.5rem;">
                                                    <span style="color: #fbbf24; font-size: 0.85rem; font-weight: 600;">Fibonacci:</span>
                                                    <div style="margin-left: 1rem; font-size: 0.8rem;">
                                                        ${Object.entries(group.activation_levels.fibonacci).map(([level, price]) =>
                                                            `<div>• ${level}: ${price.toFixed(2)}</div>`
                                                        ).join('')}
                                                    </div>
                                                </div>
                                            ` : ''}
                                            ${group.activation_levels.order_block ? `
                                                <div style="margin-bottom: 0.5rem;">
                                                    <span style="color: #00d4aa; font-size: 0.85rem; font-weight: 600;">Order Block:</span>
                                                    <div style="margin-left: 1rem; font-size: 0.8rem;">
                                                        • ${group.activation_levels.order_block.type} @ ${group.activation_levels.order_block.price} (Score: ${group.activation_levels.order_block.score.toFixed(3)})
                                                    </div>
                                                </div>
                                            ` : ''}
                                            ${group.activation_levels.stophunt ? `
                                                <div style="margin-bottom: 0.5rem;">
                                                    <span style="color: #f44336; font-size: 0.85rem; font-weight: 600;">Stophunt:</span>
                                                    <div style="margin-left: 1rem; font-size: 0.8rem;">• ${group.activation_levels.stophunt}</div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    `}
                                </div>
                            ` : ''}
                            ${group.order_blocks && group.order_blocks.length > 0 ? `
                                <div>
                                    <strong>Order Blocks (${group.order_blocks.length}):</strong>
                                    <div style="margin-left: 1rem; margin-top: 0.5rem;">
                                        ${group.order_blocks.map(ob => `
                                            <div style="font-size: 0.85rem; margin: 0.25rem 0;">
                                                • ${ob.type} @ ${ob.price} (Score: ${ob.score.toFixed(3)})
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                    </div>
                </div>
            `;
        }

        // Excluded Trends Section
        if (unifiedData.excluded_trends && unifiedData.excluded_trends.length > 0) {
            notesHtml += `
                <div class="config-section">
                    <h3>❌ Tendencias Excluidas</h3>
                    ${unifiedData.excluded_trends.map(excluded => `
                        <div class="config-item" style="flex-direction: column; align-items: flex-start; margin-bottom: 0.5rem; padding: 0.75rem; background: rgba(244, 67, 54, 0.05); border-left: 3px solid var(--error); border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; width: 100%;">
                                <span style="font-weight: 600;">${excluded.timeframe}</span>
                                <span style="color: var(--error); font-size: 0.85rem;">${excluded.reason}</span>
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                                Rango: ${excluded.range_pips.toFixed(1)} pips
                                ${excluded.required_minimum ? `(Mín. requerido: ${excluded.required_minimum})` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Unification Summary
        if (unifiedData.unification_summary) {
            const summary = unifiedData.unification_summary;
            notesHtml += `
                <div class="config-section">
                    <h3>📊 Resumen de Unificación</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div class="config-item">
                            <span>Tendencias Originales:</span>
                            <span class="config-value">${summary.total_original_trends}</span>
                        </div>
                        <div class="config-item">
                            <span>Grupos Unificados:</span>
                            <span class="config-value">${summary.total_unified_groups}</span>
                        </div>
                        <div class="config-item">
                            <span>Tendencias Excluidas:</span>
                            <span class="config-value">${summary.excluded_count}</span>
                        </div>
                        ${summary.stophunt_substitutions ? `
                            <div class="config-item">
                                <span>Sustituciones Stophunt:</span>
                                <span class="config-value">${summary.stophunt_substitutions}</span>
                            </div>
                        ` : ''}
                        ${summary.proximity_unifications ? `
                            <div class="config-item">
                                <span>Unificaciones por Proximidad:</span>
                                <span class="config-value">${summary.proximity_unifications}</span>
                            </div>
                        ` : ''}
                        ${summary.identical_unifications ? `
                            <div class="config-item">
                                <span>Unificaciones Idénticas:</span>
                                <span class="config-value">${summary.identical_unifications}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // Process Notes
        if (unifiedData.notes && unifiedData.notes.length > 0) {
            notesHtml += `
                <div class="config-section">
                    <h3>📝 Notas del Proceso</h3>
                    <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px; padding: 1rem; background: rgba(255, 255, 255, 0.02);">
                        ${unifiedData.notes.map(note => `
                            <div style="font-size: 0.85rem; margin-bottom: 0.5rem; padding: 0.5rem; background: rgba(255, 255, 255, 0.03); border-radius: 4px; border-left: 3px solid var(--accent);">
                                ${note}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Dynamic Deactivation Section
        if (this.reportData.dynamic_deactivation) {
            const dynDeactivation = this.reportData.dynamic_deactivation;
            notesHtml += `
                <div class="config-section">
                    <h3>🔄 Sistema de Desactivación Dinámica</h3>
                    <div class="config-item" style="flex-direction: column; align-items: flex-start; margin-bottom: 1rem; padding: 1rem; background: rgba(255, 255, 255, 0.02); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.5rem;">
                            <span style="font-weight: 600; color: var(--accent);">Estado del Sistema</span>
                            <span style="color: ${dynDeactivation.enabled ? '#00d4aa' : '#f44336'}; font-weight: 600;">${dynDeactivation.enabled ? 'ACTIVADO' : 'DESACTIVADO'}</span>
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <strong>Total Eventos de Desactivación:</strong> <span class="config-value">${dynDeactivation.total_deactivation_events || 0}</span>
                        </div>

                        ${dynDeactivation.deactivation_notes && dynDeactivation.deactivation_notes.length > 0 ? `
                            <div style="margin-bottom: 1rem; width: 100%;">
                                <strong>📝 Notas de Desactivación:</strong>
                                <div style="margin-top: 0.5rem; max-height: 200px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; background: rgba(244, 67, 54, 0.05);">
                                    ${dynDeactivation.deactivation_notes.map(note => `
                                        <div style="font-size: 0.85rem; margin-bottom: 0.5rem; padding: 0.5rem; background: rgba(244, 67, 54, 0.1); border-radius: 4px; border-left: 3px solid #f44336;">
                                            ${note}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${dynDeactivation.recent_events && dynDeactivation.recent_events.length > 0 ? `
                            <div style="margin-bottom: 1rem; width: 100%;">
                                <strong>⚡ Eventos Recientes:</strong>
                                <div style="margin-top: 0.5rem;">
                                    ${dynDeactivation.recent_events.map(event => `
                                        <div style="margin: 0.5rem 0; padding: 0.75rem; background: rgba(255, 152, 0, 0.1); border-radius: 6px; border-left: 3px solid #ff9800;">
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                                <span style="font-weight: 600; color: #ff9800;">${event.level_name} @ ${event.level_value}</span>
                                                <span style="font-size: 0.8rem; color: var(--text-secondary);">${event.timestamp}</span>
                                            </div>
                                            <div style="font-size: 0.85rem;">
                                                <strong>Afectado:</strong> ${event.affected_timeframe} |
                                                <strong>Desactivado por:</strong> ${event.deactivated_by_timeframe} (LOW: ${event.deactivated_by_low_price})
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        if (notesHtml === '') {
            container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">No hay información de tendencias unificadas para mostrar</p>';
        } else {
            container.innerHTML = notesHtml;
        }
    }
}