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
        purifyScript.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.0/dist/purify.min.js';
        
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
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <style>
                                @keyframes rotate {
                                from {
                                    transform: rotate(0deg);
                                }
                                to {
                                    transform: rotate(360deg);
                                }
                                }
                                .arrow {
                                animation: rotate 2s linear infinite;
                                }
                            </style>
                            <path class="arrow" d="M12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2ZM12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4ZM12 12L16 8L17.41 9.41L14 12.83L14 18H10L10 12.83L6.59 9.41L8 8L12 12Z" fill="currentColor"/>
                            </svg></button>
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