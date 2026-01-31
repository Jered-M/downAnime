# 🎬 DownAnime - Plateforme de Détection et Téléchargement de Vidéos

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.2-61dafb.svg)
![Flask](https://img.shields.io/badge/Flask-3.1-black.svg)

Une plateforme web moderne inspirée de 1DM, permettant de détecter et télécharger des vidéos depuis n'importe quelle URL web.

## ✨ Fonctionnalités

- 🔗 **Navigation Intégrée** : Ouvrir n'importe quelle URL dans un iframe intégré
- 🎯 **Détection Vidéo** : Analyse intelligente des pages avec yt-dlp
- 📥 **Téléchargement Multi-Format** : Support MP4, M3U8, et autres formats
- 🎨 **Interface Premium** : Design glassmorphism moderne avec animations fluides
- ⚡ **Performance** : Backend optimisé avec nettoyage automatique
- 🌐 **Multi-Qualité** : Choix parmi plusieurs résolutions disponibles

## 🏗️ Architecture Technique

### Frontend - React + Vite

- **React 19.2** avec Hooks modernes
- **Framer Motion** pour animations fluides
- **Lucide React** pour icônes élégantes
- **Axios** pour requêtes HTTP
- **Vite** pour build ultra-rapide
- Design **Glassmorphism** avec gradients animés

### Backend - Python Flask

- **Flask** API RESTful
- **yt-dlp** pour extraction vidéo intelligente
- **FFmpeg** pour traitement vidéo (optionnel)
- Gestion automatique des fichiers temporaires
- Support CORS pour développement

## 📦 Installation

### Prérequis

- Node.js 18+ et npm
- Python 3.8+
- pip

### 1️⃣ Installation Backend

```bash
cd server
pip install -r requirements.txt
```

**Note** : FFmpeg est recommandé pour le traitement HLS :
- Windows : `winget install FFmpeg` ou télécharger depuis [ffmpeg.org](https://ffmpeg.org)
- macOS : `brew install ffmpeg`
- Linux : `sudo apt install ffmpeg`

### 2️⃣ Installation Frontend

```bash
cd client
npm install
```

## 🚀 Lancement

### Option 1 : Développement

**Terminal 1 - Backend** :
```bash
cd server
python app.py
```
Le serveur démarre sur `http://localhost:5000`

**Terminal 2 - Frontend** :
```bash
cd client
npm run dev
```
L'application s'ouvre sur `http://localhost:5173`

### Option 2 : Production

**Build Frontend** :
```bash
cd client
npm run build
```

**Servir les fichiers** :
Configurer Flask pour servir les fichiers statiques depuis `client/dist`

## 🎮 Utilisation

1. **Coller une URL** : Entrez l'URL de la page contenant une vidéo
2. **Ouvrir la page** : Cliquez sur "Ouvrir" pour afficher la page dans l'iframe
3. **Lancer la vidéo** : Jouez la vidéo normalement sur la page
4. **Analyser** : Cliquez sur "Détecter & Télécharger" pour analyser la page
5. **Télécharger** : Choisissez la qualité et téléchargez votre vidéo

## 🔌 API Endpoints

### POST `/analyze`

Analyse une URL pour détecter les vidéos disponibles.

**Request** :
```json
{
  "url": "https://example.com/video"
}
```

**Response** :
```json
{
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": 120,
  "formats": [
    {
      "id": "22",
      "ext": "mp4",
      "resolution": "1280x720",
      "note": "720p",
      "filesize": 12345678,
      "tbr": 1200
    }
  ]
}
```

### POST `/download`

Télécharge une vidéo dans le format spécifié.

**Request** :
```json
{
  "url": "https://example.com/video",
  "format_id": "22"
}
```

**Response** : Fichier vidéo en téléchargement

## 🎨 Design System

### Couleurs

```css
--bg-primary: #0a0e1a;        /* Fond principal sombre */
--bg-secondary: #1a1f35;      /* Fond secondaire */
--accent-color: #8b5cf6;      /* Violet vibrant */
--accent-secondary: #ec4899;  /* Rose accent */
```

### Animations

- **slideDown** : Apparition du header
- **gradientFlow** : Animation du logo
- **pulse** : Pulsation du bouton FAB
- **fadeInScale** : Apparition du viewer
- **float** : Icône flottante

## ⚠️ Limitations Web

### Contraintes du Navigateur

❌ **Impossible** :
- Intercepter toutes les requêtes réseau (comme 1DM sur Android)
- Accéder directement aux vidéos protégées par DRM
- Contourner les restrictions CORS côté client

✅ **Solution** :
- **yt-dlp côté backend** compense ces limitations
- Même approche que les gros sites de téléchargement web
- Analyse intelligente des pages

### Compatibilité

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

## 🛡️ Considérations Légales

⚠️ **IMPORTANT** :

- Cette plateforme est un **outil technique** uniquement
- **Aucune vidéo n'est hébergée** sur la plateforme
- L'utilisateur **doit fournir l'URL** source
- Téléchargements **uniquement initiés par l'utilisateur**
- Respectez les **droits d'auteur** et **conditions d'utilisation** des sites sources
- Usage personnel uniquement

## 📂 Structure du Projet

```
DOWNANIME/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── App.jsx        # Composant principal
│   │   ├── App.css        # Styles de l'app
│   │   ├── index.css      # Styles globaux
│   │   └── main.jsx       # Point d'entrée
│   ├── index.html         # Template HTML
│   └── package.json       # Dépendances npm
│
├── server/                # Backend Flask
│   ├── app.py            # API Flask
│   ├── requirements.txt  # Dépendances Python
│   └── downloads/        # Fichiers temporaires (auto-nettoyé)
│
└── README.md             # Ce fichier
```

## 🔧 Configuration

### Variables d'Environnement (optionnel)

```bash
# Backend
FLASK_ENV=development
FLASK_PORT=5000

# Frontend
VITE_API_URL=http://localhost:5000
```

### Personnalisation

**Changer le port backend** :
```python
# server/app.py
app.run(host='0.0.0.0', port=YOUR_PORT, debug=True)
```

**Changer l'URL de l'API** :
```javascript
// client/src/App.jsx
const API_base = 'http://localhost:YOUR_PORT';
```

## 🐛 Dépannage

### Erreur CORS
- Vérifiez que le backend est bien démarré
- Vérifiez l'URL de l'API dans `App.jsx`

### Vidéo non détectée
- Certains sites utilisent des protections anti-scraping
- Essayez avec une URL différente
- Vérifiez les logs du backend

### Téléchargement échoué
- Vérifiez que FFmpeg est installé (pour HLS)
- Vérifiez l'espace disque disponible
- Certains formats peuvent ne pas être supportés

## 🚀 Améliorations Futures

- [ ] Historique des téléchargements
- [ ] Téléchargements multiples simultanés
- [ ] Support des sous-titres
- [ ] Conversion de format
- [ ] Dark/Light mode toggle
- [ ] Extension navigateur
- [ ] Gestion de queue de téléchargements
- [ ] Support playlist

## 👨‍💻 Développement

### Scripts Disponibles

**Frontend** :
```bash
npm run dev      # Serveur de développement
npm run build    # Build production
npm run preview  # Preview du build
npm run lint     # Linter ESLint
```

**Backend** :
```bash
python app.py    # Lancer le serveur
```

## 📝 License

MIT License - voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 💬 Support

Pour toute question ou problème :
- Ouvrir une [Issue](https://github.com/yourusername/downanime/issues)
- Consulter la [Documentation](https://github.com/yourusername/downanime/wiki)

## 🌟 Remerciements

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) pour l'extraction vidéo
- [Framer Motion](https://www.framer.com/motion/) pour les animations
- [Lucide](https://lucide.dev/) pour les icônes
- La communauté open source ❤️

---

**Fait avec ❤️ en React et Flask**
