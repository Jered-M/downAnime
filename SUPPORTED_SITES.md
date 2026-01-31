# 🌐 Sites Supportés et Limitations

## ✅ Sites Principaux Supportés

yt-dlp supporte **1400+ sites web**. Voici les plus populaires :

### 🎬 Plateformes Vidéo Majeures

| Site | Support | Notes |
|------|---------|-------|
| **YouTube** | ✅ Excellent | Toutes les vidéos, playlists, chaînes |
| **Vimeo** | ✅ Excellent | Vidéos publiques et privées (avec token) |
| **Dailymotion** | ✅ Excellent | Toutes les vidéos |
| **Twitch** | ✅ Bon | VODs, clips, streams en direct |
| **TikTok** | ✅ Bon | Vidéos individuelles |
| **Twitter/X** | ✅ Bon | Vidéos publiées |
| **Facebook** | ⚠️ Partiel | Vidéos publiques uniquement |
| **Instagram** | ⚠️ Partiel | Peut nécessiter authentification |
| **Reddit** | ✅ Bon | Vidéos hébergées sur Reddit |

### 📺 Plateformes Streaming

| Site | Support | Notes |
|------|---------|-------|
| **Bandcamp** | ✅ Bon | Audio et vidéo |
| **SoundCloud** | ✅ Bon | Musique |
| **Mixcloud** | ✅ Bon | Podcasts et DJ sets |
| **Spotify** | ❌ Non | Protégé par DRM |
| **Apple Music** | ❌ Non | Protégé par DRM |

### 🎓 Plateformes Éducatives

| Site | Support | Notes |
|------|---------|-------|
| **Coursera** | ⚠️ Partiel | Certaines vidéos |
| **Udemy** | ⚠️ Partiel | Nécessite authentification |
| **Khan Academy** | ✅ Bon | Vidéos éducatives |
| **TED** | ✅ Excellent | Toutes les conférences |

## ❌ Sites NON Supportés

### Streaming Protégé (DRM)

Ces sites utilisent des protections numériques impossibles à contourner légalement :

- ❌ **Netflix**
- ❌ **Disney+**
- ❌ **Amazon Prime Video**
- ❌ **HBO Max**
- ❌ **Apple TV+**
- ❌ **Hulu**
- ❌ **Crunchyroll** (avec DRM)
- ❌ **Spotify**
- ❌ **Deezer**

### Sites d'Anime Non Supportés

Beaucoup de sites d'anime utilisent des players personnalisés :

- ❌ **voiranime.com** ← Votre cas
- ❌ **wakanim.tv** (DRM)
- ❌ **adn.fr** (DRM)
- ⚠️ **9anime** (peut fonctionner selon le player)
- ⚠️ **gogoanime** (peut fonctionner selon le player)

## 🔧 Alternatives pour Anime

### ✅ Sites d'Anime Supportés

| Site | Support | Notes |
|------|---------|-------|
| **YouTube** | ✅ Excellent | Chaînes officielles d'anime |
| **Crunchyroll** (sans DRM) | ⚠️ Partiel | Anciens épisodes sans DRM |
| **Funimation** | ⚠️ Partiel | Certaines vidéos |

### 💡 Suggestions pour voiranime.com

Si vous devez absolument télécharger depuis voiranime :

#### Option 1 : Extension Navigateur
Utilisez des extensions comme :
- **Video DownloadHelper** (Firefox/Chrome)
- **Video Downloader Professional** (Chrome)

Ces extensions peuvent capturer les flux vidéo dans le navigateur.

#### Option 2 : Outils Dédiés
- **JDownloader 2** : Logiciel qui peut détecter les vidéos
- **IDM** (Internet Download Manager) : Sur Windows
- **1DM** : Sur Android (votre inspiration)

#### Option 3 : Inspection Manuelle

1. Ouvrez les DevTools (F12)
2. Onglet **Network**
3. Filtrez par type : **Media** ou **XHR**
4. Jouez la vidéo
5. Cherchez un fichier `.m3u8` ou `.mp4`
6. Copiez l'URL
7. Collez dans DownAnime

**Exemple** :
```
https://v6.voiranime.com/streams/episode123/master.m3u8
```

Si vous trouvez une URL directe comme ça, DownAnime pourra la télécharger !

## 📋 Liste Complète des Sites Supportés

Pour voir la liste exhaustive des 1400+ sites :

🔗 **[Liste officielle yt-dlp](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)**

## 🧪 URLs de Test Recommandées

### Pour Tester DownAnime

Utilisez ces URLs qui fonctionnent à coup sûr :

#### 1. **YouTube** (Recommandé)
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

#### 2. **Vimeo**
```
https://vimeo.com/76979871
```

#### 3. **Dailymotion**
```
https://www.dailymotion.com/video/x8b6qqo
```

#### 4. **TED Talk**
```
https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action
```

#### 5. **Twitch Clip**
```
https://www.twitch.tv/videos/1234567890
```

## 🔍 Diagnostic : Pourquoi Un Site Ne Marche Pas ?

### Raisons Possibles

1. **Site non supporté par yt-dlp**
   - Solution : Vérifier la liste officielle
   
2. **Protection DRM**
   - Solution : Aucune (légalement impossible)
   
3. **Protection anti-bot**
   - Solution : L'extracteur générique peut parfois aider
   
4. **Player vidéo personnalisé**
   - Solution : Inspection manuelle (voir ci-dessus)
   
5. **Authentification requise**
   - Solution : Pas supporté dans cette version

### Comment Vérifier ?

Testez avec yt-dlp en ligne de commande :

```bash
cd server
python -c "import yt_dlp; ydl = yt_dlp.YoutubeDL({'quiet': True}); ydl.extract_info('VOTRE_URL', download=False)"
```

Si ça fonctionne → Le problème est dans le code
Si ça échoue → Le site n'est pas supporté

## 🆕 Mise à Jour de yt-dlp

yt-dlp est régulièrement mis à jour. Pour avoir les derniers extracteurs :

```bash
pip install --upgrade yt-dlp
```

Ou :

```bash
pip install -U yt-dlp
```

## 💡 Contribution

Si un site important n'est pas supporté, vous pouvez :

1. **Vérifier** si quelqu'un a déjà ouvert une issue
2. **Ouvrir une issue** sur GitHub : https://github.com/yt-dlp/yt-dlp/issues
3. **Contribuer** un extracteur si vous savez programmer

## ⚖️ Considérations Légales

### ⚠️ Important

L'utilisation de DownAnime doit respecter :

- ✅ **Les conditions d'utilisation** des sites sources
- ✅ **Les droits d'auteur** du contenu
- ✅ **Les lois locales** sur le téléchargement

### Sites Légaux

Privilégiez les sites qui autorisent explicitement le téléchargement :

- YouTube (avec permission du créateur)
- Vimeo (vidéos avec téléchargement activé)
- Archive.org
- Wikimedia Commons
- Creative Commons

## 📊 Statistiques yt-dlp

Au 30 janvier 2026 :

- **1400+** sites supportés
- **50+** nouvelles mises à jour par mois
- **Millions** d'utilisateurs dans le monde
- **Open source** et gratuit

## 🔮 Futur de DownAnime

### Améliorations Prévues

1. **Extracteur intelligent** : Analyse du DOM pour détecter les vidéos
2. **Support Chromium** : Utiliser un navigateur headless pour contourner protections
3. **Cache** : Mémoriser les extracteurs qui fonctionnent
4. **Liste de favoris** : Sauvegarder vos sites préférés

### Contributions Bienvenues

Si vous connaissez un site d'anime qui fonctionne avec yt-dlp, contribuez au projet !

---

## 📞 Besoin d'Aide ?

**Site ne marche pas ?**

1. ✅ Vérifiez qu'il est dans la liste des sites supportés
2. 🔄 Mettez à jour yt-dlp
3. 🧪 Testez avec une URL connue (YouTube)
4. 📝 Ouvrez une issue avec l'URL problématique

**Erreur spécifique ?**

Consultez les logs du backend pour plus de détails.

---

**Dernière mise à jour** : 30 janvier 2026
