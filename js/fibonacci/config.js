/**
 * Configuration Section Module
 */

import { Utils } from '../shared/utils.js';

export class ConfigSection {
    constructor() {
        this.reportData = null;
    }

    populate(reportData) {
        this.reportData = reportData;
        const configContainer = document.getElementById('config-content');
        const legendContainer = document.getElementById('legend-content');

        if (configContainer) {
            this.populateConfiguration(configContainer);
        }

        if (legendContainer) {
            this.populateLegend(legendContainer);
        }
    }

    populateConfiguration(container) {
        if (!this.reportData.configuration) {
            container.innerHTML = '<p>No configuration data available</p>';
            return;
        }

        const config = this.reportData.configuration;
        let configHtml = '';

        // EA Settings
        if (config.ea_settings) {
            configHtml += this.createConfigSection('EA Settings', config.ea_settings);
        }

        // Fibonacci Settings
        if (config.fibonacci_settings) {
            configHtml += this.createConfigSection('Fibonacci Settings', config.fibonacci_settings);
        }

        // Order Block Settings
        if (config.order_block_settings) {
            configHtml += this.createConfigSection('Order Block Settings', config.order_block_settings);
        }

        // Risk Management
        if (config.risk_management) {
            configHtml += this.createConfigSection('Risk Management', config.risk_management);
        }

        // Activation Levels
        if (config.activation_levels) {
            configHtml += this.createActivationLevelsSection(config.activation_levels);
        }

        container.innerHTML = configHtml;
    }

    createConfigSection(title, settings) {
        let html = `<div class="config-section"><h3>${title}</h3>`;

        Object.entries(settings).forEach(([key, value]) => {
            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const displayValue = this.formatConfigValue(value);

            html += `
                <div class="config-item">
                    <span>${displayKey}</span>
                    <span class="config-value">${displayValue}</span>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    createActivationLevelsSection(activationLevels) {
        let html = '<div class="config-section"><h3>Activation Levels</h3>';

        if (activationLevels.global_status) {
            html += `
                <div class="config-item">
                    <span>Global Status</span>
                    <span class="config-value">${activationLevels.global_status}</span>
                </div>
            `;
        }

        if (activationLevels.criteria) {
            html += `
                <div class="config-item">
                    <span>Activation Criteria</span>
                    <span class="config-value">${activationLevels.criteria}</span>
                </div>
            `;
        }

        if (activationLevels.timeframe_count) {
            html += `
                <div class="config-item">
                    <span>Active Timeframes</span>
                    <span class="config-value">${activationLevels.timeframe_count}</span>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    populateLegend(container) {
        const legendHtml = `
            <div class="config-section">
                <h3>Legend</h3>
                <div class="config-item">
                    <span>🔴 High Impact</span>
                    <span class="config-value">Major market events</span>
                </div>
                <div class="config-item">
                    <span>🟡 Medium Impact</span>
                    <span class="config-value">Moderate market events</span>
                </div>
                <div class="config-item">
                    <span>🟢 Low Impact</span>
                    <span class="config-value">Minor market events</span>
                </div>
                <div class="config-item">
                    <span>📈 Bullish</span>
                    <span class="config-value">Upward trend</span>
                </div>
                <div class="config-item">
                    <span>📉 Bearish</span>
                    <span class="config-value">Downward trend</span>
                </div>
                <div class="config-item">
                    <span>⭐ Optimal Block</span>
                    <span class="config-value">Highest scoring order block</span>
                </div>
            </div>
        `;

        container.innerHTML = legendHtml;
    }

    formatConfigValue(value) {
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (typeof value === 'number') {
            return Utils.formatNumber(value, 2);
        }
        if (typeof value === 'string') {
            return Utils.escapeHtml(value);
        }
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    }
}