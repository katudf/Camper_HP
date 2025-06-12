// js/chat-widget.js (ボタンクリックで位置をリセットする修正版)

function initializeChatWidget() {
    // 既に初期化済みの場合は何もしない
    if (window.chatWidgetInitialized) return;
    window.chatWidgetInitialized = true;

    // APIサーバーのURL (早期に定義して全体で共有)
    const SERVER_URL = 'https://camper-chatbot.onrender.com';

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
    fetchAndDisplayVersion();

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

    // ▼▼▼ 状態の保存・復元、メッセージ追加・削除の関数群をここに集約 ▼▼▼

    function saveState() {
        if (!chatContainer || !messagesContainer) return;
        
        const messagesToSave = [];
        messagesContainer.querySelectorAll('.chat-widget-message').forEach(msgElement => {
            const isBot = msgElement.classList.contains('bot-message');
            const isLoading = msgElement.classList.contains('loading-message');
            const sender = isBot ? 'bot' : 'user';
            
            const pElement = msgElement.querySelector('p');
            if(pElement){
                 messagesToSave.push({
                    text: pElement.innerHTML,
                    sender: sender,
                    isLoading: isLoading,
                    isHTML: true
                });
            }
        });

        const rect = chatContainer.getBoundingClientRect();
        const state = {
            isHidden: chatContainer.classList.contains('hidden'),
            position: {
                top: chatContainer.style.top,
                left: chatContainer.style.left,
                right: chatContainer.style.right,
                bottom: chatContainer.style.bottom,
                height: chatContainer.style.height,
                width: chatContainer.style.width
            },
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
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        if (state.messages && state.messages.length > 0) {
            state.messages.forEach(msg => {
                addMessage(msg.text, msg.sender, msg.isLoading, msg.isHTML);
            });
        } else {
            addInitialBotMessage();
        }
        if (chatContainer) {
            state.isHidden ? chatContainer.classList.add('hidden') : chatContainer.classList.remove('hidden');
        }
        if (chatContainer && state.position) {
            chatContainer.style.top = state.position.top;
            chatContainer.style.left = state.position.left;
            chatContainer.style.right = state.position.right;
            chatContainer.style.bottom = state.position.bottom;
            chatContainer.style.height = state.position.height;
            chatContainer.style.width = state.position.width;
        }
    }
    
    function addMessage(text, sender, isLoading = false, isHTML = false) {
        const messageId = `msg-${Date.now()}-${Math.random()}`;
        const messageElement = document.createElement('div');
        messageElement.id = messageId;
        messageElement.classList.add('chat-widget-message', `${sender}-message`);
        const pElement = document.createElement('p');

        if (isLoading) {
            messageElement.classList.add('loading-message');
        }

        if (isHTML) {
            // 履歴復元や思考中メッセージは、保存されたHTMLをそのまま（サニタイズ済みとして）解釈
             if (typeof DOMPurify !== 'undefined') {
                 // 履歴復元の際、リンクにtarget属性がなくても許可してしまうのを防ぐ
                pElement.innerHTML = DOMPurify.sanitize(text);
             } else {
                pElement.innerHTML = text;
             }
        } else if (sender === 'bot') {
            // 新規のBotメッセージはリンクを生成
            const htmlWithLinks = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
            if (typeof DOMPurify !== 'undefined') {
                pElement.innerHTML = DOMPurify.sanitize(htmlWithLinks);
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
        
        // ▼▼▼ 3秒後にメッセージを変更するタイマーを設定 ▼▼▼
        const timeoutId = setTimeout(() => {
            // loadingMessageElementがまだ画面に存在する場合のみ実行
            if (document.getElementById(loadingMessageElement.id)) {
                const pElement = loadingMessageElement.querySelector('p');
                if (pElement) {
                    pElement.innerHTML = 'サーバーに接続しています、30~50秒お待ちいただく場合があります...';
                }
            }
        }, 5000); // 5000ミリ秒 = 5秒

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
            addMessage(data.reply, 'bot', false, false); 
        } catch (error) {
            console.error('通信エラー:', error);
            removeMessage(loadingMessageElement.id);
            addMessage('申し訳ありません、通信エラーが発生しました。', 'bot', false, false);
        } finally {
            // ▼▼▼ 応答が返ってきたら、必ずタイマーを解除 ▼▼▼
            clearTimeout(timeoutId);
            saveState();
        }
    }

    // --- UI操作（開閉・新規）---
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            chatContainer.style.top = 'auto';
            chatContainer.style.left = 'auto';
            chatContainer.style.right = '20px';
            chatContainer.style.bottom = '20px';
            chatContainer.style.height = '450px';
            if (chatContainer.classList.contains('hidden')) {
                chatContainer.classList.remove('hidden');
            }
            saveState();
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
            e.preventDefault(); isDragging = true;
            const rect = chatContainer.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
            initialMouseX = e.clientX; initialMouseY = e.clientY;
            document.body.style.userSelect = 'none';
            chatContainer.style.transition = 'none';
        });
    }
    if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault(); isResizing = true;
            const rect = chatContainer.getBoundingClientRect();
            initialHeight = rect.height; initialMouseY = e.clientY;
            chatContainer.style.top = `${rect.top}px`;
            chatContainer.style.bottom = 'auto';
            document.body.style.userSelect = 'none';
            chatContainer.style.transition = 'none';
        });
    }
    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - initialMouseX; const dy = e.clientY - initialMouseY;
            chatContainer.style.left = `${initialLeft + dx}px`;
            chatContainer.style.top = `${initialTop + dy}px`;
            chatContainer.style.bottom = 'auto'; chatContainer.style.right = 'auto';
        }
        if (isResizing) {
            const dy = e.clientY - initialMouseY; const newHeight = initialHeight + dy;
            const minHeight = 250; const maxHeight = window.innerHeight * 0.9;
            if (newHeight >= minHeight && newHeight <= maxHeight) {
                chatContainer.style.height = `${newHeight}px`;
            }
        }
    });
    window.addEventListener('mouseup', () => {
        if (isDragging || isResizing) {
            document.body.style.userSelect = '';
            chatContainer.style.transition = '';
            const rect = chatContainer.getBoundingClientRect();
            chatContainer.style.right = `${window.innerWidth - rect.right}px`;
            chatContainer.style.bottom = `${window.innerHeight - rect.bottom}px`;
            chatContainer.style.top = 'auto'; chatContainer.style.left = 'auto';
            isDragging = false; isResizing = false;
            saveState();
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

    // --- ★★★ 初期化実行 ★★★ ---
    loadState(); 
}