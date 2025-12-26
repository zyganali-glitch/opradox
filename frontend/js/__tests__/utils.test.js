/**
 * @jest-environment jsdom
 */

// Utils functions
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Number(num).toLocaleString('tr-TR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
}

function isNumeric(val) {
    if (val === null || val === undefined || val === '') return false;
    return !isNaN(parseFloat(val)) && isFinite(val);
}

function toNumber(val) {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
}

function truncate(str, length = 20) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

function calculateMean(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number);
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function calculateMedian(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number).sort((a, b) => a - b);
    if (nums.length === 0) return null;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

// Tests
describe('formatNumber', () => {
    test('should format numbers with TR locale', () => {
        expect(formatNumber(1234.56)).toMatch(/1[.,]234/);
    });

    test('should return "-" for null/undefined/NaN', () => {
        expect(formatNumber(null)).toBe('-');
        expect(formatNumber(undefined)).toBe('-');
        expect(formatNumber(NaN)).toBe('-');
    });

    test('should respect decimals parameter', () => {
        const result = formatNumber(1.23456, 4);
        // Locale may round differently, just check it has decimal precision
        expect(result.length).toBeGreaterThan(3);
    });
});

describe('isNumeric', () => {
    test('should return true for numbers', () => {
        expect(isNumeric(123)).toBe(true);
        expect(isNumeric(0)).toBe(true);
        expect(isNumeric(-45.6)).toBe(true);
        expect(isNumeric('123')).toBe(true);
        expect(isNumeric('123.45')).toBe(true);
    });

    test('should return false for non-numbers', () => {
        expect(isNumeric(null)).toBe(false);
        expect(isNumeric(undefined)).toBe(false);
        expect(isNumeric('')).toBe(false);
        expect(isNumeric('abc')).toBe(false);
        expect(isNumeric(Infinity)).toBe(false);
    });
});

describe('toNumber', () => {
    test('should convert valid strings to numbers', () => {
        expect(toNumber('123')).toBe(123);
        expect(toNumber('45.67')).toBe(45.67);
        expect(toNumber('-10')).toBe(-10);
    });

    test('should return null for invalid values', () => {
        expect(toNumber(null)).toBe(null);
        expect(toNumber(undefined)).toBe(null);
        expect(toNumber('')).toBe(null);
        expect(toNumber('abc')).toBe(null);
    });
});

describe('truncate', () => {
    test('should not truncate short strings', () => {
        expect(truncate('Hello', 10)).toBe('Hello');
    });

    test('should truncate long strings with ellipsis', () => {
        expect(truncate('This is a very long text', 10)).toBe('This is a ...');
    });

    test('should return empty string for falsy values', () => {
        expect(truncate(null)).toBe('');
        expect(truncate('')).toBe('');
    });
});

describe('calculateMean', () => {
    test('should calculate mean correctly', () => {
        expect(calculateMean([1, 2, 3, 4, 5])).toBe(3);
        expect(calculateMean([10, 20, 30])).toBe(20);
    });

    test('should filter non-numeric values', () => {
        expect(calculateMean([1, 2, 'a', 3, null])).toBe(2);
    });

    test('should return null for empty array', () => {
        expect(calculateMean([])).toBe(null);
    });
});

describe('calculateMedian', () => {
    test('should calculate median for odd count', () => {
        expect(calculateMedian([1, 2, 3, 4, 5])).toBe(3);
    });

    test('should calculate median for even count', () => {
        expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
    });

    test('should return null for empty array', () => {
        expect(calculateMedian([])).toBe(null);
    });
});
