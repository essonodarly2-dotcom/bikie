import React from 'react';
import { Sparkles, Tag, ArrowRight, Percent, Gift, Clock } from 'lucide-react';
import { Offer } from '../types';
import { formatXAF } from '../utils/formatters';

interface ClientOffersBannerProps {
  offers: Offer[];
  onSelectOffer?: (offer: Offer) => void;
}

export const ClientOffersBanner: React.FC<ClientOffersBannerProps> = ({
  offers,
  onSelectOffer,
}) => {
  const activeOffers = offers.filter((o) => o.status === 'active');

  if (activeOffers.length === 0) return null;

  return (
    <section className="mb-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
          <h2 className="text-lg sm:text-xl font-black font-['Outfit'] text-slate-900 tracking-tight flex items-center gap-2">
            <span>Ofertas & Promociones Especiales</span>
            <span className="text-[11px] font-black uppercase bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full">
              ¡Aprovecha hoy!
            </span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeOffers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => onSelectOffer && onSelectOffer(offer)}
            className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-5 border border-slate-700/60 shadow-xl hover:shadow-2xl hover:border-red-500/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            {/* Background image overlay if exists */}
            {offer.image && (
              <div className="absolute inset-0 z-0 opacity-25 group-hover:opacity-35 transition-opacity">
                <img
                  src={offer.image}
                  alt={offer.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-md">
                  <Percent className="w-3.5 h-3.5" />
                  {offer.type === 'percentage'
                    ? `${offer.discount_value}% DTO`
                    : offer.type === '2x1'
                    ? '2x1'
                    : offer.type === '3x2'
                    ? '3x2'
                    : `-${formatXAF(offer.discount_value)}`}
                </span>

                <span className="text-[10px] text-slate-300 font-bold flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  <Clock className="w-3 h-3 text-yellow-400" />
                  Vence: {offer.end_date}
                </span>
              </div>

              <h3 className="text-base font-black font-['Outfit'] text-white group-hover:text-red-300 transition-colors">
                {offer.name}
              </h3>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {offer.description}
              </p>
            </div>

            <div className="relative z-10 pt-4 mt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-bold">
              <span className="text-red-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                <span>Ver productos en oferta</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>

              <span className="bg-red-950/80 border border-red-800 text-red-300 text-[10px] uppercase font-black px-2 py-0.5 rounded-md">
                BIKIE PROMO
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
