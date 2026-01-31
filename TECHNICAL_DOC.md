# 📚 Documentation Technique - DownAnime

## Table des Matières

1. [Architecture Globale](#architecture-globale)
2. [Frontend React](#frontend-react)
3. [Backend Flask](#backend-flask)
4. [Flux de Données](#flux-de-données)
5. [Limitations Web](#limitations-web)
6. [Optimisations](#optimisations)
7. [Sécurité](#sécurité)

---

## 🏗️ Architecture Globale

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                     UTILISATEUR                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              FRONTEND - React + Vite                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │  1. Input URL                                    │   │
│  │  2. Iframe Viewer (affiche la page cible)       │   │
│  │  3. Bouton "Analyser"                           │   │
│  │  4. Modal de sélection format                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP (axios)
                  ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND - Flask API                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  /analyze  → yt-dlp extraction                  │   │
│  │  /download → yt-dlp download + cleanup          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
          ┌──────────────┐
          │   yt-dlp     │ → Analyse et extraction
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │   FFmpeg     │ → Traitement optionnel (HLS)
          └──────────────┘
```

---

## ⚛️ Frontend React

### Technologies Utilisées

| Techno | Version | Usage |
|--------|---------|-------|
| React | 19.2 | Composants et hooks |
| Vite | 7.2 | Build et dev server |
| Framer Motion | 12.29 | Animations |
| Lucide React | 0.563 | Icônes |
| Axios | 1.13 | Requêtes HTTP |

### Structure des Composants

#### App.jsx - Composant Principal

```jsx
┌──────────────────────────────────────┐
│          App Component                │
├──────────────────────────────────────┤
│  État:                                │
│  - url: string                        │
│  - currentUrl: string                 │
│  - isAnalyzing: boolean               │
│  - videoData: object                  │
│  - showModal: boolean                 │
│  - downloadingId: string              │
├──────────────────────────────────────┤
│  Méthodes:                            │
│  - handleOpen()                       │
│  - handleAnalyze()                    │
│  - handleDownload(format)             │
└──────────────────────────────────────┘
```

#### Gestion d'État

```javascript
// État local avec useState
const [url, setUrl] = useState('');           // URL saisie
const [currentUrl, setCurrentUrl] = useState(''); // URL chargée
const [videoData, setVideoData] = useState(null); // Données vidéo
const [showModal, setShowModal] = useState(false); // Affichage modal
```

**Pourquoi pas Context API ou Redux ?**
- Application simple avec peu de niveaux de composants
- Pas de props drilling complexe
- Performance optimale avec hooks locaux

### Workflow Utilisateur

```
1. Saisir URL
   ↓
2. Clic "Ouvrir"
   ↓ handleOpen()
   - Normalise l'URL (ajoute https://)
   - Met à jour currentUrl
   - Charge l'iframe
   ↓
3. Navigation dans l'iframe
   (utilisateur explore le site)
   ↓
4. Clic "Détecter & Télécharger"
   ↓ handleAnalyze()
   - Appel POST /analyze
   - Affichage spinner
   - Réception des formats
   - Ouverture du modal
   ↓
5. Sélection format
   ↓ handleDownload(format)
   - Appel POST /download
   - responseType: 'blob'
   - Création URL temporaire
   - Téléchargement via <a>
   - Cleanup
```

### Iframe - Contraintes et Solutions

#### Problématique

```javascript
// ❌ Impossible côté client
iframe.contentWindow.document // SecurityError: Cross-origin

// Les scripts de l'iframe ne peuvent pas communiquer
// avec le parent à cause de CORS
```

#### Solution Adoptée

```javascript
// ✅ Backend analyse à la place
// L'utilisateur fournit l'URL
// yt-dlp fait le travail d'analyse
<iframe 
  src={currentUrl}
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
/>
```

**Attribut `sandbox`** :
- `allow-same-origin` : Permet à l'iframe de fonctionner normalement
- `allow-scripts` : Autorise JavaScript (nécessaire pour les sites modernes)
- `allow-forms` : Permet la soumission de formulaires
- `allow-popups` : Autorise les popups (certains players vidéo)

### Système de Design

#### Variables CSS (index.css)

```css
:root {
  /* Palette dark premium */
  --bg-primary: #0a0e1a;      /* Fond très sombre */
  --bg-secondary: #1a1f35;    /* Cartes et modaux */
  
  /* Gradient vibrant */
  --accent-color: #8b5cf6;    /* Violet */
  --accent-secondary: #ec4899; /* Rose */
  
  /* Effets glassmorphism */
  --glass-bg: rgba(30, 41, 59, 0.7);
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

#### Animations Clés

1. **gradientFlow** (Logo)
```css
@keyframes gradientFlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
/* Effet de gradient qui "coule" */
```

2. **pulse** (Bouton FAB)
```css
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(..., 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(..., 0); }
}
/* Effet de vague qui s'étend */
```

3. **slideDown** (Header)
```css
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Apparition fluide de haut en bas */
```

#### Glassmorphism

Technique utilisée pour créer l'effet verre dépoli :

```css
.element {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

**Composants** :
- `backdrop-filter: blur()` : Floute le fond
- Bordure semi-transparente : Effet de lumière
- Ombre interne : Profondeur 3D

---

## 🐍 Backend Flask

### Architecture API

```python
┌──────────────────────────────────────┐
│         Flask Application             │
├──────────────────────────────────────┤
│  Middlewares:                         │
│  - CORS (allow all origins)           │
│  - JSON error handlers                │
├──────────────────────────────────────┤
│  Routes:                              │
│  - POST /analyze                      │
│  - POST /download                     │
├──────────────────────────────────────┤
│  Services:                            │
│  - yt-dlp integration                 │
│  - File management                    │
│  - Cleanup scheduler                  │
└──────────────────────────────────────┘
```

### Endpoint /analyze

#### Processus Détaillé

```python
POST /analyze
  ↓
1. Validation URL
  ↓
2. ydl.extract_info(url, download=False)
   ├─ Requête HTTP vers la page
   ├─ Parsing HTML
   ├─ Extraction métadonnées
   ├─ Détection formats vidéo
   └─ Retour dictionnaire info
  ↓
3. Filtrage formats
   - Garde uniquement mp4/m3u8
   - Supprime duplicatas
   - Tri par qualité (bitrate)
  ↓
4. Retour JSON
   {
     "title": "...",
     "thumbnail": "...",
     "duration": 120,
     "formats": [...]
   }
```

#### Code Clé

```python
# Configuration yt-dlp
ydl_opts = {
    'quiet': True,         # Pas d'output console
    'no_warnings': True,   # Supprime warnings
}

# Filtrage intelligent
for f in info['formats']:
    ext = f.get('ext')
    if ext not in ['mp4', 'm3u8']:
        continue  # Ignore les autres formats
    
    resolution = f.get('resolution') or f'{f.get("width")}x{f.get("height")}'
    # Construction de la clé unique pour éviter doublons
    key = f"{resolution}-{note}-{ext}"
```

### Endpoint /download

#### Processus Détaillé

```python
POST /download
  ↓
1. Validation params (url, format_id)
  ↓
2. Génération nom unique
   uid = uuid.uuid4()
  ↓
3. yt-dlp téléchargement
   ydl.download([url])
   ├─ Télécharge vidéo
   ├─ Merge audio si besoin
   └─ Sauvegarde fichier
  ↓
4. Recherche fichier téléchargé
   glob.glob(f"{uid}_*")
  ↓
5. Envoi fichier
   send_file(path, as_attachment=True)
  ↓
6. Cleanup après envoi
   @after_this_request
   def remove_file(response):
       os.remove(file_path)
```

#### Gestion Mémoire et Stockage

**Stratégies de cleanup** :

1. **Immédiat** : Suppression après envoi
```python
@after_this_request
def remove_file(response):
    try:
        os.remove(file_path)
    except Exception as e:
        print(f"Error removing: {e}")
    return response
```

2. **Scheduled** : Nettoyage au démarrage
```python
def clean_old_files():
    now = time.time()
    for f in os.listdir(DOWNLOAD_FOLDER):
        if os.stat(f).st_mtime < now - 3600:  # 1 heure
            os.remove(f)
```

**Pourquoi cette approche ?**
- Pas de base de données nécessaire
- Aucun stockage permanent
- Conformité RGPD (données temporaires)

### yt-dlp - Cœur de l'Extraction

#### Formats Supportés

yt-dlp supporte **1400+ sites** dont :
- YouTube, Vimeo, Dailymotion
- Twitch, TikTok, Twitter
- Sites généralistes
- Sites de streaming

#### Comment ça fonctionne ?

```
URL fournie
  ↓
yt-dlp analyse le HTML
  ↓
Cherche patterns connus:
  - Balises <video>
  - Players JavaScript (JW Player, Video.js)
  - URLs de manifeste (.m3u8, .mpd)
  - APIs vidéo
  ↓
Extrait les URLs de flux
  ↓
Parse manifestes (HLS, DASH)
  ↓
Retourne liste de formats
```

#### Exemple de format retourné

```python
{
  'format_id': '22',
  'ext': 'mp4',
  'width': 1280,
  'height': 720,
  'resolution': '1280x720',
  'format_note': '720p',
  'filesize': 45678901,
  'tbr': 1200,  # Total bitrate (kb/s)
  'vcodec': 'avc1.64001F',
  'acodec': 'mp4a.40.2',
  'url': 'https://...'
}
```

### FFmpeg - Traitement Vidéo

#### Rôle de FFmpeg

1. **Fusion HLS** (HTTP Live Streaming)
```bash
# yt-dlp utilise FFmpeg pour fusionner les segments .ts
ffmpeg -i playlist.m3u8 -c copy output.mp4
```

2. **Merge Audio+Vidéo**
```bash
# Certains formats séparent audio et vidéo
ffmpeg -i video.mp4 -i audio.m4a -c copy output.mp4
```

3. **Conversion**
```bash
# Conversion de formats si nécessaire
ffmpeg -i input.webm -c:v libx264 -c:a aac output.mp4
```

**Installation automatique** :
yt-dlp détecte automatiquement FFmpeg dans le PATH et l'utilise si disponible.

---

## 🔄 Flux de Données

### Scénario Complet

```
[UTILISATEUR]
    ↓ Colle URL
[Frontend]
    ↓ setState(url)
    ↓ handleOpen()
    ↓ <iframe src={url} />
[Iframe affiche la page]
    ↓ Utilisateur clique "Analyser"
[Frontend]
    ↓ axios.post('/analyze', {url})
[Backend]
    ↓ yt_dlp.extract_info(url)
[yt-dlp]
    ↓ HTTP GET vers URL
    ↓ Parse HTML/JSON
    ↓ Détecte vidéos
    ↓ Return formats[]
[Backend]
    ↓ Filtre et trie formats
    ↓ return JSON
[Frontend]
    ↓ setState(videoData)
    ↓ setShowModal(true)
[Modal s'affiche]
    ↓ Utilisateur choisit format
    ↓ handleDownload(formatId)
[Frontend]
    ↓ axios.post('/download', {url, formatId}, {responseType: 'blob'})
[Backend]
    ↓ yt_dlp.download([url])
    ↓ Fichier téléchargé en /downloads
    ↓ send_file(path)
[Frontend]
    ↓ Blob reçu
    ↓ URL.createObjectURL(blob)
    ↓ <a download href={objectURL}>.click()
[Navigateur déclenche téléchargement]
    ↓
[Backend]
    ↓ @after_this_request
    ↓ os.remove(file)
[Fichier supprimé]
```

### Format des Données

#### Request /analyze
```json
{
  "url": "https://example.com/video/12345"
}
```

#### Response /analyze
```json
{
  "title": "Awesome Video Title",
  "thumbnail": "https://example.com/thumb.jpg",
  "duration": 185,
  "formats": [
    {
      "id": "22",
      "ext": "mp4",
      "resolution": "1280x720",
      "note": "720p",
      "filesize": 45678901,
      "tbr": 1200
    },
    {
      "id": "18",
      "ext": "mp4",
      "resolution": "640x360",
      "note": "360p",
      "filesize": 12345678,
      "tbr": 500
    }
  ]
}
```

#### Request /download
```json
{
  "url": "https://example.com/video/12345",
  "format_id": "22"
}
```

#### Response /download
```
Content-Type: video/mp4
Content-Disposition: attachment; filename="video_title.mp4"
[Binary data]
```

---

## ⚠️ Limitations Web

### Pourquoi pas comme 1DM ?

#### 1DM sur Android

```
┌─────────────────────────────────────┐
│      Application Native Android      │
│  ┌───────────────────────────────┐  │
│  │  VPN / Proxy Local            │  │
│  │  INTERCEPTE TOUTES LES        │  │
│  │  REQUÊTES RÉSEAU              │  │
│  └───────────────────────────────┘  │
│           ↓                          │
│    Détecte .mp4, .m3u8, etc.        │
│    Propose téléchargement           │
└─────────────────────────────────────┘
```

**Permissions Android** :
- Accès réseau complet
- Modification du trafic
- Pas de Same-Origin Policy

#### Application Web

```
┌─────────────────────────────────────┐
│         Navigateur (Sandbox)         │
│  ┌───────────────────────────────┐  │
│  │  ❌ Impossible                 │  │
│  │  - Intercepter requêtes        │  │
│  │  - Lire contenu cross-origin   │  │
│  │  - Bypass CORS                 │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Sécurité navigateur** :
- Same-Origin Policy stricte
- CORS obligatoire
- Content Security Policy
- Sandboxing iframe

### Solutions de Contournement

#### ❌ Ce qui ne marche PAS

1. **Service Worker** pour intercepter fetch
```javascript
// ❌ Limité au même domaine
self.addEventListener('fetch', (event) => {
  // Ne peut pas intercepter les requêtes vers d'autres domaines
});
```

2. **Proxy CORS côté client**
```javascript
// ❌ Contournement fragile et bloquable
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
fetch(proxyUrl + targetUrl); // Souvent bloqué
```

3. **Extension navigateur**
```javascript
// ✅ Fonctionne mais nécessite installation
chrome.webRequest.onBeforeRequest.addListener(...);
// Hors scope de notre projet web pur
```

#### ✅ Solution Adoptée : Backend Analysis

```
Frontend                    Backend
  │                           │
  │  POST /analyze {url}      │
  │ ────────────────────────> │
  │                           │ yt-dlp.extract_info(url)
  │                           │   ↓
  │                           │ Analyse serveur-side
  │                           │ (pas de CORS)
  │                           │   ↓
  │       JSON {formats}      │
  │ <──────────────────────── │
  │                           │
```

**Avantages** :
- Pas de limitations CORS
- Accès réseau complet
- Même approche que les sites professionnels
- Stable et fiable

### Comparaison avec Sites Similaires

| Site | Approche | Tech Backend |
|------|----------|--------------|
| y2mate.com | Backend analysis | PHP/Python |
| savefrom.net | Backend analysis | Node.js |
| **DownAnime** | Backend analysis | **Flask + yt-dlp** |

**Constat** : Tous les sites web de téléchargement fonctionnent de cette manière.

---

## ⚡ Optimisations

### Frontend

#### 1. Lazy Loading

```jsx
// Les composants lourds pourraient être lazy-loaded
const Modal = React.lazy(() => import('./Modal'));

<Suspense fallback={<Spinner />}>
  <Modal />
</Suspense>
```

#### 2. Debounce Input

```javascript
// Éviter trop de re-renders lors de la saisie
const [url, setUrl] = useState('');
const debouncedUrl = useDebounce(url, 300);

useEffect(() => {
  // Validation uniquement après 300ms d'inactivité
  if (debouncedUrl) validateUrl(debouncedUrl);
}, [debouncedUrl]);
```

#### 3. Memoization

```jsx
// Éviter recalculs inutiles
const sortedFormats = useMemo(() => {
  return videoData?.formats.sort((a, b) => b.tbr - a.tbr);
}, [videoData]);
```

### Backend

#### 1. Cache yt-dlp

```python
# Cache les extractions récentes
from functools import lru_cache

@lru_cache(maxsize=100)
def extract_info_cached(url):
    with yt_dlp.YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=False)
```

#### 2. Async Download

```python
# Pour téléchargements multiples futurs
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=3)

def async_download(url, format_id):
    future = executor.submit(download_video, url, format_id)
    return future
```

#### 3. Streaming Response

```python
# Pour gros fichiers
from flask import Response

def generate_file(path):
    with open(path, 'rb') as f:
        while chunk := f.read(8192):
            yield chunk

@app.route('/download')
def download():
    return Response(generate_file(path), mimetype='video/mp4')
```

---

## 🛡️ Sécurité

### Validation des Entrées

#### Frontend

```javascript
// Validation URL basique
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};
```

#### Backend

```python
# Validation stricte
from urllib.parse import urlparse

def is_safe_url(url):
    parsed = urlparse(url)
    
    # Whitelist protocols
    if parsed.scheme not in ['http', 'https']:
        return False
    
    # Blacklist localhost, private IPs
    if parsed.hostname in ['localhost', '127.0.0.1', '0.0.0.0']:
        return False
    
    return True
```

### Protection Injection

```python
# yt-dlp gère automatiquement l'échappement
# Mais validation supplémentaire :

import re

def sanitize_filename(filename):
    # Supprime caractères dangereux
    return re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
```

### Rate Limiting

```python
# Protection contre abus
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.remote_addr)

@app.route('/analyze')
@limiter.limit("10 per minute")
def analyze():
    # ...
```

### CORS Sécurisé

```python
# En production, restreindre les origins
CORS(app, resources={
    r"/*": {
        "origins": ["https://yourdomain.com"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type"]
    }
})
```

### Stockage Temporaire Sécurisé

```python
# Limiter taille fichiers
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB

ydl_opts = {
    'max_filesize': MAX_FILE_SIZE,
    # ...
}
```

---

## 📊 Performances

### Métriques Typiques

| Opération | Temps moyen |
|-----------|-------------|
| Analyse URL | 2-5 sec |
| Download 720p (100MB) | 10-30 sec |
| Render frontend | < 100ms |
| API response (metadata) | < 1 sec |

### Optimisations Futures

1. **CDN** pour fichiers statiques
2. **Redis cache** pour métadonnées
3. **WebSocket** pour progress en temps réel
4. **Compression** des réponses API
5. **Service Worker** pour cache offline

---

## 🔮 Évolution Technique

### Pistes d'Amélioration

#### 1. Architecture Microservices

```
Frontend → API Gateway → [
    Analysis Service (yt-dlp)
    Download Service (queue)
    Storage Service (S3)
]
```

#### 2. Queue System

```python
# Celery pour téléchargements asynchrones
from celery import Celery

celery = Celery('tasks', broker='redis://localhost:6379')

@celery.task
def download_async(url, format_id):
    # Download en background
    pass
```

#### 3. WebSocket Progress

```javascript
// Frontend
const ws = new WebSocket('ws://localhost:5000/download-progress');

ws.onmessage = (event) => {
  const { percent } = JSON.parse(event.data);
  setProgress(percent);
};
```

```python
# Backend avec Flask-SocketIO
from flask_socketio import SocketIO, emit

socketio = SocketIO(app)

def progress_hook(d):
    if d['status'] == 'downloading':
        emit('progress', {'percent': d['percent']})
```

---

**Document créé le** : 2026-01-30  
**Version** : 1.0  
**Maintenu par** : L'équipe DownAnime
