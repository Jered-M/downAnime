import React, { useState } from 'react';
import { Search, List, Loader2, Download, ExternalLink, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

export default function CatalogMode() {
    const [catalogUrl, setCatalogUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [episodes, setEpisodes] = useState([]);

    const handleAnalyzeCatalog = async (e) => {
        e.preventDefault();
        if (!catalogUrl) return;

        setIsAnalyzing(true);
        try {
            // Note: On utilise le même endpoint d'analyse ou un futur spécial catalogue
            const response = await axios.post(`${API_BASE}/analyze`, { url: catalogUrl });
            // Si le backend renvoie une liste d'épisodes (cas VoirAnime saison)
            if (response.data.episodes) {
                setEpisodes(response.data.episodes);
            } else {
                // Fallback : on met juste l'épisode trouvé
                setEpisodes([{
                    title: response.data.title || "Épisode trouvé",
                    url: catalogUrl,
                    id: '1'
                }]);
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'analyse du catalogue.");
        } finally {
            setIsAnalyzing(false);
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
                                className="episode-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="episode-num">{index + 1}</div>
                                <div className="episode-info">
                                    <h4>{ep.title}</h4>
                                    <span className="episode-status">Prêt</span>
                                </div>
                                <button className="episode-download-btn">
                                    <Download size={18} />
                                </button>
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
