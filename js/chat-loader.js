// js/chat-loader.js (最終修正版)
(function() {
    // 既にローダーが実行されている場合は、何もしない
    if (document.getElementById('chat-widget-container')) {
        return;
    }

    document.addEventListener('DOMContentLoaded', function() {
        // このスクリプト自身のパスから、サイトのルートを基準にしたパスを生成します。
        const loaderScript = document.querySelector('script[src*="js/chat-loader.js"]');
        if (!loaderScript) {
            console.error('chat-loader.js script tag not found.');
            return;
        }
        const src = loaderScript.getAttribute('src');
        const basePath = src.substring(0, src.indexOf('js/chat-loader.js'));

        // 1. CSSの読み込み
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = basePath + 'wp-content/themes/kpi/css/chat-widget.css';
        document.head.appendChild(cssLink);

        // 2. DOMPurifyライブラリの読み込み
        const purifyScript = document.createElement('script');
        purifyScript.src = 'js/purify.min.js';
        
        // 5. チャットの動作ロジック（chat-widget.js）を読み込む
        purifyScript.onload = function() {
            const widgetScript = document.createElement('script');
            widgetScript.src = basePath + 'js/chat-widget.js';
            widgetScript.onload = function() {
                if (typeof initializeChatWidget === 'function') {
                    initializeChatWidget();
                }
            };
            document.body.appendChild(widgetScript);
        };
        purifyScript.onerror = function() {
             console.error("DOMPurify could not be loaded. Proceeding without it.");
             const widgetScript = document.createElement('script');
             widgetScript.src = basePath + 'js/chat-widget.js';
             widgetScript.onload = function() {
                if (typeof initializeChatWidget === 'function') {
                    initializeChatWidget();
                }
             };
             document.body.appendChild(widgetScript);
        };
        document.head.appendChild(purifyScript);


        // 3. チャットボタンのHTMLを挿入
        const navGnav = document.querySelector('#gnav');
        const searchBox = document.querySelector('#gnav .searchbox');
        if (navGnav && searchBox) {
            // 既にボタンがないか確認
            if (!document.getElementById('ai-chat-toggle-button')) {
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'ai-chat-button-container';
                buttonContainer.innerHTML = '<button id="ai-chat-toggle-button">AI相談</button>';
                navGnav.insertBefore(buttonContainer, searchBox);
            }
        }

        // 4. チャットウィンドウのHTMLを挿入
        const widgetHTML = `
            <div id="chat-widget-container" class="hidden">
                <div id="chat-widget-header">
                    <div class="chat-widget-header-top">
                        <span id="chat-widget-title">AIに相談</span>
                        <span id="prompt-version-display"></span>
                        <div class="chat-header-buttons">
                            <button id="chat-widget-new-button" aria-label="新しい会話を開始">
                                <svg class="new-chat-icon" xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                                </svg>
                            </button>
                            <button id="chat-widget-close-button">×</button>
                        </div>
                    </div>
                    <div id="chat-widget-disclaimer">AIの回答は不正確な場合があります。正確な情報はお問い合わせください。</div>
                </div>
            <div id="chat-widget-content">
                <div id="chat-widget-messages"></div>
                <div id="chat-widget-input-container">
                    <input type="text" id="chat-widget-input" placeholder="メッセージを入力...">
                    <button id="chat-widget-send-button">送信</button>
                </div>
                <div id="chat-widget-resize-handle"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    });
})();