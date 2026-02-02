import React, { useState } from 'react';
import { Search, List, Loader2, Download, ExternalLink, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './CatalogStyles.css';

const API_BASE = 'http://localhost:5000';

export default function CatalogMode({ downloads, setDownloads, abortControllersRef }) {
    const [catalogUrl, setCatalogUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [episodes, setEpisodes] = useState([]);
    const [downloadingIds, setDownloadingIds] = useState(new Set());

    const handleAnalyzeCatalog = async (e) => {
        e.preventDefault();
        if (!catalogUrl) return;

        setIsAnalyzing(true);
        setEpisodes([]);
        try {
            console.log("📋 Analyse du catalogue:", catalogUrl);
            const response = await axios.post(`${API_BASE}/catalog`, { url: catalogUrl });

            if (response.data.episodes && response.data.episodes.length > 0) {
                console.log(`✅ ${response.data.episodes.length} épisodes trouvés`);
                setEpisodes(response.data.episodes);
            } else {
                alert("Aucun épisode trouvé sur cette page. Assurez-vous d'être sur la page de la saison/série.");
            }
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || err.response?.data?.suggestion || "Erreur lors de l'analyse du catalogue.";
            alert(errorMsg);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDownloadEpisode = async (episode, index) => {
        const episodeId = `ep-${index}`;
        const downloadId = `dl-cat-${Date.now()}-${index}`;
        const abortController = new AbortController();

        if (abortControllersRef) {
            abortControllersRef.current[downloadId] = abortController;
        }

        setDownloadingIds(prev => new Set(prev).add(episodeId));
        setDownloads(prev => [...prev, {
            id: downloadId,
            title: episode.title,
            status: 'downloading',
            progress: 0,
            loaded: 0
        }]);

        try {
            console.log("📥 Téléchargement de:", episode.title);

            const analyzeResponse = await axios.post(`${API_BASE}/analyze`, { url: episode.url });

            if (analyzeResponse.data.formats && analyzeResponse.data.formats[0]) {
                const format = analyzeResponse.data.formats[0];

                const downloadResponse = await axios.post(`${API_BASE}/download`, {
                    url: format.url,
                    format_id: format.id,
                    referer: episode.url,
                    title: episode.title
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

                const downloadUrl = window.URL.createObjectURL(new Blob([downloadResponse.data]));
                const link = document.createElement('a');
                link.href = downloadUrl;

                const contentDisposition = downloadResponse.headers['content-disposition'];
                let fileName = `${episode.title}.mp4`;
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
            } else {
                setDownloads(prev => prev.map(d =>
                    d.id === downloadId ? { ...d, status: 'error' } : d
                ));
                alert("Impossible de trouver le lien de téléchargement pour cet épisode.");
            }
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
                alert("Erreur lors du téléchargement.");
            }
        } finally {
            if (abortControllersRef) {
                delete abortControllersRef.current[downloadId];
            }
            setDownloadingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(episodeId);
                return newSet;
            });

            setTimeout(() => {
                setDownloads(prev => prev.filter(d => d.id !== downloadId));
            }, 5000);
        }
    };

    return (
        <motion.div
            className="catalog-container-premium"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <div className="catalog-hero">
                <div className="catalog-icon-badge">
                    <List size={32} />
                </div>
                <h2 className="catalog-title">Mode Catalogue</h2>
                <p className="catalog-subtitle">Analysez une saison complète et téléchargez tous les épisodes en une fois.</p>

                <form className="catalog-search-bar" onSubmit={handleAnalyzeCatalog}>
                    <div className="search-input-group">
                        <Search size={22} className="search-icon" />
                        <input
                            type="text"
                            className="search-input-hero"
                            placeholder="Ex: https://v5.voiranime.com/anime/one-piece/"
                            value={catalogUrl}
                            onChange={(e) => setCatalogUrl(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={isAnalyzing || !catalogUrl}>
                        {isAnalyzing ? <Loader2 className="spinning" size={20} /> : <Play size={20} />}
                        <span>Analyser la Saison</span>
                    </button>
                </form>
            </div>

            <div className="catalog-results">
                {episodes.length > 0 ? (
                    <div className="episode-grid">
                        {episodes.map((ep, index) => (
                            <motion.div
                                key={index}
                                className="episode-card-premium"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="episode-thumbnail">
                                    {ep.thumbnail ? (
                                        <img src={ep.thumbnail} alt={ep.title} />
                                    ) : (
                                        <div className="thumbnail-placeholder">
                                            <Play size={32} />
                                        </div>
                                    )}
                                    <div className="episode-overlay">
                                        <span className="episode-number">#{index + 1}</span>
                                    </div>
                                </div>
                                <div className="episode-content">
                                    <h4 className="episode-title-text">{ep.title}</h4>
                                    <div className="episode-actions">
                                        <button
                                            className="episode-download-btn"
                                            onClick={() => handleDownloadEpisode(ep, index)}
                                            disabled={downloadingIds.has(`ep-${index}`)}
                                        >
                                            {downloadingIds.has(`ep-${index}`) ? (
                                                <>
                                                    <Loader2 className="spinning" size={16} />
                                                    <span>Téléchargement...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={16} />
                                                    <span>Télécharger</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : !isAnalyzing && (
                    <div className="empty-catalog">
                        <div className="empty-icon"><Search size={48} /></div>
                        <p>Aucun catalogue analysé pour le moment.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
