import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { WebsiteAnalysis, CustomShortcutConfig, GenerationMethodId, IconSource } from './types';
import { normalizeUrl, generateClientFallbackAnalysis } from './utils/urlHelper';
import { Header } from './components/Header';
import { WizardStepper } from './components/WizardStepper';
import { UrlInputBar } from './components/UrlInputBar';
import { WebsitePreviewCard } from './components/WebsitePreviewCard';
import { Customizer } from './components/Customizer';
import { MethodSelector } from './components/MethodSelector';
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
} from 'lucide-react';

const INITIAL_URL = 'https://fr.wikipedia.org';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<number>(1);

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
    method: 'standard',
  });

  const stepContainerRef = useRef<HTMLDivElement>(null);

  // Navigate to step helper
  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    if (stepNumber > maxReachedStep) {
      setMaxReachedStep(stepNumber);
    }
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

  // Step 3: Generate and go to Step 4
  const handleGenerate = () => {
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
    goToStep(4);
  };

  // Reset wizard
  const handleResetWizard = () => {
    setUrl('');
    setAnalysis(null);
    setCurrentStep(1);
    setMaxReachedStep(1);
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Intro banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-800">Assistant Étape par Étape</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 font-medium">100% sans APK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Créateur de Raccourcis Android
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Suivez les 4 étapes guidées pour créer et installer votre raccourci écran d'accueil personnalisé.
          </p>
        </div>

        {/* Wizard Stepper */}
        <div ref={stepContainerRef}>
          <WizardStepper
            currentStep={currentStep}
            onSelectStep={goToStep}
            maxReachedStep={maxReachedStep}
          />
        </div>

        {/* Main 2-Column Grid: Wizard Steps on Left (7 cols), Android Phone Mockup on Right (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Wizard Steps */}
          <div className="lg:col-span-7 space-y-6">
            {/* ================= STEP 1: Saisie & Analyse ================= */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Étape 1 sur 4
                      </span>
                      <h2 className="text-lg font-bold text-slate-900">
                        Saisie et Analyse de l'adresse web
                      </h2>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                      Extraction HD
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Saisissez l'adresse de votre site favori. Le système vérifie l'URL, extrait le protocole sécurisé, le titre officiel et les favicons disponibles.
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
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/15 disabled:opacity-40 transition-all"
                  >
                    <span>Continuer vers la Personnalisation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: Personnalisation ================= */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Étape 2 sur 4
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">
                      Personnalisation de l'icône & du nom
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
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

                {/* Step 2 Actions */}
                <div className="flex items-center justify-between pt-2 gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/15 transition-all"
                  >
                    <span>Continuer vers le Choix de la Méthode</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: Choix de la Méthode ================= */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Étape 3 sur 4
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    Choisissez votre Méthode de Création
                  </h2>
                </div>

                <MethodSelector
                  selectedMethod={config.method}
                  onSelectMethod={(method: GenerationMethodId) => setConfig((prev) => ({ ...prev, method }))}
                />

                {/* Step 3 Actions */}
                <div className="flex items-center justify-between pt-2 gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour au style</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-100" />
                    <span>Générer le Raccourci Android</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 4: Installation & Résultat ================= */}
            {currentStep === 4 && analysis && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Étape 4 sur 4 : Raccourci Prêt
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">
                      Installation sur votre Smartphone
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetWizard}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Nouveau raccourci</span>
                  </button>
                </div>

                <ResultSection
                  config={config}
                  analysis={analysis}
                  onSimulateInPhone={() => setSimulationModalOpen(true)}
                />

                {/* Step 4 Return actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Modifier la méthode ou l'icône</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetWizard}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Recommencer pour un autre site</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Android Phone Simulator (Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-100 text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Simulateur Android en Direct
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
              <div className="w-full mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Étape active :</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    Étape {currentStep} / 4
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Méthode choisie :</span>
                  <span className="font-semibold text-slate-800 uppercase text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {config.method}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mode d'affichage :</span>
                  <span className="font-semibold text-slate-800">
                    {config.openMode === 'standalone' ? 'Plein écran (PWA)' : 'Navigateur par défaut'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cible :</span>
                  <span className="font-mono text-[11px] text-emerald-700 truncate max-w-[180px] font-medium">
                    {config.url}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
              <span className="font-semibold text-emerald-800">Simulation Android :</span>{' '}
              {config.openMode === 'standalone'
                ? 'Ce raccourci s\'ouvrira en plein écran sans barre d\'adresse comme une application native Android.'
                : 'Ce raccourci s\'ouvrira dans un nouvel onglet de votre navigateur par défaut habituel.'}
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
      <footer className="border-t border-slate-200/90 bg-white py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="flex items-center justify-center gap-2 font-medium">
            <span className="font-semibold text-slate-800">Web Shortcut Creator</span>
            <span>·</span>
            <span>Compatible Google Pixel, Samsung Galaxy, Xiaomi, Motorola & tous appareils Android</span>
          </p>
          <p className="text-slate-400 text-[11px]">
            Pour votre sécurité, Android exige toujours votre confirmation lors de l'ajout d'une icône sur l'écran d'accueil.
          </p>
        </div>
      </footer>
    </div>
  );
}
