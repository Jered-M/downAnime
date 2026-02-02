import React from 'react';
import { Download, CheckCircle, AlertCircle, X, Loader2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './DownloadBar.css';

export default function DownloadBar({ downloads, onRemove, onCancel }) {
    if (!downloads || downloads.length === 0) return null;

    return (
        <div className="download-bar-container">
            <AnimatePresence>
                {downloads.map((download) => (
                    <motion.div
                        key={download.id}
                        className={`download-item ${download.status}`}
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="download-icon">
                            {download.status === 'downloading' && <Loader2 className="spinning" size={20} />}
                            {download.status === 'completed' && <CheckCircle size={20} />}
                            {download.status === 'error' && <AlertCircle size={20} />}
                            {download.status === 'cancelled' && <XCircle size={20} />}
                        </div>

                        <div className="download-info">
                            <div className="download-title">{download.title}</div>
                            <div className="download-status-text">
                                {download.status === 'downloading' && (
                                    <>
                                        {download.progress > 0 && <span>{download.progress}% </span>}
                                        <span>({(download.loaded / 1024 / 1024).toFixed(1)} MB)</span>
                                    </>
                                )}
                                {download.status === 'completed' && 'Téléchargement terminé'}
                                {download.status === 'error' && 'Erreur de téléchargement'}
                                {download.status === 'cancelled' && 'Annulé'}
                            </div>
                            {download.status === 'downloading' && (
                                <div className="download-progress-bar">
                                    <div
                                        className={`download-progress-fill ${download.progress === 0 ? 'indeterminate' : ''}`}
                                        style={{ width: `${download.progress > 0 ? download.progress : 100}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        {download.status === 'downloading' ? (
                            <button
                                className="download-cancel-btn"
                                onClick={() => onCancel(download.id)}
                                title="Annuler le téléchargement"
                            >
                                <XCircle size={18} />
                            </button>
                        ) : (
                            <button
                                className="download-close-btn"
                                onClick={() => onRemove(download.id)}
                                title="Fermer"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
