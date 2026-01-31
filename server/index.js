const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- ROUTES ---

app.post('/catalog', async (req, res) => {
    const { url } = req.body;
    try {
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(response.data);
        const episodes = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.includes('/episode/') || href.includes('-vostfr') || href.includes('-vf'))) {
                episodes.push({ url: new URL(href, url).href, title: $(el).text().trim() || `Épisode ${episodes.length + 1}` });
            }
        });
        res.json({ episodes: episodes.slice(0, 100) });
    } catch (e) { res.status(500).json({ error: "Erreur catalogue." }); }
});

app.post('/analyze', async (req, res) => {
    const { url } = req.body;
    console.log(`\n🔍 ANALYSE DE : ${url}`);
    let browser = null;

    try {
        // 1. TENTATIVE RAPIDE VIA YT-DLP DIRECT
        console.log("⚡ Tentative extraction directe via yt-dlp...");

        // Détection du binaire yt-dlp
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
        console.log(`🔍 Utilisation de yt-dlp : ${ypath}`);

        const directInfo = await new Promise((resolve) => {
            const p = spawn(getYdlPath(), [
                '-J', '--no-warnings', '--no-playlist', '--socket-timeout', '10',
                '--extractor-args', 'youtube:player_client=android', url
            ]);
            let data = '';
            p.stdout.on('data', d => data += d);
            p.on('close', code => {
                if (code === 0 && data) {
                    try { resolve(JSON.parse(data)); } catch { resolve(null); }
                } else { resolve(null); }
            });
            p.on('error', () => resolve(null));
        });

        if (directInfo && directInfo.title && directInfo.formats) {
            console.log("✅ YT-DLP Direct Success:", directInfo.title);
            return res.json({
                title: directInfo.title,
                thumbnail: directInfo.thumbnail,
                formats: [
                    { id: 'best', ext: 'mp4', resolution: 'Vidéo (Meilleure)', url: url },
                    { id: 'bestaudio/best', ext: 'mp3', resolution: 'Audio seulement', url: url, is_audio: true }
                ]
            });
        }

        // 2. FALLBACK PUPPETEER (RADAR)
        console.log("⚠️ Passage au mode RADAR (Puppeteer)...");
        browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-web-security'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        let targetVideo = null;
        page.on('response', r => {
            const u = r.url();
            if ((u.includes('.m3u8') || u.includes('.mp4')) && !u.includes('.gif') && !u.includes('vast') && !u.includes('pixel')) {
                targetVideo = u;
            }
        });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 5000)); // Attente de détection

        if (targetVideo) {
            res.json({
                title: "Vidéo extraite",
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
    console.log(`\n📥 TÉLÉCHARGEMENT : ${title}`);

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
    console.log(`📥 Lancement du téléchargement avec : ${ypath}`);

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

    const args = [
        '--no-check-certificates',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        '--no-playlist', '--no-warnings', '-o', '-', url
    ];

    if (referer) args.push('--referer', referer);
    // Pour les liens m3u8, il faut souvent forcer le format si on pipe vers stdout
    if (url.includes('.m3u8')) {
        args.push('--hls-prefer-native'); // Parfois plus stable sans ffmpeg pour le stream brut
    }

    if (format_id && format_id.includes('audio')) {
        args.push('-f', 'bestaudio');
    }

    const ydl = spawn(ypath, args);

    const safeTitle = (title || 'video').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    ydl.stdout.pipe(res);

    let errorData = '';
    ydl.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    ydl.on('close', (code) => {
        if (code !== 0) {
            console.error(`❌ Échec yt-dlp code ${code}: ${errorData}`);
            // Note: on ne peut plus envoyer res.json car res.setHeader/pipe a déjà commencé
        } else {
            console.log(`✅ Téléchargement terminé`);
        }
    });

    ydl.on('error', (err) => {
        console.error(`❌ Erreur spawn: ${err.message}`);
    });
});

app.listen(PORT, '127.0.0.1', () => console.log(`🚀 SERVEUR ACTIF SUR PORT ${PORT}`));
