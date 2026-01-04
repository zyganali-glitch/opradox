/**
 * hub-modals.js - Modern Modal System for Opradox Hub
 * Features: URL hash support, ESC close, outside click, mobile responsive
 */

console.log("🔮 hub-modals.js v1.0 yüklendi");

// =====================================================
// MODAL CONTENT - TR/EN
// =====================================================
const MODAL_CONTENT = {
    about: {
        tr: `
            <div class="opx-modal-section">
                <p class="opx-modal-lead">Opradox, ofis çalışmalarında en çok zaman alan veri işleme görevlerini hızlandırmak için geliştirilmiş, pratik ve güçlü bir araç setidir.</p>
                
                <p>Bu proje; tıpkı dünya üzerindeki milyonlarca ofis çalışanı gibi tam zamanlı büro işleri yapan bir kişi tarafından, gelişen teknolojiyle birlikte yapay zekâ asistanlarının desteği alınarak tasarlanmış ve sınırlı bir bütçeyle yayına alınmıştır.</p>
                
                <p>Yola çıkarken temel motivasyonumuz şuydu: Basit bir Excel formülü ya da günlük bir ofis işlemi için; teknik dille yazılmış destek sayfaları arasında kaybolmanın, dakikalarca süren videolar içinde boğulmanın, reklamlara maruz kalmanın ve üyelik/ücret isteyen platformlarla uğraşmanın ne kadar yorucu olduğunu çok iyi biliyoruz.</p>
                
                <p>Amacımız, benzer sorunları yaşayan büro personeli meslektaşlarımızın günlük ihtiyaçlarını hızlıca çözmek; bununla birlikte veri işleme, veri analizi ve veri görselleştirme gibi daha ileri teknikleri de herkes için erişilebilir hale getirmektir. <strong>Sahadan geliyoruz; sahanın ihtiyaçlarını, gerçek iş akışlarını ve zaman kaybettiren detaylarını biliyoruz.</strong></p>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-lock"></i> Reklamsız ve Gizlilik Odaklı</h3>
                <p>Opradox reklam içermez ve kişisel veri toplamaz. Yüklediğiniz dosyalar, yalnızca seçtiğiniz işlemi gerçekleştirmek için kullanılır.</p>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-clock"></i> Kuyruklama Sistemi</h3>
                <p>Sınırlı bütçe ve sunucu maliyetleri nedeniyle yoğun zamanlarda işlemleriniz sıraya alınabilir. Sıranız geldiğinde işlem otomatik olarak başlatılır. Ayrıca, özellikle OCR gibi yüksek kaynak tüketen bazı araçlarda günlük kullanım limitleri uygulanabilir.</p>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-rocket"></i> Kurulum Gerektirmez</h3>
                <p>Opradox'u kullanmak için kurulum, uzmanlık veya eğitim gerekmez — dosyanızı yükleyin, modülünüzü seçin ve aç-başla.</p>
            </div>
            
            <div class="opx-modal-section opx-modal-modules">
                <h3><i class="fas fa-th-large"></i> Modüllerimiz</h3>
                <ul>
                    <li><strong><i class="fas fa-file-excel"></i> Excel Studio:</strong> Excel/CSV dosyalarınızı temizleme, birleştirme, dönüştürme, özetleme ve raporlama gibi onlarca senaryo ile hızlıca işleyebilirsiniz.</li>
                    <li><strong><i class="fas fa-chart-line"></i> Visual Studio:</strong> Verilerinizi sürükle-bırak mantığıyla görselleştirerek grafikler ve interaktif panolar (dashboard) üretebilir; ayrıca ileri istatistik testleri ile verinizi daha akademik ve analitik bir seviyede inceleyebilirsiniz.</li>
                    <li><strong><i class="fas fa-file-pdf"></i> PDF Tools:</strong> PDF dosyalarını birleştirebilir, bölebilir, sıkıştırabilir veya farklı formatlara dönüştürebilirsiniz.</li>
                    <li><strong><i class="fas fa-eye"></i> OCR Lab:</strong> Görsellerden veya taranmış belgelerden metin çıkarabilir, çıktıları düzenlenebilir içeriklere dönüştürebilirsiniz.</li>
                </ul>
            </div>
            
            <div class="opx-modal-section opx-modal-cta">
                <p><i class="fas fa-heart"></i> Opradox, "işinizi uzatmadan çözen" sade bir yardımcı olmak için geliştirildi. Her geri bildirim, daha iyi bir deneyim için yol haritamızı güçlendirir.</p>
            </div>
        `,
        en: `
            <div class="opx-modal-section">
                <p class="opx-modal-lead">Opradox is a practical and powerful toolkit designed to speed up the most time-consuming data tasks in everyday office work.</p>
                
                <p>This project was created by someone who works full-time in an office environment—just like millions of people around the world—and was built with the help of modern technology and AI assistants, then launched on a limited budget.</p>
                
                <p>Our core motivation is simple: we know how frustrating it can be to search for a basic Excel formula or an everyday office solution and end up lost in overly technical documentation, buried in long videos, exposed to ads, or forced to deal with websites that require subscriptions or payments.</p>
                
                <p>Our goal is to help office professionals solve daily needs quickly—while also making advanced capabilities such as data processing, data analysis, and data visualization accessible to everyone. <strong>We come from the field, and we understand real workflows, real constraints, and the small details that waste valuable time.</strong></p>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-lock"></i> Ad-Free and Privacy-Focused</h3>
                <p>Opradox contains no ads and does not collect personal data. The files you upload are used only to perform the actions you choose.</p>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-clock"></i> Queueing System</h3>
                <p>Due to budget limits and server costs, your requests may be queued during busy periods. When it's your turn, processing starts automatically. In addition, certain resource-heavy tools—especially OCR—may have daily usage limits.</p>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-rocket"></i> No Installation Required</h3>
                <p>You don't need installation, expertise, or training to use Opradox — upload your file, choose a module, and open & go.</p>
            </div>
            
            <div class="opx-modal-section opx-modal-modules">
                <h3><i class="fas fa-th-large"></i> Our Modules</h3>
                <ul>
                    <li><strong><i class="fas fa-file-excel"></i> Excel Studio:</strong> Clean, merge, transform, summarize, and generate reports for Excel/CSV files using dozens of ready-to-use scenarios.</li>
                    <li><strong><i class="fas fa-chart-line"></i> Visual Studio:</strong> Visualize your data with a drag-and-drop workflow to create charts and interactive dashboards—plus run advanced statistical tests to examine your data at a more analytical and academic level.</li>
                    <li><strong><i class="fas fa-file-pdf"></i> PDF Tools:</strong> Merge, split, compress, or convert PDF files into different formats.</li>
                    <li><strong><i class="fas fa-eye"></i> OCR Lab:</strong> Extract text from images or scanned documents and turn it into editable content.</li>
                </ul>
            </div>
            
            <div class="opx-modal-section opx-modal-cta">
                <p><i class="fas fa-heart"></i> Opradox is built to be a simple assistant that "gets the job done" without wasting your time. Every piece of feedback helps us improve the experience and shape the roadmap.</p>
            </div>
        `
    },
    privacy: {
        tr: `
            <div class="opx-modal-section opx-modal-lead-section">
                <p class="opx-modal-lead"><strong>Opradox'ta gizlilik, bir seçenek değil; tasarımın temelidir.</strong></p>
                <p>Verilerinizi takip etmeyiz, satmayız, profil çıkarmaz ve reklam amaçlı kullanmayız. Opradox'un amacı basit: <strong>dosyanızı işleyip çıktınızı üretmek.</strong></p>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-server"></i> Verileriniz nerede işleniyor?</h3>
                <p>Mümkün olan işlemlerde süreç tarayıcınızda (cihazınızda) gerçekleşir. Yani dosyanız üzerinde yapılan işlem, sizin ortamınızda çalışır.</p>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-database"></i> Sunucuda ne tutuluyor?</h3>
                <ul>
                    <li>Sunucuda dosyalarınızı kalıcı olarak saklamayız.</li>
                    <li>İşlemin gerçekleşmesi için sunucu tarafı bir adım gerekiyorsa bile, amaç yalnızca işlemi tamamlamaktır; işlem bittiğinde verileriniz depolanmaz.</li>
                    <li>Dosyalarınıza dair bir "işlem geçmişi" oluşturmayız.</li>
                </ul>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-search"></i> Hangi bilgileri topluyoruz?</h3>
                <ul>
                    <li>Kişisel veri toplamayız.</li>
                    <li>Dosya içeriklerinizi okumak/indekslemek için "arka planda" bir takip sistemi kullanmayız.</li>
                    <li>Analitik / izleme çerezleri (tracking) ile sizi web'de takip etmeyiz.</li>
                </ul>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-hourglass-half"></i> Yoğunluk ve kuyruk</h3>
                <p>Sınırlı bütçe ve sunucu kaynakları nedeniyle yoğun zamanlarda işlemler sıraya alınabilir. Bu süreç yalnızca işlemleri adil biçimde yönetmek içindir; dosyalarınızı saklama veya takip etme amacı taşımaz.</p>
            </div>
            
            <div class="opx-modal-highlight">
                <i class="fas fa-quote-left"></i>
                <p><strong>Kısacası:</strong> Dosya sizindir. Kontrol sizdedir. Opradox sadece aracı olur.</p>
            </div>
            
            <div class="opx-modal-section opx-modal-faq">
                <h3><i class="fas fa-question-circle"></i> Sık Sorulanlar</h3>
                
                <div class="opx-faq-item">
                    <h4>1) Dosyamı Opradox'a yükledim, sonra dosya kaybolur mu?</h4>
                    <p>Opradox, bilgisayarınızdaki/cihazınızdaki dosyaları silme veya değiştirme yetkisine sahip değildir. Yüklediğiniz dosya, yalnızca işlem için kullanılır. Ancak çıktı dosyası (indirilen dosya) tarayıcınız tarafından indirildiği için; indirme tamamlanmadan sayfayı kapatmanız, internet bağlantınızın kopması, tarayıcı eklentileri veya cihaz depolama sorunları nedeniyle indirme yarım kalabilir. Bu durumda işlem sonucunu yeniden oluşturarak tekrar indirebilirsiniz.</p>
                </div>
                
                <div class="opx-faq-item">
                    <h4>2) "Dosyamı aldınız mı / sakladınız mı?"</h4>
                    <p>Hayır. Dosyanızı kalıcı olarak saklamayız. İşlem bittiğinde sunucu tarafında bir depolama yapılmaz. Mümkün olan işlemler zaten tarayıcınızda gerçekleşir.</p>
                </div>
                
                <div class="opx-faq-item">
                    <h4>3) İşlem sırasında hata olursa verilerim risk altında mı?</h4>
                    <p>Hayır. Bir hata oluşursa işlem tamamlanamayabilir; bu "verinin ele geçirilmesi" anlamına gelmez. Hata sebepleri genellikle dosya formatı, dosyanın çok büyük olması, internet kopması veya tarayıcı bellek sınırları gibi teknik nedenlerdir.</p>
                </div>
                
                <div class="opx-faq-item">
                    <h4>4) Çıktı dosyam neden inmedi / bozuk indi?</h4>
                    <p>Bu çoğu zaman Opradox'tan değil, tarayıcı/cihaz koşullarından kaynaklanır: İndirme izni verilmemiş olabilir, pop-up/indirime engel eklentileri devrede olabilir, internet kopmuş olabilir, cihaz depolaması dolu olabilir, dosya çok büyük olduğu için tarayıcı bellek sınırına takılmış olabilir.</p>
                </div>
                
                <div class="opx-faq-item">
                    <h4>5) Verilerimi analiz için kullanıyor musunuz?</h4>
                    <p>Hayır. Dosya içeriklerinizi "öğrenme", "profil çıkarma" veya "geliştirme amacıyla depolama" için kullanmayız.</p>
                </div>
                
                <div class="opx-faq-item">
                    <h4>6) Hukuki not (sorumluluk ve kullanım)</h4>
                    <p>Opradox, dosyanız üzerinde yaptığınız işlemleri kolaylaştıran bir araçtır. Orijinal verilerinizin yedeğini almak ve çıktıyı kullanmadan önce kontrol etmek kullanıcının sorumluluğundadır. Opradox; internet bağlantısı, tarayıcı, cihaz performansı veya üçüncü taraf sistem kısıtları nedeniyle oluşabilecek gecikme/kesinti/indirilemeyen çıktı gibi durumlarda kesintisiz hizmet garantisi vermez.</p>
                </div>
            </div>
        `,
        en: `
            <div class="opx-modal-section opx-modal-lead-section">
                <p class="opx-modal-lead"><strong>At Opradox, privacy is not a feature—it's a design principle.</strong></p>
                <p>We don't track you, sell your data, build profiles, or use your files for advertising. Opradox has one purpose: <strong>process your file and generate your output.</strong></p>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-server"></i> Where is your data processed?</h3>
                <p>Whenever possible, processing happens in your browser (on your device).</p>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-database"></i> What is stored on the server?</h3>
                <ul>
                    <li>We do not store your files permanently on our servers.</li>
                    <li>If a server-side step is required, it is used only to complete the task—your data is not retained afterward.</li>
                    <li>We do not create a "processing history" for your files.</li>
                </ul>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-search"></i> What do we collect?</h3>
                <ul>
                    <li>We do not collect personal data.</li>
                    <li>We do not use background systems to read/index file contents for tracking.</li>
                    <li>We do not use tracking cookies to follow you across the web.</li>
                </ul>
            </div>
            
            <div class="opx-modal-section">
                <h3><i class="fas fa-hourglass-half"></i> Traffic and queueing</h3>
                <p>Due to limited budget and server capacity, requests may be queued during busy periods. This is only for fair processing management—not for storing or tracking your data.</p>
            </div>
            
            <div class="opx-modal-highlight">
                <i class="fas fa-quote-left"></i>
                <p><strong>In short:</strong> Your file is yours. You stay in control. Opradox is simply the tool.</p>
            </div>
            
            <div class="opx-modal-section opx-modal-faq">
                <h3><i class="fas fa-question-circle"></i> FAQ</h3>
                
                <div class="opx-faq-item">
                    <h4>1) I uploaded my file—can it "disappear"?</h4>
                    <p>Opradox cannot delete or modify files on your device. Your uploaded file is used only for processing. However, because the result file is downloaded through your browser, the download can fail if you close the page early, lose internet connection, have browser extensions blocking downloads, or run into device storage issues. In such cases, you can run the process again and re-download the output.</p>
                </div>
                
                <div class="opx-faq-item">
                    <h4>2) Do you keep my file / store it?</h4>
                    <p>No. We do not store your files permanently. After processing, we do not retain your data on the server. Whenever possible, processing is done locally in your browser.</p>
                </div>
                
                <div class="opx-faq-item">
                    <h4>3) If an error happens, are my files at risk?</h4>
                    <p>No. An error usually means the task could not complete. Common causes include file format issues, large files, network interruption, or browser memory limits.</p>
                </div>
                
                <div class="opx-faq-item">
                    <h4>4) Why didn't my output download / why is it corrupted?</h4>
                    <p>This is usually related to browser/device conditions: download permission blocked, ad-blockers or extensions interfering, connection dropped, device storage is full, file size hits browser memory limits.</p>
                </div>
                
                <div class="opx-faq-item">
                    <h4>5) Do you use my data for analytics or training?</h4>
                    <p>No. We do not use your file contents to profile users, build datasets, or retain files for development purposes.</p>
                </div>
                
                <div class="opx-faq-item">
                    <h4>6) Legal note (responsibility & usage)</h4>
                    <p>Opradox is a tool that helps you perform operations on your files. Keeping backups of original data and verifying outputs before use is the user's responsibility. Opradox does not guarantee uninterrupted service and cannot be held responsible for delays, interruptions, or download failures caused by internet connectivity, browser/device limitations, or third-party constraints.</p>
                </div>
            </div>
        `
    },
    contact: {
        tr: `
            <div class="opx-contact-content">
                <p class="opx-contact-tagline"><i class="fas fa-map-signs"></i> Geri bildirim = yol haritamız</p>
                
                <div class="opx-contact-buttons">
                    <a href="mailto:destek@opradox.com?subject=Opradox Geri Bildirim" class="opx-contact-btn opx-contact-btn-primary">
                        <i class="fas fa-envelope"></i>
                        <span>E-posta ile Gönder</span>
                    </a>
                </div>
                
                <p class="opx-contact-note"><i class="fas fa-user-shield"></i> Kişisel veri istemiyoruz, sadece mesaj.</p>
            </div>
        `,
        en: `
            <div class="opx-contact-content">
                <p class="opx-contact-tagline"><i class="fas fa-map-signs"></i> Feedback = our roadmap</p>
                
                <div class="opx-contact-buttons">
                    <a href="mailto:destek@opradox.com?subject=Opradox Feedback" class="opx-contact-btn opx-contact-btn-primary">
                        <i class="fas fa-envelope"></i>
                        <span>Send via Email</span>
                    </a>
                </div>
                
                <p class="opx-contact-note"><i class="fas fa-user-shield"></i> We don't ask for personal data, just your message.</p>
            </div>
        `
    }
};

// =====================================================
// MODAL SYSTEM
// =====================================================
let activeModal = null;

function openModal(modalId) {
    const modal = document.getElementById(modalId + 'Modal');
    if (!modal) return;
    
    // Inject content based on language
    const lang = typeof CURRENT_LANG !== 'undefined' ? CURRENT_LANG : 'tr';
    const bodyEl = document.getElementById(modalId + 'ModalBody');
    if (bodyEl && MODAL_CONTENT[modalId]) {
        bodyEl.innerHTML = MODAL_CONTENT[modalId][lang] || MODAL_CONTENT[modalId]['tr'];
    }
    
    // Show modal
    modal.classList.add('opx-modal-open');
    document.body.classList.add('opx-modal-active');
    activeModal = modal;
    
    // Update URL hash
    history.pushState(null, '', '#' + modalId);
    
    // Focus trap
    setTimeout(() => {
        const closeBtn = modal.querySelector('.opx-modal-close');
        if (closeBtn) closeBtn.focus();
    }, 100);
}

function closeModal() {
    if (!activeModal) return;
    
    activeModal.classList.remove('opx-modal-open');
    document.body.classList.remove('opx-modal-active');
    activeModal = null;
    
    // Clear hash
    history.pushState(null, '', window.location.pathname);
}

function closeAllModals() {
    document.querySelectorAll('.opx-modal.opx-modal-open').forEach(m => {
        m.classList.remove('opx-modal-open');
    });
    document.body.classList.remove('opx-modal-active');
    activeModal = null;
    history.pushState(null, '', window.location.pathname);
}

// =====================================================
// EVENT LISTENERS
// =====================================================
function initModals() {
    // Footer links
    document.querySelectorAll('[data-modal]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = link.getAttribute('data-modal');
            openModal(modalId);
        });
    });
    
    // Close buttons
    document.querySelectorAll('.opx-modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Overlay click
    document.querySelectorAll('.opx-modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', closeModal);
    });
    
    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModal) {
            closeModal();
        }
    });
    
    // Check hash on load
    checkHashOnLoad();
    
    // Handle browser back
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash && MODAL_CONTENT[hash]) {
            openModal(hash);
        } else {
            closeAllModals();
        }
    });
    
    console.log('✅ Modal system initialized');
}

function checkHashOnLoad() {
    const hash = window.location.hash.replace('#', '');
    if (hash && MODAL_CONTENT[hash]) {
        // Delay to ensure DOM is ready
        setTimeout(() => openModal(hash), 100);
    }
}

// =====================================================
// FOOTER LOGO THEME SYNC
// =====================================================
function updateFooterLogo() {
    const isDark = document.body.classList.contains('dark-mode');
    const darkLogo = document.querySelector('.footer-logo-dark');
    const lightLogo = document.querySelector('.footer-logo-light');
    
    if (darkLogo && lightLogo) {
        darkLogo.style.display = isDark ? 'inline' : 'none';
        lightLogo.style.display = isDark ? 'none' : 'inline';
    }
}

// Override theme toggle to include logo update
const originalToggleTheme = window.toggleTheme;
window.toggleTheme = function() {
    if (typeof originalToggleTheme === 'function') {
        originalToggleTheme();
    }
    updateFooterLogo();
};

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    initModals();
    updateFooterLogo();
    
    // Re-apply theme on content update
    const observer = new MutationObserver(() => {
        updateFooterLogo();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
});

// Expose for external use
window.openHubModal = openModal;
window.closeHubModal = closeModal;
