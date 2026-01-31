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

const API_BASE = 'http://localhost:5000';

function App() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState('simple'); // simple, catalog, browser
  const [downloadingId, setDownloadingId] = useState(null);

  const browserTitleRef = useRef('');

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
    setDownloadingId(format.id);
    try {
      const response = await axios.post(`${API_BASE}/download`, {
        url: format.url,
        format_id: format.id,
        referer: videoData.referer || url, // Priorité au referer détecté par le radar
        title: videoData.title
      }, {
        responseType: 'blob'
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
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
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
              <p className="hero-subtitle">Le moteur le plus puissant pour YouTube, Facebook et vos Animes préférés.</p>

              <form className="search-bar-hero" onSubmit={handleAnalyze}>
                <div className="search-input-group">
                  <Search size={22} className="search-icon" />
                  <input
                    type="text"
                    className="search-input-hero"
                    placeholder="Collez un lien ici..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={isAnalyzing || !url}>
                  {isAnalyzing ? <Loader2 className="spinning" size={20} /> : <Download size={20} />}
                  <span>Analyser</span>
                </button>
              </form>

              <div className="info-cards">
                <div className="info-card">
                  <CheckCircle size={20} className="text-accent" />
                  <p>1400+ Sites supportés</p>
                </div>
                <div className="info-card">
                  <Globe size={20} className="text-accent" />
                  <p>Mode Radar Intégré</p>
                </div>
              </div>
            </motion.div>
          </div>
        ) : mode === 'catalog' ? (
          <CatalogMode />
        ) : (
          <BrowserMode
            onExit={() => setMode('simple')}
            onTitleUpdate={(t) => { if (t) browserTitleRef.current = t; }}
            onVideoDetected={(data) => setVideoData(data)}
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

      <AnimatePresence>
        {mode === 'browser' && videoData && (
          <motion.div
            className="browser-download-bar-premium"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
          >
            <div className="detection-badge">NOUVELLE VIDÉO</div>
            <div className="bar-title">{videoData.title}</div>
            <div className="bar-actions">
              {videoData.formats.slice(0, 2).map(fmt => (
                <button key={fmt.id} className="mini-download-btn" onClick={() => handleDownload(fmt)} disabled={downloadingId === fmt.id}>
                  {downloadingId === fmt.id ? <Loader2 className="spinning" size={14} /> : <Download size={14} />}
                  {fmt.resolution.split(' ')[0]}
                </button>
              ))}
              <button className="bar-close" onClick={() => setVideoData(null)}><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
