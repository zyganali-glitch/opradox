/**
 * viz-collaboration.js
 * Real-time Collaboration Functions - CREATED FROM LEGACY viz.js
 * initCollaboration, joinCollaborationRoom, showCollaborationModal
 */

(function () {
    'use strict';

    // =====================================================
    // COLLABORATION STATE
    // =====================================================

    const COLLABORATION = {
        socket: null,
        roomId: null,
        users: [],
        isConnected: false
    };

    // =====================================================
    // INIT COLLABORATION
    // =====================================================

    function initCollaboration() {
        console.log('🤝 Collaboration module initialized');

        // Check for WebSocket support
        if (!('WebSocket' in window)) {
            console.warn('WebSocket not supported');
            return false;
        }

        return true;
    }

    // =====================================================
    // JOIN COLLABORATION ROOM
    // =====================================================

    async function joinCollaborationRoom(roomId, username = 'Anonymous') {
        if (COLLABORATION.isConnected) {
            if (typeof showToast === 'function') showToast('Zaten bir odaya bağlısınız', 'warning');
            return;
        }

        try {
            const wsUrl = `ws://${window.location.host}/ws/collab/${roomId}`;
            COLLABORATION.socket = new WebSocket(wsUrl);

            COLLABORATION.socket.onopen = () => {
                COLLABORATION.isConnected = true;
                COLLABORATION.roomId = roomId;

                // Send join message
                COLLABORATION.socket.send(JSON.stringify({
                    type: 'join',
                    username: username,
                    roomId: roomId
                }));

                if (typeof showToast === 'function') {
                    showToast(`Oda '${roomId}' bağlandı`, 'success');
                }

                updateCollaborationUI();
            };

            COLLABORATION.socket.onmessage = (event) => {
                handleCollaborationMessage(JSON.parse(event.data));
            };

            COLLABORATION.socket.onclose = () => {
                COLLABORATION.isConnected = false;
                COLLABORATION.socket = null;
                if (typeof showToast === 'function') {
                    showToast('Bağlantı kesildi', 'info');
                }
                updateCollaborationUI();
            };

            COLLABORATION.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                if (typeof showToast === 'function') {
                    showToast('Bağlantı hatası', 'error');
                }
            };

        } catch (error) {
            console.error('Collaboration join error:', error);
            if (typeof showToast === 'function') {
                showToast('Odaya katılınamadı: ' + error.message, 'error');
            }
        }
    }

    // =====================================================
    // LEAVE COLLABORATION ROOM
    // =====================================================

    function leaveCollaborationRoom() {
        if (COLLABORATION.socket && COLLABORATION.isConnected) {
            COLLABORATION.socket.send(JSON.stringify({
                type: 'leave',
                roomId: COLLABORATION.roomId
            }));
            COLLABORATION.socket.close();
        }

        COLLABORATION.isConnected = false;
        COLLABORATION.socket = null;
        COLLABORATION.roomId = null;
        COLLABORATION.users = [];

        if (typeof showToast === 'function') {
            showToast('Odadan ayrıldınız', 'info');
        }
    }

    // =====================================================
    // HANDLE COLLABORATION MESSAGE
    // =====================================================

    function handleCollaborationMessage(message) {
        switch (message.type) {
            case 'user_joined':
                COLLABORATION.users.push(message.username);
                if (typeof showToast === 'function') {
                    showToast(`${message.username} odaya katıldı`, 'info');
                }
                updateCollaborationUI();
                break;

            case 'user_left':
                COLLABORATION.users = COLLABORATION.users.filter(u => u !== message.username);
                if (typeof showToast === 'function') {
                    showToast(`${message.username} odadan ayrıldı`, 'info');
                }
                updateCollaborationUI();
                break;

            case 'chart_update':
                // Sync chart updates from other users
                if (message.chartConfig && typeof renderChart === 'function') {
                    renderChart(message.chartConfig);
                }
                break;

            case 'data_update':
                // Sync data updates
                const state = window.VIZ_STATE;
                if (state && message.data) {
                    state.data = message.data;
                    state.columns = message.columns || [];
                    if (typeof renderColumnsList === 'function') renderColumnsList();
                    if (typeof updateDropdowns === 'function') updateDropdowns();
                }
                break;

            case 'users_list':
                COLLABORATION.users = message.users || [];
                updateCollaborationUI();
                break;
        }
    }

    // =====================================================
    // SEND COLLABORATION ACTION
    // =====================================================

    function sendCollaborationAction(action, data) {
        if (!COLLABORATION.isConnected || !COLLABORATION.socket) return;

        COLLABORATION.socket.send(JSON.stringify({
            type: action,
            roomId: COLLABORATION.roomId,
            data: data
        }));
    }

    // =====================================================
    // SHOW COLLABORATION MODAL
    // =====================================================

    function showCollaborationModal() {
        const html = `
            <div class="viz-modal-form">
                <h4 style="margin-bottom:15px;"><i class="fas fa-users"></i> İşbirliği Ayarları</h4>
                
                <div style="margin-bottom:15px;">
                    <label>Kullanıcı Adı:</label>
                    <input type="text" id="collabUsername" placeholder="Adınız..." 
                           style="width:100%;padding:8px;border-radius:4px;border:1px solid var(--gm-border);">
                </div>
                
                <div style="margin-bottom:15px;">
                    <label>Oda ID:</label>
                    <input type="text" id="collabRoomId" placeholder="Oda ID girin veya oluşturun..." 
                           style="width:100%;padding:8px;border-radius:4px;border:1px solid var(--gm-border);">
                    <small style="color:var(--gm-text-muted);">Boş bırakırsanız yeni oda oluşturulur</small>
                </div>
                
                <div style="display:flex;gap:10px;">
                    <button class="gm-gradient-btn" onclick="joinCollabFromModal()" style="flex:1;">
                        <i class="fas fa-sign-in-alt"></i> Odaya Katıl
                    </button>
                    <button class="viz-btn-secondary" onclick="createCollabRoom()" style="flex:1;">
                        <i class="fas fa-plus"></i> Yeni Oda
                    </button>
                </div>
                
                <div id="collabStatus" style="margin-top:20px;padding:10px;border-radius:4px;background:var(--gm-card-bg);">
                    <strong>Durum:</strong> <span id="collabStatusText">${COLLABORATION.isConnected ? 'Bağlı' : 'Bağlı değil'}</span>
                    ${COLLABORATION.roomId ? `<br><strong>Oda:</strong> ${COLLABORATION.roomId}` : ''}
                    ${COLLABORATION.users.length > 0 ? `<br><strong>Kullanıcılar:</strong> ${COLLABORATION.users.join(', ')}` : ''}
                </div>
                
                ${COLLABORATION.isConnected ? `
                    <button class="viz-btn-danger" onclick="leaveCollaborationRoom();closeStatResultModal();" style="width:100%;margin-top:10px;">
                        <i class="fas fa-sign-out-alt"></i> Odadan Ayrıl
                    </button>
                ` : ''}
            </div>
        `;

        if (typeof showStatResultModal === 'function') {
            showStatResultModal('İşbirliği', html);
        }
    }

    // =====================================================
    // HELPER FUNCTIONS
    // =====================================================

    function joinCollabFromModal() {
        const username = document.getElementById('collabUsername')?.value || 'Anonymous';
        const roomId = document.getElementById('collabRoomId')?.value || generateRoomId();
        joinCollaborationRoom(roomId, username);
    }

    function createCollabRoom() {
        const username = document.getElementById('collabUsername')?.value || 'Anonymous';
        const roomId = generateRoomId();
        document.getElementById('collabRoomId').value = roomId;
        joinCollaborationRoom(roomId, username);
    }

    function generateRoomId() {
        return 'room_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function updateCollaborationUI() {
        const statusText = document.getElementById('collabStatusText');
        if (statusText) {
            statusText.textContent = COLLABORATION.isConnected ? 'Bağlı' : 'Bağlı değil';
        }

        // Update any collaboration indicators in the UI
        const collabIndicator = document.getElementById('collabIndicator');
        if (collabIndicator) {
            collabIndicator.style.display = COLLABORATION.isConnected ? 'inline-flex' : 'none';
            collabIndicator.textContent = COLLABORATION.users.length;
        }
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    window.COLLABORATION = COLLABORATION;
    window.initCollaboration = initCollaboration;
    window.joinCollaborationRoom = joinCollaborationRoom;
    window.leaveCollaborationRoom = leaveCollaborationRoom;
    window.showCollaborationModal = showCollaborationModal;
    window.sendCollaborationAction = sendCollaborationAction;
    window.handleCollaborationMessage = handleCollaborationMessage;
    window.joinCollabFromModal = joinCollabFromModal;
    window.createCollabRoom = createCollabRoom;

    console.log('✅ viz-collaboration.js CREATED - Collaboration functions available');
})();
