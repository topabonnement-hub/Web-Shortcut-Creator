import { CustomShortcutConfig, WebsiteAnalysis } from '../types';

export function normalizeUrl(input: string): { isValid: boolean; url: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, url: '', error: 'Veuillez saisir une URL de site web.' };
  }

  let prepared = trimmed;
  if (!/^https?:\/\//i.test(prepared)) {
    prepared = 'https://' + prepared;
  }

  try {
    const parsed = new URL(prepared);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { isValid: false, url: prepared, error: 'Nom de domaine incomplet ou invalide (ex: example.com).' };
    }
    return { isValid: true, url: parsed.href };
  } catch {
    return { isValid: false, url: prepared, error: 'Format d\'adresse web URL invalide.' };
  }
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

export function generateClientFallbackAnalysis(url: string): WebsiteAnalysis {
  const norm = normalizeUrl(url);
  const targetUrl = norm.isValid ? norm.url : 'https://' + url;
  let domain = 'example.com';
  let fullDomain = 'example.com';
  let protocol = 'https';

  try {
    const parsed = new URL(targetUrl);
    fullDomain = parsed.hostname;
    domain = parsed.hostname.replace(/^www\./i, '');
    protocol = parsed.protocol.replace(':', '');
  } catch {
    // fallback
  }

  const parts = domain.split('.');
  const rawName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : domain;

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
      src: `https://unavatar.io/${encodeURIComponent(domain)}`,
      label: 'Unavatar HD',
      size: '128x128',
      source: 'unavatar',
    },
    {
      src: `https://${fullDomain}/favicon.ico`,
      label: 'Favicon Direct',
      size: '32x32',
      source: 'direct',
    },
  ];

  return {
    url: targetUrl,
    domain,
    fullDomain,
    protocol,
    title: rawName,
    rawTitle: rawName,
    siteName: rawName,
    description: `Raccourci vers ${domain}`,
    themeColor: '#10b981',
    hasManifest: false,
    icons: fallbackIcons,
    defaultIcon: fallbackIcons[0].src,
    crawlStatus: 'fallback',
  };
}

export function buildChromeIntentUrl(url: string): string {
  const clean = url.replace(/^https?:\/\//i, '');
  return `intent://${clean}#Intent;scheme=https;package=com.android.chrome;end`;
}

export function buildUniversalIntentUrl(url: string): string {
  const clean = url.replace(/^https?:\/\//i, '');
  return `intent://${clean}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
}

export function generateWebManifestJson(config: CustomShortcutConfig): string {
  const shortName = config.title.length > 12 ? config.title.slice(0, 12) : config.title;
  const manifest = {
    name: config.title,
    short_name: shortName,
    start_url: config.url,
    display: config.openMode === 'standalone' ? 'standalone' : 'minimal-ui',
    background_color: '#0f172a',
    theme_color: config.themeColor || '#10b981',
    description: `Raccourci Android pour ${config.title}`,
    icons: [
      {
        src: config.iconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: config.iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };

  return JSON.stringify(manifest, null, 2);
}

export function generateHtmlShortcutContent(config: CustomShortcutConfig): string {
  const safeTitle = config.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeUrl = config.url;
  const safeIcon = config.iconUrl;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${safeTitle}</title>
  <meta name="theme-color" content="${config.themeColor}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <link rel="icon" href="${safeIcon}">
  <link rel="apple-touch-icon" href="${safeIcon}">
  <meta http-equiv="refresh" content="0; url=${safeUrl}">
  <script>
    // Redirection immédiate vers le site d'origine
    window.location.replace("${safeUrl}");
  </script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      text-align: center;
    }
    .icon {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    a {
      color: #059669;
      text-decoration: underline;
      margin-top: 12px;
      display: inline-block;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <img src="${safeIcon}" alt="${safeTitle}" class="icon" onerror="this.style.display='none'">
  <h2>Redirection vers ${safeTitle}...</h2>
  <p><a href="${safeUrl}">Cliquez ici si la redirection ne démarre pas automatiquement</a></p>
</body>
</html>`;
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
