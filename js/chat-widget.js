// js/chat-widget.js (最終完成版)

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

    // --- メインロジック ---

    // 画面幅に応じてフルスクリーン用のクラスを付け外しする
    function checkViewport() {
        if (!chatContainer) return;
        if (window.innerWidth <= 600) {
            chatContainer.classList.add('fullscreen-widget');
        } else {
            chatContainer.classList.remove('fullscreen-widget');
        }
    }

    // バージョン情報を非同期で取得して表示する
    async function fetchAndDisplayVersion() {
        try {
            const versionDisplay = document.getElementById('prompt-version-display');
            if (!versionDisplay) return;
            const response = await fetch(`${SERVER_URL}/api/get_active_prompt_version`);
            if (response.ok) {
                const data = await response.json();
                if (data.version) {
                    versionDisplay.textContent = `v${data.version}`;
                }
            }
        } catch (error) {
            console.error('Failed to fetch prompt version:', error);
        }
    }

    // --- 状態の保存・復元、メッセージの追加・削除 ---
    
    function saveState() {
        if (!chatContainer || !messagesContainer) return;
        const messagesToSave = Array.from(messagesContainer.querySelectorAll('.chat-widget-message')).map(msgElement => {
            const pElement = msgElement.querySelector('p');
            return {
                text: pElement ? pElement.innerHTML : '',
                sender: msgElement.classList.contains('bot-message') ? 'bot' : 'user',
                isLoading: msgElement.classList.contains('loading-message'),
                isHTML: true
            };
        });
        const state = {
            isHidden: chatContainer.classList.contains('hidden'),
            messages: messagesToSave
        };
        sessionStorage.setItem('chatWidgetState', JSON.stringify(state));
    }

    function loadState() {
        const stateJSON = sessionStorage.getItem('chatWidgetState');
        if (!stateJSON) {
            addInitialBotMessage();
            return;
        }
        const state = JSON.parse(stateJSON);
        if (messagesContainer) messagesContainer.innerHTML = '';
        if (state.messages && state.messages.length > 0) {
            state.messages.forEach(msg => addMessage(msg.text, msg.sender, msg.isLoading, msg.isHTML));
        } else {
            addInitialBotMessage();
        }
        if (chatContainer) {
            state.isHidden ? chatContainer.classList.add('hidden') : chatContainer.classList.remove('hidden');
        }
    }

    function addMessage(text, sender, isLoading = false, isHTML = false) {
        const messageId = `msg-${Date.now()}-${Math.random()}`;
        const messageElement = document.createElement('div');
        messageElement.id = messageId;
        messageElement.classList.add('chat-widget-message', `${sender}-message`);
        const pElement = document.createElement('p');
        if (isLoading) messageElement.classList.add('loading-message');

        if (isHTML) {
            pElement.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(text) : text;
        } else if (sender === 'bot') {
            const htmlWithLinks = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            pElement.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(htmlWithLinks) : htmlWithLinks;
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
        if (messageToRemove) messageToRemove.remove();
    }

    function addInitialBotMessage() {
        if (!messagesContainer) return;
        messagesContainer.innerHTML = '';
        addMessage('こんにちは！キャンピングカーに関するご質問にAIがお答えします。', 'bot', false, false);
        saveState();
    }

    async function handleSendMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;
        chatInput.value = '';
        sendButton.disabled = true;
        addMessage(messageText, 'user', false, false);
        saveState();

        const thinkingHTML = 'AIが思考中です<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
        const loadingMessageElement = addMessage(thinkingHTML, 'bot', true, true);
        const timeoutId = setTimeout(() => {
            if (document.getElementById(loadingMessageElement.id)) {
                const pElement = loadingMessageElement.querySelector('p');
                if (pElement) pElement.innerHTML = 'サーバーに接続しています、30~50秒お待ちいただく場合があります...';
            }
        }, 5000);

        try {
            let userId = localStorage.getItem('chatbotUserId');
            if (!userId) {
                userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                localStorage.setItem('chatbotUserId', userId);
            }
            const response = await fetch(`${SERVER_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText, userId: userId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.reply || 'サーバーエラーが発生しました。');
            removeMessage(loadingMessageElement.id);
            addMessage(data.reply, 'bot', false, false);
        } catch (error) {
            console.error('通信エラー:', error);
            removeMessage(loadingMessageElement.id);
            addMessage('申し訳ありません、通信エラーが発生しました。', 'bot', false, false);
        } finally {
            clearTimeout(timeoutId);
            saveState();
        }
    }

    // --- イベントリスナーの設定 ---
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            chatContainer.classList.toggle('hidden');
            if (!chatContainer.classList.contains('hidden')) {
                checkViewport();
            }
        });
    }
    if (widgetCloseButton) {
        widgetCloseButton.addEventListener('click', () => chatContainer.classList.add('hidden'));
    }
    if (newChatButton) {
        newChatButton.addEventListener('click', () => addInitialBotMessage());
    }
    if (chatInput) {
        chatInput.addEventListener('input', () => { sendButton.disabled = chatInput.value.trim() === ''; });
        chatInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !sendButton.disabled) handleSendMessage(); });
    }
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }
    window.addEventListener('resize', checkViewport);

    // --- 初期化実行 ---
    loadState();
    checkViewport();
    fetchAndDisplayVersion();
}