import React, { useState } from 'react';
import { CustomShortcutConfig } from '../types';
import {
  Wifi,
  Battery,
  Mic,
  Camera,
  Phone,
  MessageSquare,
  Compass,
  Settings,
  Sparkles,
} from 'lucide-react';

interface AndroidPhoneMockupProps {
  config: CustomShortcutConfig;
  onSimulateLaunch: () => void;
}

export const AndroidPhoneMockup: React.FC<AndroidPhoneMockupProps> = ({
  config,
  onSimulateLaunch,
}) => {
  const [isTapped, setIsTapped] = useState(false);

  const getShapeClass = () => {
    switch (config.iconShape) {
      case 'circle':
        return 'rounded-full';
      case 'squircle':
        return 'rounded-[26%]';
      case 'teardrop':
        return 'rounded-2xl rounded-tr-none';
      case 'rounded-square':
      default:
        return 'rounded-2xl';
    }
  };

  const handleIconClick = () => {
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 300);
    onSimulateLaunch();
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Phone Case / Bezel (Dark Titanium Chassis) */}
      <div className="relative w-[260px] xs:w-[280px] sm:w-[300px] md:w-[310px] h-[500px] xs:h-[540px] sm:h-[580px] md:h-[610px] bg-slate-900 rounded-[38px] sm:rounded-[44px] p-2.5 sm:p-3 border-4 border-slate-700 shadow-xl shadow-slate-300/40 ring-1 ring-slate-800 flex flex-col justify-between overflow-hidden mx-auto transition-all">
        {/* Antenna / volume button notches simulation on border */}
        <div className="absolute -left-[5px] top-20 sm:top-24 w-[3px] h-10 sm:h-12 bg-slate-600 rounded-l-md" />
        <div className="absolute -left-[5px] top-34 sm:top-40 w-[3px] h-10 sm:h-12 bg-slate-600 rounded-l-md" />
        <div className="absolute -right-[5px] top-28 sm:top-32 w-[3px] h-14 sm:h-16 bg-slate-600 rounded-r-md" />

        {/* Screen Display - Crisp Android Light Wallpaper */}
        <div className="relative w-full h-full bg-gradient-to-b from-sky-50 via-emerald-50/40 to-teal-100/60 rounded-[30px] sm:rounded-[34px] overflow-hidden flex flex-col justify-between p-3 sm:p-3.5 select-none shadow-inner">
          {/* Subtle wallpaper gradient mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/80 via-transparent to-teal-500/10 pointer-events-none" />

          {/* Top Status Bar (Dark text on light wallpaper) */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-bold text-slate-700 px-2 pt-1">
            <span>09:41</span>
            {/* Camera Hole Punch */}
            <div className="w-3.5 h-3.5 bg-slate-900 rounded-full border border-slate-600 shadow-inner flex items-center justify-center">
              <div className="w-1 h-1 bg-slate-950 rounded-full" />
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="text-[9px] font-extrabold">5G</span>
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>

          {/* Home Screen Content */}
          <div className="relative z-10 flex-1 flex flex-col pt-3">
            {/* Clock & Date Widget */}
            <div className="text-center mb-5">
              <div className="text-4xl font-light tracking-tight text-slate-900 font-mono">
                09:41
              </div>
              <div className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                Dimanche 11 octobre · 21°C ⛅
              </div>
            </div>

            {/* Google Search Bar Widget - Light Mode */}
            <div className="w-full bg-white/95 backdrop-blur-md rounded-full px-3.5 py-2 flex items-center justify-between border border-slate-200 shadow-xs mb-7">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="font-bold text-xs bg-gradient-to-r from-blue-500 via-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
                  G
                </span>
                <span className="text-[11px] text-slate-500">Rechercher...</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Mic className="w-3.5 h-3.5 text-slate-600" />
                <Camera className="w-3.5 h-3.5 text-slate-600" />
              </div>
            </div>

            {/* Home Screen Grid */}
            <div className="grid grid-cols-4 gap-y-6 gap-x-2 px-1">
              {/* Chrome App */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-medium text-slate-700 mt-1.5 truncate max-w-[56px] text-center">
                  Chrome
                </span>
              </div>

              {/* OUR GENERATED SHORTCUT — Highlighted */}
              <button
                type="button"
                onClick={handleIconClick}
                className={`flex flex-col items-center group transition-transform ${
                  isTapped ? 'scale-90' : 'hover:scale-105 active:scale-95'
                }`}
                title="Cliquer pour simuler l'ouverture du raccourci"
              >
                <div className="relative">
                  {/* Subtle pulsing highlight halo */}
                  <div className="absolute -inset-1 bg-emerald-500/25 rounded-2xl blur-xs group-hover:bg-emerald-500/40 transition-all" />

                  <div
                    className={`relative w-12 h-12 bg-white border-2 border-emerald-500 p-1 flex items-center justify-center shadow-md shadow-emerald-600/15 overflow-hidden ${getShapeClass()}`}
                  >
                    <img
                      src={config.iconUrl}
                      alt={config.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Corner indicator badge for standalone vs web */}
                  {config.openMode === 'standalone' && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-teal-500 border border-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-2 h-2 text-white stroke-[3]" />
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-bold text-slate-900 mt-1.5 truncate max-w-[62px] text-center drop-shadow-xs group-hover:text-emerald-700">
                  {config.title || 'Mon Site'}
                </span>
              </button>

              {/* Photos App */}
              <div className="flex flex-col items-center opacity-85">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center shadow-sm">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-medium text-slate-700 mt-1.5 truncate max-w-[56px] text-center">
                  Photos
                </span>
              </div>

              {/* Settings App */}
              <div className="flex flex-col items-center opacity-85">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-600 to-slate-700 flex items-center justify-center shadow-sm">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-medium text-slate-700 mt-1.5 truncate max-w-[56px] text-center">
                  Paramètres
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Dock - Light Frosted Glass */}
          <div className="relative z-10 pt-2 pb-1">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-2 px-3 flex items-center justify-between border border-white/60 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xs">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-xs">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-xs">
                <Compass className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Android Navigation Gesture Bar */}
            <div className="w-24 h-1 bg-slate-400 rounded-full mx-auto mt-2.5 opacity-90" />
          </div>
        </div>
      </div>

      {/* Caption under phone */}
      <div className="mt-3 text-center">
        <p className="text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          Aperçu interactif sur l'écran d'accueil Android
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Touchez l'icône sur le téléphone pour tester l'ouverture
        </p>
      </div>
    </div>
  );
};
