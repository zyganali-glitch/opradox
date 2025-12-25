
/**
 * Generic Modal Gösterici
 */
export function showStatResultModal(title, contentHtml) {
    let modal = document.getElementById('vizStatResultModal');

    // Eğer modal yoksa yarat
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'vizStatResultModal';
        modal.className = 'viz-modal';
        modal.innerHTML = `
            <div class="viz-modal-content">
                <div class="viz-modal-header">
                    <h3 id="vizStatModalTitle">Sonuçlar</h3>
                    <span class="viz-close-modal" onclick="closeStatResultModal()">&times;</span>
                </div>
                <div class="viz-modal-body" id="vizStatModalBody"></div>
            </div>`;
        document.body.appendChild(modal);

        // Dışarı tıklama ile kapatma
        window.onclick = function (event) {
            if (event.target === modal) {
                closeStatResultModal();
            }
        };
    }

    const titleEl = document.getElementById('vizStatModalTitle');
    const bodyEl = document.getElementById('vizStatModalBody');

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = contentHtml;

    modal.style.display = 'block';
}

export function closeStatResultModal() {
    const modal = document.getElementById('vizStatResultModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Watermark Modal (viz.js'den alınacak veya burada yeniden yazılacak)
 * Şimdilik viz.js'dekine güveniyoruz ama buraya taşımalıyız
 */
export function showWatermarkModal() {
    // TODO: Implement or extract from viz.js
    console.warn('showWatermarkModal not fully modularized yet');
    // Fallback to global if exists, otherwise implement simple version
    if (window.showWatermarkModal && window.showWatermarkModal !== showWatermarkModal) {
        window.showWatermarkModal();
    } else {
        // Simple implementation
        const html = `
            <div class="viz-modal-form">
                <label>Metin:</label>
                <input type="text" id="wmText" placeholder="Örn: GİZLİ" style="width:100%; padding:8px; margin-bottom:10px;">
                <button class="viz-btn-primary" onclick="applyWatermark()">Uygula</button>
            </div>
        `;
        showStatResultModal('Filigran Ekle', html);
    }
}

// Global exports
window.showStatResultModal = showStatResultModal;
window.closeStatResultModal = closeStatResultModal;
