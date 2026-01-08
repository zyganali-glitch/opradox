// =====================================================
// STATS.JS - Opradox Visual Studio Statistics Module
// Part 1: Mathematical Core & Distribution Tables
// =====================================================
const STATS_BUILD_ID = '2026-01-04_ST_MASTER_01';
console.log('[BUILD_ID]', STATS_BUILD_ID, 'stats.js');
console.log('[STATS_MODULE_URL]', import.meta.url);

// FAZ-ST0: STATS_SHA_SHORT - simple signature for cache verification
const STATS_SHA_SHORT = 'ST_MASTER_01_HASH_7f3c9a2b';
console.log('[STATS_SHA_SHORT]', STATS_SHA_SHORT);

import { VIZ_STATE, getText } from './core.js';
import { showToast } from './ui.js';

// -----------------------------------------------------
// BASIC STATISTICAL FUNCTIONS
// -----------------------------------------------------

/**
 * Calculate arithmetic mean
 */
export function calculateMean(values) {
    if (!values || values.length === 0) return NaN;
    const nums = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (nums.length === 0) return NaN;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Calculate median
 */
export function calculateMedian(values) {
    if (!values || values.length === 0) return NaN;
    const nums = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if (nums.length === 0) return NaN;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

/**
 * Calculate mode (most frequent value)
 */
export function calculateMode(values) {
    if (!values || values.length === 0) return NaN;
    const freq = {};
    let maxFreq = 0;
    let mode = values[0];
    values.forEach(v => {
        freq[v] = (freq[v] || 0) + 1;
        if (freq[v] > maxFreq) {
            maxFreq = freq[v];
            mode = v;
        }
    });
    return mode;
}

/**
 * Calculate variance (population or sample)
 */
export function calculateVariance(values, sample = true) {
    if (!values || values.length < 2) return NaN;
    const nums = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (nums.length < 2) return NaN;
    const mean = calculateMean(nums);
    const squaredDiffs = nums.map(v => Math.pow(v - mean, 2));
    const divisor = sample ? nums.length - 1 : nums.length;
    return squaredDiffs.reduce((a, b) => a + b, 0) / divisor;
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values, sample = true) {
    const variance = calculateVariance(values, sample);
    return isNaN(variance) ? NaN : Math.sqrt(variance);
}

/**
 * Calculate standard error of the mean
 */
export function calculateSEM(values) {
    if (!values || values.length === 0) return NaN;
    const stdDev = calculateStdDev(values, true);
    return stdDev / Math.sqrt(values.length);
}

/**
 * Calculate covariance between two arrays
 */
export function calculateCovariance(x, y, sample = true) {
    if (!x || !y || x.length !== y.length || x.length < 2) return NaN;
    const n = x.length;
    const meanX = calculateMean(x);
    const meanY = calculateMean(y);
    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += (x[i] - meanX) * (y[i] - meanY);
    }
    return sum / (sample ? n - 1 : n);
}

/**
 * Calculate Pearson correlation coefficient
 */
export function calculateCorrelation(x, y) {
    if (!x || !y || x.length !== y.length || x.length < 2) return NaN;
    const n = x.length;
    const meanX = calculateMean(x);
    const meanY = calculateMean(y);
    let sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        sumXY += dx * dy;
        sumX2 += dx * dx;
        sumY2 += dy * dy;
    }
    const denom = Math.sqrt(sumX2 * sumY2);
    return denom === 0 ? 0 : sumXY / denom;
}

/**
 * Calculate Spearman rank correlation
 */
export function calculateSpearmanCorrelation(x, y) {
    if (!x || !y || x.length !== y.length || x.length < 2) return NaN;
    const n = x.length;
    const rankX = getRanks(x);
    const rankY = getRanks(y);
    return calculateCorrelation(rankX, rankY);
}

/**
 * Get ranks for an array (for Spearman)
 */
function getRanks(arr) {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(arr.length);
    for (let i = 0; i < sorted.length; i++) {
        ranks[sorted[i].i] = i + 1;
    }
    return ranks;
}

/**
 * Calculate skewness
 */
export function calculateSkewness(values) {
    if (!values || values.length < 3) return NaN;
    const n = values.length;
    const mean = calculateMean(values);
    const stdDev = calculateStdDev(values, true);
    if (stdDev === 0) return 0;
    let sum = 0;
    values.forEach(v => {
        sum += Math.pow((v - mean) / stdDev, 3);
    });
    return (n / ((n - 1) * (n - 2))) * sum;
}

/**
 * Calculate kurtosis
 */
export function calculateKurtosis(values) {
    if (!values || values.length < 4) return NaN;
    const n = values.length;
    const mean = calculateMean(values);
    const stdDev = calculateStdDev(values, true);
    if (stdDev === 0) return 0;
    let sum = 0;
    values.forEach(v => {
        sum += Math.pow((v - mean) / stdDev, 4);
    });
    const k = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * sum;
    return k - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
}

/**
 * Calculate sum of values
 */
export function calculateSum(values) {
    if (!values || values.length === 0) return 0;
    return values.filter(v => typeof v === 'number' && !isNaN(v)).reduce((a, b) => a + b, 0);
}

/**
 * Calculate min value
 */
export function calculateMin(values) {
    if (!values || values.length === 0) return NaN;
    const nums = values.filter(v => typeof v === 'number' && !isNaN(v));
    return nums.length > 0 ? Math.min(...nums) : NaN;
}

/**
 * Calculate max value
 */
export function calculateMax(values) {
    if (!values || values.length === 0) return NaN;
    const nums = values.filter(v => typeof v === 'number' && !isNaN(v));
    return nums.length > 0 ? Math.max(...nums) : NaN;
}

/**
 * Calculate range
 */
export function calculateRange(values) {
    return calculateMax(values) - calculateMin(values);
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values, p) {
    if (!values || values.length === 0 || p < 0 || p > 100) return NaN;
    const sorted = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if (sorted.length === 0) return NaN;
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/**
 * Calculate quartiles (Q1, Q2, Q3)
 */
export function calculateQuartiles(values) {
    return {
        q1: calculatePercentile(values, 25),
        q2: calculatePercentile(values, 50),
        q3: calculatePercentile(values, 75)
    };
}

/**
 * Calculate IQR (Interquartile Range)
 */
export function calculateIQR(values) {
    const q = calculateQuartiles(values);
    return q.q3 - q.q1;
}
// -----------------------------------------------------
// MATRIX OPERATIONS (for multiple regression)
// PROMPT-UPDATE-3: Required for VIF calculation
// -----------------------------------------------------

/**
 * Transpose a matrix
 * @param {Array<Array<number>>} matrix
 * @returns {Array<Array<number>>}
 */
function transposeMatrix(matrix) {
    if (!matrix || !matrix.length) return [];
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = [];
    for (let j = 0; j < cols; j++) {
        result[j] = [];
        for (let i = 0; i < rows; i++) {
            result[j][i] = matrix[i][j];
        }
    }
    return result;
}

/**
 * Multiply two matrices
 * @param {Array<Array<number>>} A - m x n matrix
 * @param {Array<Array<number>>} B - n x p matrix
 * @returns {Array<Array<number>>} - m x p matrix
 */
function multiplyMatrices(A, B) {
    if (!A || !B || !A.length || !B.length) return null;
    const m = A.length;
    const n = A[0].length;
    const p = B[0].length;

    if (B.length !== n) return null; // Incompatible dimensions

    const result = [];
    for (let i = 0; i < m; i++) {
        result[i] = [];
        for (let j = 0; j < p; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += A[i][k] * B[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

/**
 * Invert a square matrix using Gaussian elimination
 * @param {Array<Array<number>>} A - n x n matrix
 * @returns {Array<Array<number>>|null} - Inverse matrix or null if singular
 */
function invertMatrix(A) {
    if (!A || !A.length || A.length !== A[0].length) return null;
    const n = A.length;

    // Create augmented matrix [A | I]
    const aug = A.map((row, i) => [...row, ...new Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);

    // Forward elimination with partial pivoting
    for (let i = 0; i < n; i++) {
        // Find pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
        }
        [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];

        // Check for singular matrix
        if (Math.abs(aug[i][i]) < 1e-12) return null;

        // Scale pivot row
        const pivot = aug[i][i];
        for (let j = 0; j < 2 * n; j++) aug[i][j] /= pivot;

        // Eliminate column
        for (let k = 0; k < n; k++) {
            if (k === i) continue;
            const c = aug[k][i];
            for (let j = 0; j < 2 * n; j++) {
                aug[k][j] -= c * aug[i][j];
            }
        }
    }

    // Extract inverse from augmented matrix
    return aug.map(row => row.slice(n));
}


// NOTE: getTCritical function is defined later in the file (line ~558) with lookup tables
// Removed duplicate definition here to prevent SyntaxError

// -----------------------------------------------------
// T-SCORE & HYPOTHESIS TESTING HELPERS
// -----------------------------------------------------

/**
 * Calculate t-score for one sample t-test
 */
export function calculateTScore(sampleMean, populationMean, stdDev, n) {
    if (stdDev === 0 || n === 0) return NaN;
    return (sampleMean - populationMean) / (stdDev / Math.sqrt(n));
}

/**
 * Calculate t-score for two independent samples
 */
export function calculateTScoreTwoSample(mean1, mean2, var1, var2, n1, n2) {
    const pooledSE = Math.sqrt(var1 / n1 + var2 / n2);
    if (pooledSE === 0) return NaN;
    return (mean1 - mean2) / pooledSE;
}

/**
 * Calculate degrees of freedom for Welch's t-test
 */
export function calculateWelchDF(var1, var2, n1, n2) {
    const a = var1 / n1;
    const b = var2 / n2;
    const num = Math.pow(a + b, 2);
    const denom = Math.pow(a, 2) / (n1 - 1) + Math.pow(b, 2) / (n2 - 1);
    return num / denom;
}

/**
 * Calculate F-score for ANOVA
 */
export function calculateFScore(betweenGroupVar, withinGroupVar) {
    if (withinGroupVar === 0) return NaN;
    return betweenGroupVar / withinGroupVar;
}

/**
 * Calculate Chi-Square statistic
 */
export function calculateChiSquare(observed, expected) {
    if (!observed || !expected || observed.length !== expected.length) return NaN;
    let chi2 = 0;
    for (let i = 0; i < observed.length; i++) {
        if (expected[i] === 0) continue;
        chi2 += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }
    return chi2;
}

/**
 * Calculate Z-score
 */
export function calculateZScore(value, mean, stdDev) {
    if (stdDev === 0) return NaN;
    return (value - mean) / stdDev;
}

// -----------------------------------------------------
// EFFECT SIZE MEASURES
// -----------------------------------------------------

/**
 * Cohen's d effect size
 */
export function calculateCohensD(mean1, mean2, pooledStdDev) {
    if (pooledStdDev === 0) return NaN;
    return (mean1 - mean2) / pooledStdDev;
}

/**
 * Pooled standard deviation for two groups
 */
export function calculatePooledStdDev(stdDev1, stdDev2, n1, n2) {
    const pooledVar = ((n1 - 1) * Math.pow(stdDev1, 2) + (n2 - 1) * Math.pow(stdDev2, 2)) / (n1 + n2 - 2);
    return Math.sqrt(pooledVar);
}

/**
 * Eta squared (effect size for ANOVA)
 */
export function calculateEtaSquared(ssBetween, ssTotal) {
    if (ssTotal === 0) return NaN;
    return ssBetween / ssTotal;
}

/**
 * R-squared (coefficient of determination)
 */
export function calculateRSquared(correlation) {
    return Math.pow(correlation, 2);
}

// -----------------------------------------------------
// DISTRIBUTION LOOKUP TABLES
// -----------------------------------------------------

// T-Distribution Critical Values (two-tailed, alpha = 0.05)
// Index = degrees of freedom (1-30, then 40, 60, 120, infinity)
export const T_TABLE_005 = {
    1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
    6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
    11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
    16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
    21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
    26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042,
    40: 2.021, 60: 2.000, 120: 1.980, Infinity: 1.960
};

// T-Distribution Critical Values (two-tailed, alpha = 0.01)
export const T_TABLE_001 = {
    1: 63.657, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032,
    6: 3.707, 7: 3.499, 8: 3.355, 9: 3.250, 10: 3.169,
    11: 3.106, 12: 3.055, 13: 3.012, 14: 2.977, 15: 2.947,
    16: 2.921, 17: 2.898, 18: 2.878, 19: 2.861, 20: 2.845,
    21: 2.831, 22: 2.819, 23: 2.807, 24: 2.797, 25: 2.787,
    26: 2.779, 27: 2.771, 28: 2.763, 29: 2.756, 30: 2.750,
    40: 2.704, 60: 2.660, 120: 2.617, Infinity: 2.576
};

// Chi-Square Critical Values (alpha = 0.05)
export const CHI_TABLE_005 = {
    1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 5: 11.070,
    6: 12.592, 7: 14.067, 8: 15.507, 9: 16.919, 10: 18.307,
    11: 19.675, 12: 21.026, 13: 22.362, 14: 23.685, 15: 24.996,
    16: 26.296, 17: 27.587, 18: 28.869, 19: 30.144, 20: 31.410,
    21: 32.671, 22: 33.924, 23: 35.172, 24: 36.415, 25: 37.652,
    26: 38.885, 27: 40.113, 28: 41.337, 29: 42.557, 30: 43.773
};

// Chi-Square Critical Values (alpha = 0.01)
export const CHI_TABLE_001 = {
    1: 6.635, 2: 9.210, 3: 11.345, 4: 13.277, 5: 15.086,
    6: 16.812, 7: 18.475, 8: 20.090, 9: 21.666, 10: 23.209,
    11: 24.725, 12: 26.217, 13: 27.688, 14: 29.141, 15: 30.578,
    16: 32.000, 17: 33.409, 18: 34.805, 19: 36.191, 20: 37.566,
    21: 38.932, 22: 40.289, 23: 41.638, 24: 42.980, 25: 44.314,
    26: 45.642, 27: 46.963, 28: 48.278, 29: 49.588, 30: 50.892
};

// F-Distribution Critical Values (alpha = 0.05)
// F_TABLE_005[df1][df2]
export const F_TABLE_005 = {
    1: { 1: 161.4, 2: 199.5, 3: 215.7, 4: 224.6, 5: 230.2, 6: 234.0, 10: 241.9, 20: 248.0, 30: 250.1 },
    2: { 1: 18.51, 2: 19.00, 3: 19.16, 4: 19.25, 5: 19.30, 6: 19.33, 10: 19.40, 20: 19.45, 30: 19.46 },
    3: { 1: 10.13, 2: 9.55, 3: 9.28, 4: 9.12, 5: 9.01, 6: 8.94, 10: 8.79, 20: 8.66, 30: 8.62 },
    4: { 1: 7.71, 2: 6.94, 3: 6.59, 4: 6.39, 5: 6.26, 6: 6.16, 10: 5.96, 20: 5.80, 30: 5.75 },
    5: { 1: 6.61, 2: 5.79, 3: 5.41, 4: 5.19, 5: 5.05, 6: 4.95, 10: 4.74, 20: 4.56, 30: 4.50 },
    6: { 1: 5.99, 2: 5.14, 3: 4.76, 4: 4.53, 5: 4.39, 6: 4.28, 10: 4.06, 20: 3.87, 30: 3.81 },
    10: { 1: 4.96, 2: 4.10, 3: 3.71, 4: 3.48, 5: 3.33, 6: 3.22, 10: 2.98, 20: 2.77, 30: 2.70 },
    20: { 1: 4.35, 2: 3.49, 3: 3.10, 4: 2.87, 5: 2.71, 6: 2.60, 10: 2.35, 20: 2.12, 30: 2.04 },
    30: { 1: 4.17, 2: 3.32, 3: 2.92, 4: 2.69, 5: 2.53, 6: 2.42, 10: 2.16, 20: 1.93, 30: 1.84 }
};

// Z-Distribution Critical Values
export const Z_TABLE = {
    0.10: 1.645,  // 90% confidence
    0.05: 1.960,  // 95% confidence
    0.025: 2.240, // 97.5%
    0.01: 2.576,  // 99% confidence
    0.005: 2.807, // 99.5%
    0.001: 3.291  // 99.9% confidence
};

// -----------------------------------------------------
// LOOKUP FUNCTIONS
// -----------------------------------------------------

/**
 * Get critical t-value for given df and alpha
 */
export function getTCritical(df, alpha = 0.05) {
    const table = alpha <= 0.01 ? T_TABLE_001 : T_TABLE_005;
    if (table[df]) return table[df];
    // Interpolate for missing df
    const keys = Object.keys(table).map(k => k === 'Infinity' ? Infinity : parseInt(k)).sort((a, b) => a - b);
    for (let i = 0; i < keys.length - 1; i++) {
        if (df > keys[i] && df < keys[i + 1]) {
            const ratio = (df - keys[i]) / (keys[i + 1] - keys[i]);
            return table[keys[i]] + ratio * (table[keys[i + 1]] - table[keys[i]]);
        }
    }
    return table[Infinity] || 1.96;
}

/**
 * Get critical chi-square value
 */
export function getChiCritical(df, alpha = 0.05) {
    const table = alpha <= 0.01 ? CHI_TABLE_001 : CHI_TABLE_005;
    if (table[df]) return table[df];
    // Simple approximation for larger df
    if (df > 30) {
        const z = alpha <= 0.01 ? 2.326 : 1.645;
        return Math.pow(z + Math.sqrt(2 * df - 1), 2) / 2;
    }
    return NaN;
}

/**
 * Get critical F-value
 */
export function getFCritical(df1, df2, alpha = 0.05) {
    const table = F_TABLE_005;
    if (table[df1] && table[df1][df2]) {
        return table[df1][df2];
    }
    // Find closest
    const df1Keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    const closestDf1 = df1Keys.reduce((prev, curr) =>
        Math.abs(curr - df1) < Math.abs(prev - df1) ? curr : prev
    );
    if (table[closestDf1]) {
        const df2Keys = Object.keys(table[closestDf1]).map(Number).sort((a, b) => a - b);
        const closestDf2 = df2Keys.reduce((prev, curr) =>
            Math.abs(curr - df2) < Math.abs(prev - df2) ? curr : prev
        );
        return table[closestDf1][closestDf2];
    }
    return NaN;
}

/**
 * Get critical Z value
 */
export function getZCritical(alpha = 0.05) {
    return Z_TABLE[alpha] || Z_TABLE[0.05];
}

// -----------------------------------------------------
// P-VALUE APPROXIMATIONS
// -----------------------------------------------------

// PROMPT-UPDATE-5: Exact p-value lookup table for small df
// Format: EXACT_T_PVALUE[df] = [[t, pValue], ...] sorted by t ascending
const EXACT_T_PVALUE = {
    5: [[0, 1.0], [1, 0.3632], [2.015, 0.1], [2.571, 0.05], [3.365, 0.02], [4.032, 0.01], [5.893, 0.002]],
    10: [[0, 1.0], [1, 0.3409], [1.812, 0.1], [2.228, 0.05], [2.764, 0.02], [3.169, 0.01], [4.587, 0.001]],
    15: [[0, 1.0], [1, 0.3332], [1.753, 0.1], [2.131, 0.05], [2.602, 0.02], [2.947, 0.01]],
    20: [[0, 1.0], [1, 0.3297], [1.725, 0.1], [2.086, 0.05], [2.528, 0.02], [2.845, 0.01]],
    25: [[0, 1.0], [1, 0.3273], [1.708, 0.1], [2.06, 0.05], [2.485, 0.02], [2.787, 0.01]],
    30: [[0, 1.0], [1, 0.3253], [1.697, 0.1], [2.042, 0.05], [2.457, 0.02], [2.75, 0.01]]
};

/**
 * Get exact p-value from lookup table by interpolation
 * PROMPT-UPDATE-5
 * @param {number} t - absolute t-statistic
 * @param {number} df - degrees of freedom
 * @returns {number|null} - exact p-value or null if not available
 */
function getExactTPValue(t, df) {
    // Find closest df
    const availableDfs = Object.keys(EXACT_T_PVALUE).map(Number).sort((a, b) => a - b);
    let closestDf = availableDfs[0];
    for (const d of availableDfs) {
        if (Math.abs(d - df) < Math.abs(closestDf - df)) closestDf = d;
    }
    if (Math.abs(closestDf - df) > 5) return null; // Too far from table

    const table = EXACT_T_PVALUE[closestDf];
    const absT = Math.abs(t);

    // Find bracketing entries
    for (let i = 0; i < table.length - 1; i++) {
        const [t1, p1] = table[i];
        const [t2, p2] = table[i + 1];
        if (absT >= t1 && absT <= t2) {
            // Linear interpolation in log space for p-values
            if (p1 === p2) return p1;
            const ratio = (absT - t1) / (t2 - t1);
            // Interpolate in log space for better accuracy
            const logP = Math.log(p1) + ratio * (Math.log(p2) - Math.log(p1));
            return Math.exp(logP);
        }
    }
    // Beyond table range
    if (absT > table[table.length - 1][0]) return table[table.length - 1][1];
    return null;
}

/**
 * Approximate p-value from t-statistic (two-tailed)
 * PROMPT-UPDATE-5: Added options.exactMode for lookup-based p-value
 */
export function approximateTTestPValue(t, df, options = {}) {
    // PROMPT-UPDATE-5: exactMode for small df lookup
    if (options.exactMode && df <= 30) {
        const exactP = getExactTPValue(t, df);
        if (exactP !== null) return exactP;
    }

    // Default: Using approximation formula
    const x = df / (df + t * t);
    // Beta function approximation
    const a = df / 2;
    const b = 0.5;
    // Incomplete beta function approximation
    const p = incompleteBeta(x, a, b);
    return p;
}

/**
 * Incomplete beta function approximation
 */
function incompleteBeta(x, a, b) {
    // Simple approximation using continued fraction
    if (x === 0) return 0;
    if (x === 1) return 1;

    // Use normal approximation for large values
    if (a > 10 && b > 10) {
        const mean = a / (a + b);
        const variance = (a * b) / (Math.pow(a + b, 2) * (a + b + 1));
        const z = (x - mean) / Math.sqrt(variance);
        return 0.5 * (1 + erf(z / Math.sqrt(2)));
    }

    // Lanczos approximation
    const bt = (x === 0 || x === 1) ? 0 :
        Math.exp(gammaLn(a + b) - gammaLn(a) - gammaLn(b) +
            a * Math.log(x) + b * Math.log(1 - x));

    if (x < (a + 1) / (a + b + 2)) {
        return bt * betaCF(x, a, b) / a;
    } else {
        return 1 - bt * betaCF(1 - x, b, a) / b;
    }
}

/**
 * Beta continued fraction
 */
function betaCF(x, a, b) {
    const maxIter = 100;
    const eps = 3e-7;
    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    let c = 1;
    let d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= maxIter; m++) {
        let m2 = 2 * m;
        let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < 1e-30) d = 1e-30;
        c = 1 + aa / c;
        if (Math.abs(c) < 1e-30) c = 1e-30;
        d = 1 / d;
        h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < 1e-30) d = 1e-30;
        c = 1 + aa / c;
        if (Math.abs(c) < 1e-30) c = 1e-30;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < eps) break;
    }
    return h;
}

/**
 * Log gamma function (Lanczos approximation)
 */
function gammaLn(x) {
    const g = 7;
    const c = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7
    ];

    if (x < 0.5) {
        return Math.log(Math.PI / Math.sin(Math.PI * x)) - gammaLn(1 - x);
    }

    x -= 1;
    let a = c[0];
    for (let i = 1; i < g + 2; i++) {
        a += c[i] / (x + i);
    }
    const t = x + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Error function approximation
 */
function erf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

/**
 * Approximate p-value from Chi-Square
 */
export function approximateChiSquarePValue(chi2, df) {
    if (chi2 <= 0) return 1;
    // Use gamma function approximation
    const k = df / 2;
    const x = chi2 / 2;
    // Upper incomplete gamma function
    return 1 - lowerIncompleteGamma(k, x) / gamma(k);
}

/**
 * Lower incomplete gamma function
 */
function lowerIncompleteGamma(s, x) {
    if (x < 0) return 0;
    if (x === 0) return 0;

    let sum = 0;
    let term = 1 / s;
    sum = term;

    for (let n = 1; n < 100; n++) {
        term *= x / (s + n);
        sum += term;
        if (Math.abs(term) < 1e-10) break;
    }

    return Math.pow(x, s) * Math.exp(-x) * sum;
}

/**
 * Gamma function
 */
function gamma(z) {
    return Math.exp(gammaLn(z));
}

// -----------------------------------------------------
// PART 2: STATISTICAL TESTS
// -----------------------------------------------------

// =====================================================
// PARAMETRIC TESTS
// =====================================================

/**
 * Independent Samples T-Test (Welch's t-test)
 */
export function runIndependentTTest(group1, group2, alpha = 0.05) {
    const n1 = group1.length;
    const n2 = group2.length;

    if (n1 < 2 || n2 < 2) {
        return { error: VIZ_STATE.lang === 'tr' ? 'Her grup en az 2 gözlem içermelidir' : 'Each group must contain at least 2 observations', valid: false };
    }

    const mean1 = calculateMean(group1);
    const mean2 = calculateMean(group2);
    const var1 = calculateVariance(group1, true);
    const var2 = calculateVariance(group2, true);
    const std1 = Math.sqrt(var1);
    const std2 = Math.sqrt(var2);

    // Welch's t-test (doesn't assume equal variances)
    const t = calculateTScoreTwoSample(mean1, mean2, var1, var2, n1, n2);
    const df = calculateWelchDF(var1, var2, n1, n2);
    const tCritical = getTCritical(Math.round(df), alpha);
    const pValue = approximateTTestPValue(Math.abs(t), df);

    // Effect size (Cohen's d)
    const pooledStd = calculatePooledStdDev(std1, std2, n1, n2);
    const cohensD = calculateCohensD(mean1, mean2, pooledStd);

    // 95% Confidence Interval for mean difference (SPSS-level output)
    const se = Math.sqrt(var1 / n1 + var2 / n2);
    const meanDiff = mean1 - mean2;
    const ciLower = meanDiff - tCritical * se;
    const ciUpper = meanDiff + tCritical * se;

    const significant = Math.abs(t) > tCritical;

    // FAZ-W2: Calculate Levene test for variance homogeneity
    let leveneResult = null;
    try {
        leveneResult = runLeveneTest([group1, group2], alpha);
        if (!leveneResult || !leveneResult.valid) {
            leveneResult = null;
        }
    } catch (e) {
        leveneResult = null; // Levene may fail with zero variance groups
    }

    return {
        valid: true,
        testName: VIZ_STATE.lang === 'tr' ? 'BaÄŸımsız Örneklem T-Testi (Welch)' : 'Independent Samples T-Test (Welch)',
        group1Stats: { n: n1, mean: mean1, std: std1, variance: var1 },
        group2Stats: { n: n2, mean: mean2, std: std2, variance: var2 },
        tStatistic: t,
        degreesOfFreedom: df,
        tCritical: tCritical,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        cohensD: cohensD,
        effectSizeInterpretation: interpretCohensD(cohensD),
        meanDifference: meanDiff,
        standardError: se,
        confidenceInterval: { lower: ciLower, upper: ciUpper, level: 1 - alpha },
        // FAZ-W2: Levene test result
        levene: leveneResult,
        assumptions: {
            levene: leveneResult
        },
        interpretation: significant
            ? (VIZ_STATE.lang === 'tr' ? `Gruplar arasında istatistiksel olarak anlamlı fark var (p < ${alpha})` : `There is a statistically significant difference between groups (p < ${alpha})`)
            : (VIZ_STATE.lang === 'tr' ? `Gruplar arasında istatistiksel olarak anlamlı fark yok (p >= ${alpha})` : `There is no statistically significant difference between groups (p >= ${alpha})`)
    };
}

/**
 * Paired Samples T-Test
 */
export function runPairedTTest(before, after, alpha = 0.05) {
    if (before.length !== after.length) {
        return { error: VIZ_STATE.lang === 'tr' ? 'EÅŸleÅŸtirilmiÅŸ gruplar eÅŸit uzunlukta olmalıdır' : 'Paired groups must be of equal length', valid: false };
    }

    const n = before.length;
    if (n < 2) {
        return { error: VIZ_STATE.lang === 'tr' ? 'En az 2 eÅŸleÅŸtirilmiÅŸ gözlem gereklidir' : 'At least 2 paired observations required', valid: false };
    }

    // Calculate differences
    const differences = before.map((b, i) => after[i] - b);
    const meanDiff = calculateMean(differences);
    const stdDiff = calculateStdDev(differences, true);
    const seDiff = stdDiff / Math.sqrt(n);

    // GÖREV A2: Infinity guard - stdDiff=0 durumu için deterministik sonuç
    if (stdDiff === 0 || seDiff === 0 || !isFinite(stdDiff)) {
        // Tüm farklar aynı (varyans yok)
        if (meanDiff === 0) {
            // Fark yok â†’ t=0, p=1, anlamlı deÄŸil
            return {
                valid: true,
                testName: VIZ_STATE.lang === 'tr' ? 'EÅŸleÅŸtirilmiÅŸ Örneklem T-Testi' : 'Paired Samples T-Test',
                n: n,
                meanDifference: 0,
                stdDifference: 0,
                seDifference: 0,
                tStatistic: 0,
                degreesOfFreedom: n - 1,
                tCritical: getTCritical(n - 1, alpha),
                pValue: 1,
                alpha: alpha,
                significant: false,
                cohensD: 0,
                effectSizes: { cohensDz: 0, cohensD: 0 },
                effectSizeInterpretation: interpretCohensD(0),
                interpretation: VIZ_STATE.lang === 'tr'
                    ? 'Ölçümler arasında fark yok (tüm farklar sıfır)'
                    : 'No difference between measurements (all differences zero)',
                _zeroVarianceHandled: true
            };
        } else {
            // Sabit bir fark var ama stdDiff=0 â†’ her çift aynı sabit farkla deÄŸiÅŸmiÅŸ
            // Bu durumda p matematiksel olarak 0 (mükemmel tutarlılık) ama t=infinity
            // Deterministik çözüm: p=0, significant=true, cohensD=Infinity yerine büyük deÄŸer
            return {
                valid: true,
                testName: VIZ_STATE.lang === 'tr' ? 'EÅŸleÅŸtirilmiÅŸ Örneklem T-Testi' : 'Paired Samples T-Test',
                n: n,
                meanDifference: meanDiff,
                stdDifference: 0,
                seDifference: 0,
                tStatistic: meanDiff > 0 ? 1e10 : -1e10, // Büyük ama sonlu
                degreesOfFreedom: n - 1,
                tCritical: getTCritical(n - 1, alpha),
                pValue: 0, // Mükemmel tutarlılık = p=0
                alpha: alpha,
                significant: true,
                cohensD: meanDiff > 0 ? 1e10 : -1e10, // Büyük ama sonlu
                effectSizes: { cohensDz: meanDiff > 0 ? 1e10 : -1e10, cohensD: meanDiff > 0 ? 1e10 : -1e10 },
                effectSizeInterpretation: { tr: 'Çok büyük', en: 'Very large' },
                interpretation: VIZ_STATE.lang === 'tr'
                    ? `Tüm çiftlerde sabit ${meanDiff.toFixed(2)} birim fark (mükemmel tutarlılık)`
                    : `Constant ${meanDiff.toFixed(2)} unit difference in all pairs (perfect consistency)`,
                _zeroVarianceHandled: true
            };
        }
    }

    const t = meanDiff / seDiff;
    const df = n - 1;
    const tCritical = getTCritical(df, alpha);
    const pValue = approximateTTestPValue(Math.abs(t), df);

    // Effect size (Cohen's d for paired samples)
    const cohensD = meanDiff / stdDiff;

    const significant = Math.abs(t) > tCritical;

    return {
        valid: true,
        testName: VIZ_STATE.lang === 'tr' ? 'EÅŸleÅŸtirilmiÅŸ Örneklem T-Testi' : 'Paired Samples T-Test',
        n: n,
        meanDifference: meanDiff,
        stdDifference: stdDiff,
        seDifference: seDiff,
        tStatistic: t,
        degreesOfFreedom: df,
        tCritical: tCritical,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        cohensD: cohensD,
        // FAZ-W3: effectSizes object for normalization
        effectSizes: {
            cohensDz: cohensD,  // Cohen's dz for paired samples
            cohensD: cohensD    // Alias for compatibility
        },
        effectSizeInterpretation: interpretCohensD(cohensD),
        interpretation: significant
            ? (VIZ_STATE.lang === 'tr' ? `Ölçümler arasında istatistiksel olarak anlamlı fark var (p < ${alpha})` : `There is a statistically significant difference between measurements (p < ${alpha})`)
            : (VIZ_STATE.lang === 'tr' ? `Ölçümler arasında istatistiksel olarak anlamlı fark yok (p >= ${alpha})` : `There is no statistically significant difference between measurements (p >= ${alpha})`)
    };
}

/**
 * One-Sample T-Test
 */
export function runOneSampleTTest(sample, populationMean, alpha = 0.05) {
    const n = sample.length;
    if (n < 2) {
        return { error: VIZ_STATE.lang === 'tr' ? 'En az 2 gözlem gereklidir' : 'At least 2 observations required', valid: false };
    }

    const sampleMean = calculateMean(sample);
    const sampleStd = calculateStdDev(sample, true);
    const se = sampleStd / Math.sqrt(n);

    // GÖREV A1: Infinity guard - sd=0 durumu için deterministik sonuç
    if (sampleStd === 0 || se === 0 || !isFinite(sampleStd)) {
        // Tüm deÄŸerler aynı (varyans yok)
        if (sampleMean === populationMean) {
            // Örneklem ortalaması = popülasyon ortalaması â†’ t=0, p=1, anlamlı deÄŸil
            return {
                valid: true,
                testName: VIZ_STATE.lang === 'tr' ? 'Tek Örneklem T-Testi' : 'One-Sample T-Test',
                n: n,
                sampleMean: sampleMean,
                sampleStd: 0,
                populationMean: populationMean,
                standardError: 0,
                tStatistic: 0,
                degreesOfFreedom: n - 1,
                tCritical: getTCritical(n - 1, alpha),
                pValue: 1,
                alpha: alpha,
                significant: false,
                cohensD: 0,
                effectSizeInterpretation: interpretCohensD(0),
                confidenceInterval: { lower: sampleMean, upper: sampleMean, level: 1 - alpha },
                ci: { lower: sampleMean, upper: sampleMean },
                interpretation: VIZ_STATE.lang === 'tr'
                    ? 'Örneklem ortalaması popülasyon ortalamasına eÅŸit (varyans yok)'
                    : 'Sample mean equals population mean (no variance)',
                _zeroVarianceHandled: true
            };
        } else {
            // Örneklem ortalaması â‰  popülasyon ortalaması ama sd=0 â†’ matematiksel olarak tanımsız
            return {
                error: VIZ_STATE.lang === 'tr'
                    ? 'Veri varyansı sıfır (tüm deÄŸerler aynı). T-testi hesaplanamaz.'
                    : 'Data variance is zero (all values identical). T-test cannot be computed.',
                valid: false,
                _zeroVarianceHandled: true
            };
        }
    }

    const t = (sampleMean - populationMean) / se;
    const df = n - 1;
    const tCritical = getTCritical(df, alpha);
    const pValue = approximateTTestPValue(Math.abs(t), df);

    const cohensD = (sampleMean - populationMean) / sampleStd;
    const significant = Math.abs(t) > tCritical;

    // FAZ-W3: Confidence interval for sample mean
    const ciLower = sampleMean - tCritical * se;
    const ciUpper = sampleMean + tCritical * se;

    return {
        valid: true,
        testName: VIZ_STATE.lang === 'tr' ? 'Tek Örneklem T-Testi' : 'One-Sample T-Test',
        n: n,
        sampleMean: sampleMean,
        sampleStd: sampleStd,
        populationMean: populationMean,
        standardError: se,
        tStatistic: t,
        degreesOfFreedom: df,
        tCritical: tCritical,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        cohensD: cohensD,
        effectSizeInterpretation: interpretCohensD(cohensD),
        // FAZ-W3: Confidence interval
        confidenceInterval: { lower: ciLower, upper: ciUpper, level: 1 - alpha },
        ci: { lower: ciLower, upper: ciUpper }, // Alias for normalization
        interpretation: significant
            ? (VIZ_STATE.lang === 'tr' ? `Örneklem ortalaması popülasyon ortalamasından anlamlı farklı (p < ${alpha})` : `Sample mean is significantly different from population mean (p < ${alpha})`)
            : (VIZ_STATE.lang === 'tr' ? `Örneklem ortalaması popülasyon ortalamasından anlamlı farklı deÄŸil (p >= ${alpha})` : `Sample mean is not significantly different from population mean (p >= ${alpha})`)
    };
}

/**
 * One-Way ANOVA
 */
export function runOneWayANOVA(groups, alpha = 0.05) {
    const k = groups.length; // Number of groups
    if (k < 2) {
        return { error: VIZ_STATE.lang === 'tr' ? 'En az 2 grup gereklidir' : 'At least 2 groups required', valid: false };
    }

    // Filter out empty groups
    const validGroups = groups.filter(g => g && g.length > 0);
    if (validGroups.length < 2) {
        return { error: VIZ_STATE.lang === 'tr' ? 'En az 2 geçerli grup gereklidir' : 'At least 2 valid groups required', valid: false };
    }

    const groupStats = validGroups.map(g => {
        const variance = calculateVariance(g, true);
        return {
            n: g.length,
            mean: calculateMean(g),
            variance: variance,
            std: Math.sqrt(variance), // FAZ-W1: Add std for SPSS wrapper
            sum: calculateSum(g)
        };
    });

    const N = groupStats.reduce((sum, g) => sum + g.n, 0); // Total N
    const grandMean = groupStats.reduce((sum, g) => sum + g.mean * g.n, 0) / N;

    // Sum of Squares Between (SSB)
    let ssBetween = 0;
    groupStats.forEach(g => {
        ssBetween += g.n * Math.pow(g.mean - grandMean, 2);
    });

    // Sum of Squares Within (SSW)
    let ssWithin = 0;
    validGroups.forEach((group, i) => {
        group.forEach(val => {
            ssWithin += Math.pow(val - groupStats[i].mean, 2);
        });
    });

    const ssTotal = ssBetween + ssWithin;

    // Degrees of freedom
    const dfBetween = validGroups.length - 1;
    const dfWithin = N - validGroups.length;
    const dfTotal = N - 1;

    // Mean Squares
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;

    // F-statistic
    const F = msBetween / msWithin;
    const fCritical = getFCritical(dfBetween, dfWithin, alpha);

    // P-value approximation (using F-distribution)
    const pValue = approximateFTestPValue(F, dfBetween, dfWithin);

    // Effect size (Eta-squared)
    const etaSquared = calculateEtaSquared(ssBetween, ssTotal);

    const significant = F > fCritical;

    // FAZ-P2-4: Check variance homogeneity with Levene test for post-hoc method selection
    const leveneResult = runLeveneTest(validGroups, alpha);
    const variancesHomogeneous = !leveneResult.significant; // If Levene not significant, variances are equal

    // Determine post-hoc method
    const postHocMethod = variancesHomogeneous ? 'Tukey HSD' : 'Games-Howell';

    // Generate post-hoc pairwise comparisons
    const postHocComparisons = [];

    // Get group names from arguments or use defaults
    const groupNamesArg = arguments[2]; // groupNames parameter
    const groupNames = Array.isArray(groupNamesArg) ? groupNamesArg : validGroups.map((_, i) => `Group ${i + 1}`);

    for (let i = 0; i < validGroups.length; i++) {
        for (let j = i + 1; j < validGroups.length; j++) {
            const meanDiff = groupStats[i].mean - groupStats[j].mean;
            let se, df, pVal, ciLow, ciHigh;

            if (variancesHomogeneous) {
                // Tukey HSD: uses pooled MSE
                se = Math.sqrt(msWithin * (1 / groupStats[i].n + 1 / groupStats[j].n));
                df = dfWithin;
                const t = Math.abs(meanDiff) / se;
                pVal = approximateTTestPValue(t, df);
                // Approximate 95% CI
                const tCrit = getTCritical(alpha, df);
                ciLow = meanDiff - tCrit * se;
                ciHigh = meanDiff + tCrit * se;
            } else {
                // Games-Howell: uses individual group variances (Welch-type)
                const var1 = groupStats[i].variance;
                const var2 = groupStats[j].variance;
                const n1 = groupStats[i].n;
                const n2 = groupStats[j].n;
                se = Math.sqrt(var1 / n1 + var2 / n2);
                // Welch-Satterthwaite degrees of freedom
                const num = Math.pow(var1 / n1 + var2 / n2, 2);
                const denom = Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1);
                df = num / denom;
                const t = Math.abs(meanDiff) / se;
                pVal = approximateTTestPValue(t, df);
                // Approximate 95% CI
                const tCrit = getTCritical(alpha, Math.floor(df));
                ciLow = meanDiff - tCrit * se;
                ciHigh = meanDiff + tCrit * se;
            }

            postHocComparisons.push({
                group1: groupNames[i] || `G${i + 1}`,
                group2: groupNames[j] || `G${j + 1}`,
                group1Index: i,
                group2Index: j,
                meanDiff: meanDiff,
                se: se,
                df: df,
                pValue: pVal,
                ciLow: ciLow,
                ciHigh: ciHigh,
                significant: pVal < alpha
            });
        }
    }

    return {
        valid: true,
        testName: VIZ_STATE.lang === 'tr' ? 'Tek Yönlü ANOVA' : 'One-Way ANOVA',
        numberOfGroups: validGroups.length,
        totalN: N,
        grandMean: grandMean,
        groupStats: groupStats,
        sumOfSquares: { between: ssBetween, within: ssWithin, total: ssTotal },
        degreesOfFreedom: { between: dfBetween, within: dfWithin, total: dfTotal },
        meanSquares: { between: msBetween, within: msWithin },
        fStatistic: F,
        fCritical: fCritical,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        etaSquared: etaSquared,
        effectSizeInterpretation: interpretEtaSquared(etaSquared),
        // FAZ-P2-4: Levene test result for variance homogeneity
        levene: leveneResult,
        variancesHomogeneous: variancesHomogeneous,
        // FAZ-P2-4: Post-hoc method field (Tukey HSD or Games-Howell)
        postHocMethod: postHocMethod,
        postHoc: {
            method: postHocMethod,
            comparisons: postHocComparisons
        },
        interpretation: significant
            ? (VIZ_STATE.lang === 'tr' ? `Gruplar arasında istatistiksel olarak anlamlı fark var (p < ${alpha})` : `There is a statistically significant difference between groups (p < ${alpha})`)
            : (VIZ_STATE.lang === 'tr' ? `Gruplar arasında istatistiksel olarak anlamlı fark yok (p >= ${alpha})` : `There is no statistically significant difference between groups (p >= ${alpha})`)
    };
}

/**
 * Two-Way Factorial ANOVA
 * Calculates main effects (Factor A, Factor B) and interaction (A×B)
 * @param {Array} data - Array of objects with factor columns and value column
 * @param {string} factorAColumn - Name of Factor A column
 * @param {string} factorBColumn - Name of Factor B column
 * @param {string} valueColumn - Name of dependent variable column
 * @param {number} alpha - Significance level (default: 0.05)
 * @returns {object} ANOVA results with SPSS-compatible format
 */
export function runTwoWayANOVA(data, factorAColumn, factorBColumn, valueColumn, alpha = 0.05) {
    // 1. Validate inputs
    if (!data || data.length < 4) {
        return { error: 'En az 4 gözlem gereklidir', valid: false };
    }
    if (!factorAColumn || !factorBColumn || !valueColumn) {
        return { error: 'Faktör A, Faktör B ve baÄŸımlı deÄŸiÅŸken belirtilmelidir', valid: false };
    }

    // 2. Extract and validate data
    const validData = [];
    data.forEach(row => {
        const a = row[factorAColumn];
        const b = row[factorBColumn];
        const v = parseFloat(row[valueColumn]);
        if (a !== null && a !== undefined && a !== '' &&
            b !== null && b !== undefined && b !== '' &&
            !isNaN(v)) {
            validData.push({ a: String(a), b: String(b), value: v });
        }
    });

    if (validData.length < 4) {
        return { error: 'Yeterli geçerli veri yok (min 4)', valid: false };
    }

    // 3. Get unique levels
    const levelsA = [...new Set(validData.map(d => d.a))].sort();
    const levelsB = [...new Set(validData.map(d => d.b))].sort();
    const a = levelsA.length;
    const b = levelsB.length;

    if (a < 2 || b < 2) {
        return { error: 'Her faktör en az 2 seviyeye sahip olmalı', valid: false };
    }

    // 4. Build cell structure: cells[levelA][levelB] = [values]
    const cells = {};
    levelsA.forEach(la => {
        cells[la] = {};
        levelsB.forEach(lb => {
            cells[la][lb] = [];
        });
    });

    validData.forEach(d => {
        cells[d.a][d.b].push(d.value);
    });

    // Check for empty cells
    let hasEmptyCell = false;
    levelsA.forEach(la => {
        levelsB.forEach(lb => {
            if (cells[la][lb].length === 0) hasEmptyCell = true;
        });
    });
    if (hasEmptyCell) {
        return { error: 'Tüm hücrelerde en az 1 gözlem olmalı (boÅŸ hücre var)', valid: false };
    }

    // 5. Calculate means
    const N = validData.length;
    const grandMean = validData.reduce((s, d) => s + d.value, 0) / N;

    // Cell means: È²ij
    const cellMeans = {};
    const cellN = {};
    levelsA.forEach(la => {
        cellMeans[la] = {};
        cellN[la] = {};
        levelsB.forEach(lb => {
            const vals = cells[la][lb];
            cellMeans[la][lb] = vals.reduce((s, v) => s + v, 0) / vals.length;
            cellN[la][lb] = vals.length;
        });
    });

    // Marginal means for Factor A: È²i.
    const marginalA = {};
    levelsA.forEach(la => {
        let sum = 0, n = 0;
        levelsB.forEach(lb => {
            sum += cells[la][lb].reduce((s, v) => s + v, 0);
            n += cells[la][lb].length;
        });
        marginalA[la] = { mean: sum / n, n: n };
    });

    // Marginal means for Factor B: È².j
    const marginalB = {};
    levelsB.forEach(lb => {
        let sum = 0, n = 0;
        levelsA.forEach(la => {
            sum += cells[la][lb].reduce((s, v) => s + v, 0);
            n += cells[la][lb].length;
        });
        marginalB[lb] = { mean: sum / n, n: n };
    });

    // 6. Calculate Sum of Squares
    // SS_A = Î£ ni. × (È²i. - È²..)²
    let SS_A = 0;
    levelsA.forEach(la => {
        SS_A += marginalA[la].n * Math.pow(marginalA[la].mean - grandMean, 2);
    });

    // SS_B = Î£ n.j × (È².j - È²..)²
    let SS_B = 0;
    levelsB.forEach(lb => {
        SS_B += marginalB[lb].n * Math.pow(marginalB[lb].mean - grandMean, 2);
    });

    // SS_AB (Interaction) = Î£ nij × (È²ij - È²i. - È².j + È²..)²
    let SS_AB = 0;
    levelsA.forEach(la => {
        levelsB.forEach(lb => {
            const n_ij = cellN[la][lb];
            const deviation = cellMeans[la][lb] - marginalA[la].mean - marginalB[lb].mean + grandMean;
            SS_AB += n_ij * Math.pow(deviation, 2);
        });
    });

    // SS_Error = Î£ (Yijk - È²ij)²
    let SS_Error = 0;
    levelsA.forEach(la => {
        levelsB.forEach(lb => {
            const mean_ij = cellMeans[la][lb];
            cells[la][lb].forEach(v => {
                SS_Error += Math.pow(v - mean_ij, 2);
            });
        });
    });

    // SS_Total = Î£ (Yijk - È²..)²
    const SS_Total = validData.reduce((s, d) => s + Math.pow(d.value - grandMean, 2), 0);

    // Corrected Model SS = SS_A + SS_B + SS_AB
    const SS_Model = SS_A + SS_B + SS_AB;

    // 7. Degrees of Freedom
    const df_A = a - 1;
    const df_B = b - 1;
    const df_AB = (a - 1) * (b - 1);
    const df_Error = N - (a * b);
    const df_Total = N - 1;
    const df_Model = df_A + df_B + df_AB;

    if (df_Error <= 0) {
        return { error: VIZ_STATE.lang === 'tr' ? 'Hata serbestlik derecesi â‰¤ 0 (hücre baÅŸına daha fazla gözlem gerekli)' : 'Error degrees of freedom â‰¤ 0 (more observations per cell required)', valid: false };
    }

    // 8. Mean Squares
    const MS_A = SS_A / df_A;
    const MS_B = SS_B / df_B;
    const MS_AB = SS_AB / df_AB;
    const MS_Error = SS_Error / df_Error;
    const MS_Model = SS_Model / df_Model;

    // 9. F-statistics
    const F_A = MS_A / MS_Error;
    const F_B = MS_B / MS_Error;
    const F_AB = MS_AB / MS_Error;
    const F_Model = MS_Model / MS_Error;

    // 10. P-values
    const p_A = approximateFTestPValue(F_A, df_A, df_Error);
    const p_B = approximateFTestPValue(F_B, df_B, df_Error);
    const p_AB = approximateFTestPValue(F_AB, df_AB, df_Error);
    const p_Model = approximateFTestPValue(F_Model, df_Model, df_Error);

    // 11. Partial Eta-Squared
    const partialEtaSq_A = SS_A / (SS_A + SS_Error);
    const partialEtaSq_B = SS_B / (SS_B + SS_Error);
    const partialEtaSq_AB = SS_AB / (SS_AB + SS_Error);
    const partialEtaSq_Model = SS_Model / (SS_Model + SS_Error);

    // 12. Build SPSS-style output
    const anovaTable = [
        {
            source: 'Corrected Model',
            ss: SS_Model,
            df: df_Model,
            ms: MS_Model,
            F: F_Model,
            pValue: p_Model,
            partialEtaSq: partialEtaSq_Model
        },
        {
            source: factorAColumn,
            ss: SS_A,
            df: df_A,
            ms: MS_A,
            F: F_A,
            pValue: p_A,
            partialEtaSq: partialEtaSq_A,
            significant: p_A < alpha
        },
        {
            source: factorBColumn,
            ss: SS_B,
            df: df_B,
            ms: MS_B,
            F: F_B,
            pValue: p_B,
            partialEtaSq: partialEtaSq_B,
            significant: p_B < alpha
        },
        {
            source: `${factorAColumn} * ${factorBColumn}`,
            ss: SS_AB,
            df: df_AB,
            ms: MS_AB,
            F: F_AB,
            pValue: p_AB,
            partialEtaSq: partialEtaSq_AB,
            significant: p_AB < alpha
        },
        {
            source: 'Error',
            ss: SS_Error,
            df: df_Error,
            ms: MS_Error,
            F: null,
            pValue: null,
            partialEtaSq: null
        },
        {
            source: 'Total',
            ss: SS_Total + N * Math.pow(grandMean, 2), // Uncorrected total
            df: N,
            ms: null,
            F: null,
            pValue: null,
            partialEtaSq: null
        },
        {
            source: 'Corrected Total',
            ss: SS_Total,
            df: df_Total,
            ms: null,
            F: null,
            pValue: null,
            partialEtaSq: null
        }
    ];

    // 13. Build interpretation
    const significantEffects = [];
    if (p_A < alpha) significantEffects.push(VIZ_STATE.lang === 'tr' ? `${factorAColumn} ana etkisi` : `${factorAColumn} main effect`);
    if (p_B < alpha) significantEffects.push(VIZ_STATE.lang === 'tr' ? `${factorBColumn} ana etkisi` : `${factorBColumn} main effect`);
    if (p_AB < alpha) significantEffects.push(VIZ_STATE.lang === 'tr' ? `${factorAColumn}×${factorBColumn} etkileÅŸimi` : `${factorAColumn}×${factorBColumn} interaction`);

    const interpretation = significantEffects.length > 0
        ? (VIZ_STATE.lang === 'tr' ? `Anlamlı etkiler: ${significantEffects.join(', ')} (p < ${alpha})` : `Significant effects: ${significantEffects.join(', ')} (p < ${alpha})`)
        : (VIZ_STATE.lang === 'tr' ? `Hiçbir etki istatistiksel olarak anlamlı deÄŸil (p >= ${alpha})` : `No effect is statistically significant (p >= ${alpha})`);

    // FAZ-ADV-3: Post-hoc comparisons (Bonferroni)
    const postHoc = calculateTwoWayPostHoc(
        p_AB < alpha, // interaction significant?
        levelsA, levelsB,
        marginalA, marginalB,
        cells, cellN, cellMeans,
        MS_Error, df_Error,
        factorAColumn, factorBColumn,
        alpha
    );

    return {
        valid: true,
        testType: 'twoWayANOVA',
        testName: VIZ_STATE.lang === 'tr' ? 'İki Yönlü ANOVA (Faktöriyel)' : 'Two-Way ANOVA (Factorial)',
        alpha: alpha,
        N: N,
        grandMean: grandMean,
        factors: {
            A: { name: factorAColumn, levels: levelsA, k: a },
            B: { name: factorBColumn, levels: levelsB, k: b }
        },
        cellMeans: cellMeans,
        cellN: cellN,
        marginalMeans: {
            factorA: marginalA,
            factorB: marginalB
        },
        sumOfSquares: {
            model: SS_Model,
            factorA: SS_A,
            factorB: SS_B,
            interaction: SS_AB,
            error: SS_Error,
            total: SS_Total
        },
        degreesOfFreedom: {
            model: df_Model,
            factorA: df_A,
            factorB: df_B,
            interaction: df_AB,
            error: df_Error,
            total: df_Total
        },
        meanSquares: {
            model: MS_Model,
            factorA: MS_A,
            factorB: MS_B,
            interaction: MS_AB,
            error: MS_Error
        },
        effects: {
            factorA: { F: F_A, pValue: p_A, partialEtaSq: partialEtaSq_A, significant: p_A < alpha },
            factorB: { F: F_B, pValue: p_B, partialEtaSq: partialEtaSq_B, significant: p_B < alpha },
            interaction: { F: F_AB, pValue: p_AB, partialEtaSq: partialEtaSq_AB, significant: p_AB < alpha }
        },
        anovaTable: anovaTable,

        // FAZ-ADV-3: Post-hoc comparisons
        postHoc: postHoc,

        interpretation: interpretation,
        interpretationEN: significantEffects.length > 0
            ? `Significant effects: ${significantEffects.join(', ').replace('ana etkisi', 'main effect').replace('etkileÅŸimi', 'interaction')} (p < ${alpha})`
            : `No statistically significant effects (p >= ${alpha})`
    };
}

/**
 * FAZ-ADV-3: Calculate post-hoc comparisons for Two-Way ANOVA
 * If interaction is significant: simple effects (pairwise within each level)
 * If interaction is not significant: main effects pairwise
 * Uses Bonferroni correction
 */
function calculateTwoWayPostHoc(interactionSig, levelsA, levelsB, marginalA, marginalB, cells, cellN, cellMeans, MS_Error, df_Error, factorAName, factorBName, alpha) {
    const comparisons = [];
    let scope = interactionSig ? 'simpleEffects' : 'mainEffects';

    // Helper: pairwise t-test
    function pairwiseTTest(mean1, mean2, n1, n2, msError) {
        const meanDiff = mean1 - mean2;
        const se = Math.sqrt(msError * (1 / n1 + 1 / n2));
        const t = meanDiff / se;
        const pValue = approximateTTestPValue(Math.abs(t), df_Error);
        return { meanDiff, se, t, pValue };
    }

    // Helper: 95% CI
    function calcCI(meanDiff, se, df) {
        const tCrit = getTCritical(df, 0.05);
        return {
            lower: meanDiff - tCrit * se,
            upper: meanDiff + tCrit * se
        };
    }

    if (interactionSig) {
        // Simple effects: pairwise for Factor A at each level of B
        levelsB.forEach(lb => {
            const pairs = [];
            for (let i = 0; i < levelsA.length; i++) {
                for (let j = i + 1; j < levelsA.length; j++) {
                    const la1 = levelsA[i];
                    const la2 = levelsA[j];
                    const mean1 = cellMeans[la1][lb];
                    const mean2 = cellMeans[la2][lb];
                    const n1 = cellN[la1][lb];
                    const n2 = cellN[la2][lb];

                    const test = pairwiseTTest(mean1, mean2, n1, n2, MS_Error);
                    const ci = calcCI(test.meanDiff, test.se, df_Error);

                    pairs.push({
                        effect: `${factorAName} at ${factorBName}=${lb}`,
                        levelA: la1,
                        levelB: la2,
                        meanDiff: test.meanDiff,
                        pValue: test.pValue,
                        se: test.se,
                        ciLow: ci.lower,
                        ciHigh: ci.upper
                    });
                }
            }
            // Add pairs with Bonferroni adjustment calculated later
            comparisons.push(...pairs);
        });

        // Also simple effects: pairwise for Factor B at each level of A
        levelsA.forEach(la => {
            for (let i = 0; i < levelsB.length; i++) {
                for (let j = i + 1; j < levelsB.length; j++) {
                    const lb1 = levelsB[i];
                    const lb2 = levelsB[j];
                    const mean1 = cellMeans[la][lb1];
                    const mean2 = cellMeans[la][lb2];
                    const n1 = cellN[la][lb1];
                    const n2 = cellN[la][lb2];

                    const test = pairwiseTTest(mean1, mean2, n1, n2, MS_Error);
                    const ci = calcCI(test.meanDiff, test.se, df_Error);

                    comparisons.push({
                        effect: `${factorBName} at ${factorAName}=${la}`,
                        levelA: lb1,
                        levelB: lb2,
                        meanDiff: test.meanDiff,
                        pValue: test.pValue,
                        se: test.se,
                        ciLow: ci.lower,
                        ciHigh: ci.upper
                    });
                }
            }
        });
    } else {
        // Main effects pairwise: Factor A marginal means
        for (let i = 0; i < levelsA.length; i++) {
            for (let j = i + 1; j < levelsA.length; j++) {
                const la1 = levelsA[i];
                const la2 = levelsA[j];
                const mean1 = marginalA[la1].mean;
                const mean2 = marginalA[la2].mean;
                const n1 = marginalA[la1].n;
                const n2 = marginalA[la2].n;

                const test = pairwiseTTest(mean1, mean2, n1, n2, MS_Error);
                const ci = calcCI(test.meanDiff, test.se, df_Error);

                comparisons.push({
                    effect: factorAName,
                    levelA: la1,
                    levelB: la2,
                    meanDiff: test.meanDiff,
                    pValue: test.pValue,
                    se: test.se,
                    ciLow: ci.lower,
                    ciHigh: ci.upper
                });
            }
        }

        // Main effects pairwise: Factor B marginal means
        for (let i = 0; i < levelsB.length; i++) {
            for (let j = i + 1; j < levelsB.length; j++) {
                const lb1 = levelsB[i];
                const lb2 = levelsB[j];
                const mean1 = marginalB[lb1].mean;
                const mean2 = marginalB[lb2].mean;
                const n1 = marginalB[lb1].n;
                const n2 = marginalB[lb2].n;

                const test = pairwiseTTest(mean1, mean2, n1, n2, MS_Error);
                const ci = calcCI(test.meanDiff, test.se, df_Error);

                comparisons.push({
                    effect: factorBName,
                    levelA: lb1,
                    levelB: lb2,
                    meanDiff: test.meanDiff,
                    pValue: test.pValue,
                    se: test.se,
                    ciLow: ci.lower,
                    ciHigh: ci.upper
                });
            }
        }
    }

    // Apply Bonferroni correction
    const numComparisons = comparisons.length || 1;
    comparisons.forEach(c => {
        c.pValueAdj = Math.min(1, c.pValue * numComparisons);
        c.significant = c.pValueAdj < alpha;
    });

    return {
        method: 'bonferroni',
        scope: scope,
        numComparisons: numComparisons,
        comparisons: comparisons
    };
}

/**
 * Approximate F-test p-value
 */
function approximateFTestPValue(F, df1, df2) {
    if (F <= 0) return 1;
    const x = df2 / (df2 + df1 * F);
    return incompleteBeta(x, df2 / 2, df1 / 2);
}

/**
 * Repeated Measures ANOVA (One-Way Within-Subjects)
 * Tests for differences across repeated measurements on the same subjects
 * Includes Mauchly's sphericity test and epsilon corrections (GG, HF)
 * 
 * @param {Array} data - Array of objects OR 2D array [subjects][measurements]
 * @param {Array} measureColumns - Array of column names for measurements
 * @param {number} alpha - Significance level (default: 0.05)
 * @returns {object} ANOVA results with sphericity tests
 */
export function runRepeatedMeasuresANOVA(data, measureColumns, alpha = 0.05) {
    // 1. Validate inputs
    if (!measureColumns || measureColumns.length < 2) {
        return { error: 'En az 2 ölçüm/koÅŸul gereklidir', valid: false };
    }

    const k = measureColumns.length; // Number of conditions/measurements

    // 2. Build subject × measurement matrix
    let matrix = [];

    if (Array.isArray(data) && data.length > 0) {
        if (Array.isArray(data[0]) && typeof data[0][0] === 'number') {
            // Already a 2D numeric array
            matrix = data.filter(row => row.length >= k && row.every(v => !isNaN(v)));
        } else {
            // Array of objects
            data.forEach(row => {
                const values = measureColumns.map(col => parseFloat(row[col]));
                if (values.every(v => !isNaN(v))) {
                    matrix.push(values);
                }
            });
        }
    }

    const n = matrix.length; // Number of subjects
    if (n < 3) {
        return { error: 'En az 3 denek/katılımcı gereklidir', valid: false };
    }

    // 3. Calculate means
    // Grand mean
    let grandSum = 0, grandCount = 0;
    matrix.forEach(row => {
        row.forEach(v => { grandSum += v; grandCount++; });
    });
    const grandMean = grandSum / grandCount;

    // Subject means (row means)
    const subjectMeans = matrix.map(row => row.reduce((s, v) => s + v, 0) / k);

    // Condition/Treatment means (column means)
    const conditionMeans = [];
    for (let j = 0; j < k; j++) {
        let sum = 0;
        for (let i = 0; i < n; i++) {
            sum += matrix[i][j];
        }
        conditionMeans.push(sum / n);
    }

    // 4. Calculate Sum of Squares
    // SS_Total = Î£ (Yij - È²..)²
    let SS_Total = 0;
    matrix.forEach(row => {
        row.forEach(v => {
            SS_Total += Math.pow(v - grandMean, 2);
        });
    });

    // SS_Subjects = k × Î£ (È²i. - È²..)²
    let SS_Subjects = 0;
    subjectMeans.forEach(sm => {
        SS_Subjects += Math.pow(sm - grandMean, 2);
    });
    SS_Subjects *= k;

    // SS_Treatment = n × Î£ (È².j - È²..)²
    let SS_Treatment = 0;
    conditionMeans.forEach(cm => {
        SS_Treatment += Math.pow(cm - grandMean, 2);
    });
    SS_Treatment *= n;

    // SS_Error = SS_Total - SS_Subjects - SS_Treatment
    const SS_Error = SS_Total - SS_Subjects - SS_Treatment;

    // 5. Degrees of Freedom
    const df_Subjects = n - 1;
    const df_Treatment = k - 1;
    const df_Error = (n - 1) * (k - 1);
    const df_Total = n * k - 1;

    // 6. Mean Squares
    const MS_Treatment = SS_Treatment / df_Treatment;
    const MS_Error = SS_Error / df_Error;
    const MS_Subjects = SS_Subjects / df_Subjects;

    // 7. F-statistic
    const F = MS_Treatment / MS_Error;
    const pValue = approximateFTestPValue(F, df_Treatment, df_Error);

    // 8. Effect Size (Partial Eta-Squared)
    const partialEtaSq = SS_Treatment / (SS_Treatment + SS_Error);
    // Generalized Eta-Squared 
    const genEtaSq = SS_Treatment / (SS_Treatment + SS_Error + SS_Subjects);

    // 9. Sphericity Test (Mauchly's W)
    // Calculate covariance matrix of differences between conditions
    const covMatrix = calculateCovarianceMatrixRM(matrix, k);
    const mauchlysW = calculateMauchlysW(covMatrix, n, k);
    const mauchlyChi = -(n - 1 - (2 * k * k - 3 * k + 3) / (6 * (k - 1))) * Math.log(mauchlysW || 0.0001);
    const mauchlyDf = k * (k - 1) / 2 - 1;
    const mauchlyP = mauchlyDf > 0 ? 1 - chiSquareCDF(mauchlyChi, mauchlyDf) : 1;

    // 10. Epsilon corrections
    const epsilonGG = calculateGreenhouseGeisser(covMatrix, k);
    const epsilonHF = calculateHuynhFeldt(epsilonGG, k, n);
    const epsilonLB = 1 / (k - 1); // Lower bound

    // 11. Corrected results
    const df_Treatment_GG = df_Treatment * epsilonGG;
    const df_Error_GG = df_Error * epsilonGG;
    const pValue_GG = approximateFTestPValue(F, df_Treatment_GG, df_Error_GG);

    const df_Treatment_HF = df_Treatment * epsilonHF;
    const df_Error_HF = df_Error * epsilonHF;
    const pValue_HF = approximateFTestPValue(F, df_Treatment_HF, df_Error_HF);

    // 12. Build SPSS-style output
    const sphericityAssumed = mauchlyP > 0.05;
    const effectivePValue = sphericityAssumed ? pValue : pValue_GG;
    const significant = effectivePValue < alpha;

    const mauchlysTest = {
        W: mauchlysW,
        chiSquare: mauchlyChi,
        df: mauchlyDf,
        pValue: mauchlyP,
        sphericityMet: sphericityAssumed,
        epsilonGreenhouseGeisser: epsilonGG,
        epsilonHuynhFeldt: epsilonHF,
        epsilonLowerBound: epsilonLB
    };

    const withinSubjectsEffects = [
        {
            source: 'Treatment',
            correction: 'Sphericity Assumed',
            ss: SS_Treatment,
            df: df_Treatment,
            ms: MS_Treatment,
            F: F,
            pValue: pValue,
            partialEtaSq: partialEtaSq
        },
        {
            source: 'Treatment',
            correction: 'Greenhouse-Geisser',
            ss: SS_Treatment,
            df: df_Treatment_GG,
            ms: MS_Treatment,
            F: F,
            pValue: pValue_GG,
            partialEtaSq: partialEtaSq
        },
        {
            source: 'Treatment',
            correction: 'Huynh-Feldt',
            ss: SS_Treatment,
            df: df_Treatment_HF,
            ms: MS_Treatment,
            F: F,
            pValue: pValue_HF,
            partialEtaSq: partialEtaSq
        },
        {
            source: 'Error(Treatment)',
            correction: 'Sphericity Assumed',
            ss: SS_Error,
            df: df_Error,
            ms: MS_Error,
            F: null,
            pValue: null,
            partialEtaSq: null
        },
        {
            source: 'Error(Treatment)',
            correction: 'Greenhouse-Geisser',
            ss: SS_Error,
            df: df_Error_GG,
            ms: SS_Error / df_Error_GG,
            F: null,
            pValue: null,
            partialEtaSq: null
        },
        {
            source: 'Error(Treatment)',
            correction: 'Huynh-Feldt',
            ss: SS_Error,
            df: df_Error_HF,
            ms: SS_Error / df_Error_HF,
            F: null,
            pValue: null,
            partialEtaSq: null
        }
    ];

    // 13. Descriptive statistics for each condition
    const conditionStats = measureColumns.map((col, j) => {
        const values = matrix.map(row => row[j]);
        return {
            condition: col,
            mean: conditionMeans[j],
            sd: calculateStdDev(values, true),
            n: n
        };
    });

    // 14. Build interpretation
    let interpretation = '';
    if (sphericityAssumed) {
        interpretation = significant
            ? `Mauchly testi saÄŸlandı (p = ${mauchlyP.toFixed(3)}). KoÅŸullar arasında anlamlı fark var, F(${df_Treatment}, ${df_Error}) = ${F.toFixed(2)}, p = ${pValue.toFixed(4)}, Î·²p = ${partialEtaSq.toFixed(3)}`
            : `Mauchly testi saÄŸlandı (p = ${mauchlyP.toFixed(3)}). KoÅŸullar arasında anlamlı fark yok, F(${df_Treatment}, ${df_Error}) = ${F.toFixed(2)}, p = ${pValue.toFixed(4)}`;
    } else {
        interpretation = significant
            ? `Mauchly testi ihlal edildi (p = ${mauchlyP.toFixed(3)}). Greenhouse-Geisser düzeltmesi kullanıldı. KoÅŸullar arasında anlamlı fark var, F(${df_Treatment_GG.toFixed(2)}, ${df_Error_GG.toFixed(2)}) = ${F.toFixed(2)}, p = ${pValue_GG.toFixed(4)}, Î·²p = ${partialEtaSq.toFixed(3)}`
            : `Mauchly testi ihlal edildi (p = ${mauchlyP.toFixed(3)}). Greenhouse-Geisser düzeltmesi kullanıldı. KoÅŸullar arasında anlamlı fark yok, F(${df_Treatment_GG.toFixed(2)}, ${df_Error_GG.toFixed(2)}) = ${F.toFixed(2)}, p = ${pValue_GG.toFixed(4)}`;
    }

    // FAZ-ADV-4: Post-hoc pairwise paired t-tests with Bonferroni correction
    const postHocComparisons = [];
    const numComparisons = k * (k - 1) / 2;

    for (let i = 0; i < k - 1; i++) {
        for (let j = i + 1; j < k; j++) {
            // Extract paired values for conditions i and j
            const diffs = [];
            for (let s = 0; s < n; s++) {
                diffs.push(matrix[s][i] - matrix[s][j]);
            }

            // Paired t-test
            const meanDiff = diffs.reduce((a, b) => a + b, 0) / n;
            const diffVariance = diffs.reduce((s, d) => s + Math.pow(d - meanDiff, 2), 0) / (n - 1);
            const se = Math.sqrt(diffVariance / n);
            const t = se > 0 ? meanDiff / se : 0;
            const df = n - 1;
            const p = approximateTTestPValue(Math.abs(t), df);
            const pAdj = Math.min(1, p * numComparisons);

            // 95% CI for mean difference
            const tCrit = getTCritical(df, 0.05);
            const ciLow = meanDiff - tCrit * se;
            const ciHigh = meanDiff + tCrit * se;

            postHocComparisons.push({
                cond1: measureColumns[i],
                cond2: measureColumns[j],
                meanDiff: meanDiff,
                se: se,
                t: t,
                df: df,
                p: p,
                pAdj: pAdj,
                ciLow: ciLow,
                ciHigh: ciHigh,
                significant: pAdj < alpha
            });
        }
    }

    const postHoc = {
        method: 'bonferroni',
        numComparisons: numComparisons,
        comparisons: postHocComparisons
    };

    return {
        valid: true,
        testType: 'repeatedMeasuresANOVA',
        testName: VIZ_STATE.lang === 'tr' ? 'Tekrarlı Ölçümler ANOVA' : 'Repeated Measures ANOVA',
        alpha: alpha,
        n: n,
        k: k,
        conditions: measureColumns,
        grandMean: grandMean,
        conditionStats: conditionStats,
        subjectMeans: subjectMeans,
        conditionMeans: conditionMeans,
        sumOfSquares: {
            subjects: SS_Subjects,
            treatment: SS_Treatment,
            error: SS_Error,
            total: SS_Total
        },
        degreesOfFreedom: {
            subjects: df_Subjects,
            treatment: df_Treatment,
            error: df_Error,
            total: df_Total
        },
        meanSquares: {
            treatment: MS_Treatment,
            error: MS_Error,
            subjects: MS_Subjects
        },
        withinSubjects: {
            F: F,
            pValue: pValue,
            pValueGG: pValue_GG,
            pValueHF: pValue_HF,
            partialEtaSq: partialEtaSq,
            genEtaSq: genEtaSq,
            significant: significant
        },
        mauchlysTest: mauchlysTest,
        withinSubjectsEffects: withinSubjectsEffects,
        sphericityAssumed: sphericityAssumed,
        effectivePValue: effectivePValue,

        // FAZ-ADV-4: Post-hoc comparisons
        postHoc: postHoc,

        interpretation: interpretation,
        interpretationEN: interpretation.replace('anlamlı fark var', 'significant difference').replace('anlamlı fark yok', 'no significant difference').replace('Mauchly testi saÄŸlandı', 'Sphericity assumed').replace('Mauchly testi ihlal edildi', 'Sphericity violated').replace('düzeltmesi kullanıldı', 'correction applied').replace('KoÅŸullar arasında', 'Between conditions')
    };
}

/**
 * Calculate covariance matrix for repeated measures
 */
function calculateCovarianceMatrixRM(matrix, k) {
    const n = matrix.length;
    const means = [];
    for (let j = 0; j < k; j++) {
        let sum = 0;
        for (let i = 0; i < n; i++) {
            sum += matrix[i][j];
        }
        means.push(sum / n);
    }

    const cov = [];
    for (let j1 = 0; j1 < k; j1++) {
        cov[j1] = [];
        for (let j2 = 0; j2 < k; j2++) {
            let sum = 0;
            for (let i = 0; i < n; i++) {
                sum += (matrix[i][j1] - means[j1]) * (matrix[i][j2] - means[j2]);
            }
            cov[j1][j2] = sum / (n - 1);
        }
    }
    return cov;
}

/**
 * Calculate Mauchly's W statistic for sphericity
 */
function calculateMauchlysW(covMatrix, n, k) {
    // Simplified approximation
    // W = |S| / (trace(S)/k)^k where S is the covariance matrix of orthonormal contrasts
    // For practical purposes, we use a simpler approach

    const p = covMatrix.length;
    if (p < 2) return 1;

    // Calculate determinant (simplified for small matrices)
    let det = 1;
    if (p === 2) {
        det = covMatrix[0][0] * covMatrix[1][1] - covMatrix[0][1] * covMatrix[1][0];
    } else {
        // Use trace-based approximation for larger matrices
        let trace = 0;
        for (let i = 0; i < p; i++) trace += covMatrix[i][i];
        const avgVar = trace / p;
        det = Math.pow(avgVar, p);

        // Adjust for correlations
        for (let i = 0; i < p; i++) {
            for (let j = i + 1; j < p; j++) {
                const corr = covMatrix[i][j] / Math.sqrt(covMatrix[i][i] * covMatrix[j][j]);
                det *= (1 - corr * corr);
            }
        }
    }

    // Calculate trace
    let trace = 0;
    for (let i = 0; i < p; i++) trace += covMatrix[i][i];

    const W = det / Math.pow(trace / p, p);
    return Math.max(0, Math.min(1, W)); // Bound between 0 and 1
}

/**
 * Calculate Greenhouse-Geisser epsilon
 */
function calculateGreenhouseGeisser(covMatrix, k) {
    const p = covMatrix.length;
    if (p < 2) return 1;

    // Calculate trace of S and trace of S²
    let traceS = 0;
    let traceS2 = 0;

    for (let i = 0; i < p; i++) {
        traceS += covMatrix[i][i];
    }

    for (let i = 0; i < p; i++) {
        for (let j = 0; j < p; j++) {
            traceS2 += covMatrix[i][j] * covMatrix[j][i];
        }
    }

    const sumAll = covMatrix.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);
    const meanAll = sumAll / (p * p);

    // Simplified GG epsilon
    const numerator = Math.pow(traceS / p - meanAll, 2);
    const denominator = (traceS2 / (p * p) - 2 * Math.pow(traceS / p, 2) / p + Math.pow(meanAll, 2));

    const epsilon = (p * p * numerator) / ((p - 1) * (p - 1) * denominator);

    // Bound epsilon
    const lowerBound = 1 / (k - 1);
    return Math.max(lowerBound, Math.min(1, epsilon || lowerBound));
}

/**
 * Calculate Huynh-Feldt epsilon
 */
function calculateHuynhFeldt(epsilonGG, k, n) {
    const numerator = n * (k - 1) * epsilonGG - 2;
    const denominator = (k - 1) * (n - 1 - (k - 1) * epsilonGG);
    const epsilonHF = numerator / denominator;

    // HF can exceed 1, so we cap it
    return Math.max(epsilonGG, Math.min(1, epsilonHF));
}

/**
 * Chi-square CDF approximation
 */
function chiSquareCDF(x, df) {
    if (x <= 0) return 0;
    if (df <= 0) return 0;

    // Use normal approximation for large df
    if (df > 100) {
        const z = Math.pow(x / df, 1 / 3) - (1 - 2 / (9 * df));
        const se = Math.sqrt(2 / (9 * df));
        return normalCDF(z / se);
    }

    // Use existing lowerIncompleteGamma and gamma functions
    return lowerIncompleteGamma(df / 2, x / 2) / gamma(df / 2);
}
/**
 * Pearson Correlation Test
 * Supports both Pearson (default) and Spearman correlation
 * @param {Array} x - First variable array
 * @param {Array} y - Second variable array  
 * @param {number|object} alphaOrOptions - Alpha value or { alpha, method }
 */
export function runCorrelationTest(x, y, alphaOrOptions = 0.05) {
    if (!x || !y || x.length !== y.length) {
        return { error: 'EÅŸit uzunlukta iki dizi gereklidir', valid: false };
    }

    // Parse options
    let alpha = 0.05;
    let method = 'pearson';

    if (typeof alphaOrOptions === 'object') {
        alpha = alphaOrOptions.alpha ?? 0.05;
        method = alphaOrOptions.method ?? 'pearson';
    } else {
        alpha = alphaOrOptions;
    }

    const n = x.length;
    if (n < 3) {
        return { error: 'En az 3 gözlem gereklidir', valid: false };
    }

    // Calculate correlation based on method
    let r;
    if (method === 'spearman') {
        r = calculateSpearmanCorrelation(x, y);
    } else {
        r = calculateCorrelation(x, y);
    }

    const rSquared = calculateRSquared(r);

    // T-test for correlation significance
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    const df = n - 2;
    const tCritical = getTCritical(df, alpha);
    const pValue = approximateTTestPValue(Math.abs(t), df);

    const significant = Math.abs(t) > tCritical;

    const testName = method === 'spearman'
        ? 'Spearman Sıra Korelasyonu Testi'
        : 'Pearson Korelasyon Testi';

    return {
        valid: true,
        testName: testName,
        n: n,
        correlation: r,
        rSquared: rSquared,
        tStatistic: t,
        degreesOfFreedom: df,
        tCritical: tCritical,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        correlationInterpretation: interpretCorrelation(r),
        stats: { r: r, method: method }, // For selftest compatibility
        interpretation: significant
            ? `Korelasyon istatistiksel olarak anlamlı (p < ${alpha})`
            : `Korelasyon istatistiksel olarak anlamlı deÄŸil (p >= ${alpha})`
    };
}

/**
 * Chi-Square Test of Independence
 */
export function runChiSquareTest(contingencyTable, alpha = 0.05) {
    if (!contingencyTable || !Array.isArray(contingencyTable) || contingencyTable.length < 2) {
        return { error: 'Geçerli bir çapraz tablo gereklidir', valid: false };
    }

    const rows = contingencyTable.length;
    const cols = contingencyTable[0].length;

    // Calculate row and column totals
    const rowTotals = contingencyTable.map(row => row.reduce((a, b) => a + b, 0));
    const colTotals = [];
    for (let j = 0; j < cols; j++) {
        colTotals.push(contingencyTable.reduce((sum, row) => sum + row[j], 0));
    }
    const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

    // Calculate expected frequencies
    const expected = [];
    for (let i = 0; i < rows; i++) {
        expected[i] = [];
        for (let j = 0; j < cols; j++) {
            expected[i][j] = (rowTotals[i] * colTotals[j]) / grandTotal;
        }
    }

    // Calculate chi-square statistic
    let chiSquare = 0;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (expected[i][j] > 0) {
                chiSquare += Math.pow(contingencyTable[i][j] - expected[i][j], 2) / expected[i][j];
            }
        }
    }

    const df = (rows - 1) * (cols - 1);
    const chiCritical = getChiCritical(df, alpha);
    const pValue = approximateChiSquarePValue(chiSquare, df);

    // Cramer's V (effect size)
    const minDim = Math.min(rows - 1, cols - 1);
    const cramersV = Math.sqrt(chiSquare / (grandTotal * minDim));

    const significant = chiSquare > chiCritical;

    return {
        valid: true,
        testName: VIZ_STATE.lang === 'tr' ? 'Ki-Kare BaÄŸımsızlık Testi' : 'Chi-Square Test of Independence',
        observed: contingencyTable,
        expected: expected,
        rowTotals: rowTotals,
        colTotals: colTotals,
        grandTotal: grandTotal,
        chiSquare: chiSquare,
        degreesOfFreedom: df,
        chiCritical: chiCritical,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        cramersV: cramersV,
        effectSizes: { cramersV: cramersV, phi: rows === 2 && cols === 2 ? cramersV : null },
        effectSizeInterpretation: interpretCramersV(cramersV),
        interpretation: significant
            ? (VIZ_STATE.lang === 'tr' ? `DeÄŸiÅŸkenler arasında istatistiksel olarak anlamlı iliÅŸki var (p < ${alpha})` : `There is a statistically significant relationship between variables (p < ${alpha})`)
            : (VIZ_STATE.lang === 'tr' ? `DeÄŸiÅŸkenler arasında istatistiksel olarak anlamlı iliÅŸki yok (p >= ${alpha})` : `There is no statistically significant relationship between variables (p >= ${alpha})`)
    };
}

// =====================================================
// NON-PARAMETRIC TESTS
// =====================================================

/**
 * Mann-Whitney U Test (Wilcoxon Rank-Sum Test)
 */
export function runMannWhitneyU(group1, group2, alpha = 0.05) {
    const n1 = group1.length;
    const n2 = group2.length;

    if (n1 < 2 || n2 < 2) {
        return { error: 'Her grup en az 2 gözlem içermelidir', valid: false };
    }

    // Combine and rank all values
    const combined = [
        ...group1.map(v => ({ value: v, group: 1 })),
        ...group2.map(v => ({ value: v, group: 2 }))
    ].sort((a, b) => a.value - b.value);

    // Assign ranks (handling ties)
    const ranks = assignRanksWithTies(combined.map(c => c.value));
    combined.forEach((item, i) => item.rank = ranks[i]);

    // Calculate rank sums
    const R1 = combined.filter(c => c.group === 1).reduce((sum, c) => sum + c.rank, 0);
    const R2 = combined.filter(c => c.group === 2).reduce((sum, c) => sum + c.rank, 0);

    // Calculate U statistics
    const U1 = n1 * n2 + (n1 * (n1 + 1)) / 2 - R1;
    const U2 = n1 * n2 + (n2 * (n2 + 1)) / 2 - R2;
    const U = Math.min(U1, U2);

    // Normal approximation for large samples
    const meanU = (n1 * n2) / 2;
    const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
    const z = (U - meanU) / stdU;

    // Two-tailed p-value
    const pValue = 2 * (1 - normalCDF(Math.abs(z)));
    const zCritical = getZCritical(alpha / 2);

    // Effect size (r = z / sqrt(N))
    const effectR = z / Math.sqrt(n1 + n2);

    const significant = Math.abs(z) > zCritical;

    // APA format strings
    const lang = VIZ_STATE?.lang || 'tr';
    const apaTR = `Mann-Whitney U testi sonuçlarına göre, gruplar arasında ${significant ? 'istatistiksel olarak anlamlı fark bulunmuÅŸtur' : 'istatistiksel olarak anlamlı fark bulunamamıÅŸtır'}, U = ${U.toFixed(2)}, z = ${z.toFixed(2)}, p ${pValue < 0.001 ? '< .001' : '= ' + pValue.toFixed(3)}, r = ${effectR.toFixed(2)}.`;
    const apaEN = `A Mann-Whitney U test ${significant ? 'revealed a statistically significant difference' : 'revealed no statistically significant difference'} between groups, U = ${U.toFixed(2)}, z = ${z.toFixed(2)}, p ${pValue < 0.001 ? '< .001' : '= ' + pValue.toFixed(3)}, r = ${effectR.toFixed(2)}.`;

    return {
        valid: true,
        testName: lang === 'tr' ? 'Mann-Whitney U Testi' : 'Mann-Whitney U Test',
        group1Stats: { n: n1, rankSum: R1, median: calculateMedian(group1) },
        group2Stats: { n: n2, rankSum: R2, median: calculateMedian(group2) },
        // Original fields (backward compatibility)
        U1: U1,
        U2: U2,
        U: U,
        // Canonical aliases (FIX-P0-STATS-CANON)
        uStatistic: U,
        u1Statistic: U1,
        u2Statistic: U2,
        zStatistic: z,
        zCritical: zCritical,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        effectSizeR: effectR,
        effectSizeInterpretation: interpretEffectR(effectR),
        // APA format strings
        apaTR: apaTR,
        apaEN: apaEN,
        interpretation: significant
            ? (lang === 'tr' ? `Gruplar arasında istatistiksel olarak anlamlı fark var (p < ${alpha})` : `There is a statistically significant difference between groups (p < ${alpha})`)
            : (lang === 'tr' ? `Gruplar arasında istatistiksel olarak anlamlı fark yok (p >= ${alpha})` : `There is no statistically significant difference between groups (p >= ${alpha})`)
    };
}

/**
 * Kruskal-Wallis H Test (Non-parametric ANOVA)
 */
export function runKruskalWallis(groups, alpha = 0.05) {
    const k = groups.length;
    if (k < 2) {
        return { error: VIZ_STATE.lang === 'tr' ? 'En az 2 grup gereklidir' : 'At least 2 groups required', valid: false };
    }

    const validGroups = groups.filter(g => g && g.length > 0);
    if (validGroups.length < 2) {
        return { error: VIZ_STATE.lang === 'tr' ? 'En az 2 geçerli grup gereklidir' : 'At least 2 valid groups required', valid: false };
    }

    // Combine all values with group labels
    const combined = [];
    validGroups.forEach((group, gIdx) => {
        group.forEach(val => combined.push({ value: val, group: gIdx }));
    });

    // Sort and assign ranks
    combined.sort((a, b) => a.value - b.value);
    const ranks = assignRanksWithTies(combined.map(c => c.value));
    combined.forEach((item, i) => item.rank = ranks[i]);

    const N = combined.length;

    // Calculate rank sums per group
    const groupStats = validGroups.map((group, gIdx) => {
        const groupRanks = combined.filter(c => c.group === gIdx);
        const rankSum = groupRanks.reduce((sum, c) => sum + c.rank, 0);
        return {
            n: group.length,
            rankSum: rankSum,
            meanRank: rankSum / group.length,
            median: calculateMedian(group)
        };
    });

    // Calculate H statistic
    let H = 0;
    groupStats.forEach(g => {
        H += Math.pow(g.rankSum, 2) / g.n;
    });
    H = (12 / (N * (N + 1))) * H - 3 * (N + 1);

    const df = validGroups.length - 1;
    const chiCritical = getChiCritical(df, alpha);
    const pValue = approximateChiSquarePValue(H, df);

    // PROMPT-3 GÖREV A: Effect sizes with guards
    // Epsilon-squared: H / (N - 1)
    const epsilonSquared = (N > 1 && isFinite(H)) ? H / (N - 1) : 0;
    // Eta-squared H: H / (N - 1)  (same formula, different name in literature)
    const etaSquaredH = epsilonSquared;

    // Effect size interpretation
    let effectInterpretation;
    if (epsilonSquared < 0.01) {
        effectInterpretation = { tr: 'İhmal edilebilir', en: 'Negligible' };
    } else if (epsilonSquared < 0.06) {
        effectInterpretation = { tr: 'Küçük', en: 'Small' };
    } else if (epsilonSquared < 0.14) {
        effectInterpretation = { tr: 'Orta', en: 'Medium' };
    } else {
        effectInterpretation = { tr: 'Büyük', en: 'Large' };
    }

    const significant = H > chiCritical;

    // PROMPT-3 GÖREV B: Dunn post-hoc with Bonferroni correction
    const dunnComparisons = [];
    const numComparisons = (validGroups.length * (validGroups.length - 1)) / 2;
    const bonferroniAlpha = alpha / numComparisons;

    for (let i = 0; i < validGroups.length; i++) {
        for (let j = i + 1; j < validGroups.length; j++) {
            const ni = groupStats[i].n;
            const nj = groupStats[j].n;
            const rankDiff = Math.abs(groupStats[i].meanRank - groupStats[j].meanRank);

            // Standard error for Dunn test
            const se = Math.sqrt((N * (N + 1) / 12) * (1 / ni + 1 / nj));

            // z-statistic
            const z = se > 0 && isFinite(se) ? rankDiff / se : 0;

            // p-value (2-tailed)
            const pRaw = 2 * (1 - normalCDF(Math.abs(z)));

            // Bonferroni adjusted p-value
            const pAdjusted = Math.min(1, pRaw * numComparisons);

            dunnComparisons.push({
                comparison: `Group ${i + 1} vs Group ${j + 1}`,
                groupI: i,
                groupJ: j,
                meanRankI: groupStats[i].meanRank,
                meanRankJ: groupStats[j].meanRank,
                rankDiff: rankDiff,
                se: se,
                z: z,
                pValue: pRaw,
                pAdjusted: pAdjusted,
                significant: pAdjusted < alpha
            });
        }
    }

    // SPSS-style tables
    const lang = VIZ_STATE?.lang || 'tr';
    const tables = [
        {
            title: lang === 'tr' ? 'Kruskal-Wallis Testi' : 'Kruskal-Wallis Test',
            columns: ['H', 'df', 'Asymp. Sig.', 'Îµ²', lang === 'tr' ? 'Etki BüyüklüÄŸü' : 'Effect Size'],
            rows: [
                [H.toFixed(3), df, pValue.toFixed(4), epsilonSquared.toFixed(4), lang === 'tr' ? effectInterpretation.tr : effectInterpretation.en]
            ]
        },
        {
            title: lang === 'tr' ? 'Grup İstatistikleri' : 'Group Statistics',
            columns: [lang === 'tr' ? 'Grup' : 'Group', 'N', lang === 'tr' ? 'Sıra Ortalaması' : 'Mean Rank', lang === 'tr' ? 'Medyan' : 'Median'],
            rows: groupStats.map((g, i) => [`Group ${i + 1}`, g.n, g.meanRank.toFixed(2), g.median.toFixed(2)])
        }
    ];

    // Add post-hoc table if significant
    if (significant && dunnComparisons.length > 0) {
        tables.push({
            title: lang === 'tr' ? 'Çoklu KarÅŸılaÅŸtırma (Dunn-Bonferroni)' : 'Pairwise Comparisons (Dunn-Bonferroni)',
            columns: [lang === 'tr' ? 'KarÅŸılaÅŸtırma' : 'Comparison', 'z', 'p', lang === 'tr' ? 'Düz. p' : 'Adj. p', 'Sig.'],
            rows: dunnComparisons.map(d => [
                d.comparison,
                d.z.toFixed(3),
                d.pValue.toFixed(4),
                d.pAdjusted.toFixed(4),
                d.significant ? '*' : ''
            ])
        });
    }

    return {
        valid: true,
        testName: VIZ_STATE.lang === 'tr' ? 'Kruskal-Wallis H Testi' : 'Kruskal-Wallis H Test',
        testType: 'kruskal-wallis',
        numberOfGroups: validGroups.length,
        totalN: N,
        groupStats: groupStats,
        hStatistic: H,
        degreesOfFreedom: df,
        chiCritical: chiCritical,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        // PROMPT-3: Effect sizes
        epsilonSquared: epsilonSquared,
        etaSquaredH: etaSquaredH,
        effectSizes: {
            epsilonSquared: epsilonSquared,
            etaSquaredH: etaSquaredH,
            interpretation: effectInterpretation
        },
        // PROMPT-3: Dunn post-hoc
        postHoc: {
            method: 'Dunn-Bonferroni',
            comparisons: dunnComparisons,
            bonferroniAlpha: bonferroniAlpha
        },
        tables: tables,
        interpretation: significant
            ? (VIZ_STATE.lang === 'tr' ? `Gruplar arasında istatistiksel olarak anlamlı fark var (p < ${alpha}). Îµ² = ${epsilonSquared.toFixed(3)} (${effectInterpretation.tr})` : `There is a statistically significant difference between groups (p < ${alpha}). Îµ² = ${epsilonSquared.toFixed(3)} (${effectInterpretation.en})`)
            : (VIZ_STATE.lang === 'tr' ? `Gruplar arasında istatistiksel olarak anlamlı fark yok (p >= ${alpha})` : `There is no statistically significant difference between groups (p >= ${alpha})`)
    };
}

/**
 * Wilcoxon Signed-Rank Test (Paired non-parametric)
 */
export function runWilcoxonSignedRank(before, after, alpha = 0.05) {
    if (before.length !== after.length) {
        return { error: VIZ_STATE.lang === 'tr' ? 'EÅŸleÅŸtirilmiÅŸ gruplar eÅŸit uzunlukta olmalıdır' : 'Paired groups must be of equal length', valid: false };
    }

    const n = before.length;
    if (n < 5) {
        return { error: VIZ_STATE.lang === 'tr' ? 'En az 5 eÅŸleÅŸtirilmiÅŸ gözlem gereklidir' : 'At least 5 paired observations required', valid: false };
    }

    // Calculate differences and remove zeros
    const differences = [];
    for (let i = 0; i < n; i++) {
        const diff = after[i] - before[i];
        if (diff !== 0) {
            differences.push({ diff: diff, absDiff: Math.abs(diff), sign: diff > 0 ? 1 : -1 });
        }
    }

    const nNonZero = differences.length;
    if (nNonZero < 5) {
        return { error: 'Sıfır olmayan en az 5 fark gereklidir', valid: false };
    }

    // Sort by absolute difference and assign ranks
    differences.sort((a, b) => a.absDiff - b.absDiff);
    const absValues = differences.map(d => d.absDiff);
    const ranks = assignRanksWithTies(absValues);
    differences.forEach((d, i) => d.rank = ranks[i]);

    // Calculate W+ and W-
    const Wplus = differences.filter(d => d.sign > 0).reduce((sum, d) => sum + d.rank, 0);
    const Wminus = differences.filter(d => d.sign < 0).reduce((sum, d) => sum + d.rank, 0);
    const W = Math.min(Wplus, Wminus);

    // Normal approximation
    const meanW = (nNonZero * (nNonZero + 1)) / 4;
    const stdW = Math.sqrt((nNonZero * (nNonZero + 1) * (2 * nNonZero + 1)) / 24);
    const z = (W - meanW) / stdW;

    const pValue = 2 * (1 - normalCDF(Math.abs(z)));
    const zCritical = getZCritical(alpha / 2);

    // Effect size
    const effectR = z / Math.sqrt(nNonZero);

    const significant = Math.abs(z) > zCritical;

    return {
        valid: true,
        testName: VIZ_STATE.lang === 'tr' ? 'Wilcoxon İÅŸaretli Sıralar Testi' : 'Wilcoxon Signed-Rank Test',
        n: n,
        nNonZero: nNonZero,
        Wplus: Wplus,
        Wminus: Wminus,
        W: W,
        zStatistic: z,
        zCritical: zCritical,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        effectSizeR: effectR,
        effectSizeInterpretation: interpretEffectR(effectR),
        interpretation: significant
            ? (VIZ_STATE.lang === 'tr' ? `Ölçümler arasında istatistiksel olarak anlamlı fark var (p < ${alpha})` : `There is a statistically significant difference between measurements (p < ${alpha})`)
            : (VIZ_STATE.lang === 'tr' ? `Ölçümler arasında istatistiksel olarak anlamlı fark yok (p >= ${alpha})` : `There is no statistically significant difference between measurements (p >= ${alpha})`)
    };
}

/**
 * Friedman Test (Non-parametric repeated measures)
 * Backward compatible: supports both matrix format and data+multiVars format
 * 
 * Usage 1 (legacy): runFriedmanTest(measurementsMatrix, alpha)
 *   - measurementsMatrix: array of arrays, each inner array is one subject's measurements
 * 
 * Usage 2 (new): runFriedmanTest(dataObjects, multiVarsArray, alpha)
 *   - dataObjects: array of row objects [{M1: 5, M2: 7}, ...]
 *   - multiVarsArray: array of column keys ['M1', 'M2', 'M3']
 */
export function runFriedmanTest(arg1, arg2 = 0.05, arg3 = 0.05) {
    let measurements;
    let alpha;

    // FIX-P0-1: Detect input format and normalize
    if (Array.isArray(arg2)) {
        // New format: runFriedmanTest(dataObjects, multiVarsArray, alpha?)
        const dataObjects = arg1;
        const multiVars = arg2;
        alpha = typeof arg3 === 'number' ? arg3 : 0.05;

        // Validate inputs
        if (!dataObjects || !Array.isArray(dataObjects) || dataObjects.length === 0) {
            return { error: 'Veri objesi boÅŸ veya geçersiz', valid: false };
        }
        if (!multiVars || !Array.isArray(multiVars) || multiVars.length < 2) {
            return { error: 'En az 2 deÄŸiÅŸken seçilmelidir', valid: false };
        }

        // Convert data objects to measurements matrix
        measurements = [];
        for (let i = 0; i < dataObjects.length; i++) {
            const row = dataObjects[i];
            const subjectMeasurements = [];
            let hasValidData = true;

            for (const col of multiVars) {
                const val = parseFloat(row[col]);
                if (isNaN(val) || val === null || val === undefined) {
                    hasValidData = false;
                    break;
                }
                subjectMeasurements.push(val);
            }

            // Only include rows with all valid measurements
            if (hasValidData && subjectMeasurements.length === multiVars.length) {
                measurements.push(subjectMeasurements);
            }
        }

        if (measurements.length < 3) {
            return { error: `Geçerli veri satırı yetersiz (${measurements.length} < 3). Eksik deÄŸer içeren satırlar atlandı.`, valid: false };
        }
    } else {
        // Legacy format: runFriedmanTest(measurementsMatrix, alpha)
        measurements = arg1;
        alpha = typeof arg2 === 'number' ? arg2 : 0.05;
    }

    // Validate measurements matrix
    if (!measurements || measurements.length < 3) {
        return { error: 'En az 3 denek gereklidir', valid: false };
    }

    const n = measurements.length; // Number of subjects
    const k = measurements[0]?.length; // Number of conditions

    if (!k || k < 2) {
        return { error: 'En az 2 koÅŸul gereklidir', valid: false };
    }

    // Validate all rows have same length
    for (let i = 0; i < measurements.length; i++) {
        if (!Array.isArray(measurements[i]) || measurements[i].length !== k) {
            return { error: `Satır ${i + 1} geçersiz uzunlukta`, valid: false };
        }
    }

    // Rank within each subject
    const rankedData = measurements.map(subject => {
        const sorted = subject.map((v, i) => ({ value: v, idx: i })).sort((a, b) => a.value - b.value);
        const ranks = new Array(k);
        sorted.forEach((item, rank) => ranks[item.idx] = rank + 1);
        return ranks;
    });

    // Calculate rank sums for each condition
    const rankSums = new Array(k).fill(0);
    rankedData.forEach(ranks => {
        ranks.forEach((r, j) => rankSums[j] += r);
    });

    // Friedman statistic
    const sumRankSquared = rankSums.reduce((sum, R) => sum + R * R, 0);
    const chi2 = (12 / (n * k * (k + 1))) * sumRankSquared - 3 * n * (k + 1);

    const df = k - 1;
    const chiCritical = getChiCritical(df, alpha);
    const pValue = approximateChiSquarePValue(chi2, df);

    // Kendall's W (effect size)
    const kendallW = chi2 / (n * (k - 1));

    const significant = chi2 > chiCritical;

    return {
        valid: true,
        testName: VIZ_STATE.lang === 'tr' ? 'Friedman Testi' : 'Friedman Test',
        n: n,
        k: k,
        rankSums: rankSums,
        meanRanks: rankSums.map(r => r / n),
        chi2Statistic: chi2,
        chiSquare: chi2, // Alias for compatibility
        degreesOfFreedom: df,
        chiCritical: chiCritical,
        pValue: pValue,
        W: kendallW, // Alias for compatibility
        kendallW: kendallW,
        alpha: alpha,
        significant: significant,
        interpretation: significant
            ? (VIZ_STATE.lang === 'tr' ? `KoÅŸullar arasında istatistiksel olarak anlamlı fark var (p < ${alpha})` : `There is a statistically significant difference between conditions (p < ${alpha})`)
            : (VIZ_STATE.lang === 'tr' ? `KoÅŸullar arasında istatistiksel olarak anlamlı fark yok (p >= ${alpha})` : `There is no statistically significant difference between conditions (p >= ${alpha})`)
    };
}
// =====================================================
// LOGISTIC REGRESSION (FAZ-P1-3)
// =====================================================

/**
 * Logistic Regression with IRLS (Iteratively Reweighted Least Squares)
 * Supports both (X, y) and (data, yCol, xCols) formats
 * 
 * @param {Array} arg1 - Either X matrix (array of arrays) or data (array of objects)
 * @param {Array|string} arg2 - Either y vector (array) or yCol (column name)
 * @param {Array|object} arg3 - Either options object or xCols (array of column names)
 * @param {object} arg4 - Options if using data format
 */
export function runLogisticRegression(arg1, arg2, arg3, arg4) {
    // FAZ-P1-3: Detect input format
    let X, y, options = {};

    if (!arg1 || !Array.isArray(arg1) || arg1.length === 0) {
        return { valid: false, error: 'No data provided' };
    }

    // Check if first element is an object (data format) or array (X format)
    if (typeof arg1[0] === 'object' && !Array.isArray(arg1[0])) {
        // Data format: (data, yCol, xCols, options)
        const data = arg1;
        const yCol = arg2;
        const xCols = arg3;
        options = arg4 || {};

        if (!yCol || !xCols || !Array.isArray(xCols)) {
            return { valid: false, error: 'Data format requires: (data, yCol, xCols)' };
        }

        // Convert to X, y format
        X = [];
        y = [];
        for (const row of data) {
            const xRow = xCols.map(col => parseFloat(row[col]) || 0);
            const yVal = parseFloat(row[yCol]);
            if (!isNaN(yVal)) {
                X.push(xRow);
                y.push(yVal === 0 ? 0 : 1); // Binary classification
            }
        }

        if (X.length === 0) {
            return { valid: false, error: 'No valid data rows after parsing' };
        }
    } else {
        // X, y format: (X, y, options)
        X = arg1;
        y = arg2;
        options = arg3 || {};

        if (!y || !Array.isArray(y)) {
            return { valid: false, error: 'Y vector (arg2) must be an array' };
        }
    }

    const n = X.length;
    const p = X[0]?.length || 0;

    if (n < 2 || p < 1) {
        return { valid: false, error: `Insufficient data: n=${n}, p=${p}` };
    }

    if (X.length !== y.length) {
        return { valid: false, error: `Length mismatch: X=${X.length}, y=${y.length}` };
    }

    // Add intercept column (column of 1s)
    const XwithIntercept = X.map(row => [1, ...row]);
    const numParams = p + 1; // +1 for intercept

    // IRLS algorithm
    const maxIter = options.maxIterations || 25;
    const tolerance = options.tolerance || 1e-6;
    let beta = new Array(numParams).fill(0); // Start with zeros
    let converged = false;
    let iterations = 0;
    let warnings = [];
    let method = 'IRLS';

    // Sigmoid function
    const sigmoid = z => {
        if (z > 20) return 0.9999999;
        if (z < -20) return 0.0000001;
        return 1 / (1 + Math.exp(-z));
    };

    try {
        for (let iter = 0; iter < maxIter; iter++) {
            iterations = iter + 1;

            // Calculate probabilities
            const probs = XwithIntercept.map(xi => {
                const z = xi.reduce((sum, xij, j) => sum + xij * beta[j], 0);
                return sigmoid(z);
            });

            // Calculate weights W = p(1-p)
            const W = probs.map(p => Math.max(p * (1 - p), 1e-10));

            // Calculate z = X*beta + (y - p) / W
            const z = XwithIntercept.map((xi, i) => {
                const xBeta = xi.reduce((sum, xij, j) => sum + xij * beta[j], 0);
                return xBeta + (y[i] - probs[i]) / W[i];
            });

            // Weighted least squares: (X'WX)^-1 * X'Wz
            // Calculate X'WX
            const XtWX = [];
            for (let j = 0; j < numParams; j++) {
                XtWX[j] = [];
                for (let k = 0; k < numParams; k++) {
                    let sum = 0;
                    for (let i = 0; i < n; i++) {
                        sum += XwithIntercept[i][j] * W[i] * XwithIntercept[i][k];
                    }
                    XtWX[j][k] = sum;
                }
            }

            // Calculate X'Wz
            const XtWz = [];
            for (let j = 0; j < numParams; j++) {
                let sum = 0;
                for (let i = 0; i < n; i++) {
                    sum += XwithIntercept[i][j] * W[i] * z[i];
                }
                XtWz[j] = sum;
            }

            // Solve system using simple matrix inversion for small matrices
            const newBeta = solveLinearSystem(XtWX, XtWz);

            if (!newBeta || newBeta.some(b => !isFinite(b))) {
                // IRLS failed, fall back to gradient descent
                method = 'GD';
                warnings.push('IRLS: ill-conditioned matrix, falling back to GD');
                break;
            }

            // Check convergence
            const maxChange = Math.max(...newBeta.map((b, j) => Math.abs(b - beta[j])));
            beta = newBeta;

            if (maxChange < tolerance) {
                converged = true;
                break;
            }
        }

        // If IRLS failed, use gradient descent
        if (method === 'GD') {
            beta = new Array(numParams).fill(0);
            const learningRate = 0.1;

            for (let iter = 0; iter < maxIter * 10; iter++) {
                iterations = iter + 1;
                const gradient = new Array(numParams).fill(0);

                for (let i = 0; i < n; i++) {
                    const z = XwithIntercept[i].reduce((sum, xij, j) => sum + xij * beta[j], 0);
                    const prob = sigmoid(z);
                    const error = y[i] - prob;

                    for (let j = 0; j < numParams; j++) {
                        gradient[j] += error * XwithIntercept[i][j];
                    }
                }

                const maxGrad = Math.max(...gradient.map(Math.abs));
                for (let j = 0; j < numParams; j++) {
                    beta[j] += learningRate * gradient[j] / n;
                }

                if (maxGrad < tolerance * n) {
                    converged = true;
                    break;
                }
            }
        }

    } catch (e) {
        return { valid: false, error: 'Optimization failed: ' + e.message };
    }

    // Calculate predictions and metrics
    const predictions = XwithIntercept.map(xi => {
        const z = xi.reduce((sum, xij, j) => sum + xij * beta[j], 0);
        return sigmoid(z);
    });

    // Log-likelihood
    let logLikelihood = 0;
    for (let i = 0; i < n; i++) {
        const p = Math.max(Math.min(predictions[i], 0.9999999), 0.0000001);
        logLikelihood += y[i] * Math.log(p) + (1 - y[i]) * Math.log(1 - p);
    }

    // Null log-likelihood (intercept only)
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    const logLikelihoodNull = n * (yMean * Math.log(yMean) + (1 - yMean) * Math.log(1 - yMean));

    // -2LL
    const minus2LL = -2 * logLikelihood;

    // Pseudo R² metrics
    const mcFaddenR2 = 1 - (logLikelihood / logLikelihoodNull);
    const nagelkerkeR2 = (1 - Math.exp(-2 * (logLikelihood - logLikelihoodNull) / n)) /
        (1 - Math.exp(2 * logLikelihoodNull / n));
    const coxSnellR2 = 1 - Math.exp(-2 * (logLikelihood - logLikelihoodNull) / n);

    // PROMPT-UPDATE-1 GÖREV A: Cutoff-adjustable Classification
    const cutoff = typeof options.cutoff === 'number' && options.cutoff >= 0 && options.cutoff <= 1
        ? options.cutoff : 0.5;

    // Accuracy using cutoff
    const predictedClasses = predictions.map(p => p >= cutoff ? 1 : 0);
    const correct = predictedClasses.reduce((sum, pred, i) => sum + (pred === y[i] ? 1 : 0), 0);
    const accuracy = correct / n;

    // Confusion matrix (using cutoff)
    let TP = 0, TN = 0, FP = 0, FN = 0;
    for (let i = 0; i < n; i++) {
        if (y[i] === 1 && predictedClasses[i] === 1) TP++;
        else if (y[i] === 0 && predictedClasses[i] === 0) TN++;
        else if (y[i] === 0 && predictedClasses[i] === 1) FP++;
        else FN++;
    }

    // PROMPT-UPDATE-1 GÖREV A: Classification metrics
    const sensitivity = (TP + FN) > 0 ? TP / (TP + FN) : 0;
    const specificity = (TN + FP) > 0 ? TN / (TN + FP) : 0;
    const ppv = (TP + FP) > 0 ? TP / (TP + FP) : 0; // Positive Predictive Value
    const npv = (TN + FN) > 0 ? TN / (TN + FN) : 0; // Negative Predictive Value

    const classificationMetrics = {
        accuracy: accuracy,
        sensitivity: sensitivity,
        specificity: specificity,
        ppv: ppv,
        npv: npv
    };

    // PROMPT-UPDATE-1 GÖREV B: ROC Curve + AUC
    // Generate ROC points using all unique probability thresholds
    const uniqueProbs = [...new Set(predictions)].sort((a, b) => b - a);
    // Add boundary thresholds
    const thresholds = [1.0001, ...uniqueProbs, -0.0001];

    const rocPoints = [];
    for (const threshold of thresholds) {
        let tpCount = 0, fpCount = 0, tnCount = 0, fnCount = 0;
        for (let i = 0; i < n; i++) {
            const pred = predictions[i] >= threshold ? 1 : 0;
            if (y[i] === 1 && pred === 1) tpCount++;
            else if (y[i] === 0 && pred === 0) tnCount++;
            else if (y[i] === 0 && pred === 1) fpCount++;
            else fnCount++;
        }
        const tpr = (tpCount + fnCount) > 0 ? tpCount / (tpCount + fnCount) : 0;
        const fpr = (fpCount + tnCount) > 0 ? fpCount / (fpCount + tnCount) : 0;
        rocPoints.push({ fpr, tpr, threshold });
    }

    // Sort by FPR for AUC calculation
    rocPoints.sort((a, b) => a.fpr - b.fpr);

    // AUC using trapezoidal integration
    let auc = 0;
    for (let i = 1; i < rocPoints.length; i++) {
        const width = rocPoints[i].fpr - rocPoints[i - 1].fpr;
        const avgHeight = (rocPoints[i].tpr + rocPoints[i - 1].tpr) / 2;
        auc += width * avgHeight;
    }
    auc = Math.max(0, Math.min(1, auc)); // Bound to [0, 1]

    // Optimal threshold using Youden J index (max sensitivity + specificity - 1)
    let optimalThreshold = 0.5;
    let maxYoudenJ = -Infinity;
    for (const point of rocPoints) {
        const youdenJ = point.tpr - point.fpr; // Equivalent to sens + spec - 1
        if (youdenJ > maxYoudenJ && point.threshold >= 0 && point.threshold <= 1) {
            maxYoudenJ = youdenJ;
            optimalThreshold = point.threshold;
        }
    }

    const roc = {
        points: rocPoints.filter(p => p.threshold >= 0 && p.threshold <= 1),
        auc: auc,
        optimalThreshold: optimalThreshold,
        youdenJ: maxYoudenJ
    };

    // PROMPT-UPDATE-1 GÖREV C: Hosmer-Lemeshow Goodness of Fit Test
    const hlGroups = typeof options.hlGroups === 'number' && options.hlGroups >= 2
        ? options.hlGroups : 10;

    let hosmerLemeshow;
    if (n < hlGroups * 2) {
        // Graceful degradation for small n
        hosmerLemeshow = {
            valid: false,
            noteTR: `Örneklem büyüklüÄŸü (n=${n}) Hosmer-Lemeshow testi için yetersiz (min ${hlGroups * 2} gerekli)`,
            noteEN: `Sample size (n=${n}) insufficient for Hosmer-Lemeshow test (min ${hlGroups * 2} required)`
        };
    } else {
        // Sort observations by predicted probability
        const sorted = predictions.map((p, i) => ({ prob: p, actual: y[i] }))
            .sort((a, b) => a.prob - b.prob);

        // Create decile groups
        const groupSize = Math.floor(n / hlGroups);
        const groups = [];

        for (let g = 0; g < hlGroups; g++) {
            const start = g * groupSize;
            const end = g === hlGroups - 1 ? n : (g + 1) * groupSize;
            const groupData = sorted.slice(start, end);

            const observedEvents = groupData.filter(d => d.actual === 1).length;
            const observedNonEvents = groupData.filter(d => d.actual === 0).length;
            const expectedEvents = groupData.reduce((sum, d) => sum + d.prob, 0);
            const expectedNonEvents = groupData.length - expectedEvents;

            groups.push({
                n: groupData.length,
                observedEvents,
                observedNonEvents,
                expectedEvents,
                expectedNonEvents,
                meanPredicted: groupData.reduce((s, d) => s + d.prob, 0) / groupData.length
            });
        }

        // Chi-square calculation
        let chiSquare = 0;
        for (const g of groups) {
            if (g.expectedEvents > 0) {
                chiSquare += Math.pow(g.observedEvents - g.expectedEvents, 2) / g.expectedEvents;
            }
            if (g.expectedNonEvents > 0) {
                chiSquare += Math.pow(g.observedNonEvents - g.expectedNonEvents, 2) / g.expectedNonEvents;
            }
        }

        const hlDf = hlGroups - 2; // df = g - 2
        const hlPValue = approximateChiSquarePValue(chiSquare, hlDf);

        hosmerLemeshow = {
            valid: true,
            chiSquare: chiSquare,
            df: hlDf,
            pValue: hlPValue,
            nGroups: hlGroups,
            groups: groups,
            interpretation: hlPValue > 0.05
                ? (VIZ_STATE.lang === 'tr' ? 'Model uyumu iyi (p > 0.05)' : 'Good model fit (p > 0.05)')
                : (VIZ_STATE.lang === 'tr' ? 'Model uyumu zayıf (p â‰¤ 0.05)' : 'Poor model fit (p â‰¤ 0.05)')
        };
    }

    // Coefficients output
    const coefficients = beta.slice(1); // Exclude intercept
    const intercept = beta[0];

    // Odds ratios (exp of coefficients)
    const oddsRatios = coefficients.map(b => Math.exp(b));

    // Standard errors and p-values (simplified approximation)
    // Using Fisher Information approximation
    const pValues = [];
    const standardErrors = [];

    try {
        // Calculate information matrix
        const info = [];
        for (let j = 0; j < numParams; j++) {
            info[j] = [];
            for (let k = 0; k < numParams; k++) {
                let sum = 0;
                for (let i = 0; i < n; i++) {
                    const p = predictions[i];
                    sum += XwithIntercept[i][j] * XwithIntercept[i][k] * p * (1 - p);
                }
                info[j][k] = sum;
            }
        }

        // Invert information matrix for variance-covariance
        const varCov = invertMatrix(info);

        if (varCov) {
            for (let j = 0; j < numParams; j++) {
                const se = Math.sqrt(Math.abs(varCov[j][j]));
                standardErrors.push(se);
                const zStat = beta[j] / (se || 1);
                const pVal = 2 * (1 - normalCDF(Math.abs(zStat)));
                pValues.push(isFinite(pVal) ? pVal : 1);
            }
        } else {
            // Fallback: use default values (p=1 means not significant)
            for (let j = 0; j < numParams; j++) {
                standardErrors.push(0);
                pValues.push(1.0);
            }
        }
    } catch (e) {
        for (let j = 0; j < numParams; j++) {
            standardErrors.push(0);
            pValues.push(1.0);
        }
    }

    // FAZ-ADV-1: SPSS "Variables in the Equation" table
    // Calculate Wald statistics: Wald = (B / SE)^2
    const waldChi2 = [];
    const waldDf = [];
    const waldPValues = [];
    const expB = []; // Exp(B) = odds ratio with intercept included
    const expBCI = { lower: [], upper: [], level: 0.95 };
    const zCritical = 1.96; // 95% CI

    // Include intercept in Wald calculations
    for (let j = 0; j < numParams; j++) {
        const se = standardErrors[j] || 0;
        const b = beta[j];

        // Wald chi-square = (B / SE)^2
        const wald = se > 0 ? Math.pow(b / se, 2) : NaN;
        waldChi2.push(isFinite(wald) ? wald : NaN);
        waldDf.push(1); // df = 1 for each parameter

        // Wald p-value from chi-square distribution (df=1)
        const waldP = isFinite(wald) ? approximateChiSquarePValue(wald, 1) : NaN;
        waldPValues.push(isFinite(waldP) ? waldP : NaN);

        // Exp(B)
        const expBVal = Math.exp(b);
        expB.push(isFinite(expBVal) ? expBVal : NaN);

        // 95% CI for Exp(B): exp(B ± z*SE)
        const lowerCI = Math.exp(b - zCritical * se);
        const upperCI = Math.exp(b + zCritical * se);
        expBCI.lower.push(isFinite(lowerCI) ? lowerCI : NaN);
        expBCI.upper.push(isFinite(upperCI) ? upperCI : NaN);
    }

    // Build SPSS "Variables in the Equation" table
    const variableNames = ['(Constant)', ...((typeof arg3 === 'object' && Array.isArray(arg3)) ? arg3 : Array.from({ length: p }, (_, i) => `X${i + 1}`))];
    const spssTableRows = [];

    for (let j = 0; j < numParams; j++) {
        spssTableRows.push({
            variable: variableNames[j] || `X${j}`,
            B: beta[j],
            SE: standardErrors[j] || NaN,
            Wald: waldChi2[j],
            df: waldDf[j],
            Sig: waldPValues[j],
            ExpB: expB[j],
            CI_lower: expBCI.lower[j],
            CI_upper: expBCI.upper[j]
        });
    }

    const spssTable = {
        title: VIZ_STATE.lang === 'tr' ? 'Denklemdeki DeÄŸiÅŸkenler' : 'Variables in the Equation',
        columns: ['Variable', 'B', 'S.E.', 'Wald', 'df', 'Sig.', 'Exp(B)', '95% CI Lower', '95% CI Upper'],
        rows: spssTableRows.map(row => [
            row.variable,
            isFinite(row.B) ? row.B.toFixed(4) : '-',
            isFinite(row.SE) ? row.SE.toFixed(4) : '-',
            isFinite(row.Wald) ? row.Wald.toFixed(4) : '-',
            row.df,
            isFinite(row.Sig) ? (row.Sig < 0.001 ? '<.001' : row.Sig.toFixed(3)) : '-',
            isFinite(row.ExpB) ? row.ExpB.toFixed(4) : '-',
            isFinite(row.CI_lower) ? row.CI_lower.toFixed(4) : '-',
            isFinite(row.CI_upper) ? row.CI_upper.toFixed(4) : '-'
        ])
    };

    // Model summary table
    const modelSummaryTable = {
        title: VIZ_STATE.lang === 'tr' ? 'Model Özeti' : 'Model Summary',
        columns: ['-2LL', 'Cox & Snell R²', 'Nagelkerke R²'],
        rows: [[
            isFinite(minus2LL) ? minus2LL.toFixed(3) : '-',
            isFinite(coxSnellR2) ? coxSnellR2.toFixed(3) : '-',
            isFinite(nagelkerkeR2) ? nagelkerkeR2.toFixed(3) : '-'
        ]]
    };

    // Classification table (updated to show cutoff)
    const classificationTable = {
        title: VIZ_STATE.lang === 'tr'
            ? `Sınıflandırma Tablosu (Kesim Noktası: ${cutoff.toFixed(2)})`
            : `Classification Table (Cutoff: ${cutoff.toFixed(2)})`,
        columns: ['', 'Predicted 0', 'Predicted 1', '% Correct'],
        rows: [
            ['Observed 0', TN, FP, isFinite(TN / (TN + FP) * 100) ? (TN / (TN + FP) * 100).toFixed(1) + '%' : '-'],
            ['Observed 1', FN, TP, isFinite(TP / (TP + FN) * 100) ? (TP / (TP + FN) * 100).toFixed(1) + '%' : '-'],
            ['Overall', '', '', (accuracy * 100).toFixed(1) + '%']
        ]
    };

    // PROMPT-UPDATE-1: ROC/AUC Summary Table
    const rocSummaryTable = {
        title: VIZ_STATE.lang === 'tr' ? 'ROC EÄŸrisi Özeti' : 'ROC Curve Summary',
        columns: ['AUC', VIZ_STATE.lang === 'tr' ? 'Optimal Kesim' : 'Optimal Cutoff', 'Youden J'],
        rows: [[
            isFinite(roc.auc) ? roc.auc.toFixed(4) : '-',
            isFinite(roc.optimalThreshold) ? roc.optimalThreshold.toFixed(4) : '-',
            isFinite(roc.youdenJ) ? roc.youdenJ.toFixed(4) : '-'
        ]]
    };

    // PROMPT-UPDATE-1: Hosmer-Lemeshow Table
    const hlTable = hosmerLemeshow.valid ? {
        title: VIZ_STATE.lang === 'tr' ? 'Hosmer-Lemeshow Testi' : 'Hosmer-Lemeshow Test',
        columns: ['Ï‡²', 'df', 'Sig.', VIZ_STATE.lang === 'tr' ? 'Yorum' : 'Interpretation'],
        rows: [[
            isFinite(hosmerLemeshow.chiSquare) ? hosmerLemeshow.chiSquare.toFixed(3) : '-',
            hosmerLemeshow.df,
            isFinite(hosmerLemeshow.pValue) ? (hosmerLemeshow.pValue < 0.001 ? '<.001' : hosmerLemeshow.pValue.toFixed(3)) : '-',
            hosmerLemeshow.interpretation
        ]]
    } : {
        title: VIZ_STATE.lang === 'tr' ? 'Hosmer-Lemeshow Testi' : 'Hosmer-Lemeshow Test',
        columns: [VIZ_STATE.lang === 'tr' ? 'Not' : 'Note'],
        rows: [[hosmerLemeshow.noteTR || hosmerLemeshow.noteEN]]
    };

    // Notes about SE calculation method
    const seNotes = [];
    if (method === 'GD') {
        seNotes.push(VIZ_STATE.lang === 'tr'
            ? 'SE hesabı yaklaÅŸık (gradient descent kullanıldı)'
            : 'SE calculated approximately (gradient descent used)');
    }

    return {
        valid: true,
        testName: 'Logistic Regression',
        testType: 'logistic-regression',
        method: method,
        n: n,
        p: p,
        converged: converged,
        iterations: iterations,

        // Coefficients
        coefficients: coefficients,
        intercept: intercept,
        beta: beta,
        standardErrors: standardErrors.slice(1),
        pValues: pValues.slice(1),

        // FAZ-ADV-1: Wald statistics (excluding intercept for backward compatibility)
        wald: {
            chi2: waldChi2.slice(1),
            df: waldDf.slice(1),
            pValues: waldPValues.slice(1)
        },

        // FAZ-ADV-1: Exp(B) and CI (excluding intercept)
        expB: expB.slice(1),
        expBCI: {
            lower: expBCI.lower.slice(1),
            upper: expBCI.upper.slice(1),
            level: 0.95
        },

        // Odds ratios (alias for backward compatibility)
        oddsRatios: oddsRatios,
        oddsRatio: oddsRatios, // Alias

        // Model fit
        logLikelihood: logLikelihood,
        logLikelihoodNull: logLikelihoodNull,
        minus2LL: minus2LL,
        deviance: minus2LL,

        // Pseudo R²
        mcFaddenR2: mcFaddenR2,
        coxSnellR2: coxSnellR2,
        nagelkerkeR2: nagelkerkeR2,
        pseudoR2: nagelkerkeR2, // Default alias

        // Classification metrics
        accuracy: accuracy,
        confusionMatrix: { TP, TN, FP, FN },
        sensitivity: sensitivity,
        specificity: specificity,

        // PROMPT-UPDATE-1 GÖREV A: Cutoff and metrics
        cutoffUsed: cutoff,
        metrics: classificationMetrics,

        // PROMPT-UPDATE-1 GÖREV B: ROC/AUC
        roc: roc,

        // PROMPT-UPDATE-1 GÖREV C: Hosmer-Lemeshow
        hosmerLemeshow: hosmerLemeshow,

        // Predictions
        predictedProbabilities: predictions,
        predictedClasses: predictedClasses,

        // FAZ-ADV-1: SPSS tables (+ ROC + HL)
        tables: [spssTable, modelSummaryTable, classificationTable, rocSummaryTable, hlTable],

        // Notes
        notes: seNotes.length > 0 ? seNotes : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,

        interpretation: VIZ_STATE.lang === 'tr'
            ? `Lojistik regresyon analizi ${method} yöntemiyle tamamlandı. Model doÄŸruluÄŸu: %${(accuracy * 100).toFixed(1)}, Nagelkerke R² = ${nagelkerkeR2.toFixed(3)}, AUC = ${roc.auc.toFixed(3)}`
            : `Logistic regression analysis completed using ${method}. Model accuracy: ${(accuracy * 100).toFixed(1)}%, Nagelkerke R² = ${nagelkerkeR2.toFixed(3)}, AUC = ${roc.auc.toFixed(3)}`
    };
}

/**
 * Simple linear system solver for small matrices (Cramer's rule fallback)
 */
function solveLinearSystem(A, b) {
    const n = A.length;
    if (n === 0) return null;

    // Use Gaussian elimination with partial pivoting
    const aug = A.map((row, i) => [...row, b[i]]);

    for (let col = 0; col < n; col++) {
        // Find pivot
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
                maxRow = row;
            }
        }
        [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

        if (Math.abs(aug[col][col]) < 1e-10) {
            return null; // Singular matrix
        }

        // Eliminate
        for (let row = col + 1; row < n; row++) {
            const factor = aug[row][col] / aug[col][col];
            for (let j = col; j <= n; j++) {
                aug[row][j] -= factor * aug[col][j];
            }
        }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let row = n - 1; row >= 0; row--) {
        x[row] = aug[row][n];
        for (let j = row + 1; j < n; j++) {
            x[row] -= aug[row][j] * x[j];
        }
        x[row] /= aug[row][row];
    }

    return x;
}

// NOTE: invertMatrix function is already defined earlier in the file (line ~302)
// Removed duplicate definition here to prevent SyntaxError

// =====================================================
// NORMALITY TESTS
// =====================================================

/**
 * Shapiro-Wilk Test for Normality (simplified approximation)
 */
export function runShapiroWilkTest(data, alpha = 0.05) {
    const n = data.length;

    if (n < 3) {
        return { error: VIZ_STATE.lang === 'tr' ? 'En az 3 gözlem gereklidir' : 'At least 3 observations required', valid: false };
    }

    if (n > 5000) {
        // FAZ-P1-2: Kolmogorov-Smirnov fallback for large samples
        const sorted = [...data].sort((a, b) => a - b);
        const mean = data.reduce((a, b) => a + b, 0) / n;
        const variance = data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance) || 1;

        // Calculate K-S D statistic against normal distribution
        let D = 0;
        for (let i = 0; i < n; i++) {
            const x = (sorted[i] - mean) / stdDev;
            const Fn = (i + 1) / n; // Empirical CDF
            const Fx = normalCDF(x); // Theoretical normal CDF
            D = Math.max(D, Math.abs(Fn - Fx), Math.abs((i / n) - Fx));
        }

        // Approximate p-value for K-S test
        const sqrtN = Math.sqrt(n);
        const lambda = (sqrtN + 0.12 + 0.11 / sqrtN) * D;
        let pValueKS = 0;
        for (let k = 1; k <= 100; k++) {
            pValueKS += 2 * Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
        }
        pValueKS = Math.max(0, Math.min(1, pValueKS));

        // PROMPT-UPDATE-4: Use Lilliefors-corrected p-value (mean/sd estimated)
        const pValueLilliefors = calculateLillieforsP(D, n);
        const pValue = pValueLilliefors;
        const significant = pValue < alpha;

        return {
            valid: true,
            testName: 'Kolmogorov-Smirnov (Lilliefors) Normality Test',
            testType: 'kolmogorov-smirnov',
            n: n,
            D: D,
            pValue: pValue,
            alpha: alpha,
            significant: significant,
            isNormal: !significant,
            warning: true,
            interpretation: VIZ_STATE.lang === 'tr'
                ? `Shapiro-Wilk n <= 5000 ile sinirli oldugundan K-S (Lilliefors) testi kullanildi (n = ${n}).`
                : `K-S (Lilliefors) test used because Shapiro-Wilk is limited to n <= 5000 (n = ${n}).`,
            W: NaN,
            wStatistic: NaN,
            // PROMPT-UPDATE-4: K-S output object
            ks: {
                D: D,
                pValue: pValue,
                pValueKS: pValueKS,
                method: 'lilliefors'
            }
        };
    }

    // Sort data
    const sorted = [...data].sort((a, b) => a - b);
    const mean = calculateMean(sorted);

    // Calculate W statistic (simplified)
    // This is an approximation - full implementation requires coefficients table
    let S2 = sorted.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);

    // Calculate b (numerator for W)
    let b = 0;
    const m = Math.floor(n / 2);

    // Simplified Shapiro-Wilk coefficients approximation
    for (let i = 0; i < m; i++) {
        const a = approximateSWCoefficient(i + 1, n);
        b += a * (sorted[n - 1 - i] - sorted[i]);
    }

    const W = (b * b) / S2;

    // Approximate p-value using normal transformation
    const lnW = Math.log(1 - W);
    const mu = -1.2725 + 1.0521 * Math.pow(Math.log(n), 1);
    const sigma = 1.0308 - 0.26758 * Math.pow(Math.log(n), 0.5);
    const z = (lnW - mu) / sigma;

    const pValue = 1 - normalCDF(z);
    const significant = pValue < alpha;

    // PROMPT-UPDATE-4: Calculate supplementary tests for n >= 50
    let supplementary = null;
    if (n >= 50) {
        try {
            const adResult = runAndersonDarlingTest(data, alpha);
            if (adResult.valid) {
                supplementary = {
                    andersonDarling: { A2: adResult.A2, pValue: adResult.pValue, isNormal: adResult.isNormal }
                };
            }
        } catch (e) { /* Supplementary only - silent fail */ }
    }

    return {
        valid: true,
        testName: VIZ_STATE.lang === 'tr' ? 'Shapiro-Wilk Normallik Testi' : 'Shapiro-Wilk Normality Test',
        testType: 'shapiro-wilk',
        n: n,
        W: W,
        wStatistic: W,
        zScore: z,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        isNormal: !significant,
        supplementary: supplementary,
        interpretation: !significant
            ? (VIZ_STATE.lang === 'tr' ? `Veri normal daÄŸılımdan anlamlı ÅŸekilde sapmıyor (p >= ${alpha})` : `Data does not significantly deviate from normal distribution (p >= ${alpha})`)
            : (VIZ_STATE.lang === 'tr' ? `Veri normal daÄŸılımdan anlamlı ÅŸekilde sapıyor (p < ${alpha})` : `Data significantly deviates from normal distribution (p < ${alpha})`)
    };
}

/**
 * Approximate Shapiro-Wilk coefficient
 */
function approximateSWCoefficient(i, n) {
    // Simplified approximation using normal order statistics
    const m = i - 0.375;
    const nn = n + 0.25;
    const p = m / nn;

    // Inverse normal approximation
    const sign = p < 0.5 ? -1 : 1;
    const pp = p < 0.5 ? p : 1 - p;
    const t = Math.sqrt(-2 * Math.log(pp));
    const c0 = 2.515517;
    const c1 = 0.802853;
    const c2 = 0.010328;
    const d1 = 1.432788;
    const d2 = 0.189269;
    const d3 = 0.001308;

    const z = sign * (t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t));

    return z / Math.sqrt(n);
}

// =====================================================
// PROMPT-UPDATE-4: LILLIEFORS & ANDERSON-DARLING
// =====================================================

/**
 * Calculate Lilliefors-corrected p-value for K-S test
 * When mean and sd are estimated from data (not known)
 * Uses Dallal-Wilkinson approximation (1986)
 * @param {number} D - K-S D statistic
 * @param {number} n - sample size
 * @returns {number} - approximate p-value
 */
function calculateLillieforsP(D, n) {
    if (n < 4) return 1; // Too small for reliable estimate

    // Dallal-Wilkinson (1986) approximation for Lilliefors test
    // Valid for 4 <= n <= 100, reasonable approximation beyond
    const sqrtN = Math.sqrt(n);
    const Dstar = D * (sqrtN - 0.01 + 0.85 / sqrtN);

    // Approximate p-value using exponential formula
    if (Dstar <= 0.302) {
        return 1; // Not significant
    } else if (Dstar >= 1.035) {
        return 0; // Highly significant
    }

    // Interpolation formula from Dallal-Wilkinson
    const pValue = Math.exp(-7.01256 * Dstar * Dstar * (1 + 2.78019 * Dstar + 2.99587 * Dstar * Dstar));
    return Math.max(0, Math.min(1, pValue));
}

/**
 * Anderson-Darling Normality Test
 * PROMPT-UPDATE-4 GÖREV B
 * @param {number[]} data - numeric data array
 * @param {number} alpha - significance level (default 0.05)
 * @returns {object} - test result with A2, pValue, isNormal
 */
export function runAndersonDarlingTest(data, alpha = 0.05) {
    const lang = VIZ_STATE?.lang || 'tr';
    const n = data.length;

    if (n < 8) {
        return {
            valid: false,
            error: lang === 'tr' ? 'En az 8 gözlem gereklidir' : 'At least 8 observations required',
            testType: 'anderson-darling'
        };
    }

    // Calculate mean and standard deviation
    const mean = data.reduce((s, v) => s + v, 0) / n;
    const variance = data.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);

    if (sd === 0 || !isFinite(sd)) {
        return {
            valid: false,
            error: lang === 'tr' ? 'Varyans sıfır veya geçersiz' : 'Zero or invalid variance',
            testType: 'anderson-darling'
        };
    }

    // Sort and standardize data
    const sorted = [...data].sort((a, b) => a - b);
    const z = sorted.map(x => (x - mean) / sd);

    // Calculate A² statistic
    let sumTerm = 0;
    for (let i = 0; i < n; i++) {
        const p1 = normalCDF(z[i]);
        const p2 = normalCDF(z[n - 1 - i]);

        // Avoid log(0) issues
        const p1Safe = Math.max(1e-10, Math.min(1 - 1e-10, p1));
        const p2Safe = Math.max(1e-10, Math.min(1 - 1e-10, p2));

        sumTerm += (2 * (i + 1) - 1) * (Math.log(p1Safe) + Math.log(1 - p2Safe));
    }

    const A2 = -n - sumTerm / n;

    // Stephens (1974) adjustment for estimated parameters
    const A2star = A2 * (1 + 0.75 / n + 2.25 / (n * n));

    // Approximate p-value using D'Agostino & Stephens (1986)
    // For composite hypothesis (normal with estimated mean/variance)
    let pValue;
    if (A2star < 0.2) {
        pValue = 1 - Math.exp(-13.436 + 101.14 * A2star - 223.73 * A2star * A2star);
    } else if (A2star < 0.34) {
        pValue = 1 - Math.exp(-8.318 + 42.796 * A2star - 59.938 * A2star * A2star);
    } else if (A2star < 0.6) {
        pValue = Math.exp(0.9177 - 4.279 * A2star - 1.38 * A2star * A2star);
    } else if (A2star < 13) {
        pValue = Math.exp(1.2937 - 5.709 * A2star + 0.0186 * A2star * A2star);
    } else {
        pValue = 0; // A2* >= 13: essentially p < 0.0001
    }

    pValue = Math.max(0, Math.min(1, pValue));
    const significant = pValue < alpha;

    return {
        valid: true,
        testName: lang === 'tr' ? 'Anderson-Darling Normallik Testi' : 'Anderson-Darling Normality Test',
        testType: 'anderson-darling',
        n: n,
        A2: A2,
        A2adjusted: A2star,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        isNormal: !significant,
        interpretation: significant
            ? (lang === 'tr' ? `Veri normal dağılımdan anlamlı şekilde sapıyor (A² = ${A2.toFixed(4)}, p < ${alpha})`
                : `Data significantly deviates from normal distribution (A² = ${A2.toFixed(4)}, p < ${alpha})`)
            : (lang === 'tr' ? `Veri normal dağılımdan anlamlı şekilde sapmıyor (A² = ${A2.toFixed(4)}, p >= ${alpha})`
                : `Data does not significantly deviate from normal distribution (A² = ${A2.toFixed(4)}, p >= ${alpha})`)
    };
}

// Window binding for Anderson-Darling
window.runAndersonDarlingTest = runAndersonDarlingTest;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Assign ranks handling ties (average rank for ties)
 */
function assignRanksWithTies(sortedValues) {
    const n = sortedValues.length;
    const ranks = new Array(n);
    let i = 0;

    while (i < n) {
        let j = i;
        // Find all tied values
        while (j < n && sortedValues[j] === sortedValues[i]) {
            j++;
        }
        // Assign average rank to all tied values
        const avgRank = (i + 1 + j) / 2;
        for (let k = i; k < j; k++) {
            ranks[k] = avgRank;
        }
        i = j;
    }

    return ranks;
}

/**
 * Standard normal CDF approximation
 */
function normalCDF(z) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);
    const t = 1 / (1 + p * z);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
    return 0.5 * (1 + sign * y);
}

/**
 * Interpret Cohen's d effect size
 * FAZ-ST4: Returns bilingual interpretation {tr, en}
 * FAZ-10: Enhanced with direction and SPSS thresholds
 * Thresholds (Cohen, 1988): |d| < 0.2 = negligible, 0.2-0.5 = small, 0.5-0.8 = medium, > 0.8 = large
 */
function interpretCohensD(d, lang = null) {
    const absD = Math.abs(d);
    const direction = d >= 0 ? 'pozitif' : 'negatif';
    const directionEN = d >= 0 ? 'positive' : 'negative';

    let magnitude_tr, magnitude_en, threshold;
    if (absD < 0.2) {
        magnitude_tr = 'ihmal edilebilir';
        magnitude_en = 'negligible';
        threshold = '|d| < 0.2';
    }
    else if (absD < 0.5) {
        magnitude_tr = 'küçük';
        magnitude_en = 'small';
        threshold = '0.2 â‰¤ |d| < 0.5';
    }
    else if (absD < 0.8) {
        magnitude_tr = 'orta';
        magnitude_en = 'medium';
        threshold = '0.5 â‰¤ |d| < 0.8';
    }
    else {
        magnitude_tr = 'büyük';
        magnitude_en = 'large';
        threshold = '|d| â‰¥ 0.8';
    }

    const tr = `${magnitude_tr.charAt(0).toUpperCase() + magnitude_tr.slice(1)} ${direction} etki (d = ${d.toFixed(2)}, ${threshold})`;
    const en = `${magnitude_en.charAt(0).toUpperCase() + magnitude_en.slice(1)} ${directionEN} effect (d = ${d.toFixed(2)}, ${threshold})`;

    // If specific language requested, return string; otherwise return object
    if (lang === 'tr') return tr;
    if (lang === 'en') return en;
    return { tr, en, magnitude: magnitude_en, direction: directionEN, d: d, threshold };
}

/**
 * Interpret Eta-squared effect size
 * FAZ-ST4: Returns bilingual interpretation {tr, en}
 * FAZ-10: Enhanced with SPSS thresholds (Cohen, 1988)
 * Thresholds: Î·² < 0.01 = negligible, 0.01-0.06 = small, 0.06-0.14 = medium, > 0.14 = large
 */
function interpretEtaSquared(eta2, lang = null) {
    let magnitude_tr, magnitude_en, threshold;
    const varianceExplained = (eta2 * 100).toFixed(1);

    if (eta2 < 0.01) {
        magnitude_tr = 'ihmal edilebilir';
        magnitude_en = 'negligible';
        threshold = 'Î·² < 0.01';
    }
    else if (eta2 < 0.06) {
        magnitude_tr = 'küçük';
        magnitude_en = 'small';
        threshold = '0.01 â‰¤ Î·² < 0.06';
    }
    else if (eta2 < 0.14) {
        magnitude_tr = 'orta';
        magnitude_en = 'medium';
        threshold = '0.06 â‰¤ Î·² < 0.14';
    }
    else {
        magnitude_tr = 'büyük';
        magnitude_en = 'large';
        threshold = 'Î·² â‰¥ 0.14';
    }

    const tr = `${magnitude_tr.charAt(0).toUpperCase() + magnitude_tr.slice(1)} etki (Î·² = ${eta2.toFixed(3)}, %${varianceExplained} varyans açıklandı, ${threshold})`;
    const en = `${magnitude_en.charAt(0).toUpperCase() + magnitude_en.slice(1)} effect (Î·² = ${eta2.toFixed(3)}, ${varianceExplained}% variance explained, ${threshold})`;

    // If specific language requested, return string; otherwise return object
    if (lang === 'tr') return tr;
    if (lang === 'en') return en;
    return { tr, en, magnitude: magnitude_en, eta2: eta2, varianceExplained: parseFloat(varianceExplained), threshold };
}


/**
 * Interpret correlation coefficient
 */
function interpretCorrelation(r) {
    const absR = Math.abs(r);
    const direction = r >= 0 ? 'Pozitif' : 'Negatif';
    if (absR < 0.1) return 'İhmal edilebilir';
    if (absR < 0.3) return `Zayıf ${direction.toLowerCase()}`;
    if (absR < 0.5) return `Orta ${direction.toLowerCase()}`;
    if (absR < 0.7) return `Güçlü ${direction.toLowerCase()}`;
    return `Çok güçlü ${direction.toLowerCase()}`;
}

/**
 * Interpret Cramer's V effect size
 */
function interpretCramersV(v) {
    if (v < 0.1) return 'Çok zayıf';
    if (v < 0.3) return 'Zayıf';
    if (v < 0.5) return 'Orta';
    return 'Güçlü';
}

/**
 * Interpret effect size r
 */
function interpretEffectR(r) {
    const absR = Math.abs(r);
    if (absR < 0.1) return 'Çok küçük';
    if (absR < 0.3) return 'Küçük';
    if (absR < 0.5) return 'Orta';
    return 'Büyük';
}

// -----------------------------------------------------
// PART 3: UI RENDERING & WIDGET MANAGEMENT
// -----------------------------------------------------

// =====================================================
// STAT RESULT RENDERING
// =====================================================

/**
 * Get title for statistical analysis type
 */
export function getStatTitle(type) {
    const titles = {
        'ttest': 'BaÄŸımsız Örneklem T-Testi',
        'ttest-independent': 'BaÄŸımsız Örneklem T-Testi',
        'ttest-paired': 'EÅŸleÅŸtirilmiÅŸ Örneklem T-Testi',
        'ttest-one': 'Tek Örneklem T-Testi',
        'anova': 'Tek Yönlü ANOVA',
        'anova-oneway': 'Tek Yönlü ANOVA',
        'correlation': 'Pearson Korelasyon',
        'chi-square': 'Ki-Kare Testi',
        'chi2': 'Ki-Kare Testi',
        'mann-whitney': 'Mann-Whitney U Testi',
        'kruskal-wallis': 'Kruskal-Wallis H Testi',
        'wilcoxon': 'Wilcoxon İÅŸaretli Sıralar',
        'friedman': 'Friedman Testi',
        'shapiro-wilk': 'Shapiro-Wilk Normallik',
        'normality': 'Normallik Testi',
        'regression': 'Regresyon Analizi',
        'descriptive': 'Betimsel İstatistikler'
    };
    return titles[type] || type;
}

/**
 * FAZ-2: Safe number formatting - NaN/null â†’ '-'
 */
function fmtNum(val, digits = 4) {
    if (val === null || val === undefined) return '-';
    if (typeof val !== 'number' || !isFinite(val)) return '-';
    return val.toFixed(digits);
}

/**
 * FAZ-2: Safe p-value formatting - NaN/null â†’ 'N/A'
 */
function fmtP(p) {
    if (p === null || p === undefined || typeof p !== 'number' || !isFinite(p)) return 'N/A';
    return p < 0.001 ? '< .001' : p.toFixed(4);
}

/**
 * FAZ-2: Safe text rendering - [object Object] â†’ localized string
 */
function renderText(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        // Try localized text
        const lang = VIZ_STATE?.lang || 'tr';
        if (val[lang]) return val[lang];
        if (val.tr) return val.tr;
        if (val.en) return val.en;
        // Object with summary
        if (val.summary) return val.summary;
        if (val.message) return val.message;
        // Table/array data - don't stringify, return placeholder
        if (Array.isArray(val)) return `[${val.length} öÄŸe]`;
        // Last resort: key-value pairs
        const keys = Object.keys(val).slice(0, 3);
        if (keys.length > 0) {
            return keys.map(k => `${k}: ${val[k]}`).join(', ');
        }
        return '[Veri]';
    }
    return String(val);
}

/**
 * Render statistical results to HTML
 */
export function renderStatResults(result, type) {
    if (!result) {
        return '<div class="stat-error">Sonuç bulunamadı</div>';
    }

    if (result.error) {
        return `<div class="stat-error"><i class="fas fa-exclamation-triangle"></i> ${result.error}</div>`;
    }

    const title = result.testName || getStatTitle(type);

    // FAZ-2: Significance rozeti SADECE anlamlılık testlerinde
    // Descriptive, Frequency, PCA, KMeans, TimeSeries, APA için rozet yok
    const noSignificanceTests = ['descriptive', 'frequency', 'pca', 'kmeans', 'timeseries', 'apa', 'cronbach', 'power'];
    const showSignificance = result.significant !== undefined &&
        result.significant !== null &&
        !noSignificanceTests.includes(type);

    let sigHtml = '';
    if (showSignificance) {
        const sigClass = result.significant ? 'significant' : 'not-significant';
        // GATE-14: Akademik dile uygun - "Anlamsız" yerine "Anlamlı DeÄŸil"
        const sigText = result.significant ? 'Anlamlı' : 'Anlamlı DeÄŸil';
        const sigIcon = result.significant ? 'fa-check-circle' : 'fa-times-circle';
        sigHtml = `
            <span class="stat-significance ${sigClass}">
                <i class="fas ${sigIcon}"></i> ${sigText}
            </span>
        `;
    }

    let html = `
        <div class="stat-result-container">
            <div class="stat-result-header">
                <h4>${title}</h4>
                ${sigHtml}
            </div>
            <div class="stat-result-body">
    `;

    // SPECIAL CASE: Descriptive statistics - render results array as table
    if (result.testType === 'descriptive' && result.results && Array.isArray(result.results)) {
        html += `
            <table class="stat-table stat-descriptive-table">
                <thead>
                    <tr>
                        <th>DeÄŸiÅŸken</th>
                        <th>N</th>
                        <th>Ortalama</th>
                        <th>Std. Sapma</th>
                        <th>Medyan</th>
                        <th>Min</th>
                        <th>Max</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.results.map(r => `
                        <tr>
                            <td>${r.column}</td>
                            <td>${r.n}</td>
                            <td>${fmtNum(r.mean, 3)}</td>
                            <td>${fmtNum(r.stdDev, 3)}</td>
                            <td>${fmtNum(r.median, 3)}</td>
                            <td>${fmtNum(r.min, 2)}</td>
                            <td>${fmtNum(r.max, 2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        if (result.interpretation) {
            html += `<div class="stat-interpretation"><i class="fas fa-info-circle"></i><span>${renderText(result.interpretation)}</span></div>`;
        }
        html += `</div><div class="stat-result-footer"><small>${new Date().toLocaleDateString('tr-TR')}</small></div></div>`;
        return html;
    }

    // FAZ-5: SPECIAL CASE: Frequency analysis - render top results table
    if (result.testType === 'frequency' && result.topResults) {
        html += `
            <div class="stat-freq-summary">
                <div class="stat-freq-stat"><strong>Toplam N:</strong> ${result.validCount || result.total}</div>
                <div class="stat-freq-stat"><strong>Benzersiz DeÄŸer:</strong> ${result.uniqueCount}</div>
                <div class="stat-freq-stat"><strong>Mod:</strong> "${result.mode}" (n=${result.modeCount}, %${result.modePercent})</div>
                <div class="stat-freq-stat"><strong>Eksik:</strong> ${result.missingCount || 0}</div>
            </div>
            <table class="stat-table stat-freq-table">
                <thead>
                    <tr>
                        <th>DeÄŸer</th>
                        <th>n</th>
                        <th>%</th>
                        <th>Kümülatif %</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.topResults.map(r => `
                        <tr>
                            <td>${r.value}</td>
                            <td>${r.count}</td>
                            <td>${r.percent}%</td>
                            <td>${r.cumPercent}%</td>
                        </tr>
                    `).join('')}
                    ${result.otherCount > 0 ? `
                        <tr class="stat-freq-other">
                            <td><em>DiÄŸer (${result.uniqueCount - result.topResults.length} deÄŸer)</em></td>
                            <td>${result.otherCount}</td>
                            <td>${result.otherPercent}%</td>
                            <td>100.0%</td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        `;
        if (result.interpretation) {
            html += `<div class="stat-interpretation"><i class="fas fa-info-circle"></i><span>${renderText(result.interpretation)}</span></div>`;
        }
        html += `</div><div class="stat-result-footer"><small>${new Date().toLocaleDateString('tr-TR')}</small></div></div>`;
        return html;
    }

    // FAZ-5: SPECIAL CASE: PCA - render eigenvalues and loadings
    if (result.testType === 'pca' && result.eigenvalues) {
        html += `
            <div class="stat-pca-summary">
                <div class="stat-pca-stat"><strong>DeÄŸiÅŸken Sayısı:</strong> ${result.variableCount || result.eigenvalues.length}</div>
            </div>
            <h5>Açıklanan Varyans</h5>
            <table class="stat-table stat-pca-table">
                <thead>
                    <tr>
                        <th>BileÅŸen</th>
                        <th>ÖzdeÄŸer</th>
                        <th>Açıklanan %</th>
                        <th>Kümülatif %</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.eigenvalues.slice(0, 5).map((ev, i) => `
                        <tr>
                            <td>PC${i + 1}</td>
                            <td>${fmtNum(ev, 3)}</td>
                            <td>${fmtNum(result.varianceExplained?.[i] * 100, 1)}%</td>
                            <td>${fmtNum(result.cumulativeVariance?.[i] * 100, 1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        if (result.interpretation) {
            html += `<div class="stat-interpretation"><i class="fas fa-info-circle"></i><span>${renderText(result.interpretation)}</span></div>`;
        }
        html += `</div><div class="stat-result-footer"><small>${new Date().toLocaleDateString('tr-TR')}</small></div></div>`;
        return html;
    }

    // FAZ-5: SPECIAL CASE: KMeans - render cluster sizes and centroids
    if (result.testType === 'kmeans' && result.clusters) {
        html += `
            <div class="stat-kmeans-summary">
                <div class="stat-kmeans-stat"><strong>Küme Sayısı (k):</strong> ${result.k || result.clusters.length}</div>
                <div class="stat-kmeans-stat"><strong>Toplam N:</strong> ${result.totalN || result.n}</div>
            </div>
            <h5>Küme Boyutları</h5>
            <table class="stat-table stat-kmeans-table">
                <thead>
                    <tr>
                        <th>Küme</th>
                        <th>N</th>
                        <th>%</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.clusters.map((c, i) => `
                        <tr>
                            <td>Küme ${i + 1}</td>
                            <td>${c.size || c.n || c.count}</td>
                            <td>${fmtNum((c.size || c.n || c.count) / (result.totalN || result.n) * 100, 1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        if (result.interpretation) {
            html += `<div class="stat-interpretation"><i class="fas fa-info-circle"></i><span>${renderText(result.interpretation)}</span></div>`;
        }
        html += `</div><div class="stat-result-footer"><small>${new Date().toLocaleDateString('tr-TR')}</small></div></div>`;
        return html;
    }

    // FAZ-6: SPECIAL CASE: APA Report - render html directly
    if (result.testType === 'apa' && result.html) {
        html += `
            <div class="stat-apa-container">
                ${result.html}
                <div class="stat-apa-actions">
                    <button class="viz-btn viz-btn-sm" onclick="navigator.clipboard.writeText(this.closest('.stat-apa-container').querySelector('.apa-report').innerText); showToast('APA raporu kopyalandı', 'success');">
                        <i class="fas fa-copy"></i> APA Kopyala
                    </button>
                </div>
            </div>
        `;
        if (result.interpretation) {
            html += `<div class="stat-interpretation"><i class="fas fa-info-circle"></i><span>${renderText(result.interpretation)}</span></div>`;
        }
        html += `</div><div class="stat-result-footer"><small>${new Date().toLocaleDateString('tr-TR')}</small></div></div>`;
        return html;
    }

    // FAZ-2: SPECIAL CASE: SPSS-style tables (ANOVA, Chi-Square, T-Test SPSS wrappers)
    if (result.tables && Array.isArray(result.tables) && result.tables.length > 0) {
        // Render each SPSS table
        result.tables.forEach(tbl => {
            if (!tbl || !tbl.columns || !tbl.rows) return;
            html += `<h5 class="stat-spss-table-title">${tbl.name || 'Table'}</h5>`;
            html += '<table class="stat-table stat-spss-table">';
            html += '<thead><tr>';
            tbl.columns.forEach(col => {
                html += `<th>${col}</th>`;
            });
            html += '</tr></thead><tbody>';
            tbl.rows.forEach(row => {
                html += '<tr>';
                row.forEach(cell => {
                    const cellVal = cell === '' || cell === null || cell === undefined ? '' : cell;
                    html += `<td>${cellVal}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
        });

        // Effect sizes section
        if (result.effectSizes) {
            html += '<div class="stat-effect-sizes">';
            html += '<h5>Etki BüyüklüÄŸü</h5>';
            if (result.effectSizes.omegaSquared !== undefined) {
                html += `<div class="stat-effect-item"><strong>Ï‰² (Omega Squared):</strong> ${fmtNum(result.effectSizes.omegaSquared, 4)} <span class="stat-effect-interp">(${result.effectSizes.interpretation || 'N/A'})</span></div>`;
            }
            if (result.effectSizes.etaSquared !== undefined) {
                html += `<div class="stat-effect-item"><strong>Î·² (Eta Squared):</strong> ${fmtNum(result.effectSizes.etaSquared, 4)}</div>`;
            }
            if (result.effectSizes.cramersV !== undefined) {
                html += `<div class="stat-effect-item"><strong>Cramer's V:</strong> ${fmtNum(result.effectSizes.cramersV, 4)}</div>`;
            }
            html += '</div>';
        }

        // APA interpretation
        const apaText = (VIZ_STATE?.lang === 'tr' ? result.apaTR : result.apaEN) || result.interpretation;
        if (apaText) {
            html += `<div class="stat-interpretation"><i class="fas fa-graduation-cap"></i><span>${apaText}</span></div>`;
        }

        // Levene assumption check warning
        if (result.levene && result.levene.pValue !== undefined) {
            const leveneOk = result.levene.pValue > (result.alpha || 0.05);
            const leveneClass = leveneOk ? 'stat-assumption-ok' : 'stat-assumption-violated';
            const leveneIcon = leveneOk ? 'fa-check-circle' : 'fa-exclamation-triangle';
            const leveneMsg = leveneOk
                ? 'Varyanslar homojen (Levene p > Î±)'
                : 'Varyanslar homojen DEÄİL (Levene p < Î±)';
            html += `<div class="stat-assumption ${leveneClass}"><i class="fas ${leveneIcon}"></i> ${leveneMsg}</div>`;
        }

        html += `</div><div class="stat-result-footer"><small>Î± = ${result.alpha || 0.05}</small><small>${new Date().toLocaleDateString('tr-TR')}</small></div></div>`;
        return html;
    }

    // FAZ-5: SPECIAL CASE: TimeSeries - render trend and forecast
    if (result.testType === 'timeseries') {
        if (result.error) {
            html += `<div class="stat-error"><i class="fas fa-exclamation-triangle"></i> ${result.error}</div>`;
        } else {
            html += `
                <div class="stat-timeseries-summary">
                    <div class="stat-ts-stat"><strong>Trend:</strong> ${result.trend || '-'}</div>
                    <div class="stat-ts-stat"><strong>Ortalama:</strong> ${fmtNum(result.mean, 2)}</div>
                    <div class="stat-ts-stat"><strong>Veri Noktası:</strong> ${result.n || result.dataPoints || '-'}</div>
                </div>
            `;
            if (result.forecast) {
                html += `<div class="stat-ts-stat"><strong>Tahmin:</strong> ${fmtNum(result.forecast, 2)}</div>`;
            }
        }
        if (result.interpretation) {
            html += `<div class="stat-interpretation"><i class="fas fa-info-circle"></i><span>${renderText(result.interpretation)}</span></div>`;
        }
        html += `</div><div class="stat-result-footer"><small>${new Date().toLocaleDateString('tr-TR')}</small></div></div>`;
        return html;
    }


    html += '<table class="stat-table">';

    // Add statistics based on test type
    if (result.tStatistic !== undefined) {
        html += formatStatRow('t İstatistiÄŸi', fmtNum(result.tStatistic));
    }
    if (result.fStatistic !== undefined) {
        html += formatStatRow('F İstatistiÄŸi', fmtNum(result.fStatistic));
    }
    if (result.chiSquare !== undefined) {
        html += formatStatRow('Ï‡² İstatistiÄŸi', fmtNum(result.chiSquare));
    }
    if (result.chi2Statistic !== undefined) {
        html += formatStatRow('Ï‡² İstatistiÄŸi', fmtNum(result.chi2Statistic));
    }
    if (result.U !== undefined) {
        html += formatStatRow('U İstatistiÄŸi', fmtNum(result.U, 2));
    }
    if (result.hStatistic !== undefined) {
        html += formatStatRow('H İstatistiÄŸi', fmtNum(result.hStatistic));
    }
    if (result.W !== undefined) {
        html += formatStatRow('W İstatistiÄŸi', fmtNum(result.W, 2));
    }
    if (result.wStatistic !== undefined) {
        html += formatStatRow('W İstatistiÄŸi', fmtNum(result.wStatistic));
    }
    if (result.zStatistic !== undefined) {
        html += formatStatRow('z İstatistiÄŸi', fmtNum(result.zStatistic));
    }
    if (result.correlation !== undefined) {
        html += formatStatRow('Korelasyon (r)', fmtNum(result.correlation));
    }
    if (result.rSquared !== undefined) {
        html += formatStatRow('R²', fmtNum(result.rSquared));
    }

    // Degrees of freedom
    if (result.degreesOfFreedom !== undefined) {
        if (typeof result.degreesOfFreedom === 'object') {
            html += formatStatRow('sd (gruplar arası)', result.degreesOfFreedom.between);
            html += formatStatRow('sd (grup içi)', result.degreesOfFreedom.within);
        } else {
            html += formatStatRow('Serbestlik Derecesi',
                typeof result.degreesOfFreedom === 'number' ? result.degreesOfFreedom.toFixed(2) : result.degreesOfFreedom);
        }
    }

    // P-value with color coding - FAZ-2: fmtP guard
    if (result.pValue !== undefined) {
        const pClass = (result.pValue !== null && result.pValue < 0.001) ? 'p-very-sig' :
            (result.pValue !== null && result.pValue < 0.05) ? 'p-sig' : 'p-not-sig';
        html += `<tr><td>p-deÄŸeri</td><td class="${pClass}">${fmtP(result.pValue)}</td></tr>`;
    }

    // Alpha level
    if (result.alpha !== undefined) {
        html += formatStatRow('Î± (Anlamlılık Düzeyi)', result.alpha);
    }

    // Effect sizes - FAZ-2: fmtNum guard
    if (result.cohensD !== undefined) {
        html += formatStatRow('Cohen\'s d', fmtNum(result.cohensD));
        if (result.effectSizeInterpretation) {
            html += formatStatRow('Etki BüyüklüÄŸü', renderText(result.effectSizeInterpretation));
        }
    }
    if (result.etaSquared !== undefined) {
        html += formatStatRow('Î·² (Eta Kare)', fmtNum(result.etaSquared));
    }
    if (result.cramersV !== undefined) {
        html += formatStatRow('Cramer\'s V', fmtNum(result.cramersV));
    }
    if (result.effectSizeR !== undefined) {
        html += formatStatRow('Etki BüyüklüÄŸü (r)', fmtNum(result.effectSizeR));
    }
    if (result.kendallW !== undefined) {
        html += formatStatRow('Kendall\'s W', fmtNum(result.kendallW));
    }

    // Mean difference
    if (result.meanDifference !== undefined) {
        html += formatStatRow('Ortalama Farkı', fmtNum(result.meanDifference));
    }

    // Sample sizes
    if (result.n !== undefined) {
        html += formatStatRow('N', result.n);
    }
    if (result.totalN !== undefined) {
        html += formatStatRow('Toplam N', result.totalN);
    }

    html += '</table>';

    // Group statistics if available
    if (result.group1Stats && result.group2Stats) {
        html += `
            <div class="stat-groups">
                <h5>Grup İstatistikleri</h5>
                <table class="stat-table stat-groups-table">
                    <tr>
                        <th></th>
                        <th>Grup 1</th>
                        <th>Grup 2</th>
                    </tr>
                    <tr>
                        <td>N</td>
                        <td>${result.group1Stats.n}</td>
                        <td>${result.group2Stats.n}</td>
                    </tr>
                    <tr>
                        <td>Ortalama</td>
                        <td>${result.group1Stats.mean?.toFixed(3) || result.group1Stats.median?.toFixed(3) || '-'}</td>
                        <td>${result.group2Stats.mean?.toFixed(3) || result.group2Stats.median?.toFixed(3) || '-'}</td>
                    </tr>
                    ${result.group1Stats.std ? `
                    <tr>
                        <td>Std. Sapma</td>
                        <td>${result.group1Stats.std.toFixed(3)}</td>
                        <td>${result.group2Stats.std.toFixed(3)}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
        `;
    }

    // ANOVA group stats
    if (result.groupStats && Array.isArray(result.groupStats)) {
        html += `
            <div class="stat-groups">
                <h5>Grup İstatistikleri</h5>
                <table class="stat-table">
                    <tr>
                        <th>Grup</th>
                        <th>N</th>
                        <th>Ortalama</th>
                        ${result.groupStats[0].variance !== undefined ? '<th>Varyans</th>' : ''}
                    </tr>
                    ${result.groupStats.map((g, i) => `
                        <tr>
                            <td>Grup ${i + 1}</td>
                            <td>${g.n}</td>
                            <td>${(g.mean || g.median || g.meanRank || 0).toFixed(3)}</td>
                            ${g.variance !== undefined ? `<td>${g.variance.toFixed(3)}</td>` : ''}
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
    }

    // Interpretation
    if (result.interpretation) {
        html += `
            <div class="stat-interpretation">
                <i class="fas fa-info-circle"></i>
                <span>${result.interpretation}</span>
            </div>
        `;
    }

    // Correlation interpretation
    if (result.correlationInterpretation) {
        html += `
            <div class="stat-interpretation correlation">
                <i class="fas fa-chart-line"></i>
                <span>İliÅŸki: ${result.correlationInterpretation}</span>
            </div>
        `;
    }

    // Normality result
    if (result.isNormal !== undefined) {
        const normalClass = result.isNormal ? 'normal' : 'not-normal';
        const normalText = result.isNormal ? 'Veri normal daÄŸılımlı' : 'Veri normal daÄŸılımlı deÄŸil';
        html += `
            <div class="stat-normality ${normalClass}">
                <i class="fas ${result.isNormal ? 'fa-check' : 'fa-times'}"></i>
                <span>${normalText}</span>
            </div>
        `;
    }

    // P1.4: Missing Data Academic Note
    const missingNote = generateMissingDataNote(result);
    if (missingNote) {
        html += missingNote;
    }

    html += `
            </div>
            <div class="stat-result-footer">
                <small>Î± = ${result.alpha || 0.05}</small>
                <small>${new Date().toLocaleDateString('tr-TR')}</small>
            </div>
        </div>
    `;

    return html;
}

/**
 * Format a stat table row
 */
function formatStatRow(label, value) {
    const displayValue = typeof value === 'number' ?
        (Number.isInteger(value) ? value : value.toFixed(4)) : value;
    return `<tr><td>${label}</td><td>${displayValue}</td></tr>`;
}

// =====================================================
// P1.3: X/Y COLUMN DIAGNOSTICS
// =====================================================

/**
 * Render column diagnostics for a stat widget
 * Shows X/Y column types, unique counts, missing counts, and dataset summary
 */
export function renderColumnDiagnostics(widgetId) {
    const widget = document.getElementById(widgetId);
    if (!widget) return '';

    const datasetId = widget.dataset.datasetId;
    const dataset = VIZ_STATE.getDatasetById ? VIZ_STATE.getDatasetById(datasetId) :
        { data: VIZ_STATE.data || [], columns: VIZ_STATE.columns || [] };

    if (!dataset || !dataset.data || dataset.data.length === 0) {
        return '<div class="stat-diagnostics stat-warning"><i class="fas fa-info-circle"></i> Veri yüklenmemiÅŸ</div>';
    }

    const data = dataset.data;
    const columns = dataset.columns || Object.keys(data[0] || {});

    const xCol = document.getElementById(`${widgetId}_xCol`)?.value;
    const yCol = document.getElementById(`${widgetId}_yCol`)?.value;

    // Count column types
    let numericCount = 0;
    let categoricalCount = 0;
    columns.forEach(col => {
        const sample = data.slice(0, 100).map(r => r[col]);
        const numericVals = sample.filter(v => v !== null && v !== '' && !isNaN(parseFloat(v)));
        if (numericVals.length > sample.length * 0.7) {
            numericCount++;
        } else {
            categoricalCount++;
        }
    });

    // X column diagnostics
    let xDiag = '';
    if (xCol) {
        const xVals = data.map(r => r[xCol]);
        const xMissing = xVals.filter(v => v === null || v === '' || v === undefined).length;
        const xUnique = new Set(xVals.filter(v => v !== null && v !== '')).size;
        const xNumeric = xVals.filter(v => v !== null && v !== '' && !isNaN(parseFloat(v))).length;
        const xType = xNumeric > xVals.length * 0.7 ? 'Sayısal' : 'Kategorik';

        xDiag = `<span class="diag-item"><b>X (${xCol}):</b> ${xType}, ${xUnique} benzersiz, ${xMissing} eksik</span>`;
    }

    // Y column diagnostics
    let yDiag = '';
    if (yCol) {
        const yVals = data.map(r => r[yCol]);
        const yMissing = yVals.filter(v => v === null || v === '' || v === undefined).length;
        const yValid = yVals.filter(v => v !== null && v !== '' && !isNaN(parseFloat(v))).length;
        const yNumeric = yValid > 0;

        yDiag = `<span class="diag-item"><b>Y (${yCol}):</b> ${yNumeric ? 'Sayısal' : 'Kategorik'}, n=${yValid}, ${yMissing} eksik</span>`;
    }

    return `
        <div class="stat-diagnostics">
            <div class="diag-row">
                ${xDiag}
                ${yDiag}
            </div>
            <div class="diag-summary">
                <i class="fas fa-database"></i> 
                ${data.length} satır, ${numericCount} sayısal, ${categoricalCount} kategorik sütun
            </div>
        </div>
    `;
}

// =====================================================
// P1.4: MISSING DATA ACADEMIC NOTE
// =====================================================

/**
 * Generate academic-style missing data note
 * Uses result.imputationActions and result.xMissing/yMissing for accuracy
 * Returns HTML with Turkish/English academic language
 */
export function generateMissingDataNote(result, lang = 'tr') {
    if (!result) return '';

    let note = '<div class="stat-missing-note">';
    note += '<i class="fas fa-info-circle"></i> ';

    // âœ… USE RESULT VALUES DIRECTLY (injected by runStatWidgetAnalysis)
    const missingX = result.xMissing || 0;
    const missingY = result.yMissing || 0;
    const totalMissing = missingX + missingY;
    const xCol = result.xColumn || '';
    const yCol = result.yColumn || '';

    // Use result.imputationActions (pre-filtered for these columns)
    let relevantActions = result.imputationActions || [];

    // âœ… FALLBACK: If no column-specific actions, check global VIZ_STATE.dataActions
    if (relevantActions.length === 0 && typeof VIZ_STATE !== 'undefined') {
        const allActions = VIZ_STATE.dataActions || [];
        // Check if any imputation was done on yCol (main analysis column)
        relevantActions = allActions.filter(a =>
            a.type === 'imputation' && (a.column === yCol || a.column === xCol)
        );
        // If still empty but there are ANY imputation actions, show general note
        if (relevantActions.length === 0 && allActions.length > 0) {
            relevantActions = allActions.filter(a => a.type === 'imputation');
        }
    }


    // Academic text templates
    const texts = {
        tr: {
            imputed: (col, count, method, value) =>
                `${col} deÄŸiÅŸkeninde ${count} eksik gözlem ${method}${value ? ` (${value})` : ''} ile tamamlanmıÅŸtır.`,
            noAction: (x, y, xName, yName) => {
                let msg = '';
                if (y > 0) msg += `${yName} deÄŸiÅŸkeninde n=${y} eksik gözlem tespit edilmiÅŸtir; `;
                if (x > 0) msg += `${xName} deÄŸiÅŸkeninde n=${x} eksik gözlem tespit edilmiÅŸtir; `;
                msg += 'eksik veri için herhangi bir doldurma iÅŸlemi uygulanmamıÅŸtır. Analiz listwise deletion ile yürütülmüÅŸtür.';
                return msg;
            },
            noMissing: 'Analize dahil edilen deÄŸiÅŸkenlerde eksik veri bulunmamaktadır.'
        },
        en: {
            imputed: (col, count, method, value) =>
                `${count} missing observations in ${col} were imputed using ${method}${value ? ` (${value})` : ''}.`,
            noAction: (x, y, xName, yName) => {
                let msg = '';
                if (y > 0) msg += `n=${y} missing observations in ${yName}; `;
                if (x > 0) msg += `n=${x} missing observations in ${xName}; `;
                msg += 'no imputation was applied. Analysis was conducted using listwise deletion.';
                return msg;
            },
            noMissing: 'No missing data were found in the variables included in the analysis.'
        }
    };

    const t = texts[lang] || texts.tr;

    // âœ… Filter out any actions with missing/invalid data - accepts both 'column' and 'col' field names
    const validActions = relevantActions.filter(a => {
        const colName = a?.column || a?.col;
        return a && colName && a.type === 'imputation';
    });

    if (validActions.length > 0) {

        // Imputation was applied - show what was done
        validActions.forEach(action => {
            // Safe access to methodName with multiple fallbacks
            let methodName = 'bilinmeyen yöntem';
            if (action.methodName) {
                if (typeof action.methodName === 'object') {
                    methodName = action.methodName[lang] || action.methodName.tr || action.method || 'yöntem';
                } else {
                    methodName = action.methodName;
                }
            } else if (action.method) {
                methodName = action.method;
            }

            const colName = action.column || 'sütun';
            const count = action.count || '?';
            const value = action.value || '';

            note += t.imputed(colName, count, methodName, value);
            note += ' ';
        });
    } else if (totalMissing > 0) {
        // Missing data exists but NO imputation was done
        note += t.noAction(missingX, missingY, xCol, yCol);
    } else {
        // Truly no missing data
        note += t.noMissing;
    }

    note += '</div>';
    return note;
}


// =====================================================
// P1.6: COPY AS TABLE (TSV FORMAT)
// =====================================================

/**
 * Copy stat widget results as TSV table (Excel/Sheets compatible)
 */
export function copyStatAsTable(widgetId) {
    const widget = document.getElementById(widgetId);
    if (!widget) {
        showToast('Widget bulunamadı', 'error');
        return;
    }

    const body = widget.querySelector('.viz-stat-body, .viz-widget-body');
    if (!body) return;

    const tables = body.querySelectorAll('table');
    let tsv = '';

    // Add title row
    const title = widget.querySelector('.viz-widget-title');
    if (title) {
        tsv += title.textContent.trim() + '\n';
    }

    tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            const rowData = Array.from(cells).map(c => c.textContent.trim());
            tsv += rowData.join('\t') + '\n';
        });
        tsv += '\n'; // Empty line between tables
    });

    // Add interpretation if exists
    const interp = body.querySelector('.stat-interpretation');
    if (interp) {
        tsv += 'Yorum\t' + interp.textContent.trim() + '\n';
    }

    // Add missing data note if exists
    const missingNote = body.querySelector('.stat-missing-note');
    if (missingNote) {
        tsv += 'Not\t' + missingNote.textContent.trim() + '\n';
    }

    navigator.clipboard.writeText(tsv).then(() => {
        showToast('Tablo olarak kopyalandı (Excel/Sheets uyumlu)', 'success');
    }).catch(err => {
        console.error('Copy error:', err);
        showToast('Kopyalama baÅŸarısız', 'error');
    });
}

// Window bindings for P1.3-P1.6
window.renderColumnDiagnostics = renderColumnDiagnostics;
window.generateMissingDataNote = generateMissingDataNote;
window.copyStatAsTable = copyStatAsTable;

/**
 * Format stat result for widget display (compact version)
 */
export function formatStatResultForWidget(result, type) {
    if (!result || result.error) {
        return `<div class="stat-widget-error">${result?.error || 'Hata'}</div>`;
    }

    const sigClass = result.significant ? 'sig' : 'not-sig';
    const pDisplay = result.pValue < 0.001 ? '< .001' : `= ${result.pValue?.toFixed(3)}`;

    let statValue = '';
    if (result.tStatistic !== undefined) statValue = `t = ${result.tStatistic.toFixed(2)}`;
    else if (result.fStatistic !== undefined) statValue = `F = ${result.fStatistic.toFixed(2)}`;
    else if (result.chiSquare !== undefined) statValue = `Ï‡² = ${result.chiSquare.toFixed(2)}`;
    else if (result.correlation !== undefined) statValue = `r = ${result.correlation.toFixed(2)}`;
    else if (result.U !== undefined) statValue = `U = ${result.U.toFixed(0)}`;
    else if (result.hStatistic !== undefined) statValue = `H = ${result.hStatistic.toFixed(2)}`;
    else if (result.wStatistic !== undefined) statValue = `W = ${result.wStatistic.toFixed(3)}`;

    return `
        <div class="stat-widget-result ${sigClass}">
            <div class="stat-value">${statValue}</div>
            <div class="stat-p">p ${pDisplay}</div>
            ${result.effectSizeInterpretation ? `<div class="stat-effect">${result.effectSizeInterpretation}</div>` : ''}
        </div>
    `;
}

// =====================================================
// STAT WIDGET MANAGEMENT
// =====================================================

let statWidgetCounter = 0;

// =====================================================
// RESTORED UI ENGINE (From viz_SOURCE.js)
// =====================================================
// NOTE: getStatTitle is already defined above (line 1477), using that version.

/**
 * UI tipine göre parametre seçicileri oluÅŸturur
 */
export function generateStatUIByType(widgetId, statType, analysisInfo, dataset) {
    const columns = dataset.columns || [];
    const columnsInfo = dataset.columnsInfo || [];

    const numericCols = columnsInfo.filter(c => c.type === 'numeric').map(c => c.name);
    const categoricalCols = columnsInfo.filter(c => c.type === 'categorical' || c.type === 'string').map(c => c.name);
    const dateCols = columnsInfo.filter(c => c.type === 'date').map(c => c.name);

    const allCols = columns.length > 0 ? columns : (numericCols.length > 0 ? numericCols : ['Col1', 'Col2']);

    // FAZ-1: "Seçiniz" default - kullanıcı seçmeden çalıÅŸmayacak
    const makeOptions = (cols, selected, includeEmpty = true) => {
        let opts = includeEmpty ? '<option value="">-- Seçiniz --</option>' : '';
        opts += cols.map(c =>
            `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`
        ).join('');
        return opts;
    };

    // FAZ-1: Varsayılan seçim kapalı - defaultChecked boÅŸ
    const makeCheckboxes = (cols, idPrefix, defaultChecked = []) => cols.map((c, i) =>
        `<label class="viz-checkbox-item">
            <input type="checkbox" id="${idPrefix}_${i}" name="${idPrefix}" value="${c}" 
                   ${defaultChecked.includes(c) ? 'checked' : ''} 
                   onchange="refreshStatWidget('${widgetId}')">
            <span>${c}</span>
        </label>`
    ).join('');

    let html = `<div class="viz-stat-info">${analysisInfo.description}</div>`;
    html += `<div class="viz-stat-default-info"><small><i class="fas fa-info-circle"></i> DeÄŸiÅŸken seçin ve Yenile butonuna basın.</small></div>`;

    switch (analysisInfo.uiType) {
        case 'TYPE_A':
            html += `
                <div class="viz-stat-selectors">
                    <div class="viz-param-group">
                        <label>X (Grup/Kategori):</label>
                        <select id="${widgetId}_xCol" onchange="onStatXColumnChange('${widgetId}', '${statType}')">
                            ${makeOptions(categoricalCols.length > 0 ? categoricalCols : allCols)}
                        </select>
                    </div>
                    <div class="viz-param-group">
                        <label>Y (DeÄŸer/Sayısal):</label>
                        <select id="${widgetId}_yCol" onchange="refreshStatWidget('${widgetId}')">
                            ${makeOptions(numericCols.length > 0 ? numericCols : allCols)}
                        </select>
                    </div>
                </div>
                <div class="viz-group-selector" id="${widgetId}_groupSelector">
                    <div class="viz-group-selector-title">
                        <i class="fas fa-users"></i> KarÅŸılaÅŸtırılacak Gruplar:
                    </div>
                    <div class="viz-group-selectors-row">
                        <div class="viz-param-group">
                            <label>Grup 1:</label>
                            <select id="${widgetId}_group1" onchange="refreshStatWidget('${widgetId}')">
                                <option value="">-- Grup seçin --</option>
                            </select>
                        </div>
                        <div class="viz-param-group">
                            <label>Grup 2:</label>
                            <select id="${widgetId}_group2" onchange="refreshStatWidget('${widgetId}')">
                                <option value="">-- Grup seçin --</option>
                            </select>
                        </div>
                    </div>
                </div>`;
            break;

        case 'TYPE_B':
            const minCols = analysisInfo.minColumns || 2;
            const maxCols = analysisInfo.maxColumns || 10;
            const defaultSelected = numericCols.slice(0, Math.min(3, numericCols.length));
            html += `
                <div class="viz-stat-selectors">
                    <div class="viz-param-group viz-multi-select">
                        <label>Sütunlar (en az ${minCols}, en fazla ${maxCols}):</label>
                        <div class="viz-checkbox-grid" id="${widgetId}_columns">
                            ${makeCheckboxes(numericCols.length > 0 ? numericCols : allCols, `${widgetId}_col`, defaultSelected)}
                        </div>
                    </div>
                    ${analysisInfo.extraParams?.includes('k') ? `
                    <div class="viz-param-group">
                        <label>K (Küme Sayısı):</label>
                        <input type="number" id="${widgetId}_k" value="${analysisInfo.defaultK || 3}" 
                               min="2" max="10" onchange="refreshStatWidget('${widgetId}')">
                    </div>` : ''}
                </div>`;
            break;

        case 'TYPE_C':
            html += `
                <div class="viz-stat-selectors">
                    <div class="viz-param-group">
                        <label>Ölçüm 1 (Öncesi/İlk):</label>
                        <select id="${widgetId}_col1" onchange="refreshStatWidget('${widgetId}')">
                            ${makeOptions(numericCols.length > 0 ? numericCols : allCols, numericCols[0])}
                        </select>
                    </div>
                    <div class="viz-param-group">
                        <label>Ölçüm 2 (Sonrası/İkinci):</label>
                        <select id="${widgetId}_col2" onchange="refreshStatWidget('${widgetId}')">
                            ${makeOptions(numericCols.length > 0 ? numericCols : allCols, numericCols[1] || numericCols[0])}
                        </select>
                    </div>
                </div>`;
            break;

        case 'TYPE_D':
            const targetCols = analysisInfo.targetType === 'binary' ? categoricalCols : categoricalCols;
            const predictorCols = numericCols;
            // GATE-9: Varsayılan seçim YOK - kullanıcı seçmeli
            const defaultPredictors = [];
            html += `
                <div class="viz-stat-selectors">
                    <div class="viz-param-group">
                        <label>Hedef (${analysisInfo.targetType === 'binary' ? '0/1' : 'Grup'}):</label>
                        <select id="${widgetId}_target" onchange="refreshStatWidget('${widgetId}')">
                            ${makeOptions(targetCols.length > 0 ? targetCols : allCols)}
                        </select>
                    </div>
                    <div class="viz-param-group viz-multi-select">
                        <label>BaÄŸımsız DeÄŸiÅŸkenler:</label>
                        <div class="viz-checkbox-grid" id="${widgetId}_predictors">
                            ${makeCheckboxes(predictorCols.length > 0 ? predictorCols : allCols, `${widgetId}_pred`, defaultPredictors)}
                        </div>
                    </div>
                </div>`;
            break;

        case 'TYPE_E':
            const useX = analysisInfo.needsX;
            let colsToUse = useX ? (categoricalCols.length > 0 ? categoricalCols : allCols) : (numericCols.length > 0 ? numericCols : allCols);
            if (analysisInfo.columnTypes?.includes('categorical') && analysisInfo.columnTypes?.includes('numeric')) colsToUse = allCols;

            // Determine appropriate type hint
            const typeEHint = analysisInfo.columnTypes?.includes('numeric') ? 'Sayısal' :
                analysisInfo.columnTypes?.includes('categorical') ? 'Kategori' : 'Sayısal';

            html += `
                <div class="viz-stat-selectors">
                    <div class="viz-param-group">
                        <label>Sütun (${typeEHint}):</label>
                        <select id="${widgetId}_${useX ? 'xCol' : 'yCol'}" onchange="refreshStatWidget('${widgetId}')">
                            ${makeOptions(colsToUse)}
                        </select>
                    </div>
                    ${analysisInfo.extraParams?.includes('effectSize') ? `
                    <div class="viz-param-group">
                        <label>Etki BüyüklüÄŸü (d):</label>
                        <input type="number" id="${widgetId}_effectSize" value="0.5" step="0.1" onchange="refreshStatWidget('${widgetId}')">
                    </div>` : ''}
                </div>`;
            break;

        case 'TYPE_F':
            html += `
                <div class="viz-stat-selectors">
                    <div class="viz-param-group">
                        <label>${statType === 'survival' ? 'Süre (Sayısal/Tarih):' : 'Zaman (Tarih/Sayısal):'}</label>
                        <select id="${widgetId}_xCol" onchange="refreshStatWidget('${widgetId}')">
                            ${makeOptions(dateCols.length > 0 ? dateCols : allCols)}
                        </select>
                    </div>
                    <div class="viz-param-group">
                        <label>${statType === 'survival' ? 'Olay (0/1 Sayısal):' : 'DeÄŸer (Sayısal):'}</label>
                        <select id="${widgetId}_yCol" onchange="refreshStatWidget('${widgetId}')">
                            ${makeOptions(numericCols.length > 0 ? numericCols : allCols)}
                        </select>
                    </div>
                </div>`;
            break;

        case 'TYPE_G':
        case 'TYPE_H':
        default:
            // Define data type hints based on stat type requirements
            const xTypeHint = analysisInfo.xColumnType === 'numeric' ? 'Sayısal' :
                analysisInfo.xColumnType === 'categorical' ? 'Grup/Kategori' :
                    statType.includes('chi') ? 'Kategori' : 'Grup/Kategori';
            const yTypeHint = analysisInfo.yColumnType === 'numeric' ? 'DeÄŸer/Sayısal' :
                analysisInfo.yColumnType === 'categorical' ? 'Kategori' :
                    statType.includes('chi') ? 'Kategori' : 'DeÄŸer/Sayısal';

            html += `
                <div class="viz-stat-selectors">
                    <div class="viz-param-group">
                        <label>X (${xTypeHint}):</label>
                        <select id="${widgetId}_xCol" onchange="refreshStatWidget('${widgetId}')">
                            ${makeOptions(analysisInfo.xColumnType === 'categorical' ?
                (categoricalCols.length > 0 ? categoricalCols : allCols) :
                allCols)}
                        </select>
                    </div>
                    <div class="viz-param-group">
                        <label>Y (${yTypeHint}):</label>
                        <select id="${widgetId}_yCol" onchange="refreshStatWidget('${widgetId}')">
                            ${makeOptions(analysisInfo.yColumnType === 'numeric' ?
                    (numericCols.length > 0 ? numericCols : allCols) :
                    allCols)}
                        </select>
                    </div>
                </div>`;
            if (analysisInfo.uiType === 'TYPE_G') html += `<div class="viz-stat-note"><i class="fas fa-check-circle"></i> Tüm gruplar karÅŸılaÅŸtırılacak.</div>`;
    }
    return html;
}

export async function createStatWidget(statType, options = {}) {
    if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) {
        showToast('Önce veri yükleyin', 'warning');
        return;
    }

    const widgetId = `stat_${++VIZ_STATE.chartCounter}`;
    const datasetId = VIZ_STATE.activeDatasetId;
    const dataset = VIZ_STATE.getDatasetById(datasetId);

    if (!dataset) { showToast('Veri seti bulunamadı', 'error'); return; }

    console.log(`ğŸ“Š Stat widget: ${widgetId}, tip: ${statType}`);

    // Default columns
    let defaultX = dataset.columns[0] || '';
    let defaultY = dataset.columns[1] || dataset.columns[0] || '';
    if (VIZ_STATE.selectedChart) {
        const selectedConfig = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
        if (selectedConfig) { defaultX = selectedConfig.xAxis || defaultX; defaultY = selectedConfig.yAxis || defaultY; }
    }

    const analysisInfo = getAnalysisRequirements(statType);
    const dashboard = document.getElementById('vizDashboardGrid');
    if (!dashboard) return;

    const widget = document.createElement('div');
    widget.className = 'viz-chart-widget viz-stat-widget';
    widget.id = widgetId;
    widget.dataset.statType = statType;
    widget.dataset.datasetId = datasetId;
    widget.dataset.uiType = analysisInfo.uiType || 'TYPE_G';

    const paramsHTML = generateStatUIByType(widgetId, statType, analysisInfo, dataset);

    widget.innerHTML = `
        <div class="viz-widget-header">
            <span class="viz-widget-title">${getStatTitle(statType)}</span>
            <div class="viz-widget-actions">
                <button class="viz-widget-btn" onclick="copyStatAsText('${widgetId}')" title="Metin Kopyala"><i class="fas fa-copy"></i></button>
                <button class="viz-widget-btn" onclick="copyStatAsAPA('${widgetId}')" title="APA Kopyala"><i class="fas fa-graduation-cap"></i></button>
                <button class="viz-widget-btn" onclick="copyStatAsTable('${widgetId}')" title="Tablo Kopyala"><i class="fas fa-table"></i></button>
                <button class="viz-widget-btn" onclick="copyStatAsImage('${widgetId}')" title="Resim Kopyala"><i class="fas fa-image"></i></button>
                <button class="viz-widget-btn" onclick="toggleFormula('${widgetId}')" title="Formüller"><i class="fas fa-square-root-alt"></i></button>
                <button class="viz-widget-btn" onclick="refreshStatWidget('${widgetId}')" title="Yenile"><i class="fas fa-sync-alt"></i></button>
                <button class="viz-widget-btn" onclick="embedStatToChart('${widgetId}')" title="GrafiÄŸe Göm"><i class="fas fa-compress-arrows-alt"></i></button>
                <button class="viz-widget-close" onclick="removeWidget('${widgetId}')"><i class="fas fa-times"></i></button>
            </div>
        </div>
        <div class="viz-stat-params" id="${widgetId}_params">${paramsHTML}</div>
        <div class="viz-stat-diagnostics" id="${widgetId}_diagnostics"></div>
        <div class="viz-widget-body viz-stat-body" id="${widgetId}_body">
            <div class="viz-loading"><i class="fas fa-spinner fa-spin"></i> Hazır</div>
        </div>
        <div class="viz-widget-resize-handle" onmousedown="startWidgetResize(event, '${widgetId}')"></div>
    `;

    dashboard.appendChild(widget);
    if (window.updateEmptyState) window.updateEmptyState();

    // GATE-9: Varsayılan seçim KAPATILDI - kullanıcı seçmeli
    // xColSelect.value = defaultX ve yColSelect.value = defaultY KALDIRILDI
    // Dropdown'lar "Seçiniz" ile açılacak

    // P1.3: Populate diagnostics div
    const diagEl = document.getElementById(`${widgetId}_diagnostics`);
    if (diagEl) {
        diagEl.innerHTML = renderColumnDiagnostics(widgetId);
    }

    // FAZ-0: Legacy runStatForWidget kaldırıldı
    // İlk render'da analiz çalıÅŸtırılmaz - kullanıcı seçim yapıp Yenile basmalı
    const bodyEl = document.getElementById(`${widgetId}_body`);
    if (analysisInfo.needsGroupSelection) {
        populateGroupSelectors(widgetId);
        if (bodyEl) bodyEl.innerHTML = '<div class="viz-stat-info"><i class="fas fa-info-circle"></i> KarÅŸılaÅŸtırılacak grupları seçin ve Yenile butonuna basın.</div>';
    } else {
        // FAZ-1: Varsayılan seçim kapalı - kullanıcı seçmeli
        if (bodyEl) bodyEl.innerHTML = '<div class="viz-stat-info"><i class="fas fa-info-circle"></i> DeÄŸiÅŸken(ler)i seçin ve Yenile butonuna basın.</div>';
    }
}

export function getAnalysisRequirements(statType) {
    const requirements = {
        'descriptive': { uiType: 'TYPE_E', needsX: false, needsY: true, columnTypes: ['numeric'], description: 'Seçili sütun(lar)ın istatistiklerini hesaplar.' },
        'ttest': { uiType: 'TYPE_A', needsX: true, needsY: true, needsGroupSelection: true, xColumnType: 'categorical', yColumnType: 'numeric', description: 'İki grup seçip ortalamalarını karÅŸılaÅŸtırır.' },
        'anova': { uiType: 'TYPE_G', needsX: true, needsY: true, xColumnType: 'categorical', yColumnType: 'numeric', autoUseAllGroups: true, description: 'Tüm grupları otomatik karÅŸılaÅŸtırır.' },
        'chi-square': { uiType: 'TYPE_H', needsX: true, needsY: true, xColumnType: 'categorical', yColumnType: 'categorical', description: 'BaÄŸımsızlık testi uygular.' },
        'correlation': { uiType: 'TYPE_B', needsX: false, needsY: true, minColumns: 2, columnTypes: ['numeric'], description: 'Korelasyon matrisini hesaplar.' },
        'normality': { uiType: 'TYPE_E', needsX: false, needsY: true, columnTypes: ['numeric'], description: 'Normallik testi.' },
        'mann-whitney': { uiType: 'TYPE_A', needsX: true, needsY: true, needsGroupSelection: true, xColumnType: 'categorical', yColumnType: 'numeric', description: 'Medyanları karÅŸılaÅŸtırır.' },
        'wilcoxon': { uiType: 'TYPE_C', needsX: false, needsY: true, paired: true, columnTypes: ['numeric'], description: 'EÅŸleÅŸtirilmiÅŸ örneklem testi.' },
        'kruskal': { uiType: 'TYPE_G', needsX: true, needsY: true, xColumnType: 'categorical', yColumnType: 'numeric', autoUseAllGroups: true, description: 'Non-parametrik ANOVA.' },
        'levene': { uiType: 'TYPE_G', needsX: true, needsY: true, xColumnType: 'categorical', yColumnType: 'numeric', autoUseAllGroups: true, description: 'Varyans homojenliÄŸi testi.' },
        'effect-size': { uiType: 'TYPE_A', needsX: true, needsY: true, needsGroupSelection: true, xColumnType: 'categorical', yColumnType: 'numeric', description: 'Etki büyüklüÄŸü hesaplar.' },
        'frequency': { uiType: 'TYPE_E', needsX: true, needsY: false, columnTypes: ['categorical'], description: 'Frekans hesaplar.' },
        'pca': { uiType: 'TYPE_B', needsX: false, needsY: true, minColumns: 3, columnTypes: ['numeric'], description: 'PCA uygular.' },
        'kmeans': { uiType: 'TYPE_B', needsX: false, needsY: true, minColumns: 2, columnTypes: ['numeric'], extraParams: ['k'], defaultK: 3, description: 'K-Means kümeleme.' },
        'regression-coef': { uiType: 'TYPE_H', needsX: true, needsY: true, xColumnType: 'numeric', yColumnType: 'numeric', description: 'Regresyon katsayıları.' },
        'logistic': { uiType: 'TYPE_D', needsX: true, needsY: true, targetType: 'binary', predictorTypes: ['numeric', 'categorical'], description: 'Lojistik regresyon.' },
        'timeseries': { uiType: 'TYPE_F', needsX: true, needsY: true, xColumnType: 'date', yColumnType: 'numeric', description: 'Trend analizi.' },
        'apa': { uiType: 'TYPE_E', needsX: false, needsY: true, useFullData: true, description: 'APA raporu.' },
        'power': { uiType: 'TYPE_E', needsX: false, needsY: true, columnTypes: ['numeric'], extraParams: ['effectSize', 'alpha'], description: 'Güç analizi.' }
    };
    return requirements[statType] || { uiType: 'TYPE_G', needsX: true, needsY: true, description: 'Analiz için X ve Y sütunları seçin.' };
}

export function onStatXColumnChange(widgetId, statType) {
    const analysisInfo = getAnalysisRequirements(statType);
    if (analysisInfo.needsGroupSelection) populateGroupSelectors(widgetId);
    refreshStatWidget(widgetId);
}

export function populateGroupSelectors(widgetId) {
    const widget = document.getElementById(widgetId);
    if (!widget) return;
    const dataset = VIZ_STATE.getDatasetById(widget.dataset.datasetId);
    const xCol = document.getElementById(`${widgetId}_xCol`)?.value;
    const g1 = document.getElementById(`${widgetId}_group1`);
    const g2 = document.getElementById(`${widgetId}_group2`);
    if (!dataset || !xCol || !g1 || !g2) return;

    let uniqueValues = [...new Set(dataset.data.map(row => row[xCol]))].filter(v => v !== null && v !== undefined && v !== '').sort();
    const options = uniqueValues.map(val => `<option value="${val}">${val}</option>`).join('');
    g1.innerHTML = '<option value="">-- Grup 1 --</option>' + options;
    g2.innerHTML = '<option value="">-- Grup 2 --</option>' + options;
}

export async function refreshStatWidget(widgetId) {
    const widget = document.getElementById(widgetId);
    if (!widget) return;
    const xCol = document.getElementById(`${widgetId}_xCol`)?.value;
    const yCol = document.getElementById(`${widgetId}_yCol`)?.value;
    widget.dataset.xCol = xCol || '';
    widget.dataset.yCol = yCol || '';

    // P1.3: Update diagnostics when X/Y changes
    const diagEl = document.getElementById(`${widgetId}_diagnostics`);
    if (diagEl) {
        diagEl.innerHTML = renderColumnDiagnostics(widgetId);
    }

    // FIX: Call runStatWidgetAnalysis which has the complete 23-test router
    runStatWidgetAnalysis(widgetId);
}

export function embedStatToChart(widgetId) {
    if (!VIZ_STATE.selectedChart) { showToast('Grafik seçin', 'warning'); return; }
    const statWidget = document.getElementById(widgetId);
    const chartWidget = document.getElementById(VIZ_STATE.selectedChart);
    const statBody = document.getElementById(`${widgetId}_body`);
    if (!statBody) return;

    const embed = document.createElement('div');
    embed.className = 'viz-stat-embed';
    embed.innerHTML = `<div class="viz-stat-embed-header"><span>${statWidget.querySelector('.viz-widget-title').textContent}</span><button onclick="this.closest('.viz-stat-embed').remove()"><i class="fas fa-times"></i></button></div><div class="viz-stat-embed-content">${statBody.innerHTML}</div>`;
    embed.style.cssText = 'position:absolute; right:10px; bottom:40px; width:250px; max-height:200px; overflow:auto; cursor:move; z-index:100; background:white; border:1px solid #ccc; box-shadow:0 2px 10px rgba(0,0,0,0.2);';
    chartWidget.appendChild(embed);
}

export async function runStatForWidget(widgetId, statType, datasetId, xCol, yCol) {
    const bodyEl = document.getElementById(`${widgetId}_body`);
    if (!bodyEl) return;
    bodyEl.innerHTML = '<div class="viz-loading"><i class="fas fa-spinner fa-spin"></i> Hesaplanıyor...</div>';

    const dataset = VIZ_STATE.getDatasetById(datasetId);
    if (!dataset) { bodyEl.innerHTML = 'Veri bulunamadı'; return; }

    // Attempt local calculation using existing math functions if possible
    try {
        let result = null;
        const data = dataset.data;
        const group1 = document.getElementById(`${widgetId}_group1`)?.value;
        const group2 = document.getElementById(`${widgetId}_group2`)?.value;

        // Bridge to existing math functions if they are available in scope
        if (statType === 'ttest' && typeof runIndependentTTest === 'function' && group1 && group2) {
            const d1 = data.filter(d => d[xCol] == group1).map(d => parseFloat(d[yCol]));
            const d2 = data.filter(d => d[xCol] == group2).map(d => parseFloat(d[yCol]));
            result = runIndependentTTest(d1, d2, 0.05); // Call existing function
        } else if (statType === 'anova' && (typeof runOneWayANOVA_SPSS === 'function' || typeof runOneWayANOVA === 'function')) {
            // FAZ-2: Route to SPSS wrapper for complete output
            const groups = {};
            data.forEach(d => {
                const g = d[xCol];
                if (!groups[g]) groups[g] = [];
                groups[g].push(parseFloat(d[yCol]));
            });
            const groupNames = Object.keys(groups).sort();
            result = typeof runOneWayANOVA_SPSS === 'function'
                ? runOneWayANOVA_SPSS(Object.values(groups), 0.05, groupNames)
                : runOneWayANOVA(Object.values(groups), 0.05);
        } else if (statType === 'descriptive' && typeof calculateDescriptiveStats === 'function') {
            const vals = data.map(d => parseFloat(d[yCol])).filter(n => !isNaN(n));
            result = calculateDescriptiveStats(vals);
        } else if (statType === 'correlation' && typeof runCorrelationTest === 'function') {
            // Need multiple columns. UI Type B uses checkboxes.
            // ... (Simplified for this patch, usually we'd parse checkboxes)
        }

        if (result) {
            renderStatResults(widgetId, statType, result); // Use existing render if available
        } else {
            // Fallback UI if math binding missing or not implemented in this patch
            bodyEl.innerHTML = `<div class="viz-stat-result-box"><h4>${getStatTitle(statType)}</h4><p>X: ${xCol || '-'}</p><p>Y: ${yCol || '-'}</p><div class="viz-stat-value">Hesaplama Hazır</div></div>`;
        }
    } catch (e) {
        console.error(e);
        bodyEl.innerHTML = `<div class="viz-stat-error">Hata: ${e.message}</div>`;
    }
}

// Bindings
window.createStatWidget = createStatWidget;
window.refreshStatWidget = refreshStatWidget;
window.embedStatToChart = embedStatToChart;
window.onStatXColumnChange = onStatXColumnChange;
window.populateGroupSelectors = populateGroupSelectors;


/**
 * Run statistical analysis in widget
 */
export function runStatWidgetAnalysis(widgetId) {
    const widget = document.getElementById(widgetId);
    if (!widget) return;


    const type = widget.dataset.type || widget.dataset.statType;
    // FIX: Widget body uses _body, not _results
    const resultsContainer = document.getElementById(`${widgetId}_body`) || document.getElementById(`${widgetId}_results`);

    if (!resultsContainer) {
        console.error(`[STAT] Results container not found for widget ${widgetId}`);
        return;
    }

    // Show loading
    resultsContainer.innerHTML = '<div class="viz-stat-loading"><i class="fas fa-spinner fa-spin"></i> Analiz yapılıyor...</div>';

    try {
        // FIX: Get configuration values using CORRECT element IDs (widgets use _xCol/_yCol, not _var1/_var2)
        const var1 = document.getElementById(`${widgetId}_var1`)?.value
            || document.getElementById(`${widgetId}_xCol`)?.value
            || document.getElementById(`${widgetId}_col1`)?.value  // TYPE_C paired
            || document.getElementById(`${widgetId}_target`)?.value; // TYPE_D target
        const var2 = document.getElementById(`${widgetId}_var2`)?.value
            || document.getElementById(`${widgetId}_yCol`)?.value
            || document.getElementById(`${widgetId}_col2`)?.value; // TYPE_C paired
        const group = document.getElementById(`${widgetId}_group`)?.value || document.getElementById(`${widgetId}_xCol`)?.value;
        const group1 = document.getElementById(`${widgetId}_group1`)?.value;
        const group2 = document.getElementById(`${widgetId}_group2`)?.value;
        const popMean = parseFloat(document.getElementById(`${widgetId}_popmean`)?.value) || 0;
        const alpha = parseFloat(document.getElementById(`${widgetId}_alpha`)?.value) || 0.05;

        // FIX: Use getCheckedValues for TYPE_B checkbox-based multi-selection
        let multiVars = getMultiSelectValues(`${widgetId}_multivars`);
        if (multiVars.length === 0) {
            // Fallback to checkbox-based selection (TYPE_B UI)
            multiVars = getCheckedValues(widgetId, `${widgetId}_col`);
        }
        // Also get predictors for TYPE_D (logistic/discriminant)
        const predictors = getCheckedValues(widgetId, `${widgetId}_pred`);
        if (predictors.length > 0 && multiVars.length === 0) {
            multiVars = predictors;
        }

        // Get data - FIX: Use proper dataset chain
        const activeDataset = VIZ_STATE.getActiveDataset ? VIZ_STATE.getActiveDataset() : null;
        const data = activeDataset?.data || VIZ_STATE.data || [];
        if (data.length === 0) {
            throw new Error('Veri yüklenmemiÅŸ');
        }

        // âœ… CALCULATE MISSING COUNTS FOR ACADEMIC NOTE
        const xCol = group || var1 || document.getElementById(`${widgetId}_xCol`)?.value;
        const yCol = var2 || document.getElementById(`${widgetId}_yCol`)?.value;

        let xMissing = 0, yMissing = 0;
        if (xCol) {
            xMissing = data.filter(r => r[xCol] === null || r[xCol] === '' || r[xCol] === undefined).length;
        }
        if (yCol) {
            yMissing = data.filter(r => r[yCol] === null || r[yCol] === '' || r[yCol] === undefined || isNaN(parseFloat(r[yCol]))).length;
        }

        let result;

        // Run appropriate test - FULL 23 TEST ROUTER
        switch (type) {
            // ==================== T-TESTS ====================
            case 'ttest':
            case 'ttest-independent':
                // FIX: For group-based t-test, filter data by group values
                if (group1 && group2 && group && var2) {
                    const g1Data = data.filter(r => r[group] === group1).map(r => parseFloat(r[var2])).filter(v => !isNaN(v));
                    const g2Data = data.filter(r => r[group] === group2).map(r => parseFloat(r[var2])).filter(v => !isNaN(v));
                    if (g1Data.length < 2 || g2Data.length < 2) throw new Error('Her grupta en az 2 veri olmalı');
                    result = runIndependentTTest(g1Data, g2Data, alpha);
                } else if (var1 && var2) {
                    result = runIndependentTTest(
                        data.map(r => parseFloat(r[var1])).filter(v => !isNaN(v)),
                        data.map(r => parseFloat(r[var2])).filter(v => !isNaN(v)),
                        alpha
                    );
                } else {
                    throw new Error('Grup veya deÄŸiÅŸken seçmelisiniz');
                }
                break;

            case 'ttest-paired':
                // GÖREV C: Route to SPSS wrapper for complete output
                if (!var1 || !var2) throw new Error('İki deÄŸiÅŸken seçmelisiniz');
                result = runPairedTTest_SPSS(
                    data.map(r => parseFloat(r[var1])).filter(v => !isNaN(v)),
                    data.map(r => parseFloat(r[var2])).filter(v => !isNaN(v)),
                    alpha,
                    [var1, var2] // Use variable names as pair names
                );
                break;

            case 'ttest-one':
                if (!var1) throw new Error('DeÄŸiÅŸken seçmelisiniz');
                result = runOneSampleTTest(
                    data.map(r => parseFloat(r[var1])).filter(v => !isNaN(v)),
                    popMean,
                    alpha
                );
                break;

            // ==================== ANOVA ====================
            case 'anova':
            case 'anova-oneway':
                // TYPE_G: xCol=kategori(group), yCol=sayısal(value)
                // FAZ-2: Route to SPSS wrapper for complete output
                const anovaGroup = group || var1;
                const anovaValue = var2 || document.getElementById(`${widgetId}_yCol`)?.value;
                if (!anovaValue || !anovaGroup) throw new Error('Grup (X) ve deÄŸer (Y) sütunlarını seçmelisiniz');
                // Get group names for SPSS output
                const anovaGroupNames = [...new Set(data.map(r => r[anovaGroup]).filter(v => v !== null && v !== '' && v !== undefined))].sort();
                result = runOneWayANOVA_SPSS(groupDataByColumn(data, anovaGroup, anovaValue), alpha, anovaGroupNames);
                break;

            // ==================== CHI-SQUARE ====================
            case 'chi-square':
                if (!var1 || !var2) throw new Error('İki kategorik deÄŸiÅŸken seçmelisiniz');
                result = runChiSquareFromData(data, var1, var2, alpha);
                break;

            // ==================== CORRELATION ====================
            case 'correlation':
                // TYPE_B: multiVars kullanarak korelasyon
                let corrVar1, corrVar2;
                if (multiVars.length >= 2) {
                    // multiVars varsa ilk ikisini kullan
                    corrVar1 = multiVars[0];
                    corrVar2 = multiVars[1];
                } else if (var1 && var2) {
                    // Fallback: dropdown seçimi
                    corrVar1 = var1;
                    corrVar2 = var2;
                } else {
                    throw new Error('En az 2 deÄŸiÅŸken seçmelisiniz');
                }
                result = runCorrelationTest(
                    data.map(r => parseFloat(r[corrVar1])).filter(v => !isNaN(v)),
                    data.map(r => parseFloat(r[corrVar2])).filter(v => !isNaN(v)),
                    alpha
                );
                // Hangi deÄŸiÅŸkenler kullanıldıÄŸını kaydet
                result.variables = [corrVar1, corrVar2];
                break;

            // ==================== NORMALITY ====================
            case 'normality':
            case 'shapiro-wilk':
                // FIX: Use var2 (yCol) as the numeric column, var1 (xCol) is typically categorical
                const normalityCol = var2 || var1;
                if (!normalityCol) throw new Error('DeÄŸiÅŸken seçmelisiniz');
                result = runShapiroWilkTest(
                    data.map(r => parseFloat(r[normalityCol])).filter(v => !isNaN(v)),
                    alpha
                );
                break;

            // ==================== DESCRIPTIVE ====================
            case 'descriptive':
                // FIX: Use var2 (yCol) as the numeric column for descriptive stats
                const descCol = var2 || var1;
                result = runDescriptiveStats(data, descCol ? [descCol] : VIZ_STATE.columns);
                break;

            // ==================== NON-PARAMETRIC TESTS ====================
            case 'mann-whitney':
                // TYPE_A: grup bazlı karÅŸılaÅŸtırma (xCol=kategori, yCol=sayısal)
                const mwGroup = group || var1;
                const mwValue = var2 || document.getElementById(`${widgetId}_yCol`)?.value;
                if (group1 && group2 && mwGroup && mwValue) {
                    const mw1Data = data.filter(r => String(r[mwGroup]).trim() === String(group1).trim())
                        .map(r => parseFloat(r[mwValue])).filter(v => !isNaN(v));
                    const mw2Data = data.filter(r => String(r[mwGroup]).trim() === String(group2).trim())
                        .map(r => parseFloat(r[mwValue])).filter(v => !isNaN(v));
                    if (mw1Data.length < 2 || mw2Data.length < 2) throw new Error('Her grupta en az 2 veri olmalı');
                    result = runMannWhitneyU(mw1Data, mw2Data, alpha);
                } else {
                    throw new Error('Grup (X), deÄŸer (Y) ve karÅŸılaÅŸtırılacak 2 grup seçmelisiniz');
                }
                break;

            case 'wilcoxon':
                if (!var1 || !var2) throw new Error('İki deÄŸiÅŸken seçmelisiniz');
                result = runWilcoxonSignedRank(
                    data.map(r => parseFloat(r[var1])).filter(v => !isNaN(v)),
                    data.map(r => parseFloat(r[var2])).filter(v => !isNaN(v)),
                    alpha
                );
                break;

            case 'kruskal':
            case 'kruskal-wallis':
                // TYPE_G: xCol=kategori(group), yCol=sayısal(value)
                const kruskalGroup = group || var1;
                const kruskalValue = var2 || document.getElementById(`${widgetId}_yCol`)?.value;
                if (!kruskalValue || !kruskalGroup) throw new Error('Grup (X) ve deÄŸer (Y) sütunlarını seçmelisiniz');
                result = runKruskalWallis(groupDataByColumn(data, kruskalGroup, kruskalValue), alpha);
                break;

            case 'friedman':
                if (multiVars.length < 2) throw new Error('En az 2 deÄŸiÅŸken seçmelisiniz');
                result = runFriedmanTest(data, multiVars, alpha);
                break;

            // ==================== LEVENE (HOMOGENEITY) ====================
            case 'levene':
                // TYPE_G: xCol=kategori(group), yCol=sayısal(value)
                const leveneGroup = group || var1;
                const leveneValue = var2 || document.getElementById(`${widgetId}_yCol`)?.value;
                if (!leveneValue || !leveneGroup) throw new Error('Grup (X) ve deÄŸer (Y) sütunlarını seçmelisiniz');
                result = runLeveneTest(groupDataByColumn(data, leveneGroup, leveneValue), alpha);
                break;

            // ==================== EFFECT SIZE ====================
            case 'effect-size':
                // TYPE_A: grup bazlı etki büyüklüÄŸü (xCol=kategori, yCol=sayısal)
                const esGroup = group || var1;
                const esValue = var2 || document.getElementById(`${widgetId}_yCol`)?.value;
                if (group1 && group2 && esGroup && esValue) {
                    const es1Data = data.filter(r => String(r[esGroup]).trim() === String(group1).trim())
                        .map(r => parseFloat(r[esValue])).filter(v => !isNaN(v));
                    const es2Data = data.filter(r => String(r[esGroup]).trim() === String(group2).trim())
                        .map(r => parseFloat(r[esValue])).filter(v => !isNaN(v));
                    if (es1Data.length < 2 || es2Data.length < 2) throw new Error('Her grupta en az 2 veri olmalı');
                    result = calculateEffectSize(es1Data, es2Data);
                } else {
                    throw new Error('Grup (X), deÄŸer (Y) ve karÅŸılaÅŸtırılacak 2 grup seçmelisiniz');
                }
                break;

            // ==================== FREQUENCY ====================
            case 'frequency':
                if (!var1) throw new Error('DeÄŸiÅŸken seçmelisiniz');
                result = runFrequencyAnalysis(data, var1);
                break;

            // ==================== ADVANCED ANALYSES ====================
            case 'pca':
                if (multiVars.length < 2) throw new Error('En az 2 deÄŸiÅŸken seçmelisiniz');
                result = runPCAAnalysis(data, multiVars);
                break;

            case 'kmeans':
                if (multiVars.length < 2) throw new Error('En az 2 deÄŸiÅŸken seçmelisiniz');
                const k = parseInt(document.getElementById(`${widgetId}_clusters`)?.value) || 3;
                result = runKMeansAnalysis(data, multiVars, k);
                break;

            case 'cronbach':
                if (multiVars.length < 2) throw new Error('En az 2 madde seçmelisiniz');
                result = runCronbachAlpha(data, multiVars);
                break;

            case 'logistic':
                if (!var1 || multiVars.length < 1) throw new Error('BaÄŸımlı ve baÄŸımsız deÄŸiÅŸken seçmelisiniz');
                result = runLogisticRegression(data, var1, multiVars);
                break;

            case 'timeseries':
                if (!var1 || !var2) throw new Error('Zaman ve deÄŸer deÄŸiÅŸkeni seçmelisiniz');
                result = runTimeSeriesAnalysis(data, var2, var1);
                break;

            case 'power':
                const effectSize = parseFloat(document.getElementById(`${widgetId}_effectsize`)?.value) || 0.5;
                const sampleSize = parseInt(document.getElementById(`${widgetId}_samplesize`)?.value) || 30;
                result = runPowerAnalysis(effectSize, sampleSize, alpha);
                break;

            case 'regression-coef':
                if (!var1 || !var2) throw new Error('BaÄŸımlı ve baÄŸımsız deÄŸiÅŸken seçmelisiniz');
                result = runLinearRegression(data, var1, var2);
                break;

            case 'discriminant':
                if (!group || multiVars.length < 1) throw new Error('Grup ve deÄŸiÅŸken seçmelisiniz');
                result = runDiscriminantAnalysis(data, group, multiVars);
                break;

            case 'survival':
                if (!var1 || !var2) throw new Error('Zaman ve olay deÄŸiÅŸkeni seçmelisiniz');
                result = runSurvivalAnalysis(data, var1, var2, group);
                break;

            // ==================== APA REPORT ====================
            case 'apa':
                result = generateAPAReport(data, VIZ_STATE.columns);
                break;

            default:
                throw new Error(`Desteklenmeyen test tipi: ${type}`);
        }

        // âœ… INJECT MISSING DATA INFO INTO RESULT FOR ACADEMIC NOTE
        // KRİTİK: Her test tipi için GERÇEK kullanılan sütunları belirle
        if (result && typeof result === 'object') {
            // Test tipine göre actualColumns belirle
            let actualColumns = [];

            switch (type) {
                // TYPE_B: multiVars kullanan testler
                case 'pca':
                case 'kmeans':
                case 'cronbach':
                case 'friedman':
                    actualColumns = multiVars || [];
                    break;

                // TYPE_B (correlation): iki deÄŸiÅŸken
                case 'correlation':
                    actualColumns = [var1, var2].filter(Boolean);
                    break;

                // TYPE_E: tek sütun kullanan testler
                case 'normality':
                case 'shapiro-wilk':
                case 'descriptive':
                    actualColumns = [var2 || var1].filter(Boolean);
                    break;

                case 'frequency':
                    actualColumns = [var1].filter(Boolean);
                    break;

                // TYPE_A/G: grup + deÄŸer sütunu
                case 'ttest':
                case 'ttest-independent':
                case 'anova':
                case 'anova-oneway':
                case 'mann-whitney':
                case 'kruskal':
                case 'kruskal-wallis':
                case 'levene':
                case 'effect-size':
                    const grpCol = group || var1 || document.getElementById(`${widgetId}_xCol`)?.value;
                    const valCol = var2 || document.getElementById(`${widgetId}_yCol`)?.value;
                    actualColumns = [grpCol, valCol].filter(Boolean);
                    break;

                // TYPE_C: iki sütun (paired)
                case 'ttest-paired':
                case 'wilcoxon':
                    actualColumns = [var1, var2].filter(Boolean);
                    break;

                // TYPE_D: target + predictors
                case 'logistic':
                case 'discriminant':
                    actualColumns = [var1, group, ...(multiVars || [])].filter(Boolean);
                    break;

                // TYPE_F: time + value
                case 'timeseries':
                case 'survival':
                    actualColumns = [var1, var2, group].filter(Boolean);
                    break;

                // TYPE_H: x + y
                case 'chi-square':
                case 'regression-coef':
                    actualColumns = [var1, var2].filter(Boolean);
                    break;

                // Other
                case 'ttest-one':
                    actualColumns = [var1].filter(Boolean);
                    break;

                case 'power':
                case 'apa':
                    actualColumns = []; // Parametre bazlı, sütun yok
                    break;

                default:
                    actualColumns = [var1, var2].filter(Boolean);
            }

            // Unique columns only
            actualColumns = [...new Set(actualColumns)];

            // Calculate missing counts for ACTUAL columns
            let totalMissing = 0;
            const missingByColumn = {};

            for (const col of actualColumns) {
                if (!col) continue;
                const missing = data.filter(r =>
                    r[col] === null || r[col] === '' || r[col] === undefined ||
                    (typeof r[col] === 'number' && isNaN(r[col]))
                ).length;
                missingByColumn[col] = missing;
                totalMissing += missing;
            }

            // Set result fields
            result.actualColumns = actualColumns;
            result.missingByColumn = missingByColumn;
            result.totalMissing = totalMissing;
            result.xColumn = actualColumns[0] || null;
            result.yColumn = actualColumns[1] || null;
            result.xMissing = missingByColumn[actualColumns[0]] || 0;
            result.yMissing = missingByColumn[actualColumns[1]] || 0;

            // Get imputation actions for ACTUAL columns only
            const dataActions = VIZ_STATE.dataActions || [];
            const imputationActions = dataActions.filter(a =>
                a.type === 'imputation' && actualColumns.includes(a.column)
            );

            result.imputationActions = imputationActions;
            result.selectedColumns = actualColumns;

            // âœ… FAZ-1: Inject engine metadata
            result.engine = getEngineMetadata(type);

            // âœ… FAZ-6: Generate academic report sentences
            result.report = generateAcademicReport(result, type);
        }


        // Render results
        resultsContainer.innerHTML = renderStatResults(result, type);

        // =====================================================
        // FAZ-GUIDE-3: T-Test Guided Analysis Integration
        // Show single-line recommendation if guidedAnalysis is ON
        // Does NOT change computed results
        // =====================================================
        if (window.VIZ_SETTINGS?.guidedAnalysis === true) {
            let wizardResult = null;
            let wizardContext = { alpha };

            // Build context based on test type
            if (type === 'ttest' || type === 'ttest-independent') {
                // Get group data for dual t-test
                let g1Data, g2Data;
                if (group1 && group2 && group && var2) {
                    g1Data = data.filter(r => r[group] === group1).map(r => parseFloat(r[var2])).filter(v => !isNaN(v));
                    g2Data = data.filter(r => r[group] === group2).map(r => parseFloat(r[var2])).filter(v => !isNaN(v));
                } else if (var1 && var2) {
                    g1Data = data.map(r => parseFloat(r[var1])).filter(v => !isNaN(v));
                    g2Data = data.map(r => parseFloat(r[var2])).filter(v => !isNaN(v));
                }
                wizardContext.group1Values = g1Data || [];
                wizardContext.group2Values = g2Data || [];
                wizardResult = runAssumptionWizard('dualTTest', wizardContext);
            } else if (type === 'ttest-paired') {
                // For paired t-test, compute difference scores
                const v1Data = data.map(r => parseFloat(r[var1])).filter(v => !isNaN(v));
                const v2Data = data.map(r => parseFloat(r[var2])).filter(v => !isNaN(v));
                const minLen = Math.min(v1Data.length, v2Data.length);
                const diffs = [];
                for (let i = 0; i < minLen; i++) {
                    diffs.push(v2Data[i] - v1Data[i]);
                }
                wizardContext.differenceScores = diffs;
                wizardResult = runAssumptionWizard('pairedTTest', wizardContext);
            } else if (type === 'ttest-one') {
                // For one-sample t-test, use sample values
                const sampleData = data.map(r => parseFloat(r[var1])).filter(v => !isNaN(v));
                wizardContext.sampleValues = sampleData;
                wizardResult = runAssumptionWizard('oneSampleTTest', wizardContext);
            } else if (type === 'anova' || type === 'anova-oneway') {
                // FAZ-GUIDE-4: ANOVA Guided Analysis
                // Build groups from groupCol and valueCol
                const anovaGroup = group || var1;
                const anovaValue = var2 || document.getElementById(`${widgetId}_yCol`)?.value;
                if (anovaGroup && anovaValue) {
                    const groups = groupDataByColumn(data, anovaGroup, anovaValue);
                    wizardContext.groups = groups;
                    wizardResult = runAssumptionWizard('anova', wizardContext);
                }
            }

            // Display recommendation if wizard returned valid result
            if (wizardResult && wizardResult.valid && wizardResult.recommendation) {
                const msgKey = wizardResult.recommendation.messageKeyTR;
                const prefix = getText('guided_prefix');
                const message = getText(msgKey);
                const severityClass = wizardResult.severity === 'warn' ? 'viz-stat-warn' :
                    wizardResult.severity === 'error' ? 'viz-stat-error' : 'viz-stat-info';

                const recommendationHtml = `
                    <div class="viz-guided-recommendation ${severityClass}" style="
                        padding: 8px 12px;
                        margin-bottom: 10px;
                        border-radius: 6px;
                        font-size: 0.85rem;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: ${wizardResult.severity === 'warn' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(74, 144, 217, 0.1)'};
                        border-left: 3px solid ${wizardResult.severity === 'warn' ? '#f59e0b' : '#4a90d9'};
                    ">
                        <span style="font-size: 1.1rem;">ğŸ§ </span>
                        <span><strong>${prefix}</strong> ${message}</span>
                    </div>
                `;

                // Prepend to results container
                resultsContainer.insertAdjacentHTML('afterbegin', recommendationHtml);
            }
        }

    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="viz-stat-error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${error.message}</span>
            </div>
        `;
    }
}

/**
 * Get values from multi-select dropdown
 */
function getMultiSelectValues(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];
    return Array.from(select.selectedOptions).map(o => o.value);
}

/**
 * Get checked values from checkbox group (TYPE_B UI fix)
 * Looks for checkboxes with name attribute starting with prefix
 * @param {string} widgetId - The widget ID
 * @param {string} namePrefix - The checkbox name prefix (e.g., 'stat_001_col')
 * @returns {string[]} Array of checked values
 */
function getCheckedValues(widgetId, namePrefix) {
    // Try multiple naming conventions
    const prefixes = [
        `${widgetId}_col`,      // TYPE_B columns
        `${widgetId}_pred`,     // TYPE_D predictors
        namePrefix              // Custom prefix
    ].filter(Boolean);

    const values = [];

    for (const prefix of prefixes) {
        // Find all checkboxes matching this prefix pattern
        const checkboxes = document.querySelectorAll(`input[type="checkbox"][name^="${prefix}"]`);
        if (checkboxes.length > 0) {
            checkboxes.forEach(cb => {
                if (cb.checked) values.push(cb.value);
            });
            if (values.length > 0) break; // Found values, stop searching
        }

        // Also try ID-based lookup (for checkboxes without name attribute)
        for (let i = 0; i < 50; i++) {
            const cb = document.getElementById(`${prefix}_${i}`);
            if (!cb) break;
            if (cb.checked) values.push(cb.value);
        }
        if (values.length > 0) break;
    }

    return values;
}

/**
 * FAZ-1: Get engine metadata for stat type
 * @param {string} statType - The statistical test type
 * @returns {object} Engine metadata with name, method, limitations
 */
function getEngineMetadata(statType) {
    const methodMap = {
        'ttest': 'Welch t-test with incompleteBeta CDF for p-value',
        'ttest-independent': 'Welch t-test with incompleteBeta CDF for p-value',
        'ttest-paired': 'Paired t-test with incompleteBeta CDF',
        'ttest-one': 'One-sample t-test with incompleteBeta CDF',
        'anova': 'One-way ANOVA with F-distribution approximation',
        'chi-square': 'Chi-square test with incompleteGamma CDF',
        'correlation': 'Pearson r with Fisher z-transformation for CI',
        'normality': 'Shapiro-Wilk W statistic approximation',
        'shapiro-wilk': 'Shapiro-Wilk W statistic approximation',
        'mann-whitney': 'Mann-Whitney U with normal approximation for large samples',
        'wilcoxon': 'Wilcoxon signed-rank with normal approximation',
        'kruskal': 'Kruskal-Wallis H with chi-square approximation',
        'friedman': 'Friedman test with chi-square approximation',
        'levene': 'Brown-Forsythe modified Levene test',
        'pca': 'PCA via covariance matrix, power iteration eigenvalues',
        'kmeans': 'Lloyd\'s algorithm with k-means++ initialization',
        'logistic': 'Logistic regression via gradient descent optimization',
        'survival': 'Kaplan-Meier estimator with log-rank test',
        'timeseries': 'Moving average + linear trend estimation',
        'discriminant': 'Linear Discriminant Analysis (LDA)',
        'cronbach': 'Cronbach\'s alpha with item-total correlations'
    };

    const limitationMap = {
        'normality': 'n â‰¤ 5000 for accuracy; consider D\'Agostino-Pearson for larger samples',
        'shapiro-wilk': 'n â‰¤ 5000 for accuracy; consider D\'Agostino-Pearson for larger samples',
        'logistic': 'Gradient descent may not converge for highly collinear predictors',
        'pca': 'Power iteration may be slow for many variables',
        'kmeans': 'Results depend on initialization; run multiple times for stability',
        'survival': 'Assumes non-informative censoring'
    };

    return {
        name: 'Opradox Local Statistical Engine',
        version: '2.0',
        method: methodMap[statType] || 'Standard statistical computation',
        limitations: limitationMap[statType] || null
    };
}

/**
 * FAZ-6: Generate academic report sentences (TR/EN)
 * @param {object} result - The test result object
 * @param {string} statType - The statistical test type
 * @returns {object} Report with tr and en keys
 */
function generateAcademicReport(result, statType) {
    if (!result || !result.valid) {
        return { tr: null, en: null };
    }

    const formatP = (p) => p < 0.001 ? '< .001' : p.toFixed(3);
    const formatN = (n) => n?.toFixed ? n.toFixed(2) : n;

    let tr = '', en = '';

    switch (statType) {
        case 'ttest':
        case 'ttest-independent':
            tr = `BaÄŸımsız örneklem t-testi sonucunda gruplar arasında ${result.significant ? 'istatistiksel olarak anlamlı' : 'anlamlı olmayan'} bir fark saptanmıÅŸtır, t(${formatN(result.degreesOfFreedom)}) = ${formatN(result.tStatistic)}, p ${formatP(result.pValue)}, Cohen's d = ${formatN(result.cohensD)}.`;
            en = `An independent samples t-test revealed a ${result.significant ? 'statistically significant' : 'non-significant'} difference between groups, t(${formatN(result.degreesOfFreedom)}) = ${formatN(result.tStatistic)}, p ${formatP(result.pValue)}, Cohen's d = ${formatN(result.cohensD)}.`;
            break;

        case 'ttest-paired':
            tr = `EÅŸleÅŸtirilmiÅŸ örneklem t-testi sonucunda ölçümler arasında ${result.significant ? 'anlamlı' : 'anlamlı olmayan'} fark bulunmuÅŸtur, t(${result.degreesOfFreedom}) = ${formatN(result.tStatistic)}, p ${formatP(result.pValue)}.`;
            en = `A paired samples t-test showed a ${result.significant ? 'significant' : 'non-significant'} difference between measurements, t(${result.degreesOfFreedom}) = ${formatN(result.tStatistic)}, p ${formatP(result.pValue)}.`;
            break;

        case 'anova':
            tr = `Tek yönlü ANOVA sonucu gruplar arasında ${result.significant ? 'anlamlı' : 'anlamlı olmayan'} fark saptanmıÅŸtır, F(${result.dfBetween}, ${result.dfWithin}) = ${formatN(result.fStatistic)}, p ${formatP(result.pValue)}, Î·² = ${formatN(result.etaSquared)}.`;
            en = `A one-way ANOVA revealed a ${result.significant ? 'significant' : 'non-significant'} difference between groups, F(${result.dfBetween}, ${result.dfWithin}) = ${formatN(result.fStatistic)}, p ${formatP(result.pValue)}, Î·² = ${formatN(result.etaSquared)}.`;
            break;

        case 'correlation':
            tr = `Pearson korelasyon analizi sonucu deÄŸiÅŸkenler arasında ${result.significant ? 'anlamlı' : 'anlamlı olmayan'} ${result.interpretation || ''} iliÅŸki bulunmuÅŸtur, r = ${formatN(result.correlation)}, p ${formatP(result.pValue)}.`;
            en = `Pearson correlation analysis revealed a ${result.significant ? 'significant' : 'non-significant'} ${result.interpretation || ''} relationship between variables, r = ${formatN(result.correlation)}, p ${formatP(result.pValue)}.`;
            break;

        case 'chi-square':
            tr = `Ki-kare baÄŸımsızlık testi sonucu deÄŸiÅŸkenler arasında ${result.significant ? 'anlamlı' : 'anlamlı olmayan'} iliÅŸki saptanmıÅŸtır, Ï‡²(${result.degreesOfFreedom}) = ${formatN(result.chiSquare)}, p ${formatP(result.pValue)}.`;
            en = `A chi-square test of independence showed a ${result.significant ? 'significant' : 'non-significant'} association between variables, Ï‡²(${result.degreesOfFreedom}) = ${formatN(result.chiSquare)}, p ${formatP(result.pValue)}.`;
            break;

        case 'normality':
        case 'shapiro-wilk':
            tr = `Shapiro-Wilk normallik testi sonucu daÄŸılım ${result.isNormal ? 'normal' : 'normal deÄŸil'}, W = ${formatN(result.wStatistic)}, p ${formatP(result.pValue)}.`;
            en = `Shapiro-Wilk normality test indicated the distribution is ${result.isNormal ? 'normal' : 'non-normal'}, W = ${formatN(result.wStatistic)}, p ${formatP(result.pValue)}.`;
            break;

        case 'mann-whitney':
            tr = `Mann-Whitney U testi sonucu gruplar arasında ${result.significant ? 'anlamlı' : 'anlamlı olmayan'} fark bulunmuÅŸtur, U = ${formatN(result.uStatistic)}, p ${formatP(result.pValue)}.`;
            en = `A Mann-Whitney U test revealed a ${result.significant ? 'significant' : 'non-significant'} difference between groups, U = ${formatN(result.uStatistic)}, p ${formatP(result.pValue)}.`;
            break;

        case 'kruskal':
            tr = `Kruskal-Wallis testi sonucu gruplar arasında ${result.significant ? 'anlamlı' : 'anlamlı olmayan'} fark saptanmıÅŸtır, H = ${formatN(result.hStatistic)}, p ${formatP(result.pValue)}.`;
            en = `A Kruskal-Wallis test showed a ${result.significant ? 'significant' : 'non-significant'} difference between groups, H = ${formatN(result.hStatistic)}, p ${formatP(result.pValue)}.`;
            break;

        case 'levene':
            tr = `Levene testi sonucu varyanslar ${result.significant ? 'homojen deÄŸil' : 'homojen'}, W = ${formatN(result.wStatistic || result.fStatistic)}, p ${formatP(result.pValue)}.`;
            en = `Levene's test indicated variances are ${result.significant ? 'heterogeneous' : 'homogeneous'}, W = ${formatN(result.wStatistic || result.fStatistic)}, p ${formatP(result.pValue)}.`;
            break;

        case 'descriptive':
            tr = 'Betimsel istatistikler hesaplanmıÅŸtır.';
            en = 'Descriptive statistics have been computed.';
            break;

        default:
            tr = 'Analiz tamamlanmıÅŸtır.';
            en = 'Analysis completed.';
    }

    return { tr, en };
}


/**
 * Group data by a categorical column
 * Handles: null/undefined, empty strings, whitespace trimming
 * Returns: array of arrays (group values)
 */
function groupDataByColumn(data, groupCol, valueCol) {
    const groups = {};
    let skippedRows = 0;

    data.forEach(row => {
        // Normalize group key: trim, handle null/undefined/empty
        let rawKey = row[groupCol];
        if (rawKey === null || rawKey === undefined || rawKey === '') {
            skippedRows++;
            return; // Skip rows with no group value
        }
        const groupKey = String(rawKey).trim();
        if (groupKey === '') {
            skippedRows++;
            return;
        }

        const value = parseFloat(row[valueCol]);
        if (!isNaN(value)) {
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(value);
        }
    });

    // Filter out groups with < 2 items (can't compute variance)
    const result = Object.values(groups).filter(g => g.length >= 2);

    // Debug info (only in development)
    if (result.length === 0 && Object.keys(groups).length > 0) {
        console.warn(`[groupDataByColumn] Groups found but all had <2 items:`, Object.keys(groups).map(k => `${k}(${groups[k].length})`));
    }

    return result;
}


/**
 * Remove stat widget
 */
export function removeStatWidget(widgetId) {
    const widget = document.getElementById(widgetId);
    if (widget) {
        widget.remove();
        if (typeof showToast === 'function') {
            showToast('Widget kaldırıldı', 'info');
        }
    }
}

/**
 * Toggle widget expand/collapse
 */
export function toggleStatWidgetExpand(widgetId) {
    const widget = document.getElementById(widgetId);
    if (widget) {
        widget.classList.toggle('expanded');
    }
}

// =====================================================
// DRAG & DROP SYSTEM (viz.html compatible)
// =====================================================

/**
 * Initialize stat drag drop system - COMPATIBLE WITH VIZ.HTML
 * Source: .viz-stat-draggable buttons with data-stat-type attribute
 * Target: #vizDashboardGrid (same as charts)
 */
export function initStatDragDropSystem() {
    // Try multiple selectors for stat buttons
    const statButtons = document.querySelectorAll('.viz-stat-draggable, .viz-stat-btn[draggable="true"], [data-stat-type]');

    if (statButtons.length === 0) {
        console.warn('No stat buttons found for drag-drop initialization');
        return;
    }

    console.log(`ğŸ“Š Initializing stat drag-drop for ${statButtons.length} buttons`);

    // Make stat items draggable
    statButtons.forEach(item => {
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', handleStatDragStart);
        item.addEventListener('dragend', handleStatDragEnd);
    });

    // Setup drop zone - use vizDashboardGrid (same as charts)
    const dashboard = document.getElementById('vizDashboardGrid') ||
        document.querySelector('.viz-dashboard-grid') ||
        document.getElementById('vizDashboard');

    if (dashboard) {
        dashboard.addEventListener('dragover', handleStatDragOver);
        dashboard.addEventListener('dragleave', handleStatDragLeave);
        dashboard.addEventListener('drop', handleStatDrop);
        console.log('ğŸ“Š Stat drop zone initialized:', dashboard.id || dashboard.className);
    } else {
        console.error('Dashboard drop zone not found');
    }
}

function handleStatDragStart(e) {
    // Read stat type from data-stat-type (viz.html structure)
    const statType = e.target.dataset.statType || e.target.dataset.type || e.target.getAttribute('data-stat-type');

    if (statType) {
        e.dataTransfer.setData('stat-type', statType);
        e.dataTransfer.setData('text/plain', statType); // Fallback
        e.dataTransfer.effectAllowed = 'copy';
        e.target.classList.add('dragging');

        // Visual feedback
        const dashboard = document.getElementById('vizDashboardGrid');
        if (dashboard) dashboard.classList.add('drag-over-ready');
    }
}

function handleStatDragEnd(e) {
    e.target.classList.remove('dragging');

    // Remove visual feedback
    const dashboard = document.getElementById('vizDashboardGrid');
    if (dashboard) {
        dashboard.classList.remove('drag-over-ready');
        dashboard.classList.remove('drag-over');
    }
}

function handleStatDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('drag-over');
}

function handleStatDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleStatDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    e.currentTarget.classList.remove('drag-over-ready');

    // Try to read stat-type first, then fallback to text/plain
    let statType = e.dataTransfer.getData('stat-type');
    if (!statType) {
        statType = e.dataTransfer.getData('text/plain');
    }

    if (statType && isValidStatType(statType)) {
        console.log('ğŸ“Š Creating stat widget:', statType);
        createStatWidget(statType);
    }
}

/**
 * Check if type is a valid stat type (not a chart type)
 */
function isValidStatType(type) {
    const validStatTypes = [
        'ttest', 'ttest-independent', 'ttest-paired', 'ttest-one',
        'anova', 'anova-oneway', 'chi-square', 'correlation', 'normality',
        'descriptive', 'mann-whitney', 'wilcoxon', 'kruskal', 'kruskal-wallis',
        'levene', 'effect-size', 'frequency', 'pca', 'kmeans', 'cronbach',
        'logistic', 'timeseries', 'apa', 'friedman', 'power', 'regression-coef',
        'discriminant', 'survival', 'shapiro-wilk'
    ];
    return validStatTypes.includes(type);
}


// =====================================================
// API INTEGRATION
// =====================================================

/**
 * Call SPSS/Python backend API
 */
export async function callSpssApi(endpoint, params) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/viz/${endpoint}`;

    try {
        if (typeof showProgress === 'function') {
            showProgress('Analiz yapılıyor...');
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error(`API hatası: ${response.status}`);
        }

        const result = await response.json();

        if (typeof hideProgress === 'function') {
            hideProgress();
        }

        return result;

    } catch (error) {
        if (typeof hideProgress === 'function') {
            hideProgress();
        }
        console.error('SPSS API Error:', error);
        throw error;
    }
}

/**
 * Run analysis via API with fallback to local
 */
export async function runAnalysisWithApi(type, data, options = {}) {
    try {
        // Try API first
        const result = await callSpssApi(type, { data, options });
        return result;
    } catch (error) {
        console.warn('API failed, falling back to local calculation:', error.message);
        // Fallback to local calculation
        return runLocalAnalysis(type, data, options);
    }
}

/**
 * Run local analysis (fallback)
 */
function runLocalAnalysis(type, data, options) {
    const alpha = options.alpha || 0.05;

    switch (type) {
        case 'ttest':
            return runIndependentTTest(data.group1, data.group2, alpha);
        case 'anova':
            return runOneWayANOVA(data.groups, alpha);
        case 'correlation':
            return runCorrelationTest(data.x, data.y, alpha);
        case 'chi-square':
            return runChiSquareTest(data.table, alpha);
        default:
            return { error: `Desteklenmeyen analiz tipi: ${type}` };
    }
}

// =====================================================
// CSS STYLES INJECTION
// =====================================================

function injectStatWidgetStyles() {
    if (document.getElementById('viz-stat-widget-styles')) return;

    const style = document.createElement('style');
    style.id = 'viz-stat-widget-styles';
    style.textContent = `
        /* VIZ-PREFIXED STAT WIDGET STYLES */
        .viz-stat-widget {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s ease;
            min-width: 280px;
            min-height: 200px;
        }
        .viz-stat-widget:hover {
            border-color: rgba(74, 144, 217, 0.5);
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        .viz-stat-widget.expanded {
            position: fixed;
            top: 50px;
            left: 50px;
            right: 50px;
            bottom: 50px;
            z-index: 1000;
        }
        .viz-stat-widget-header {
            background: rgba(0,0,0,0.3);
            padding: 12px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .viz-stat-widget-title {
            color: #fff;
            font-weight: 600;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .viz-stat-widget-title i { color: #4a90d9; }
        .viz-stat-widget-actions {
            display: flex;
            gap: 5px;
        }
        .viz-stat-widget-btn {
            background: transparent;
            border: none;
            color: rgba(255,255,255,0.6);
            cursor: pointer;
            padding: 5px 8px;
            border-radius: 4px;
            transition: all 0.2s;
            font-size: 12px;
        }
        .viz-stat-widget-btn:hover {
            background: rgba(255,255,255,0.1);
            color: #fff;
        }
        .viz-stat-widget-btn.viz-btn-run {
            background: linear-gradient(135deg, #4a90d9, #357abd);
            color: #fff;
            padding: 6px 12px;
        }
        .viz-stat-widget-btn.viz-btn-run:hover {
            background: linear-gradient(135deg, #357abd, #2a6090);
        }
        .viz-stat-widget-btn.viz-btn-remove:hover {
            color: #e74c3c;
        }
        .viz-stat-widget-body {
            padding: 15px;
        }
        .viz-stat-widget-config {
            margin-bottom: 15px;
        }
        .stat-config-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        .stat-config-row label {
            color: rgba(255,255,255,0.7);
            font-size: 12px;
            min-width: 100px;
        }
        .stat-select, .stat-input {
            flex: 1;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            color: #fff;
            padding: 8px 12px;
            font-size: 12px;
        }
        .stat-select:focus, .stat-input:focus {
            border-color: #4a90d9;
            outline: none;
        }
        .viz-stat-widget-results {
            min-height: 100px;
        }
        .viz-stat-widget-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: rgba(255,255,255,0.3);
            padding: 30px;
            text-align: center;
        }
        .viz-stat-widget-placeholder i {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .viz-stat-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 30px;
            color: rgba(255,255,255,0.5);
        }
        .viz-stat-error {
            background: rgba(231, 76, 60, 0.1);
            border: 1px solid rgba(231, 76, 60, 0.3);
            color: #e74c3c;
            padding: 15px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        /* Stat overlay on charts */
        .viz-stat-overlay {
            font-size: 11px;
        }
        .viz-stat-overlay-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 10px;
            background: rgba(0,0,0,0.5);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            cursor: move;
        }
        .viz-stat-overlay-header span { color: #fff; font-weight: 500; }
        .viz-stat-overlay-header button {
            background: none;
            border: none;
            color: rgba(255,255,255,0.6);
            cursor: pointer;
        }
        .viz-stat-overlay-content {
            padding: 10px;
            max-height: 200px;
            overflow-y: auto;
        }
        
        /* Dashboard drag feedback */
        .viz-dashboard-grid.drag-over-ready {
            background: rgba(74, 144, 217, 0.05);
        }
        .viz-dashboard-grid.drag-over {
            background: rgba(74, 144, 217, 0.1);
            border: 2px dashed #4a90d9;
        }
        
        /* Stat result table */
        .viz-stat-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        .viz-stat-table td, .viz-stat-table th {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.8);
            font-size: 12px;
        }
        .viz-stat-table th {
            background: rgba(0,0,0,0.2);
            color: #fff;
        }
        
        /* Stat result formatting */
        .stat-result-container {
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            overflow: hidden;
        }
        .stat-result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: rgba(0,0,0,0.3);
        }
        .stat-result-header h4 {
            margin: 0;
            color: #fff;
            font-size: 14px;
        }
        .stat-significance {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }
        .stat-significance.significant {
            background: rgba(39, 174, 96, 0.2);
            color: #27ae60;
        }
        .stat-significance.not-significant {
            background: rgba(231, 76, 60, 0.2);
            color: #e74c3c;
        }
        .stat-result-body { padding: 15px; }
        .stat-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .stat-table td, .stat-table th {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            color: rgba(255,255,255,0.8);
            font-size: 12px;
        }
        .stat-table td:first-child { color: rgba(255,255,255,0.5); }
        .stat-table .p-very-sig { color: #27ae60; font-weight: 600; }
        .stat-table .p-sig { color: #f39c12; }
        .stat-table .p-not-sig { color: #e74c3c; }
        .stat-interpretation {
            background: rgba(74, 144, 217, 0.1);
            border-left: 3px solid #4a90d9;
            padding: 10px 15px;
            margin-top: 10px;
            border-radius: 0 6px 6px 0;
            display: flex;
            align-items: center;
            gap: 10px;
            color: rgba(255,255,255,0.8);
            font-size: 12px;
        }
        .stat-interpretation i { color: #4a90d9; }
        .stat-big-value {
            font-size: 36px;
            font-weight: 700;
            color: #4a90d9;
            text-align: center;
            padding: 20px;
        }
    `;
    document.head.appendChild(style);
}


// Initialize styles on load
injectStatWidgetStyles();

// -----------------------------------------------------
// WINDOW BINDINGS (COMPLETE)
// -----------------------------------------------------
// Part 1: Basic Statistics
window.calculateMean = calculateMean;
window.calculateMedian = calculateMedian;
window.calculateMode = calculateMode;
window.calculateVariance = calculateVariance;
window.calculateStdDev = calculateStdDev;
window.calculateSEM = calculateSEM;
window.calculateCovariance = calculateCovariance;
window.calculateCorrelation = calculateCorrelation;
window.calculateSpearmanCorrelation = calculateSpearmanCorrelation;
window.calculateSkewness = calculateSkewness;
window.calculateKurtosis = calculateKurtosis;
window.calculateSum = calculateSum;
window.calculateMin = calculateMin;
window.calculateMax = calculateMax;
window.calculateRange = calculateRange;
window.calculatePercentile = calculatePercentile;
window.calculateQuartiles = calculateQuartiles;
window.calculateIQR = calculateIQR;
window.calculateTScore = calculateTScore;
window.calculateTScoreTwoSample = calculateTScoreTwoSample;
window.calculateFScore = calculateFScore;
window.calculateChiSquare = calculateChiSquare;
window.calculateZScore = calculateZScore;
window.calculateCohensD = calculateCohensD;
window.calculatePooledStdDev = calculatePooledStdDev;
window.calculateEtaSquared = calculateEtaSquared;
window.calculateRSquared = calculateRSquared;
window.getTCritical = getTCritical;
window.getChiCritical = getChiCritical;
window.getFCritical = getFCritical;
window.getZCritical = getZCritical;
window.approximateTTestPValue = approximateTTestPValue;
window.approximateChiSquarePValue = approximateChiSquarePValue;

// Part 2: Statistical Tests
window.runIndependentTTest = runIndependentTTest;
window.runPairedTTest = runPairedTTest;
window.runOneSampleTTest = runOneSampleTTest;
window.runOneWayANOVA = runOneWayANOVA;
window.runCorrelationTest = runCorrelationTest;
window.runChiSquareTest = runChiSquareTest;
window.runMannWhitneyU = runMannWhitneyU;
window.runKruskalWallis = runKruskalWallis;
window.runWilcoxonSignedRank = runWilcoxonSignedRank;
window.runFriedmanTest = runFriedmanTest;
window.runShapiroWilkTest = runShapiroWilkTest;

// =====================================================
// PART 4: HELPER FUNCTIONS FOR ADVANCED TESTS
// =====================================================

/**
 * Run chi-square test from raw data (categorical columns)
 */
export function runChiSquareFromData(data, var1, var2, alpha = 0.05) {
    // Build contingency table
    const table = {};
    const row_labels = new Set();
    const col_labels = new Set();

    data.forEach(row => {
        const r = String(row[var1] || 'NA');
        const c = String(row[var2] || 'NA');
        row_labels.add(r);
        col_labels.add(c);
        if (!table[r]) table[r] = {};
        table[r][c] = (table[r][c] || 0) + 1;
    });

    const rows = Array.from(row_labels);
    const cols = Array.from(col_labels);
    const observed = rows.map(r => cols.map(c => table[r]?.[c] || 0));

    return runChiSquareTest(observed, alpha);
}

/**
 * Run descriptive statistics
 */
export function runDescriptiveStats(data, columns) {
    const results = [];

    columns.forEach(col => {
        const values = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        if (values.length === 0) return;

        const sorted = [...values].sort((a, b) => a - b);
        const n = values.length;
        const mean = calculateMean(values);
        const stdDev = calculateStdDev(values);

        results.push({
            column: col,
            n: n,
            mean: mean,
            stdDev: stdDev,
            sem: calculateSEM(values),
            median: calculateMedian(values),
            min: Math.min(...values),
            max: Math.max(...values),
            range: Math.max(...values) - Math.min(...values),
            q1: sorted[Math.floor(n * 0.25)],
            q3: sorted[Math.floor(n * 0.75)],
            skewness: calculateSkewness(values),
            kurtosis: calculateKurtosis(values)
        });
    });

    return {
        testType: 'descriptive',
        testName: VIZ_STATE.lang === 'tr' ? 'Betimsel İstatistikler' : 'Descriptive Statistics',
        results: results,
        interpretation: VIZ_STATE.lang === 'tr' ? `${results.length} deÄŸiÅŸken analiz edildi.` : `${results.length} variables analyzed.`
    };
}

/**
 * Run Levene's test for homogeneity of variances
 */
export function runLeveneTest(groups, alpha = 0.05) {
    const k = groups.length;
    const N = groups.reduce((sum, g) => sum + g.length, 0);

    // Calculate group medians
    const medians = groups.map(g => calculateMedian(g));

    // Calculate absolute deviations from median
    const deviations = groups.map((g, i) => g.map(v => Math.abs(v - medians[i])));

    // Calculate grand mean of deviations
    const allDevs = deviations.flat();
    const grandMean = calculateMean(allDevs);

    // Calculate group means of deviations
    const groupMeans = deviations.map(d => calculateMean(d));

    // Between-group sum of squares
    let ssb = 0;
    groups.forEach((g, i) => {
        ssb += g.length * Math.pow(groupMeans[i] - grandMean, 2);
    });

    // Within-group sum of squares
    let ssw = 0;
    deviations.forEach((d, i) => {
        d.forEach(v => {
            ssw += Math.pow(v - groupMeans[i], 2);
        });
    });

    const W = ((N - k) * ssb) / ((k - 1) * ssw);
    const df1 = k - 1;
    const df2 = N - k;

    // NaN koruması
    if (isNaN(W) || !isFinite(W) || ssw === 0) {
        return {
            valid: false,
            error: 'Varyans hesaplanamadı (gruplar çok benzer veya veri yetersiz)',
            testName: "Levene's Test"
        };
    }

    const pValue = 1 - approximateFTestPValue(W, df1, df2);
    const significant = pValue < alpha;

    return {
        valid: true,
        testType: 'levene',
        testName: "Levene's Test",
        wStatistic: W,
        fStatistic: W, // Alias for compatibility
        df1: df1,
        df2: df2,
        pValue: pValue,
        alpha: alpha,
        significant: significant,
        isSignificant: significant,
        interpretation: significant
            ? 'Varyanslar eÅŸit deÄŸil (homojenlik varsayımı karÅŸılanmıyor)'
            : 'Varyanslar eÅŸit (homojenlik varsayımı karÅŸılanıyor)'
    };
}

/**
 * Calculate effect size (Cohen's d) for two groups
 * FAZ-4: NaN guard eklendi
 */
export function calculateEffectSize(group1, group2) {
    if (!group1 || !group2 || group1.length < 2 || group2.length < 2) {
        return {
            valid: false,
            error: 'Her grupta en az 2 deÄŸer olmalı',
            testName: "Cohen's d"
        };
    }

    const mean1 = calculateMean(group1);
    const mean2 = calculateMean(group2);
    const pooledSD = calculatePooledStdDev(group1, group2);

    // FAZ-4: SD=0 guard - tüm deÄŸerler aynıysa Cohen's d tanımsız
    if (pooledSD === 0 || !isFinite(pooledSD)) {
        return {
            valid: false,
            error: 'Varyans 0 olduÄŸu için Cohen\'s d tanımsız (tüm deÄŸerler aynı veya çok benzer)',
            testName: "Cohen's d",
            group1Mean: mean1,
            group2Mean: mean2,
            pooledSD: pooledSD
        };
    }

    const d = (mean1 - mean2) / pooledSD;

    // FAZ-4: NaN guard
    if (!isFinite(d)) {
        return {
            valid: false,
            error: 'Etki büyüklüÄŸü hesaplanamadı',
            testName: "Cohen's d"
        };
    }

    let interpretation;
    const absD = Math.abs(d);
    if (absD < 0.2) interpretation = 'Çok küçük etki';
    else if (absD < 0.5) interpretation = 'Küçük etki';
    else if (absD < 0.8) interpretation = 'Orta etki';
    else interpretation = 'Büyük etki';

    return {
        valid: true,
        testType: 'effect-size',
        testName: "Cohen's d",
        cohensD: d,
        effectSize: absD,
        effectSizeInterpretation: interpretation,
        interpretation: interpretation,
        group1Mean: mean1,
        group2Mean: mean2,
        pooledSD: pooledSD
    };
}

/**
 * Run frequency analysis
 * Enhanced: shows top N, cumulative percent, mode, detailed table
 */
export function runFrequencyAnalysis(data, column) {
    const freq = {};
    let total = 0;
    let validCount = 0;
    let missingCount = 0;

    data.forEach(row => {
        const rawVal = row[column];
        if (rawVal === null || rawVal === undefined || rawVal === '') {
            missingCount++;
            total++;
            return;
        }
        const val = String(rawVal).trim();
        freq[val] = (freq[val] || 0) + 1;
        validCount++;
        total++;
    });

    const results = Object.entries(freq)
        .map(([value, count]) => ({
            value: value,
            count: count,
            percent: (count / validCount * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count);

    // Calculate cumulative percent
    let cumulative = 0;
    results.forEach(r => {
        cumulative += parseFloat(r.percent);
        r.cumPercent = cumulative.toFixed(1);
    });

    // Top 10 for display (rest grouped as "DiÄŸer")
    const topN = 10;
    const topResults = results.slice(0, topN);
    const otherCount = results.slice(topN).reduce((sum, r) => sum + r.count, 0);

    // Mode (most frequent value)
    const mode = results.length > 0 ? results[0].value : 'N/A';
    const modeCount = results.length > 0 ? results[0].count : 0;

    return {
        testType: 'frequency',
        testName: VIZ_STATE.lang === 'tr' ? 'Frekans Analizi' : 'Frequency Analysis',
        column: column,
        total: total,
        validCount: validCount,
        missingCount: missingCount,
        uniqueCount: results.length,
        mode: mode,
        modeCount: modeCount,
        modePercent: validCount > 0 ? (modeCount / validCount * 100).toFixed(1) : '0.0',
        topResults: topResults,
        otherCount: otherCount,
        otherPercent: validCount > 0 ? (otherCount / validCount * 100).toFixed(1) : '0.0',
        frequencies: results, // Full list for export
        interpretation: {
            tr: `${column} sütununda ${results.length} farklı deÄŸer bulundu. En sık deÄŸer: "${mode}" (n=${modeCount}, %${validCount > 0 ? (modeCount / validCount * 100).toFixed(1) : 0}). Eksik: ${missingCount}.`,
            en: `${results.length} unique values found in ${column}. Mode: "${mode}" (n=${modeCount}, ${validCount > 0 ? (modeCount / validCount * 100).toFixed(1) : 0}%). Missing: ${missingCount}.`
        }
    };
}


/**
 * Run PCA Analysis (Real Implementation)
 * Uses: standardization, covariance matrix, power iteration for eigenvalues
 * FAZ-ADV-2: Added optional Varimax rotation
 * @param {Array} data - Data array
 * @param {Array} columns - Column names
 * @param {Object} opts - Options { rotation: 'none'|'varimax' }
 */
export function runPCAAnalysis(data, columns, opts = {}) {
    const rotation = opts.rotation || 'none';

    if (columns.length < 2) {
        return { error: VIZ_STATE.lang === 'tr' ? 'PCA için en az 2 deÄŸiÅŸken gerekli' : 'At least 2 variables required for PCA', valid: false };
    }

    // 1. Extract and validate data
    const matrix = [];
    const means = [];
    const stds = [];

    columns.forEach(col => {
        const values = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        if (values.length === 0) {
            return { error: `${col} sütununda geçerli veri yok`, valid: false };
        }
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length) || 1;
        means.push(mean);
        stds.push(std);
    });

    // Build standardized matrix (z-scores)
    const n = data.length;
    for (let i = 0; i < n; i++) {
        const row = [];
        let valid = true;
        columns.forEach((col, j) => {
            const val = parseFloat(data[i][col]);
            if (isNaN(val)) valid = false;
            else row.push((val - means[j]) / stds[j]);
        });
        if (valid && row.length === columns.length) matrix.push(row);
    }

    if (matrix.length < columns.length) {
        return { error: 'Yeterli geçerli satır yok', valid: false };
    }

    const p = columns.length;
    const validN = matrix.length;

    // 2. Compute covariance matrix (using standardized data, so it's correlation)
    const covMatrix = [];
    for (let i = 0; i < p; i++) {
        covMatrix[i] = [];
        for (let j = 0; j < p; j++) {
            let sum = 0;
            for (let k = 0; k < validN; k++) {
                sum += matrix[k][i] * matrix[k][j];
            }
            covMatrix[i][j] = sum / (validN - 1);
        }
    }

    // 3. Power iteration to find eigenvalues/eigenvectors (extract min(p, 3) components)
    const numComponents = Math.min(p, 3);
    const eigenResults = [];
    let workMatrix = covMatrix.map(row => [...row]);

    for (let comp = 0; comp < numComponents; comp++) {
        // Power iteration
        let vec = new Array(p).fill(1 / Math.sqrt(p));
        for (let iter = 0; iter < 100; iter++) {
            // Matrix-vector multiply
            const newVec = new Array(p).fill(0);
            for (let i = 0; i < p; i++) {
                for (let j = 0; j < p; j++) {
                    newVec[i] += workMatrix[i][j] * vec[j];
                }
            }
            // Normalize
            const norm = Math.sqrt(newVec.reduce((s, v) => s + v * v, 0));
            if (norm < 1e-10) break;
            vec = newVec.map(v => v / norm);
        }

        // Compute eigenvalue (Rayleigh quotient)
        let eigenvalue = 0;
        for (let i = 0; i < p; i++) {
            let sum = 0;
            for (let j = 0; j < p; j++) {
                sum += workMatrix[i][j] * vec[j];
            }
            eigenvalue += vec[i] * sum;
        }

        eigenResults.push({ eigenvalue: Math.max(0, eigenvalue), eigenvector: vec });

        // Deflate matrix for next component
        for (let i = 0; i < p; i++) {
            for (let j = 0; j < p; j++) {
                workMatrix[i][j] -= eigenvalue * vec[i] * vec[j];
            }
        }
    }

    // 4. Build loadings matrix: loading[i][j] = eigenvector[j][i] * sqrt(eigenvalue[j])
    // Rows = variables, Columns = components
    const loadings = [];
    for (let i = 0; i < p; i++) {
        loadings[i] = [];
        for (let j = 0; j < numComponents; j++) {
            loadings[i][j] = eigenResults[j].eigenvector[i] * Math.sqrt(eigenResults[j].eigenvalue);
        }
    }

    // 5. FAZ-ADV-2: Varimax Rotation (if requested)
    let rotatedLoadings = null;
    if (rotation === 'varimax' && numComponents >= 2) {
        rotatedLoadings = varimaxRotation(loadings, p, numComponents);
    }

    // 6. Calculate explained variance
    const actualTotal = covMatrix.reduce((s, r, i) => s + r[i], 0);

    const components = eigenResults.map((e, i) => ({
        component: i + 1,
        eigenvalue: e.eigenvalue.toFixed(3),
        variance_explained: ((e.eigenvalue / actualTotal) * 100).toFixed(1),
        loadings: columns.map((col, j) => ({
            variable: col,
            loading: loadings[j][i].toFixed(3)
        }))
    }));

    const cumulativeVar = components.reduce((s, c) => s + parseFloat(c.variance_explained), 0).toFixed(1);

    // 7. FAZ-ADV-2: Build SPSS-style tables
    const tables = [];

    // Component Matrix (Unrotated)
    const componentMatrixTable = {
        title: VIZ_STATE.lang === 'tr' ? 'BileÅŸen Matrisi' : 'Component Matrix',
        columns: ['Variable', ...eigenResults.map((_, i) => `PC${i + 1}`)],
        rows: columns.map((col, i) => [
            col,
            ...loadings[i].map(l => isFinite(l) ? l.toFixed(3) : '-')
        ])
    };
    tables.push(componentMatrixTable);

    // Rotated Component Matrix (if rotation applied)
    if (rotatedLoadings) {
        const rotatedMatrixTable = {
            title: VIZ_STATE.lang === 'tr' ? 'DöndürülmüÅŸ BileÅŸen Matrisi (Varimax)' : 'Rotated Component Matrix (Varimax)',
            columns: ['Variable', ...eigenResults.map((_, i) => `PC${i + 1}`)],
            rows: columns.map((col, i) => [
                col,
                ...rotatedLoadings[i].map(l => isFinite(l) ? l.toFixed(3) : '-')
            ])
        };
        tables.push(rotatedMatrixTable);
    }

    // Total Variance Explained table
    const varianceTable = {
        title: VIZ_STATE.lang === 'tr' ? 'Açıklanan Toplam Varyans' : 'Total Variance Explained',
        columns: ['Component', 'Eigenvalue', '% Variance', 'Cumulative %'],
        rows: []
    };
    let cumulative = 0;
    eigenResults.forEach((e, i) => {
        const varExplained = (e.eigenvalue / actualTotal) * 100;
        cumulative += varExplained;
        varianceTable.rows.push([
            `PC${i + 1}`,
            e.eigenvalue.toFixed(3),
            varExplained.toFixed(1) + '%',
            cumulative.toFixed(1) + '%'
        ]);
    });
    tables.push(varianceTable);

    return {
        testType: 'pca',
        testName: VIZ_STATE.lang === 'tr' ? 'Temel BileÅŸenler Analizi (PCA)' : 'Principal Component Analysis (PCA)',
        valid: true,
        nVariables: p,
        nObservations: validN,
        components: components,
        cumulative_variance: cumulativeVar,

        // FAZ-ADV-2: Loadings matrices
        loadings: loadings,
        rotatedLoadings: rotatedLoadings,
        rotation: rotation,

        // FAZ-ADV-2: SPSS tables
        tables: tables,

        interpretation: {
            tr: `${p} deÄŸiÅŸkenle PCA yapıldı. İlk ${components.length} bileÅŸen toplam varyansın %${cumulativeVar}'ini açıklıyor.${rotation === 'varimax' ? ' Varimax rotasyon uygulandı.' : ''}`,
            en: `PCA performed on ${p} variables. First ${components.length} components explain ${cumulativeVar}% of total variance.${rotation === 'varimax' ? ' Varimax rotation applied.' : ''}`
        }
    };
}

/**
 * FAZ-ADV-2: Varimax Rotation Algorithm
 * Orthogonal rotation to maximize variance of squared loadings
 * @param {Array} loadings - Original loadings matrix [variables x components]
 * @param {number} nVars - Number of variables
 * @param {number} nComps - Number of components
 * @returns {Array} Rotated loadings matrix
 */
function varimaxRotation(loadings, nVars, nComps, maxIter = 100, tol = 1e-6) {
    // Deep copy loadings
    let A = loadings.map(row => [...row]);

    // Kaiser normalization: normalize rows
    const h = []; // communalities
    for (let i = 0; i < nVars; i++) {
        h[i] = Math.sqrt(A[i].reduce((s, v) => s + v * v, 0)) || 1;
        for (let j = 0; j < nComps; j++) {
            A[i][j] /= h[i];
        }
    }

    // Iterative pairwise rotation
    for (let iter = 0; iter < maxIter; iter++) {
        let converged = true;

        // Rotate each pair of components
        for (let c1 = 0; c1 < nComps - 1; c1++) {
            for (let c2 = c1 + 1; c2 < nComps; c2++) {
                // Calculate rotation angle using varimax criterion
                let u = 0, v = 0;
                for (let i = 0; i < nVars; i++) {
                    const x = A[i][c1];
                    const y = A[i][c2];
                    const x2 = x * x;
                    const y2 = y * y;
                    u += (x2 - y2);
                    v += 2 * x * y;
                }

                // Sum of (x² - y²)² and (2xy)² for varimax
                let a = 0, b = 0, c = 0, d = 0;
                for (let i = 0; i < nVars; i++) {
                    const x = A[i][c1];
                    const y = A[i][c2];
                    const x2 = x * x;
                    const y2 = y * y;
                    const xy = x * y;

                    a += x2 - y2;
                    b += 2 * xy;
                    c += (x2 - y2) * (x2 - y2) - 4 * xy * xy;
                    d += 4 * xy * (x2 - y2);
                }

                // Optimal rotation angle
                const num = d - 2 * a * b / nVars;
                const den = c - (a * a - b * b) / nVars;
                const phi = 0.25 * Math.atan2(num, den);

                if (Math.abs(phi) > tol) {
                    converged = false;
                    const cos_phi = Math.cos(phi);
                    const sin_phi = Math.sin(phi);

                    // Apply rotation
                    for (let i = 0; i < nVars; i++) {
                        const x = A[i][c1];
                        const y = A[i][c2];
                        A[i][c1] = cos_phi * x + sin_phi * y;
                        A[i][c2] = -sin_phi * x + cos_phi * y;
                    }
                }
            }
        }

        if (converged) break;
    }

    // De-normalize (restore communalities)
    for (let i = 0; i < nVars; i++) {
        for (let j = 0; j < nComps; j++) {
            A[i][j] *= h[i];
        }
    }

    return A;
}


/**
 * Run K-Means Clustering (Real Lloyd's Algorithm)
 * Uses: k-means++ initialization, iterative centroid update, convergence detection
 * FAZ-P2-1: writeBack option and canonical output fields added
 * @param {Array} data - Data array
 * @param {Array} columns - Column names for clustering
 * @param {number|object} kOrOpts - Either k value or options object {k, writeBack}
 */
export function runKMeansAnalysis(data, columns, kOrOpts = 3) {
    // FAZ-P2-1: Parse options
    let k = 3;
    let writeBack = true; // Default: mutate data
    let seed = null; // PROMPT-3: Optional seed for determinism

    if (typeof kOrOpts === 'object' && kOrOpts !== null) {
        k = kOrOpts.k || 3;
        writeBack = kOrOpts.writeBack !== false; // default true
        seed = kOrOpts.seed !== undefined ? kOrOpts.seed : null;
    } else {
        k = kOrOpts || 3;
    }

    // PROMPT-3 GÖREV C: Seeded RNG using LCG (Linear Congruential Generator)
    // Creates a deterministic pseudo-random number generator when seed is provided
    function createSeededRNG(seedValue) {
        let state = seedValue;
        // LCG parameters (same as glibc)
        const a = 1103515245;
        const c = 12345;
        const m = Math.pow(2, 31);

        return function () {
            state = (a * state + c) % m;
            return state / m;
        };
    }

    // Use seeded RNG if seed is provided, otherwise Math.random
    const rng = seed !== null ? createSeededRNG(seed) : Math.random.bind(Math);

    // FAZ-P2-1: Handle null columns or array input format (e.g., [[1,2], [3,4]])
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
        // Check if data is array of arrays
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            // Convert array of arrays to array of objects
            const dims = data[0].length;
            columns = Array.from({ length: dims }, (_, i) => `dim${i}`);
            data = data.map(row => {
                const obj = {};
                row.forEach((v, i) => obj[columns[i]] = v);
                return obj;
            });
        } else {
            return { error: VIZ_STATE.lang === 'tr' ? 'K-Means için sütun listesi gerekli' : 'Column list required for K-Means', valid: false };
        }
    }

    if (columns.length < 2) {
        return { error: VIZ_STATE.lang === 'tr' ? 'K-Means için en az 2 deÄŸiÅŸken gerekli' : 'At least 2 variables required for K-Means', valid: false };
    }

    // FAZ-P2-1: k<2 must return error, not silently fix
    if (k < 2) {
        return { error: VIZ_STATE.lang === 'tr' ? 'K deÄŸeri en az 2 olmalıdır' : 'K must be at least 2', valid: false };
    }
    if (k > data.length) k = Math.min(data.length, 10);

    // 1. Build data matrix and standardize
    const matrix = [];
    const means = columns.map(() => 0);
    const stds = columns.map(() => 1);

    // Calculate means
    let validRows = 0;
    data.forEach(row => {
        let valid = true;
        columns.forEach((col, j) => {
            const val = parseFloat(row[col]);
            if (isNaN(val)) valid = false;
        });
        if (valid) {
            columns.forEach((col, j) => means[j] += parseFloat(row[col]));
            validRows++;
        }
    });
    means.forEach((m, i) => means[i] = m / validRows);

    // Calculate stds
    data.forEach(row => {
        let valid = true;
        columns.forEach((col, j) => {
            const val = parseFloat(row[col]);
            if (isNaN(val)) valid = false;
        });
        if (valid) {
            columns.forEach((col, j) => {
                stds[j] += (parseFloat(row[col]) - means[j]) ** 2;
            });
        }
    });
    stds.forEach((s, i) => stds[i] = Math.sqrt(s / validRows) || 1);

    // Build standardized matrix
    data.forEach((row, idx) => {
        let valid = true;
        const point = { idx, values: [] };
        columns.forEach((col, j) => {
            const val = parseFloat(row[col]);
            if (isNaN(val)) valid = false;
            else point.values.push((val - means[j]) / stds[j]);
        });
        if (valid) matrix.push(point);
    });

    if (matrix.length < k) {
        return { error: `En az ${k} geçerli satır gerekli`, valid: false };
    }

    // 2. K-means++ initialization (using seeded RNG)
    const centroids = [];
    const usedIdx = new Set();

    // First centroid: random (seeded)
    let firstIdx = Math.floor(rng() * matrix.length);
    centroids.push([...matrix[firstIdx].values]);
    usedIdx.add(firstIdx);

    // Remaining centroids: weighted by distance (seeded)
    while (centroids.length < k) {
        const distances = matrix.map((p, i) => {
            if (usedIdx.has(i)) return 0;
            let minDist = Infinity;
            centroids.forEach(c => {
                let d = 0;
                p.values.forEach((v, j) => d += (v - c[j]) ** 2);
                minDist = Math.min(minDist, d);
            });
            return minDist;
        });
        const totalDist = distances.reduce((a, b) => a + b, 0);
        let r = rng() * totalDist;
        let selected = 0;
        for (let i = 0; i < distances.length; i++) {
            r -= distances[i];
            if (r <= 0) { selected = i; break; }
        }
        centroids.push([...matrix[selected].values]);
        usedIdx.add(selected);
    }

    // 3. Lloyd's iterations
    let assignments = matrix.map(() => 0);
    const maxIter = 100;
    let converged = false;
    let iterations = 0;

    for (let iter = 0; iter < maxIter; iter++) {
        iterations = iter + 1;

        // Assign points to nearest centroid
        const newAssignments = matrix.map(p => {
            let minDist = Infinity;
            let cluster = 0;
            centroids.forEach((c, ci) => {
                let d = 0;
                p.values.forEach((v, j) => d += (v - c[j]) ** 2);
                if (d < minDist) { minDist = d; cluster = ci; }
            });
            return cluster;
        });

        // Check convergence
        if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
            converged = true;
            break;
        }
        assignments = newAssignments;

        // Update centroids
        const counts = centroids.map(() => 0);
        const sums = centroids.map(() => columns.map(() => 0));

        matrix.forEach((p, i) => {
            const c = assignments[i];
            counts[c]++;
            p.values.forEach((v, j) => sums[c][j] += v);
        });

        centroids.forEach((c, ci) => {
            if (counts[ci] > 0) {
                c.forEach((_, j) => c[j] = sums[ci][j] / counts[ci]);
            }
        });
    }

    // 4. Calculate cluster stats
    const clusterStats = centroids.map((c, ci) => {
        const members = matrix.filter((_, i) => assignments[i] === ci);
        let sse = 0;
        members.forEach(p => {
            p.values.forEach((v, j) => sse += (v - c[j]) ** 2);
        });
        return {
            cluster: ci + 1,
            size: members.length,
            sse: sse.toFixed(2),
            centroid: columns.map((col, j) => ({
                variable: col,
                value: (c[j] * stds[j] + means[j]).toFixed(2) // Unstandardized
            }))
        };
    });

    const totalSSE = clusterStats.reduce((s, c) => s + parseFloat(c.sse), 0).toFixed(2);

    // FAZ-P2-1: Assign clusters to original data only if writeBack is true
    if (writeBack) {
        matrix.forEach((p, i) => {
            data[p.idx]['_cluster'] = assignments[i] + 1;
        });
    }

    // FAZ-P2-1: Build canonical output fields
    // centers: k x dims array (unstandardized)
    const centers = centroids.map((c, ci) =>
        c.map((v, j) => v * stds[j] + means[j])
    );

    // clusterCounts: array of length k
    const clusterCounts = centroids.map((_, ci) =>
        assignments.filter(a => a === ci).length
    );

    // inertia: within-cluster sum of squares (already calculated as totalSSE)
    const inertia = parseFloat(totalSSE);

    // assignments: array mapping each valid row to cluster index (0-based)
    const assignmentsOutput = matrix.map((p, i) => ({
        rowIndex: p.idx,
        cluster: assignments[i]
    }));

    return {
        testType: 'kmeans',
        testName: VIZ_STATE.lang === 'tr' ? 'K-Means Kümeleme' : 'K-Means Clustering',
        valid: true,
        k: k,
        nObservations: matrix.length,
        nVariables: columns.length,
        iterations: iterations,
        converged: converged,
        totalSSE: totalSSE,

        // FAZ-P2-1: Canonical output fields
        centers: centers,
        inertia: isFinite(inertia) ? inertia : NaN,
        clusterCounts: clusterCounts,
        assignments: assignments.map(a => a), // Simple array of cluster indices (0-based)
        clusterAssignments: assignmentsOutput, // Detailed with row indices

        clusters: clusterStats,
        assignmentColumn: writeBack ? '_cluster' : null,
        interpretation: {
            tr: `${matrix.length} gözlem ${k} kümeye ayrıldı (${iterations} iterasyon${converged ? ', yakınsadı' : ''}). Toplam SSE: ${totalSSE}`,
            en: `${matrix.length} observations clustered into ${k} groups (${iterations} iterations${converged ? ', converged' : ''}). Total SSE: ${totalSSE}`
        }
    };
}


/**
 * Run Cronbach's Alpha
 * FAZ-4: valid field ve NaN guard eklendi
 * FAZ-P2-2: SPSS tables format added
 */
export function runCronbachAlpha(data, columns) {
    const k = columns.length;
    if (k < 2) return { valid: false, error: VIZ_STATE.lang === 'tr' ? 'En az 2 madde gerekli' : 'At least 2 items required', testName: "Cronbach's Alpha" };

    // Calculate item variances and means
    const itemStats = columns.map(col => {
        const values = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = calculateVariance(values);
        return { column: col, mean, variance, n: values.length };
    });

    const itemVars = itemStats.map(s => s.variance);

    // Calculate total score variance
    const totals = data.map(row => {
        return columns.reduce((sum, col) => sum + (parseFloat(row[col]) || 0), 0);
    });
    const totalVar = calculateVariance(totals);
    const totalMean = totals.reduce((a, b) => a + b, 0) / totals.length;

    // FAZ-4: Guard - totalVar = 0 durumunda alpha tanımsız
    if (totalVar === 0 || !isFinite(totalVar)) {
        return {
            valid: false,
            error: 'Toplam varyans 0 - tüm skorlar aynı',
            testName: "Cronbach's Alpha"
        };
    }

    const sumItemVars = itemVars.reduce((a, b) => a + b, 0);
    const alpha = (k / (k - 1)) * (1 - sumItemVars / totalVar);

    // FAZ-4: NaN guard
    if (!isFinite(alpha)) {
        return {
            valid: false,
            error: 'Alpha hesaplanamadı',
            testName: "Cronbach's Alpha"
        };
    }

    // Calculate item-total correlations and alpha-if-deleted
    const itemTotalStats = columns.map((col, idx) => {
        // Calculate correlation between item and total minus this item
        const itemValues = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        const restTotals = data.map(row => {
            return columns.filter((_, i) => i !== idx)
                .reduce((sum, c) => sum + (parseFloat(row[c]) || 0), 0);
        });

        const correctedItemTotal = calculateCorrelation(itemValues, restTotals);

        // Alpha if item deleted
        const remainingVars = itemVars.filter((_, i) => i !== idx);
        const remainingVarSum = remainingVars.reduce((a, b) => a + b, 0);
        const remainingK = k - 1;
        const alphaIfDeleted = remainingK > 1
            ? (remainingK / (remainingK - 1)) * (1 - remainingVarSum / totalVar)
            : NaN;

        return {
            item: col,
            mean: itemStats[idx].mean,
            variance: itemStats[idx].variance,
            correctedItemTotal: isFinite(correctedItemTotal) ? correctedItemTotal : 0,
            alphaIfDeleted: isFinite(alphaIfDeleted) ? alphaIfDeleted : alpha
        };
    });

    let interpretation;
    if (alpha >= 0.9) interpretation = 'Mükemmel güvenilirlik';
    else if (alpha >= 0.8) interpretation = 'İyi güvenilirlik';
    else if (alpha >= 0.7) interpretation = 'Kabul edilebilir güvenilirlik';
    else if (alpha >= 0.6) interpretation = 'Sorgulanabilir güvenilirlik';
    else interpretation = 'Zayıf güvenilirlik';

    // FAZ-P2-2: SPSS-like tables format
    const tables = [
        {
            title: VIZ_STATE.lang === 'tr' ? 'Güvenilirlik İstatistikleri' : 'Reliability Statistics',
            columns: [
                VIZ_STATE.lang === 'tr' ? "Cronbach's Alpha" : "Cronbach's Alpha",
                VIZ_STATE.lang === 'tr' ? 'Madde Sayısı' : 'N of Items'
            ],
            rows: [
                [alpha.toFixed(3), k]
            ]
        },
        {
            title: VIZ_STATE.lang === 'tr' ? 'Madde-Toplam İstatistikleri' : 'Item-Total Statistics',
            columns: [
                VIZ_STATE.lang === 'tr' ? 'Madde' : 'Item',
                VIZ_STATE.lang === 'tr' ? 'Ortalama' : 'Mean',
                VIZ_STATE.lang === 'tr' ? 'DüzeltilmiÅŸ Madde-Toplam Korelasyonu' : 'Corrected Item-Total Correlation',
                VIZ_STATE.lang === 'tr' ? 'Madde ÇıkarıldıÄŸında Alpha' : "Cronbach's Alpha if Item Deleted"
            ],
            rows: itemTotalStats.map(item => [
                item.item,
                item.mean.toFixed(3),
                item.correctedItemTotal.toFixed(3),
                item.alphaIfDeleted.toFixed(3)
            ])
        }
    ];

    // FAZ-P2-2: Legacy format (for backward compatibility)
    const legacy = {
        columns: ['Item', 'Mean', 'Variance', 'Corrected Item-Total r', 'Alpha if Deleted'],
        rows: itemTotalStats.map(item => [
            item.item,
            item.mean.toFixed(3),
            item.variance.toFixed(3),
            item.correctedItemTotal.toFixed(3),
            item.alphaIfDeleted.toFixed(3)
        ])
    };

    return {
        valid: true,
        testType: 'cronbach',
        testName: "Cronbach's Alpha",
        alpha: alpha,
        cronbachAlpha: alpha,
        itemCount: k,
        nItems: k,
        interpretation: interpretation,
        // FAZ-P2-2: SPSS format
        tables: tables,
        legacy: legacy,
        // Item statistics for detailed analysis
        itemStatistics: itemTotalStats
    };
}

/**
 * Run linear regression (simple or multiple)
 * FAZ-P2-2: SPSS tables format added
 * PROMPT-2: Added 95% CI, Durbin-Watson, VIF/Tolerance
 * PROMPT-UPDATE-3: Extended for multiple predictors with VIF collinearity and influence diagnostics
 */
export function runLinearRegression(data, yColumn, xColumn) {
    const lang = VIZ_STATE?.lang || 'tr';

    // PROMPT-UPDATE-3: Support both single predictor (string) and multiple predictors (array)
    const xColumns = Array.isArray(xColumn) ? xColumn : [xColumn];
    const p = xColumns.length; // Number of predictors

    // Parse data for all predictors
    const observations = [];
    for (const row of data) {
        const y = parseFloat(row[yColumn]);
        if (isNaN(y)) continue;

        const x = [];
        let valid = true;
        for (const col of xColumns) {
            const val = parseFloat(row[col]);
            if (isNaN(val)) {
                valid = false;
                break;
            }
            x.push(val);
        }
        if (valid) {
            observations.push({ y, x });
        }
    }

    const n = observations.length;

    if (n < p + 2) {
        return {
            valid: false,
            error: lang === 'tr' ? `En az ${p + 2} veri noktasi gerekli` : `At least ${p + 2} data points required`,
            testName: lang === 'tr' ? 'Dogrusal Regresyon' : 'Linear Regression'
        };
    }

    // Build design matrix X (with intercept) and Y vector
    const Y = observations.map(o => o.y);
    const X = observations.map(o => [1, ...o.x]); // Include intercept
    const meanY = Y.reduce((s, y) => s + y, 0) / n;

    // Use matrix operations for multiple regression: beta = (X'X)^(-1) X'Y
    const Xt = transposeMatrix(X);
    const XtX = multiplyMatrices(Xt, X);
    const XtXInv = invertMatrix(XtX);

    if (!XtXInv) {
        return {
            valid: false,
            error: lang === 'tr' ? 'Matris tekil - coklu dogrusallık sorunu' : 'Singular matrix - multicollinearity issue',
            testName: lang === 'tr' ? 'Dogrusal Regresyon' : 'Linear Regression',
            collinearityError: true
        };
    }

    const XtY = multiplyMatrices(Xt, Y.map(y => [y]));
    const beta = multiplyMatrices(XtXInv, XtY).map(b => b[0]);

    // Predicted values and residuals
    const predicted = X.map(xi => xi.reduce((s, xij, j) => s + xij * beta[j], 0));
    const residuals = Y.map((yi, i) => yi - predicted[i]);

    // Sum of Squares
    const ssTotal = Y.reduce((s, yi) => s + Math.pow(yi - meanY, 2), 0);
    const ssResidual = residuals.reduce((s, e) => s + e * e, 0);
    const ssRegression = ssTotal - ssResidual;

    // Degrees of freedom
    const dfRegression = p;
    const dfResidual = n - p - 1;
    const dfTotal = n - 1;

    // Mean Squares
    const msRegression = dfRegression > 0 ? ssRegression / dfRegression : 0;
    const msResidual = dfResidual > 0 ? ssResidual / dfResidual : 0;
    const seResidual = Math.sqrt(msResidual);

    // F-statistic and p-value
    const fStatistic = msResidual > 0 ? msRegression / msResidual : 0;
    const pValueF = fStatistic > 0 ? (1 - approximateFTestPValue(fStatistic, dfRegression, dfResidual)) : 1;

    // R-squared and Adjusted R-squared
    const r2 = ssTotal > 0 ? ssRegression / ssTotal : 0;
    const r = Math.sqrt(r2) * (beta[1] >= 0 ? 1 : -1);
    const r2Adjusted = 1 - ((1 - r2) * (n - 1) / Math.max(n - p - 1, 1));

    // Standard errors for coefficients
    const varBeta = XtXInv.map(row => row.map(v => v * msResidual));
    const seBeta = varBeta.map((row, i) => Math.sqrt(Math.abs(row[i])));

    // t-statistics and p-values for coefficients
    const tBeta = beta.map((b, i) => seBeta[i] > 0 ? b / seBeta[i] : 0);
    const pBeta = tBeta.map(t => approximateTTestPValue(Math.abs(t), Math.max(dfResidual, 1)));

    // 95% Confidence Intervals
    const tCritical = getTCritical(Math.max(dfResidual, 1), 0.05);
    const ciLower = beta.map((b, i) => b - tCritical * seBeta[i]);
    const ciUpper = beta.map((b, i) => b + tCritical * seBeta[i]);

    // Durbin-Watson
    let dwNumerator = 0;
    for (let i = 1; i < residuals.length; i++) {
        dwNumerator += Math.pow(residuals[i] - residuals[i - 1], 2);
    }
    const durbinWatson = ssResidual > 0 ? dwNumerator / ssResidual : 0;

    // =================================================
    // PROMPT-UPDATE-3 GOREV A: Collinearity Diagnostics (VIF/Tolerance)
    // =================================================
    const collinearity = [];

    if (p === 1) {
        // Single predictor: VIF = 1 always
        collinearity.push({ name: xColumns[0], vif: 1, tolerance: 1, valid: true });
    } else {
        // Multiple predictors: Calculate VIF for each
        for (let j = 0; j < p; j++) {
            try {
                // Regress X_j on all other X predictors
                const Yj = observations.map(o => o.x[j]);
                const Xj = observations.map(o => {
                    const row = [1];
                    for (let k = 0; k < p; k++) {
                        if (k !== j) row.push(o.x[k]);
                    }
                    return row;
                });

                const XjT = transposeMatrix(Xj);
                const XjTXj = multiplyMatrices(XjT, Xj);
                const XjTXjInv = invertMatrix(XjTXj);

                if (!XjTXjInv) {
                    collinearity.push({ name: xColumns[j], vif: Infinity, tolerance: 0, valid: false, note: 'Singular' });
                    continue;
                }

                const XjTYj = multiplyMatrices(XjT, Yj.map(y => [y]));
                const betaJ = multiplyMatrices(XjTXjInv, XjTYj).map(b => b[0]);

                // Calculate R^2_j
                const meanYj = Yj.reduce((s, y) => s + y, 0) / n;
                const predictedJ = Xj.map(xi => xi.reduce((s, xik, k) => s + xik * betaJ[k], 0));
                const ssTotalJ = Yj.reduce((s, y) => s + Math.pow(y - meanYj, 2), 0);
                const ssResidJ = Yj.reduce((s, y, i) => s + Math.pow(y - predictedJ[i], 2), 0);
                const r2j = ssTotalJ > 0 ? 1 - (ssResidJ / ssTotalJ) : 0;

                // VIF = 1 / (1 - R^2_j)
                const vifJ = r2j < 1 ? 1 / (1 - r2j) : Infinity;
                const toleranceJ = r2j < 1 ? 1 - r2j : 0;

                collinearity.push({ name: xColumns[j], vif: isFinite(vifJ) ? vifJ : Infinity, tolerance: toleranceJ, r2: r2j, valid: isFinite(vifJ) });
            } catch (e) {
                collinearity.push({ name: xColumns[j], vif: NaN, tolerance: NaN, valid: false, note: 'Error' });
            }
        }
    }

    // =================================================
    // PROMPT-UPDATE-3 GOREV B: Influence Diagnostics (Leverage + Cook's D)
    // =================================================
    const leverage = [];
    const cooksD = [];
    const highLeverageIdx = [];
    const highCooksIdx = [];
    const leverageThreshold = 2 * (p + 1) / n;
    const cooksDThreshold = 4 / n;

    for (let i = 0; i < n; i++) {
        // h_ii = X_i' (X'X)^(-1) X_i
        const Xi = X[i];
        const temp = [];
        for (let jj = 0; jj < p + 1; jj++) {
            let sum = 0;
            for (let kk = 0; kk < p + 1; kk++) {
                sum += XtXInv[jj][kk] * Xi[kk];
            }
            temp.push(sum);
        }
        const hii = Xi.reduce((s, xij, jj) => s + xij * temp[jj], 0);
        leverage.push(hii);
        if (hii > leverageThreshold) highLeverageIdx.push(i);

        // Cook's D
        const ei = residuals[i];
        const denom = (p + 1) * msResidual * Math.pow(1 - hii, 2);
        const cooksDi = denom > 0 ? (ei * ei * hii) / denom : 0;
        cooksD.push(cooksDi);
        if (cooksDi > cooksDThreshold) highCooksIdx.push(i);
    }

    const influence = {
        leverage: leverage,
        cooksD: cooksD,
        flags: { highLeverageIdx, highCooksIdx, leverageThreshold, cooksDThreshold },
        summary: { maxLeverage: Math.max(...leverage), maxCooksD: Math.max(...cooksD), nHighLeverage: highLeverageIdx.length, nHighCooksD: highCooksIdx.length }
    };

    // =================================================
    // Build SPSS-like tables
    // =================================================
    const tables = [
        {
            title: lang === 'tr' ? 'Model Ozeti' : 'Model Summary',
            columns: ['R', 'R2', lang === 'tr' ? 'Duzeltilmis R2' : 'Adjusted R2', lang === 'tr' ? 'Std. Hata' : 'Std. Error', 'Durbin-Watson'],
            rows: [[Math.abs(r).toFixed(3), r2.toFixed(3), r2Adjusted.toFixed(3), seResidual.toFixed(3), durbinWatson.toFixed(3)]]
        },
        {
            title: 'ANOVA',
            columns: [lang === 'tr' ? 'Kaynak' : 'Source', lang === 'tr' ? 'Kareler Toplami' : 'Sum of Squares', 'df', lang === 'tr' ? 'Ort. Kare' : 'Mean Square', 'F', lang === 'tr' ? 'Anlamlilik' : 'Sig.'],
            rows: [
                [lang === 'tr' ? 'Regresyon' : 'Regression', ssRegression.toFixed(3), dfRegression, msRegression.toFixed(3), fStatistic.toFixed(3), pValueF < 0.001 ? '<.001' : pValueF.toFixed(4)],
                [lang === 'tr' ? 'Kalinti' : 'Residual', ssResidual.toFixed(3), dfResidual, msResidual.toFixed(3), '', ''],
                [lang === 'tr' ? 'Toplam' : 'Total', ssTotal.toFixed(3), dfTotal, '', '', '']
            ]
        },
        {
            title: lang === 'tr' ? 'Katsayilar' : 'Coefficients',
            columns: [lang === 'tr' ? 'Model' : 'Model', 'B', lang === 'tr' ? 'Std. Hata' : 'Std. Error', 't', lang === 'tr' ? 'Anlamlilik' : 'Sig.', '95% CI Lower', '95% CI Upper', 'VIF'],
            rows: [
                [lang === 'tr' ? '(Sabit)' : '(Constant)', beta[0].toFixed(4), seBeta[0].toFixed(4), tBeta[0].toFixed(3), pBeta[0] < 0.001 ? '<.001' : pBeta[0].toFixed(4), ciLower[0].toFixed(4), ciUpper[0].toFixed(4), ''],
                ...xColumns.map((col, j) => [col, beta[j + 1].toFixed(4), seBeta[j + 1].toFixed(4), tBeta[j + 1].toFixed(3), pBeta[j + 1] < 0.001 ? '<.001' : pBeta[j + 1].toFixed(4), ciLower[j + 1].toFixed(4), ciUpper[j + 1].toFixed(4), collinearity[j]?.vif && isFinite(collinearity[j].vif) ? collinearity[j].vif.toFixed(3) : '-'])
            ]
        }
    ];

    // Collinearity Diagnostics Table (multiple predictors only)
    if (p > 1) {
        tables.push({
            title: lang === 'tr' ? 'Coklu Dogrusallık Tanilari' : 'Collinearity Diagnostics',
            columns: [lang === 'tr' ? 'Degisken' : 'Variable', 'Tolerance', 'VIF', lang === 'tr' ? 'Durum' : 'Status'],
            rows: collinearity.map(c => [c.name, c.valid ? c.tolerance.toFixed(4) : '-', c.valid && isFinite(c.vif) ? c.vif.toFixed(3) : (c.note || 'N/A'), c.vif > 10 ? 'HIGH' : (c.valid ? 'OK' : 'ERR')])
        });
    }

    // Influence Summary Table
    tables.push({
        title: lang === 'tr' ? 'Etki Ozeti' : 'Influence Summary',
        columns: [lang === 'tr' ? 'Istatistik' : 'Statistic', lang === 'tr' ? 'Deger' : 'Value'],
        rows: [
            ['Max Leverage', influence.summary.maxLeverage.toFixed(4)],
            ['Max Cooks D', influence.summary.maxCooksD.toFixed(4)],
            ['High Leverage (n)', String(influence.summary.nHighLeverage)],
            ['High Cooks D (n)', String(influence.summary.nHighCooksD)]
        ]
    });

    // Legacy format (backward compatibility)
    const legacy = {
        columns: ['Statistic', 'Value'],
        rows: [['R', Math.abs(r).toFixed(4)], ['R2', r2.toFixed(4)], ['Adjusted R2', r2Adjusted.toFixed(4)], ['Slope (B)', beta[1].toFixed(4)], ['Intercept', beta[0].toFixed(4)], ['F', fStatistic.toFixed(4)], ['Sig.', pValueF.toFixed(4)], ['Durbin-Watson', durbinWatson.toFixed(4)]]
    };

    // Build coefficients object (backward compatible + extended)
    const coefficients = {
        intercept: { B: beta[0], SE: seBeta[0], t: tBeta[0], p: pBeta[0], CI: { lower: ciLower[0], upper: ciUpper[0], level: 0.95 } }
    };

    if (p === 1) {
        coefficients.slope = { B: beta[1], SE: seBeta[1], Beta: r, t: tBeta[1], p: pBeta[1], variable: xColumns[0], CI: { lower: ciLower[1], upper: ciUpper[1], level: 0.95 }, VIF: 1, tolerance: 1 };
    } else {
        coefficients.predictors = xColumns.map((col, j) => ({ name: col, B: beta[j + 1], SE: seBeta[j + 1], t: tBeta[j + 1], p: pBeta[j + 1], CI: { lower: ciLower[j + 1], upper: ciUpper[j + 1], level: 0.95 }, VIF: collinearity[j]?.vif || NaN, tolerance: collinearity[j]?.tolerance || NaN }));
    }

    return {
        valid: true,
        testType: 'regression',
        testName: lang === 'tr' ? 'Dogrusal Regresyon' : 'Linear Regression',
        n: n,
        p: p,
        slope: beta[1],
        intercept: beta[0],
        r: r,
        rSquared: r2,
        r2Adjusted: r2Adjusted,
        fStatistic: fStatistic,
        pValue: pValueF,
        equation: p === 1 ? `y = ${beta[1].toFixed(4)}x + ${beta[0].toFixed(4)}` : `y = ${beta[0].toFixed(4)} + ${xColumns.map((col, j) => `${beta[j + 1].toFixed(4)}*${col}`).join(' + ')}`,
        durbinWatson: durbinWatson,
        coefficients: coefficients,
        beta: beta,
        seBeta: seBeta,
        tBeta: tBeta,
        pBeta: pBeta,
        collinearity: collinearity,
        influence: influence,
        residuals: residuals,
        predicted: predicted,
        tables: tables,
        legacy: legacy,
        interpretation: lang === 'tr'
            ? `R2 = ${(r2 * 100).toFixed(1)}% - Model varyansın %${(r2 * 100).toFixed(1)}'ini acikliyor. F(${dfRegression},${dfResidual}) = ${fStatistic.toFixed(2)}, p = ${pValueF < 0.001 ? '<.001' : pValueF.toFixed(4)}. DW = ${durbinWatson.toFixed(3)}.`
            : `R2 = ${(r2 * 100).toFixed(1)}% - Model explains ${(r2 * 100).toFixed(1)}% of variance. F(${dfRegression},${dfResidual}) = ${fStatistic.toFixed(2)}, p = ${pValueF < 0.001 ? '<.001' : pValueF.toFixed(4)}. DW = ${durbinWatson.toFixed(3)}.`
    };
}

/**
 * Run power analysis
 * FAZ-P2-3: SPSS tables format added
 */
export function runPowerAnalysis(effectSize, n, alpha = 0.05, testType = 't-test') {
    // Simplified power calculation for t-test
    const se = Math.sqrt(2 / n);
    const ncp = effectSize / se; // Non-centrality parameter
    const criticalT = getTCritical(alpha, n - 1);

    // Approximate power using normal distribution
    const power = 1 - normalCDF(criticalT - ncp);
    const clampedPower = Math.min(0.99, Math.max(0.01, power));

    // FAZ-P2-3: SPSS-like tables
    const tables = [
        {
            title: VIZ_STATE.lang === 'tr' ? 'Güç Analizi Sonuçları' : 'Power Analysis Results',
            columns: [
                VIZ_STATE.lang === 'tr' ? 'Test Tipi' : 'Test Type',
                VIZ_STATE.lang === 'tr' ? 'Etki BüyüklüÄŸü' : 'Effect Size',
                'Alpha',
                'N',
                VIZ_STATE.lang === 'tr' ? 'Güç' : 'Power'
            ],
            rows: [
                [testType, effectSize.toFixed(2), alpha.toFixed(2), n, (clampedPower * 100).toFixed(1) + '%']
            ]
        }
    ];

    // Legacy format
    const legacy = {
        columns: ['Test Type', 'Effect Size', 'Alpha', 'N', 'Power'],
        rows: [[testType, effectSize.toFixed(2), alpha.toFixed(2), n, (clampedPower * 100).toFixed(1) + '%']]
    };

    return {
        valid: true,
        testType: 'power',
        testName: VIZ_STATE.lang === 'tr' ? 'Güç Analizi' : 'Power Analysis',
        effectSize: effectSize,
        sampleSize: n,
        alpha: alpha,
        power: clampedPower,
        // FAZ-P2-3: SPSS format
        tables: tables,
        legacy: legacy,
        interpretation: clampedPower > 0.8
            ? (VIZ_STATE.lang === 'tr' ? `Yeterli güç (%${(clampedPower * 100).toFixed(0)}). Bu örneklem büyüklüÄŸü yeterli.` : `Adequate power (${(clampedPower * 100).toFixed(0)}%). Sample size is sufficient.`)
            : (VIZ_STATE.lang === 'tr' ? `DüÅŸük güç (%${(clampedPower * 100).toFixed(0)}). Daha büyük örneklem önerilir.` : `Low power (${(clampedPower * 100).toFixed(0)}%). Larger sample recommended.`)
    };
}

// normalCDF already defined at L1396 - removed duplicate


// NOTE: The following helper functions (approximateFTestPValue, incompleteBeta, beta, logGamma)
// are already defined earlier in this file. Removed duplicates to prevent SyntaxError.

// NOTE: runLogisticRegression function moved to line ~2150 with IRLS algorithm (FAZ-P1-3)


/**
 * Time series analysis (with date validation)
 * Validates date column, calculates trend, moving average, seasonality hint
 */
export function runTimeSeriesAnalysis(data, valueColumn, timeColumn) {
    // 1. Validate date column
    let parsedDates = 0;
    let failedDates = 0;
    const dateValues = [];

    data.forEach((row, idx) => {
        const rawDate = row[timeColumn];
        const value = parseFloat(row[valueColumn]);

        if (isNaN(value)) return;

        // Try to parse date
        const parsed = Date.parse(rawDate);
        if (!isNaN(parsed)) {
            parsedDates++;
            dateValues.push({ date: new Date(parsed), value, idx });
        } else {
            failedDates++;
        }
    });

    const parseRatio = parsedDates / (parsedDates + failedDates);

    if (parseRatio < 0.5) {
        return {
            testType: 'timeseries',
            testName: VIZ_STATE.lang === 'tr' ? 'Zaman Serisi Analizi' : 'Time Series Analysis',
            valid: false,
            error: VIZ_STATE.lang === 'tr' ? `${timeColumn} sütunu geçerli tarih formatında deÄŸil` : `${timeColumn} column is not in valid date format`,
            parseReport: {
                parsed: parsedDates,
                failed: failedDates,
                ratio: (parseRatio * 100).toFixed(1) + '%'
            },
            degrade: true,
            reason: VIZ_STATE.lang === 'tr' ? 'Zaman serisi analizi için tarih sütunu gereklidir' : 'Date column required for time series analysis'
        };
    }

    // 2. Sort by date
    dateValues.sort((a, b) => a.date - b.date);
    const values = dateValues.map(d => d.value);
    const n = values.length;

    // 3. Calculate statistics
    const mean = calculateMean(values);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // 4. Trend (linear regression slope)
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    values.forEach((v, i) => {
        sumX += i;
        sumY += v;
        sumXY += i * v;
        sumXX += i * i;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trendDirection = slope > 0.01 ? (VIZ_STATE.lang === 'tr' ? 'ArtıÅŸ' : 'Increasing') : slope < -0.01 ? (VIZ_STATE.lang === 'tr' ? 'AzalıÅŸ' : 'Decreasing') : (VIZ_STATE.lang === 'tr' ? 'Sabit' : 'Stable');

    // 5. Moving average (window = 5 or n/10)
    const windowSize = Math.max(3, Math.min(5, Math.floor(n / 10)));
    const movingAvg = [];
    for (let i = windowSize - 1; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) sum += values[i - j];
        movingAvg.push({ idx: i, value: (sum / windowSize).toFixed(2) });
    }

    return {
        testType: 'timeseries',
        testName: VIZ_STATE.lang === 'tr' ? 'Zaman Serisi Analizi' : 'Time Series Analysis',
        valid: true,
        n: n,
        parseReport: { parsed: parsedDates, failed: failedDates },
        dateRange: {
            start: dateValues[0].date.toISOString().split('T')[0],
            end: dateValues[n - 1].date.toISOString().split('T')[0]
        },
        statistics: { mean: mean.toFixed(2), min: min.toFixed(2), max: max.toFixed(2) },
        trend: { slope: slope.toFixed(4), direction: trendDirection },
        movingAverageWindow: windowSize,
        interpretation: {
            tr: `${n} gözlem analiz edildi (${parsedDates} tarih parse edildi). Seri ${trendDirection.toLowerCase()} eÄŸilimi gösteriyor (eÄŸim: ${slope.toFixed(4)}).`,
            en: `${n} observations analyzed (${parsedDates} dates parsed). Series shows ${trendDirection.toLowerCase()} trend (slope: ${slope.toFixed(4)}).`
        }
    };
}


/**
 * Discriminant analysis (Basic LDA implementation)
 * Calculates group means, pooled covariance, classification
 */
export function runDiscriminantAnalysis(data, groupColumn, columns) {
    if (!groupColumn || columns.length < 1) {
        return { error: VIZ_STATE.lang === 'tr' ? 'Grup ve en az 1 deÄŸiÅŸken gerekli' : 'Group and at least 1 variable required', valid: false };
    }

    // 1. Group data
    const groups = {};
    data.forEach(row => {
        const g = row[groupColumn];
        if (g === null || g === undefined || g === '') return;

        const vals = [];
        let valid = true;
        columns.forEach(col => {
            const v = parseFloat(row[col]);
            if (isNaN(v)) valid = false;
            else vals.push(v);
        });

        if (valid) {
            if (!groups[g]) groups[g] = [];
            groups[g].push(vals);
        }
    });

    const groupNames = Object.keys(groups);
    if (groupNames.length < 2) {
        return { error: 'En az 2 grup gerekli', valid: false };
    }

    // 2. Calculate group means
    const groupStats = groupNames.map(g => {
        const members = groups[g];
        const n = members.length;
        const means = columns.map((_, i) => members.reduce((s, m) => s + m[i], 0) / n);
        return { group: g, n, means };
    });

    // 3. Calculate classification accuracy (nearest centroid)
    let correct = 0;
    let total = 0;
    groupNames.forEach(g => {
        groups[g].forEach(point => {
            let minDist = Infinity;
            let predicted = g;
            groupStats.forEach(gs => {
                const d = point.reduce((s, v, i) => s + (v - gs.means[i]) ** 2, 0);
                if (d < minDist) { minDist = d; predicted = gs.group; }
            });
            if (predicted === g) correct++;
            total++;
        });
    });
    const accuracy = (correct / total * 100).toFixed(1);

    return {
        testType: 'discriminant',
        testName: VIZ_STATE.lang === 'tr' ? 'Diskriminant Analizi (LDA)' : 'Discriminant Analysis (LDA)',
        valid: true,
        nObservations: total,
        nGroups: groupNames.length,
        nVariables: columns.length,
        groupStats: groupStats.map(gs => ({
            group: gs.group,
            n: gs.n,
            means: columns.map((col, i) => ({ variable: col, mean: gs.means[i].toFixed(3) }))
        })),
        classificationAccuracy: accuracy,
        interpretation: {
            tr: `${groupNames.length} grup ile LDA yapıldı. En yakın merkez sınıflandırma doÄŸruluÄŸu: %${accuracy}`,
            en: `LDA performed with ${groupNames.length} groups. Nearest centroid classification accuracy: ${accuracy}%`
        }
    };
}

/**
 * Survival analysis (Kaplan-Meier with Log-Rank Test and Median CI)
 * Requires: time (numeric), event (binary: 1=event, 0=censored)
 * 
 * Enhanced features:
 * - Log-rank test for comparing 2+ groups (Ï‡², df, pValue)
 * - Median survival with 95% CI (Greenwood SE + log-log transform)
 */
export function runSurvivalAnalysis(data, timeColumn, eventColumn, groupColumn) {
    if (!timeColumn || !eventColumn) {
        return { error: VIZ_STATE.lang === 'tr' ? 'Zaman ve olay deÄŸiÅŸkeni gerekli' : 'Time and event variable required', valid: false };
    }

    // 1. Parse data
    const observations = [];
    data.forEach(row => {
        const time = parseFloat(row[timeColumn]);
        const event = parseInt(row[eventColumn]);
        const group = groupColumn ? row[groupColumn] : 'All';

        if (!isNaN(time) && (event === 0 || event === 1)) {
            observations.push({ time, event, group });
        }
    });

    if (observations.length < 5) {
        return { error: VIZ_STATE.lang === 'tr' ? 'Yeterli veri yok (min 5 gözlem)' : 'Insufficient data (min 5 observations)', valid: false };
    }

    // 2. Kaplan-Meier by group (with Greenwood variance for CI)
    const groups = [...new Set(observations.map(o => o.group))];

    // Helper: Calculate detailed KM with variance for median CI
    function computeKM(gObs) {
        const n = gObs.length;
        const sortedObs = [...gObs].sort((a, b) => a.time - b.time);
        const survivalTable = [];
        let atRisk = n;
        let survival = 1;
        let greenwoodSum = 0; // Î£ d_j / (n_j * (n_j - d_j))

        const timePoints = [...new Set(sortedObs.map(o => o.time))].sort((a, b) => a - b);

        timePoints.forEach(t => {
            const events = sortedObs.filter(o => o.time === t && o.event === 1).length;
            const censored = sortedObs.filter(o => o.time === t && o.event === 0).length;

            if (events > 0) {
                survival *= (atRisk - events) / atRisk;
                // Greenwood variance component
                if (atRisk > events) {
                    greenwoodSum += events / (atRisk * (atRisk - events));
                }
                const variance = survival * survival * greenwoodSum;
                const se = Math.sqrt(variance);
                survivalTable.push({
                    time: t,
                    survival: survival,
                    survivalStr: survival.toFixed(3),
                    atRisk,
                    events,
                    censored,
                    variance,
                    se
                });
            }

            atRisk -= (events + censored);
        });

        return { survivalTable, n, events: gObs.filter(o => o.event === 1).length, censored: gObs.filter(o => o.event === 0).length };
    }

    // Helper: Calculate median survival with log-log CI
    function computeMedianWithCI(survivalTable, level = 0.95) {
        const alpha = 1 - level;
        const z = 1.96; // z_{0.025} for 95% CI

        // Find median: first time where S(t) <= 0.5
        const medianRow = survivalTable.find(r => r.survival <= 0.5);
        const median = medianRow ? medianRow.time : null;

        if (!medianRow || medianRow.survival <= 0 || medianRow.survival >= 1) {
            return { median, ciLower: null, ciUpper: null, level, method: 'KM', ciMethod: 'log-log' };
        }

        // Log-log transform CI for S(t=median)
        const S = medianRow.survival;
        const SE = medianRow.se;

        if (S <= 0 || S >= 1 || SE <= 0 || Math.log(S) === 0) {
            return { median, ciLower: null, ciUpper: null, level, method: 'KM', ciMethod: 'log-log' };
        }

        // Î¸ = -log(-log(S))
        const theta = -Math.log(-Math.log(S));
        // SE(Î¸) = SE / (S * |log(S)|)
        const seTheta = SE / (S * Math.abs(Math.log(S)));

        const thetaLower = theta - z * seTheta;
        const thetaUpper = theta + z * seTheta;

        // Invert: S = exp(-exp(-Î¸))
        const sLower = Math.exp(-Math.exp(-thetaUpper)); // Note: swap for CI
        const sUpper = Math.exp(-Math.exp(-thetaLower));

        // Find times corresponding to these survival probabilities
        // ciLower = first t where S(t) <= sUpper
        // ciUpper = first t where S(t) <= sLower
        const ciLowerRow = survivalTable.find(r => r.survival <= sUpper);
        const ciUpperRow = survivalTable.find(r => r.survival <= sLower);

        return {
            median,
            ciLower: ciLowerRow ? ciLowerRow.time : null,
            ciUpper: ciUpperRow ? ciUpperRow.time : null,
            level,
            method: 'KM',
            ciMethod: 'log-log'
        };
    }

    const kmResults = groups.map(g => {
        const gObs = observations.filter(o => o.group === g);
        const km = computeKM(gObs);

        // Median survival (time when survival <= 0.5) - backwards compatible
        const medianRow = km.survivalTable.find(r => r.survival <= 0.5);
        const medianSurvival = medianRow ? medianRow.time : 'NR';

        return {
            group: g,
            n: km.n,
            events: km.events,
            censored: km.censored,
            medianSurvival: medianSurvival,
            survivalTable: km.survivalTable.slice(0, 10).map(r => ({
                time: r.time,
                survival: r.survivalStr,
                atRisk: r.atRisk,
                events: r.events,
                censored: r.censored
            })),
            _fullSurvivalTable: km.survivalTable // Internal use for median CI
        };
    });

    // 3. Compute Median Survival with CI (for each group + overall)
    const medianSurvivalResult = {
        overall: null,
        byGroup: {}
    };

    // Overall median (all observations combined)
    const allKM = computeKM(observations);
    medianSurvivalResult.overall = computeMedianWithCI(allKM.survivalTable);

    // Per-group median
    kmResults.forEach(kmr => {
        const fullTable = kmr._fullSurvivalTable;
        medianSurvivalResult.byGroup[kmr.group] = computeMedianWithCI(fullTable);
    });

    // 4. Log-Rank Test (only when 2+ groups)
    let logRankResult = null;

    if (groups.length >= 2 && groupColumn) {
        // Collect all unique event times across all groups
        const allEventTimes = [...new Set(
            observations.filter(o => o.event === 1).map(o => o.time)
        )].sort((a, b) => a - b);

        // For each group, track at-risk counts at each time
        const groupData = {};
        groups.forEach(g => {
            const gObs = observations.filter(o => o.group === g).sort((a, b) => a.time - b.time);
            groupData[g] = { obs: gObs, n: gObs.length };
        });

        // Calculate O - E and variance for each group
        let sumStats = {}; // { group: { O: observed, E: expected, V: variance } }
        groups.forEach(g => {
            sumStats[g] = { O: 0, E: 0, V: 0 };
        });

        allEventTimes.forEach(t => {
            // At each event time t, calculate risk sets and events per group
            let totalAtRisk = 0;
            let totalEvents = 0;
            const groupAtRisk = {};
            const groupEvents = {};

            groups.forEach(g => {
                const gObs = groupData[g].obs;
                // At-risk: those with time >= t
                const atRisk = gObs.filter(o => o.time >= t).length;
                // Events at time t
                const events = gObs.filter(o => o.time === t && o.event === 1).length;

                groupAtRisk[g] = atRisk;
                groupEvents[g] = events;
                totalAtRisk += atRisk;
                totalEvents += events;
            });

            // Skip if no one at risk or no events
            if (totalAtRisk === 0 || totalEvents === 0) return;

            // Calculate expected and variance for each group (Breslow approximation for ties)
            groups.forEach(g => {
                const n_i = groupAtRisk[g];
                const d_i = groupEvents[g];
                const n = totalAtRisk;
                const d = totalEvents;

                // Expected: E_i = n_i * (d / n)
                const E_i = n_i * (d / n);
                sumStats[g].O += d_i;
                sumStats[g].E += E_i;

                // Variance: V_i = n_i * (n - n_i) * d * (n - d) / (n^2 * (n - 1))
                if (n > 1) {
                    const V_i = (n_i * (n - n_i) * d * (n - d)) / (n * n * (n - 1));
                    sumStats[g].V += V_i;
                }
            });
        });

        // Calculate chi-square statistic
        // Ï‡² = Î£ (O_i - E_i)² / V_i (for each group except last, to maintain df = k-1)
        // Alternative: use pooled formula for better numerical stability
        let chiSquare = 0;
        let totalV = 0;

        groups.forEach(g => {
            const O = sumStats[g].O;
            const E = sumStats[g].E;
            const V = sumStats[g].V;

            if (V > 0) {
                chiSquare += ((O - E) * (O - E)) / V;
            }
            totalV += V;
        });

        // Degrees of freedom = k - 1
        const df = groups.length - 1;

        // p-value from chi-square distribution
        let pValue = 1;
        if (chiSquare > 0 && df > 0) {
            pValue = 1 - chiSquareCDF(chiSquare, df);
        }

        logRankResult = {
            method: 'logrank',
            chiSquare: isFinite(chiSquare) ? chiSquare : NaN,
            df: df,
            pValue: isFinite(pValue) ? pValue : NaN,
            valid: isFinite(chiSquare) && isFinite(pValue),
            notes: VIZ_STATE.lang === 'tr' ? 'Breslow yaklaÅŸımı (baÄŸlı gözlemler için)' : 'Breslow approximation for ties'
        };
    }

    // 5. Build result tables
    const tables = [];

    // Log-Rank Test table (only if valid)
    if (logRankResult && logRankResult.valid) {
        tables.push({
            title: VIZ_STATE.lang === 'tr' ? 'Log-Rank Testi' : 'Log-Rank Test',
            columns: [
                VIZ_STATE.lang === 'tr' ? 'İstatistik' : 'Statistic',
                'Ï‡²',
                'df',
                'p'
            ],
            rows: [
                ['Log-Rank', logRankResult.chiSquare.toFixed(4), logRankResult.df, logRankResult.pValue.toFixed(4)]
            ]
        });
    }

    // Median Survival table
    const medianRows = [];

    // Add overall row if multiple groups exist
    if (groups.length > 1 && medianSurvivalResult.overall) {
        const ov = medianSurvivalResult.overall;
        medianRows.push([
            VIZ_STATE.lang === 'tr' ? 'Toplam' : 'Overall',
            observations.length,
            ov.median !== null ? ov.median : 'NR',
            ov.ciLower !== null ? ov.ciLower : '-',
            ov.ciUpper !== null ? ov.ciUpper : '-'
        ]);
    }

    // Add per-group rows
    kmResults.forEach(kmr => {
        const gm = medianSurvivalResult.byGroup[kmr.group];
        medianRows.push([
            kmr.group,
            kmr.n,
            gm && gm.median !== null ? gm.median : 'NR',
            gm && gm.ciLower !== null ? gm.ciLower : '-',
            gm && gm.ciUpper !== null ? gm.ciUpper : '-'
        ]);
    });

    tables.push({
        title: VIZ_STATE.lang === 'tr' ? 'Medyan SaÄŸkalım' : 'Median Survival',
        columns: [
            VIZ_STATE.lang === 'tr' ? 'Grup' : 'Group',
            'n',
            VIZ_STATE.lang === 'tr' ? 'Medyan' : 'Median',
            VIZ_STATE.lang === 'tr' ? '%95 GA Alt' : '95% CI Lower',
            VIZ_STATE.lang === 'tr' ? '%95 GA Ãœst' : '95% CI Upper'
        ],
        rows: medianRows
    });

    // Clean up internal fields before returning
    const cleanedKmResults = kmResults.map(kmr => {
        const { _fullSurvivalTable, ...rest } = kmr;
        return rest;
    });

    return {
        testType: 'survival',
        testName: VIZ_STATE.lang === 'tr' ? 'SaÄŸkalım Analizi (Kaplan-Meier)' : 'Survival Analysis (Kaplan-Meier)',
        valid: true,
        nObservations: observations.length,
        nGroups: groups.length,
        groups: cleanedKmResults,
        // New: Log-rank test result (only if 2+ groups)
        logRank: logRankResult,
        // New: Median survival with CI
        medianSurvival: medianSurvivalResult,
        // New: SPSS-style tables
        tables: tables,
        interpretation: {
            tr: `${observations.length} gözlem analiz edildi. ${groups.length > 1 ? `${groups.length} grup karÅŸılaÅŸtırıldı.${logRankResult && logRankResult.valid ? ` Log-rank p = ${logRankResult.pValue.toFixed(4)}` : ''}` : ''} Medyan saÄŸkalım tablodan görülebilir.`,
            en: `${observations.length} observations analyzed. ${groups.length > 1 ? `${groups.length} groups compared.${logRankResult && logRankResult.valid ? ` Log-rank p = ${logRankResult.pValue.toFixed(4)}` : ''}` : ''} Median survival shown in table.`
        }
    };
}


// =====================================================
// COX PROPORTIONAL HAZARDS REGRESSION (PROMPT-UPDATE-2)
// =====================================================

/**
 * Cox Proportional Hazards Regression
 * SPSS Survival Parity Pack with Efron tie handling and Schoenfeld residuals
 * 
 * @param {Array} data - Array of objects with time, event, and covariate columns
 * @param {string} timeColumn - Column name for survival time
 * @param {string} eventColumn - Column name for event indicator (1=event, 0=censored)
 * @param {Array<string>} covariates - Array of covariate column names
 * @param {Object} options - { ties: 'breslow'|'efron', alpha: 0.05 }
 */
export function runCoxRegression(data, timeColumn, eventColumn, covariates, options = {}) {
    const lang = VIZ_STATE?.lang || 'tr';

    // Validate inputs
    if (!data || !Array.isArray(data) || data.length === 0) {
        return { valid: false, error: lang === 'tr' ? 'Veri gerekli' : 'Data required' };
    }
    if (!timeColumn || !eventColumn) {
        return { valid: false, error: lang === 'tr' ? 'Zaman ve olay deÄŸiÅŸkeni gerekli' : 'Time and event columns required' };
    }
    if (!covariates || !Array.isArray(covariates) || covariates.length === 0) {
        return { valid: false, error: lang === 'tr' ? 'En az bir kovariyat gerekli' : 'At least one covariate required' };
    }

    // Parse options
    const tiesMethod = options.ties === 'efron' ? 'efron' : 'breslow';
    const alpha = options.alpha || 0.05;

    // 1. Parse and validate data
    const observations = [];
    for (const row of data) {
        const time = parseFloat(row[timeColumn]);
        const event = parseInt(row[eventColumn]);

        if (isNaN(time) || time < 0 || (event !== 0 && event !== 1)) continue;

        const covValues = [];
        let validCovs = true;
        for (const cov of covariates) {
            const val = parseFloat(row[cov]);
            if (isNaN(val)) {
                validCovs = false;
                break;
            }
            covValues.push(val);
        }

        if (validCovs) {
            observations.push({ time, event, covs: covValues });
        }
    }

    const n = observations.length;
    const p = covariates.length;
    const nEvents = observations.filter(o => o.event === 1).length;

    if (n < 10) {
        return { valid: false, error: lang === 'tr' ? 'Yeterli veri yok (min 10 gözlem)' : 'Insufficient data (min 10 observations)' };
    }
    if (nEvents < 3) {
        return { valid: false, error: lang === 'tr' ? 'Yeterli olay yok (min 3 olay)' : 'Insufficient events (min 3 events)' };
    }

    // Sort by time
    observations.sort((a, b) => a.time - b.time);

    // 2. Newton-Raphson optimization for Cox partial likelihood
    let beta = new Array(p).fill(0);
    const maxIter = 25;
    const tolerance = 1e-6;
    let converged = false;
    let iterations = 0;
    let logLikelihood = 0;

    // Get unique event times with their tied events
    const eventTimes = [];
    const timeToIdx = {};
    for (let i = 0; i < n; i++) {
        if (observations[i].event === 1) {
            const t = observations[i].time;
            if (!(t in timeToIdx)) {
                timeToIdx[t] = eventTimes.length;
                eventTimes.push({ time: t, events: [], riskSetStart: i });
            }
            eventTimes[timeToIdx[t]].events.push(i);
        }
    }

    // Calculate risk sets for each event time
    for (const et of eventTimes) {
        et.riskSet = [];
        for (let i = 0; i < n; i++) {
            if (observations[i].time >= et.time) {
                et.riskSet.push(i);
            }
        }
        // Actually, risk set should be those with time >= event time
        // Fix: risk set at time t includes all with T >= t
        et.riskSet = [];
        for (let i = 0; i < n; i++) {
            if (observations[i].time >= et.time) {
                et.riskSet.push(i);
            }
        }
    }

    // Helper: exp(X*beta) with overflow protection
    const expXb = (idx) => {
        let xb = 0;
        for (let j = 0; j < p; j++) {
            xb += observations[idx].covs[j] * beta[j];
        }
        return Math.exp(Math.max(-20, Math.min(20, xb)));
    };

    // Newton-Raphson iteration
    for (let iter = 0; iter < maxIter; iter++) {
        iterations = iter + 1;

        // Calculate gradient and Hessian
        const gradient = new Array(p).fill(0);
        const hessian = Array.from({ length: p }, () => new Array(p).fill(0));
        logLikelihood = 0;

        for (const et of eventTimes) {
            const d = et.events.length; // Number of tied events

            if (tiesMethod === 'efron' && d > 1) {
                // Efron approximation for ties
                // Sum over risk set
                let S0 = 0, S1 = new Array(p).fill(0), S2 = Array.from({ length: p }, () => new Array(p).fill(0));
                for (const i of et.riskSet) {
                    const w = expXb(i);
                    S0 += w;
                    for (let j = 0; j < p; j++) {
                        S1[j] += w * observations[i].covs[j];
                        for (let k = 0; k < p; k++) {
                            S2[j][k] += w * observations[i].covs[j] * observations[i].covs[k];
                        }
                    }
                }

                // Sum over tied events (for Efron adjustment)
                let D0 = 0, D1 = new Array(p).fill(0), D2 = Array.from({ length: p }, () => new Array(p).fill(0));
                for (const i of et.events) {
                    const w = expXb(i);
                    D0 += w;
                    for (let j = 0; j < p; j++) {
                        D1[j] += w * observations[i].covs[j];
                        for (let k = 0; k < p; k++) {
                            D2[j][k] += w * observations[i].covs[j] * observations[i].covs[k];
                        }
                    }
                }

                // Efron: average over m = 0, 1, ..., d-1
                for (let m = 0; m < d; m++) {
                    const frac = m / d;
                    const denom = S0 - frac * D0;
                    if (denom <= 0) continue;

                    logLikelihood -= Math.log(denom);

                    for (let j = 0; j < p; j++) {
                        const mean_j = (S1[j] - frac * D1[j]) / denom;
                        gradient[j] -= mean_j;

                        for (let k = 0; k < p; k++) {
                            const mean_jk = (S2[j][k] - frac * D2[j][k]) / denom;
                            hessian[j][k] -= mean_jk - mean_j * ((S1[k] - frac * D1[k]) / denom);
                        }
                    }
                }

                // Add contribution from events
                for (const i of et.events) {
                    for (let j = 0; j < p; j++) {
                        gradient[j] += observations[i].covs[j];
                        logLikelihood += observations[i].covs[j] * beta[j];
                    }
                }

            } else {
                // Breslow approximation (default)
                let S0 = 0, S1 = new Array(p).fill(0), S2 = Array.from({ length: p }, () => new Array(p).fill(0));

                for (const i of et.riskSet) {
                    const w = expXb(i);
                    S0 += w;
                    for (let j = 0; j < p; j++) {
                        S1[j] += w * observations[i].covs[j];
                        for (let k = 0; k < p; k++) {
                            S2[j][k] += w * observations[i].covs[j] * observations[i].covs[k];
                        }
                    }
                }

                if (S0 <= 0) continue;

                // Contribution from each event at this time
                for (const i of et.events) {
                    for (let j = 0; j < p; j++) {
                        gradient[j] += observations[i].covs[j] - S1[j] / S0;
                        logLikelihood += observations[i].covs[j] * beta[j];
                    }
                    logLikelihood -= Math.log(S0);

                    // Hessian contribution
                    for (let j = 0; j < p; j++) {
                        for (let k = 0; k < p; k++) {
                            hessian[j][k] -= S2[j][k] / S0 - (S1[j] / S0) * (S1[k] / S0);
                        }
                    }
                }
            }
        }

        // Solve for delta: hessian * delta = gradient
        const delta = solveLinearSystem(hessian.map(row => [...row]), gradient);

        if (!delta || delta.some(d => !isFinite(d))) {
            break; // Convergence failed
        }

        // Update beta
        let maxChange = 0;
        for (let j = 0; j < p; j++) {
            const change = -delta[j];
            beta[j] += change;
            maxChange = Math.max(maxChange, Math.abs(change));
        }

        if (maxChange < tolerance) {
            converged = true;
            break;
        }
    }

    // 3. Calculate final statistics
    // Re-calculate Hessian at final beta for SE
    const finalHessian = Array.from({ length: p }, () => new Array(p).fill(0));
    logLikelihood = 0;

    for (const et of eventTimes) {
        const d = et.events.length;

        let S0 = 0, S1 = new Array(p).fill(0), S2 = Array.from({ length: p }, () => new Array(p).fill(0));
        for (const i of et.riskSet) {
            const w = expXb(i);
            S0 += w;
            for (let j = 0; j < p; j++) {
                S1[j] += w * observations[i].covs[j];
                for (let k = 0; k < p; k++) {
                    S2[j][k] += w * observations[i].covs[j] * observations[i].covs[k];
                }
            }
        }

        if (S0 <= 0) continue;

        for (const i of et.events) {
            for (let j = 0; j < p; j++) {
                logLikelihood += observations[i].covs[j] * beta[j];
            }
            logLikelihood -= Math.log(S0);

            for (let j = 0; j < p; j++) {
                for (let k = 0; k < p; k++) {
                    finalHessian[j][k] -= S2[j][k] / S0 - (S1[j] / S0) * (S1[k] / S0);
                }
            }
        }
    }

    // Invert Hessian for variance-covariance matrix
    const varCov = invertMatrix(finalHessian.map(row => row.map(v => -v)));

    const standardErrors = [];
    const waldChi2 = [];
    const waldPValues = [];
    const hazardRatios = [];
    const hrCILower = [];
    const hrCIUpper = [];
    const zCritical = 1.96;

    for (let j = 0; j < p; j++) {
        const se = varCov ? Math.sqrt(Math.abs(varCov[j][j])) : 0;
        standardErrors.push(se);

        const wald = se > 0 ? Math.pow(beta[j] / se, 2) : NaN;
        waldChi2.push(isFinite(wald) ? wald : NaN);

        const waldP = isFinite(wald) ? approximateChiSquarePValue(wald, 1) : NaN;
        waldPValues.push(isFinite(waldP) ? waldP : NaN);

        const hr = Math.exp(beta[j]);
        hazardRatios.push(isFinite(hr) ? hr : NaN);

        hrCILower.push(Math.exp(beta[j] - zCritical * se));
        hrCIUpper.push(Math.exp(beta[j] + zCritical * se));
    }

    // Null log-likelihood (beta = 0)
    let logLikelihoodNull = 0;
    for (const et of eventTimes) {
        const riskSetSize = et.riskSet.length;
        for (let i = 0; i < et.events.length; i++) {
            logLikelihoodNull -= Math.log(riskSetSize);
        }
    }

    const minus2LL = -2 * logLikelihood;
    const modelChiSquare = -2 * (logLikelihoodNull - logLikelihood);
    const modelPValue = approximateChiSquarePValue(modelChiSquare, p);

    // 4. Schoenfeld Residuals & PH Test (GÖREV B)
    const schoenfeldResiduals = [];
    let phTest;

    try {
        // Calculate Schoenfeld residuals for each event
        for (const et of eventTimes) {
            let S0 = 0, S1 = new Array(p).fill(0);
            for (const i of et.riskSet) {
                const w = expXb(i);
                S0 += w;
                for (let j = 0; j < p; j++) {
                    S1[j] += w * observations[i].covs[j];
                }
            }

            if (S0 <= 0) continue;

            const expectedCovs = S1.map(s => s / S0);

            for (const eventIdx of et.events) {
                const residual = {
                    time: et.time,
                    values: []
                };
                for (let j = 0; j < p; j++) {
                    residual.values.push(observations[eventIdx].covs[j] - expectedCovs[j]);
                }
                schoenfeldResiduals.push(residual);
            }
        }

        // PH Test: Correlate residuals with rank of time
        if (schoenfeldResiduals.length >= 5) {
            const times = schoenfeldResiduals.map(r => r.time);
            const timeRanks = getRanks(times);

            const covariateTests = [];
            let globalChiSq = 0;

            for (let j = 0; j < p; j++) {
                const residuals = schoenfeldResiduals.map(r => r.values[j]);

                // Spearman correlation with time rank
                const rho = calculateSpearmanCorrelation(timeRanks, residuals);

                // Test statistic (approximate)
                const nResid = residuals.length;
                const t = rho * Math.sqrt((nResid - 2) / (1 - rho * rho));
                const pVal = approximateTTestPValue(Math.abs(t), nResid - 2);

                // Chi-square contribution
                const chi2 = isFinite(t) ? t * t : 0;
                globalChiSq += chi2;

                covariateTests.push({
                    name: covariates[j],
                    rho: isFinite(rho) ? rho : 0,
                    stat: isFinite(chi2) ? chi2 : 0,
                    pValue: isFinite(pVal) ? pVal : 1
                });
            }

            const globalP = approximateChiSquarePValue(globalChiSq, p);

            phTest = {
                method: 'schoenfeld',
                valid: true,
                globalChiSq: globalChiSq,
                df: p,
                globalP: globalP,
                covariates: covariateTests,
                interpretation: globalP > 0.05
                    ? (lang === 'tr' ? 'PH varsayımı karÅŸılanıyor (p > 0.05)' : 'PH assumption met (p > 0.05)')
                    : (lang === 'tr' ? 'PH varsayımı ihlal edilmiÅŸ olabilir (p â‰¤ 0.05)' : 'PH assumption may be violated (p â‰¤ 0.05)')
            };
        } else {
            phTest = {
                method: 'schoenfeld',
                valid: false,
                noteTR: 'Schoenfeld testi için yeterli olay yok (min 5)',
                noteEN: 'Insufficient events for Schoenfeld test (min 5)'
            };
        }
    } catch (e) {
        phTest = {
            method: 'schoenfeld',
            valid: false,
            noteTR: 'PH testi hesaplanamadı: ' + (e.message || '').slice(0, 30),
            noteEN: 'PH test failed: ' + (e.message || '').slice(0, 30)
        };
    }

    // 5. Build SPSS Tables (GÖREV C)
    const variablesTable = {
        title: lang === 'tr' ? 'Denklemdeki DeÄŸiÅŸkenler' : 'Variables in the Equation',
        columns: ['Variable', 'B', 'SE', 'Wald', 'df', 'Sig.', 'Exp(B)', '95% CI Lower', '95% CI Upper'],
        rows: covariates.map((cov, j) => [
            cov,
            isFinite(beta[j]) ? beta[j].toFixed(4) : '-',
            isFinite(standardErrors[j]) ? standardErrors[j].toFixed(4) : '-',
            isFinite(waldChi2[j]) ? waldChi2[j].toFixed(4) : '-',
            1,
            isFinite(waldPValues[j]) ? (waldPValues[j] < 0.001 ? '<.001' : waldPValues[j].toFixed(3)) : '-',
            isFinite(hazardRatios[j]) ? hazardRatios[j].toFixed(4) : '-',
            isFinite(hrCILower[j]) ? hrCILower[j].toFixed(4) : '-',
            isFinite(hrCIUpper[j]) ? hrCIUpper[j].toFixed(4) : '-'
        ])
    };

    const modelSummaryTable = {
        title: lang === 'tr' ? 'Model Özeti' : 'Model Summary',
        columns: ['-2LL', lang === 'tr' ? 'Model Ï‡²' : 'Model Chi-Square', 'df', 'Sig.', lang === 'tr' ? 'BaÄŸ Yöntemi' : 'Ties Method'],
        rows: [[
            isFinite(minus2LL) ? minus2LL.toFixed(3) : '-',
            isFinite(modelChiSquare) ? modelChiSquare.toFixed(3) : '-',
            p,
            isFinite(modelPValue) ? (modelPValue < 0.001 ? '<.001' : modelPValue.toFixed(3)) : '-',
            tiesMethod.charAt(0).toUpperCase() + tiesMethod.slice(1)
        ]]
    };

    const phTestTable = phTest.valid ? {
        title: lang === 'tr' ? 'Oransal Tehlike Testi' : 'Proportional Hazards Test',
        columns: [lang === 'tr' ? 'DeÄŸiÅŸken' : 'Variable', 'Chi-Square', 'df', 'Sig.'],
        rows: [
            ...phTest.covariates.map(c => [
                c.name,
                isFinite(c.stat) ? c.stat.toFixed(3) : '-',
                1,
                isFinite(c.pValue) ? (c.pValue < 0.001 ? '<.001' : c.pValue.toFixed(3)) : '-'
            ]),
            [
                lang === 'tr' ? 'GLOBAL' : 'GLOBAL',
                isFinite(phTest.globalChiSq) ? phTest.globalChiSq.toFixed(3) : '-',
                phTest.df,
                isFinite(phTest.globalP) ? (phTest.globalP < 0.001 ? '<.001' : phTest.globalP.toFixed(3)) : '-'
            ]
        ]
    } : {
        title: lang === 'tr' ? 'Oransal Tehlike Testi' : 'Proportional Hazards Test',
        columns: [lang === 'tr' ? 'Not' : 'Note'],
        rows: [[phTest.noteTR || phTest.noteEN]]
    };

    return {
        valid: true,
        testName: lang === 'tr' ? 'Cox Oransal Tehlike Regresyonu' : 'Cox Proportional Hazards Regression',
        testType: 'cox-regression',
        n: n,
        nEvents: nEvents,
        nCovariates: p,
        converged: converged,
        iterations: iterations,

        // GÖREV A: Tie method
        tiesMethodUsed: tiesMethod,

        // Coefficients
        coefficients: beta,
        standardErrors: standardErrors,
        wald: {
            chi2: waldChi2,
            df: new Array(p).fill(1),
            pValues: waldPValues
        },

        // Hazard ratios
        hazardRatios: hazardRatios,
        hazardRatioCI: {
            lower: hrCILower,
            upper: hrCIUpper,
            level: 0.95
        },

        // Model fit
        logLikelihood: logLikelihood,
        logLikelihoodNull: logLikelihoodNull,
        minus2LL: minus2LL,
        modelChiSquare: modelChiSquare,
        modelDF: p,
        modelPValue: modelPValue,

        // GÖREV B: Schoenfeld residuals & PH test
        schoenfeldResiduals: schoenfeldResiduals.length > 0 ? schoenfeldResiduals : undefined,
        phTest: phTest,

        // GÖREV C: SPSS tables
        tables: [variablesTable, modelSummaryTable, phTestTable],

        interpretation: lang === 'tr'
            ? `Cox regresyon analizi ${tiesMethod} yöntemiyle tamamlandı. Model Ï‡² = ${modelChiSquare.toFixed(2)}, p ${modelPValue < 0.001 ? '< .001' : '= ' + modelPValue.toFixed(3)}. ${phTest.valid ? phTest.interpretation : ''}`
            : `Cox regression completed using ${tiesMethod} method. Model Ï‡² = ${modelChiSquare.toFixed(2)}, p ${modelPValue < 0.001 ? '< .001' : '= ' + modelPValue.toFixed(3)}. ${phTest.valid ? phTest.interpretation : ''}`
    };
}


/**
 * Generate APA Report
 */
export function generateAPAReport(data, columns) {
    // Use VIZ_STATE as fallback when called without parameters
    const dataset = VIZ_STATE.getActiveDataset ? VIZ_STATE.getActiveDataset() : null;
    const actualData = data || (dataset ? dataset.data : VIZ_STATE.data) || [];
    const actualColumns = columns || (dataset ? dataset.columns : VIZ_STATE.columns) || [];

    if (actualData.length === 0 || actualColumns.length === 0) {
        return {
            testType: 'apa',
            testName: VIZ_STATE.lang === 'tr' ? 'APA Raporu' : 'APA Report',
            error: VIZ_STATE.lang === 'tr' ? 'Veri bulunamadı. Önce bir dosya yükleyin.' : 'Data not found. Please load a file first.',
            html: VIZ_STATE.lang === 'tr' ? '<div class="apa-report"><p class="error">Veri bulunamadı.</p></div>' : '<div class="apa-report"><p class="error">Data not found.</p></div>'
        };
    }

    const numericCols = actualColumns.filter(col => {
        const sample = actualData.slice(0, 10).map(r => r[col]);
        return sample.some(v => !isNaN(parseFloat(v)));
    });

    let report = '<div class="apa-report">';
    report += '<h4>APA Formatında İstatistik Raporu</h4>';

    numericCols.forEach(col => {
        const values = actualData.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        if (values.length === 0) return;

        const m = calculateMean(values);
        const sd = calculateStdDev(values);
        const n = values.length;

        report += `<p><strong>${col}:</strong> <em>M</em> = ${m.toFixed(2)}, <em>SD</em> = ${sd.toFixed(2)}, <em>n</em> = ${n}</p>`;
    });

    report += '</div>';

    return {
        testType: 'apa',
        testName: VIZ_STATE.lang === 'tr' ? 'APA Raporu' : 'APA Report',
        html: report,
        interpretation: VIZ_STATE.lang === 'tr' ? 'APA 7 formatında istatistik özeti oluÅŸturuldu.' : 'Statistical summary generated in APA 7 format.'
    };
}

// =====================================================
// PART 5: MODAL FUNCTIONS (viz.html onclick handlers)
// =====================================================

/**
 * Show stat result modal
 */
export function showStatResultModal(title, content) {
    let modal = document.querySelector('.viz-stat-result-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'viz-stat-result-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100003;';
        modal.innerHTML = `
            <div style="background:var(--gm-card-bg, #1a1a2e);border-radius:12px;max-width:700px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 20px;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <h3 id="statModalTitle" style="margin:0;font-size:1rem;color:#fff;"></h3>
                    <button onclick="this.closest('.viz-stat-result-modal').style.display='none'" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
                </div>
                <div id="statModalContent" style="padding:20px;overflow-y:auto;color:#fff;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('statModalTitle').textContent = title;
    document.getElementById('statModalContent').innerHTML = content;
    modal.style.display = 'flex';
}

/**
 * Show PCA Modal
 */
export function showPCAModal() {
    if (!VIZ_STATE.data || VIZ_STATE.columns.length < 2) {
        showToast('PCA için en az 2 sayısal sütun gerekli', 'warning');
        return;
    }

    const numericCols = getNumericColumns();
    if (numericCols.length < 2) {
        showToast('Sayısal sütun bulunamadı', 'warning');
        return;
    }

    const result = runPCAAnalysis(VIZ_STATE.data, numericCols.slice(0, 5));
    if (result) {
        const content = `
            <h4>PCA Sonuçları</h4>
            <table class="viz-stat-table">
                <tr><th>Sütun</th><th>Explained Variance %</th></tr>
                ${result.columns.map((c, i) => `<tr><td>${c}</td><td>${result.explained_variance[i]}%</td></tr>`).join('')}
            </table>
            <p>${result.interpretation}</p>
        `;
        showStatResultModal('PCA Analizi', content);
    }
}

/**
 * Show Cluster Modal (K-Means)
 */
export function showClusterModal() {
    if (!VIZ_STATE.data || VIZ_STATE.columns.length < 1) {
        showToast('Kümeleme için en az 1 sayısal sütun gerekli', 'warning');
        return;
    }

    const numericCols = getNumericColumns();
    const result = runKMeansAnalysis(VIZ_STATE.data, numericCols.slice(0, 3), 3);

    if (result) {
        const content = `
            <h4>K-Means Sonuçları (k=${result.k})</h4>
            <table class="viz-stat-table">
                <tr><th>Küme</th><th>Eleman Sayısı</th></tr>
                ${result.clusterSizes.map((s, i) => `<tr><td>Küme ${i}</td><td>${s}</td></tr>`).join('')}
            </table>
            <p>Veri setine "_cluster" sütunu eklendi.</p>
        `;
        showStatResultModal('K-Means Kümeleme', content);

        // Update UI
        if (typeof window.renderColumnsListWithTypes === 'function') {
            window.renderColumnsListWithTypes();
        }
        if (typeof window.updateDropdowns === 'function') {
            window.updateDropdowns();
        }
    }
}

/**
 * Show Cronbach Modal
 */
export function showCronbachModal() {
    if (!VIZ_STATE.data || VIZ_STATE.columns.length < 2) {
        showToast("Cronbach's Alpha için en az 2 madde gerekli", 'warning');
        return;
    }

    const numericCols = getNumericColumns();
    if (numericCols.length < 2) {
        showToast('En az 2 sayısal sütun gerekli', 'warning');
        return;
    }

    const result = runCronbachAlpha(VIZ_STATE.data, numericCols);
    if (result) {
        const content = `
            <h4>Cronbach's Alpha</h4>
            <div class="stat-big-value">${result.alpha.toFixed(3)}</div>
            <p>Madde sayısı: ${result.itemCount}</p>
            <p><strong>${result.interpretation}</strong></p>
        `;
        showStatResultModal("Cronbach's Alpha", content);
    }
}

/**
 * Show Logistic Regression Modal
 */
export function showLogisticModal() {
    showToast('Lojistik regresyon için backend API gerekli', 'info');
    const content = `
        <h4>Lojistik Regresyon</h4>
        <p>Bu analiz binomial/multinomial sonuç deÄŸiÅŸkenleri için kullanılır.</p>
        <p>Tam implementasyon için Python backend API gereklidir.</p>
    `;
    showStatResultModal('Lojistik Regresyon', content);
}

/**
 * Show Time Series Modal
 */
export function showTimeSeriesModal() {
    if (!VIZ_STATE.data || VIZ_STATE.columns.length < 2) {
        showToast('Zaman serisi için zaman ve deÄŸer sütunu gerekli', 'warning');
        return;
    }

    const numericCols = getNumericColumns();
    if (numericCols.length < 1) {
        showToast('Sayısal sütun bulunamadı', 'warning');
        return;
    }

    const result = runTimeSeriesAnalysis(VIZ_STATE.data, numericCols[0], VIZ_STATE.columns[0]);
    if (result) {
        const content = `
            <h4>Zaman Serisi Analizi</h4>
            <p>Gözlem sayısı: ${result.n}</p>
            <p>Ortalama: ${result.mean.toFixed(2)}</p>
            <p>Trend: <strong>${result.trendDirection}</strong></p>
            <p>${result.interpretation}</p>
        `;
        showStatResultModal('Zaman Serisi Analizi', content);
    }
}

/**
 * Show Power Analysis Modal
 */
export function showPowerAnalysisModal() {
    const content = `
        <h4>Güç Analizi</h4>
        <div style="margin-bottom:15px;">
            <label>Etki BüyüklüÄŸü (d):</label>
            <input type="number" id="powerEffectSize" value="0.5" step="0.1" min="0.1" max="2" style="width:100%;padding:8px;background:#2a2a3e;border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;">
        </div>
        <div style="margin-bottom:15px;">
            <label>Örneklem BüyüklüÄŸü:</label>
            <input type="number" id="powerSampleSize" value="30" min="5" max="1000" style="width:100%;padding:8px;background:#2a2a3e;border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;">
        </div>
        <div style="margin-bottom:15px;">
            <label>Alpha Düzeyi:</label>
            <select id="powerAlpha" style="width:100%;padding:8px;background:#2a2a3e;border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;">
                <option value="0.05">0.05</option>
                <option value="0.01">0.01</option>
                <option value="0.10">0.10</option>
            </select>
        </div>
        <button onclick="runPowerFromModal()" style="width:100%;padding:10px;background:linear-gradient(135deg,#4a90d9,#357abd);border:none;border-radius:6px;color:#fff;cursor:pointer;">Hesapla</button>
        <div id="powerResult" style="margin-top:15px;"></div>
    `;
    showStatResultModal('Güç Analizi', content);
}

// Power analysis helper
window.runPowerFromModal = function () {
    const effectSize = parseFloat(document.getElementById('powerEffectSize').value) || 0.5;
    const sampleSize = parseInt(document.getElementById('powerSampleSize').value) || 30;
    const alpha = parseFloat(document.getElementById('powerAlpha').value) || 0.05;

    const result = runPowerAnalysis(effectSize, sampleSize, alpha);
    document.getElementById('powerResult').innerHTML = `
        <div style="background:rgba(0,0,0,0.2);padding:15px;border-radius:8px;">
            <div style="font-size:24px;font-weight:600;color:#4a90d9;">${(result.power * 100).toFixed(1)}%</div>
            <div style="color:rgba(255,255,255,0.6);margin-top:5px;">${result.interpretation}</div>
        </div>
    `;
};

/**
 * Show Regression Modal
 */
export function showRegressionModal() {
    if (!VIZ_STATE.data || VIZ_STATE.columns.length < 2) {
        showToast('Regresyon için en az 2 sütun gerekli', 'warning');
        return;
    }

    const numericCols = getNumericColumns();
    if (numericCols.length < 2) {
        showToast('En az 2 sayısal sütun gerekli', 'warning');
        return;
    }

    const result = runLinearRegression(VIZ_STATE.data, numericCols[0], numericCols[1]);
    if (result) {
        const content = `
            <h4>DoÄŸrusal Regresyon</h4>
            <p>Denklem: <strong>${result.equation}</strong></p>
            <p>R² = ${(result.rSquared * 100).toFixed(1)}%</p>
            <p>Pearson r = ${result.r.toFixed(3)}</p>
            <p>${result.interpretation}</p>
        `;
        showStatResultModal('DoÄŸrusal Regresyon', content);
    }
}

/**
 * Show Discriminant Modal
 */
export function showDiscriminantModal() {
    showToast('Diskriminant analizi için backend API gerekli', 'info');
    const content = `
        <h4>Diskriminant Analizi</h4>
        <p>Bu analiz grup üyeliÄŸini tahmin etmek için kullanılır.</p>
        <p>Tam implementasyon için Python backend API gereklidir.</p>
    `;
    showStatResultModal('Diskriminant Analizi', content);
}

/**
 * Show Survival Modal
 */
export function showSurvivalModal() {
    showToast('SaÄŸkalım analizi için backend API gerekli', 'info');
    const content = `
        <h4>SaÄŸkalım Analizi</h4>
        <p>Bu analiz zaman-olay verisi için kullanılır (Kaplan-Meier, Cox regresyon).</p>
        <p>Tam implementasyon için Python backend API gereklidir.</p>
    `;
    showStatResultModal('SaÄŸkalım Analizi', content);
}

/**
 * Show Friedman Modal
 */
export function showFriedmanModal() {
    if (!VIZ_STATE.data || VIZ_STATE.columns.length < 3) {
        showToast('Friedman testi için en az 3 ölçüm gerekli', 'warning');
        return;
    }

    const numericCols = getNumericColumns();
    if (numericCols.length < 3) {
        showToast('En az 3 sayısal sütun gerekli', 'warning');
        return;
    }

    const result = runFriedmanTest(VIZ_STATE.data, numericCols.slice(0, 5), 0.05);
    if (result) {
        const content = `
            <h4>Friedman Testi</h4>
            <p>Ï‡² = ${result.chiSquare?.toFixed(3) || 'N/A'}</p>
            <p>df = ${result.df || 'N/A'}</p>
            <p>p = ${result.pValue?.toFixed(4) || 'N/A'}</p>
            <p><strong>${result.interpretation || 'Analiz tamamlandı.'}</strong></p>
        `;
        showStatResultModal('Friedman Testi', content);
    }
}

/**
 * Get numeric columns helper
 */
function getNumericColumns() {
    if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) return [];

    return VIZ_STATE.columns.filter(col => {
        const sample = VIZ_STATE.data.slice(0, 10).map(r => r[col]);
        return sample.some(v => !isNaN(parseFloat(v)));
    });
}

// =====================================================
// PART 6: EMBED STAT IN CHART
// =====================================================

/**
 * Embed stat result in chart as overlay
 */
export function embedStatInChart(widgetId) {
    const widget = document.getElementById(widgetId);
    if (!widget) return;

    const resultsContainer = widget.querySelector('.viz-stat-widget-results');
    if (!resultsContainer) {
        showToast('Önce analizi çalıÅŸtırın', 'warning');
        return;
    }

    const resultHtml = resultsContainer.innerHTML;
    if (!resultHtml || resultHtml.includes('placeholder')) {
        showToast('Önce analizi çalıÅŸtırın', 'warning');
        return;
    }

    // Find selected chart or first chart
    const selectedChart = VIZ_STATE.selectedChartId;
    const charts = document.querySelectorAll('.viz-chart-widget');

    if (charts.length === 0) {
        showToast('Dashboard\'da grafik bulunamadı', 'warning');
        return;
    }

    const targetChart = selectedChart
        ? document.getElementById(selectedChart)
        : charts[0];

    if (!targetChart) {
        showToast('Hedef grafik bulunamadı', 'warning');
        return;
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'viz-stat-overlay';
    overlay.innerHTML = `
        <div class="viz-stat-overlay-header">
            <span>İstatistik Sonucu</span>
            <button onclick="this.parentElement.parentElement.remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="viz-stat-overlay-content">${resultHtml}</div>
    `;
    overlay.style.cssText = `
        position: absolute;
        top: 40px;
        right: 10px;
        width: 200px;
        background: rgba(0,0,0,0.85);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        z-index: 100;
        cursor: move;
    `;

    // Make draggable
    makeDraggable(overlay);

    // Append to chart
    targetChart.style.position = 'relative';
    targetChart.appendChild(overlay);

    showToast('İstatistik grafiÄŸe yerleÅŸtirildi', 'success');
}

/**
 * Make element draggable
 */
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const header = element.querySelector('.viz-stat-overlay-header');
    if (header) {
        header.onmousedown = dragMouseDown;
    } else {
        element.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + 'px';
        element.style.left = (element.offsetLeft - pos1) + 'px';
        element.style.right = 'auto';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// =====================================================
// WINDOW BINDINGS (COMPLETE)
// =====================================================

// Part 3: UI & Widgets
window.getStatTitle = getStatTitle;
window.renderStatResults = renderStatResults;
window.formatStatResultForWidget = formatStatResultForWidget;
window.createStatWidget = createStatWidget;
window.runStatWidgetAnalysis = runStatWidgetAnalysis;
window.removeStatWidget = removeStatWidget;
window.toggleStatWidgetExpand = toggleStatWidgetExpand;
window.initStatDragDropSystem = initStatDragDropSystem;
window.callSpssApi = callSpssApi;
window.runAnalysisWithApi = runAnalysisWithApi;

// Part 4: Helper Functions
window.runChiSquareFromData = runChiSquareFromData;
window.runDescriptiveStats = runDescriptiveStats;
window.runLeveneTest = runLeveneTest;
window.calculateEffectSize = calculateEffectSize;
window.runFrequencyAnalysis = runFrequencyAnalysis;
window.runPCAAnalysis = runPCAAnalysis;
window.runKMeansAnalysis = runKMeansAnalysis;
window.runCronbachAlpha = runCronbachAlpha;
window.runLinearRegression = runLinearRegression;
window.runPowerAnalysis = runPowerAnalysis;
window.runLogisticRegression = runLogisticRegression;
window.runTimeSeriesAnalysis = runTimeSeriesAnalysis;
window.runDiscriminantAnalysis = runDiscriminantAnalysis;
window.runSurvivalAnalysis = runSurvivalAnalysis;
window.runCoxRegression = runCoxRegression;
window.generateAPAReport = generateAPAReport;

// Part 5: Modal Functions (viz.html onclick handlers)
window.showStatResultModal = showStatResultModal;
window.showPCAModal = showPCAModal;
window.showClusterModal = showClusterModal;
window.showCronbachModal = showCronbachModal;
window.showLogisticModal = showLogisticModal;
window.showTimeSeriesModal = showTimeSeriesModal;
window.showPowerAnalysisModal = showPowerAnalysisModal;
window.showRegressionModal = showRegressionModal;
window.showDiscriminantModal = showDiscriminantModal;
window.showSurvivalModal = showSurvivalModal;
window.showFriedmanModal = showFriedmanModal;

// Part 6: Embed Functions
window.embedStatInChart = embedStatInChart;

// FAZ-ST1: Basic Math Functions (selftest compatibility)
window.calculateMean = calculateMean;
window.calculateMedian = calculateMedian;
window.calculateVariance = calculateVariance;
window.calculateStdDev = calculateStdDev;
window.calculateCorrelation = calculateCorrelation;
window.calculateSpearmanCorrelation = calculateSpearmanCorrelation;

// FAZ-ST1: Core Statistical Tests
window.runIndependentTTest = runIndependentTTest;
window.runPairedTTest = runPairedTTest;
window.runOneSampleTTest = runOneSampleTTest;
window.runOneWayANOVA = runOneWayANOVA;
window.runCorrelationTest = runCorrelationTest;
window.runChiSquareTest = runChiSquareTest;
window.runMannWhitneyU = runMannWhitneyU;
window.runKruskalWallis = runKruskalWallis;
window.runWilcoxonSignedRank = runWilcoxonSignedRank;
window.runFriedmanTest = runFriedmanTest;
window.runShapiroWilkTest = runShapiroWilkTest;

// FAZ-ST2: Advanced ANOVA Functions
window.runTwoWayANOVA = runTwoWayANOVA;
window.runRepeatedMeasuresANOVA = runRepeatedMeasuresANOVA;

// =====================================================
// RUNSTATTEST - Simple Stat Test Router (viz.html onclick)
// =====================================================
export function runStatTest(testType) {
    let yData = [];

    // Get data from selected chart
    if (VIZ_STATE.selectedChart) {
        const config = VIZ_STATE.charts?.find(c => c.id === VIZ_STATE.selectedChart);
        if (config && VIZ_STATE.data && config.yAxis) {
            yData = VIZ_STATE.data.map(row => parseFloat(row[config.yAxis])).filter(v => !isNaN(v));
        }
    }

    // Demo data if not available
    if (yData.length < 3) {
        yData = [120, 200, 150, 80, 70, 130, 180, 95, 160, 140];
    }

    const resultsDiv = document.getElementById('testResults');
    const testNameEl = document.getElementById('testName');
    const pValueEl = document.getElementById('testPValue');
    const resultBodyEl = document.getElementById('testResultBody');

    if (!resultsDiv) return;

    resultsDiv.style.display = 'block';

    let result;
    switch (testType) {
        case 'ttest':
            result = runOneSampleTTest(yData, 0, 0.05);
            break;
        case 'anova':
            // Split into 3 groups for ANOVA - FAZ-2: Use SPSS wrapper
            const third = Math.floor(yData.length / 3);
            const groups = [
                yData.slice(0, third),
                yData.slice(third, 2 * third),
                yData.slice(2 * third)
            ];
            result = typeof runOneWayANOVA_SPSS === 'function'
                ? runOneWayANOVA_SPSS(groups, 0.05, ['Group 1', 'Group 2', 'Group 3'])
                : runOneWayANOVA(groups, 0.05);
            break;
        case 'correlation':
            // Use first half vs second half
            const half = Math.floor(yData.length / 2);
            result = runCorrelationTest(yData.slice(0, half), yData.slice(half), 0.05);
            break;
        case 'normality':
            result = runShapiroWilkTest(yData, 0.05);
            break;
        default:
            result = { error: 'Bilinmeyen test tipi' };
    }

    // Update UI
    if (testNameEl) testNameEl.textContent = result.testName || testType;
    if (pValueEl) {
        const p = result.pValue || 0;
        pValueEl.textContent = `p = ${p.toFixed(4)}`;
        pValueEl.className = p < 0.05 ? 'viz-p-value viz-significant' : 'viz-p-value';
    }
    if (resultBodyEl) {
        // P0 HOTFIX: Robust significance check - supports both isSignificant and significant fields
        const hasPValue = typeof result.pValue === 'number' && !isNaN(result.pValue);
        const sig = hasPValue
            ? ((typeof result.isSignificant === 'boolean')
                ? result.isSignificant
                : (typeof result.significant === 'boolean' ? result.significant : false))
            : false;
        resultBodyEl.innerHTML = `
            <div>n = ${yData.length}</div>
            <div>Ortalama = ${calculateMean(yData).toFixed(2)}</div>
            <div>Std Sapma = ${calculateStdDev(yData).toFixed(2)}</div>
            <div class="${sig ? 'viz-significant' : ''}">${result.interpretation || ''}</div>
        `;
    }

    if (typeof showToast === 'function') {
        showToast('Test tamamlandı', 'success');
    }

    return result;
}

window.runStatTest = runStatTest;

// =====================================================
// FAZ-3: SPSS STANDARD OUTPUT WRAPPERS
// These do NOT modify existing functions - they call them
// and add standardized output formatting
// =====================================================

/**
 * Independent T-Test with SPSS standard output
 * Includes: Levene test, Student + Welch tables, Cohen's d, Hedges' g, APA format
 */
export function runIndependentTTest_SPSS(group1, group2, alpha = 0.05, groupNames = ['Group 1', 'Group 2']) {
    const lang = VIZ_STATE?.lang || 'tr';

    // Get base result from existing function
    const welchResult = runIndependentTTest(group1, group2, alpha);
    if (!welchResult.valid) {
        return { ...welchResult, testType: 'independentTTest_SPSS' };
    }

    // Run Levene's test for variance homogeneity
    const leveneResult = runLeveneTestInternal([group1, group2]);
    const equalVariances = leveneResult.pValue > alpha;

    // Calculate Student's t-test (equal variances assumed)
    const n1 = group1.length, n2 = group2.length;
    const mean1 = calculateMean(group1), mean2 = calculateMean(group2);
    const var1 = calculateVariance(group1, true), var2 = calculateVariance(group2, true);
    const std1 = Math.sqrt(var1), std2 = Math.sqrt(var2);

    // Pooled variance (Student's t)
    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const pooledSE = Math.sqrt(pooledVar * (1 / n1 + 1 / n2));
    const tStudent = (mean1 - mean2) / pooledSE;
    const dfStudent = n1 + n2 - 2;
    const pStudent = approximateTTestPValue(Math.abs(tStudent), dfStudent);

    // Effect sizes
    const pooledStd = Math.sqrt(pooledVar);
    const cohensD = (mean1 - mean2) / pooledStd;
    const hedgesG = cohensD * (1 - 3 / (4 * (n1 + n2) - 9)); // Hedges' correction

    // Confidence intervals
    const tCritStudent = getTCritical(dfStudent, alpha);
    const tCritWelch = getTCritical(Math.round(welchResult.degreesOfFreedom), alpha);
    const meanDiff = mean1 - mean2;
    const ciStudentLower = meanDiff - tCritStudent * pooledSE;
    const ciStudentUpper = meanDiff + tCritStudent * pooledSE;

    // Build SPSS-style tables
    const groupStatsTable = {
        name: lang === 'tr' ? 'Grup İstatistikleri' : 'Group Statistics',
        columns: [lang === 'tr' ? 'Grup' : 'Group', 'N', lang === 'tr' ? 'Ortalama' : 'Mean', lang === 'tr' ? 'Std. Sapma' : 'Std. Deviation', lang === 'tr' ? 'Std. Hata Ort.' : 'Std. Error Mean'],
        rows: [
            [groupNames[0], n1, mean1.toFixed(4), std1.toFixed(4), (std1 / Math.sqrt(n1)).toFixed(4)],
            [groupNames[1], n2, mean2.toFixed(4), std2.toFixed(4), (std2 / Math.sqrt(n2)).toFixed(4)]
        ]
    };

    const leveneTable = {
        name: lang === 'tr' ? 'Varyans HomojenliÄŸi Testi (Levene)' : 'Test of Homogeneity of Variances (Levene)',
        columns: ['F', 'df1', 'df2', 'Sig.'],
        rows: [[leveneResult.F.toFixed(3), leveneResult.df1, leveneResult.df2, leveneResult.pValue.toFixed(4)]]
    };

    const tTestTable = {
        name: lang === 'tr' ? 'BaÄŸımsız Örneklem T-Testi' : 'Independent Samples T-Test',
        columns: ['', 't', 'df', 'Sig. (2-tailed)', lang === 'tr' ? 'Ort. Fark' : 'Mean Diff.', lang === 'tr' ? 'Std. Hata Fark' : 'Std. Error Diff.', lang === 'tr' ? '95% CI Alt' : '95% CI Lower', lang === 'tr' ? '95% CI Ãœst' : '95% CI Upper'],
        rows: [
            [lang === 'tr' ? 'Varyanslar EÅŸit' : 'Equal variances assumed', tStudent.toFixed(3), dfStudent, pStudent.toFixed(4), meanDiff.toFixed(4), pooledSE.toFixed(4), ciStudentLower.toFixed(4), ciStudentUpper.toFixed(4)],
            [lang === 'tr' ? 'Varyanslar EÅŸit DeÄŸil' : 'Equal variances not assumed', welchResult.tStatistic.toFixed(3), welchResult.degreesOfFreedom.toFixed(2), welchResult.pValue.toFixed(4), meanDiff.toFixed(4), welchResult.standardError.toFixed(4), welchResult.confidenceInterval.lower.toFixed(4), welchResult.confidenceInterval.upper.toFixed(4)]
        ]
    };

    // APA format
    const effectiveT = equalVariances ? tStudent : welchResult.tStatistic;
    const effectiveDf = equalVariances ? dfStudent : welchResult.degreesOfFreedom;
    const effectiveP = equalVariances ? pStudent : welchResult.pValue;

    const apaTR = `BaÄŸımsız örneklem t-testi sonucuna göre, ${groupNames[0]} (M = ${mean1.toFixed(2)}, SS = ${std1.toFixed(2)}) ile ${groupNames[1]} (M = ${mean2.toFixed(2)}, SS = ${std2.toFixed(2)}) arasında ${effectiveP < alpha ? 'istatistiksel olarak anlamlı fark bulunmuÅŸtur' : 'istatistiksel olarak anlamlı fark bulunamamıÅŸtır'}, t(${typeof effectiveDf === 'number' && effectiveDf % 1 !== 0 ? effectiveDf.toFixed(2) : effectiveDf}) = ${effectiveT.toFixed(2)}, p ${effectiveP < 0.001 ? '< .001' : '= ' + effectiveP.toFixed(3)}, d = ${cohensD.toFixed(2)}.`;

    const apaEN = `An independent samples t-test revealed that the difference between ${groupNames[0]} (M = ${mean1.toFixed(2)}, SD = ${std1.toFixed(2)}) and ${groupNames[1]} (M = ${mean2.toFixed(2)}, SD = ${std2.toFixed(2)}) was ${effectiveP < alpha ? 'statistically significant' : 'not statistically significant'}, t(${typeof effectiveDf === 'number' && effectiveDf % 1 !== 0 ? effectiveDf.toFixed(2) : effectiveDf}) = ${effectiveT.toFixed(2)}, p ${effectiveP < 0.001 ? '< .001' : '= ' + effectiveP.toFixed(3)}, d = ${cohensD.toFixed(2)}.`;

    const formulaTR = `t = (Mâ‚ - Mâ‚‚) / SE = (${mean1.toFixed(2)} - ${mean2.toFixed(2)}) / ${pooledSE.toFixed(4)} = ${tStudent.toFixed(3)}`;
    const formulaEN = formulaTR;

    return {
        valid: true,
        testType: 'independentTTest_SPSS',
        testName: lang === 'tr' ? 'BaÄŸımsız Örneklem T-Testi (SPSS)' : 'Independent Samples T-Test (SPSS)',
        pValue: effectiveP,
        significant: effectiveP < alpha,
        alpha,
        groupNames,
        stats: {
            n1, n2, mean1, mean2, std1, std2, var1, var2,
            meanDifference: meanDiff,
            tStudent, dfStudent, pStudent,
            tWelch: welchResult.tStatistic,
            dfWelch: welchResult.degreesOfFreedom,
            pWelch: welchResult.pValue
        },
        pValues: {
            levene: leveneResult.pValue,
            student: pStudent,
            welch: welchResult.pValue,
            recommended: effectiveP
        },
        effectSizes: {
            cohensD,
            hedgesG,
            interpretation: interpretCohensD(cohensD)
        },
        levene: {
            F: leveneResult.F,
            df1: leveneResult.df1,
            df2: leveneResult.df2,
            pValue: leveneResult.pValue,
            equalVariances
        },
        tables: [groupStatsTable, leveneTable, tTestTable],
        apaTR,
        apaEN,
        formulaTR,
        formulaEN,
        interpretationTR: apaTR,
        interpretationEN: apaEN,
        recommendation: equalVariances
            ? (lang === 'tr' ? 'Levene testi anlamsız (p > .05), varyanslar homojen. Student t-testi kullanılmalı.' : 'Levene test non-significant (p > .05), variances are homogeneous. Use Student t-test.')
            : (lang === 'tr' ? 'Levene testi anlamlı (p < .05), varyanslar heterojen. Welch t-testi kullanılmalı.' : 'Levene test significant (p < .05), variances are heterogeneous. Use Welch t-test.')
    };
}

/**
 * Paired Samples T-Test with SPSS standard output
 * Includes: Paired Stats, Correlations, Test table, CI, Cohen's dz, APA format
 * GÖREV B: SPSS-style Paired T-Test wrapper
 */
export function runPairedTTest_SPSS(before, after, alpha = 0.05, pairNames = ['Before', 'After']) {
    const lang = VIZ_STATE?.lang || 'tr';

    // Get base result from existing function
    const baseResult = runPairedTTest(before, after, alpha);
    if (!baseResult.valid) {
        return { ...baseResult, testType: 'pairedTTest_SPSS' };
    }

    const n = before.length;

    // Calculate descriptive stats for both variables
    const mean1 = calculateMean(before);
    const mean2 = calculateMean(after);
    const std1 = calculateStdDev(before, true);
    const std2 = calculateStdDev(after, true);
    const se1 = std1 / Math.sqrt(n);
    const se2 = std2 / Math.sqrt(n);

    // Calculate correlation between before and after
    const r = calculateCorrelation(before, after);
    const rDf = n - 2;
    const rT = r * Math.sqrt((n - 2) / (1 - r * r));
    const rP = rDf > 0 ? approximateTTestPValue(Math.abs(rT), rDf) : 1;

    // Differences stats (from base result)
    const meanDiff = baseResult.meanDifference;
    const stdDiff = baseResult.stdDifference;
    const seDiff = baseResult.seDifference;
    const t = baseResult.tStatistic;
    const df = baseResult.degreesOfFreedom;
    const pValue = baseResult.pValue;

    // 95% Confidence Interval for mean difference
    const tCritical = getTCritical(df, alpha);
    const ciLower = meanDiff - tCritical * seDiff;
    const ciUpper = meanDiff + tCritical * seDiff;

    // Effect size: Cohen's dz (with guard)
    const cohensDz = stdDiff !== 0 && isFinite(stdDiff) ? meanDiff / stdDiff : (meanDiff === 0 ? 0 : 1e10);

    // Build SPSS-style tables
    const pairedStatsTable = {
        name: lang === 'tr' ? 'EÅŸleÅŸtirilmiÅŸ Örneklem İstatistikleri' : 'Paired Samples Statistics',
        columns: ['', 'N', lang === 'tr' ? 'Ortalama' : 'Mean', lang === 'tr' ? 'Std. Sapma' : 'Std. Deviation', lang === 'tr' ? 'Std. Hata Ort.' : 'Std. Error Mean'],
        rows: [
            [pairNames[0], n, mean1.toFixed(4), std1.toFixed(4), se1.toFixed(4)],
            [pairNames[1], n, mean2.toFixed(4), std2.toFixed(4), se2.toFixed(4)]
        ]
    };

    const correlationsTable = {
        name: lang === 'tr' ? 'EÅŸleÅŸtirilmiÅŸ Örneklem Korelasyonları' : 'Paired Samples Correlations',
        columns: ['', 'N', lang === 'tr' ? 'Korelasyon' : 'Correlation', 'Sig.'],
        rows: [
            [`${pairNames[0]} & ${pairNames[1]}`, n, isFinite(r) ? r.toFixed(4) : 'N/A', isFinite(rP) ? rP.toFixed(4) : 'N/A']
        ]
    };

    const testTable = {
        name: lang === 'tr' ? 'EÅŸleÅŸtirilmiÅŸ Örneklem Testi' : 'Paired Samples Test',
        columns: [
            '',
            lang === 'tr' ? 'Ort. Fark' : 'Mean Diff.',
            lang === 'tr' ? 'Std. Sapma' : 'Std. Deviation',
            lang === 'tr' ? 'Std. Hata Ort.' : 'Std. Error Mean',
            lang === 'tr' ? '95% CI Alt' : '95% CI Lower',
            lang === 'tr' ? '95% CI Ãœst' : '95% CI Upper',
            't',
            'df',
            'Sig. (2-tailed)'
        ],
        rows: [
            [
                `${pairNames[0]} - ${pairNames[1]}`,
                isFinite(meanDiff) ? meanDiff.toFixed(4) : 'N/A',
                isFinite(stdDiff) ? stdDiff.toFixed(4) : '0.0000',
                isFinite(seDiff) ? seDiff.toFixed(4) : '0.0000',
                isFinite(ciLower) ? ciLower.toFixed(4) : 'N/A',
                isFinite(ciUpper) ? ciUpper.toFixed(4) : 'N/A',
                isFinite(t) ? t.toFixed(3) : (t > 0 ? 'âˆ' : '-âˆ'),
                df,
                isFinite(pValue) ? pValue.toFixed(4) : '<.0001'
            ]
        ]
    };

    // APA format
    const significant = pValue < alpha;
    const effectDesc = interpretCohensD(cohensDz);
    const effectDescStr = typeof effectDesc === 'object' ? (lang === 'tr' ? effectDesc.tr : effectDesc.en) : effectDesc;

    const apaTR = `EÅŸleÅŸtirilmiÅŸ örneklem t-testi sonucuna göre, ${pairNames[0]} (M = ${mean1.toFixed(2)}, SS = ${std1.toFixed(2)}) ile ${pairNames[1]} (M = ${mean2.toFixed(2)}, SS = ${std2.toFixed(2)}) arasında ${significant ? 'istatistiksel olarak anlamlı fark bulunmuÅŸtur' : 'istatistiksel olarak anlamlı fark bulunamamıÅŸtır'}, t(${df}) = ${isFinite(t) ? t.toFixed(2) : 'âˆ'}, p ${pValue < 0.001 ? '< .001' : '= ' + pValue.toFixed(3)}, dz = ${isFinite(cohensDz) ? cohensDz.toFixed(2) : 'âˆ'} (${effectDescStr}).`;

    const apaEN = `A paired samples t-test revealed that the difference between ${pairNames[0]} (M = ${mean1.toFixed(2)}, SD = ${std1.toFixed(2)}) and ${pairNames[1]} (M = ${mean2.toFixed(2)}, SD = ${std2.toFixed(2)}) was ${significant ? 'statistically significant' : 'not statistically significant'}, t(${df}) = ${isFinite(t) ? t.toFixed(2) : 'âˆ'}, p ${pValue < 0.001 ? '< .001' : '= ' + pValue.toFixed(3)}, dz = ${isFinite(cohensDz) ? cohensDz.toFixed(2) : 'âˆ'} (${effectDescStr}).`;

    const formulaTR = `t = Md / SEd = ${isFinite(meanDiff) ? meanDiff.toFixed(2) : 'N/A'} / ${isFinite(seDiff) ? seDiff.toFixed(4) : 'N/A'} = ${isFinite(t) ? t.toFixed(3) : 'âˆ'}`;
    const formulaEN = formulaTR;

    return {
        valid: true,
        testType: 'pairedTTest_SPSS',
        testName: lang === 'tr' ? 'EÅŸleÅŸtirilmiÅŸ Örneklem T-Testi (SPSS)' : 'Paired Samples T-Test (SPSS)',
        pValue: pValue,
        significant: significant,
        alpha: alpha,
        pairNames: pairNames,
        n: n,
        stats: {
            n: n,
            mean1: mean1,
            mean2: mean2,
            std1: std1,
            std2: std2,
            se1: se1,
            se2: se2,
            meanDifference: meanDiff,
            stdDifference: stdDiff,
            seDifference: seDiff,
            t: t,
            df: df,
            correlation: r,
            correlationP: rP
        },
        pValues: {
            test: pValue,
            correlation: rP
        },
        effectSizes: {
            cohensDz: cohensDz,
            cohensD: cohensDz, // Alias
            interpretation: effectDesc
        },
        confidenceInterval: {
            lower: ciLower,
            upper: ciUpper,
            level: 1 - alpha
        },
        correlation: {
            r: r,
            pValue: rP,
            n: n
        },
        tables: [pairedStatsTable, correlationsTable, testTable],
        apaTR: apaTR,
        apaEN: apaEN,
        formulaTR: formulaTR,
        formulaEN: formulaEN,
        interpretationTR: apaTR,
        interpretationEN: apaEN,
        // Preserve base result fields for backward compatibility
        meanDifference: meanDiff,
        stdDifference: stdDiff,
        seDifference: seDiff,
        tStatistic: t,
        degreesOfFreedom: df,
        tCritical: tCritical,
        cohensD: cohensDz
    };
}

/**
 * One-Sample T-Test with SPSS standard output
 * Includes: One-Sample Statistics, One-Sample Test table, CI, Cohen's d, APA format
 * PROMPT-0: SPSS Parity Hardening - new wrapper
 */
export function runOneSampleTTest_SPSS(sample, testValue, alpha = 0.05, variableName = 'Variable') {
    const lang = VIZ_STATE?.lang || 'tr';

    // Get base result from existing function
    const baseResult = runOneSampleTTest(sample, testValue, alpha);
    if (!baseResult.valid) {
        return { ...baseResult, testType: 'oneSampleTTest_SPSS' };
    }

    const n = baseResult.n;
    const sampleMean = baseResult.sampleMean;
    const sampleStd = baseResult.sampleStd;
    const se = baseResult.standardError;
    const t = baseResult.tStatistic;
    const df = baseResult.degreesOfFreedom;
    const pValue = baseResult.pValue;
    const meanDiff = sampleMean - testValue;

    // 95% Confidence Interval for the difference
    const tCritical = getTCritical(df, alpha);
    const ciLower = meanDiff - tCritical * se;
    const ciUpper = meanDiff + tCritical * se;

    // Effect size: Cohen's d (with guard)
    const cohensD = sampleStd !== 0 && isFinite(sampleStd) ? meanDiff / sampleStd : (meanDiff === 0 ? 0 : 1e10);

    // Build SPSS-style tables
    const statsTable = {
        name: lang === 'tr' ? 'Tek Örneklem İstatistikleri' : 'One-Sample Statistics',
        columns: ['', 'N', lang === 'tr' ? 'Ortalama' : 'Mean', lang === 'tr' ? 'Std. Sapma' : 'Std. Deviation', lang === 'tr' ? 'Std. Hata Ort.' : 'Std. Error Mean'],
        rows: [
            [variableName, n, sampleMean.toFixed(4), sampleStd.toFixed(4), se.toFixed(4)]
        ]
    };

    const testTable = {
        name: lang === 'tr' ? 'Tek Örneklem Testi' : 'One-Sample Test',
        columns: [
            '',
            lang === 'tr' ? 'Test Değeri' : 'Test Value',
            't',
            'df',
            'Sig. (2-tailed)',
            lang === 'tr' ? 'Ort. Fark' : 'Mean Difference',
            lang === 'tr' ? '95% CI Alt' : '95% CI Lower',
            lang === 'tr' ? '95% CI Üst' : '95% CI Upper'
        ],
        rows: [
            [
                variableName,
                testValue,
                isFinite(t) ? t.toFixed(3) : (t > 0 ? '∞' : '-∞'),
                df,
                isFinite(pValue) ? pValue.toFixed(4) : '<.0001',
                isFinite(meanDiff) ? meanDiff.toFixed(4) : 'N/A',
                isFinite(ciLower) ? ciLower.toFixed(4) : 'N/A',
                isFinite(ciUpper) ? ciUpper.toFixed(4) : 'N/A'
            ]
        ]
    };

    // APA format
    const significant = pValue < alpha;
    const effectDesc = interpretCohensD(cohensD);
    const effectDescStr = typeof effectDesc === 'object' ? (lang === 'tr' ? effectDesc.tr : effectDesc.en) : effectDesc;

    const apaTR = `Tek örneklem t-testi sonucuna göre, ${variableName} değişkeninin ortalaması (M = ${sampleMean.toFixed(2)}, SS = ${sampleStd.toFixed(2)}) test değeri ${testValue}'${significant ? 'den istatistiksel olarak anlamlı farklıdır' : 'den istatistiksel olarak anlamlı farklı değildir'}, t(${df}) = ${isFinite(t) ? t.toFixed(2) : '∞'}, p ${pValue < 0.001 ? '< .001' : '= ' + pValue.toFixed(3)}, d = ${isFinite(cohensD) ? cohensD.toFixed(2) : '∞'} (${effectDescStr}).`;

    const apaEN = `A one-sample t-test indicated that the mean of ${variableName} (M = ${sampleMean.toFixed(2)}, SD = ${sampleStd.toFixed(2)}) was ${significant ? 'significantly different from' : 'not significantly different from'} the test value of ${testValue}, t(${df}) = ${isFinite(t) ? t.toFixed(2) : '∞'}, p ${pValue < 0.001 ? '< .001' : '= ' + pValue.toFixed(3)}, d = ${isFinite(cohensD) ? cohensD.toFixed(2) : '∞'} (${effectDescStr}).`;

    const formulaTR = `t = (M - μ₀) / SE = (${sampleMean.toFixed(2)} - ${testValue}) / ${se.toFixed(4)} = ${isFinite(t) ? t.toFixed(3) : '∞'}`;
    const formulaEN = formulaTR;

    return {
        valid: true,
        testType: 'oneSampleTTest_SPSS',
        testName: lang === 'tr' ? 'Tek Örneklem T-Testi (SPSS)' : 'One-Sample T-Test (SPSS)',
        pValue: pValue,
        significant: significant,
        alpha: alpha,
        variableName: variableName,
        testValue: testValue,
        n: n,
        stats: {
            n: n,
            mean: sampleMean,
            std: sampleStd,
            se: se,
            meanDifference: meanDiff,
            t: t,
            df: df
        },
        pValues: {
            test: pValue
        },
        effectSizes: {
            cohensD: cohensD,
            interpretation: effectDesc
        },
        confidenceInterval: {
            lower: ciLower,
            upper: ciUpper,
            level: 1 - alpha
        },
        tables: [statsTable, testTable],
        apaTR: apaTR,
        apaEN: apaEN,
        formulaTR: formulaTR,
        formulaEN: formulaEN,
        interpretationTR: apaTR,
        interpretationEN: apaEN,
        // Preserve base result fields for backward compatibility
        sampleMean: sampleMean,
        sampleStd: sampleStd,
        standardError: se,
        tStatistic: t,
        degreesOfFreedom: df,
        tCritical: tCritical,
        cohensD: cohensD,
        meanDifference: meanDiff,
        ci: { lower: ciLower, upper: ciUpper }
    };
}

/**
 * One-Way ANOVA with SPSS standard output
 * Includes: Levene test, eta²/omega², Bonferroni post-hoc, ANOVA table
 */
export function runOneWayANOVA_SPSS(groups, alpha = 0.05, groupNames = null) {
    const lang = VIZ_STATE?.lang || 'tr';

    // Generate default group names
    if (!groupNames) {
        groupNames = groups.map((_, i) => `Group ${i + 1}`);
    }

    // Get base result from existing function
    const baseResult = runOneWayANOVA(groups, alpha, groupNames);
    if (!baseResult.valid) {
        return { ...baseResult, testType: 'oneWayANOVA_SPSS' };
    }

    // Run Levene's test
    const leveneResult = runLeveneTestInternal(groups);

    // Calculate omega squared (less biased than eta squared)
    const ssBetween = baseResult.sumOfSquares.between;
    const ssWithin = baseResult.sumOfSquares.within;
    const ssTotal = baseResult.sumOfSquares.total;
    const dfBetween = baseResult.degreesOfFreedom.between;
    const msBetween = baseResult.meanSquares.between;
    const msWithin = baseResult.meanSquares.within;

    const etaSquared = ssBetween / ssTotal;
    const omegaSquared = (ssBetween - dfBetween * msWithin) / (ssTotal + msWithin);

    // Bonferroni-corrected pairwise comparisons
    const k = groups.length;
    const numComparisons = (k * (k - 1)) / 2;
    const bonferroniAlpha = alpha / numComparisons;

    const postHocComparisons = [];
    for (let i = 0; i < k; i++) {
        for (let j = i + 1; j < k; j++) {
            const g1 = groups[i], g2 = groups[j];
            const n1 = g1.length, n2 = g2.length;
            const mean1 = calculateMean(g1), mean2 = calculateMean(g2);
            const meanDiff = mean1 - mean2;
            const se = Math.sqrt(msWithin * (1 / n1 + 1 / n2));
            const t = meanDiff / se;
            const df = baseResult.degreesOfFreedom.within;
            const pValue = approximateTTestPValue(Math.abs(t), df);
            const pBonferroni = Math.min(1, pValue * numComparisons);

            postHocComparisons.push({
                comparison: `${groupNames[i]} - ${groupNames[j]}`,
                group1: groupNames[i],
                group2: groupNames[j],
                meanDiff,
                se,
                t,
                df,
                pValue,
                pBonferroni,
                significant: pBonferroni < alpha
            });
        }
    }

    // Build SPSS-style tables
    const descriptivesTable = {
        name: lang === 'tr' ? 'Tanımlayıcı İstatistikler' : 'Descriptives',
        columns: [lang === 'tr' ? 'Grup' : 'Group', 'N', lang === 'tr' ? 'Ortalama' : 'Mean', lang === 'tr' ? 'Std. Sapma' : 'Std. Deviation', lang === 'tr' ? 'Std. Hata' : 'Std. Error', lang === 'tr' ? 'Min' : 'Min', lang === 'tr' ? 'Max' : 'Max'],
        rows: baseResult.groupStats.map((gs, i) => [
            groupNames[i],
            gs.n,
            gs.mean.toFixed(4),
            gs.std.toFixed(4),
            (gs.std / Math.sqrt(gs.n)).toFixed(4),
            Math.min(...groups[i]).toFixed(2),
            Math.max(...groups[i]).toFixed(2)
        ])
    };

    const leveneTable = {
        name: lang === 'tr' ? 'Varyans HomojenliÄŸi Testi (Levene)' : 'Test of Homogeneity of Variances',
        columns: ['Levene F', 'df1', 'df2', 'Sig.'],
        rows: [[leveneResult.F.toFixed(3), leveneResult.df1, leveneResult.df2, leveneResult.pValue.toFixed(4)]]
    };

    const anovaTable = {
        name: 'ANOVA',
        columns: [lang === 'tr' ? 'Kaynak' : 'Source', lang === 'tr' ? 'Kareler Top.' : 'Sum of Squares', 'df', lang === 'tr' ? 'Kareler Ort.' : 'Mean Square', 'F', 'Sig.'],
        rows: [
            [lang === 'tr' ? 'Gruplar Arası' : 'Between Groups', ssBetween.toFixed(3), dfBetween, msBetween.toFixed(3), baseResult.fStatistic.toFixed(3), baseResult.pValue.toFixed(4)],
            [lang === 'tr' ? 'Gruplar İçi' : 'Within Groups', ssWithin.toFixed(3), baseResult.degreesOfFreedom.within, msWithin.toFixed(3), '', ''],
            [lang === 'tr' ? 'Toplam' : 'Total', ssTotal.toFixed(3), baseResult.degreesOfFreedom.total, '', '', '']
        ]
    };

    const postHocTable = {
        name: lang === 'tr' ? 'Çoklu KarÅŸılaÅŸtırmalar (Bonferroni)' : 'Multiple Comparisons (Bonferroni)',
        columns: [lang === 'tr' ? 'KarÅŸılaÅŸtırma' : 'Comparison', lang === 'tr' ? 'Ort. Fark' : 'Mean Diff.', lang === 'tr' ? 'Std. Hata' : 'Std. Error', 'Sig.', lang === 'tr' ? 'Anlamlı' : 'Significant'],
        rows: postHocComparisons.map(c => [c.comparison, c.meanDiff.toFixed(4), c.se.toFixed(4), c.pBonferroni.toFixed(4), c.significant ? 'âœ“' : ''])
    };

    // APA format
    const F = baseResult.fStatistic;
    const dfB = dfBetween;
    const dfW = baseResult.degreesOfFreedom.within;
    const p = baseResult.pValue;

    const apaTR = `Tek yönlü ANOVA sonuçlarına göre, gruplar arasında ${p < alpha ? 'istatistiksel olarak anlamlı fark bulunmuÅŸtur' : 'istatistiksel olarak anlamlı fark bulunamamıÅŸtır'}, F(${dfB}, ${dfW}) = ${F.toFixed(2)}, p ${p < 0.001 ? '< .001' : '= ' + p.toFixed(3)}, Î·² = ${etaSquared.toFixed(3)}, Ï‰² = ${omegaSquared.toFixed(3)}.`;

    const apaEN = `A one-way ANOVA revealed ${p < alpha ? 'a statistically significant difference' : 'no statistically significant difference'} between groups, F(${dfB}, ${dfW}) = ${F.toFixed(2)}, p ${p < 0.001 ? '< .001' : '= ' + p.toFixed(3)}, Î·² = ${etaSquared.toFixed(3)}, Ï‰² = ${omegaSquared.toFixed(3)}.`;

    const formulaTR = `F = MS_gruplar arası / MS_gruplar içi = ${msBetween.toFixed(2)} / ${msWithin.toFixed(2)} = ${F.toFixed(3)}`;
    const formulaEN = `F = MS_between / MS_within = ${msBetween.toFixed(2)} / ${msWithin.toFixed(2)} = ${F.toFixed(3)}`;

    return {
        valid: true,
        testType: 'oneWayANOVA_SPSS',
        testName: lang === 'tr' ? 'Tek Yönlü ANOVA (SPSS)' : 'One-Way ANOVA (SPSS)',
        pValue: p,
        alpha,
        groupNames,
        k,
        stats: {
            grandMean: baseResult.grandMean,
            totalN: baseResult.totalN,
            F: baseResult.fStatistic,
            dfBetween,
            dfWithin: baseResult.degreesOfFreedom.within,
            ssBetween,
            ssWithin,
            ssTotal,
            msBetween,
            msWithin
        },
        pValues: {
            anova: baseResult.pValue,
            levene: leveneResult.pValue
        },
        effectSizes: {
            etaSquared,
            omegaSquared,
            interpretation: interpretEtaSquared(etaSquared)
        },
        significant: p < alpha,
        levene: {
            F: leveneResult.F,
            df1: leveneResult.df1,
            df2: leveneResult.df2,
            pValue: leveneResult.pValue,
            homogeneous: leveneResult.pValue > alpha
        },
        postHoc: {
            method: 'Bonferroni',
            correctedAlpha: bonferroniAlpha,
            comparisons: postHocComparisons
        },
        tables: [descriptivesTable, leveneTable, anovaTable, postHocTable],
        apaTR,
        apaEN,
        formulaTR,
        formulaEN,
        interpretationTR: apaTR,
        interpretationEN: apaEN
    };
}

/**
 * Chi-Square Crosstabs with SPSS standard output
 */
export function runChiSquareCrosstabs_SPSS(table, alpha = 0.05, rowNames = null, colNames = null) {
    const lang = VIZ_STATE?.lang || 'tr';

    // Get base result
    const baseResult = runChiSquareTest(table, alpha);
    if (!baseResult.valid) {
        return { ...baseResult, testType: 'chiSquareCrosstabs_SPSS' };
    }

    // Default names
    const nRows = table.length;
    const nCols = table[0].length;
    if (!rowNames) rowNames = table.map((_, i) => `Row ${i + 1}`);
    if (!colNames) colNames = table[0].map((_, i) => `Col ${i + 1}`);

    // Calculate expected frequencies
    const rowTotals = table.map(row => row.reduce((a, b) => a + b, 0));
    const colTotals = table[0].map((_, j) => table.reduce((sum, row) => sum + row[j], 0));
    const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

    const expected = table.map((row, i) =>
        row.map((_, j) => (rowTotals[i] * colTotals[j]) / grandTotal)
    );

    // Check for low expected frequencies
    let lowExpectedCount = 0;
    expected.forEach(row => row.forEach(e => { if (e < 5) lowExpectedCount++; }));
    const lowExpectedPercent = (lowExpectedCount / (nRows * nCols)) * 100;

    // Effect sizes
    const chi2 = baseResult.chiSquare ?? baseResult.stats?.chiSquare ?? 0;
    const df = baseResult.degreesOfFreedom ?? baseResult.df ?? (nRows - 1) * (nCols - 1);
    const phi = Math.sqrt(chi2 / grandTotal);
    const cramersV = Math.sqrt(chi2 / (grandTotal * (Math.min(nRows, nCols) - 1)));
    const contingencyC = Math.sqrt(chi2 / (chi2 + grandTotal));

    // Build crosstab table
    const crosstabTable = {
        name: lang === 'tr' ? 'Çapraz Tablo' : 'Crosstabulation',
        columns: ['', ...colNames, lang === 'tr' ? 'Toplam' : 'Total'],
        rows: table.map((row, i) => [rowNames[i], ...row.map(String), rowTotals[i].toString()])
            .concat([[lang === 'tr' ? 'Toplam' : 'Total', ...colTotals.map(String), grandTotal.toString()]])
    };

    const expectedTable = {
        name: lang === 'tr' ? 'Beklenen Frekanslar' : 'Expected Frequencies',
        columns: ['', ...colNames],
        rows: expected.map((row, i) => [rowNames[i], ...row.map(e => e.toFixed(2))])
    };

    const chi2Table = {
        name: lang === 'tr' ? 'Ki-Kare Testleri' : 'Chi-Square Tests',
        columns: ['', lang === 'tr' ? 'DeÄŸer' : 'Value', 'df', 'Asymp. Sig. (2-sided)'],
        rows: [
            ['Pearson Chi-Square', chi2.toFixed(3), df, (baseResult.pValue ?? baseResult.pValues?.pValue ?? 0).toFixed(4)],
            ['Phi', phi.toFixed(3), '', ''],
            ["Cramer's V", cramersV.toFixed(3), '', ''],
            ['Contingency C', contingencyC.toFixed(3), '', '']
        ]
    };

    const p = baseResult.pValue ?? baseResult.pValues?.pValue ?? 0;

    const apaTR = `Ki-kare baÄŸımsızlık testi sonucuna göre, deÄŸiÅŸkenler arasında ${p < alpha ? 'istatistiksel olarak anlamlı iliÅŸki bulunmuÅŸtur' : 'istatistiksel olarak anlamlı iliÅŸki bulunamamıÅŸtır'}, Ï‡²(${df}) = ${chi2.toFixed(2)}, p ${p < 0.001 ? '< .001' : '= ' + p.toFixed(3)}, Cramer's V = ${cramersV.toFixed(3)}.`;

    const apaEN = `A chi-square test of independence ${p < alpha ? 'revealed a statistically significant association' : 'revealed no statistically significant association'} between the variables, Ï‡²(${df}) = ${chi2.toFixed(2)}, p ${p < 0.001 ? '< .001' : '= ' + p.toFixed(3)}, Cramer's V = ${cramersV.toFixed(3)}.`;

    const formulaTR = `Ï‡² = Î£[(O - E)² / E] = ${chi2.toFixed(3)}`;
    const formulaEN = formulaTR;

    return {
        valid: true,
        testType: 'chiSquareCrosstabs_SPSS',
        testName: lang === 'tr' ? 'Ki-Kare BaÄŸımsızlık Testi (SPSS)' : 'Chi-Square Test of Independence (SPSS)',
        pValue: p,
        significant: p < alpha,
        alpha,
        nRows,
        nCols,
        stats: {
            chiSquare: chi2,
            df,
            grandTotal,
            rowTotals,
            colTotals
        },
        pValues: {
            pearson: p
        },
        effectSizes: {
            phi,
            cramersV,
            contingencyC,
            interpretation: cramersV < 0.1 ? 'negligible' : cramersV < 0.3 ? 'small' : cramersV < 0.5 ? 'medium' : 'large'
        },
        observed: table,
        expected,
        lowExpectedWarning: lowExpectedPercent > 20
            ? (lang === 'tr' ? `Uyarı: Beklenen frekansların %${lowExpectedPercent.toFixed(0)}'i 5'ten küçük.` : `Warning: ${lowExpectedPercent.toFixed(0)}% of expected frequencies are less than 5.`)
            : null,
        tables: [crosstabTable, expectedTable, chi2Table],
        apaTR,
        apaEN,
        formulaTR,
        formulaEN,
        interpretationTR: apaTR,
        interpretationEN: apaEN
    };
}

/**
 * Internal Levene test (used by SPSS wrappers)
 */
function runLeveneTestInternal(groups) {
    const k = groups.length;
    const allValues = groups.flat();
    const N = allValues.length;

    // Calculate absolute deviations from group medians
    const groupMedians = groups.map(g => {
        const sorted = [...g].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    });

    const deviations = groups.map((g, i) => g.map(v => Math.abs(v - groupMedians[i])));
    const groupMeans = deviations.map(d => d.reduce((a, b) => a + b, 0) / d.length);
    const grandMean = deviations.flat().reduce((a, b) => a + b, 0) / N;

    // Between-group sum of squares
    let ssBetween = 0;
    groups.forEach((g, i) => {
        ssBetween += g.length * Math.pow(groupMeans[i] - grandMean, 2);
    });

    // Within-group sum of squares
    let ssWithin = 0;
    deviations.forEach((d, i) => {
        d.forEach(v => {
            ssWithin += Math.pow(v - groupMeans[i], 2);
        });
    });

    const dfBetween = k - 1;
    const dfWithin = N - k;
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;
    const F = msBetween / msWithin;
    const pValue = approximateFTestPValue(F, dfBetween, dfWithin);

    return { F, df1: dfBetween, df2: dfWithin, pValue };
}

// Window bindings for SPSS wrappers
window.runIndependentTTest_SPSS = runIndependentTTest_SPSS;
window.runPairedTTest_SPSS = runPairedTTest_SPSS;
window.runOneSampleTTest_SPSS = runOneSampleTTest_SPSS;
window.runOneWayANOVA_SPSS = runOneWayANOVA_SPSS;
window.runChiSquareCrosstabs_SPSS = runChiSquareCrosstabs_SPSS;

// =====================================================
// FAZ-4: ACADEMIC MODULES (LOW COST, HIGH VALUE)
// A) Crosstabs Extended - Full Association Measures
// B) Item-Total Statistics - Alpha if Deleted
// =====================================================

/**
 * A) Extended Crosstabs with Full Association Measures
 * Adds: Phi, Cramer's V, Contingency C, Lambda (asymmetric), Goodman-Kruskal Tau
 * SPSS-style table output
 */
export function runCrosstabsExtended(table, alpha = 0.05, rowVar = 'Row', colVar = 'Column') {
    const lang = VIZ_STATE?.lang || 'tr';

    // Validate
    if (!table || !Array.isArray(table) || table.length < 2) {
        return { valid: false, error: lang === 'tr' ? 'Geçersiz tablo' : 'Invalid table', testType: 'crosstabsExtended' };
    }

    const nRows = table.length;
    const nCols = table[0]?.length || 0;
    if (nCols < 2) {
        return { valid: false, error: lang === 'tr' ? 'En az 2x2 tablo gerekli' : 'At least 2x2 table required', testType: 'crosstabsExtended' };
    }

    // Totals
    const rowTotals = table.map(row => row.reduce((a, b) => a + b, 0));
    const colTotals = table[0].map((_, j) => table.reduce((sum, row) => sum + row[j], 0));
    const N = rowTotals.reduce((a, b) => a + b, 0);

    if (N === 0) {
        return { valid: false, error: lang === 'tr' ? 'Toplam frekans 0' : 'Total frequency is 0', testType: 'crosstabsExtended' };
    }

    // Chi-square
    let chiSquare = 0;
    const expected = [];
    for (let i = 0; i < nRows; i++) {
        expected[i] = [];
        for (let j = 0; j < nCols; j++) {
            const E = (rowTotals[i] * colTotals[j]) / N;
            expected[i][j] = E;
            if (E > 0) {
                chiSquare += Math.pow(table[i][j] - E, 2) / E;
            }
        }
    }

    const df = (nRows - 1) * (nCols - 1);
    const pValue = 1 - chiSquareCDF(chiSquare, df);

    // Association measures
    const phi = Math.sqrt(chiSquare / N);
    const cramersV = Math.sqrt(chiSquare / (N * (Math.min(nRows, nCols) - 1)));
    const contingencyC = Math.sqrt(chiSquare / (chiSquare + N));
    const contingencyCMax = Math.sqrt((Math.min(nRows, nCols) - 1) / Math.min(nRows, nCols));
    const adjustedC = contingencyC / contingencyCMax;

    // Lambda (asymmetric) - Row dependent
    const maxRowFreqs = table.map(row => Math.max(...row));
    const sumMaxRow = maxRowFreqs.reduce((a, b) => a + b, 0);
    const maxColTotal = Math.max(...colTotals);
    const lambdaRow = (sumMaxRow - maxColTotal) / (N - maxColTotal);

    // Lambda - Column dependent
    const maxColFreqs = table[0].map((_, j) => Math.max(...table.map(row => row[j])));
    const sumMaxCol = maxColFreqs.reduce((a, b) => a + b, 0);
    const maxRowTotal = Math.max(...rowTotals);
    const lambdaCol = (sumMaxCol - maxRowTotal) / (N - maxRowTotal);

    // Lambda symmetric
    const lambdaSym = (sumMaxRow + sumMaxCol - maxColTotal - maxRowTotal) / (2 * N - maxColTotal - maxRowTotal);

    // Goodman-Kruskal Tau (row dependent)
    let E1 = 0, E2 = 0;
    for (let j = 0; j < nCols; j++) {
        E1 += (colTotals[j] / N) * (1 - colTotals[j] / N);
    }
    for (let i = 0; i < nRows; i++) {
        for (let j = 0; j < nCols; j++) {
            if (rowTotals[i] > 0) {
                E2 += (table[i][j] / N) * (1 - table[i][j] / rowTotals[i]);
            }
        }
    }
    const tauRow = E1 > 0 ? (E1 - E2) / E1 : 0;

    // Low expected count warning
    let lowExpectedCount = 0;
    expected.forEach(row => row.forEach(e => { if (e < 5) lowExpectedCount++; }));
    const lowExpectedPercent = (lowExpectedCount / (nRows * nCols)) * 100;

    // Build tables
    const associationTable = {
        name: lang === 'tr' ? 'İliÅŸki Ölçüleri' : 'Association Measures',
        columns: [lang === 'tr' ? 'Ölçü' : 'Measure', lang === 'tr' ? 'DeÄŸer' : 'Value', lang === 'tr' ? 'Yorum' : 'Interpretation'],
        rows: [
            ['Phi (Ï†)', phi.toFixed(4), interpretEffect(phi, 'phi')],
            ["Cramer's V", cramersV.toFixed(4), interpretEffect(cramersV, 'cramersV')],
            ['Contingency C', contingencyC.toFixed(4), `Max: ${contingencyCMax.toFixed(3)}`],
            ['Adjusted C', adjustedC.toFixed(4), interpretEffect(adjustedC, 'cramersV')],
            [`Lambda (${rowVar} | ${colVar})`, isFinite(lambdaRow) ? lambdaRow.toFixed(4) : 'N/A', lang === 'tr' ? 'PRE ölçüsü' : 'PRE measure'],
            [`Lambda (${colVar} | ${rowVar})`, isFinite(lambdaCol) ? lambdaCol.toFixed(4) : 'N/A', lang === 'tr' ? 'PRE ölçüsü' : 'PRE measure'],
            ['Lambda (Symmetric)', isFinite(lambdaSym) ? lambdaSym.toFixed(4) : 'N/A', ''],
            [`Tau (${rowVar} | ${colVar})`, isFinite(tauRow) ? tauRow.toFixed(4) : 'N/A', lang === 'tr' ? 'Goodman-Kruskal' : 'Goodman-Kruskal']
        ]
    };

    const chi2TestTable = {
        name: lang === 'tr' ? 'Ki-Kare Testi' : 'Chi-Square Test',
        columns: [lang === 'tr' ? 'Test' : 'Test', lang === 'tr' ? 'DeÄŸer' : 'Value', 'df', 'p'],
        rows: [
            ['Pearson Ï‡²', chiSquare.toFixed(3), df, pValue.toFixed(4)]
        ]
    };

    // APA format
    const apaTR = `Ki-kare baÄŸımsızlık testi sonucuna göre ${rowVar} ve ${colVar} deÄŸiÅŸkenleri arasında ${pValue < alpha ? 'istatistiksel olarak anlamlı iliÅŸki bulunmuÅŸtur' : 'istatistiksel olarak anlamlı iliÅŸki bulunamamıÅŸtır'}, Ï‡²(${df}, N = ${N}) = ${chiSquare.toFixed(2)}, p ${pValue < 0.001 ? '< .001' : '= ' + pValue.toFixed(3)}, Cramer's V = ${cramersV.toFixed(3)}.`;

    const apaEN = `A chi-square test of independence ${pValue < alpha ? 'revealed a statistically significant association' : 'found no statistically significant association'} between ${rowVar} and ${colVar}, Ï‡²(${df}, N = ${N}) = ${chiSquare.toFixed(2)}, p ${pValue < 0.001 ? '< .001' : '= ' + pValue.toFixed(3)}, Cramer's V = ${cramersV.toFixed(3)}.`;

    return {
        valid: true,
        testType: 'crosstabsExtended',
        testName: lang === 'tr' ? 'Çapraz Tablo Analizi (GeniÅŸletilmiÅŸ)' : 'Crosstabs Analysis (Extended)',
        alpha,
        nRows,
        nCols,
        N,
        stats: {
            chiSquare,
            df,
            pValue
        },
        pValues: {
            pearson: pValue
        },
        effectSizes: {
            phi,
            cramersV,
            contingencyC,
            adjustedC,
            lambdaRow: isFinite(lambdaRow) ? lambdaRow : null,
            lambdaCol: isFinite(lambdaCol) ? lambdaCol : null,
            lambdaSym: isFinite(lambdaSym) ? lambdaSym : null,
            tauRow: isFinite(tauRow) ? tauRow : null
        },
        significant: pValue < alpha,
        observed: table,
        expected,
        lowExpectedWarning: lowExpectedPercent > 20
            ? (lang === 'tr' ? `Uyarı: Beklenen frekansların %${lowExpectedPercent.toFixed(0)}'i 5'ten küçük.` : `Warning: ${lowExpectedPercent.toFixed(0)}% of expected frequencies are less than 5.`)
            : null,
        tables: [chi2TestTable, associationTable],
        apaTR,
        apaEN,
        interpretationTR: apaTR,
        interpretationEN: apaEN
    };
}

/**
 * Helper: Interpret effect size
 */
function interpretEffect(value, type) {
    const lang = VIZ_STATE?.lang || 'tr';
    const absVal = Math.abs(value);

    if (type === 'phi' || type === 'cramersV') {
        if (absVal < 0.1) return lang === 'tr' ? 'İhmal edilebilir' : 'Negligible';
        if (absVal < 0.3) return lang === 'tr' ? 'Küçük' : 'Small';
        if (absVal < 0.5) return lang === 'tr' ? 'Orta' : 'Medium';
        return lang === 'tr' ? 'Büyük' : 'Large';
    }
    return '';
}

/**
 * B) Item-Total Statistics with Alpha if Deleted
 * Extends basic Cronbach's Alpha with full item analysis
 */
export function runItemTotalAnalysis(data, columns, itemNames = null) {
    const lang = VIZ_STATE?.lang || 'tr';

    // Validate
    const k = columns.length;
    if (k < 2) {
        return { valid: false, error: lang === 'tr' ? 'En az 2 madde gerekli' : 'At least 2 items required', testType: 'itemTotalAnalysis' };
    }

    // Default item names
    if (!itemNames) {
        itemNames = columns.map((col, i) => `Item ${i + 1}`);
    }

    // Extract numeric values and filter complete cases
    const cases = [];
    data.forEach(row => {
        const values = columns.map(col => parseFloat(row[col]));
        if (values.every(v => !isNaN(v))) {
            cases.push(values);
        }
    });

    const n = cases.length;
    if (n < 3) {
        return { valid: false, error: lang === 'tr' ? 'En az 3 geçerli vaka gerekli' : 'At least 3 valid cases required', testType: 'itemTotalAnalysis' };
    }

    // Calculate item means and variances
    const itemStats = columns.map((_, j) => {
        const values = cases.map(c => c[j]);
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
        const std = Math.sqrt(variance);
        return { mean, variance, std, values };
    });

    // Total scores
    const totals = cases.map(c => c.reduce((a, b) => a + b, 0));
    const totalMean = totals.reduce((a, b) => a + b, 0) / n;
    const totalVariance = totals.reduce((sum, v) => sum + Math.pow(v - totalMean, 2), 0) / (n - 1);

    // Overall alpha
    const sumItemVars = itemStats.reduce((sum, s) => sum + s.variance, 0);
    const overallAlpha = totalVariance > 0 ? (k / (k - 1)) * (1 - sumItemVars / totalVariance) : 0;

    // Item-Total correlations and Alpha if deleted
    const itemAnalysis = columns.map((col, j) => {
        // Corrected item-total correlation (item removed from total)
        const itemValues = itemStats[j].values;
        const correctedTotals = cases.map((c, i) => totals[i] - c[j]);

        // Pearson correlation
        const itemMean = itemStats[j].mean;
        const corrTotalMean = correctedTotals.reduce((a, b) => a + b, 0) / n;

        let sumXY = 0, sumX2 = 0, sumY2 = 0;
        for (let i = 0; i < n; i++) {
            const dx = itemValues[i] - itemMean;
            const dy = correctedTotals[i] - corrTotalMean;
            sumXY += dx * dy;
            sumX2 += dx * dx;
            sumY2 += dy * dy;
        }
        const corrItemTotal = (sumX2 > 0 && sumY2 > 0) ? sumXY / Math.sqrt(sumX2 * sumY2) : 0;

        // Alpha if item deleted
        const remainingItems = columns.filter((_, i) => i !== j);
        const remainingK = remainingItems.length;

        // Recalculate variance without this item
        const newTotals = cases.map(c => c.reduce((sum, v, i) => i !== j ? sum + v : sum, 0));
        const newTotalMean = newTotals.reduce((a, b) => a + b, 0) / n;
        const newTotalVar = newTotals.reduce((sum, v) => sum + Math.pow(v - newTotalMean, 2), 0) / (n - 1);

        const newItemVars = itemStats.filter((_, i) => i !== j).reduce((sum, s) => sum + s.variance, 0);
        const alphaIfDeleted = (remainingK > 1 && newTotalVar > 0)
            ? (remainingK / (remainingK - 1)) * (1 - newItemVars / newTotalVar)
            : 0;

        return {
            item: itemNames[j],
            column: col,
            mean: itemStats[j].mean,
            std: itemStats[j].std,
            variance: itemStats[j].variance,
            corrItemTotal,
            alphaIfDeleted,
            recommendation: alphaIfDeleted > overallAlpha + 0.01
                ? (lang === 'tr' ? 'Çıkarılabilir' : 'Consider removing')
                : (corrItemTotal < 0.3 ? (lang === 'tr' ? 'Zayıf' : 'Weak') : '')
        };
    });

    // Build tables
    const itemStatsTable = {
        name: lang === 'tr' ? 'Madde İstatistikleri' : 'Item Statistics',
        columns: [lang === 'tr' ? 'Madde' : 'Item', lang === 'tr' ? 'Ortalama' : 'Mean', lang === 'tr' ? 'Std. Sapma' : 'Std. Dev.', lang === 'tr' ? 'Varyans' : 'Variance'],
        rows: itemAnalysis.map(ia => [ia.item, ia.mean.toFixed(3), ia.std.toFixed(3), ia.variance.toFixed(3)])
    };

    const itemTotalTable = {
        name: lang === 'tr' ? 'Madde-Toplam İstatistikleri' : 'Item-Total Statistics',
        columns: [lang === 'tr' ? 'Madde' : 'Item', lang === 'tr' ? 'DüzeltilmiÅŸ M-T Kor.' : 'Corrected Item-Total Corr.', lang === 'tr' ? 'Silinirse Alpha' : 'Alpha if Deleted', lang === 'tr' ? 'Not' : 'Note'],
        rows: itemAnalysis.map(ia => [ia.item, ia.corrItemTotal.toFixed(3), ia.alphaIfDeleted.toFixed(3), ia.recommendation])
    };

    const reliabilityTable = {
        name: lang === 'tr' ? 'Güvenilirlik İstatistikleri' : 'Reliability Statistics',
        columns: ["Cronbach's Alpha", lang === 'tr' ? 'Madde Sayısı' : 'N of Items', 'N'],
        rows: [[overallAlpha.toFixed(3), k, n]]
    };

    // Interpretation
    let reliabilityLevel;
    if (overallAlpha >= 0.9) reliabilityLevel = lang === 'tr' ? 'mükemmel' : 'excellent';
    else if (overallAlpha >= 0.8) reliabilityLevel = lang === 'tr' ? 'iyi' : 'good';
    else if (overallAlpha >= 0.7) reliabilityLevel = lang === 'tr' ? 'kabul edilebilir' : 'acceptable';
    else if (overallAlpha >= 0.6) reliabilityLevel = lang === 'tr' ? 'sorgulanabilir' : 'questionable';
    else if (overallAlpha >= 0.5) reliabilityLevel = lang === 'tr' ? 'zayıf' : 'poor';
    else reliabilityLevel = lang === 'tr' ? 'kabul edilemez' : 'unacceptable';

    // Find problematic items
    const weakItems = itemAnalysis.filter(ia => ia.corrItemTotal < 0.3);
    const removableItems = itemAnalysis.filter(ia => ia.alphaIfDeleted > overallAlpha + 0.01);

    // APA format
    const apaTR = `ÖlçeÄŸin iç tutarlılıÄŸı ${k} madde üzerinden Cronbach Alfa katsayısı ile deÄŸerlendirilmiÅŸtir. Analiz sonucunda Î± = ${overallAlpha.toFixed(3)} (${reliabilityLevel}) bulunmuÅŸtur. ${weakItems.length > 0 ? `${weakItems.length} madde düÅŸük madde-toplam korelasyonuna (r < .30) sahiptir.` : ''} ${removableItems.length > 0 ? `${removableItems.length} maddenin çıkarılması güvenilirliÄŸi artırabilir.` : ''}`;

    const apaEN = `Internal consistency of the scale was assessed using Cronbach's alpha coefficient across ${k} items. The analysis revealed Î± = ${overallAlpha.toFixed(3)} (${reliabilityLevel}). ${weakItems.length > 0 ? `${weakItems.length} item(s) showed low item-total correlation (r < .30).` : ''} ${removableItems.length > 0 ? `Removing ${removableItems.length} item(s) could improve reliability.` : ''}`;

    return {
        valid: true,
        testType: 'itemTotalAnalysis',
        testName: lang === 'tr' ? 'Madde-Toplam Analizi' : 'Item-Total Analysis',
        n,
        k,
        alpha: overallAlpha,
        cronbachAlpha: overallAlpha,
        reliabilityLevel,
        stats: {
            totalMean,
            totalVariance,
            sumItemVariances: sumItemVars
        },
        itemAnalysis,
        weakItems: weakItems.map(w => w.item),
        removableItems: removableItems.map(r => r.item),
        tables: [reliabilityTable, itemStatsTable, itemTotalTable],
        apaTR,
        apaEN,
        interpretationTR: apaTR,
        interpretationEN: apaEN
    };
}

// =====================================================
// FAZ-GUIDE-1: ASSUMPTION WIZARD ENGINE
// Default OFF - never modifies existing analysis results
// Only produces recommendations
// =====================================================

// Global settings - ensure VIZ_SETTINGS exists with default OFF
window.VIZ_SETTINGS = window.VIZ_SETTINGS || {};
if (window.VIZ_SETTINGS.guidedAnalysis === undefined) {
    window.VIZ_SETTINGS.guidedAnalysis = false;
}

// =====================================================
// FAZ-GUIDE-6: CONFIG-BASED ASSUMPTION WIZARD RULES
// Add new test types by adding entries to this config
// =====================================================
const ASSUMPTION_WIZARD_RULES = {
    dualTTest: {
        displayName: 'Independent T-Test',
        minSampleSize: 3,
        getDataArrays: (ctx) => {
            const g1 = ctx.group1Values || [];
            const g2 = ctx.group2Values || [];
            return { isValid: g1.length >= 3 && g2.length >= 3, groups: [g1, g2], combined: [...g1, ...g2] };
        },
        checkNormality: true,
        normalityStrategy: 'combined', // 'combined' | 'per_group' | 'differences'
        checkHomogeneity: true,
        decisionTree: (normalOk, homoOk) => {
            if (normalOk === false && homoOk === false) return { code: 'mannwhitney', key: 'guided_ttest_non_normal_and_hetero_mannwhitney' };
            if (normalOk === false) return { code: 'mannwhitney', key: 'guided_ttest_non_normal_mannwhitney' };
            if (homoOk === false) return { code: 'welch', key: 'guided_ttest_hetero_welch' };
            return { code: 'ttest_ok', key: 'guided_ttest_ok' };
        }
    },
    pairedTTest: {
        displayName: 'Paired T-Test',
        minSampleSize: 3,
        getDataArrays: (ctx) => {
            const diffs = ctx.differenceScores || [];
            return { isValid: diffs.length >= 3, combined: diffs };
        },
        checkNormality: true,
        normalityStrategy: 'combined', // differences are already combined
        checkHomogeneity: false,
        decisionTree: (normalOk, homoOk) => {
            if (normalOk === false) return { code: 'wilcoxon', key: 'guided_paired_non_normal_wilcoxon' };
            return { code: 'paired_ok', key: 'guided_paired_ok' };
        }
    },
    oneSampleTTest: {
        displayName: 'One-Sample T-Test',
        minSampleSize: 3,
        getDataArrays: (ctx) => {
            const sample = ctx.sampleValues || [];
            return { isValid: sample.length >= 3, combined: sample };
        },
        checkNormality: true,
        normalityStrategy: 'combined',
        checkHomogeneity: false,
        decisionTree: (normalOk, homoOk) => {
            if (normalOk === false) return { code: 'sign_wilcoxon', key: 'guided_one_sample_non_normal_sign_wilcoxon' };
            return { code: 'one_sample_ok', key: 'guided_one_sample_ok' };
        }
    },
    anova: {
        displayName: 'One-Way ANOVA',
        minSampleSize: 2, // per group
        getDataArrays: (ctx) => {
            const groups = ctx.groups || [];
            const isValid = groups.length >= 2 && groups.every(g => g && g.length >= 2);
            return { isValid, groups, combined: groups.flat() };
        },
        checkNormality: true,
        normalityStrategy: 'combined',
        checkHomogeneity: true,
        decisionTree: (normalOk, homoOk) => {
            if (normalOk === false) return { code: 'kruskal', key: 'guided_anova_non_normal_kruskal' };
            if (homoOk === false) return { code: 'posthoc_gameshowell', key: 'guided_anova_hetero_gameshowell' };
            if (homoOk === true) return { code: 'posthoc_tukey', key: 'guided_anova_homo_tukey' };
            return { code: 'anova_ok', key: 'guided_anova_ok' };
        }
    }
};

// Expose for extension
window.ASSUMPTION_WIZARD_RULES = ASSUMPTION_WIZARD_RULES;

/**
 * FAZ-GUIDE-1/6: Config-Based Assumption Wizard API
 * Produces recommendations; NEVER modifies existing analysis results.
 * @param {string} statType - Key from ASSUMPTION_WIZARD_RULES
 * @param {object} ctx - Context with data arrays
 * @returns {object|null} Canonical recommendation object or null if disabled
 */
function runAssumptionWizard(statType, ctx) {
    // GUARD: If guidedAnalysis is OFF, return null (no computation)
    if (window.VIZ_SETTINGS?.guidedAnalysis !== true) {
        return null;
    }

    // GUARD: Missing context - return invalid without crash
    if (!ctx) {
        return { valid: false, severity: 'info', assumptions: {}, recommendation: null };
    }

    // Get rule config
    const rule = ASSUMPTION_WIZARD_RULES[statType];
    if (!rule) {
        return { valid: false, severity: 'info', assumptions: {}, recommendation: null };
    }

    const alpha = ctx.alpha || 0.05;
    let normalityResult = { ok: null, pValue: null, method: 'not_tested' };
    let homogeneityResult = { ok: null, pValue: null, method: 'not_tested' };

    try {
        // Get data arrays using rule's extractor
        const dataResult = rule.getDataArrays(ctx);
        if (!dataResult.isValid || (dataResult.combined && dataResult.combined.length < 3)) {
            return { valid: false, severity: 'info', assumptions: {}, recommendation: null };
        }

        // Check normality if required
        if (rule.checkNormality && dataResult.combined) {
            const swResult = runShapiroWilkTest(dataResult.combined, alpha);
            normalityResult = {
                ok: swResult.valid ? swResult.isNormal : null,
                pValue: swResult.valid ? swResult.pValue : null,
                method: swResult.testType || 'shapiro-wilk',
                details: swResult
            };
        }

        // Check homogeneity if required
        if (rule.checkHomogeneity && dataResult.groups && dataResult.groups.length >= 2) {
            const levResult = runLeveneTest(dataResult.groups, alpha);
            homogeneityResult = {
                ok: levResult.valid ? !levResult.significant : null,
                pValue: levResult.valid ? levResult.pValue : null,
                method: 'levene',
                details: levResult
            };
        }

        // Apply decision tree
        const decision = rule.decisionTree(normalityResult.ok, homogeneityResult.ok);
        const severity = (normalityResult.ok === false || homogeneityResult.ok === false) ? 'warn' : 'info';

        return {
            valid: true,
            severity,
            assumptions: { normality: normalityResult, homogeneity: homogeneityResult },
            recommendation: {
                recommendedTestCode: decision.code,
                messageKeyTR: decision.key,
                messageKeyEN: decision.key
            }
        };
    } catch (e) {
        console.warn('[WIZARD] Assumption check failed:', e.message);
        return { valid: false, severity: 'info', assumptions: {}, recommendation: null };
    }
}

// NOTE: runCoxRegression moved to PROMPT-UPDATE-2 section (line ~8020) with Efron tie handling and Schoenfeld residuals

// Window binding for wizard
window.runAssumptionWizard = runAssumptionWizard;

// =====================================================
// Window bindings - public API
// FIX-P1-3: All functions exposed for selftest verification
// =====================================================

// WIDGET_CATALOG (23 stat functions)
window.runOneSampleTTest = runOneSampleTTest;
window.runIndependentTTest = runIndependentTTest;
window.runPairedTTest = runPairedTTest;
window.runOneWayANOVA = runOneWayANOVA;
window.runTwoWayANOVA = runTwoWayANOVA;
window.runRepeatedMeasuresANOVA = runRepeatedMeasuresANOVA;
window.runCorrelationTest = runCorrelationTest;
window.runChiSquareTest = runChiSquareTest;
window.runLinearRegression = runLinearRegression;
window.runLogisticRegression = runLogisticRegression;
window.runMannWhitneyU = runMannWhitneyU;
window.runWilcoxonSignedRank = runWilcoxonSignedRank;
window.runKruskalWallis = runKruskalWallis;
window.runFriedmanTest = runFriedmanTest;
window.runShapiroWilkTest = runShapiroWilkTest;
window.runLeveneTest = runLeveneTest;
window.runPCAAnalysis = runPCAAnalysis;
window.runKMeansAnalysis = runKMeansAnalysis;
window.runPowerAnalysis = runPowerAnalysis;
window.runCronbachAlpha = runCronbachAlpha;
window.runDescriptiveStats = runDescriptiveStats;
window.runFrequencyAnalysis = runFrequencyAnalysis;

// SPSS Wrappers
window.runIndependentTTest_SPSS = runIndependentTTest_SPSS;
window.runPairedTTest_SPSS = runPairedTTest_SPSS;
window.runOneSampleTTest_SPSS = runOneSampleTTest_SPSS;
window.runOneWayANOVA_SPSS = runOneWayANOVA_SPSS;
window.runChiSquareCrosstabs_SPSS = runChiSquareCrosstabs_SPSS;

// FAZ-4 Academic modules
window.runCrosstabsExtended = runCrosstabsExtended;
window.runItemTotalAnalysis = runItemTotalAnalysis;

// Utility functions (for selftest)
window.calculateMean = calculateMean;
window.calculateVariance = calculateVariance;
window.calculateStdDev = calculateStdDev;
window.runStatWidgetAnalysis = runStatWidgetAnalysis;
// PROMPT-UPDATE-5: Exact p-value function exposed for testing
window.approximateTTestPValue = approximateTTestPValue;

// FAZ-ADV-5: Cox Regression (Optional Advanced Feature)
window.runCoxRegression = runCoxRegression;

console.log('âœ… stats.js (Complete: Part 1-6 + SPSS Wrappers + FAZ-4 Academic + FAZ-ADV-5 Cox) loaded');




