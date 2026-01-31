# 🚀 Guide de Lancement Rapide - DownAnime

## ⚡ Démarrage en 5 Minutes

### Prérequis Système

- ✅ **Node.js** 18+ ([Télécharger](https://nodejs.org))
- ✅ **Python** 3.8+ ([Télécharger](https://python.org))
- ✅ **FFmpeg** recommandé ([Télécharger](https://ffmpeg.org))

---

## 📦 Installation Rapide

### Étape 1️⃣ : Cloner / Ouvrir le Projet

```bash
cd c:\Users\HP\Documents\web\DOWNANIME
```

### Étape 2️⃣ : Backend (Python Flask)

```bash
# Naviguer vers le dossier server
cd server

# Installer les dépendances
pip install -r requirements.txt

# Vérifier l'installation
python -c "import yt_dlp; print('✅ yt-dlp installé')"
```

**Note Windows** : Si `pip` n'est pas reconnu, utilisez :
```bash
python -m pip install -r requirements.txt
```

### Étape 3️⃣ : Frontend (React + Vite)

```bash
# Retourner à la racine
cd ..
cd client

# Installer les dépendances
npm install
```

**Temps d'installation** : ~2-3 minutes selon votre connexion

---

## 🎬 Lancement de l'Application

### Option 1 : Deux Terminaux Séparés (Recommandé)

#### Terminal 1 - Backend

```bash
cd server
python app.py
```

**Sortie attendue** :
```
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.x.x:5000
```

✅ **Backend prêt** sur `http://localhost:5000`

#### Terminal 2 - Frontend

```bash
cd client
npm run dev
```

**Sortie attendue** :
```
VITE v7.2.4  ready in 350 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
➜  press h + enter to show help
```

✅ **Frontend prêt** sur `http://localhost:5173`

### Option 2 : Scripts PowerShell (Windows)

Créer un fichier `start.ps1` :

```powershell
# Lancer backend en arrière-plan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; python app.py"

# Attendre 2 secondes
Start-Sleep -Seconds 2

# Lancer frontend
cd client
npm run dev
```

Exécuter :
```bash
.\start.ps1
```

---

## 🧪 Test de Fonctionnement

### 1. Vérifier le Backend

Ouvrir un navigateur : `http://localhost:5000`

Vous devriez voir :
```
Cannot GET /
```
✅ C'est normal ! L'API n'a pas de route `/`

Test API :
```bash
# Via curl (ou Postman)
curl -X POST http://localhost:5000/analyze -H "Content-Type: application/json" -d "{\"url\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}"
```

### 2. Vérifier le Frontend

Ouvrir : `http://localhost:5173`

Vous devriez voir :
- Logo **DownAnime** animé
- Barre de recherche glassmorphism
- Placeholder "Prêt à détecter"

✅ **Application fonctionnelle !**

---

## 🎯 Premier Test Complet

### URLs de Test Recommandées

1. **YouTube** (test simple)
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

2. **Vimeo**
```
https://vimeo.com/76979871
```

3. **Dailymotion**
```
https://www.dailymotion.com/video/x8b6qqo
```

### Procédure de Test

1. **Copier** une URL de test
2. **Coller** dans la barre de recherche
3. **Cliquer** "Ouvrir"
4. ⏸️ Attendre le chargement de l'iframe
5. **Cliquer** "Détecter & Télécharger"
6. ⏳ Attendre l'analyse (2-5 sec)
7. **Choisir** un format dans le modal
8. ✅ **Télécharger** !

---

## ⚙️ Configuration Optionnelle

### Changer le Port Backend

**Fichier** : `server/app.py`

```python
# Ligne 134
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # ← Changer ici
```

⚠️ **Important** : Mettre à jour aussi le frontend

**Fichier** : `client/src/App.jsx`

```javascript
// Ligne 7
const API_base = 'http://localhost:5000';  // ← Changer ici
```

### Changer le Port Frontend

**Fichier** : `client/vite.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173  // ← Changer ici
  }
})
```

---

## 🐛 Dépannage

### Erreur : `Module not found: yt_dlp`

**Solution** :
```bash
cd server
pip install yt-dlp
```

### Erreur : `CORS policy` dans la console

**Vérifier** :
1. Backend est bien lancé
2. URL de l'API est correcte dans `App.jsx`

**Tester** :
```bash
curl http://localhost:5000/analyze -X POST
```

Si erreur → Backend pas lancé

### Erreur : `npm: command not found`

**Solution** :
- Installer Node.js depuis [nodejs.org](https://nodejs.org)
- Redémarrer le terminal

### Erreur : `Cannot find module 'react'`

**Solution** :
```bash
cd client
rm -rf node_modules
npm install
```

### Vidéo non détectée

**Causes possibles** :
1. Site utilise DRM (Netflix, Disney+, etc.) → ❌ Impossible
2. Site bloque yt-dlp → Essayer autre URL
3. Format non supporté → Vérifier logs backend

**Logs backend** :
```python
# Activer logs détaillés dans app.py
ydl_opts = {
    'quiet': False,  # ← Changer de True à False
    'verbose': True   # ← Ajouter
}
```

---

## 📊 Monitoring

### Logs Backend

Les logs apparaissent dans le terminal du backend :

```
127.0.0.1 - - [30/Jan/2026 19:30:45] "POST /analyze HTTP/1.1" 200 -
[yt-dlp] Extracting URL: https://...
[yt-dlp] Video ID: abc123
[yt-dlp] Downloaded formats: 12
```

### DevTools Frontend

Ouvrir console navigateur (F12) :

```javascript
// Voir les requêtes
Network → Filter → XHR

// Voir les erreurs
Console → Filter → Errors
```

---

## 🔧 Commandes Utiles

### Backend

```bash
# Lancer
python app.py

# Lancer avec logs détaillés
FLASK_DEBUG=1 python app.py

# Tester l'installation
python -c "import flask, yt_dlp; print('OK')"

# Vérifier version yt-dlp
python -c "import yt_dlp; print(yt_dlp.version.__version__)"
```

### Frontend

```bash
# Dev mode
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Lint
npm run lint

# Clean install
rm -rf node_modules package-lock.json && npm install
```

---

## 🌐 Accès Réseau Local

### Partager sur le Réseau Local

**Backend** :
Déjà configuré avec `host='0.0.0.0'`

**Frontend** :
Vite affiche automatiquement :
```
➜  Network: http://192.168.1.10:5173/
```

**Accéder depuis un autre appareil** :
1. Trouver l'IP de votre PC : `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
2. Sur autre appareil : `http://VOTRE_IP:5173`
3. ⚠️ Mettre à jour `API_base` dans App.jsx avec l'IP réelle

```javascript
const API_base = 'http://192.168.1.10:5000';  // ← IP de votre PC
```

---

## ✅ Checklist de Démarrage

- [ ] Node.js et Python installés
- [ ] Dépendances backend installées (`pip install`)
- [ ] Dépendances frontend installées (`npm install`)
- [ ] Backend lancé sur port 5000
- [ ] Frontend lancé sur port 5173
- [ ] URL de test fonctionne
- [ ] Téléchargement réussi

---

## 📞 Aide Supplémentaire

**Problème persistant ?**

1. Vérifier versions :
   ```bash
   node --version  # >= 18
   python --version  # >= 3.8
   ```

2. Vérifier ports libres :
   ```bash
   # Windows
   netstat -ano | findstr :5000
   netstat -ano | findstr :5173
   ```

3. Relancer depuis zéro :
   ```bash
   # Nettoyer tout
   cd client
   rm -rf node_modules package-lock.json
   npm install
   
   cd ../server
   pip uninstall -y flask flask-cors yt-dlp
   pip install -r requirements.txt
   ```

---

**Bon développement ! 🚀**

Si tout fonctionne, consultez le **README.md** principal pour les fonctionnalités avancées.
