import React from 'react';
import { GenerationMethodId, MethodDetails } from '../types';
import {
  Smartphone,
  Compass,
  Layers,
  FileCode,
  Check,
  AlertCircle,
} from 'lucide-react';

interface MethodSelectorProps {
  selectedMethod: GenerationMethodId;
  onSelectMethod: (method: GenerationMethodId) => void;
}

export const METHODS: MethodDetails[] = [
  {
    id: 'standard',
    title: 'OPTION 1 — Standard Home Screen Shortcut',
    subtitle: 'Raccourci classique navigateur par défaut',
    badge: '100% Universel',
    description:
      'Crée un raccourci classique vers le site web d\'origine avec votre nom et icône personnalisés. S\'ouvre directement dans votre navigateur habituel (Chrome, Samsung Internet, Firefox, etc.).',
    features: [
      'Ouvre dans le navigateur par défaut de l\'utilisateur',
      'Conserve vos sessions actives, favoris et cookies existants',
      'Transfert instantané vers mobile via QR Code ou partage',
      'Instructions guidées pour chaque navigateur Android',
    ],
    technicalLimits:
      'Un site web ne peut pas s\'ajouter automatiquement sans accord : nécessite que l\'utilisateur clique sur « Ajouter à l\'écran d\'accueil » dans son navigateur.',
    isRecommended: true,
  },
  {
    id: 'chrome',
    title: 'OPTION 2 — Chrome Shortcut',
    subtitle: 'Optimisé Google Chrome Android',
    badge: 'Spécial Chrome',
    description:
      'Méthode spécialement taillée pour Google Chrome sur smartphone Android. Génère un lien direct d\'intention (Intent URL) ciblant Chrome pour un accès direct au menu d\'installation.',
    features: [
      'Force l\'ouverture dans Google Chrome via Intent',
      'Accès prioritaire à l\'option « Installer l\'application »',
      'Bouton de test direct pour ouvrir dans Chrome',
      'Solution de remplacement automatique si Chrome n\'est pas installé',
    ],
    technicalLimits:
      'Nécessite que l\'application Google Chrome soit installée sur l\'appareil Android de l\'utilisateur (bascule en mode standard en cas d\'absence).',
  },
  {
    id: 'pwa',
    title: 'OPTION 3 — PWA Standalone Launcher',
    subtitle: 'Expérience plein écran sans barre d\'adresse',
    badge: 'Immersion App',
    description:
      'Génère un Web App Manifest dynamique avec mode « standalone ». Permet d\'exécuter le site sans la barre d\'URL du navigateur, reproduisant fidèlement l\'ergonomie d\'une vraie application native.',
    features: [
      'Affichage plein écran immersif sans barre de navigation',
      'Génération automatique du manifest.json et splash screen',
      'Icône haute fidélité garantie sur l\'écran d\'accueil',
      'Bouton de téléchargement du manifest.json inclus',
    ],
    technicalLimits:
      'Certains sites web avec restrictions iframe ou politiques de sécurité strictes peuvent forcer une fenêtre externe selon la configuration du domaine hôte.',
  },
  {
    id: 'intent',
    title: 'OPTION 4 — Android Intent & Fichier Raccourci',
    subtitle: 'Fichier autonome .html & raccourci .url',
    badge: 'Fichier & Intent',
    description:
      'Génère un fichier de lancement autonome téléchargeable (.html avec redirection instantanée et icône intégrée) ainsi qu\'un lien Android Intent universel (android.intent.action.VIEW).',
    features: [
      'Fichier .html autonome prêt à être sauvegardé sur Android',
      'Compatible gestionnaires de fichiers (Files, MiXplorer, Solid)',
      'Lien universel Android Intent exploitable par d\'autres apps',
      'Aucune dépendance à un serveur tiers une fois téléchargé',
    ],
    technicalLimits:
      'Sur les versions Android récentes (13, 14, 15), créer un raccourci direct depuis un gestionnaire de fichiers requiert l\'autorisation du launcher ou un navigateur.',
  },
];

export const MethodSelector: React.FC<MethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900">
            Choisissez votre Méthode de Création
          </h3>
          <p className="text-xs text-slate-500">
            Comparez les 4 techniques selon vos besoins techniques et votre navigateur
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {METHODS.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <div
              key={method.id}
              className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between relative ${
                isSelected
                  ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-md shadow-emerald-600/5'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {method.id === 'standard' && <Smartphone className="w-5 h-5" />}
                      {method.id === 'chrome' && <Compass className="w-5 h-5" />}
                      {method.id === 'pwa' && <Layers className="w-5 h-5" />}
                      {method.id === 'intent' && <FileCode className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 block">
                        {method.badge}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                        {method.title}
                      </h4>
                    </div>
                  </div>

                  {method.isRecommended && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                      Recommandé
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                  {method.description}
                </p>

                {/* Feature bullets */}
                <ul className="space-y-1.5 mb-4 text-xs text-slate-600">
                  {method.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Technical limits */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-snug">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-800">Limite technique : </span>
                      {method.technicalLimits}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onSelectMethod(method.id)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    Méthode Sélectionnée
                  </>
                ) : (
                  'Choisir cette méthode'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
