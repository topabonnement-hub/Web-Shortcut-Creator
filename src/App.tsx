import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { WebsiteAnalysis, CustomShortcutConfig, IconSource } from './types';
import { normalizeUrl, generateClientFallbackAnalysis } from './utils/urlHelper';
import { Header } from './components/Header';
import { WizardStepper } from './components/WizardStepper';
import { UrlInputBar } from './components/UrlInputBar';
import { WebsitePreviewCard } from './components/WebsitePreviewCard';
import { Customizer } from './components/Customizer';
import { AndroidPhoneMockup } from './components/AndroidPhoneMockup';
import { ResultSection } from './components/ResultSection';
import { HelpModal } from './components/HelpModal';
import {
  Sparkles,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Eye,
  PlusSquare,
} from 'lucide-react';

const INITIAL_URL = 'https://fr.wikipedia.org';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<number>(1);
  const [mobileTab, setMobileTab] = useState<'wizard' | 'preview'>('wizard');

  const [url, setUrl] = useState<string>(INITIAL_URL);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [customIcons, setCustomIcons] = useState<IconSource[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [simulationModalOpen, setSimulationModalOpen] = useState<boolean>(false);

  const [config, setConfig] = useState<CustomShortcutConfig>({
    url: INITIAL_URL,
    title: 'Wikipédia',
    iconUrl: 'https://www.google.com/s2/favicons?domain=fr.wikipedia.org&sz=128',
    iconShape: 'squircle',
    themeColor: '#10b981',
    openMode: 'browser',
    customMonogram: {
      text: 'W',
      bgColor: '#10b981',
      textColor: '#ffffff',
      gradientEnd: '#047857',
    },
    method: 'pwa',
  });

  const stepContainerRef = useRef<HTMLDivElement>(null);

  // Navigate to step helper
  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    if (stepNumber > maxReachedStep) {
      setMaxReachedStep(stepNumber);
    }
    setMobileTab('wizard');
    stepContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Analyze website function
  const analyzeWebsite = async (targetUrl: string, autoAdvance = false) => {
    setError(null);
    const validation = normalizeUrl(targetUrl);
    if (!validation.isValid) {
      setError(validation.error || 'URL invalide');
      return;
    }

    const normalized = validation.url;
    setUrl(normalized);
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      });

      if (response.ok) {
        const data: WebsiteAnalysis = await response.json();
        setAnalysis(data);
        setConfig((prev) => ({
          ...prev,
          url: data.url,
          title: data.title || prev.title,
          iconUrl: data.defaultIcon || prev.iconUrl,
          themeColor: data.themeColor || prev.themeColor,
        }));
      } else {
        const fallback = generateClientFallbackAnalysis(normalized);
        setAnalysis(fallback);
        setConfig((prev) => ({
          ...prev,
          url: fallback.url,
          title: fallback.title,
          iconUrl: fallback.defaultIcon,
          themeColor: fallback.themeColor,
        }));
      }
    } catch {
      const fallback = generateClientFallbackAnalysis(normalized);
      setAnalysis(fallback);
      setConfig((prev) => ({
        ...prev,
        url: fallback.url,
        title: fallback.title,
        iconUrl: fallback.defaultIcon,
        themeColor: fallback.themeColor,
      }));
    } finally {
      setIsLoading(false);
      if (autoAdvance) {
        goToStep(2);
      }
    }
  };

  // Initial load
  useEffect(() => {
    analyzeWebsite(INITIAL_URL);
  }, []);

  // Step 1: Proceed to Step 2
  const handleProceedFromStep1 = async () => {
    if (!analysis) {
      await analyzeWebsite(url, true);
    } else {
      goToStep(2);
    }
  };

  // Step 2: Generate icon and go directly to Step 3 (Installation)
  const handleGenerateAndInstall = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#059669', '#0d9488', '#0891b2', '#2563eb', '#f59e0b'],
      });
    } catch {
      // ignore
    }
    goToStep(3);
  };

  // Reset wizard
  const handleResetWizard = () => {
    setUrl('');
    setAnalysis(null);
    setCurrentStep(1);
    setMaxReachedStep(1);
    setMobileTab('wizard');
  };

  // Custom icon added
  const handleAddCustomIcon = (iconSrc: string) => {
    const newIcon: IconSource = {
      src: iconSrc,
      label: 'Icône Personnalisée',
      size: 'Custom',
      source: 'user',
    };
    setCustomIcons((prev) => [newIcon, ...prev]);
  };

  const allAvailableIcons = [
    ...(customIcons || []),
    ...(analysis?.icons || [
      {
        src: config.iconUrl,
        label: 'Favicon HD',
        size: '128x128',
        source: 'default',
      },
    ]),
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 transition-colors">
      {/* App Header */}
      <Header onOpenHelpModal={() => setIsHelpOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Intro banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2 px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-800">Ajout d'Icône sur Mobile</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 font-medium">100% sans APK</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Créateur d'Icône d'Écran d'Accueil Android
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Transformez n'importe quel site web en véritable icône installable sur l'écran d'accueil de votre smartphone.
          </p>
        </div>

        {/* Wizard Stepper (3 Steps) */}
        <div ref={stepContainerRef}>
          <WizardStepper
            currentStep={currentStep}
            onSelectStep={goToStep}
            maxReachedStep={maxReachedStep}
          />
        </div>

        {/* Mobile & Tablet Tab Switcher (Visible on screens < lg) */}
        <div className="lg:hidden flex items-center p-1 bg-slate-200/90 rounded-xl max-w-md mx-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileTab('wizard')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
              mobileTab === 'wizard'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>Étape {currentStep} : Configuration</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
              mobileTab === 'preview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Aperçu Smartphone</span>
          </button>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Wizard Steps */}
          <div
            className={`lg:col-span-7 space-y-6 ${
              mobileTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* ================= STEP 1: Saisie & Analyse ================= */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Étape 1 sur 3
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Saisie du site web à transformer en icône
                      </h2>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium hidden xs:inline">
                      Favicon HD
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Saisissez l'adresse de votre site web favori. L'application extrait automatiquement son favicon, son nom officiel et son thème pour créer votre icône mobile.
                  </p>

                  <UrlInputBar
                    url={url}
                    onUrlChange={(val) => setUrl(val)}
                    onAnalyze={() => analyzeWebsite(url)}
                    isLoading={isLoading}
                    error={error}
                  />
                </div>

                {/* Website Preview Card once analyzed */}
                {analysis && (
                  <div className="space-y-4">
                    <WebsitePreviewCard
                      analysis={analysis}
                      onOpenManualCustomizer={() => goToStep(2)}
                    />
                  </div>
                )}

                {/* Step 1 Actions */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleProceedFromStep1}
                    disabled={isLoading || !url.trim()}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/15 disabled:opacity-40 transition-all min-h-[48px]"
                  >
                    <span>Personnaliser l'icône Android</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: Personnalisation de l'icône ================= */}
            {currentStep === 2 && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Étape 2 sur 3
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Personnalisation du nom & de l'icône Android
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-medium p-1"
                  >
                    Changer l'URL
                  </button>
                </div>

                <Customizer
                  config={config}
                  onChange={(updated) => setConfig((prev) => ({ ...prev, ...updated }))}
                  availableIcons={allAvailableIcons}
                  onAddCustomIcon={handleAddCustomIcon}
                />

                {/* Step 2 Actions -> Directly Installs */}
                <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between pt-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors min-h-[44px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour au site</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAndInstall}
                    className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all min-h-[48px]"
                  >
                    <PlusSquare className="w-4 h-4 text-emerald-100" />
                    <span>Créer et Installer l'Icône sur mon Mobile</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: Installation de l'icône sur mobile ================= */}
            {currentStep === 3 && analysis && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Étape 3 sur 3 : Icône Prête
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Installation de l'icône sur votre écran d'accueil
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetWizard}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs min-h-[36px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Autre site</span>
                  </button>
                </div>

                <ResultSection
                  config={config}
                  analysis={analysis}
                  onSimulateInPhone={() => setSimulationModalOpen(true)}
                />

                {/* Step 3 Return actions */}
                <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between pt-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors min-h-[44px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Modifier le nom ou l'icône</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetWizard}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[44px]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Créer une nouvelle icône</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Android Phone Simulator (Sticky on desktop, tabbed on mobile/tablet) */}
          <div
            className={`lg:col-span-5 lg:sticky lg:top-24 space-y-4 ${
              mobileTab === 'wizard' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-md flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-100 text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Rendu sur votre écran Android
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {config.iconShape.toUpperCase()}
                </span>
              </div>

              {/* The interactive Mockup */}
              <AndroidPhoneMockup
                config={config}
                onSimulateLaunch={() => setSimulationModalOpen(true)}
              />

              {/* Live Status summary */}
              <div className="w-full mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Nom sous l'icône :</span>
                  <span className="font-bold text-slate-900 text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {config.title}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Forme adaptative :</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {config.iconShape}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Site web cible :</span>
                  <span className="font-mono text-[11px] text-emerald-700 truncate max-w-[170px] sm:max-w-[200px] font-medium">
                    {config.url}
                  </span>
                </div>
              </div>

              {/* Mobile button to return to wizard */}
              <button
                type="button"
                onClick={() => setMobileTab('wizard')}
                className="lg:hidden w-full mt-4 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>Retour à la configuration (Étape {currentStep})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile floating quick preview trigger */}
        <div className="lg:hidden fixed bottom-4 right-4 z-30">
          <button
            type="button"
            onClick={() => setMobileTab(mobileTab === 'wizard' ? 'preview' : 'wizard')}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 text-white font-bold text-xs shadow-xl shadow-slate-900/30 border border-slate-700 active:scale-95 transition-all"
          >
            {mobileTab === 'wizard' ? (
              <>
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Voir mon icône</span>
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Édition (Étape {currentStep})</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Simulation Modal when tapping app in phone */}
      {simulationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-emerald-500 mx-auto p-2 flex items-center justify-center shadow-sm">
              <img
                src={config.iconUrl}
                alt={config.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">{config.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 break-all font-mono">
                {config.url}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed text-left">
              <span className="font-semibold text-emerald-800">Icône d'écran d'accueil :</span>{' '}
              Cette icône s'installe sur votre écran d'accueil Android et ouvre instantanément votre site web dans votre navigateur habituel.
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSimulationModalOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
              >
                Fermer
              </button>
              <a
                href={config.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ouvrir le site
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-slate-200/90 bg-white py-6 sm:py-8 mt-8 sm:mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="flex items-center justify-center gap-2 font-medium flex-wrap">
            <span className="font-semibold text-slate-800">Web Shortcut Creator</span>
            <span>·</span>
            <span>Créateur d'icône d'écran d'accueil pour Google Pixel, Samsung Galaxy, Xiaomi & tous appareils Android</span>
          </p>
          <p className="text-slate-400 text-[11px]">
            Pour votre sécurité, Android exige toujours votre confirmation lors de l'ajout d'une icône sur l'écran d'accueil.
          </p>
        </div>
      </footer>
    </div>
  );
}
