/**
 * ProColumnSelector
 * 
 * "Rapor Stüdyosu PRO" stilinde sütun seçim bileşenini (dropdown + manuel giriş)
 * standart senaryolarda kullanmak için oluşturulmuş yardımcı modüldür.
 */
const ProColumnSelector = {
    /**
     * Çoklu dil desteği için yardımcı
     */
    getText(obj) {
        if (!obj) return "";
        if (typeof obj === "string") return obj;
        const lang = typeof CURRENT_LANG !== 'undefined' ? CURRENT_LANG : 'tr';
        return obj[lang] || obj['tr'] || "";
    },

    /**
     * Standart HTML Select + Manuel Input (PRO Style) oluşturur
     * @param {string} name - Input name
     * @param {string|Array} value - Mevcut değer
     * @param {Array} columns - Sütun listesi
     * @param {Object|string} label - Etiket (tr/en object veya string)
     * @param {boolean} multiple - Çoklu seçim mi?
     * @returns {string} HTML string
     */
    render(name, value, columns, label, multiple = false) {
        // Hibrit yapı: Dropdown + Manuel giriş
        // Eğer value dropdown'da yoksa manuel girişe aktarılır
        // Çoklu seçimde (array) manuel giriş genellikle desteklenmez veya karmaşıktır, 
        // burada basitçe array olmayan ve listede olmayan değeri manuel kabul ediyoruz.

        let isManualEntry = false;
        let manualValue = '';
        let selectValue = value;

        if (!multiple) {
            // Tekli seçimde: Değer var ve listede yoksa -> Manüeldir
            if (value && columns && !columns.includes(value)) {
                isManualEntry = true;
                manualValue = value;
                selectValue = ''; // Dropdown boş seçilsin
            }
        } else {
            // Çoklu seçimde genellikle manuel giriş "diğer" olarak eklenmez, 
            // ama selectValue array değilse array'e çevirelim
            if (selectValue && !Array.isArray(selectValue)) {
                selectValue = [selectValue];
            }
        }

        // Label işleme
        const labelText = this.getText(label);
        const labelHtml = labelText ? `<label>${labelText}</label>` : '';

        // Başlangıç HTML
        let html = `
            <div class="vb-form-row pro-column-selector-wrapper" data-param-name="${name}">
                ${labelHtml}
                <select ${multiple ? `name="${name}"` : ''} id="pro_select_${name}" class="vb-select" ${multiple ? 'multiple' : ''} onchange="ProColumnSelector.onChange('${name}')">
        `;

        // Boş seçenek (Tekli seçim için)
        if (!multiple) {
            html += `<option value="">-- ${this.getText({ tr: "Seçin", en: "Select" })} --</option>`;
        }

        // Seçenekleri oluştur
        if (columns && Array.isArray(columns)) {
            columns.forEach(col => {
                let selected = '';
                if (multiple) {
                    if (Array.isArray(selectValue) && selectValue.includes(col)) selected = 'selected';
                } else {
                    if (col === selectValue) selected = 'selected';
                }
                html += `<option value="${col}" ${selected}>${col}</option>`;
            });
        }

        html += `</select>`;

        // Manuel giriş alanı (Sadece tekli seçim için aktif ediyoruz)
        if (!multiple) {
            // Manuel giriş varsa input dolu gelir, yoksa boş
            // Stil VisualBuilder.js ile aynı
            html += `
                <input type="text" 
                       name="${name}_manual" 
                       id="pro_manual_${name}"
                       value="${manualValue}" 
                       class="vb-input vb-manual-input" 
                       placeholder="${this.getText({ tr: "veya manuel yazın...", en: "or type manually..." })}"
                       style="margin-top:4px; font-size:0.8rem; background:var(--gm-card-bg); border:1px dashed var(--gm-card-border); ${manualValue ? 'display:block;' : ''}"
                       oninput="ProColumnSelector.onManualInput('${name}')"
                >
                <!-- Orijinal input'u (hidden) tutuyoruz ki form submit ederken app.js bunu okusun -->
                <input type="hidden" name="${name}" id="pro_real_${name}" value="${value || ''}">
            `;
        } else {
            // Çoklu seçimde direkt select name=param.name olur, manuel yok
        }

        html += `</div>`;
        return html;
    },

    /**
     * Select değiştiğinde çalışır
     */
    onChange(name) {
        const selectEl = document.getElementById(`pro_select_${name}`);
        const manualEl = document.getElementById(`pro_manual_${name}`);
        const realEl = document.getElementById(`pro_real_${name}`);

        if (!selectEl) return;

        // Çoklu seçimse (manuel input yok), değer zaten select üzerinde
        if (selectEl.multiple) return;

        const val = selectEl.value;

        if (val) {
            // Dropdown'dan bir şey seçildi -> Manuel'i temizle ve güncelle
            if (manualEl) manualEl.value = '';
            if (realEl) realEl.value = val;
        } else {
            // Dropdown boş seçildi -> Manuel'deki değeri geçerli kıl (varsa)
            if (manualEl && realEl) {
                realEl.value = manualEl.value;
            }
        }
    },

    /**
     * Manuel giriş yapıldığında çalışır
     */
    onManualInput(name) {
        const selectEl = document.getElementById(`pro_select_${name}`);
        const manualEl = document.getElementById(`pro_manual_${name}`);
        const realEl = document.getElementById(`pro_real_${name}`);

        if (!manualEl) return;

        const val = manualEl.value;

        if (val) {
            // Manuel bir şey yazılıyor -> Select'i boşa çek
            if (selectEl) selectEl.value = "";
            if (realEl) realEl.value = val;
        } else {
            // Manuel silindi -> Select'teki değeri (varsa) geri al
            if (selectEl && realEl) {
                realEl.value = selectEl.value;
            }
        }
    }
};

// Global erişim için window'a ata
window.ProColumnSelector = ProColumnSelector;

// Scoped CSS Injection (Fallback styles if vb-select/vb-input are not globally defined)
(function () {
    const styleId = 'pro-column-selector-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .pro-column-selector-wrapper {
                width: 100%;
                /* No margin here, handled by parent layouts usually */
            }
            /* Fallback styling for vb-select within our wrapper */
            .pro-column-selector-wrapper .vb-select {
                width: 100%;
                padding: 8px 10px;
                border: 1px solid var(--gm-card-border, #444);
                background-color: var(--gm-card-bg, #222);
                color: var(--gm-text, #eee);
                border-radius: 6px;
                font-size: 0.9rem;
                outline: none;
                transition: border-color 0.2s;
                cursor: pointer;
            }
            .pro-column-selector-wrapper .vb-select:focus {
                border-color: var(--gm-primary, #4a90d9);
            }
            /* Check if user already loaded classes (if transparent/unstyled, these rules apply) */
            /* We use var() so it adapts to themes automatically */
        `;
        document.head.appendChild(style);
    }
})();
