// js/chat-loader.js (修正版)
(function() {
    document.addEventListener('DOMContentLoaded', function() {

        // --- 修正点 1: 動的に基準パスを取得 ---
        // このスクリプト自身のパスから、サイトのルートを基準にしたパスを生成します。
        const loaderScript = document.querySelector('script[src*="js/chat-loader.js"]');
        let basePath = '';
        if (loaderScript) {
            // 例: srcが "../js/chat-loader.js" の場合、"../" を basePath とする
            const src = loaderScript.getAttribute('src');
            basePath = src.substring(0, src.indexOf('js/chat-loader.js'));
        }


        // 1. CSSの読み込み
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        // --- 修正点 2: パスの先頭に取得した基準パスを追加 ---
        cssLink.href = basePath + 'wp-content/themes/kpi/css/chat-widget.css';
        document.head.appendChild(cssLink);

        // 2. DOMPurifyライブラリの読み込み
        const purifyScript = document.createElement('script');
        purifyScript.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.0/dist/purify.min.js';
        document.head.appendChild(purifyScript);

        // 3. チャットボタンのHTMLを挿入
        const navGnav = document.querySelector('#gnav');
        const searchBox = document.querySelector('#gnav .searchbox');
        if (navGnav && searchBox) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'ai-chat-button-container';
            buttonContainer.innerHTML = '<button id="ai-chat-toggle-button">AI相談</button>';
            navGnav.insertBefore(buttonContainer, searchBox);
        }

        // 4. チャットウィンドウのHTMLを挿入
        const widgetHTML = `
            <div id="chat-widget-container" class="hidden">
                <div id="chat-widget-header">
                    <span id="chat-widget-title">AIに相談</span>
                    <div class="chat-header-buttons">
                        <button id="chat-widget-new-button">新規</button>
                        <button id="chat-widget-close-button">×</button>
                    </div>
                </div>
                <div id="chat-widget-messages"></div>
                <div id="chat-widget-input-container">
                    <input type="text" id="chat-widget-input" placeholder="メッセージを入力...">
                    <button id="chat-widget-send-button">送信</button>
                </div>
                <div id="chat-widget-resize-handle"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);

        // 5. チャットの動作ロジック（chat-widget.js）を読み込む
        purifyScript.onload = function() {
            const widgetScript = document.createElement('script');
            // --- 修正点 3: パスの先頭に取得した基準パスを追加 ---
            widgetScript.src = basePath + 'js/chat-widget.js';
            
            widgetScript.onload = function() {
                // 既に存在する関数を呼び出す
                if (typeof initializeChatWidget === 'function') {
                    initializeChatWidget();
                }
            };
            
            document.body.appendChild(widgetScript);
        };
        // CDNが読み込めなかった場合のエラー処理
        purifyScript.onerror = function() {
             console.error("DOMPurify could not be loaded from CDN.");
             // DOMPurifyがなくても、widgetScriptの読み込みは試みる
             const widgetScript = document.createElement('script');
             widgetScript.src = basePath + 'js/chat-widget.js';
             widgetScript.onload = function() {
                if (typeof initializeChatWidget === 'function') {
                    initializeChatWidget();
                }
             };
             document.body.appendChild(widgetScript);
        };
    });
})();