import React, { useState } from 'react';
import { Smartphone, ShieldAlert, Sparkles } from 'lucide-react';

export type BrowserTab = 'chrome' | 'samsung' | 'firefox' | 'edge' | 'opera';

interface BrowserGuideProps {
  defaultBrowser?: BrowserTab;
  detectedBrowserId?: BrowserTab;
}

interface Step {
  step: number;
  title: string;
  desc: string;
  highlight?: string;
}

const BROWSER_STEPS: Record<BrowserTab, { name: string; icon: string; steps: Step[]; tip: string }> = {
  chrome: {
    name: 'Google Chrome',
    icon: '🌐',
    steps: [
      {
        step: 1,
        title: 'Ouvrez le lien dans Google Chrome',
        desc: 'Ouvrez le site web sur votre smartphone Android à l\'aide de Chrome.',
        highlight: 'Scannez le QR Code ou ouvrez directement le lien.',
      },
      {
        step: 2,
        title: 'Ouvrez le menu Chrome (⋮)',
        desc: 'Appuyez sur les trois points verticaux ⋮ situés dans le coin supérieur droit de votre écran.',
        highlight: 'Bouton ⋮ en haut à droite.',
      },
      {
        step: 3,
        title: 'Sélectionnez « Ajouter à l\'écran d\'accueil »',
        desc: 'Faites défiler le menu et touchez « Ajouter à l\'écran d\'accueil » ou « Installer l\'application » si le site le propose.',
        highlight: 'Texte « Ajouter à l\'écran d\'accueil »',
      },
      {
        step: 4,
        title: 'Personnalisez le nom et validez',
        desc: 'Confirmez le nom personnalisé de votre raccourci, puis appuyez sur « Ajouter » (ou glissez l\'icône manuellement sur votre bureau).',
        highlight: 'Valider avec le bouton « Ajouter »',
      },
    ],
    tip: 'Astuce : Si le site est une PWA progressive, Chrome affichera directement « Installer l\'application » pour une intégration native complète.',
  },
  samsung: {
    name: 'Samsung Internet',
    icon: '🧭',
    steps: [
      {
        step: 1,
        title: 'Ouvrez le site dans Samsung Internet',
        desc: 'Accédez à la page web depuis le navigateur par défaut de votre appareil Samsung Galaxy.',
      },
      {
        step: 2,
        title: 'Ouvrez le menu Outils (☰)',
        desc: 'Touchez l\'icône des trois barres horizontales ☰ située dans le coin inférieur droit de la barre d\'outils.',
        highlight: 'Menu ☰ en bas à droite',
      },
      {
        step: 3,
        title: 'Touchez « Ajouter la page à »',
        desc: 'Sélectionnez l\'option « Ajouter la page à » dans la liste des actions disponibles.',
        highlight: 'Ajouter la page à...',
      },
      {
        step: 4,
        title: 'Choisissez « Écran d\'accueil »',
        desc: 'Sélectionnez « Écran d\'accueil » dans la boîte de dialogue, puis confirmez en appuyant sur « Ajouter ».',
      },
    ],
    tip: 'Samsung One UI place immédiatement l\'icône avec son favicon haute résolution sur la dernière page de votre lanceur d\'applications.',
  },
  firefox: {
    name: 'Mozilla Firefox',
    icon: '🦊',
    steps: [
      {
        step: 1,
        title: 'Ouvrez le lien dans Firefox Android',
        desc: 'Chargez l\'URL cible dans votre application Firefox mobile.',
      },
      {
        step: 2,
        title: 'Accédez au menu principal (⋮)',
        desc: 'Appuyez sur les trois points verticaux ⋮ situés à côté de la barre d\'adresse (en haut ou en bas selon votre configuration).',
      },
      {
        step: 3,
        title: 'Touchez « Ajouter à l\'écran d\'accueil »',
        desc: 'Appuyez directement sur « Ajouter à l\'écran d\'accueil ».',
      },
      {
        step: 4,
        title: 'Confirmez le raccourci',
        desc: 'Touchez « Ajouter automatiquement » ou maintenez votre doigt appuyé sur l\'icône pour la déposer exactement où vous voulez.',
      },
    ],
    tip: 'Firefox sur Android permet de positionner manuellement l\'icône au pixel près sur votre grille d\'accueil.',
  },
  edge: {
    name: 'Microsoft Edge',
    icon: '🌊',
    steps: [
      {
        step: 1,
        title: 'Ouvrez le site dans Edge Android',
        desc: 'Chargez la page web désirée dans Microsoft Edge.',
      },
      {
        step: 2,
        title: 'Touchez le menu ⋮ en bas',
        desc: 'Appuyez sur le menu avec trois points ou barres au centre de la barre d\'outils inférieure.',
      },
      {
        step: 3,
        title: 'Glissez vers « Ajouter à l\'écran d\'accueil »',
        desc: 'Dans le volet déroulant, sélectionnez l\'option « Ajouter à l\'écran d\'accueil ».',
      },
      {
        step: 4,
        title: 'Validez l\'ajout',
        desc: 'Confirmez le nom de l\'application et appuyez sur « Ajouter ».',
      },
    ],
    tip: 'Edge synchronise également vos favoris avec votre compte Microsoft sur PC.',
  },
  opera: {
    name: 'Opera / Brave',
    icon: '🦁',
    steps: [
      {
        step: 1,
        title: 'Ouvrez le site dans Opera ou Brave',
        desc: 'Ouvrez le lien web dans votre navigateur respectif.',
      },
      {
        step: 2,
        title: 'Ouvrez le menu du navigateur (⋮)',
        desc: 'Touchez les options du navigateur (icône ⋮ ou logo en haut/bas).',
      },
      {
        step: 3,
        title: 'Sélectionnez « Écran d\'accueil »',
        desc: 'Touchez « Ajouter à l\'écran d\'accueil » dans les paramètres de la page.',
      },
      {
        step: 4,
        title: 'Confirmez',
        desc: 'Validez la boîte de dialogue système Android.',
      },
    ],
    tip: 'Brave et Opera préservent vos boucliers antipub même via les raccourcis d\'accueil.',
  },
};

export const BrowserGuide: React.FC<BrowserGuideProps> = ({
  defaultBrowser = 'chrome',
  detectedBrowserId,
}) => {
  const [activeBrowser, setActiveBrowser] = useState<BrowserTab>(
    detectedBrowserId || defaultBrowser
  );
  const current = BROWSER_STEPS[activeBrowser];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-md space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            Instructions d'installation par navigateur
          </h4>
          <p className="text-xs text-slate-500">
            Sélectionnez votre navigateur mobile pour voir les étapes exactes
          </p>
        </div>

        {detectedBrowserId && (
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1 self-start sm:self-auto">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Navigateur actuel : {BROWSER_STEPS[detectedBrowserId]?.name}
          </span>
        )}
      </div>

      {/* Browser tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto scrollbar-none">
        {(Object.keys(BROWSER_STEPS) as BrowserTab[]).map((tab) => {
          const item = BROWSER_STEPS[tab];
          const isSelected = activeBrowser === tab;
          const isDetected = detectedBrowserId === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveBrowser(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
              {isDetected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" title="Votre navigateur détecté" />
              )}
            </button>
          );
        })}
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {current.steps.map((st) => (
          <div
            key={st.step}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              {st.step}
            </div>
            <div className="space-y-1">
              <h5 className="font-semibold text-xs sm:text-sm text-slate-900">
                {st.title}
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {st.desc}
              </p>
              {st.highlight && (
                <p className="text-[11px] font-semibold text-emerald-700">
                  👉 {st.highlight}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Browser specific tip */}
      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
        <span className="text-emerald-700 font-bold text-sm">💡</span>
        <span>{current.tip}</span>
      </div>

      {/* Security explanation */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">
            Sécurité système Android :{' '}
          </span>
          Chaque navigateur nécessite votre action dans son menu afin d'éviter tout ajout de raccourci non désiré.
        </div>
      </div>
    </div>
  );
};
