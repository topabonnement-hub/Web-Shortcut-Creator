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

  // Dynamic manifest generator for PWA launcher
  app.get('/api/manifest', (req: Request, res: Response) => {
    const name = (req.query.name as string) || 'Web Shortcut';
    const shortName = (req.query.short_name as string) || name.slice(0, 12);
    const startUrl = (req.query.url as string) || '/';
    const icon = (req.query.icon as string) || '/favicon.ico';
    const themeColor = (req.query.theme_color as string) || '#0f172a';
    const bgColor = (req.query.bg_color as string) || '#020617';

    const manifest = {
      name,
      short_name: shortName,
      start_url: startUrl,
      display: 'standalone',
      background_color: bgColor,
      theme_color: themeColor,
      description: `Raccourci pour ${name}`,
      icons: [
        {
          src: icon,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: icon,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    };

    res.setHeader('Content-Type', 'application/manifest+json');
    res.json(manifest);
  });

  // Standalone Launcher endpoint: simulates opening or installing the shortcut directly
  app.get('/launch', (req: Request, res: Response) => {
    const targetUrl = (req.query.url as string) || 'https://google.com';
    const name = (req.query.name as string) || 'Web Shortcut';
    const icon = (req.query.icon as string) || '';
    const themeColor = (req.query.theme as string) || '#0f172a';

    const safeUrl = encodeURI(targetUrl);
    const safeName = String(name).replace(/"/g, '&quot;');
    const safeIcon = icon ? encodeURI(icon) : '';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${safeName}</title>
  <meta name="theme-color" content="${themeColor}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="icon" href="${safeIcon || '/favicon.ico'}">
  <link rel="apple-touch-icon" href="${safeIcon || '/favicon.ico'}">
  <link rel="manifest" href="/api/manifest?name=${encodeURIComponent(name)}&url=${encodeURIComponent(targetUrl)}&icon=${encodeURIComponent(icon)}&theme_color=${encodeURIComponent(themeColor)}">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06);
    }
    .icon-wrap {
      width: 88px;
      height: 88px;
      margin: 0 auto 20px;
      border-radius: 22px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 2px solid #e2e8f0;
      box-shadow: 0 4px 10px -2px rgba(0,0,0,0.06);
    }
    .icon-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #0f172a;
    }
    p {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 24px;
      word-break: break-all;
    }
    .btn {
      display: block;
      width: 100%;
      background: #059669;
      color: #ffffff;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 20px;
      border-radius: 14px;
      text-decoration: none;
      transition: background 0.15s ease;
      margin-bottom: 12px;
    }
    .btn:hover { background: #10b981; }
    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      font-size: 13px;
      padding: 12px 18px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .hint {
      margin-top: 16px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">
      ${safeIcon ? `<img src="${safeIcon}" alt="${safeName}" onerror="this.style.display='none'">` : '🌐'}
    </div>
    <h1>${safeName}</h1>
    <p>${safeUrl}</p>
    <a href="${safeUrl}" class="btn">🚀 Ouvrir le site web</a>
    <a href="/" class="btn btn-secondary">Créer un autre raccourci</a>
    <div class="hint">
      <strong>Astuce Android :</strong> Ouvrez le menu de votre navigateur (les 3 points verticaux ⋮) puis choisissez <em>« Ajouter à l'écran d'accueil »</em>.
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
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
