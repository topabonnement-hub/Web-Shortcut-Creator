import React, { useRef, useState } from 'react';
import { CustomShortcutConfig, IconSource, AndroidIconShape } from '../types';
import {
  Upload,
  Sparkles,
  Type,
  Maximize2,
  Compass,
  Check,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';

interface CustomizerProps {
  config: CustomShortcutConfig;
  onChange: (updated: Partial<CustomShortcutConfig>) => void;
  availableIcons: IconSource[];
  onAddCustomIcon: (iconUrl: string) => void;
}

const SHAPE_OPTIONS: { id: AndroidIconShape; label: string; roundedClass: string }[] = [
  { id: 'squircle', label: 'Squircle (Pixel)', roundedClass: 'rounded-[26%]' },
  { id: 'circle', label: 'Cercle (OnePlus)', roundedClass: 'rounded-full' },
  { id: 'rounded-square', label: 'Carré doux (Samsung)', roundedClass: 'rounded-2xl' },
  { id: 'teardrop', label: 'Goutte d\'eau', roundedClass: 'rounded-2xl rounded-tr-none' },
];

const PRESET_GRADIENTS = [
  { start: '#10b981', end: '#047857', label: 'Émeraude' },
  { start: '#3b82f6', end: '#1d4ed8', label: 'Bleu Ocean' },
  { start: '#8b5cf6', end: '#6d28d9', label: 'Violet Royal' },
  { start: '#f59e0b', end: '#b45309', label: 'Ambre' },
  { start: '#ec4899', end: '#be185d', label: 'Rose Rubis' },
  { start: '#1e293b', end: '#475569', label: 'Graphite' },
];

export const Customizer: React.FC<CustomizerProps> = ({
  config,
  onChange,
  availableIcons,
  onAddCustomIcon,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'extracted' | 'monogram' | 'upload'>('extracted');
  const [monogramText, setMonogramText] = useState(config.title ? config.title.charAt(0).toUpperCase() : 'W');
  const [selectedGradient, setSelectedGradient] = useState(PRESET_GRADIENTS[0]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onAddCustomIcon(reader.result);
          onChange({ iconUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyMonogram = () => {
    // Generate a data URI canvas icon from the monogram
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 192, 192);
      gradient.addColorStop(0, selectedGradient.start);
      gradient.addColorStop(1, selectedGradient.end);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 192, 192);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 96px -apple-system, Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(monogramText.slice(0, 2), 96, 102);

      const dataUrl = canvas.toDataURL('image/png');
      onAddCustomIcon(dataUrl);
      onChange({ iconUrl: dataUrl, themeColor: selectedGradient.start });
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-md space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900">
            Personnalisation du Raccourci
          </h3>
          <p className="text-xs text-slate-500">
            Ajustez le nom affiché sur l'écran d'accueil et choisissez l'icône Android
          </p>
        </div>
      </div>

      {/* Field: Shortcut Name / Label */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="shortcut-title" className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-emerald-600" />
            Nom affiché sous l'icône
          </label>
          <span className={`text-[11px] font-mono ${config.title.length > 12 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
            {config.title.length}/12 car. {config.title.length > 12 && '(tronqué sur certains launchers)'}
          </span>
        </div>
        <input
          id="shortcut-title"
          type="text"
          value={config.title}
          onChange={(e) => onChange({ title: e.target.value })}
          maxLength={30}
          placeholder="Ex: Le Monde, GitHub, Mon Site"
          className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
        />
      </div>

      {/* Field: Icon Selection with Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            Source de l'icône
          </label>

          {/* Segmented controls */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('extracted')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'extracted'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Favicons ({availableIcons.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('monogram')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'monogram'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Créer Monogramme
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Importer
            </button>
          </div>
        </div>

        {/* Tab 1: Extracted and multi-source icons */}
        {activeTab === 'extracted' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {availableIcons.map((icon, idx) => {
              const isSelected = config.iconUrl === icon.src;
              return (
                <button
                  key={`${icon.src}-${idx}`}
                  type="button"
                  onClick={() => onChange({ iconUrl: icon.src })}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col items-center gap-2 group ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center relative overflow-hidden shadow-2xs">
                    <img
                      src={icon.src}
                      alt={icon.label}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = '0.3';
                      }}
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="text-center w-full">
                    <p className={`text-[11px] font-semibold truncate ${isSelected ? 'text-emerald-950' : 'text-slate-700'}`}>
                      {icon.label}
                    </p>
                    <p className="text-[10px] text-slate-400">{icon.size}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Monogram / Initial generator */}
        {activeTab === 'monogram' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Lettre ou Émoji (1-2 caractères)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={monogramText}
                  onChange={(e) => setMonogramText(e.target.value.toUpperCase())}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-base focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Palette de dégradé
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_GRADIENTS.map((g) => (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => setSelectedGradient(g)}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        selectedGradient.label === g.label
                          ? 'ring-2 ring-emerald-600 scale-110 shadow-xs'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${g.start}, ${g.end})`,
                      }}
                      title={g.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyMonogram}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Générer et appliquer cette icône
            </button>
          </div>
        )}

        {/* Tab 3: Upload Custom Icon */}
        {activeTab === 'upload' && (
          <div className="p-6 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800">
              Téléversez votre propre image ou logo (PNG, WebP, SVG)
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
              Format recommandé : Carré 192x192px ou supérieur
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors shadow-xs"
            >
              Choisir un fichier sur mon appareil
            </button>
          </div>
        )}
      </div>

      {/* Field: Android Adaptive Icon Shape */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-emerald-600" />
          Forme de l'icône adaptative Android (Aperçu)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SHAPE_OPTIONS.map((shape) => {
            const isSelected = config.iconShape === shape.id;
            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => onChange({ iconShape: shape.id })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-emerald-600 ${shape.roundedClass}`}
                />
                <span className="truncate">{shape.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Field: Display Mode Preference */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
          Comportement à l'ouverture
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ openMode: 'browser' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              config.openMode === 'browser'
                ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 mb-1">
              <Compass className="w-4 h-4 text-emerald-600" />
              Navigateur standard
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Ouvre le site dans un onglet standard de votre navigateur habituel (avec barre d'adresse et favoris).
            </p>
          </button>

          <button
            type="button"
            onClick={() => onChange({ openMode: 'standalone' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              config.openMode === 'standalone'
                ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 mb-1">
              <Maximize2 className="w-4 h-4 text-teal-600" />
              Plein écran autonome (PWA)
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Expérience immersive sans barre d'adresse, comme une application mobile installée depuis le Play Store.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
