// =====================================================
// UTILS.JS - Utility Functions / Yardımcı Fonksiyonlar
// =====================================================

import { VIZ_STATE } from './state.js';
import { getText, VIZ_TEXTS } from './i18n.js';

// NOTE: showToast removed - use viz-toast.js instead`n`n/**
 * Sayıyı formatlar (binlik ayracı)
 */
export function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '-';

    return Number(num).toLocaleString('tr-TR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
}

/**
 * Debounce fonksiyonu
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Değerin sayısal olup olmadığını kontrol eder
 */
export function isNumeric(val) {
    if (val === null || val === undefined || val === '') return false;
    return !isNaN(parseFloat(val)) && isFinite(val);
}

/**
 * Değeri sayıya çevirir
 */
export function toNumber(val) {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
}

/**
 * Tarih mi kontrol eder
 */
export function isDate(val) {
    if (!val) return false;
    const date = new Date(val);
    return !isNaN(date.getTime());
}

/**
 * Renk paletleri
 */
export const COLOR_PALETTES = {
    default: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
    pastel: ['#8ecae6', '#219ebc', '#023047', '#ffb703', '#fb8500', '#e63946', '#a8dadc', '#457b9d', '#1d3557'],
    vivid: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#74b9ff', '#a29bfe', '#fd79a8'],
    monochrome: ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#74b9ff', '#0984e3', '#6c5ce7', '#a29bfe', '#81ecec']
};

/**
 * Grafik için renk seçer
 */
export function getChartColor(index = 0, palette = 'default') {
    const colors = COLOR_PALETTES[palette] || COLOR_PALETTES.default;
    return colors[index % colors.length];
}

/**
 * Unique ID üretir
 */
export function generateId(prefix = 'viz') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Truncate text
 */
export function truncate(str, length = 20) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

/**
 * Eksen etiketlerini truncate et
 */
export function truncateAxisLabel(label, maxLength = 15) {
    if (!label) return '';
    const str = String(label);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

/**
 * İstatistik hesaplama yardımcıları
 */
export function calculateMean(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number);
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function calculateMedian(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number).sort((a, b) => a - b);
    if (nums.length === 0) return null;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

export function calculateStdDev(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number);
    if (nums.length < 2) return null;
    const mean = calculateMean(nums);
    const squareDiffs = nums.map(v => Math.pow(v - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / nums.length;
    return Math.sqrt(avgSquareDiff);
}

export function calculateMin(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number);
    return nums.length > 0 ? Math.min(...nums) : null;
}

export function calculateMax(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number);
    return nums.length > 0 ? Math.max(...nums) : null;
}

// Global erişim (geriye uyumluluk)
window.formatNumber = formatNumber;
window.isNumeric = isNumeric;
window.truncateAxisLabel = truncateAxisLabel;

/**
 * Dosya indirme yard�mc�s�
 */
export function downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Global export
window.downloadFile = downloadFile;

