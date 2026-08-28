import React from 'react';
import { Camera, Sparkles, ShoppingBag } from 'lucide-react';
import { StoreSettings } from '../types';

interface HeroBannerProps {
  settings?: StoreSettings;
  onOpenScanner?: () => void;
  onOpenAiScanner?: () => void;
  onExploreCatalog?: () => void;
  onNavigateCatalog?: () => void;
  onNavigateOffers?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  settings,
  onOpenScanner,
  onOpenAiScanner,
  onExploreCatalog,
  onNavigateCatalog,
}) => {
  const handleScan = onOpenScanner || onOpenAiScanner || (() => {});
  const handleCatalog = onExploreCatalog || onNavigateCatalog || (() => {});

  return (
    <header className="relative px-6 sm:px-12 py-10 sm:py-14 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6">
      {/* Background subtle red accents */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-red-50/70 opacity-60 -skew-x-12 translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Column: Headline & Action Buttons */}
        <div className="max-w-xl text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold mb-4 border border-red-100">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Papelería Inteligente en Malabo</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-slate-900 font-['Outfit']">
            Todo lo que necesitas para{' '}
            <span className="text-red-600">estudiar, trabajar y crear.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            {settings?.banner_subheadline ||
              'Papelería profesional con tecnología inteligente para facilitar tu día a día.'}
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <button
              onClick={handleCatalog}
              className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Comprar ahora</span>
            </button>

            <button
              onClick={handleScan}
              className="px-8 py-4 bg-white border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 flex items-center justify-center gap-3 transition-all transform active:scale-95 text-sm sm:text-base cursor-pointer shadow-xs"
            >
              <Camera className="w-5 h-5 text-red-600" />
              <span>Analizar mi lista con IA</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive AI Scanning Teaser Card */}
        <div
          onClick={handleScan}
          className="w-full sm:w-88 lg:w-80 bg-slate-50 border-2 border-dashed border-red-300 rounded-3xl p-6 relative cursor-pointer hover:border-red-500 hover:bg-red-50/30 transition-all group shrink-0 shadow-xs"
        >
          <div className="absolute -top-3.5 -right-3.5 bg-red-600 text-white px-3.5 py-1.5 rounded-2xl shadow-xl transform rotate-12 font-bold text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>NUEVO: Escaneo IA</span>
          </div>

          <div className="space-y-2.5 italic text-sm text-slate-500 font-medium">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              5 cuadernos A4 Oxford...
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              2 bolígrafos azules BIC...
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              1 juego reglas y compás...
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200 flex items-center gap-3">
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-red-600 rounded-full animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-red-600 tracking-wider whitespace-nowrap">
              LISTO EN 3S
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
