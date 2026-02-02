import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Globe, X, Home } from 'lucide-react';

export default function BrowserMode({ onVideoDetected, onTitleUpdate, onExit, videoData }) {
    const [url, setUrl] = useState('https://v5.voiranime.com');
    const [inputUrl, setInputUrl] = useState('https://v5.voiranime.com');
    const [isLoading, setIsLoading] = useState(false);
    const webviewRef = useRef(null);

    // ... (rest of the logic remains the same)

    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview) return;

        webview.setAttribute('allowpopups', 'true');
        webview.setAttribute('plugins', 'true');

        const handleStartLoading = () => setIsLoading(true);
        const handleStopLoading = () => setIsLoading(false);
        const handleNavigate = (e) => setInputUrl(e.url);
        const handleTitleUpdate = (e) => {
            if (e.title && onTitleUpdate) onTitleUpdate(e.title);
        };

        webview.addEventListener('did-start-loading', handleStartLoading);
        webview.addEventListener('did-stop-loading', handleStopLoading);
        webview.addEventListener('did-navigate', handleNavigate);
        webview.addEventListener('did-navigate-in-page', handleNavigate);
        webview.addEventListener('page-title-updated', handleTitleUpdate);

        return () => {
            if (webview) {
                webview.removeEventListener('did-start-loading', handleStartLoading);
                webview.removeEventListener('did-stop-loading', handleStopLoading);
                webview.removeEventListener('did-navigate', handleNavigate);
                webview.removeEventListener('did-navigate-in-page', handleNavigate);
                webview.removeEventListener('page-title-updated', handleTitleUpdate);
            }
        };
    }, [onTitleUpdate]);

    const handleNavigateSubmit = (e) => {
        e.preventDefault();
        let target = inputUrl.trim();
        if (!target.includes('.') || target.includes(' ')) {
            target = 'https://www.google.com/search?q=' + encodeURIComponent(target);
        } else if (!target.startsWith('http')) {
            target = 'https://' + target;
        }
        setUrl(target);
    };

    return (
        <div className="browser-container-premium" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#0f172a' }}>

            {/* Toolbar Premium Glassmorphism */}
            <div className="browser-toolbar-premium" style={{
                display: 'flex',
                gap: '12px',
                padding: '10px 20px',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
                alignItems: 'center',
                zIndex: 100
            }}>
                <button onClick={onExit} className="elite-nav-btn home" title="Home">
                    <Home size={20} />
                </button>

                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>

                <div className="nav-controls" style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => webviewRef.current?.goBack()} className="elite-nav-btn"><ArrowLeft size={20} /></button>
                    <button onClick={() => webviewRef.current?.goForward()} className="elite-nav-btn"><ArrowRight size={20} /></button>
                    <button onClick={() => webviewRef.current?.reload()} className="elite-nav-btn">
                        <RotateCw size={19} className={isLoading ? 'spinning' : ''} />
                    </button>
                </div>

                <form onSubmit={handleNavigateSubmit} style={{ flex: 1, marginLeft: '8px' }}>
                    <div className="elite-url-bar">
                        <Globe size={16} className="url-icon" />
                        <input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            className="elite-url-input"
                        />
                    </div>
                </form>

                {videoData && (
                    <button
                        onClick={() => onVideoDetected(videoData)}
                        className="elite-download-btn pulse-glow"
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
                            animation: 'pulse 1.5s infinite'
                        }}
                    >
                        <ArrowRight size={18} />
                        TÉLÉCHARGER
                    </button>
                )}
            </div>

            {/* Webview Area */}
            <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                <webview
                    ref={webviewRef}
                    src={url}
                    style={{ width: '100%', height: '100%' }}
                    webpreferences="nativeWindowOpen=yes, contextIsolation=false"
                ></webview>

                {isLoading && (
                    <div className="loading-progress-bar"></div>
                )}
            </div>

            <style>{`
                .elite-nav-btn {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    color: #94a3b8;
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .elite-nav-btn:hover {
                    background: rgba(139, 92, 246, 0.15);
                    border-color: #8b5cf6;
                    color: white;
                    transform: translateY(-1px);
                }
                .elite-nav-btn.home {
                    background: rgba(139, 92, 246, 0.1);
                    color: #8b5cf6;
                    border-color: rgba(139, 92, 246, 0.2);
                }
                .elite-url-bar {
                    display: flex;
                    align-items: center;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 14px;
                    padding: 8px 16px;
                    transition: all 0.3s;
                }
                .elite-url-bar:focus-within {
                    border-color: #8b5cf6;
                    background: rgba(0, 0, 0, 0.5);
                    box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
                }
                .url-icon {
                    color: #64748b;
                    margin-right: 12px;
                }
                .elite-url-input {
                    background: transparent;
                    border: none;
                    color: #f1f5f9;
                    width: 100%;
                    outline: none;
                    font-size: 0.95rem;
                }
                .loading-progress-bar {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #8b5cf6, #ec4899, #8b5cf6);
                    background-size: 200% 100%;
                    animation: loading-bar 1.5s linear infinite;
                }
                @keyframes loading-bar {
                    0% { background-position: 100% 0; }
                    100% { background-position: -100% 0; }
                }
                .spinning { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
