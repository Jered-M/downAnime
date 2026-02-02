const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 PROTECTION GLOBALE CONTRE LES CRASHS (EPIPE, etc.)
process.on('uncaughtException', (err) => {
    if (err.code === 'EPIPE') return; // On ignore silencieusement les erreurs de pipe brisé
    console.error('❌ Erreur non capturée:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse non gérée à:', promise, 'raison:', reason);
});

app.use(cors());
app.use(express.json());

// --- ROUTES ---

app.post('/catalog', async (req, res) => {
    const { url } = req.body;
    let browser = null;

    try {
        console.log("📋 Analyse catalogue avec Puppeteer:", url);

        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-web-security']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));

        const episodes = await page.evaluate((baseUrl) => {
            const results = [];
            const seen = new Set();

            const selectors = [
                '.episode-card', '.anime-episode', '.ep-card', 'article',
                '.episode', '.list-episode li', '.episodes-list a'
            ];

            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el) => {
                    const link = el.querySelector('a') || (el.tagName === 'A' ? el : null);
                    if (!link) return;

                    const href = link.getAttribute('href');
                    if (!href || (!href.includes('/episode/') && !href.includes('-vostfr') && !href.includes('-vf'))) return;

                    const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
                    const normalized = fullUrl.toLowerCase().replace(/\/$/, '');

                    if (seen.has(normalized)) return;
                    seen.add(normalized);

                    const img = el.querySelector('img');
                    let thumbnail = null;
                    if (img) {
                        thumbnail = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
                        if (thumbnail && !thumbnail.startsWith('http')) {
                            thumbnail = new URL(thumbnail, baseUrl).href;
                        }
                    }

                    const titleEl = el.querySelector('.episode-title, .ep-title, h3, h4, .title');
                    let title = titleEl ? titleEl.textContent.trim() : link.getAttribute('title') || link.textContent.trim();

                    if (!title || title.length < 2) {
                        title = `Épisode ${results.length + 1}`;
                    }

                    results.push({ url: fullUrl, title, thumbnail });
                });
            });

            return results;
        }, url);

        console.log(`✅ ${episodes.length} épisodes trouvés`);

        await browser.close();
        res.json({ episodes: episodes.slice(0, 100), count: episodes.length });

    } catch (e) {
        console.error("Erreur catalogue:", e.message);
        if (browser) await browser.close().catch(() => { });
        res.status(500).json({ error: "Erreur catalogue." });
    }
});

app.post('/analyze', async (req, res) => {
    const { url } = req.body;
    console.log(`\n🔍 ANALYSE DE : ${url}`);
    let browser = null;

    try {
        let cleanUrl = url;
        if (url && url.includes('youtube.com/watch') && url.includes('&list=')) {
            cleanUrl = url.split('&list=')[0];
            console.log("🧹 Lien YouTube nettoyé :", cleanUrl);
        }

        const directInfo = await new Promise((resolve) => {
            const runYdl = (browserName) => {
                return new Promise((res) => {
                    const isYoutube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
                    const yArgs = [
                        '-J', '--no-warnings', '--no-playlist',
                        '--no-check-certificates',
                        '--proxy', '', // Bypass system proxy
                        cleanUrl
                    ];

                    if (isYoutube) {
                        if (browserName) {
                            yArgs.push('--cookies-from-browser', browserName);
                            yArgs.push('--extractor-args', 'youtube:player_client=ios,web');
                        } else {
                            yArgs.push('--extractor-args', 'youtube:player_client=android,tvhtml5');
                            yArgs.push('--user-agent', 'com.google.android.youtube/19.05.36 (Linux; U; Android 11; EN; Target/Galaxy S21) gzip');
                        }
                    }

                    const p = spawn(path.join(__dirname, 'yt-dlp.exe'), yArgs);
                    let out = ''; let err = '';
                    p.stdout.on('data', d => out += d);
                    p.stderr.on('data', d => err += d);
                    p.on('close', code => {
                        if (code === 0 && out) {
                            try { res(JSON.parse(out)); } catch { res(null); }
                        } else {
                            if (browserName && (err.includes('cookie') || err.includes('database') || err.includes('locked'))) {
                                console.log(`ℹ️ Navigateur ${browserName} inaccessible, essai suivant...`);
                                res('RETRY_NEXT');
                            } else {
                                if (err) console.error(`❌ Erreur (${browserName || 'anonyme'}):`, err.substring(0, 150).trim());
                                res(null);
                            }
                        }
                    });
                });
            };

            (async () => {
                const isYoutube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
                const browserList = isYoutube ? ['chrome', 'edge', 'firefox'] : [null];
                let info = null;
                for (const b of browserList) {
                    info = await runYdl(b);
                    if (info && info !== 'RETRY_NEXT') break;
                }
                if (isYoutube && (!info || info === 'RETRY_NEXT')) {
                    console.log("🦾 Tentative finale : Mode Survivor (Android/TV)");
                    info = await runYdl(null);
                }
                resolve(info);
            })();
        });

        if (directInfo) {
            const finalTitle = directInfo.title || directInfo.fulltitle || "Vidéo YouTube";
            console.log("✅ YT-DLP Succès:", finalTitle);
            return res.json({
                title: finalTitle,
                thumbnail: directInfo.thumbnail,
                duration: directInfo.duration,
                formats: [
                    { id: 'best', ext: 'mp4', resolution: 'Vidéo HD (MP4)', url: cleanUrl },
                    { id: 'bestaudio/best', ext: 'mp3', resolution: 'Musique MP3 / M4A', url: cleanUrl, is_audio: true }
                ]
            });
        }

        const isYoutube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
        if (isYoutube) {
            return res.status(400).json({ error: "YouTube bloque l'accès. Vérifiez vos cookies ou fermez votre navigateur." });
        }

        console.log("⚠️ Passage au mode RADAR (Puppeteer)...");
        browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-web-security'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        let targetVideo = null;
        page.on('response', r => {
            const u = r.url();
            if ((u.includes('.m3u8') || u.includes('.mp4')) && !u.includes('.gif') && !u.includes('pixel')) {
                targetVideo = u;
            }
        });

        await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 4000));

        if (targetVideo) {
            res.json({
                title: "Vidéo extraite via RADAR",
                formats: [{ id: 'best', ext: 'mp4', resolution: 'Qualité Directe', url: targetVideo }]
            });
        } else {
            res.status(400).json({ error: "Aucun flux détecté." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur analyse." });
    } finally {
        if (browser) await browser.close().catch(() => { });
    }
});

app.post('/download', async (req, res) => {
    const { url, format_id, referer, title } = req.body;
    console.log(`\n--------------------------------------------`);
    console.log(`� REQUÊTE REÇUE : ${title}`);
    console.log(`🔗 URL : ${url ? url.substring(0, 50) + '...' : 'MANQUANTE'}`);
    console.log(`🌐 REFERER : ${referer}`);

    const getYdlPath = () => {
        const possible = [
            path.join(__dirname, 'yt-dlp.exe'),
            path.join(process.cwd(), 'yt-dlp.exe'),
            path.join(process.cwd(), 'server', 'yt-dlp.exe'),
            'yt-dlp'
        ];
        for (const p of possible) {
            if (p.endsWith('.exe') && fs.existsSync(p)) return p;
        }
        return 'yt-dlp';
    };

    const ypath = getYdlPath();
    const serverDir = path.join(__dirname);
    const ffmpegPath = fs.existsSync(path.join(serverDir, 'ffmpeg.exe')) ? serverDir : null;

    console.log(`📥 Lancement du téléchargement avec : ${ypath}`);
    if (ffmpegPath) console.log(`🎬 FFmpeg détecté dans : ${ffmpegPath}`);

    // On vérifie si yt-dlp est accessible
    const checkYdl = await new Promise(resolve => {
        const p = spawn(ypath, ['--version']);
        p.on('close', code => resolve(code === 0));
        p.on('error', () => resolve(false));
    });

    if (!checkYdl) {
        console.error("❌ yt-dlp introuvable ou ne répond pas.");
        return res.status(500).json({ error: "Composant yt-dlp manquant sur le serveur." });
    }

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('googlevideo.com');
    const isHls = url.includes('.m3u8');

    const mainUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

    // --- CAS SPÉCIFIQUE : HLS PROTEGE (ANIME) -> FFmpeg DIRECT ---
    if (isHls && !isYouTube && ffmpegPath) {
        console.log("🎯 HLS protégé détecté, passage FFmpeg direct (anti-403)");
        const safeTitle = (title || 'video').replace(/[^a-z0-9]/gi, '_').substring(0, 50);

        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        // Préparation des headers pour FFmpeg
        let headers = `User-Agent: ${mainUA}\r\n`;
        if (referer) {
            headers += `Referer: ${referer}\r\n`;
            try {
                const refUrl = new URL(referer);
                headers += `Origin: ${refUrl.protocol}//${refUrl.host}\r\n`;
            } catch (e) {
                if (referer.includes('vidmoly')) headers += `Origin: https://vidmoly.biz\r\n`;
            }
        }

        const ffmpegArgs = [
            '-headers', headers,
            '-i', url,
            '-c', 'copy',
            '-bsf:a', 'aac_adtstoasc',
            '-f', 'mp4',
            '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
            'pipe:1'
        ];

        console.log("🚀 Lancement FFmpeg direct...");
        const ffmpegProcess = spawn(path.join(ffmpegPath, 'ffmpeg.exe'), ffmpegArgs);

        ffmpegProcess.stdout.pipe(res);

        ffmpegProcess.stderr.on('data', d => {
            const msg = d.toString();
            if (msg.includes('Error') || msg.includes('Failed')) {
                console.error("🎬 FFmpeg Stderr:", msg.trim());
            }
        });

        req.on('close', () => {
            console.log("⏹️ Client déconnecté, arrêt FFmpeg");
            ffmpegProcess.kill();
        });

        ffmpegProcess.on('close', (code) => {
            console.log(`✅ FFmpeg terminé (code ${code})`);
            res.end();
        });

        return; // ON ARRÊTE TOUT ICI POUR CE CAS
    }

    let bestBrowser = isYouTube ? 'chrome' : null;

    // Tentative de récupération de la taille pour la barre de progression
    let contentLength = null;
    try {
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

        const getInfo = async (browserList = ['chrome', 'edge', 'firefox']) => {
            let infoData = null;
            const effectiveBrowserList = isYouTube ? browserList : [null];

            for (const browser of effectiveBrowserList) {
                const iArgs = ['-j', url, '--no-check-certificates', '--proxy', ''];
                if (browser) iArgs.push('--cookies-from-browser', browser);

                if (!isYouTube) iArgs.push('--impersonate', 'chrome');

                if (referer) {
                    iArgs.push('--referer', referer);
                    iArgs.push('--add-header', `Referer:${referer}`);
                    try {
                        const refUrl = new URL(referer);
                        const origin = `${refUrl.protocol}//${refUrl.host}`;
                        iArgs.push('--add-header', `Origin:${origin}`);
                        iArgs.push('--add-header', `Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8`);
                        iArgs.push('--add-header', `Accept-Language:fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7`);
                        iArgs.push('--add-header', `Sec-Fetch-Mode:navigate`);
                        iArgs.push('--add-header', `Sec-Fetch-Dest:document`);
                        iArgs.push('--add-header', `Sec-Fetch-Site:cross-site`);
                        iArgs.push('--add-header', `Sec-Fetch-User:?1`);
                    } catch (e) { }
                }

                const p = spawn(getYdlPath(), iArgs);
                let d = ''; let e = '';
                p.stdout.on('data', chunk => d += chunk);
                p.stderr.on('data', chunk => e += chunk);
                await new Promise(resolve => p.on('close', resolve));

                if (e.includes('cookie') || e.includes('database')) continue;
                try {
                    infoData = JSON.parse(d);
                    bestBrowser = browser;
                    break;
                } catch { continue; }
            }
            return infoData;
        };

        // STRATÉGIE CRITIQUE : Pour les liens d'animes (HLS) avec tokens, 
        // on saute l'analyse info car le lien peut expirer après une requête.
        if (isYouTube || !isHls) {
            let info = isYouTube ? await getInfo() : await getInfo([null]);
            if (info && info.retry !== 'edge') {
                contentLength = info.filesize || info.filesize_approx;
                if (contentLength) console.log(`📏 Taille estimée : ${(contentLength / 1024 / 1024).toFixed(2)} MB`);
            }
        } else {
            console.log("🚀 Lien direct HLS détecté, passage immédiat au téléchargement (anti-403)...");
        }
    } catch (e) {
        console.log("📏 Taille totale inconnue (mode direct)");
    }

    const args = [
        '--no-check-certificates',
        '--proxy', '',
        '--no-playlist', '--no-warnings', '--no-progress', '--no-part', '--hls-use-mpegts',
        '--geo-bypass',
        '-o', '-',
        url
    ];

    if (isYouTube) {
        args.push('--user-agent', mainUA);
        args.push('--extractor-args', 'youtube:player_client=ios,web');
        if (bestBrowser) args.push('--cookies-from-browser', bestBrowser);
    } else {
        // Mode "Impersonate" pour tromper les protections 403 des serveurs d'animes
        args.push('--impersonate', 'chrome');
    }

    if (referer) {
        args.push('--referer', referer);
        args.push('--add-header', `Referer:${referer}`);

        try {
            const refUrl = new URL(referer);
            const origin = `${refUrl.protocol}//${refUrl.host}`;
            args.push('--add-header', `Origin:${origin}`);
            // Headers indispensables pour les proxys d'animes
            args.push('--add-header', `User-Agent:${mainUA}`);
            args.push('--add-header', `Accept:*/*`);
            args.push('--add-header', `Sec-Fetch-Mode:cors`);
            args.push('--add-header', `Sec-Fetch-Site:cross-site`);
        } catch (e) {
            if (referer.includes('vidmoly')) args.push('--add-header', 'Origin:https://vidmoly.biz');
        }
    }

    if (ffmpegPath) args.push('--ffmpeg-location', ffmpegPath);

    if (format_id && format_id.includes('audio')) {
        args.push('-f', 'bestaudio');
    } else {
        args.push('-f', isYouTube ? 'best' : 'bestvideo+bestaudio/best');
    }


    const ydl = spawn(ypath, args);
    const safeTitle = (title || 'video').replace(/[^a-z0-9]/gi, '_').substring(0, 50);

    console.log(`🚀 Processus yt-dlp démarré (PID: ${ydl.pid})`);

    // On surveille le début du flux
    ydl.stdout.once('data', (chunk) => {
        console.log(`📊 Premier paquet reçu de yt-dlp (${chunk.length} octets)`);
    });

    // Si on a FFmpeg, on va "remuxer" le flux en direct vers MP4
    if (ffmpegPath && isHls) {
        console.log("🎬 Remuxage en direct vers MP4 via FFmpeg...");

        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');
        if (contentLength) {
            console.log(`📡 Envoi Content-Length: ${contentLength}`);
            res.setHeader('Content-Length', contentLength);
        }

        const ffmpegProcess = spawn(path.join(ffmpegPath, 'ffmpeg.exe'), [
            '-i', 'pipe:0',           // Entrée : ce qui vient de yt-dlp
            '-c', 'copy',             // Copie sans ré-encodage (ultra rapide)
            '-bsf:a', 'aac_adtstoasc', // Fix pour les flux AAC malformés (HLS -> MP4)
            '-f', 'mp4',              // Format de sortie MP4
            '-movflags', 'frag_keyframe+empty_moov+default_base_moof', // Essentiel pour le streaming MP4
            'pipe:1'                  // Sortie : vers le navigateur
        ]);

        // protection crash EPIPE sur les flux individuels
        ydl.stdout.on('error', (e) => { });
        ffmpegProcess.stdin.on('error', (e) => { });
        ffmpegProcess.stdout.on('error', (e) => { });

        // Utilisation de pipeline pour une gestion robuste des erreurs et du nettoyage
        pipeline(ydl.stdout, ffmpegProcess.stdin, (err) => {
            if (err && err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
                console.error("⚠️ Pipeline YDL -> FFmpeg error:", err.message);
            }
        });

        pipeline(ffmpegProcess.stdout, res, (err) => {
            if (err && err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
                console.error("⚠️ Pipeline FFmpeg -> Response error:", err.message);
            }
        });

        ffmpegProcess.on('error', (err) => console.error("❌ Erreur FFmpeg Process:", err));

        ffmpegProcess.stderr.on('data', (data) => {
            const msg = data.toString();
            if (msg.includes('Error') || msg.includes('Failed')) {
                console.error("🎬 FFmpeg Stderr:", msg.trim());
            }
        });

        // Nettoyage si le client coupe la connexion
        req.on('close', () => {
            console.log("⏹️ Client déconnecté, arrêt des processus...");
            ydl.kill();
            ffmpegProcess.kill();
        });
    } else {
        const extension = isHls ? 'ts' : 'mp4';
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.${extension}"`);
        res.setHeader('Content-Type', isHls ? 'video/mp2t' : 'video/mp4');
        if (contentLength) {
            console.log(`📡 Envoi Content-Length: ${contentLength}`);
            res.setHeader('Content-Length', contentLength);
        }

        pipeline(
            ydl.stdout,
            res,
            (err) => {
                if (err && err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
                    console.error("⚠️ Pipeline YDL -> Response error:", err.message);
                }
            }
        );

        req.on('close', () => {
            console.log("⏹️ Client déconnecté, arrêt du processus ydl...");
            ydl.kill();
        });
    }

    let errorData = '';
    ydl.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    ydl.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.error(`❌ Échec yt-dlp code ${code}: ${errorData}`);
        } else {
            console.log(`✅ Téléchargement terminé ou arrêté.`);
        }
    });

    ydl.on('error', (err) => {
        console.error(`❌ Erreur spawn ydl: ${err.message}`);
    });
});

const server = app.listen(PORT, () => {
    console.log(`🚀 SERVEUR ACTIF SUR PORT ${PORT}`);
});

// Détecte si le port est déjà utilisé ou s'il y a une erreur au lancement
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Erreur : Le port ${PORT} est déjà utilisé par un autre programme.`);
        console.error(`👉 Essayez de fermer les autres fenêtres du terminal ou de redémarrer votre PC.`);
    } else {
        console.error(`❌ Erreur serveur :`, err.message);
    }
});
