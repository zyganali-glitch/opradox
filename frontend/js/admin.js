// ============================================================
// opradox – ADMIN.JS (Dashboard + Feedback Yönetimi)
// JWT Authentication ile korumalı
// ============================================================

// API root - use same origin
const API_ROOT = "http://127.0.0.1:8100";

let ADMIN_FEEDBACK_CACHE = [];
let SELECTED_FEEDBACK_ID = null;
let AUTH_TOKEN = null;
let ADMIN_USERNAME = null;

// Chart instances
let chartTypeDistribution = null;
let chartTopScenarios = null;
let chartRatingDistribution = null;

// ------------------------------------------------------------
// JWT TOKEN YÖNETİMİ
// ------------------------------------------------------------
function getAuthToken() {
    return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
}

function getAdminUsername() {
    return localStorage.getItem('admin_username') || sessionStorage.getItem('admin_username');
}

function clearAuthTokens() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_username');
}

function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

async function verifyTokenAndInit() {
    const token = getAuthToken();

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        console.log("DEBUG: verifyTokenAndInit starting...");
        console.log("DEBUG: API_ROOT:", API_ROOT);

        const res = await fetch(`${API_ROOT}/auth/check-status`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        console.log("DEBUG: Server response:", data);

        if (!data.valid) {
            console.error('❌ Token geçersiz:', data.reason);
            throw new Error('Token geçersiz: ' + data.reason);
        }

        // Token geçerli
        AUTH_TOKEN = token;
        ADMIN_USERNAME = data.username;

        // Kullanıcı adını göster
        const usernameEl = document.getElementById('adminUsername');
        if (usernameEl) {
            usernameEl.textContent = ADMIN_USERNAME;
        }

        // Sayfayı başlat
        initAdminPage();

    } catch (err) {
        console.error('Token doğrulama hatası:', err);
        clearAuthTokens();
        window.location.href = 'login.html';
    }
}

function initAdminPage() {
    loadDashboardStats();
    loadAdminFeedback();
    bindFilters();
    bindTabNavigation();
    bindLogoutButton();
    bindPasswordChange();
}

function bindLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch(`${API_ROOT}/auth/logout`, {
                    method: 'POST',
                    headers: getAuthHeaders()
                });
            } catch (err) {
                console.log('Logout API hatası (göz ardı edilebilir)');
            }
            clearAuthTokens();
            window.location.href = 'login.html';
        });
    }
}

function bindPasswordChange() {
    const changePassBtn = document.getElementById('changePasswordBtn');
    if (changePassBtn) {
        changePassBtn.addEventListener('click', showPasswordChangeModal);
    }
}

async function showPasswordChangeModal() {
    const currentPassword = prompt('Mevcut şifrenizi girin:');
    if (!currentPassword) return;

    const newPassword = prompt('Yeni şifrenizi girin (en az 6 karakter):');
    if (!newPassword || newPassword.length < 6) {
        alert('Yeni şifre en az 6 karakter olmalı');
        return;
    }

    try {
        const res = await fetch(`${API_ROOT}/auth/change-password`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.message);
        } else {
            throw new Error(data.detail);
        }
    } catch (err) {
        alert('Şifre değiştirme hatası: ' + err.message);
    }
}

// ------------------------------------------------------------
// SAYFA YÜKLENİNCE JWT KONTROL ET
// ------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
    verifyTokenAndInit();
});

// ------------------------------------------------------------
// TAB NAVİGASYONU
// ------------------------------------------------------------
function bindTabNavigation() {
    document.querySelectorAll(".admin-nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tabName = btn.dataset.tab;

            // Active button
            document.querySelectorAll(".admin-nav-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Active tab
            document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
            document.getElementById(`${tabName}Tab`).classList.add("active");

            // Refresh data on tab switch
            if (tabName === "dashboard") {
                loadDashboardStats();
            } else if (tabName === "feedback") {
                loadAdminFeedback();
            }
        });
    });
}

// ------------------------------------------------------------
// DASHBOARD İSTATİSTİKLERİ YÜKLE
// ------------------------------------------------------------
async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_ROOT}/admin/stats`, {
            headers: getAuthHeaders()
        });

        if (res.status === 401) {
            clearAuthTokens();
            window.location.href = 'login.html';
            return;
        }

        const data = await res.json();

        // Stat cards güncelle
        document.getElementById("statTotal").textContent = data.total || 0;
        document.getElementById("statToday").textContent = data.today || 0;
        document.getElementById("statUnanswered").textContent = data.unanswered || 0;
        document.getElementById("statAvgRating").textContent = data.avg_rating ? `${data.avg_rating}⭐` : "-";

        // Grafikleri çiz
        renderTypeDistributionChart(data.type_distribution || {});
        renderTopScenariosChart(data.top_scenarios || []);
        renderRatingDistributionChart(data.rating_distribution || {});

    } catch (err) {
        console.error("Dashboard stats yüklenemedi:", err);
    }
}

// ------------------------------------------------------------
// MESAJ TÜRÜ DAĞILIMI (PIE CHART)
// ------------------------------------------------------------
function renderTypeDistributionChart(distribution) {
    const ctx = document.getElementById("chartTypeDistribution");
    if (!ctx) return;

    // Destroy existing chart
    if (chartTypeDistribution) {
        chartTypeDistribution.destroy();
    }

    const labels = [];
    const values = [];
    const colors = {
        comment: "#2c7be5",
        suggestion: "#f7c325",
        thanks: "#00d97e",
        bug: "#dc3545",
        contact: "#b9134f"
    };
    const bgColors = [];

    const labelMap = {
        comment: "Yorum",
        suggestion: "Öneri",
        thanks: "Teşekkür",
        bug: "Hata",
        contact: "İletişim"
    };

    for (const [type, count] of Object.entries(distribution)) {
        labels.push(labelMap[type] || type);
        values.push(count);
        bgColors.push(colors[type] || "#666");
    }

    chartTypeDistribution = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: bgColors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        color: "#e6edf3",
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// ------------------------------------------------------------
// TOP SENARYOLAR (BAR CHART)
// ------------------------------------------------------------
function renderTopScenariosChart(scenarios) {
    const ctx = document.getElementById("chartTopScenarios");
    if (!ctx) return;

    if (chartTopScenarios) {
        chartTopScenarios.destroy();
    }

    const labels = scenarios.map(s => s.scenario_id?.substring(0, 20) || "Genel");
    const values = scenarios.map(s => s.count);

    chartTopScenarios = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Mesaj Sayısı",
                data: values,
                backgroundColor: "rgba(185, 19, 79, 0.7)",
                borderColor: "#b9134f",
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: "#30363d" },
                    ticks: { color: "#8b949e" }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: "#e6edf3", font: { size: 11 } }
                }
            }
        }
    });
}

// ------------------------------------------------------------
// PUAN DAĞILIMI (BAR CHART)
// ------------------------------------------------------------
function renderRatingDistributionChart(distribution) {
    const ctx = document.getElementById("chartRatingDistribution");
    if (!ctx) return;

    if (chartRatingDistribution) {
        chartRatingDistribution.destroy();
    }

    const labels = ["1⭐", "2⭐", "3⭐", "4⭐", "5⭐"];
    const values = [1, 2, 3, 4, 5].map(r => distribution[r] || 0);

    const colors = [
        "#dc3545", // 1 star - red
        "#fd7e14", // 2 star - orange
        "#f7c325", // 3 star - yellow
        "#20c997", // 4 star - teal
        "#00d97e"  // 5 star - green
    ];

    chartRatingDistribution = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Oy Sayısı",
                data: values,
                backgroundColor: colors,
                borderWidth: 0,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: "#e6edf3", font: { size: 14 } }
                },
                y: {
                    grid: { color: "#30363d" },
                    ticks: { color: "#8b949e" },
                    beginAtZero: true
                }
            }
        }
    });
}

// ------------------------------------------------------------
// PATCH İŞLEMİNİ TEK YERDEN YÖNETEN YARDIMCI
// ------------------------------------------------------------
async function patchFeedback(id, payload) {
    try {
        const res = await fetch(`${API_ROOT}/admin/feedback/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
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
        container.innerHTML = "<div class='admin-loading'><i class='fas fa-spinner fa-spin'></i> Yükleniyor...</div>";

        const url = new URL(`${API_ROOT}/admin/feedback`);
        if (filters.status) url.searchParams.append("status", filters.status);
        if (filters.type) url.searchParams.append("message_type", filters.type);

        const res = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (res.status === 401) {
            clearAuthTokens();
            window.location.href = 'login.html';
            return;
        }

        const data = await res.json();
        ADMIN_FEEDBACK_CACHE = data;

        // Text filter (frontend tarafında)
        const textFilter = document.getElementById("filterText")?.value.toLowerCase().trim();
        if (textFilter) {
            ADMIN_FEEDBACK_CACHE = ADMIN_FEEDBACK_CACHE.filter(item =>
                item.message.toLowerCase().includes(textFilter) ||
                (item.name && item.name.toLowerCase().includes(textFilter))
            );
        }

        renderAdminFeedbackList();

    } catch (err) {
        console.error("Admin feedback yüklenemedi:", err);
        document.getElementById("adminFeedbackContainer").innerHTML =
            `<div class='admin-error'><i class='fas fa-exclamation-triangle'></i> Sunucu hatası: ${err.message}</div>`;
    }
}

// ------------------------------------------------------------
// FEEDBACK LİSTEYİ ÇİZ
// ------------------------------------------------------------
function renderAdminFeedbackList() {
    const container = document.getElementById("adminFeedbackContainer");
    container.innerHTML = "";

    if (!ADMIN_FEEDBACK_CACHE.length) {
        container.innerHTML = "<div class='admin-empty'><i class='fas fa-inbox'></i> Kayıt bulunamadı.</div>";
        return;
    }

    ADMIN_FEEDBACK_CACHE.forEach(item => {
        const box = document.createElement("div");
        box.className = `admin-item ${item.status === 'hidden' ? 'admin-status-hidden' : ''}`;

        const ratingHtml = item.rating ? `<span class="admin-item-rating">${'⭐'.repeat(item.rating)}</span>` : '';
        const emailHtml = item.email ? `
            <span class="admin-item-email" style="background: rgba(var(--gm-accent-rgb), 0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.85em; cursor: pointer; border: 1px solid var(--border-dark);" onclick="navigator.clipboard.writeText('${item.email}'); alert('E-posta kopyalandı!')">
                <i class="fas fa-envelope"></i> ${item.email} <i class="fas fa-copy" style="font-size: 0.8em; margin-left: 4px; opacity: 0.6;"></i>
            </span>
        ` : '';

        box.innerHTML = `
            <div class="admin-item-header">
                <span class="admin-item-type ${item.message_type}">${item.message_type}</span>
                <span class="admin-item-date">${new Date(item.created_at).toLocaleString('tr-TR')}</span>
            </div>
            <div class="admin-item-info">
                <span class="admin-item-name">${item.name || "Anonim"}</span>
                <span class="admin-item-scenario">📁 ${item.scenario_id || 'Genel'}</span>
                ${emailHtml}
                ${ratingHtml}
            </div>
            
            <div class="admin-item-message">${item.message}</div>
            
            ${item.admin_reply ? `<div class="admin-item-reply"><strong>✓ Admin:</strong> ${item.admin_reply}</div>` : ''}
            
            <div class="admin-btns">
                <button class="admin-action-btn" onclick="toggleInlineReply(${item.id})">
                    <i class="fas fa-reply"></i> Yanıtla
                </button>
                <button class="admin-action-btn" data-action="toggle-like" data-id="${item.id}">
                    ${item.liked ? '❤️' : '🤍'} Beğen
                </button>
                <button class="admin-action-btn" data-action="toggle-hide" data-id="${item.id}">
                    <i class="fas fa-eye${item.status === 'visible' ? '-slash' : ''}"></i> 
                    ${item.status === 'visible' ? 'Gizle' : 'Göster'}
                </button>
                <button class="admin-action-btn admin-action-delete" data-action="delete" data-id="${item.id}">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>

            <!-- INLINE REPLY FORM (Initially Hidden) -->
            <div id="inline-reply-${item.id}" class="inline-reply-container" style="display:none; margin-top:12px; border-top:1px solid var(--border-dark); padding-top:12px;">
                <textarea id="reply-text-${item.id}" style="width:100%; height:80px; background:var(--panel-dark); border:1px solid var(--border-dark); border-radius:6px; color:white; padding:8px; font-size:13px; margin-bottom:8px;" placeholder="Yanıtınızı buraya yazın...">${item.admin_reply || ''}</textarea>
                <div style="display:flex; gap:8px;">
                    <button class="admin-action-btn" style="background:var(--accent); color:white; border:none;" onclick="sendInlineReply(${item.id})">
                        <i class="fas fa-paper-plane"></i> Gönder
                    </button>
                    <button class="admin-action-btn" onclick="toggleInlineReply(${item.id})">İptal</button>
                </div>
            </div>
        `;

        container.appendChild(box);
    });

    bindAdminButtons();
}

/**
 * Yanıt panelini aç/kapat (Global function for onclick)
 */
window.toggleInlineReply = function (id) {
    const el = document.getElementById(`inline-reply-${id}`);
    if (el) {
        const isHidden = el.style.display === 'none';
        el.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            document.getElementById(`reply-text-${id}`).focus();
        }
    }
}

/**
 * Satır içi yanıt gönder (Global function for onclick)
 */
window.sendInlineReply = async function (id) {
    const txt = document.getElementById(`reply-text-${id}`);
    const msg = txt.value.trim();
    if (!msg) return alert("Yanıt metni boş olamaz.");

    const success = await patchFeedback(id, { admin_reply: msg });
    if (success) {
        alert("Yanıt başarıyla kaydedildi ve e-posta tetiklendi.");
        loadAdminFeedback();
    }
}

// ------------------------------------------------------------
// BUTTON EVENTLERİNİ BAĞLA
// ------------------------------------------------------------
function bindAdminButtons() {
    document.querySelectorAll(".admin-action-btn").forEach(btn => {
        // ID set olmayan veya onclick ile zaten yönetilen butonları pas geç
        if (!btn.dataset.id) return;

        btn.addEventListener("click", async () => {
            const id = parseInt(btn.dataset.id);
            const action = btn.dataset.action;
            const item = ADMIN_FEEDBACK_CACHE.find(i => i.id === id);

            if (action === "toggle-like") {
                await toggleLike(id, item.liked);
            }

            if (action === "toggle-hide") {
                await toggleHide(id, item.status);
            }

            if (action === "delete") {
                if (confirm(`[ID: ${id}] Bu mesajı silmek istediğine emin misin?`)) {
                    await deleteFeedback(id);
                }
            }
        });
    });
}

// ------------------------------------------------------------
// GİZLE / GÖSTER İŞLEMİ (PATCH)
// ------------------------------------------------------------
async function toggleHide(id, currentStatus) {
    const newStatus = currentStatus === 'visible' ? 'hidden' : 'visible';
    const success = await patchFeedback(id, { status: newStatus });
    if (success) loadAdminFeedback();
}

// ------------------------------------------------------------
// BEĞENME İŞLEMİ (PATCH)
// ------------------------------------------------------------
async function toggleLike(id, currentLiked) {
    const success = await patchFeedback(id, { liked: !currentLiked });
    if (success) loadAdminFeedback();
}

// ------------------------------------------------------------
// YORUM SİL (DELETE)
// ------------------------------------------------------------
async function deleteFeedback(id) {
    try {
        const res = await fetch(`${API_ROOT}/admin/feedback/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        if (res.status === 204 || res.ok) {
            loadAdminFeedback();
            loadDashboardStats();
        } else {
            const errData = await res.json();
            alert(`Silme hatası: ${errData.detail}`);
        }
    } catch (err) {
        console.error("Silme hatası:", err);
    }
}

// ------------------------------------------------------------
// Filtre kontrolleri
// ------------------------------------------------------------
function bindFilters() {
    document.getElementById("filterBtn").addEventListener("click", () => {
        const type = document.getElementById("filterType").value;
        const status = document.getElementById("filterStatus").value;
        loadAdminFeedback({ type, status });
    });

    // Enter tuşu ile de filtrele
    document.getElementById("filterText").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            document.getElementById("filterBtn").click();
        }
    });
}

console.log("📊 Admin Panel JS loaded");