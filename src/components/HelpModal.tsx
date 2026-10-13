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
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Comment fonctionne l'installation ?
            </h4>
            <p className="text-slate-600">
              Web Shortcut Creator prépare votre site web favori sous forme d'application installable avec son favicon haute définition. Sur votre smartphone, l'application s'ajoute à votre écran d'accueil et s'ouvre en plein écran sans barre d'adresse.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="font-semibold text-sm text-teal-800 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Confirmation de sécurité Android
            </h4>
            <p className="text-slate-600">
              Pour des raisons de sécurité, Android requiert toujours que l'utilisateur confirme l'ajout d'une icône sur l'écran d'accueil. Il vous suffit d'appuyer sur « Installer l'application » lorsque votre navigateur vous le demande.
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
