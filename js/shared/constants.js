/**
 * Constantes Globales del Proyecto EA-Golden
 * Centraliza valores mágicos y funciones helper reutilizables
 */

// ============================================
// SCORE THRESHOLDS
// ============================================

/** @type {{EXCELLENT: number, GOOD: number, FAIR: number}} */
export const SCORE_THRESHOLDS = {
    EXCELLENT: 7.0,
    GOOD: 5.0,
    FAIR: 3.0
};

/** @type {{EXCELLENT: string, GOOD: string, FAIR: string, POOR: string}} */
export const SCORE_CLASSES = {
    EXCELLENT: 'score-excellent',
    GOOD: 'score-good',
    FAIR: 'score-fair',
    POOR: 'score-poor'
};

/** @type {{EXCELLENT: string, GOOD: string, FAIR: string, POOR: string}} */
export const SCORE_LABELS = {
    EXCELLENT: 'Excelente',
    GOOD: 'Buena',
    FAIR: 'Regular',
    POOR: 'Baja'
};

/** @type {{EXCELLENT: string, GOOD: string, FAIR: string, POOR: string}} */
export const SCORE_LABELS_EN = {
    EXCELLENT: 'EXCELLENT',
    GOOD: 'GOOD',
    FAIR: 'FAIR',
    POOR: 'POOR'
};

// ============================================
// TIMEFRAMES
// ============================================

/** @type {string[]} */
export const TIMEFRAMES = ['M5', 'M15', 'M30', 'H1', 'H1_I', 'H4', 'D1'];

// ============================================
// SETUP TYPES
// ============================================

/** @type {{COMPLEX: string, SIMPLE: string}} */
export const SETUP_TYPES = {
    COMPLEX: 'COMPLEX',
    SIMPLE: 'SIMPLE'
};

// ============================================
// PROXIMITY
// ============================================

/** Default threshold in pips for proximity alerts */
export const DEFAULT_PROXIMITY_THRESHOLD = 20;

// ============================================
// API CONFIGURATION
// ============================================

/** API request timeout in milliseconds */
export const API_TIMEOUT = 60000; // 60 seconds

/** Auto-refresh intervals in milliseconds */
export const REFRESH_INTERVALS = {
    SETUPS: 120000,     // 2 minutes (reduced to avoid rate limiting)
    FIBONACCI: 180000,  // 3 minutes (reduced to avoid rate limiting)
    CALENDAR: 300000    // 5 minutes
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get CSS class for score display
 * @param {number} score - Score value (0-10)
 * @returns {string} CSS class name
 */
export function getScoreClass(score) {
    if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_CLASSES.EXCELLENT;
    if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_CLASSES.GOOD;
    if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_CLASSES.FAIR;
    return SCORE_CLASSES.POOR;
}

/**
 * Get score quality label in Spanish
 * @param {number} score - Score value (0-10)
 * @returns {string} Label in Spanish (Excelente, Buena, Regular, Baja)
 */
export function getScoreLabel(score) {
    if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_LABELS.EXCELLENT;
    if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_LABELS.GOOD;
    if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_LABELS.FAIR;
    return SCORE_LABELS.POOR;
}

/**
 * Get score quality label in English
 * @param {number} score - Score value (0-10)
 * @returns {string} Label in English (EXCELLENT, GOOD, FAIR, POOR)
 */
export function getScoreLabelEN(score) {
    if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_LABELS_EN.EXCELLENT;
    if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_LABELS_EN.GOOD;
    if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_LABELS_EN.FAIR;
    return SCORE_LABELS_EN.POOR;
}
