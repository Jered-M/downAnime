import React from 'react';
import { Terminal, MousePointer2, Copy, Search, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const ExtractionGuide = () => {
    return (
        <div className="extraction-guide">
            <h3 className="guide-title">🚀 Guide d'Extraction Manuelle</h3>
            <p className="guide-intro">Si le serveur est bloqué par la protection de l'hébergeur, voici comment faire en 30 secondes :</p>

            <div className="guide-steps">
                <div className="step-card">
                    <div className="step-icon"><Terminal size={20} /></div>
                    <div className="step-content">
                        <h6>1. Ouvrir l'outil</h6>
                        <p>Allez sur la page de l'épisode et appuyez sur <strong>F12</strong> (Réseau / Network).</p>
                    </div>
                </div>

                <div className="step-card">
                    <div className="step-icon"><MousePointer2 size={20} /></div>
                    <div className="step-content">
                        <h6>2. Lancer la vidéo</h6>
                        <p>Appuyez sur "Play". Dans la liste des requêtes, cherchez <strong>"m3u8"</strong>.</p>
                    </div>
                </div>

                <div className="step-card">
                    <div className="step-icon"><Copy size={20} /></div>
                    <div className="step-content">
                        <h6>3. Copier & Coller</h6>
                        <p>Faites clic-droit sur le lien -{"&gt;"} <strong>Copy URL</strong>. Collez-le dans l'onglet "Analyse Simple" ici.</p>
                    </div>
                </div>
            </div>

            <div className="pro-tip">
                <strong>💡 Conseil Pro :</strong> Sur VoirAnime, préférez toujours les lecteurs <strong>SIB</strong> ou <strong>S-Cloud</strong>, ils sont beaucoup plus faciles à télécharger automatiquement !
            </div>
        </div>
    );
};

export default ExtractionGuide;
