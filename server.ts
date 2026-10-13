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

  // Icon proxy endpoint to ensure HTTP icons can load securely over HTTPS for manifest & Android installation
  app.get('/api/icon-proxy', async (req: Request, res: Response) => {
    const iconUrl = req.query.url as string;
    if (!iconUrl) return res.status(400).send('URL manquante');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(iconUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
          'Accept': 'image/*,*/*;q=0.8',
        },
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        return res.redirect(iconUrl);
      }

      const contentType = resp.headers.get('content-type') || 'image/png';
      const buffer = await resp.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(buffer));
    } catch {
      return res.redirect(iconUrl);
    }
  });

  // Dedicated Manifest for isolated PWA app installation
  app.get(['/app/:id/manifest.json', '/api/manifest'], (req: Request, res: Response) => {
    const appId = (req.params.id as string) || (req.query.id as string) || 'app_default';
    const record = resolveShortcut(appId, req.query);

    const safeAppId = encodeURIComponent(appId);
    const safeUrl = encodeURIComponent(record.url);
    const safeName = encodeURIComponent(record.name);
    const safeIcon = encodeURIComponent(record.icon);
    const safeTheme = encodeURIComponent(record.themeColor);

    // Secure icon url: use proxy if HTTP to prevent mixed content blocking on Android
    const iconEndpoint = record.icon.startsWith('http://')
      ? `/api/icon-proxy?url=${safeIcon}`
      : record.icon;

    // Same-origin start_url with launch=1 so launching from Android home screen redirects instantly
    const startUrl = `/app/${safeAppId}?url=${safeUrl}&name=${safeName}&icon=${safeIcon}&theme=${safeTheme}&id=${safeAppId}&launch=1`;

    const manifest = {
      name: record.name,
      short_name: record.shortName,
      start_url: startUrl,
      scope: `/`,
      display: 'standalone',
      background_color: record.bgColor,
      theme_color: record.themeColor,
      description: `Raccourci Android pour ${record.name}`,
      icons: [
        {
          src: iconEndpoint,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: iconEndpoint,
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

  // Dedicated direct install & launcher HTML generator
  function renderDirectInstallPage(appId: string, record: ShortcutRecord, shouldAutoInstall: boolean): string {
    const safeId = encodeURIComponent(appId);
    const safeName = String(record.name).replace(/"/g, '&quot;');
    const safeUrl = String(record.url).replace(/"/g, '&quot;');
    const safeIcon = String(record.icon).replace(/"/g, '&quot;');
    const safeTheme = String(record.themeColor).replace(/"/g, '&quot;');
    const manifestHref = `/app/${safeId}/manifest.json?url=${encodeURIComponent(record.url)}&name=${encodeURIComponent(record.name)}&icon=${encodeURIComponent(record.icon)}&theme=${encodeURIComponent(record.themeColor)}&id=${safeId}`;

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${safeName}</title>
  <meta name="theme-color" content="${safeTheme}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="${safeName}">
  <link rel="manifest" href="${manifestHref}">
  <link rel="icon" href="${safeIcon}">
  <link rel="apple-touch-icon" href="${safeIcon}">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center p-4 selection:bg-emerald-500 font-sans">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
    <div class="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative w-24 h-24 mx-auto mb-4 bg-white/10 p-2 rounded-2xl border border-white/20 shadow-xl flex items-center justify-center overflow-hidden">
      <img src="${safeIcon}" alt="${safeName}" class="w-full h-full object-contain" onerror="this.src='/favicon.ico'">
    </div>

    <h1 class="text-2xl font-extrabold text-white mb-1 tracking-tight">${safeName}</h1>
    <p class="text-xs text-slate-400 mb-6 truncate max-w-xs mx-auto">${safeUrl}</p>

    <!-- Success banner if installed -->
    <div id="installed-banner" class="hidden mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
      ✅ Raccourci ajouté avec succès sur votre écran d'accueil Android !
    </div>

    <!-- Direct Install Button -->
    <div class="space-y-3">
      <button id="direct-install-btn" class="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2">
        <span>📲 Installer sur l'écran d'accueil</span>
      </button>

      <a href="${safeUrl}" class="block w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700">
        🌐 Ouvrir directement le site web
      </a>
    </div>

    <p id="install-hint" class="text-[11px] text-slate-500 mt-5">
      Touchez « Installer » pour ajouter l'icône directement à votre smartphone Android.
    </p>
  </div>

  <script>
    // Immediate redirect if opened from Android Home Screen (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      window.location.replace("${safeUrl}");
    }

    // Register Service Worker for PWA compliance
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(function(e) {
        console.warn('SW reg notice:', e);
      });
    }

    let deferredPrompt = null;
    const installBtn = document.getElementById('direct-install-btn');
    const installedBanner = document.getElementById('installed-banner');
    const autoInstall = ${shouldAutoInstall ? 'true' : 'false'};

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (autoInstall) {
        triggerInstall();
      }
    });

    window.addEventListener('appinstalled', () => {
      if (installedBanner) installedBanner.classList.remove('hidden');
      if (installBtn) {
        installBtn.innerHTML = '<span>✓ Déjà installé</span>';
        installBtn.classList.add('bg-slate-800', 'text-slate-400');
        installBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
        installBtn.disabled = true;
      }
    });

    async function triggerInstall() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          if (installedBanner) installedBanner.classList.remove('hidden');
        }
      } else {
        // Fallback for browsers or if already ready
        window.location.href = "${safeUrl}";
      }
    }

    installBtn.addEventListener('click', triggerInstall);
  </script>
</body>
</html>`;
  }

  // App Launcher & Direct Installation endpoint
  app.get(['/app/:id', '/app/:id/'], (req: Request, res: Response) => {
    const appId = req.params.id || (req.query.id as string) || 'app_default';
    const record = resolveShortcut(appId, req.query);

    // If launched from home screen icon (launch=1 or autolaunch=1), immediately redirect to real website
    if (req.query.launch === '1' || req.query.autolaunch === '1') {
      return res.redirect(record.url);
    }

    // Otherwise render direct installation page
    const shouldAuto = req.query.install === '1';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(renderDirectInstallPage(appId, record, shouldAuto));
  });

  // Backward compatible /launch endpoint - immediately redirects to target website URL
  app.get('/launch', (req: Request, res: Response) => {
    const appId = (req.query.id as string) || 'app_default';
    const record = resolveShortcut(appId, req.query);
    return res.redirect(record.url);
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
