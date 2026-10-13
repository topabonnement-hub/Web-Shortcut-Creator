import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API: Analyze website for metadata, icons, title, theme color
  app.post('/api/analyze', async (req: Request, res: Response) => {
    try {
      let rawUrl = (req.body?.url || '').trim();
      if (!rawUrl) {
        return res.status(400).json({ success: false, error: 'URL manquante' });
      }

      if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = 'https://' + rawUrl;
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(rawUrl);
      } catch {
        return res.status(400).json({ success: false, error: 'Format d\'URL invalide' });
      }

      const domain = parsedUrl.hostname;
      const origin = parsedUrl.origin;

      const fallbackIcons = [
        {
          src: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
          label: 'Google Favicon HD',
          size: '128x128',
          source: 'google',
        },
        {
          src: `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`,
          label: 'DuckDuckGo Favicon',
          size: '64x64',
          source: 'duckduckgo',
        },
        {
          src: `${origin}/favicon.ico`,
          label: 'Favicon Direct',
          size: '32x32',
          source: 'direct',
        },
        {
          src: `${origin}/apple-touch-icon.png`,
          label: 'Apple Touch Icon',
          size: '180x180',
          source: 'direct-apple',
        },
      ];

      // Format domain into human readable title fallback
      const cleanDomain = domain.replace(/^www\./i, '');
      const parts = cleanDomain.split('.');
      const domainName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : cleanDomain;

      let html = '';
      let status = 200;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(rawUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36 WebShortcutCreator/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          redirect: 'follow',
        });
        clearTimeout(timeoutId);

        status = response.status;
        if (response.ok) {
          html = await response.text();
        }
      } catch (err: any) {
        // External website might block bots or timeout; we degrade gracefully
        console.warn(`Fetch notice for ${rawUrl}:`, err?.message || err);
      }

      let title = '';
      let siteName = '';
      let description = '';
      let themeColor = '#10b981';
      let manifestUrl = '';
      const extractedIcons: { src: string; label: string; size: string; source: string }[] = [];

      if (html) {
        // Extract <title>
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim().replace(/\s+/g, ' ');
        }

        // Extract og:site_name
        const ogSiteNameMatch = html.match(/<meta[^>]+(?:property|name)=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
                                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:site_name["']/i);
        if (ogSiteNameMatch && ogSiteNameMatch[1]) {
          siteName = ogSiteNameMatch[1].trim();
        }

        // Extract og:title
        const ogTitleMatch = html.match(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                             html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["']/i);
        if (ogTitleMatch && ogTitleMatch[1] && !title) {
          title = ogTitleMatch[1].trim();
        }

        // Extract application-name or apple-mobile-web-app-title
        const appNameMatch = html.match(/<meta[^>]+name=["'](?:application-name|apple-mobile-web-app-title)["'][^>]+content=["']([^"']+)["']/i);
        if (appNameMatch && appNameMatch[1]) {
          siteName = appNameMatch[1].trim();
        }

        // Extract description
        const descMatch = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i);
        if (descMatch && descMatch[1]) {
          description = descMatch[1].trim().slice(0, 200);
        }

        // Extract theme-color
        const themeMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
        if (themeMatch && themeMatch[1]) {
          themeColor = themeMatch[1].trim();
        }

        // Extract manifest
        const manifestMatch = html.match(/<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["']/i);
        if (manifestMatch && manifestMatch[1]) {
          try {
            manifestUrl = new URL(manifestMatch[1], rawUrl).href;
          } catch {
            manifestUrl = '';
          }
        }

        // Extract icons: apple-touch-icon, icon, shortcut icon
        const iconRegex = /<link[^>]+rel=["']([^"']*(?:icon|apple-touch-icon)[^"']*)["'][^>]*>/gi;
        let match;
        while ((match = iconRegex.exec(html)) !== null) {
          const tag = match[0];
          const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
          const sizesMatch = tag.match(/sizes=["']([^"']+)["']/i);
          const relMatch = tag.match(/rel=["']([^"']+)["']/i);

          if (hrefMatch && hrefMatch[1]) {
            try {
              const absHref = new URL(hrefMatch[1], rawUrl).href;
              const rel = relMatch ? relMatch[1] : 'icon';
              const sizes = sizesMatch ? sizesMatch[1] : (rel.includes('apple') ? '180x180' : 'any');
              const isApple = rel.includes('apple');

              if (!extractedIcons.some(item => item.src === absHref)) {
                extractedIcons.push({
                  src: absHref,
                  label: isApple ? `Apple Touch (${sizes})` : `Site Icon (${sizes})`,
                  size: sizes,
                  source: 'page-link',
                });
              }
            } catch {
              // ignore invalid url
            }
          }
        }
      }

      // Combine icons: extracted first, then deduplicated fallback icons
      const combinedIcons = [...extractedIcons];
      for (const fb of fallbackIcons) {
        if (!combinedIcons.some(item => item.src === fb.src)) {
          combinedIcons.push(fb);
        }
      }

      const finalTitle = siteName || (title ? title.split(/[|\-–—]/)[0].trim() : domainName);

      return res.json({
        success: true,
        url: rawUrl,
        domain: cleanDomain,
        fullDomain: domain,
        protocol: parsedUrl.protocol.replace(':', ''),
        title: finalTitle || domainName,
        rawTitle: title || '',
        siteName: siteName || '',
        description: description || `Raccourci vers ${cleanDomain}`,
        themeColor: themeColor || '#10b981',
        hasManifest: Boolean(manifestUrl),
        manifestUrl,
        icons: combinedIcons,
        defaultIcon: combinedIcons[0]?.src || fallbackIcons[0].src,
        crawlStatus: status === 200 && html ? 'success' : 'fallback',
      });
    } catch (error: any) {
      console.error('Analyze error:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Erreur lors de l\'analyse du site',
      });
    }
  });

  // Full-page proxy endpoint to embed any website seamlessly without frame-busting or CSP blocks
  app.get('/api/view', async (req: Request, res: Response) => {
    let target = (req.query.url as string) || '';
    if (!target) return res.status(400).send('URL manquante');
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target;

    try {
      const parsed = new URL(target);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(target, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36 WebShortcutCreator/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        redirect: 'follow',
      });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || 'text/html';
      if (!contentType.includes('text/html')) {
        const buffer = await response.arrayBuffer();
        res.setHeader('Content-Type', contentType);
        return res.send(Buffer.from(buffer));
      }

      let html = await response.text();
      const finalUrl = response.url || target;

      // Inject base href and neutralize frame-busting scripts
      const baseTag = `<base href="${finalUrl}">`;
      html = html.replace(/if\s*\(\s*(?:window\.)?top\s*!==?\s*(?:window\.)?self\s*\)/gi, 'if(false)');
      html = html.replace(/if\s*\(\s*(?:window\.)?parent\s*!==?\s*(?:window\.)?self\s*\)/gi, 'if(false)');

      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, `$&${baseTag}`);
      } else {
        html = baseTag + html;
      }

      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.send(html);
    } catch {
      // Fallback redirect or direct iframe instruction
      return res.redirect(target);
    }
  });

  // Shortcut memory registry to guarantee persistence across app launches
  interface ShortcutRecord {
    id: string;
    url: string;
    name: string;
    shortName: string;
    icon: string;
    themeColor: string;
    bgColor: string;
    createdAt: number;
  }
  const shortcutRegistry = new Map<string, ShortcutRecord>();

  // Helper to extract or store shortcut record
  function resolveShortcut(id: string, query: Record<string, any>): ShortcutRecord {
    const existing = shortcutRegistry.get(id);
    const targetUrl = (query.url as string) || existing?.url || 'https://google.com';
    const name = (query.name as string) || existing?.name || 'Web Shortcut';
    const shortName = (query.short_name as string) || existing?.shortName || name.slice(0, 12);
    const icon = (query.icon as string) || existing?.icon || '/favicon.ico';
    const themeColor = (query.theme_color as string) || (query.theme as string) || existing?.themeColor || '#10b981';
    const bgColor = (query.bg_color as string) || existing?.bgColor || '#ffffff';

    const record: ShortcutRecord = {
      id,
      url: targetUrl,
      name,
      shortName,
      icon,
      themeColor,
      bgColor,
      createdAt: existing?.createdAt || Date.now(),
    };
    shortcutRegistry.set(id, record);
    return record;
  }

  // Purge all shortcuts data endpoint
  app.post('/api/purge', (_req: Request, res: Response) => {
    shortcutRegistry.clear();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.json({ success: true, message: 'Toutes les données en cache ont été purgées avec succès.' });
  });

  // Dedicated Manifest for isolated PWA app installation
  app.get(['/app/:id/manifest.json', '/api/manifest'], (req: Request, res: Response) => {
    const appId = (req.params.id as string) || (req.query.id as string) || 'app_default';
    const record = resolveShortcut(appId, req.query);

    const safeId = encodeURIComponent(appId);
    const startUrl = `/app/${safeId}/?url=${encodeURIComponent(record.url)}&name=${encodeURIComponent(record.name)}&icon=${encodeURIComponent(record.icon)}&theme=${encodeURIComponent(record.themeColor)}&id=${safeId}&autolaunch=1`;

    // CRITICAL: id and scope MUST be unique per app so Chrome/Android installs each icon as a SEPARATE APP
    const manifest = {
      id: `/app/${safeId}/`,
      name: record.name,
      short_name: record.shortName,
      start_url: startUrl,
      scope: `/app/${safeId}/`,
      display: 'standalone',
      display_override: ['standalone', 'fullscreen', 'window-controls-overlay'],
      background_color: record.bgColor,
      theme_color: record.themeColor,
      description: `Application pour ${record.name}`,
      icons: [
        {
          src: record.icon,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: record.icon,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    };

    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.json(manifest);
  });

  // Dedicated Service Worker scoped to the specific app ID
  app.get(['/app/:id/sw.js', '/sw.js'], (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.send(`
      self.addEventListener('install', (e) => self.skipWaiting());
      self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
      self.addEventListener('fetch', (e) => {});
    `);
  });

  // Shared Launcher HTML Generator
  function renderLauncherHtml(appId: string, record: ShortcutRecord, autoLaunch: boolean): string {
    const safeId = encodeURIComponent(appId);
    const safeName = String(record.name).replace(/"/g, '&quot;');
    const safeIcon = record.icon ? encodeURI(record.icon) : '';
    const themeColor = record.themeColor || '#10b981';
    const viewProxyUrl = `/api/view?url=${encodeURIComponent(record.url)}`;
    const manifestUrl = `/app/${safeId}/manifest.json?url=${encodeURIComponent(record.url)}&name=${encodeURIComponent(record.name)}&icon=${encodeURIComponent(record.icon)}&theme_color=${encodeURIComponent(themeColor)}&id=${safeId}`;
    const swUrl = `/app/${safeId}/sw.js`;

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${safeName}</title>
  <meta name="theme-color" content="${themeColor}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="icon" href="${safeIcon || '/favicon.ico'}">
  <link rel="apple-touch-icon" href="${safeIcon || '/favicon.ico'}">
  <link rel="manifest" href="${manifestUrl}">
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('${swUrl}', { scope: '/app/${safeId}/' }).catch(function(){});
    }
  </script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    /* Full Page Iframe - No URL or address bar */
    #fullPageFrame {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100dvh;
      border: none;
      margin: 0;
      padding: 0;
      z-index: 10;
      background: #ffffff;
    }
    /* Floating install banner if not yet installed */
    .install-banner {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(16px);
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.25);
      max-width: 92vw;
      width: 390px;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp {
      from { transform: translate(-50%, 40px); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    .install-banner.hidden { display: none !important; }
    .banner-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid #e2e8f0;
    }
    .banner-icon img { width: 100%; height: 100%; object-fit: cover; }
    .banner-text { flex: 1; min-width: 0; text-align: left; }
    .banner-title { font-size: 13px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .banner-sub { font-size: 11px; color: #64748b; }
    .banner-btn {
      background: #059669;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 4px 10px -2px rgba(5, 150, 105, 0.4);
      white-space: nowrap;
    }
    .banner-btn:active { transform: scale(0.96); }
    .banner-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .floating-fab {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 40;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(8px);
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0.3;
      transition: opacity 0.2s;
    }
    .floating-fab:hover, .floating-fab:active { opacity: 0.9; }
  </style>
</head>
<body>
  <!-- Full Page Website - NO LINK SHOWN AT TOP -->
  <iframe
    id="fullPageFrame"
    src="${viewProxyUrl}"
    allow="fullscreen; camera; microphone; geolocation; autoplay"
    title="${safeName}"
  ></iframe>

  <!-- Minimal floating install banner if running in regular browser -->
  <div id="installBanner" class="install-banner">
    <div class="banner-icon">
      ${safeIcon ? `<img src="${safeIcon}" alt="${safeName}">` : '📱'}
    </div>
    <div class="banner-text">
      <div class="banner-title">${safeName}</div>
      <div class="banner-sub">Installer sur l'écran d'accueil</div>
    </div>
    <button class="banner-btn" onclick="triggerInstall()">
      Installer
    </button>
    <button class="banner-close" onclick="dismissBanner()" title="Fermer et voir plein écran">
      ✕
    </button>
  </div>

  <button class="floating-fab" onclick="reloadFrame()" title="Actualiser la page">
    ↻
  </button>

  <script>
    var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true ||
                       ${autoLaunch ? 'true' : 'false'};

    if (isStandalone) {
      var banner = document.getElementById('installBanner');
      if (banner) banner.classList.add('hidden');
    }

    function dismissBanner() {
      var banner = document.getElementById('installBanner');
      if (banner) banner.classList.add('hidden');
    }

    function reloadFrame() {
      var frame = document.getElementById('fullPageFrame');
      if (frame) frame.src = frame.src;
    }

    var deferredPrompt;
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      deferredPrompt = e;
      var banner = document.getElementById('installBanner');
      if (banner && !isStandalone) banner.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', function() {
      dismissBanner();
    });

    function triggerInstall() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choice) {
          if (choice.outcome === 'accepted') {
            dismissBanner();
          }
          deferredPrompt = null;
        });
      } else {
        alert("Pour installer cette application sur votre smartphone :\\n\\n1. Touchez les 3 points (⋮) en haut de votre navigateur\\n2. Choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil »");
      }
    }
  </script>
</body>
</html>`;
  }

  // App Launcher endpoint with dedicated app ID
  app.get(['/app/:id', '/app/:id/'], (req: Request, res: Response) => {
    const appId = req.params.id || (req.query.id as string) || 'app_default';
    const record = resolveShortcut(appId, req.query);
    const autoLaunchParam = (req.query.autolaunch as string) === '1';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.send(renderLauncherHtml(appId, record, autoLaunchParam));
  });

  // Backward compatible /launch endpoint
  app.get('/launch', (req: Request, res: Response) => {
    const appId = (req.query.id as string) || ('app_' + Buffer.from(String(req.query.url || 'app')).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10));
    const record = resolveShortcut(appId, req.query);
    const autoLaunchParam = (req.query.autolaunch as string) === '1';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.send(renderLauncherHtml(appId, record, autoLaunchParam));
  });

  // Setup Vite in development or static serve in production
  const isProduction = process.env.NODE_ENV === 'production';
  const distFromRoot = path.join(__dirname, 'dist');
  const distDirect = __dirname;
  const clientDistDir = fs.existsSync(path.join(distFromRoot, 'index.html'))
    ? distFromRoot
    : fs.existsSync(path.join(distDirect, 'index.html'))
    ? distDirect
    : null;

  if (isProduction || clientDistDir) {
    if (clientDistDir) {
      app.use(express.static(clientDistDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDistDir, 'index.html'));
      });
    }
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web Shortcut Creator running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
