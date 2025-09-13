/**
 * Notes Section Module
 */

import { Utils } from '../shared/utils.js';

export class NotesSection {
    constructor() {
        this.reportData = null;
    }

    populate(reportData) {
        this.reportData = reportData;
        const container = document.getElementById('notes-content');
        if (!container) return;

        if (!reportData.unified_trends) {
            container.innerHTML = '<p>No notes data available</p>';
            return;
        }

        try {
            this.renderNotesContent(container);
        } catch (error) {
            console.error('Error populating notes:', error);
            container.innerHTML = `<div class="error">Error loading notes: ${error.message}</div>`;
        }
    }

    renderNotesContent(container) {
        const unifiedData = this.reportData.unified_trends;

        let notesHtml = `
            <div class="unified-analysis-grid">
                ${this.createUnifiedAnalysisCards(unifiedData)}
            </div>
            ${this.createUnificationSummary(unifiedData)}
            ${this.createDynamicDeactivation()}
        `;

        container.innerHTML = notesHtml;
    }

    createUnifiedAnalysisCards(unifiedData) {
        if (!unifiedData.unified_analysis) return '';

        return unifiedData.unified_analysis.map((group, index) => `
            <div class="unified-analysis-card">
                <h3>📊 Grupo Unificado ${index + 1}</h3>
                <div class="group-details">
                    <div class="detail-item">
                        <span class="detail-label">ID</span>
                        <span class="detail-value">${group.unified_id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Timeframes</span>
                        <span class="detail-value">${group.unified_timeframes.join(', ')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Dirección</span>
                        <span class="detail-value">${group.trend_direction || 'BUY'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Rango</span>
                        <span class="detail-value">${Math.round(group.range_pips || 0)} pips</span>
                    </div>
                </div>
                <button class="nav-button" onclick="navigateToObDynamicsWithChart('${group.dominant_timeframe}', '${group.dominant_timeframe}')">
                    🎯 Ver OB Dinámicos
                </button>
            </div>
        `).join('');
    }

    createUnificationSummary(unifiedData) {
        if (!unifiedData.unification_summary) return '';

        const summary = unifiedData.unification_summary;
        return `
            <div class="summary-box">
                <h3 class="summary-title">📋 Resumen de Unificación</h3>
                <div class="summary-content">
                    <p><strong>Total de grupos unificados:</strong> ${summary.total_unified_groups || 0}</p>
                    <p><strong>Timeframes analizados:</strong> ${summary.total_timeframes || 0}</p>
                    <p><strong>Criterio de unificación:</strong> ${summary.unification_criteria || 'Proximidad y dirección'}</p>
                    <p><strong>Estado general:</strong> ${summary.overall_status || 'Análisis completado'}</p>
                </div>
            </div>
        `;
    }

    createDynamicDeactivation() {
        if (!this.reportData.dynamic_deactivation) return '';

        const dynDeactivation = this.reportData.dynamic_deactivation;
        return `
            <div class="summary-box">
                <h3 class="summary-title">⚡ Desactivación Dinámica</h3>
                <div class="summary-content">
                    <p><strong>Estado:</strong> ${dynDeactivation.status || 'Inactivo'}</p>
                    <p><strong>Última verificación:</strong> ${Utils.formatDateTime(dynDeactivation.last_check)}</p>
                    <p><strong>Niveles monitoreados:</strong> ${dynDeactivation.monitored_levels || 0}</p>
                </div>
                <button class="nav-button" onclick="showTab('niveles-d')">
                    ⚠️ Ver Registro de Desactivaciones
                </button>
            </div>
        `;
    }
}