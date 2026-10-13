import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import zlib from 'zlib';

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

  // CRC32 helper for raw PNG generation
  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makePngChunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const toCrc = Buffer.concat([typeBuf, data]);
    const crc = crc32(toCrc);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Generates guaranteed valid PNG icon for Chrome PWA installability requirements
  function generateSolidPng(size: number, hexColor: string): Buffer {
    let r = 16, g = 185, b = 129;
    if (hexColor && hexColor.startsWith('#') && hexColor.length >= 7) {
      r = parseInt(hexColor.slice(1, 3), 16) || 16;
      g = parseInt(hexColor.slice(3, 5), 16) || 185;
      b = parseInt(hexColor.slice(5, 7), 16) || 129;
    }

    const rowSize = size * 4 + 1;
    const rawData = Buffer.alloc(rowSize * size);

    for (let y = 0; y < size; y++) {
      const rowOffset = y * rowSize;
      rawData[rowOffset] = 0;
      for (let x = 0; x < size; x++) {
        const pxOffset = rowOffset + 1 + x * 4;
        const cx = size / 2;
        const cy = size / 2;
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);
        const radius = size * 0.44;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius) {
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 0;
          rawData[pxOffset + 2] = 0;
          rawData[pxOffset + 3] = 0;
        }
      }
    }

    const deflated = zlib.deflateSync(rawData);
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(size, 0);
    ihdrData.writeUInt32BE(size, 4);
    ihdrData[8] = 8;
    ihdrData[9] = 6;
    ihdrData[10] = 0;
    ihdrData[11] = 0;
    ihdrData[12] = 0;

    return Buffer.concat([
      sig,
      makePngChunk('IHDR', ihdrData),
      makePngChunk('IDAT', deflated),
      makePngChunk('IEND', Buffer.alloc(0)),
    ]);
  }

  // App icon endpoint: guarantees a valid PNG file for Chrome PWA manifests
  app.get('/api/app-icon', async (req: Request, res: Response) => {
    const iconUrl = req.query.url as string;
    const themeColor = (req.query.theme as string) || '#10b981';
    const size = parseInt((req.query.size as string) || '192', 10) || 192;

    if (iconUrl && iconUrl !== '/favicon.ico') {
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

        if (resp.ok) {
          const buffer = Buffer.from(await resp.arrayBuffer());
          const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
          const pngIndex = buffer.indexOf(pngSig);

          // Extract embedded PNG from ICO file or serve raw PNG
          if (pngIndex !== -1) {
            const cleanPng = buffer.subarray(pngIndex);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(cleanPng);
          }

          const ct = resp.headers.get('content-type') || '';
          if (ct.includes('image/webp') || ct.includes('image/jpeg')) {
            res.setHeader('Content-Type', ct);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(buffer);
          }
        }
      } catch (err) {
        console.warn('App icon fetch failed, using generated PNG fallback:', err);
      }
    }

    const fallbackPng = generateSolidPng(size >= 512 ? 512 : 192, themeColor);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(fallbackPng);
  });

  // Icon proxy endpoint for general image loading
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

      const buffer = Buffer.from(await resp.arrayBuffer());
      const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const pngIndex = buffer.indexOf(pngSig);

      if (pngIndex !== -1) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buffer.subarray(pngIndex));
      }

      const contentType = resp.headers.get('content-type') || 'image/png';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
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

    // Guaranteed PNG endpoints for Chrome PWA installability requirements
    const icon192 = `/api/app-icon?url=${safeIcon}&theme=${safeTheme}&size=192&id=${safeAppId}`;
    const icon512 = `/api/app-icon?url=${safeIcon}&theme=${safeTheme}&size=512&id=${safeAppId}`;

    // Same-origin start_url with launch=1 so launching from Android home screen redirects instantly to target website
    const startUrl = `/app/${safeAppId}?url=${safeUrl}&name=${safeName}&icon=${safeIcon}&theme=${safeTheme}&id=${safeAppId}&launch=1`;

    const manifest = {
      name: record.name,
      short_name: record.shortName,
      start_url: startUrl,
      id: `/app/${safeAppId}`,
      scope: `/`,
      display: 'standalone',
      orientation: 'any',
      background_color: record.bgColor,
      theme_color: record.themeColor,
      description: `Raccourci Android pour ${record.name}`,
      icons: [
        {
          src: icon192,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: icon512,
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

  // Dedicated Service Worker with Service-Worker-Allowed header
  app.get(['/app/:id/sw.js', '/sw.js'], (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.send(`
      self.addEventListener('install', (e) => self.skipWaiting());
      self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
      self.addEventListener('fetch', (e) => {
        // Transparent fetch pass-through
      });
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
    const pngIcon = `/api/app-icon?url=${encodeURIComponent(record.icon)}&theme=${encodeURIComponent(record.themeColor)}&size=192&id=${safeId}`;

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
  <link rel="icon" type="image/png" href="${pngIcon}">
  <link rel="apple-touch-icon" href="${pngIcon}">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center p-4 selection:bg-emerald-500 font-sans">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
    <!-- Ambient decorative glows -->
    <div class="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- App Icon -->
    <div class="relative w-24 h-24 mx-auto mb-4 bg-white/10 p-2.5 rounded-3xl border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
      <img src="${pngIcon}" alt="${safeName}" class="w-full h-full object-contain" onerror="this.onerror=null; this.src='${safeIcon}'">
    </div>

    <!-- App Title & Site Address -->
    <h1 class="text-2xl font-extrabold text-white mb-1 tracking-tight">${safeName}</h1>
    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 mb-6 max-w-xs mx-auto">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <p class="text-xs text-slate-300 font-mono truncate">${safeUrl}</p>
    </div>

    <!-- Success banner if installed -->
    <div id="installed-banner" class="hidden mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center">
      ✅ Raccourci ajouté avec succès sur votre écran d'accueil Android !
    </div>

    <!-- Actions Area: Open in Center & Install Direct -->
    <div class="space-y-3.5">
      <!-- 1. Central prominent Open Button (Opens target site directly) -->
      <a id="open-site-btn" href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 border border-emerald-400/30">
        <svg class="w-5 h-5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
        </svg>
        <span>Ouvrir le site web</span>
      </a>

      <!-- 2. Direct Install Button -->
      <button id="direct-install-btn" class="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 border border-slate-700">
        <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v12m0 0l-4-4m4 4l4-4m-8 8h16"></path>
        </svg>
        <span id="install-btn-text">📲 Installer sur l'écran d'accueil</span>
      </button>

      <!-- 3. Offline Shortcut File Download (.html) -->
      <button id="download-shortcut-btn" class="w-full py-2.5 px-4 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-800">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
        <span>Télécharger raccourci (.html)</span>
      </button>
    </div>

    <!-- Manual install guidance (shown when prompt is pending or fallback needed) -->
    <div id="install-guide" class="hidden mt-5 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-left text-xs text-slate-300 space-y-2">
      <div class="font-bold text-white flex items-center gap-1.5">
        <span>💡 Comment installer sur Android :</span>
      </div>
      <ol class="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
        <li>Touchez le menu <strong class="text-white">⋮ (3 points)</strong> en haut à droite de Chrome</li>
        <li>Touchez <strong class="text-emerald-400">« Ajouter à l'écran d'accueil »</strong> ou <strong class="text-emerald-400">« Installer l'application »</strong></li>
        <li>Le raccourci avec le logo apparaîtra directement sur votre écran d'accueil</li>
      </ol>
    </div>

    <p class="text-[11px] text-slate-500 mt-5">
      Touchez « Ouvrir le site web » pour accéder au lien, ou « Installer » pour créer l'icône sur votre téléphone.
    </p>
  </div>

  <script>
    // Immediate redirect if opened from Android Home Screen (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      window.location.replace("${safeUrl}");
    }

    // Register Service Worker for PWA compliance with root scope
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function(e) {
        console.warn('SW reg notice:', e);
      });
    }

    let deferredPrompt = null;
    const installBtn = document.getElementById('direct-install-btn');
    const installBtnText = document.getElementById('install-btn-text');
    const installedBanner = document.getElementById('installed-banner');
    const installGuide = document.getElementById('install-guide');
    const downloadShortcutBtn = document.getElementById('download-shortcut-btn');
    const autoInstall = ${shouldAutoInstall ? 'true' : 'false'};

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtnText) {
        installBtnText.innerText = "📲 Installer sur l'écran d'accueil (Prêt !)";
      }
      if (installBtn) {
        installBtn.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-700/80');
      }
      if (autoInstall) {
        triggerInstall();
      }
    });

    window.addEventListener('appinstalled', () => {
      if (installedBanner) installedBanner.classList.remove('hidden');
      if (installGuide) installGuide.classList.add('hidden');
      if (installBtn) {
        installBtn.innerHTML = '<span>✓ Déjà installé</span>';
        installBtn.classList.add('bg-slate-800', 'text-slate-400');
        installBtn.classList.remove('ring-2', 'ring-emerald-400', 'bg-emerald-700/80');
        installBtn.disabled = true;
      }
    });

    async function triggerInstall() {
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice && choice.outcome === 'accepted') {
            if (installedBanner) installedBanner.classList.remove('hidden');
            if (installGuide) installGuide.classList.add('hidden');
          }
        } catch (err) {
          console.warn('Prompt error:', err);
          if (installGuide) installGuide.classList.remove('hidden');
        }
      } else {
        // Show manual guidance instead of opening the link!
        if (installGuide) {
          installGuide.classList.remove('hidden');
        }
      }
    }

    if (installBtn) {
      installBtn.addEventListener('click', triggerInstall);
    }

    // Direct HTML shortcut download fallback
    if (downloadShortcutBtn) {
      downloadShortcutBtn.addEventListener('click', () => {
        const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeName}</title><link rel="icon" href="${safeIcon}"><script>window.location.replace("${safeUrl}");<\\/script></head><body><p>Redirection vers ${safeName}...</p></body></html>';
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '${safeName.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'raccourci'}.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
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

    // Otherwise render direct installation page with central Open button
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
