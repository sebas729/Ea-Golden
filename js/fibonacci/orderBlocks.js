/**
 * Order Blocks Module
 * Handles the display and interaction of order blocks data
 */

import { Utils } from '../shared/utils.js';

export class OrderBlocks {
    constructor() {
        this.reportData = null;
        this.container = null;
    }

    populate(reportData) {
        this.reportData = reportData;
        const container = document.getElementById('order-blocks-content');
        if (!container) {
            console.error('Order blocks container not found');
            return;
        }

        container.innerHTML = '';

        // Check for both old and new structure
        let blocksData = null;

        if (reportData.order_blocks_detail && Object.keys(reportData.order_blocks_detail).length > 0) {
            // Old structure
            blocksData = reportData.order_blocks_detail;
        } else {
            // New structure - extract from timeframes
            blocksData = {};
            reportData.timeframes.forEach(tf => {
                if (tf.order_blocks_analyzed && tf.order_blocks_analyzed.length > 0) {
                    blocksData[tf.timeframe_general] = tf.order_blocks_analyzed.map(block => ({
                        type: block.type,
                        timeframe: block.timeframe_ob,
                        price: block.price,
                        datetime: block.datetime,
                        pips_open_close: block.pips_oc,
                        body_percentage: block.body_percent,
                        score: block.score,
                        selected: block.selected,
                        vela: block.vela,
                        closeness_order: block.closeness_order,
                        distance_to_extreme: block.distance_to_extreme,
                        passed_prefilter: block.passed_prefilter
                    }));
                }
            });
        }

        if (!blocksData || Object.keys(blocksData).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h3>No hay Order Blocks disponibles</h3>
                    <p>No se encontraron Order Blocks en ningún timeframe en el momento actual.</p>
                </div>
            `;
            return;
        }

        Object.entries(blocksData).forEach(([timeframe, blocks]) => {
            const section = document.createElement('div');
            section.className = 'timeframe-section';
            section.id = `ob-section-${timeframe}`;

            if (!blocks || blocks.length === 0) {
                section.innerHTML = `
                    <div class="timeframe-header">
                        <div class="timeframe-badge">
                            <div class="status-dot"></div>
                            ${timeframe}:
                        </div>
                    </div>
                    <div class="empty-state">
                        <div class="empty-icon">📊</div>
                        <h3>No hay Order Blocks disponibles</h3>
                        <p>No se encontraron Order Blocks para este timeframe en el momento actual.</p>
                    </div>
                `;
            } else {
                // Sort blocks by distance_to_extreme (ascending order - smaller values first)
                const sortedBlocks = [...blocks].sort((a, b) => {
                    // Handle undefined/null values - put them at the end
                    if (a.distance_to_extreme === undefined || a.distance_to_extreme === null) return 1;
                    if (b.distance_to_extreme === undefined || b.distance_to_extreme === null) return -1;
                    // Sort ascending (smaller values first)
                    return a.distance_to_extreme - b.distance_to_extreme;
                });

                const blocksHtml = sortedBlocks.map(block => {
                    const isSelected = block.selected;
                    const selectedBadge = isSelected ? ' ⭐ ÓPTIMO' : '';

                    return `
                    <div class="block-card ${block.type.toLowerCase()} ${isSelected ? 'selected-ob' : ''} clickable-hint" onclick="navigateToObDynamicsWithChart('${timeframe}', '${block.timeframe}')">
                        <div class="block-header">
                            <div class="block-type ${block.type.toLowerCase()}">${block.type} [${block.timeframe}]${selectedBadge}</div>
                            <div class="block-price">${block.price.toFixed(5)}</div>
                        </div>
                        <div class="block-details">
                            <div class="detail-row">
                                <div class="detail-label">📅 Fecha:</div>
                                <div class="detail-value">${block.datetime.split(' ').slice(0,2).join(' ')}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">📊 Pips OC:</div>
                                <div class="detail-value">${block.pips_open_close}p</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">💪 % Cuerpo:</div>
                                <div class="detail-value">${block.body_percentage}%</div>
                            </div>
                            ${block.score !== undefined ? `
                            <div class="detail-row">
                                <div class="detail-label">🎯 Score:</div>
                                <div class="detail-value">${block.score.toFixed(3)}</div>
                            </div>
                            ` : ''}
                            ${block.vela ? `
                            <div class="detail-row">
                                <div class="detail-label">🕯️ Vela:</div>
                                <div class="detail-value">${block.vela}</div>
                            </div>
                            ` : ''}
                            ${block.closeness_order ? `
                            <div class="detail-row">
                                <div class="detail-label">📍 Orden Cercanía:</div>
                                <div class="detail-value">#${block.closeness_order}</div>
                            </div>
                            ` : ''}
                            ${block.distance_to_extreme !== undefined ? `
                            <div class="detail-row">
                                <div class="detail-label">📏 Dist. a Extremo:</div>
                                <div class="detail-value">${block.distance_to_extreme.toFixed(1)}p</div>
                            </div>
                            ` : ''}
                            ${block.passed_prefilter !== undefined ? `
                            <div class="detail-row">
                                <div class="detail-label">✅ Pre-filtro:</div>
                                <div class="detail-value" style="color: ${block.passed_prefilter ? '#00d4aa' : '#f44336'}">${block.passed_prefilter ? 'Aprobado' : 'Rechazado'}</div>
                            </div>
                            ` : ''}
                        </div>
                        <div class="percentage-bar">
                            <div class="percentage-fill" style="width: ${block.body_percentage}%"></div>
                        </div>
                    </div>
                `;
                }).join('');

                section.innerHTML = `
                    <div class="timeframe-header">
                        <div class="timeframe-badge">
                            <div class="status-dot"></div>
                            ${timeframe}: ${blocks.length} Order Block${blocks.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div class="blocks-grid">
                        ${blocksHtml}
                    </div>
                `;
            }

            container.appendChild(section);
        });
    }

    clearContainer() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    renderOrderBlocks() {
        const orderBlocks = this.reportData.order_blocks;

        // Group blocks by timeframe
        const timeframes = Object.keys(orderBlocks);

        timeframes.forEach(timeframe => {
            const blocks = orderBlocks[timeframe];
            if (!blocks || blocks.length === 0) return;

            const section = this.createTimeframeSection(timeframe, blocks);
            this.container.appendChild(section);
        });
    }

    createTimeframeSection(timeframe, blocks) {
        const section = document.createElement('div');
        section.className = 'timeframe-section';
        section.id = `ob-section-${timeframe}`;
        section.setAttribute('data-timeframe', timeframe);

        // Create section header
        const header = this.createSectionHeader(timeframe, blocks.length);
        section.appendChild(header);

        // Create blocks grid
        const grid = this.createBlocksGrid(blocks);
        section.appendChild(grid);

        return section;
    }

    createSectionHeader(timeframe, blockCount) {
        const header = document.createElement('div');
        header.className = 'timeframe-header';

        header.innerHTML = `
            <div class="timeframe-badge">
                <div class="status-dot"></div>
                ${timeframe}
            </div>
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ${blockCount} order block${blockCount !== 1 ? 's' : ''}
            </div>
        `;

        return header;
    }

    createBlocksGrid(blocks) {
        const grid = document.createElement('div');
        grid.className = 'blocks-grid';

        // Sort blocks by score if available, then by price
        const sortedBlocks = [...blocks].sort((a, b) => {
            // First, prioritize selected blocks
            if (a.selected && !b.selected) return -1;
            if (!a.selected && b.selected) return 1;

            // Then sort by score if available
            const scoreA = a.scoring?.total_score || a.score || 0;
            const scoreB = b.scoring?.total_score || b.score || 0;
            if (scoreA !== scoreB) return scoreB - scoreA;

            // Finally sort by price
            const priceA = parseFloat(a.price) || 0;
            const priceB = parseFloat(b.price) || 0;
            return priceB - priceA;
        });

        sortedBlocks.forEach(block => {
            const card = this.createBlockCard(block);
            grid.appendChild(card);
        });

        return grid;
    }

    createBlockCard(block) {
        const isSelected = block.selected;
        const selectedClass = isSelected ? ' selected-ob' : '';
        const selectedBadge = isSelected ? ' ⭐ ÓPTIMO' : '';

        const card = document.createElement('div');
        card.className = `block-card ${block.type?.toLowerCase() || 'bullish'}${selectedClass}`;
        card.setAttribute('data-price', block.price);

        // Create scoring section if available
        const scoringHtml = this.createScoringSection(block);

        card.innerHTML = `
            <div class="block-header">
                <div class="block-type ${block.type?.toLowerCase() || 'bullish'}">
                    ${block.type || 'BULLISH'}${selectedBadge}
                </div>
                <div class="block-price">${Utils.formatNumber(block.price)}</div>
            </div>

            ${scoringHtml}

            <div class="block-details">
                <div class="detail-row">
                    <span class="detail-label">📊 Strength</span>
                    <span class="detail-value">${block.strength || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📈 Volume</span>
                    <span class="detail-value">${block.volume || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏰ Formation</span>
                    <span class="detail-value">${Utils.formatDateTimeShort(block.formation_time || block.datetime)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🎯 Distance</span>
                    <span class="detail-value">${block.distance_pips ? block.distance_pips + ' pips' : 'N/A'}</span>
                </div>
                ${block.retest_count !== undefined ? `
                <div class="detail-row">
                    <span class="detail-label">🔄 Retests</span>
                    <span class="detail-value">${block.retest_count}</span>
                </div>` : ''}
                ${block.quality_rating ? `
                <div class="detail-row">
                    <span class="detail-label">⭐ Quality</span>
                    <span class="detail-value">${block.quality_rating}</span>
                </div>` : ''}
            </div>

            ${this.createPercentageBar(block)}
        `;

        return card;
    }

    createScoringSection(block) {
        if (!block.scoring && !block.score) return '';

        const scoring = block.scoring || {};
        const totalScore = scoring.total_score || block.score || 0;

        if (!scoring.breakdown) {
            return `
                <div class="scoring-info">
                    <div class="score-title">Scoring</div>
                    <div class="score-breakdown">
                        <div class="score-component">
                            <span class="score-label">Total Score</span>
                            <span class="score-value">${totalScore}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        const breakdownHtml = Object.entries(scoring.breakdown).map(([key, value]) => `
            <div class="score-component">
                <span class="score-label">${key.replace(/_/g, ' ')}</span>
                <span class="score-value">${value}</span>
            </div>
        `).join('');

        return `
            <div class="scoring-info">
                <div class="score-title">Análisis de Scoring (${totalScore})</div>
                <div class="score-breakdown">
                    ${breakdownHtml}
                </div>
            </div>
        `;
    }

    createPercentageBar(block) {
        const percentage = block.strength_percentage || block.quality_percentage || 0;

        return `
            <div class="percentage-bar">
                <div class="percentage-fill" style="width: ${percentage}%"></div>
            </div>
        `;
    }

    showEmptyState() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📈</div>
                    <p>No order blocks data available</p>
                </div>
            `;
        }
    }

    showErrorState(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="error">
                    <h3>❌ Error</h3>
                    <p>${Utils.escapeHtml(message)}</p>
                </div>
            `;
        }
    }

    // Navigation method
    navigateToTimeframe(timeframe) {
        if (!timeframe) return;

        const section = document.getElementById(`ob-section-${timeframe}`);
        if (section) {
            // Highlight the section temporarily
            section.classList.add('highlighted');
            Utils.scrollToElement(section);

            // Remove highlight after animation
            setTimeout(() => {
                section.classList.remove('highlighted');
            }, 2000);
        } else {
            console.warn(`Order blocks section for ${timeframe} not found`);
        }
    }

    // Get blocks for specific timeframe
    getBlocksForTimeframe(timeframe) {
        if (!this.reportData || !this.reportData.order_blocks) return [];
        return this.reportData.order_blocks[timeframe] || [];
    }

    // Get selected blocks across all timeframes
    getSelectedBlocks() {
        if (!this.reportData || !this.reportData.order_blocks) return [];

        const selectedBlocks = [];
        Object.entries(this.reportData.order_blocks).forEach(([timeframe, blocks]) => {
            blocks.forEach(block => {
                if (block.selected) {
                    selectedBlocks.push({ ...block, timeframe });
                }
            });
        });

        return selectedBlocks;
    }
}