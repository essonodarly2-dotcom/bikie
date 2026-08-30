import React, { useState, useEffect } from 'react';
import { Cookie, Check, X, ShieldCheck } from 'lucide-react';

interface CookieBannerProps {
  onOpenLegal: (type: 'cookies' | 'privacy') => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenLegal }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('bikie_cookie_consent_v1');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('bikie_cookie_consent_v1', 'all');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('bikie_cookie_consent_v1', 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-950/95 text-white p-5 rounded-3xl border border-red-600/30 shadow-2xl backdrop-blur-md space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-['Outfit']">
              Privacidad y Cookies en BIKIE
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Utilizamos cookies técnicas y almacenamiento local esenciales para que tu carrito y tus pedidos funcionen correctamente en Malabo.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs">
          <button
            onClick={() => onOpenLegal('cookies')}
            className="text-[11px] text-slate-400 hover:text-red-400 underline transition-colors cursor-pointer"
          >
            Ver Política
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAcceptEssential}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Solo Esenciales
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Aceptar Todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
