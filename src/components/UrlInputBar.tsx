import React, { useState } from 'react';
import { Globe, Search, ArrowRight, X, Clipboard, Loader2, Sparkles } from 'lucide-react';

interface UrlInputBarProps {
  url: string;
  onUrlChange: (value: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  error?: string | null;
}

const PRESET_SITES = [
  { name: 'Wikipedia', url: 'https://fr.wikipedia.org' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Le Monde', url: 'https://www.lemonde.fr' },
  { name: 'Reddit', url: 'https://www.reddit.com' },
  { name: 'Notion', url: 'https://notion.so' },
  { name: 'YouTube', url: 'https://youtube.com' },
];

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  url,
  onUrlChange,
  onAnalyze,
  isLoading,
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      onAnalyze();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onUrlChange(text.trim());
      }
    } catch {
      // clipboard permission denied or not supported
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white border rounded-2xl transition-all duration-200 shadow-md ${
          isFocused
            ? 'border-emerald-600 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-600/5'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        {/* Leading icon */}
        <div className="hidden sm:flex pl-4 pr-1 text-slate-400 items-center">
          <Globe className="w-5 h-5 text-emerald-600" />
        </div>

        {/* Text Input */}
        <div className="relative flex-1 flex items-center">
          <div className="sm:hidden pl-4 pr-1 text-slate-400">
            <Globe className="w-4 h-4 text-emerald-600" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Saisissez une adresse web (ex: lemonde.fr, https://github.com)..."
            className="w-full py-4 px-3 sm:px-2 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm sm:text-base outline-none focus:outline-none"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck="false"
          />

          {/* Quick action: Clear */}
          {url && !isLoading && (
            <button
              onClick={() => onUrlChange('')}
              className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Effacer"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Quick action: Paste */}
          {!url && (
            <button
              onClick={handlePaste}
              className="hidden xs:flex items-center gap-1 mr-2 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-slate-200"
              title="Coller depuis le presse-papier"
              type="button"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Coller</span>
            </button>
          )}
        </div>

        {/* Submit Button */}
        <div className="p-2 pt-0 sm:pt-2">
          <button
            onClick={onAnalyze}
            disabled={isLoading || !url.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 active:scale-[0.99]"
            type="button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Analyse en cours...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-emerald-100" />
                <span>Analyze Website</span>
                <ArrowRight className="w-4 h-4 ml-0.5 text-emerald-100" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2.5 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <span className="font-semibold text-rose-700">Erreur :</span>
          <span>{error}</span>
        </div>
      )}

      {/* Quick Presets */}
      <div className="mt-3 flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
        <span className="text-slate-500 flex items-center gap-1 mr-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Exemples rapides :
        </span>
        {PRESET_SITES.map((site) => (
          <button
            key={site.name}
            onClick={() => {
              onUrlChange(site.url);
            }}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 font-medium transition-colors shadow-xs"
            type="button"
          >
            {site.name}
          </button>
        ))}
      </div>
    </div>
  );
};
