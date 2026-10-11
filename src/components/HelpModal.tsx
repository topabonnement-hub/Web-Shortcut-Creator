import React from 'react';
import { X, ShieldCheck, Smartphone, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              Guide & Fonctionnement de Web Shortcut Creator
            </h3>
            <p className="text-xs text-slate-500">
              Comprendre les raccourcis d'écran d'accueil sur smartphone Android
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="font-semibold text-sm text-emerald-800 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Pourquoi aucun site web ne peut installer d'icône directement ?
            </h4>
            <p className="text-slate-600">
              Android protège rigoureusement la sécurité de ses utilisateurs. Les navigateurs modernes (Chrome, Samsung Internet, Firefox) interdisent à n'importe quel site web d'écrire silencieusement sur votre écran d'accueil sans confirmation explicite. Web Shortcut Creator prépare l'URL, l'icône HD et le manifest, puis vous guide en un clic pour valider l'ajout dans votre navigateur favori.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-semibold text-sm text-teal-800">
              Les 4 méthodes de génération expliquées
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li>
                <strong className="text-slate-900">1. Standard Home Screen :</strong> Le raccourci universel. Ouvre votre navigateur par défaut avec vos onglets et cookies habituels.
              </li>
              <li>
                <strong className="text-slate-900">2. Chrome Shortcut :</strong> Utilise un Intent Android ciblant Google Chrome pour garantir l'utilisation de Chrome et de ses fonctions d'installation.
              </li>
              <li>
                <strong className="text-slate-900">3. PWA Standalone Launcher :</strong> Mode immersif plein écran sans barre d'adresse pour une expérience identique à une application native.
              </li>
              <li>
                <strong className="text-slate-900">4. Intent & Fichier Autonome :</strong> Fichier .html ou .url téléchargeable contenant les redirections et icônes embarquées, idéal pour sauvegarder ou envoyer.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="font-semibold text-sm text-sky-800 mb-1 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-sky-600" />
              Comment utiliser sur smartphone Android ?
            </h4>
            <p className="text-slate-600">
              1. Scannez le QR Code généré avec votre smartphone.<br />
              2. Ouvrez la page dans votre navigateur Android (ex: Chrome).<br />
              3. Appuyez sur le menu (les 3 points ⋮ en haut à droite).<br />
              4. Choisissez <em>« Ajouter à l'écran d'accueil »</em>.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};
