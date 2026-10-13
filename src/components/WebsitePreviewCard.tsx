import React from 'react';
import { WebsiteAnalysis } from '../types';
import { ShieldCheck, ExternalLink, AlertTriangle, Layers } from 'lucide-react';

interface WebsitePreviewCardProps {
  analysis: WebsiteAnalysis;
  onOpenManualCustomizer: () => void;
}

export const WebsitePreviewCard: React.FC<WebsitePreviewCardProps> = ({
  analysis,
  onOpenManualCustomizer,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-md relative overflow-hidden">
      {/* Subtle decorative glow */}
      <div
        className="absolute top-0 right-0 w-64 h-64 blur-3xl opacity-10 pointer-events-none rounded-full"
        style={{ backgroundColor: analysis.themeColor || '#10b981' }}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src={analysis.defaultIcon}
              alt={analysis.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight flex items-center gap-2">
              {analysis.title}
              <a
                href={analysis.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-slate-400 hover:text-emerald-600 transition-colors"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="text-emerald-700 font-mono font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {analysis.protocol.toUpperCase()}
              </span>
              <span>·</span>
              <span className="font-medium text-slate-600">{analysis.domain}</span>
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {analysis.hasManifest && (
            <span className="text-xs px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1 font-medium">
              <Layers className="w-3 h-3" /> PWA détectée
            </span>
          )}
          {analysis.themeColor && (
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 font-mono">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300"
                style={{ backgroundColor: analysis.themeColor }}
              />
              {analysis.themeColor}
            </span>
          )}
        </div>
      </div>

      {/* Description or details */}
      <div className="pt-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p className="line-clamp-2">{analysis.description}</p>
      </div>

      {/* Notice if fallback used */}
      {analysis.crawlStatus === 'fallback' && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-amber-800">
              Favicons HD récupérés avec succès. Vous pouvez modifier le nom ou l'icône à l'étape suivante.
            </span>
          </div>
          <button
            onClick={onOpenManualCustomizer}
            className="text-xs underline text-amber-900 hover:text-black shrink-0 font-semibold"
          >
            Personnaliser
          </button>
        </div>
      )}
    </div>
  );
};
