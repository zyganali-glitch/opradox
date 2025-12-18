/**
 * opradox - Optional Features System
 * PRO Builder stili dinamik opsiyon ekleme modülü
 */

// Global opsiyon veritabanı (JSON'dan yüklenecek)
window.GLOBAL_OPTIONS = {};
window.LOADED_OPTIONS = false;

/**
 * Global opsiyonları yükle
 */
window.loadGlobalOptions = async function () {
    if (window.LOADED_OPTIONS) return;

    try {
        const response = await fetch('/config/global_options.json');
        if (!response.ok) throw new Error('Global options yüklenemedi');

        window.GLOBAL_OPTIONS = await response.json();
        window.LOADED_OPTIONS = true;
        console.log('✅ Global options loaded:', Object.keys(window.GLOBAL_OPTIONS).length, 'packages');
    } catch (err) {
        console.error('❌ Global options load error:', err);
        window.GLOBAL_OPTIONS = {}; // Fallback
    }
}

/**
 * Renk fonksiyonları (PRO Builder stilinde)
 */
function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenColor(hex, percent) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const factor = (100 - percent) / 100;
    const newR = Math.max(0, Math.floor(r * factor));
    const newG = Math.max(0, Math.floor(g * factor));
    const newB = Math.max(0, Math.floor(b * factor));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Opsiyon butonlarını render et - TEK DROPDOWN BUTON (PRO Builder stili)
 */
window.renderOptionalFeatureButtons = function (availableOptionIds, containerElement) {
    if (!availableOptionIds || availableOptionIds.length === 0) return;

    const T = EXTRA_TEXTS[CURRENT_LANG];

    // Container styling - flexbox for button + warning
    containerElement.style.cssText = 'display: flex; align-items: flex-start; gap: 15px; margin: 0;';

    // TEK BUTON - PRO Builder stili (gm-pill-btn)
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gm-pill-btn'; // PRO Builder ile aynı class
    btn.innerHTML = '<i class="fas fa-plus-circle"></i> ' + (T.lbl_add_options || 'Opsiyon Ekle');
    btn.style.cssText = 'white-space: nowrap;';

    // Dropdown container - HORIZONTAL LAYOUT (YAN YANA)
    const dropdown = document.createElement('div');
    dropdown.className = 'options-dropdown';
    dropdown.style.cssText = `
        display: none;
        flex-wrap: wrap;
        gap: 8px;
        position: absolute;
        background: var(--gm-bg-primary);
        border: 1px solid var(--gm-border);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 10px;
        margin-top: 2px;
        z-index: 1000;
        min-width: 400px;
    `;

    // Available options dropdown items - AS BUTTONS
    availableOptionIds.forEach(optId => {
        const opt = window.GLOBAL_OPTIONS[optId];
        if (!opt) return;

        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'gm-pill-btn'; // PRO Builder style!
        item.dataset.option = optId;

        const label = CURRENT_LANG === 'en' ? opt.label_en : opt.label_tr;
        item.innerHTML = `${opt.icon} ${label}`;

        item.onclick = (e) => {
            e.stopPropagation();
            addOptionBlock(opt); // Pass FULL OBJECT
            dropdown.style.display = 'none';
        };

        dropdown.appendChild(item);
    });

    // Button wrapper for positioning
    const btnWrapper = document.createElement('div');
    btnWrapper.style.position = 'relative';
    btnWrapper.appendChild(btn);
    btnWrapper.appendChild(dropdown);

    // Toggle dropdown
    btn.onclick = () => {
        if (dropdown.style.display === 'none') {
            dropdown.style.display = 'flex'; // Already has flex in cssText
        } else {
            dropdown.style.display = 'none';
        }
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!btnWrapper.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    containerElement.appendChild(btnWrapper);

    // WARNING TEXT - Butonun sağında, kırmızı, arka plan yok
    const warning = document.createElement('span');
    warning.style.cssText = `
        color: #ef4444;
        font-size: 0.85rem;
        flex: 1;
    `;
    warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' +
        (T.opt_features_warning || 'Yüklediğiniz dosyada eklemek istediğiniz opsiyona ait veri yoksa işlem başarısız olur.');

    containerElement.appendChild(warning);
}

/**
 * Opsiyon bloğu ekle - ACCEPTS OPTION OBJECT
 */
function addOptionBlock(opt) {
    if (!opt || !opt.id) {
        console.error('❌ Invalid option:', opt);
        return;
    }

    const container = document.getElementById('added-options');
    if (!container) {
        console.error('❌ added-options container bulunamadı!');
        return;
    }

    // Zaten eklenmiş mi?
    const existing = container.querySelector(`[data-option="${opt.id}"]`);
    if (existing) {
        const T = EXTRA_TEXTS[CURRENT_LANG];
        alert(T.opt_already_added || 'Bu opsiyon zaten eklendi!');
        return;
    }

    // Blok oluştur
    const block = createOptionBlock(opt);
    container.appendChild(block);

    console.log(`✅ Opsiyon eklendi: ${opt.id}`);
}

/**
 * Opsiyon bloğu DOM oluştur (PRO Builder ile aynı stil)
 */
function createOptionBlock(option) {
    const T = EXTRA_TEXTS[CURRENT_LANG];

    console.log('🔧 createOptionBlock CALLED - Version 20241218-DEBUG');

    const block = document.createElement('div');
    block.className = 'option-block';
    block.dataset.option = option.id;

    // FORCE OVERRIDE with !important
    block.style.cssText = `
        margin-bottom: 10px;
        padding: 0 !important;
        background: none !important;
        border: none !important;
        box-shadow: none !important;
    `;

    console.log('✅ Block styled:', block.style.cssText);

    // Header - SADECE REMOVE BUTTON (minimal, sağ üstte)
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: flex-end;
        margin-bottom: 5px;
        background: none !important;
    `;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-option';
    removeBtn.style.cssText = 'color:#ef4444; border:none; background:none; cursor:pointer; font-size:1rem; padding:0;';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.onclick = () => removeOptionBlock(block, option);

    header.appendChild(removeBtn);
    block.appendChild(header);

    // Body - Parametreler - FORCE VERTICAL LAYOUT
    const body = document.createElement('div');
    body.className = 'option-params-body';
    body.style.cssText = 'display:flex !important; flex-direction:column !important; gap:10px; background:none !important; padding:0 !important;';

    console.log('✅ Body styled:', body.style.cssText);

    option.params.forEach(param => {
        const fieldWrapper = createParamField(param);
        body.appendChild(fieldWrapper);
    });

    block.appendChild(body);

    console.log('✅ Option block created, returning to DOM');

    return block;
}

/**
 * Parametre input alanı oluştur - ZORUNLU PARAMS STİLİYLE AYNI
 */
function createParamField(param) {
    const T = EXTRA_TEXTS[CURRENT_LANG];

    // gm-form-row class'ı ZORUNLU parametrelerle BİRE BİR AYNI
    const wrapper = document.createElement('div');
    wrapper.className = 'gm-form-row';

    // Label (class YOK, zorunlu parametreler gibi)
    const label = document.createElement('label');
    label.textContent = CURRENT_LANG === 'en' ? param.label_en : param.label_tr;
    wrapper.appendChild(label);

    // Input element
    let input;

    if (param.type === 'checkbox') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.name = param.name;
        if (param.default) input.checked = true;

    } else if (param.type === 'select') {
        input = document.createElement('select');
        input.name = param.name;

        param.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = CURRENT_LANG === 'en' ? opt.label_en : opt.label_tr;
            input.appendChild(option);
        });

    } else {
        // text, number, date
        input = document.createElement('input');
        input.type = param.type;
        input.name = param.name;

        if (param.placeholder_tr || param.placeholder_en) {
            input.placeholder = CURRENT_LANG === 'en' ? param.placeholder_en : param.placeholder_tr;
        }

        if (param.list) {
            input.setAttribute('list', param.list); // Autocomplete
        }

        if (param.default !== undefined) {
            input.value = param.default;
        }

        if (param.min !== undefined) input.min = param.min;
        if (param.max !== undefined) input.max = param.max;
    }

    wrapper.appendChild(input);

    return wrapper;
}

/**
 * Opsiyon bloğunu kaldır
 */
function removeOptionBlock(block, option) {
    block.remove();

    // Butonu tekrar aktif et (eğer allow_multiple değilse)
    if (!option.allow_multiple) {
        const btn = document.querySelector(`.add - option - btn[data - option="${option.id}"]`);
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            const description = CURRENT_LANG === 'en' ? option.description_en : option.description_tr;
            btn.title = description;
        }
    }

    // Hiç opsiyon kalmadıysa mesajı göster
    const container = document.getElementById('added-options');
    if (container && container.querySelectorAll('.option-block').length === 0) {
        const noOptionsMsg = document.getElementById('no-options-msg');
        if (noOptionsMsg) noOptionsMsg.style.display = 'block';
    }

    console.log(`🗑️ Opsiyon kaldırıldı: ${option.id} `);
}

/**
 * Form serialize - Opsiyonlar dahil backend'e gönder
 */
function serializeFormWithOptions(formElement) {
    const data = {};

    // Normal parametreler (zorunlu)
    formElement.querySelectorAll('.required-params-section input, .required-params-section select').forEach(el => {
        if (el.type === 'checkbox') {
            data[el.name] = el.checked;
        } else if (el.value) {
            data[el.name] = el.value;
        }
    });

    // Opsiyon parametreleri
    document.querySelectorAll('.option-block').forEach(block => {
        block.querySelectorAll('input, select').forEach(el => {
            if (el.type === 'checkbox') {
                if (el.checked) {
                    data[el.name] = true;
                }
            } else if (el.value) {
                data[el.name] = el.value;
            }
        });
    });

    return data;
}

/**
 * Backend validation - Desteklenmeyen opsiyonlar için warning
 */
function validateOptionSupport(scenarioId, usedOptions) {
    // Backend'den scenario meta bilgisini al
    const scenario = SCENARIO_LIST.find(s => s.id === scenarioId);
    if (!scenario) return [];

    const warnings = [];

    usedOptions.forEach(optId => {
        const opt = GLOBAL_OPTIONS[optId];
        if (!opt) return;

        // Her parametre için backend'de destek var mı kontrol et
        // (Bu basitleştirilmiş versiyon - gerçek implementasyonda backend'e sorulabilir)
        opt.params.forEach(param => {
            // Eğer backend'de bu parametre kullanılmıyorsa warning
            // Şimdilik tüm opsiyonları destekliyoruz varsayımıyla
        });
    });

    return warnings;
}

// Global scope'a export et
window.loadGlobalOptions = loadGlobalOptions;
window.renderOptionalFeatureButtons = renderOptionalFeatureButtons;
window.addOptionBlock = addOptionBlock;
window.serializeFormWithOptions = serializeFormWithOptions;
window.validateOptionSupport = validateOptionSupport;

console.log('📦 Optional Features module loaded');
