import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CustomShortcutConfig, WebsiteAnalysis } from '../types';
import { BrowserGuide } from './BrowserGuide';
import { detectDeviceAndBrowser, DeviceAndBrowserInfo } from '../utils/browserDetector';
import {
  QrCode,
  Share2,
  Copy,
  ExternalLink,
  Check,
  Smartphone,
  Sparkles,
  CheckCircle2,
  X,
  DownloadCloud,
  Layers,
  ShieldCheck,
  Cpu,
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

  // Dedicated launcher URL with full Web App Manifest for mobile icon & real app installation
  const launchParams = new URLSearchParams({
    url: config.url,
    name: config.title,
    icon: config.iconUrl,
    theme: config.themeColor || '#10b981',
  });
  const standaloneLaunchUrl = `${window.location.origin}/launch?${launchParams.toString()}`;

  // Generate QR Code for mobile scanning
  useEffect(() => {
    QRCode.toDataURL(standaloneLaunchUrl, {
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
      await navigator.clipboard.writeText(standaloneLaunchUrl);
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
          title: `Installer l'application ${config.title}`,
          text: `Installer l'application « ${config.title} » sur mon smartphone`,
          url: standaloneLaunchUrl,
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

  // Handle Direct App Installation
  const handleInstallAppToMobile = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstallStatus(`Application « ${config.title} » installée sur votre smartphone !`);
        }
        setDeferredPrompt(null);
        return;
      } catch {
        // fallback
      }
    }

    // Open dedicated installable launcher page which registers SW and triggers native install
    window.open(standaloneLaunchUrl, '_blank', 'noopener,noreferrer');
    setInstallModalOpen(true);
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
                <span>Application Mobile Prête</span>
              </span>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                Mode App Autonome
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {config.title}
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              Prêt pour installation comme une <strong>vraie application sur votre mobile</strong> (icône sur l'écran d'accueil, ouverture plein écran sans barre d'adresse et présence dans le gestionnaire multitâche d'Android).
            </p>
          </div>

          {/* Big App Installation CTA */}
          <div className="w-full sm:w-auto flex flex-col gap-2 shrink-0">
            <button
              onClick={handleInstallAppToMobile}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-emerald-600/30 active:scale-[0.98] flex items-center justify-center gap-2.5 min-h-[52px]"
            >
              <DownloadCloud className="w-5 h-5 text-emerald-100" />
              <span>Installer l'application sur mon mobile</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors shadow-2xs flex items-center justify-center gap-1.5 min-h-[38px]"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{shareSuccess ? 'Partagé !' : 'Partager'}</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors shadow-2xs flex items-center justify-center gap-1.5 min-h-[38px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copié' : 'Copier lien'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success notification if installed */}
        {installStatus && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-2 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{installStatus}</span>
          </div>
        )}
      </div>

      {/* App Technical Identity Badge */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Type de paquet</span>
            <span className="text-xs font-bold text-slate-900">App Web Mobile</span>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Affichage</span>
            <span className="text-xs font-bold text-slate-900">Plein écran (Standalone)</span>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Taille installée</span>
            <span className="text-xs font-bold text-slate-900">&lt; 15 Ko (Ultra léger)</span>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Sécurité</span>
            <span className="text-xs font-bold text-slate-900">Sans fichier APK</span>
          </div>
        </div>
      </div>

      {/* Two columns: Instant Transfer to Phone via QR Code + Direct Browser Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Transfer to Mobile Smartphone Card (5 cols on desktop) */}
        <div className="md:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  Installer sur mon smartphone
                </h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Scan 3 secondes
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-4 leading-relaxed">
              Scannez ce QR Code avec l'appareil photo ou Google Lens de votre téléphone Android pour ouvrir directement la boîte d'installation de l'application :
            </p>

            <div className="flex justify-center p-3 bg-white rounded-2xl shadow-sm max-w-[210px] mx-auto border-2 border-slate-200">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code pour installer l'application"
                  className="w-full h-auto aspect-square rounded-lg object-contain"
                />
              ) : (
                <div className="w-[180px] h-[180px] flex items-center justify-center text-slate-400 text-xs">
                  Génération du QR Code...
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[11px] text-center text-slate-500">
              Scannez pour installer l'application <strong>« {config.title} »</strong> sur votre écran d'accueil.
            </p>
          </div>
        </div>

        {/* How it installs as a real app on mobile (7 cols on desktop) */}
        <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  Comment l'application s'installe sur Android
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {deviceInfo.browserName}
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-3">
              Lorsque vous ouvrez le lien sur votre smartphone Android, l'installation se déroule comme une vraie application native :
            </p>

            {/* Visual step cards */}
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                    Déclenchez l'installation sur votre mobile
                  </h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Appuyez sur le bouton vert ci-dessus ou scannez le QR Code avec votre téléphone.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                    Confirmez « Installer l'application » ({deviceInfo.browserName})
                  </h5>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Votre navigateur affichera la boîte de dialogue système : appuyez sur <strong className="text-emerald-700">« Installer l'application »</strong> (ou menu {deviceInfo.menuIcon} &gt; « {deviceInfo.menuActionText} »).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </span>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-emerald-950">
                    L'application est installée sur votre écran d'accueil
                  </h5>
                  <p className="text-xs text-emerald-900 mt-0.5">
                    Elle fonctionne en plein écran sans barre d'adresse et apparaît avec sa propre icône dans vos applications Android !
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={standaloneLaunchUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ouvrir et installer l'application maintenant</span>
            </a>
          </div>
        </div>
      </div>

      {/* Browser specific illustrated guide tabs */}
      <BrowserGuide
        detectedBrowserId={deviceInfo.browserId}
        defaultBrowser={deviceInfo.browserId}
      />

      {/* Interactive Install Modal */}
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
              <div className="w-14 h-14 rounded-2xl bg-white border-2 border-emerald-500 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src={config.iconUrl}
                  alt={config.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Installer l'application « {config.title} »
                </h4>
                <p className="text-xs text-slate-500">
                  Installation sur votre smartphone Android
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900">
                👉 Pour installer comme une vraie application mobile :
              </p>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Ouvrez la page sur votre smartphone Android.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Appuyez sur le bouton vert <strong>« 📲 Installer l'application sur mon smartphone »</strong> qui s'affiche sur la page, ou touchez le menu <strong>({deviceInfo.menuIcon})</strong> de votre navigateur et sélectionnez <strong className="text-emerald-800">« Installer l'application »</strong>.
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={standaloneLaunchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Ouvrir la page d'installation de l'application</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  handleCopy();
                  setInstallModalOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors border border-slate-200"
              >
                {copied ? '✓ Lien copié !' : 'Copier l\'adresse pour l\'envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
