/**
 * @jest-environment jsdom
 */

// Mock VIZ_STATE
global.VIZ_STATE = { lang: 'tr' };

// VIZ_TEXTS mock (simplified)
const VIZ_TEXTS = {
    tr: {
        viz_subtitle: 'Visual Studio',
        error: 'Hata',
        success: 'Başarılı',
        loading: 'Yükleniyor...',
        err_file_load: 'Dosya yüklenemedi',
        err_network_error: 'Ağ bağlantısı başarısız',
        success_file_loaded: 'Dosya başarıyla yüklendi',
        ui_chart_selected: 'Grafik seçildi - sağ panelden düzenleyebilirsiniz',
        ui_normal_view: 'Normal görünüm'
    },
    en: {
        viz_subtitle: 'Visual Studio',
        error: 'Error',
        success: 'Success',
        loading: 'Loading...',
        err_file_load: 'Failed to load file',
        err_network_error: 'Network connection failed',
        success_file_loaded: 'File loaded successfully',
        ui_chart_selected: 'Chart selected - edit from right panel',
        ui_normal_view: 'Normal view'
    }
};

// getText function
function getText(key, fallback = '') {
    const texts = VIZ_TEXTS[global.VIZ_STATE.lang] || VIZ_TEXTS.tr;
    return texts[key] || VIZ_TEXTS.tr[key] || fallback || key;
}

// Tests
describe('getText (i18n)', () => {
    beforeEach(() => {
        global.VIZ_STATE.lang = 'tr';
    });

    test('should return Turkish text when lang is tr', () => {
        expect(getText('viz_subtitle')).toBe('Visual Studio');
        expect(getText('error')).toBe('Hata');
        expect(getText('loading')).toBe('Yükleniyor...');
    });

    test('should return English text when lang is en', () => {
        global.VIZ_STATE.lang = 'en';

        expect(getText('error')).toBe('Error');
        expect(getText('loading')).toBe('Loading...');
        expect(getText('success_file_loaded')).toBe('File loaded successfully');
    });

    test('should return error messages in correct language', () => {
        expect(getText('err_file_load')).toBe('Dosya yüklenemedi');

        global.VIZ_STATE.lang = 'en';
        expect(getText('err_file_load')).toBe('Failed to load file');
    });

    test('should return UI messages in correct language', () => {
        expect(getText('ui_chart_selected')).toBe('Grafik seçildi - sağ panelden düzenleyebilirsiniz');

        global.VIZ_STATE.lang = 'en';
        expect(getText('ui_chart_selected')).toBe('Chart selected - edit from right panel');
    });

    test('should fallback to key if not found', () => {
        expect(getText('nonexistent_key')).toBe('nonexistent_key');
    });

    test('should use custom fallback if provided', () => {
        expect(getText('nonexistent_key', 'My Fallback')).toBe('My Fallback');
    });

    test('should fallback to Turkish if unknown language', () => {
        global.VIZ_STATE.lang = 'fr';
        expect(getText('error')).toBe('Hata');
    });
});
