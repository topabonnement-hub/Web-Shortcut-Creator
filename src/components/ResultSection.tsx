import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CustomShortcutConfig, WebsiteAnalysis } from '../types';
import {
  downloadFile,
  generateHtmlShortcutContent,
  generateWebManifestJson,
} from '../utils/urlHelper';
import {
  QrCode,
  Share2,
  Copy,
  ExternalLink,
  Check,
  Sparkles,
  Download,
  RotateCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface ResultSectionProps {
  config: CustomShortcutConfig;
  analysis: WebsiteAnalysis;
  onSimulateInPhone: () => void;
  onOpenFullPage?: () => void;
  onPurgeData?: () => void;
  deferredPrompt?: any;
  isInstalled?: boolean;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  config,
  onPurgeData,
  deferredPrompt,
  isInstalled = false,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'downloaded'>('idle');

  // Direct target website URL (never wraps in generator applet link)
  const targetUrl = config.url || 'https://google.com';

  // Generate QR Code directly for the real website
  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code error', err));
  }, [targetUrl]);

  // Direct 1-Click Installation Handler
  const handleDirectInstall = async () => {
    // Method 1: Native Android beforeinstallprompt if triggered on mobile browser
    if (deferredPrompt) {
      try {
        setInstallStatus('installing');
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setInstallStatus('success');
          return;
        }
      } catch (err) {
        console.warn('Direct prompt failed:', err);
      }
    }

    // Method 2: Instant working install method - download standalone shortcut file that opens target website directly with custom icon
    handleDownloadHtmlShortcut();
    setInstallStatus('downloaded');
  };

  // Handle Copy Link: copies the direct website URL
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // Handle Mobile Share: shares direct website URL
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: config.title,
          text: `Raccourci pour ${config.title}`,
          url: targetUrl,
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

  // Open the real website directly in a new window/tab
  const handleOpenSite = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Download custom HTML shortcut file (opens site directly with custom icon)
  const handleDownloadHtmlShortcut = () => {
    const filename = `${config.title.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'raccourci'}.html`;
    const content = generateHtmlShortcutContent(config);
    downloadFile(filename, content, 'text/html');
  };

  // Download Manifest
  const handleDownloadManifest = () => {
    const content = generateWebManifestJson(config);
    downloadFile('manifest.json', content, 'application/json');
  };

  // Download Icon
  const handleDownloadIcon = () => {
    const a = document.createElement('a');
    a.href = config.iconUrl;
    a.download = `${config.title || 'icone'}-icon.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Primary Mobile App Installation Hero Card */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-cyan-50 border-2 border-emerald-400 rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          {/* Real customized app icon */}
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 bg-white border-2 border-emerald-400 p-2 shadow-xl shadow-emerald-600/20 flex items-center justify-center overflow-hidden transition-transform hover:scale-105"
              style={{
                borderRadius:
                  config.iconShape === 'circle'
                    ? '9999px'
                    : config.iconShape === 'squircle'
                    ? '26%'
                    : '20px',
              }}
            >
              <img
                src={config.iconUrl}
                alt={config.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Details & App specs */}
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Prêt pour Android</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-700 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200 truncate max-w-[260px]">
                {targetUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {config.title}
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              Accédez directement à votre site web ou installez le raccourci sur votre écran d'accueil Android.
            </p>
          </div>

          {/* Action CTAs: Open button in center and Install button */}
          <div className="w-full sm:w-auto flex flex-col gap-2.5 shrink-0">
            {/* Prominent Center Open Button */}
            <button
              onClick={handleOpenSite}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base transition-all shadow-xl shadow-emerald-600/30 active:scale-[0.98] flex items-center justify-center gap-2.5 ring-2 ring-emerald-400/50"
            >
              <ExternalLink className="w-5 h-5 text-emerald-200" />
              <span>Ouvrir le site web</span>
            </button>

            {/* Direct 1-Click Install Button */}
            <button
              onClick={handleDirectInstall}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 border border-slate-700"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>📲 Installer sur l'écran d'accueil</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors shadow-2xs flex items-center justify-center gap-1.5 min-h-[38px]"
                title="Copier le lien direct du site"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copié' : 'Copier lien'}</span>
              </button>
              <button
                onClick={handleShare}
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors shadow-2xs flex items-center justify-center gap-1.5 min-h-[38px]"
                title="Partager l'adresse web"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{shareSuccess ? 'Partagé !' : 'Partager'}</span>
              </button>
              <button
                onClick={handleDownloadHtmlShortcut}
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors shadow-2xs flex items-center justify-center gap-1.5 min-h-[38px]"
                title="Télécharger raccourci .html"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>.HTML</span>
              </button>
            </div>

            {onPurgeData && (
              <button
                onClick={onPurgeData}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-medium text-[11px] border border-slate-200 hover:border-rose-200 transition-all shadow-2xs flex items-center justify-center gap-1.5"
                title="Créer un nouveau raccourci indépendant"
              >
                <RotateCcw className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                <span>Nouveau raccourci</span>
              </button>
            )}
          </div>
        </div>

        {/* Status notification */}
        {installStatus === 'success' || isInstalled ? (
          <div className="mt-3.5 p-3 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-2 text-xs font-semibold shadow-xs">
            <Check className="w-4 h-4 text-emerald-700 shrink-0 stroke-[3]" />
            <span>Raccourci installé avec succès sur votre écran d'accueil Android !</span>
          </div>
        ) : installStatus === 'downloaded' ? (
          <div className="mt-3.5 p-3 rounded-xl bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-2 text-xs font-semibold shadow-xs">
            <Download className="w-4 h-4 text-teal-700 shrink-0 stroke-[3]" />
            <span>Fichier raccourci téléchargé : ouvrez-le pour lancer directement votre site !</span>
          </div>
        ) : (
          <div className="mt-3.5 p-2.5 rounded-xl bg-white/80 border border-emerald-200 flex items-center gap-2 text-xs text-slate-600 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Chaque raccourci est indépendant : l'ajout d'une nouvelle icône n'écrase jamais vos icônes existantes.
            </span>
          </div>
        )}
      </div>

      {/* Two columns: Direct 1-Click Installation Card + QR Code Instant Scan */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Direct 1-Click Installation Card (7 cols on desktop) */}
        <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">
                    Installation directe sur Android
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sans passer par les menus du navigateur
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                1 Clic Direct
              </span>
            </div>

            {/* Direct Step Cards */}
            <div className="space-y-2.5 mt-3.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  1
                </span>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                    Touchez le bouton « Installer directement »
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Déclenche instantanément la boîte de dialogue d'ajout d'icône Android.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  2
                </span>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                    Validez « Ajouter » ou « Installer »
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confirmez l'ajout dans la fenêtre pop-up système Android.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  ✓
                </span>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-emerald-950">
                    Votre icône apparaît immédiatement sur l'écran d'accueil
                  </h5>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Elle ouvre directement votre site web <span className="font-semibold underline">{targetUrl}</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleDirectInstall}
              className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-600/20"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Installer maintenant</span>
            </button>
            <button
              onClick={handleDownloadHtmlShortcut}
              className="w-full sm:w-auto py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
              title="Télécharger le raccourci autonome .html"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Raccourci .html</span>
            </button>
          </div>
        </div>

        {/* Transfer to Mobile Smartphone Card via QR Code (5 cols on desktop) */}
        <div className="md:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  Scanner avec votre mobile
                </h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Lien direct
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2.5 mb-3">
              Scannez pour ouvrir directement sur votre smartphone :
            </p>

            <div className="flex justify-center p-2.5 bg-white rounded-2xl shadow-xs max-w-[200px] mx-auto border border-slate-200">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code du site"
                  className="w-full h-auto aspect-square rounded-lg object-contain"
                />
              ) : (
                <div className="w-[170px] h-[170px] flex items-center justify-center text-slate-400 text-xs">
                  Génération...
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 truncate" title={targetUrl}>
              {targetUrl}
            </span>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 shrink-0"
            >
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Additional Resource Downloads */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Fichiers exportables pour votre icône :</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadIcon}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors border border-slate-200"
          >
            Télécharger l'icône HD (.png)
          </button>
          <button
            onClick={handleDownloadHtmlShortcut}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors border border-slate-200"
          >
            Fichier Raccourci (.html)
          </button>
          <button
            onClick={handleDownloadManifest}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors border border-slate-200"
          >
            Web Manifest (.json)
          </button>
        </div>
      </div>
    </div>
  );
};
