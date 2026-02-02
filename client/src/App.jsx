import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Download,
  PlayCircle,
  List,
  Globe,
  Film,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  History,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ReactPlayer from 'react-player';
import './App.css';
import BrowserMode from './BrowserMode';
import CatalogMode from './CatalogMode';
import DownloadBar from './DownloadBar';

const API_BASE = 'http://localhost:5000';

function App() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState('simple'); // simple, catalog, browser
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloads, setDownloads] = useState([]);

  const browserTitleRef = useRef('');
  const abortControllersRef = useRef({});

  useEffect(() => {
    // Écouteur spécial pour le RADAR Electron
    const handleVideoDetected = (event, data) => {
      console.log("🎁 Vidéo reçue du Radar:", data);
      setVideoData({
        title: browserTitleRef.current || data.title || "Vidéo détectée",
        referer: data.referer, // On stocke le referer détecté
        formats: [{ id: 'best', ext: 'mp4', resolution: 'Qualité Directe', url: data.url }]
      });
    };

    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.on('video-detected', handleVideoDetected);
      return () => ipcRenderer.removeListener('video-detected', handleVideoDetected);
    }
  }, []);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!url) return;

    setIsAnalyzing(true);
    setVideoData(null);
    try {
      const response = await axios.post(`${API_BASE}/analyze`, { url });
      setVideoData(response.data);
      if (mode !== 'browser') setShowModal(true);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'analyse.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = async (format) => {
    console.log("🖱️ CLIC TÉLÉCHARGEMENT SUR :", format);

    const downloadId = `dl-${Date.now()}`;
    const abortController = new AbortController();
    abortControllersRef.current[downloadId] = abortController;

    const downloadItem = {
      id: downloadId,
      title: videoData?.title || 'Vidéo',
      status: 'downloading',
      progress: 0,
      loaded: 0
    };

    setDownloads(prev => [...prev, downloadItem]);
    setDownloadingId(format.id);

    try {
      console.log(`📤 Envoi vers ${API_BASE}/download...`);
      const response = await axios.post(`${API_BASE}/download`, {
        url: format.url,
        format_id: format.id,
        referer: videoData.referer || url,
        title: videoData.title
      }, {
        responseType: 'blob',
        signal: abortController.signal,
        onDownloadProgress: (progressEvent) => {
          const loaded = progressEvent.loaded;
          const total = progressEvent.total;
          const progress = total ? Math.round((loaded * 100) / total) : 0;

          setDownloads(prev => prev.map(d =>
            d.id === downloadId ? { ...d, progress, loaded } : d
          ));
        }
      });

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'video.mp4';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setDownloads(prev => prev.map(d =>
        d.id === downloadId ? { ...d, status: 'completed', progress: 100 } : d
      ));

      setTimeout(() => {
        setDownloads(prev => prev.filter(d => d.id !== downloadId));
      }, 5000);

    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("📥 Téléchargement annulé par l'utilisateur");
        setDownloads(prev => prev.map(d =>
          d.id === downloadId ? { ...d, status: 'cancelled' } : d
        ));
      } else {
        console.error(err);
        setDownloads(prev => prev.map(d =>
          d.id === downloadId ? { ...d, status: 'error' } : d
        ));

        const errorMsg = err.response?.data?.error || "Erreur lors du téléchargement. Vérifiez que yt-dlp et FFmpeg sont bien installés dans le dossier server.";
        alert(errorMsg);
      }

      setTimeout(() => {
        setDownloads(prev => prev.filter(d => d.id !== downloadId));
      }, 5000);
    } finally {
      delete abortControllersRef.current[downloadId];
      setDownloadingId(null);
    }
  };

  const handleCancelDownload = (downloadId) => {
    if (abortControllersRef.current[downloadId]) {
      abortControllersRef.current[downloadId].abort();
    }
  };

  const handleRemoveDownload = (downloadId) => {
    setDownloads(prev => prev.filter(d => d.id !== downloadId));
  };

  return (
    <div className={`app-container ${mode === 'browser' ? 'browser-mode-active' : ''}`}>
      {mode !== 'browser' && (
        <header className="header">
          <motion.div
            className="logo"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="logo-icon-wrapper">
              <Film size={28} className="text-accent" />
            </div>
            <span>DownAnime <small>Elite</small></span>
          </motion.div>
        </header>
      )}

      <main className="main-content-new">
        {mode !== 'browser' && (
          <div className="mode-switcher">
            <button className={`switch-btn ${mode === 'simple' ? 'active' : ''}`} onClick={() => setMode('simple')}><PlayCircle size={18} /><span>Simple</span></button>
            <button className={`switch-btn ${mode === 'catalog' ? 'active' : ''}`} onClick={() => setMode('catalog')}><List size={18} /><span>Catalogue</span></button>
            <button className={`switch-btn ${mode === 'browser' ? 'active' : ''}`} onClick={() => setMode('browser')}><Globe size={18} /><span>Navigateur</span></button>
          </div>
        )}

        {mode === 'simple' ? (
          <div className="hero-container">
            <motion.div
              className="hero-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="hero-title">Téléchargez sans limites.</h1>
              <p className="hero-subtitle">Le moteur Elite pour <strong>YouTube</strong>, <strong>Facebook</strong>, <strong>TikTok</strong>, <strong>Instagram</strong> et +1400 sites.</p>

              <form className="search-bar-hero" onSubmit={handleAnalyze}>
                <div className="search-input-group">
                  <Search size={22} className="search-icon" />
                  <input
                    type="text"
                    className="search-input-hero"
                    placeholder="Collez le lien de la vidéo (YouTube, FB, TikTok...)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={isAnalyzing || !url}>
                  {isAnalyzing ? <Loader2 className="spinning" size={20} /> : <Download size={20} />}
                  <span>Analyser</span>
                </button>
              </form>

              <div className="social-badges">
                <span className="badge">YouTube</span>
                <span className="badge">Facebook</span>
                <span className="badge">Instagram</span>
                <span className="badge">TikTok</span>
              </div>

              <div className="info-cards">
                <div className="info-card">
                  <CheckCircle size={20} className="text-accent" />
                  <p>Qualité HD Maximale</p>
                </div>
                <div className="info-card">
                  <Globe size={20} className="text-accent" />
                  <p>Radar Anti-Blocage</p>
                </div>
              </div>
            </motion.div>
          </div>
        ) : mode === 'catalog' ? (
          <CatalogMode
            downloads={downloads}
            setDownloads={setDownloads}
            abortControllersRef={abortControllersRef}
          />
        ) : (
          <BrowserMode
            onExit={() => setMode('simple')}
            onTitleUpdate={(t) => { if (t) browserTitleRef.current = t; }}
            onVideoDetected={(data) => {
              if (data && data.formats && data.formats[0]) {
                handleDownload(data.formats[0]);
              }
            }}
            videoData={videoData}
          />
        )}
      </main>

      <AnimatePresence>
        {showModal && videoData && mode !== 'browser' && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal-content-premium"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h3>Vidéos Trouvées</h3>
                <button onClick={() => setShowModal(false)} className="close-btn"><X size={20} /></button>
              </div>

              <div className="video-preview-premium">
                {videoData.thumbnail ? (
                  <img src={videoData.thumbnail} alt="preview" />
                ) : (
                  <div className="placeholder-preview"><Film size={48} /></div>
                )}
                <div className="video-info-overlay">
                  <h4>{videoData.title}</h4>
                </div>
              </div>

              <div className="formats-grid">
                {videoData.formats.map(fmt => (
                  <button key={fmt.id} className="format-card" onClick={() => handleDownload(fmt)} disabled={downloadingId === fmt.id}>
                    <div className="format-info">
                      <span className="format-res">{fmt.resolution}</span>
                      <span className="format-ext">{fmt.ext.toUpperCase()}</span>
                    </div>
                    {downloadingId === fmt.id ? <Loader2 className="spinning" size={18} /> : <Download size={18} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DownloadBar
        downloads={downloads}
        onRemove={handleRemoveDownload}
        onCancel={handleCancelDownload}
      />
    </div>
  );
}

export default App;
