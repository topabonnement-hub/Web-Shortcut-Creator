import React from 'react';
import { Globe, Palette, Sliders, Smartphone, Check } from 'lucide-react';

export interface WizardStep {
  id: number;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    label: 'Analyse du Site',
    shortLabel: '1. Analyse',
    description: 'Saisie & extraction de l\'URL',
    icon: Globe,
  },
  {
    id: 2,
    label: 'Personnalisation',
    shortLabel: '2. Style',
    description: 'Nom, icône & forme Android',
    icon: Palette,
  },
  {
    id: 3,
    label: 'Méthode',
    shortLabel: '3. Méthode',
    description: 'Choix parmi les 4 options',
    icon: Sliders,
  },
  {
    id: 4,
    label: 'Installation',
    shortLabel: '4. Installation',
    description: 'QR Code & guides pas-à-pas',
    icon: Smartphone,
  },
];

interface WizardStepperProps {
  currentStep: number;
  onSelectStep: (stepId: number) => void;
  maxReachedStep: number;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  currentStep,
  onSelectStep,
  maxReachedStep,
}) => {
  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-sm mb-6">
      {/* Step items row */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {WIZARD_STEPS.map((step) => {
          const isCurrent = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = step.id <= maxReachedStep;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStep(step.id)}
              className={`flex flex-col items-center sm:items-start p-2 sm:p-3 rounded-xl transition-all text-left relative ${
                isCurrent
                  ? 'bg-emerald-50 border border-emerald-300 text-slate-900 shadow-xs'
                  : isCompleted
                  ? 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                <span
                  className={`text-xs font-bold hidden sm:inline ${
                    isCurrent ? 'text-emerald-900' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Mobile label */}
              <span
                className={`text-[10px] font-semibold sm:hidden truncate max-w-full ${
                  isCurrent ? 'text-emerald-900' : 'text-slate-600'
                }`}
              >
                {step.shortLabel}
              </span>

              {/* Desktop subtitle */}
              <p className="text-[11px] text-slate-500 hidden md:block line-clamp-1">
                {step.description}
              </p>

              {/* Current active indicator line */}
              {isCurrent && (
                <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
