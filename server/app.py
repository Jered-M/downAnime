import os
import glob
import time
import shutil
import uuid
from flask import Flask, request, jsonify, send_file, after_this_request
from flask_cors import CORS
import yt_dlp
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

app = Flask(__name__)
CORS(app)

DOWNLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads')
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

# Clean up downloads older than 1 hour on startup
def clean_old_files():
    try:
        now = time.time()
        for f in os.listdir(DOWNLOAD_FOLDER):
            f_path = os.path.join(DOWNLOAD_FOLDER, f)
            if os.stat(f_path).st_mtime < now - 3600:
                if os.path.isfile(f_path):
                    os.remove(f_path)
    except Exception as e:
        print(f"Cleanup error: {e}")

clean_old_files()

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'DownAnime API is running',
        'endpoints': {
            'analyze': 'POST /analyze',
            'catalog': 'POST /catalog',
            'download': 'POST /download'
        }
    })

# --- MOTEUR DE PARSING DE CATALOGUE (Strict & Propre) ---
def get_episode_links(catalog_url):
    """
    Extrait les liens d'épisodes de manière intelligente.
    Supporte VoirAnime (/anime/slug/ep-slug/), Anime-Sama, etc.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
    
    try:
        response = requests.get(catalog_url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"Erreur HTTP Catalogue: {e}")
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    episodes = []
    
    # Extraire le slug de l'anime de l'URL actuelle pour filtrer
    path_parts = [p for p in catalog_url.split('/') if p]
    anime_slug = path_parts[-1] if path_parts else ""
    if len(path_parts) >= 2 and path_parts[-2] == 'anime':
        anime_slug = path_parts[-2] # Utiliser le parent si on est déjà dans un sous-dossier
    
    # Stratégie générique + spécifique VoirAnime
    for a in soup.find_all('a', href=True):
        href = a['href']
        text = a.get_text(strip=True)
        href_lower = href.lower()
        
        # 1. Patterns classiques (/episode/, /ep/, /watch/)
        is_ep_pattern = any(p in href_lower for p in ['/episode/', '/ep/', '/watch/'])
        
        # 2. Pattern VoirAnime (/anime/nom-anime/nom-anime-01-vostfr/)
        # On vérifie si le lien contient "vostfr" ou "vf" et s'il est assez profond
        is_anime_deep = '/anime/' in href_lower and any(p in href_lower for p in ['-vostfr', '-vf', '-episode-'])
        
        if is_ep_pattern or is_anime_deep:
            full_url = urljoin(catalog_url, href)
            
            # Éviter les liens de genre ou liste
            if any(p in href_lower for p in ['/genre/', '/liste-danimes/', '/nouveaux-ajouts/']):
                continue
                
            title = text if (text and 1 < len(text) < 60) else f"Épisode {len(episodes) + 1}"
            episodes.append({'url': full_url, 'title': title})

    # Si on est déjà sur une page d'épisode, l'ajouter à la liste si elle n'y est pas
    if any(p in catalog_url.lower() for p in ['-vostfr', '-vf', '/episode/']):
        episodes.append({'url': catalog_url, 'title': "Épisode Actuel (Page Source)"})

    # Si rien trouvé, tentative Regex d'urgence
    if not episodes:
        import re
        # Cherche des URL qui finissent par -vostfr ou -vf
        links = re.findall(r'https?://[^\s\'"]+-(?:vostfr|vf)/?', response.text)
        for link in links:
            episodes.append({'url': link, 'title': f"Épisode {len(episodes) + 1}"})

    # Nettoyage et dédoublonnage
    seen = set()
    unique = []
    for ep in episodes:
        # Normaliser l'URL (enlever slash final)
        norm_url = ep['url'].rstrip('/')
        if norm_url not in seen:
            seen.add(norm_url)
            unique.append(ep)
            
    return unique

@app.route('/catalog', methods=['POST'])
def analyze_catalog():
    try:
        data = request.json
        url = data.get('url')
        if not url: return jsonify({'error': 'URL manquante'}), 400
        
        episodes = get_episode_links(url)
        if not episodes:
            return jsonify({
                'error': 'Aucun épisode trouvé sur cette page.',
                'suggestion': 'Assurez-vous d\'être sur la page de l\'ANIME ou de la SAISON.'
            }), 404
            
        return jsonify({'episodes': episodes, 'count': len(episodes)})
    except Exception as e:
        return jsonify({'error': f"Erreur serveur catalogue: {str(e)}"}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        url = data.get('url')
        if not url: return jsonify({'error': 'URL manquante'}), 400

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': url
        }

        # --- Diagnostic de l'Hébergeur ---
        host_detected = "Inconnu"
        try:
            r_diag = requests.get(url, headers=headers, timeout=5)
            if 'vidmoly' in r_diag.text.lower(): host_detected = "Vidmoly"
            elif 'sibnet' in r_diag.text.lower(): host_detected = "Sibnet"
            elif 'sendvid' in r_diag.text.lower(): host_detected = "Sendvid"
            elif 'mycloud' in r_diag.text.lower(): host_detected = "MyCloud"
            elif 'voe.sx' in r_diag.text.lower(): host_detected = "Voe"
        except: pass

        # 1. Tentative yt-dlp
        ydl_opts = {'quiet': True, 'no_warnings': True, 'nocheckcertificate': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
                return format_video_response(info)
            except Exception:
                print(f"yt-dlp échec sur {host_detected}")

        # 2. SCAN PROFOND & DÉCODAGE SPÉCIFIQUE (Sibnet, Sendvid...)
        try:
            r = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(r.text, 'html.parser')
            iframes = soup.find_all('iframe')
            
            target_video_url = None
            
            for iframe in iframes:
                if_src = iframe.get('src')
                if not if_src: continue
                if if_src.startswith('//'): if_src = 'https:' + if_src
                
                print(f"Analyse profonde : {if_src}")
                try:
                    # Logique spécifique SIBNET (Très courant et extractible)
                    if 'sibnet.ru' in if_src:
                        sib_r = requests.get(if_src, headers={'Referer': url}, timeout=5)
                        # Sibnet cache le lien dans player.src({src: "/v/...", ...})
                        slug = re.search(r'src:\s*["\'](/v/[^"\']+)["\']', sib_r.text)
                        if slug:
                            target_video_url = "https://video.sibnet.ru" + slug.group(1)
                            print(f"FLUX SIBNET DÉCODÉ : {target_video_url}")
                            break

                    # Logique Générale (m3u8/mp4)
                    if_r = requests.get(if_src, headers={'Referer': url}, timeout=5)
                    found = re.findall(r'["\'](https?://[^\s\'"]+\.(?:m3u8|mp4)[^\s\'"]*)["\']', if_r.text)
                    if found:
                        target_video_url = found[0]
                        break
                except: continue

            if target_video_url:
                # On utilise yt-dlp pour valider le flux trouvé
                with yt_dlp.YoutubeDL(ydl_opts) as ydl_final:
                    info = ydl_final.extract_info(target_video_url, download=False)
                    return format_video_response(info)

        except Exception as e:
            print(f"Erreur Scan Elite : {e}")

        # 3. ÉCHEC FINAL : Diagnostic précis
        return jsonify({
            'error': f'Lecteur {host_detected} protégé.',
            'host': host_detected,
            'suggestion': f"Le lecteur {host_detected} est trop sécurisé pour une extraction automatique.\n\nASTUCE : Sur VoirAnime, essayez de cliquer sur le bouton 'SIB' ou 'S-Cloud' au-dessus de la vidéo, puis ré-analysez. Ces lecteurs sont plus faciles à détecter !",
            'needs_manual': True
        }), 400

    except Exception as e:
        return jsonify({'error': "Analyse impossible", 'suggestion': str(e)}), 500

def format_video_response(info):
    formats = []
    if 'formats' in info:
        for f in info['formats']:
            if f.get('vcodec') != 'none' and f.get('ext') in ['mp4', 'm3u8']:
                formats.append({
                    'id': f.get('format_id'),
                    'ext': f.get('ext'),
                    'resolution': f.get('resolution') or 'Source',
                    'note': f.get('format_note', '')
                })
    if not formats and 'url' in info:
        formats.append({'id': 'best', 'ext': 'mp4', 'resolution': 'Direct', 'note': 'High'})
    
    return jsonify({
        'title': info.get('title', 'Vidéo détectée'),
        'formats': formats[:10]
    })

@app.route('/download', methods=['POST'])
def download():
    data = request.json
    url = data.get('url')
    format_id = data.get('format_id')
    
    if not url:
        return jsonify({'error': 'URL manquante'}), 400
        
    try:
        # Generate unique filename
        uid = str(uuid.uuid4())
        out_tmpl = os.path.join(DOWNLOAD_FOLDER, f"{uid}_%(title)s.%(ext)s")
        
        ydl_opts = {
            'format': format_id if format_id else 'best',
            'outtmpl': out_tmpl,
            'quiet': True,
            # Merge video+audio if needed (default behavior for 'bestvideo+bestaudio')
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
        # Find the file (extension might vary after merge or if not mp4)
        found_files = glob.glob(os.path.join(DOWNLOAD_FOLDER, f"{uid}_*"))
        if not found_files:
            return jsonify({'error': 'Erreur lors du téléchargement'}), 500
            
        file_path = found_files[0]
        filename = os.path.basename(file_path)

        # Schedule deletion after sending
        @after_this_request
        def remove_file(response):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Error removing file {file_path}: {e}")
            return response

        return send_file(file_path, as_attachment=True, download_name=filename)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
