import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CustomShortcutConfig, WebsiteAnalysis } from '../types';
import {
  buildChromeIntentUrl,
  buildUniversalIntentUrl,
  generateHtmlShortcutContent,
  generateWebManifestJson,
  downloadFile,
} from '../utils/urlHelper';
import { BrowserGuide, BrowserTab } from './BrowserGuide';
import { detectDeviceAndBrowser, DeviceAndBrowserInfo } from '../utils/browserDetector';
import {
  QrCode,
  Share2,
  Copy,
  ExternalLink,
  Download,
  Check,
  Info,
  Smartphone,
  PlusSquare,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  Compass,
} from 'lucide-react';

interface ResultSectionProps {
  config: CustomShortcutConfig;
  analysis: WebsiteAnalysis;
  onSimulateInPhone: () => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  config,
}) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceAndBrowserInfo>(detectDeviceAndBrowser());
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [installModalOpen, setInstallModalOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  // Detect device and browser on mount
  useEffect(() => {
    setDeviceInfo(detectDeviceAndBrowser());
  }, []);

  // Listen for beforeinstallprompt if browser supports it
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Compute final effective URL based on method
  let effectiveActionUrl = config.url;
  const launchParams = new URLSearchParams({
    url: config.url,
    name: config.title,
    icon: config.iconUrl,
    theme: config.themeColor || '#10b981',
  });
  const standaloneLaunchUrl = `${window.location.origin}/launch?${launchParams.toString()}`;

  if (config.method === 'chrome') {
    effectiveActionUrl = buildChromeIntentUrl(config.url);
  } else if (config.method === 'pwa') {
    effectiveActionUrl = standaloneLaunchUrl;
  } else if (config.method === 'intent') {
    effectiveActionUrl = buildUniversalIntentUrl(config.url);
  }

  // Generate QR Code on mount or config change
  useEffect(() => {
    const urlForMobileScan =
      config.method === 'pwa' ? standaloneLaunchUrl : config.url;

    QRCode.toDataURL(urlForMobileScan, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code error', err));
  }, [config, standaloneLaunchUrl]);

  // Handle Copy Link
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(config.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // Handle Mobile Web Share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: config.title,
          text: `Raccourci Android pour ${config.title}`,
          url: config.method === 'pwa' ? standaloneLaunchUrl : config.url,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  // Handle Download HTML Launcher File
  const handleDownloadHtmlLauncher = () => {
    const html = generateHtmlShortcutContent(config);
    const filename = `${config.title.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'raccourci'}.html`;
    downloadFile(filename, html, 'text/html');
  };

  // Handle Download Manifest JSON
  const handleDownloadManifest = () => {
    const json = generateWebManifestJson(config);
    downloadFile('manifest.json', json, 'application/manifest+json');
  };

  // Handle Download Windows / Android .url file
  const handleDownloadUrlFile = () => {
    const content = `[InternetShortcut]\nURL=${config.url}\nIconFile=${config.iconUrl}\n`;
    const filename = `${config.title.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'raccourci'}.url`;
    downloadFile(filename, content, 'text/plain');
  };

  // Handle Browser-Tailored Install Action
  const handleBrowserInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstallStatus(`Raccourci installé avec succès dans ${deviceInfo.browserName} !`);
        }
        setDeferredPrompt(null);
        return;
      } catch {
        // fallback to modal
      }
    }

    if (deviceInfo.isAndroid) {
      // Direct opening in current browser
      window.open(standaloneLaunchUrl, '_blank', 'noopener,noreferrer');
      setInstallModalOpen(true);
    } else {
      // On desktop, show modal explaining phone scan or desktop bookmark
      setInstallModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Browser-Specific Install Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-cyan-50 border-2 border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 text-2xl">
              {deviceInfo.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  Navigateur détecté : {deviceInfo.browserName}
                </span>
                {deviceInfo.isAndroid ? (
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded border border-teal-300">
                    Appareil Android
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Ordinateur de bureau
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mt-1">
                Installer « {config.title} » via {deviceInfo.browserName}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {deviceInfo.isAndroid
                  ? deviceInfo.quickInstruction
                  : `Pour l'écran d'accueil de votre téléphone : scannez le QR code ou ouvrez le raccourci dans ${deviceInfo.browserName}.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleBrowserInstall}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98]"
            >
              <PlusSquare className="w-4 h-4" />
              <span>{deviceInfo.installButtonLabel}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors shadow-2xs"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>{shareSuccess ? 'Partagé !' : 'Partager'}</span>
            </button>
          </div>
        </div>

        {/* Status notification */}
        {installStatus && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-2 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{installStatus}</span>
          </div>
        )}
      </div>

      {/* Browser-Tailored Install Method Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600" />
              Installation adaptée à votre configuration
            </h4>
            <p className="text-xs text-slate-500">
              Procédure optimisée en fonction de {deviceInfo.browserName}
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto">
            {deviceInfo.isAndroid ? 'Android détecté' : 'Mode transfert PC → Mobile'}
          </span>
        </div>

        {/* Highlighted box tailored to opening browser */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{deviceInfo.icon}</span>
              <h5 className="font-bold text-sm text-slate-900">
                Action dans {deviceInfo.browserName} :
              </h5>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              👉 {deviceInfo.quickInstruction}
            </p>
            <p className="text-[11px] text-slate-500">
              Emplacement du menu : <strong className="text-slate-700">{deviceInfo.menuLocation}</strong> ({deviceInfo.menuIcon})
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={standaloneLaunchUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ouvrir dans {deviceInfo.browserName}</span>
            </a>
            <button
              type="button"
              onClick={() => setInstallModalOpen(true)}
              className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors shadow-2xs"
            >
              Guide visuel
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Mobile Transfer + Downloads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Transfer to Smartphone via QR Code */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  Transférer vers mon téléphone
                </h4>
              </div>
              <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Scan instantané
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-4 leading-relaxed">
              Si vous êtes sur votre ordinateur, visez ce QR Code avec l'appareil photo ou Google Lens de votre smartphone Android pour ouvrir directement la page et l'ajouter à votre écran d'accueil.
            </p>

            <div className="flex justify-center p-3 bg-white rounded-2xl shadow-sm max-w-[220px] mx-auto border-2 border-slate-200">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code vers le raccourci"
                  className="w-full h-auto aspect-square rounded-lg object-contain"
                />
              ) : (
                <div className="w-[180px] h-[180px] flex items-center justify-center text-slate-400 text-xs">
                  Génération du QR Code...
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={config.url}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono truncate select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shrink-0 border border-slate-200 transition-colors"
                title="Copier le lien"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Downloads & Direct Actions */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  Téléchargements & Raccourcis Autonomes
                </h4>
              </div>
              <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Sans serveur
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-4 leading-relaxed">
              Téléchargez des fichiers de raccourci autonomes prêts à l'emploi. Ils contiennent les icônes en haute résolution et les redirections vers votre site.
            </p>

            <div className="space-y-2.5">
              {/* Download HTML launcher */}
              <button
                type="button"
                onClick={handleDownloadHtmlLauncher}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-mono text-xs font-bold">
                    .HTML
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-900 group-hover:text-emerald-800 transition-colors">
                      Télécharger le Lanceur Web (.html)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Fichier léger autonome avec icône embarquée et redirection
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>

              {/* Download manifest.json */}
              <button
                type="button"
                onClick={handleDownloadManifest}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all text-left flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 border border-teal-300 flex items-center justify-center font-mono text-xs font-bold">
                    .JSON
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-900 group-hover:text-teal-800 transition-colors">
                      Télécharger le Manifest PWA (manifest.json)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Configuration Web App Manifest avec display standalone
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
              </button>

              {/* Download .url shortcut */}
              <button
                type="button"
                onClick={handleDownloadUrlFile}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all text-left flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center font-mono text-xs font-bold">
                    .URL
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-900 group-hover:text-slate-800 transition-colors">
                      Télécharger le Raccourci Standard (.url)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Format standard compatible fichiers et stockage externe
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Les fichiers téléchargés peuvent être transférés sur votre téléphone via Google Drive, Bluetooth ou câble USB.
            </span>
          </div>
        </div>
      </div>

      {/* Step by Step Browser Installation Guide - Pre-selects Detected Browser */}
      <BrowserGuide
        detectedBrowserId={deviceInfo.browserId}
        defaultBrowser={deviceInfo.browserId}
      />

      {/* Interactive Install Modal with Tailored Browser Steps */}
      {installModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setInstallModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl">
                {deviceInfo.icon}
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Installation dans {deviceInfo.browserName}
                </h4>
                <p className="text-xs text-slate-500">
                  {deviceInfo.isAndroid ? 'Sur votre smartphone Android' : 'Transfert vers votre smartphone'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900">
                👉 Comment ajouter l'icône dans {deviceInfo.browserName} :
              </p>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Ouvrez la page cible dans {deviceInfo.browserName}.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Appuyez sur le menu <strong className="text-slate-900">({deviceInfo.menuIcon})</strong> situé {deviceInfo.menuLocation}.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Touchez <strong className="text-emerald-800">« {deviceInfo.menuActionText} »</strong> pour valider l'ajout sur votre écran d'accueil.
                </span>
              </div>
            </div>

            {/* Quick Actions inside modal */}
            <div className="space-y-2 pt-2">
              <a
                href={standaloneLaunchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ouvrir dans {deviceInfo.browserName}</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  handleCopy();
                  setInstallModalOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors border border-slate-200"
              >
                {copied ? '✓ Lien copié !' : 'Copier l\'adresse du raccourci'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
