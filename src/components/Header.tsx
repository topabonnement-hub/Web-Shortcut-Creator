import React from 'react';
import { Smartphone, Sparkles, ShieldCheck, HelpCircle, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onOpenHelpModal: () => void;
  onPurgeData?: () => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHelpModal, onPurgeData, onGoHome }) => {
  return (
    <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand (Clickable to Home) */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onGoHome?.();
          }}
          className="flex items-center gap-3 text-left group focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 rounded-2xl p-1 -m-1 transition-all cursor-pointer select-none"
          title="Retour à l'accueil"
          aria-label="Web Shortcut Creator - Retour à l'accueil"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-1 ring-emerald-600/20 group-hover:scale-105 group-hover:shadow-emerald-500/35 transition-all">
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                Web Shortcut Creator
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Android
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors hidden sm:block">
              Transformez n'importe quel site web en raccourci d'écran d'accueil Android
            </p>
          </div>
        </a>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onPurgeData && (
            <button
              onClick={onPurgeData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-900 border border-rose-200 transition-colors shadow-2xs"
              title="Créer un nouveau raccourci"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Nouveau</span>
            </button>
          )}

          <button
            onClick={onOpenHelpModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 transition-colors shadow-2xs"
            title="Aide et explications"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">Aide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
