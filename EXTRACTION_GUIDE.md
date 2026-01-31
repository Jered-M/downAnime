# 🛠️ Guide : Extraire des Vidéos de Sites Non Supportés

## 🎯 Objectif

Ce guide vous explique comment **trouver l'URL directe** d'une vidéo sur des sites non supportés comme **voiranime.com**, afin de pouvoir l'utiliser avec DownAnime.

---

## 📖 Méthode 1 : Inspection via DevTools (Recommandée)

### Étape par Étape

#### 1️⃣ Ouvrir les Outils de Développement

Sur la page de la vidéo :
- **Windows/Linux** : Appuyez sur `F12`
- **Mac** : `Cmd + Option + I`
- Ou clic droit → "Inspecter"

#### 2️⃣ Aller dans l'onglet Network

![Network Tab](https://i.imgur.com/example.png)

1. Cliquez sur l'onglet **Network** (Réseau)
2. Activez le filtrage par type : **Media** ou **XHR**
3. Si des requêtes s'affichent déjà, cliquez sur 🚫 (Clear) pour nettoyer

#### 3️⃣ Lancer la Vidéo

Appuyez sur ▶️ Play sur la page.

Observez les requêtes qui apparaissent dans Network.

#### 4️⃣ Identifier le Flux Vidéo

Cherchez des fichiers avec ces extensions :

| Extension | Type | Description |
|-----------|------|-------------|
| **.m3u8** | HLS | Flux de segments (le plus courant) |
| **.mp4** | MP4 | Vidéo directe |
| **.mpd** | DASH | Flux adaptatif |
| **.ts** | Segment | Partie d'un flux HLS |

**Exemple d'URL à chercher** :
```
https://v6.voiranime.com/hls/episode123/master.m3u8
https://cdn.example.com/videos/video.mp4
```

#### 5️⃣ Copier l'URL

**Méthode A** : Clic droit sur la requête → **Copy → Copy link address**

**Méthode B** :
1. Cliquez sur la requête
2. Onglet **Headers**
3. Cherchez **Request URL**
4. Copiez l'URL complète

#### 6️⃣ Tester dans DownAnime

Collez l'URL directe dans DownAnime et analysez !

---

## 📖 Méthode 2 : Inspection du Code Source

### Pour les Players Simples

#### 1️⃣ Voir le Code Source

Sur la page de la vidéo :
- `Ctrl + U` (Windows/Linux)
- `Cmd + U` (Mac)

#### 2️⃣ Chercher les Mots-Clés

Utilisez `Ctrl + F` pour chercher :

```
.m3u8
.mp4
"src"
"source"
videoUrl
streamUrl
```

**Exemple de code trouvé** :
```html
<video>
  <source src="https://cdn.example.com/video.mp4" type="video/mp4">
</video>
```

Ou en JavaScript :
```javascript
var videoUrl = "https://v6.voiranime.com/streams/ep1.m3u8";
```

#### 3️⃣ Extraire et Tester

Copiez l'URL et testez-la directement dans votre navigateur ou DownAnime.

---

## 📖 Méthode 3 : Extensions Navigateur

### Extensions Recommandées

#### Chrome / Edge

1. **Video DownloadHelper**
   - [Lien Chrome Store](https://chrome.google.com/webstore)
   - Détecte automatiquement les vidéos
   - Affiche une icône quand une vidéo est trouvée

2. **Stream Recorder**
   - Capture les flux HLS/DASH
   - Export en MP4

#### Firefox

1. **Video DownloadHelper** (Recommandé)
   - Plus puissant sur Firefox
   - Détection automatique
   - Conversion intégrée

2. **Flash Video Downloader**
   - Simple et efficace

### Comment Utiliser

1. **Installez** l'extension
2. **Naviguez** vers la page de la vidéo
3. **Jouez** la vidéo
4. **Cliquez** sur l'icône de l'extension
5. **Copiez** l'URL détectée
6. **Collez** dans DownAnime

---

## 📖 Méthode 4 : Logiciels Dédiés

### JDownloader 2 (Gratuit)

**Détection automatique du presse-papiers**

1. **Téléchargez** : https://jdownloader.org/jdownloader2
2. **Installez** et lancez
3. **Copiez** l'URL de la page (Ctrl+C)
4. JDownloader **détecte** automatiquement
5. Regardez les URLs détectées
6. Copiez l'URL `.m3u8` ou `.mp4`

### IDM (Windows, Payant)

**Internet Download Manager**

1. **Installez** IDM
2. **Naviguez** vers la vidéo
3. **Jouez** la vidéo
4. IDM affiche **"Télécharger cette vidéo"**
5. Clic droit → **Copier le lien**

---

## 🎬 Cas Spécifique : voiranime.com

### Architecture Typique

Les sites d'anime comme voiranime utilisent souvent :

```
Page HTML
  ↓
Player JavaScript (JW Player, Video.js, custom)
  ↓
Appel API pour récupérer l'URL
  ↓
Flux HLS (.m3u8) hébergé sur CDN
  ↓
Segments vidéo (.ts)
```

### Stratégie d'Extraction

#### Option 1 : Intercepter l'Appel API

1. **DevTools** → **Network** → **XHR**
2. **Play** la vidéo
3. Cherchez une requête vers une API (ex: `/api/video/`, `/source/`, etc.)
4. **Cliquez** sur la requête
5. **Preview** ou **Response** : Vous devriez voir un JSON

**Exemple de réponse** :
```json
{
  "success": true,
  "sources": [
    {
      "file": "https://cdn.example.com/hls/master.m3u8",
      "label": "720p",
      "type": "hls"
    }
  ]
}
```

6. **Copiez** l'URL du `file`

#### Option 2 : Désobfusquer le JavaScript

Certains sites obfusquent le code. Utilisez :

1. **DevTools** → **Sources**
2. Trouvez le fichier `.js` du player
3. Clic droit → **Pretty print** (icône `{}`)
4. Cherchez `m3u8` ou `mp4`
5. Trouvez la variable contenant l'URL

#### Option 3 : Utiliser l'Extracteur Générique

Avec les modifications récentes du backend :

```javascript
// Le backend essaiera automatiquement force_generic_extractor
```

Parfois ça fonctionne, parfois non. Ça dépend de la structure du site.

---

## 🔍 Identifier le Type de Protection

### Aucune Protection
✅ URL visible dans le HTML
✅ Pas de JavaScript complexe
✅ Fonctionne avec extracteur générique

**Solution** : Inspection simple suffit

### Protection Basique
⚠️ URL générée par JavaScript
⚠️ Appel API pour récupérer la source
⚠️ Token temporaire

**Solution** : DevTools Network

### Protection Avancée
❌ DRM (Widevine, PlayReady)
❌ Obfuscation lourde
❌ Tokens avec cryptographie

**Solution** : Très difficile, extensions ou logiciels tiers

---

## 💡 Astuces Pratiques

### 1. Vérifier si l'URL est Directe

Collez l'URL dans un nouvel onglet :

```
https://cdn.example.com/video.m3u8
```

Si le navigateur :
- ✅ **Télécharge** le fichier → URL directe valide
- ✅ **Jouele** dans un player → URL valide
- ❌ **Erreur 403/404** → URL protégée ou expirée

### 2. Tokens Temporaires

Certaines URLs ont des tokens qui expirent :

```
https://cdn.example.com/video.m3u8?token=abc123&expire=1234567890
```

**Solution** :
- Téléchargez **immédiatement** après extraction
- Rafraîchissez la page pour nouveau token si expiré

### 3. Headers Requis

Certains serveurs vérifient le `Referer` ou `User-Agent`.

**Dans DownAnime**, le backend inclut déjà :
```python
'User-Agent': 'Mozilla/5.0...'
```

Mais si ça ne suffit pas, vous devrez utiliser `curl` ou `wget` manuellement.

### 4. Master vs Variant Playlists

Pour HLS (`.m3u8`) :

- **master.m3u8** : Liste des qualités disponibles
- **variant.m3u8** : Playlist d'une qualité spécifique

Préférez le **master.m3u8** pour avoir le choix de qualité.

---

## 🧪 Exemples Concrets

### Exemple 1 : URL Simple

**Page** : `https://example.com/video/123`

**Inspection** :
```html
<video id="player" src="https://cdn.example.com/123.mp4"></video>
```

**Action** : Copiez `https://cdn.example.com/123.mp4` dans DownAnime

### Exemple 2 : HLS avec API

**Page** : `https://example.com/anime/episode/1`

**Network → XHR** :
```
Request: https://api.example.com/source?id=1
Response: {"url": "https://cdn.example.com/hls/ep1/master.m3u8"}
```

**Action** : Copiez `https://cdn.example.com/hls/ep1/master.m3u8`

### Exemple 3 : JavaScript Obfusqué

**Sources → player.js** (après pretty print) :
```javascript
var _0x1234 = ['aHR0cHM6Ly9jZG4uZXhhbXBsZS5jb20vdmlkZW8ubTN1OA=='];
var videoUrl = atob(_0x1234[0]); // Base64 decode
```

**Décodage** :
```bash
echo "aHR0cHM6Ly9jZG4uZXhhbXBsZS5jb20vdmlkZW8ubTN1OA==" | base64 -d
# Résultat: https://cdn.example.com/video.m3u8
```

---

## ⚠️ Limitations et Précautions

### Ce Qui Ne Marchera JAMAIS

❌ **Netflix, Disney+, etc.** : DRM impossible à contourner légalement
❌ **Sites avec CAPTCHA** vidéo : Vérification humaine requise
❌ **Sites nécessitant login** : DownAnime ne gère pas l'authentification

### Respecter les Limites

⚖️ **Légal** :
- Téléchargez uniquement ce que vous avez le droit
- Usage personnel uniquement
- Respectez les droits d'auteur

🔒 **Éthique** :
- Ne surchargez pas les serveurs (rate limiting)
- Ne redistribuez pas le contenu
- Soutenez les créateurs officiellement

---

## 🆘 Dépannage

### URL Trouvée Mais Erreur 403

**Cause** : Le serveur vérifie le `Referer`

**Solution** :
```bash
# Télécharger avec curl
curl -H "Referer: https://site-source.com" -H "User-Agent: Mozilla/5.0..." "URL_VIDEO" -o video.mp4
```

### URL Expirée

**Cause** : Token temporaire expiré

**Solution** :
1. Rafraîchissez la page
2. Rejouez la vidéo
3. Récupérez le nouveau token
4. Téléchargez immédiatement

### Flux Segmenté

**Cause** : Vidéo en segments `.ts`

**Solution** :
DownAnime utilise FFmpeg pour fusionner automatiquement les segments HLS.

Assurez-vous que FFmpeg est installé :
```bash
ffmpeg -version
```

---

## 📚 Ressources Supplémentaires

### Documentation
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [HLS Protocol](https://en.wikipedia.org/wiki/HTTP_Live_Streaming)
- [DASH Protocol](https://en.wikipedia.org/wiki/Dynamic_Adaptive_Streaming_over_HTTP)

### Outils Tiers
- [JDownloader 2](https://jdownloader.org)
- [Video DownloadHelper](https://www.downloadhelper.net)
- [FFmpeg](https://ffmpeg.org)

### Communautés
- [r/DataHoarder](https://reddit.com/r/DataHoarder)
- [yt-dlp Discord](https://discord.gg/H5MNcFW63r)

---

**Bon téléchargement ! 🎬**

N'hésitez pas à contribuer à ce guide si vous découvrez de nouvelles techniques !
