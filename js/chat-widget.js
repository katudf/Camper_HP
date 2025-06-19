// js/chat-widget.js (ボタンクリックで位置をリセットする修正版)

// js/chat-widget.js の initializeChatWidget 関数を置き換える

function initializeChatWidget() {
    // 既に初期化済みの場合は何もしない
    if (window.chatWidgetInitialized) return;
    window.chatWidgetInitialized = true;

    // バージョン情報を非同期で取得して表示する
    async function fetchAndDisplayVersion() { /* ... この関数の内容は変更なし ... */ }
    fetchAndDisplayVersion();

    // --- 要素の取得 ---
    const toggleButton = document.getElementById('ai-chat-toggle-button');
    const chatContainer = document.getElementById('chat-widget-container');
    // ... (他の要素取得も変更なし) ...
    const SERVER_URL = 'https://camper-chatbot.onrender.com';

    // --- ★★★ 新しいシンプルなロジック ★★★ ---

    // 画面幅に応じてフルスクリーンクラスを付け外しする関数
    function checkViewport() {
        if (!chatContainer) return;
        if (window.innerWidth <= 600) {
            chatContainer.classList.add('fullscreen-widget');
        } else {
            chatContainer.classList.remove('fullscreen-widget');
        }
    }

    // ウィンドウのリサイズ時にもチェックを実行
    window.addEventListener('resize', checkViewport);

    // --- UI操作（開閉・新規）---
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            // 表示/非表示を切り替えるだけのシンプルな処理に変更
            chatContainer.classList.toggle('hidden');
            // 表示された時に、再度ビューポートをチェックしてスタイルを確定させる
            if (!chatContainer.classList.contains('hidden')) {
                checkViewport();
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

    // ... (これ以降の、状態保存・メッセージ送受信・ドラッグ＆リサイズのロジックは、あなたが提供した最新のコードのままでOKです) ...

    // --- ★★★ 初期化実行 ★★★ ---
    loadState();
    checkViewport(); // 初期読み込み時にもチェックを実行
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
    checkViewport(); // ★★★★★ 初期読み込み時にもチェックを実行 ★★★★★
