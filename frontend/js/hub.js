/**
 * hub.js - Opradox Hub Sayfa Mantığı
 * Dark/Light tema, TR/EN dil desteği, paylaşım ve iletişim modal
 */

console.log("🏠 hub.js v1.0 yüklendi");

// =====================================================
// LOCALIZATION
// =====================================================
const HUB_TEXTS = {
    "tr": {
        "hub_subtitle": "Modülünüzü Seçin",
        "hub_welcome_title": "Opradox'a Hoş Geldiniz",
        "hub_welcome_desc": "Dosyalarınızı aşağıya sürükleyin, modülünüzü seçin ve işleme başlayın.",
        "module_excel": "Excel Studio",
        "module_excel_desc": "70+ senaryo ile Excel dosyalarınızı temizleyin, birleştirin, hesaplayın.",
        "module_viz": "Visual Studio",
        "module_viz_desc": "Canlı dashboard oluşturun, grafiklerinizi sürükle bırak ile tasarlayın.",
        "module_pdf": "PDF Tools",
        "module_pdf_desc": "PDF dosyalarını birleştirin, bölün, sıkıştırın veya dönüştürün.",
        "module_ocr": "OCR Lab",
        "module_ocr_desc": "Görsellerden ve taranmış belgelerden metin çıkarın.",
        "docker_title": "Dosya Docker",
        "docker_empty": "Dosyaları buraya sürükleyin veya tıklayın",
        "docker_clear": "Temizle",
        "smart_route": "Önerilen Modül:",
        "files": "dosya",
        "recommend_site": "Siteyi Tavsiye Et",
        "contact": "Bize Ulaşın",
        "footer_about": "Hakkımızda",
        "footer_privacy": "Gizlilik",
        "footer_contact": "İletişim",
        "footer_rights": "Tüm hakları saklıdır.",
        "modal_about_title": "Hakkımızda",
        "modal_about_desc": "Opradox, veri işleme süreçlerinizi hızlandıran güçlü bir araç setidir.",
        "modal_contact_title": "İletişim",
        "modal_privacy_title": "Gizlilik",
        "lbl_name": "Ad Soyad",
        "lbl_email": "E-posta",
        "lbl_msg": "Mesajınız",
        "send_btn": "Gönder"
    },
    "en": {
        "hub_subtitle": "Select Your Module",
        "hub_welcome_title": "Welcome to Opradox",
        "hub_welcome_desc": "Drag your files below, select your module, and start processing.",
        "module_excel": "Excel Studio",
        "module_excel_desc": "Clean, merge, and calculate your Excel files with 70+ scenarios.",
        "module_viz": "Visual Studio",
        "module_viz_desc": "Create live dashboards, design your charts with drag and drop.",
        "module_pdf": "PDF Tools",
        "module_pdf_desc": "Merge, split, compress, or convert PDF files.",
        "module_ocr": "OCR Lab",
        "module_ocr_desc": "Extract text from images and scanned documents.",
        "docker_title": "File Docker",
        "docker_empty": "Drag files here or click to upload",
        "docker_clear": "Clear",
        "smart_route": "Suggested Module:",
        "files": "files",
        "recommend_site": "Recommend Site",
        "contact": "Contact Us",
        "footer_about": "About",
        "footer_privacy": "Privacy",
        "footer_contact": "Contact",
        "footer_rights": "All rights reserved.",
        "modal_about_title": "About Us",
        "modal_about_desc": "Opradox is a powerful toolkit that accelerates your data processing workflows.",
        "modal_contact_title": "Contact",
        "modal_privacy_title": "Privacy",
        "lbl_name": "Full Name",
        "lbl_email": "Email",
        "lbl_msg": "Your Message",
        "send_btn": "Send"
    }
};

let CURRENT_LANG = localStorage.getItem('opradox_lang') || 'tr';

function setLanguage(lang) {
    CURRENT_LANG = lang;
    localStorage.setItem('opradox_lang', lang);
    applyLanguage();
    updateLangLabel();
}

function toggleLanguage() {
    setLanguage(CURRENT_LANG === 'tr' ? 'en' : 'tr');
}

function applyLanguage() {
    const texts = HUB_TEXTS[CURRENT_LANG] || HUB_TEXTS['tr'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            el.textContent = texts[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (texts[key]) {
            el.placeholder = texts[key];
        }
    });
}

function updateLangLabel() {
    const label = document.getElementById('langLabel');
    if (label) {
        label.textContent = CURRENT_LANG === 'tr' ? '🇹🇷 Tr | En' : '🇬🇧 Tr | En';
    }
}

// =====================================================
// TEMA (Dark/Light)
// =====================================================
function initTheme() {
    const saved = localStorage.getItem('opradox_theme');
    const isDark = saved !== 'light';

    document.body.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('day-mode', !isDark);

    updateLogo(isDark);
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');

    document.body.classList.toggle('dark-mode', !isDark);
    document.body.classList.toggle('day-mode', isDark);

    localStorage.setItem('opradox_theme', isDark ? 'light' : 'dark');
    updateLogo(!isDark);
}

function updateLogo(isDark) {
    const logo = document.getElementById('hubLogo');
    if (logo) {
        logo.src = isDark
            ? 'img/opradox_logo_dark.png?v=5'
            : 'img/opradox_logo_light.png?v=5';
    }
}

// =====================================================
// PAYLAŞIM DROPDOWN
// =====================================================
function initShareDropdown() {
    const btn = document.getElementById('headerShareBtn');
    const dropdown = document.getElementById('headerShareDropdown');

    if (!btn || !dropdown) return;

    const shareLinks = [
        { icon: 'fab fa-whatsapp', name: 'WhatsApp', url: 'https://wa.me/?text=' },
        { icon: 'fab fa-telegram', name: 'Telegram', url: 'https://t.me/share/url?url=' },
        { icon: 'fab fa-twitter', name: 'X', url: 'https://twitter.com/intent/tweet?url=' },
        { icon: 'fab fa-linkedin-in', name: 'LinkedIn', url: 'https://www.linkedin.com/sharing/share-offsite/?url=' },
        { icon: 'fab fa-facebook-f', name: 'Facebook', url: 'https://www.facebook.com/sharer/sharer.php?u=' }
    ];

    dropdown.innerHTML = `
        <div class="share-dropdown-menu">
            ${shareLinks.map(s => `
                <a href="${s.url}${encodeURIComponent(window.location.href)}" target="_blank" class="share-item">
                    <i class="${s.icon}"></i> ${s.name}
                </a>
            `).join('')}
        </div>
    `;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });
}

// =====================================================
// İLETİŞİM MODAL
// =====================================================
function initContactModal() {
    const btn = document.getElementById('contactBtn');
    const modal = document.getElementById('contactModal');
    const closeBtn = modal?.querySelector('.gm-close-modal');
    const form = document.getElementById('contactForm');

    if (!btn || !modal) return;

    btn.addEventListener('click', () => {
        modal.classList.add('show');
    });

    closeBtn?.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('contactName')?.value,
            email: document.getElementById('contactEmail')?.value,
            message: document.getElementById('contactMessage')?.value
        };

        try {
            // Backend'e gönder (varsa)
            console.log('İletişim formu:', data);
            alert(CURRENT_LANG === 'tr' ? 'Mesajınız gönderildi!' : 'Your message was sent!');
            modal.classList.remove('show');
            form.reset();
        } catch (err) {
            console.error('Form gönderme hatası:', err);
        }
    });
}

// =====================================================
// KART HOVER ANİMASYONLARI
// =====================================================
function initCardAnimations() {
    const cards = document.querySelectorAll('.hub-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('card-hover');
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('card-hover');
        });
    });
}

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 Hub başlatılıyor...');

    // Tema
    initTheme();
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

    // Dil
    applyLanguage();
    updateLangLabel();
    document.getElementById('langToggle')?.addEventListener('click', toggleLanguage);

    // Paylaşım
    initShareDropdown();

    // İletişim Modal
    initContactModal();

    // Kart animasyonları
    initCardAnimations();

    console.log('✅ Hub hazır!');
});
