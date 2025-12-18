// ============================================================
// opradox 2.0 – ADMIN.JS (Frontend / Backend Uyumlu Sürüm)
// Geri Bildirim Yönetimi (Listeleme / Silme / Gizleme / Yanıt)
// ============================================================

const API_ROOT = "http://localhost:8100";

let ADMIN_FEEDBACK_CACHE = [];
let SELECTED_FEEDBACK_ID = null;

// ------------------------------------------------------------
// SAYFA YÜKLENİNCE BAŞLAT
// ------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
    // Admin sayfasının Basic Auth gerektirdiğini varsayarak:
    // fetch çağrılarının authorization header'ını kendisinin ayarlamasını bekliyoruz.
    loadAdminFeedback();
    bindFilters();
    bindReplyButton();
});


// ------------------------------------------------------------
// PATCH İŞLEMİNİ TEK YERDEN YÖNETEN YARDIMCI
// ------------------------------------------------------------
async function patchFeedback(id, payload) {
    try {
        const res = await fetch(`${API_ROOT}/admin/feedback/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                // Authorization header'ının tarayıcı tarafından otomatik eklendiği varsayılır (Basic Auth)
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || `HTTP Hata kodu: ${res.status}`);
        }
        return true;
    } catch (err) {
        alert("İşlem sırasında hata oluştu: " + err.message);
        console.error("PATCH Hata:", err);
        return false;
    }
}


// ------------------------------------------------------------
// FEEDBACK LİSTELE
// ------------------------------------------------------------
async function loadAdminFeedback(filters = {}) {
    try {
        const container = document.getElementById("adminFeedbackContainer");
        container.innerHTML = "<div class='admin-loading'>Yükleniyor...</div>";
        
        const url = new URL(`${API_ROOT}/admin/feedback`);
        if (filters.status) url.searchParams.append("status", filters.status);
        if (filters.type) url.searchParams.append("message_type", filters.type);
        // filters.text (q) backend'de feedback_api.py'da desteklenmiyor, bu yüzden yoksayılıyor.

        // NOT: Buradaki fetch çağrısı, Basic Auth bilgilerini tarayıcı/kullanıcıdan bekler.
        const res = await fetch(url);

        if (res.status === 401) {
            container.innerHTML = "<div class='admin-error'>Yetkisiz Erişim. Lütfen Basic Auth bilgilerinizi girin (Sayfayı yenileyin).</div>";
            return;
        }
        
        const data = await res.json();

        ADMIN_FEEDBACK_CACHE = data;
        renderAdminFeedbackList();

    } catch (err) {
        console.error("Admin feedback yüklenemedi:", err);
        document.getElementById("adminFeedbackContainer").innerHTML =
            `<div class='admin-error'>Geri bildirimler yüklenemedi. Sunucu hatası: ${err.message}</div>`;
    }
}


// ------------------------------------------------------------
// FEEDBACK LİSTEYİ ÇİZ
// ------------------------------------------------------------
function renderAdminFeedbackList() {
    const container = document.getElementById("adminFeedbackContainer");
    container.innerHTML = "";

    if (!ADMIN_FEEDBACK_CACHE.length) {
        container.innerHTML = "<div class='admin-empty'>Kayıt bulunamadı.</div>";
        return;
    }

    ADMIN_FEEDBACK_CACHE.forEach(item => {
        const box = document.createElement("div");
        box.className = "admin-item";
        
        const statusClass = item.status === 'hidden' ? 'admin-status-hidden' : 'admin-status-visible';
        const likeIcon = item.liked ? '❤️' : '🤍';
        const replyStatus = item.admin_reply ? ' (Yanıtlandı)' : '';

        box.innerHTML = `
            <div class="admin-item-header">
                <span class="admin-item-type ${statusClass}">[${item.message_type}]</span>
                <span class="admin-item-date">${new Date(item.created_at).toLocaleString()}</span>
            </div>
            <div class="admin-item-info">
                <span class="admin-item-name">${item.name || "Anonim"}</span>
                <span class="admin-item-scenario">Senaryo: ${item.scenario_id || 'Genel'}</span>
            </div>
            
            <div class="admin-item-message">${item.message}</div>
            
            ${item.admin_reply ? `<div class="admin-item-reply"><strong>Admin Yanıtı:</strong> ${item.admin_reply}</div>` : ''}
            
            <div class="admin-btns">
                <button class="admin-action-btn" data-action="reply" data-id="${item.id}">Yanıtla</button>
                <button class="admin-action-btn" data-action="toggle-like" data-id="${item.id}">${likeIcon} Beğen</button>
                <button class="admin-action-btn" data-action="toggle-hide" data-id="${item.id}">${item.status === 'visible' ? 'Gizle' : 'Göster'}</button>
                <button class="admin-action-btn admin-action-delete" data-action="delete" data-id="${item.id}">Sil</button>
            </div>
        `;

        container.appendChild(box);
    });

    bindAdminButtons();
}


// ------------------------------------------------------------
// BUTTON EVENTLERİNİ BAĞLA
// ------------------------------------------------------------
function bindAdminButtons() {
    document.querySelectorAll(".admin-action-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = parseInt(btn.dataset.id);
            const action = btn.dataset.action;
            const item = ADMIN_FEEDBACK_CACHE.find(i => i.id === id);

            if (action === "reply") {
                // Yanıt panelini seçili ID ile doldur
                SELECTED_FEEDBACK_ID = id;
                document.getElementById("replyMessage").value = item.admin_reply || "";
                document.getElementById("replyPanelTitle").textContent = `Yanıt Gönder (ID: ${id})`;
                alert(`Yanıt paneli ${id} ID'li kayıt için açıldı.`);
            }
            
            if (action === "toggle-like") {
                await toggleLike(id, item.liked);
            }

            if (action === "toggle-hide") {
                await toggleHide(id, item.status);
            }

            if (action === "delete") {
                if (confirm(`[ID: ${id}] Bu yorumu silmek istediğine emin misin?`)) {
                    await deleteFeedback(id);
                }
            }
        });
    });
}


// ------------------------------------------------------------
// GÖREV 2.1: GİZLE / GÖSTER İŞLEMİ (PATCH)
// ------------------------------------------------------------
async function toggleHide(id, currentStatus) {
    const newStatus = currentStatus === 'visible' ? 'hidden' : 'visible';
    const success = await patchFeedback(id, { status: newStatus });
    
    if (success) {
        alert(`Kayıt ID ${id} başarıyla ${newStatus} olarak güncellendi.`);
        loadAdminFeedback();
    }
}

// ------------------------------------------------------------
// GÖREV 2.1 EK: BEĞENME İŞLEMİ (PATCH)
// ------------------------------------------------------------
async function toggleLike(id, currentLiked) {
    const success = await patchFeedback(id, { liked: !currentLiked });
    
    if (success) {
        alert(`Kayıt ID ${id} için beğeni durumu değiştirildi.`);
        loadAdminFeedback();
    }
}


// ------------------------------------------------------------
// YORUM SİL (DELETE)
// ------------------------------------------------------------
async function deleteFeedback(id) {
    try {
        const res = await fetch(`${API_ROOT}/admin/feedback/${id}`, {
            method: "DELETE"
        });

        if (res.status === 204) {
            alert(`Kayıt ID ${id} başarıyla silindi.`);
            loadAdminFeedback();
        } else {
             // 404 olabilir
            const errData = await res.json();
            alert(`Silme hatası: ${errData.detail}`);
        }

    } catch (err) {
        console.error("Silme hatası:", err);
    }
}


// ------------------------------------------------------------
// GÖREV 2.2: YANIT GÖNDERME İŞLEMİ (PATCH)
// ------------------------------------------------------------
function bindReplyButton() {
    document.getElementById("replySendBtn").addEventListener("click", sendReply);
}

async function sendReply() {
    const msg = document.getElementById("replyMessage").value.trim();

    if (!msg) {
        alert("Yanıt metni boş olamaz.");
        return;
    }
    if (!SELECTED_FEEDBACK_ID) {
        alert("Yanıtlanacak kayıt seçilmedi. Soldan 'Yanıtla' butonuna tıklayın.");
        return;
    }

    const payload = {
        admin_reply: msg
    };

    const success = await patchFeedback(SELECTED_FEEDBACK_ID, payload);

    if (success) {
        alert(`Yanıt ID ${SELECTED_FEEDBACK_ID} kaydına başarıyla gönderildi.`);
        document.getElementById("replyMessage").value = "";
        SELECTED_FEEDBACK_ID = null;
        document.getElementById("replyPanelTitle").textContent = `Yanıt Gönder`;
        loadAdminFeedback();
    }
}


// ------------------------------------------------------------
// Filtre kontrolleri
// ------------------------------------------------------------
function bindFilters() {
    document.getElementById("filterBtn").addEventListener("click", () => {
        // Text filtreleme backend'de desteklenmiyor (Görev 2.3 notu)
        // const text = document.getElementById("filterText").value.trim();
        const type = document.getElementById("filterType").value;
        loadAdminFeedback({ type: type });
    });
}