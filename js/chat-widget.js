// js/chat-widget.js (ボタンクリックで位置をリセットする修正版)

function initializeChatWidget() {
    // 既に初期化済みの場合は何もしない
    if (window.chatWidgetInitialized) return;
    window.chatWidgetInitialized = true;

    // --- 要素の取得 ---
    const toggleButton = document.getElementById('ai-chat-toggle-button');
    const chatContainer = document.getElementById('chat-widget-container');
    const widgetCloseButton = document.getElementById('chat-widget-close-button');
    const newChatButton = document.getElementById('chat-widget-new-button');
    const header = document.getElementById('chat-widget-header');
    const resizeHandle = document.getElementById('chat-widget-resize-handle');
    const messagesContainer = document.getElementById('chat-widget-messages');
    const chatInput = document.getElementById('chat-widget-input');
    const sendButton = document.getElementById('chat-widget-send-button');

    const SERVER_URL = 'https://camper-chatbot.onrender.com';

    // --- 状態の復元 ---
    function restoreState() {
        const stateJSON = sessionStorage.getItem('chatWidgetState');
        chatContainer.style.top = 'auto';
        chatContainer.style.left = 'auto';
        if (stateJSON) {
            const state = JSON.parse(stateJSON);
            if (state.isOpen) {
                chatContainer.classList.remove('hidden');
            }
            chatContainer.style.right = state.right !== undefined ? `${state.right}px` : '20px';
            chatContainer.style.bottom = state.bottom !== undefined ? `${state.bottom}px` : '20px';
            chatContainer.style.height = state.height !== undefined ? `${state.height}px` : '450px';
            if (state.history) {
                messagesContainer.innerHTML = state.history;
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } else {
                addInitialBotMessage();
            }
        } else {
            addInitialBotMessage();
        }
    }

    // --- 状態の保存 ---
    function saveState() {
        if (!chatContainer) return;
        const rect = chatContainer.getBoundingClientRect();
        const state = {
            isOpen: !chatContainer.classList.contains('hidden'),
            right: window.innerWidth - rect.right,
            bottom: window.innerHeight - rect.bottom,
            height: rect.height,
            history: messagesContainer.innerHTML
        };
        sessionStorage.setItem('chatWidgetState', JSON.stringify(state));
    }

// --- UI操作（開閉・新規）---
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            // もしチャットウィンドウが非表示('hidden'クラスを持つ)の場合だけ、処理を実行する
            if (chatContainer.classList.contains('hidden')) {
                // ▼▼▼ 位置とサイズをリセットする処理 ▼▼▼
                chatContainer.style.top = 'auto';
                chatContainer.style.left = 'auto';
                chatContainer.style.right = '20px';
                chatContainer.style.bottom = '20px';
                chatContainer.style.height = '450px'; // 初期サイズ

                // ウィンドウを表示する
                chatContainer.classList.remove('hidden');
                
                // 変更後の状態を保存
                saveState();
            }
            // ウィンドウが表示されている場合は、何もしない
        });
    }
    if (widgetCloseButton) {
        widgetCloseButton.addEventListener('click', () => {
            chatContainer.classList.add('hidden');
            saveState();
        });
    }

    if (newChatButton) {
        newChatButton.addEventListener('click', () => {
            addInitialBotMessage(); 
        });
    }

    // --- ドラッグ＆リサイズのロジック ---
    let isDragging = false, isResizing = false;
    let initialTop, initialLeft, initialHeight, initialMouseX, initialMouseY;

    if (header) {
        header.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            const rect = chatContainer.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;
            document.body.style.userSelect = 'none';
            chatContainer.style.transition = 'none';
        });
    }

    if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isResizing = true;
            const rect = chatContainer.getBoundingClientRect();
            initialHeight = rect.height;
            initialMouseY = e.clientY;
            chatContainer.style.top = `${rect.top}px`;
            chatContainer.style.bottom = 'auto';
            document.body.style.userSelect = 'none';
            chatContainer.style.transition = 'none';
        });
    }

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - initialMouseX;
            const dy = e.clientY - initialMouseY;
            chatContainer.style.left = `${initialLeft + dx}px`;
            chatContainer.style.top = `${initialTop + dy}px`;
            chatContainer.style.bottom = 'auto';
            chatContainer.style.right = 'auto';
        }
        if (isResizing) {
            const dy = e.clientY - initialMouseY;
            const newHeight = initialHeight + dy;
            const minHeight = 250;
            const maxHeight = window.innerHeight * 0.9;
            if (newHeight >= minHeight && newHeight <= maxHeight) {
                chatContainer.style.height = `${newHeight}px`;
            }
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDragging || isResizing) {
            document.body.style.userSelect = '';
            chatContainer.style.transition = '';
            saveState();
            const rect = chatContainer.getBoundingClientRect();
            chatContainer.style.right = `${window.innerWidth - rect.right}px`;
            chatContainer.style.bottom = `${window.innerHeight - rect.bottom}px`;
            chatContainer.style.top = 'auto';
            chatContainer.style.left = 'auto';
            isDragging = false;
            isResizing = false;
        }
    });

    // --- チャット機能 ---
    let userId = localStorage.getItem('chatbotUserId');
    if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem('chatbotUserId', userId);
    }
    
    if (chatInput) {
        chatInput.addEventListener('input', () => { sendButton.disabled = chatInput.value.trim() === ''; });
        chatInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !sendButton.disabled) handleSendMessage(); });
    }
    
    if (sendButton) { sendButton.addEventListener('click', handleSendMessage); }

    async function handleSendMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;
        chatInput.value = '';
        sendButton.disabled = true;
        addMessage(messageText, 'user');
        saveState();
        const loadingMessageElement = addMessage('考えています...初回の質問には時間が掛かる場合があります。', 'bot', true);
        try {
            const response = await fetch(`${SERVER_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText, userId: userId }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.reply || 'サーバーエラーが発生しました。');
            }
            const data = await response.json();
            removeMessage(loadingMessageElement.id);
            addMessage(data.reply, 'bot');
        } catch (error) {
            console.error('通信エラー:', error);
            removeMessage(loadingMessageElement.id);
            addMessage('申し訳ありません、通信エラーが発生しました。', 'bot');
        } finally {
            saveState();
        }
    }

    function addMessage(text, sender, isLoading = false) {
        const messageId = `msg-${Date.now()}-${Math.random()}`;
        const messageElement = document.createElement('div');
        messageElement.id = messageId;
        messageElement.classList.add('chat-widget-message', `${sender}-message`);
        const pElement = document.createElement('p');
        if (isLoading) {
            messageElement.classList.add('loading-message');
            pElement.textContent = text;
        } else if (sender === 'bot') {
            const htmlWithLinks = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            if (typeof DOMPurify !== 'undefined') {
                pElement.innerHTML = DOMPurify.sanitize(htmlWithLinks, { ADD_ATTR: ['target'] });
            } else {
                pElement.innerHTML = htmlWithLinks;
            }
        } else {
            pElement.textContent = text;
        }
        messageElement.appendChild(pElement);
        if (messagesContainer) {
            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        return messageElement;
    }

    function removeMessage(messageId) {
        const messageToRemove = document.getElementById(messageId);
        if (messageToRemove) { messageToRemove.remove(); }
    }

    function addInitialBotMessage() {
        if (!messagesContainer) return;
        messagesContainer.innerHTML = '';
        addMessage('こんにちは！キャンピングカーに関するご質問にAIがお答えします。', 'bot');
        saveState();
    }

    // --- 初期化実行 ---
    restoreState();
}