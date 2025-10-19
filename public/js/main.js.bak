// public/js/main.js

// ===================================
//  LOGIKA UI UMUM
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Dropdown menu toggle untuk header
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        const dropdown = userMenu.querySelector('.dropdown-menu');
        const userAvatarLink = userMenu.querySelector('.user-avatar-link');

        userAvatarLink.addEventListener('click', (event) => {
            event.preventDefault();
            dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
        });

        // Tutup dropdown jika mengklik di luar area menu
        document.addEventListener('click', (event) => {
            if (!userMenu.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    }
});


// ===================================
//  LOGIKA CHAT REAL-TIME
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Cek apakah kita berada di halaman chat
    const chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) return; // Jika tidak, hentikan eksekusi kode chat

    const socket = io(); // Inisialisasi koneksi Socket.IO
    const conversationList = document.querySelector('.conversation-list');
    const chatMessages = document.querySelector('.chat-messages');
    const chatInputForm = document.querySelector('.chat-input-form');
    const chatMessageInput = document.getElementById('chatMessageInput');
    const chatHeader = document.querySelector('.chat-header h3');

    // Mengambil ID user yang sedang login dari elemen sidebar
    const sidebarUserInfo = document.querySelector('.sidebar-user-info');
    const currentUserId = sidebarUserInfo ? sidebarUserInfo.dataset.userId : null;

    let activeChatRoomId = null;
    let activeReceiverId = null;

    // Fungsi untuk merender satu pesan di UI
    function renderMessage(message, isMe) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', isMe ? 'sent' : 'received');
        
        const avatar = document.createElement('img');
        avatar.src = message.sender.avatar || '/images/default-avatar.png';
        avatar.classList.add('message-avatar');

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message-bubble');
        messageBubble.textContent = message.messageText;

        if (isMe) {
            messageDiv.appendChild(messageBubble);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(messageBubble);
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll ke pesan terbaru
    }
    
    // Fungsi untuk memuat riwayat pesan dari API dan bergabung ke room
    async function loadConversation(chatRoomId, receiverId, receiverName) {
        activeChatRoomId = chatRoomId;
        activeReceiverId = receiverId;
        chatHeader.textContent = receiverName;
        chatMessages.innerHTML = ''; // Kosongkan area pesan

        try {
            const response = await fetch(`/api/chat/${chatRoomId}`);
            const result = await response.json();

            if (result.success) {
                result.messages.forEach(msg => {
                    const isMe = msg.sender._id.toString() === currentUserId;
                    renderMessage(msg, isMe);
                });
                socket.emit('join_chat', { chatRoomId }); // Bergabung ke room Socket.IO
                
                // Aktifkan form input setelah percakapan dimuat
                chatMessageInput.disabled = false;
                chatInputForm.querySelector('button').disabled = false;
                chatMessageInput.focus();
            } else {
                chatMessages.innerHTML = `<p class="error-message">${result.message}</p>`;
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            chatMessages.innerHTML = '<p class="error-message">Terjadi kesalahan saat memuat pesan.</p>';
        }
    }
    
    // Event listener untuk memilih percakapan dari daftar di sidebar kiri
    conversationList.addEventListener('click', (e) => {
        const conversationItem = e.target.closest('.conversation-item');
        if (conversationItem) {
            document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
            conversationItem.classList.add('active');

            const chatRoomId = conversationItem.dataset.roomId;
            const receiverId = conversationItem.dataset.receiverId;
            const receiverName = conversationItem.querySelector('.conversation-name').textContent;
            
            loadConversation(chatRoomId, receiverId, receiverName);
        }
    });

    // Event listener untuk form pengiriman pesan
    chatInputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const messageText = chatMessageInput.value.trim();

        if (messageText && activeChatRoomId && currentUserId) {
            const messageData = {
                chatRoomId: activeChatRoomId,
                senderId: currentUserId,
                receiverId: activeReceiverId,
                messageText: messageText
            };
            
            socket.emit('send_message', messageData); // Kirim pesan via Socket.IO ke server
            chatMessageInput.value = ''; // Kosongkan input field
        }
    });
    
    // Menerima pesan real-time dari server via Socket.IO
    socket.on('receive_message', (message) => {
        if (message.chatRoomId === activeChatRoomId) {
            const isMe = message.sender._id.toString() === currentUserId;
            renderMessage(message, isMe);
        } else {
            // Opsional: Tampilkan notifikasi untuk pesan di room lain
            console.log(`Pesan baru di room ${message.chatRoomId}`);
        }
    });

    // Menangani error dari server socket
    socket.on('chat_error', (errorMessage) => {
        alert('Chat Error: ' + errorMessage);
    });

    // Logika untuk auto-load chat jika dibuka dari link (misal: /chat/USER_ID)
    const initData = document.getElementById('chat-init-data');
    if (initData && initData.dataset.roomId) {
        const roomId = initData.dataset.roomId;
        const receiverId = initData.dataset.receiverId;
        const receiverName = initData.dataset.receiverName;
        
        loadConversation(roomId, receiverId, receiverName);
    }
});
// public/js/main.js
// GANTI FUNGSI renderMessage LAMA DENGAN INI:

// Fungsi untuk merender satu pesan di UI (dengan timestamp)
function renderMessage(message, isMe) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', isMe ? 'sent' : 'received');
    
    // 1. Buat Avatar
    const avatar = document.createElement('img');
    avatar.src = message.sender.avatar || '/images/default-avatar.png';
    avatar.classList.add('message-avatar');

    // 2. Buat Wrapper untuk Bubble dan Timestamp
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');

    // 3. Buat Bubble Pesan
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message-bubble');
    messageBubble.textContent = message.messageText;
    
    // 4. Buat Timestamp
    const timestamp = document.createElement('div');
    timestamp.classList.add('message-timestamp');
    const messageDate = new Date(message.timestamp || Date.now());
    // Format waktu menjadi "10:30 AM/PM"
    timestamp.textContent = messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // 5. Gabungkan Bubble dan Timestamp ke dalam Wrapper Konten
    messageContent.appendChild(messageBubble);
    messageContent.appendChild(timestamp);
    
    // 6. Gabungkan Avatar dan Wrapper Konten ke dalam div utama
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll ke pesan terbaru
}

// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // ... (kode dropdown menu yang sudah ada) ...

    // ===================================
    //  LOGIKA MENU HAMBURGER BARU
    // ===================================
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navWrapper = document.getElementById('navWrapper');

    if (hamburgerMenu && navWrapper) {
        hamburgerMenu.addEventListener('click', () => {
            navWrapper.classList.toggle('active');
            hamburgerMenu.classList.toggle('is-active');
        });
    }
});
// public/js/main.js (FIXED & COMPLETE)
document.addEventListener('DOMContentLoaded', () => {
    // ===================================
    //  LOGIKA UI UMUM
    // ===================================
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) { /* ... (logika dropdown menu tetap sama) ... */ }

    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navWrapper = document.getElementById('navWrapper');
    if (hamburgerMenu && navWrapper) {
        hamburgerMenu.addEventListener('click', () => {
            navWrapper.classList.toggle('active');
            hamburgerMenu.classList.toggle('is-active');
        });
    }

    // ===================================
    //  LOGIKA FORM AJUKAN PROPOSAL (BARU & PENTING)
    // ===================================
    const proposalForm = document.getElementById('proposalForm');
    if (proposalForm) {
        proposalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = proposalForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Mengirim...';

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/jobs/proposal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    alert('Proposal berhasil dikirim!');
                    window.location.reload(); // Muat ulang halaman untuk menampilkan status "sudah mengajukan"
                } else {
                    alert('Error: ' + result.message);
                    submitButton.disabled = false;
                    submitButton.textContent = 'Kirim Proposal';
                }
            } catch (error) {
                console.error('Error submitting proposal:', error);
                alert('Gagal mengirim proposal. Periksa koneksi Anda.');
                submitButton.disabled = false;
                submitButton.textContent = 'Kirim Proposal';
            }
        });
    }

    // ===================================
    //  LOGIKA CHAT REAL-TIME
    // ===================================
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        // ... (semua kode logika chat Anda yang sudah ada tetap di sini) ...
    }
});