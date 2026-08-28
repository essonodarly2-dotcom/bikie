import React, { useState } from 'react';
import {
  BookOpen,
  Package,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Camera,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { SchoolList, SchoolPack, Product } from '../types';
import { formatXAF } from '../utils/formatters';

interface SchoolListsViewProps {
  schoolLists: SchoolList[];
  schoolPacks: SchoolPack[];
  catalog: Product[];
  onAddItemsToCart: (items: { product: Product; quantity: number }[]) => void;
  onOpenAiScanner: () => void;
}

export const SchoolListsView: React.FC<SchoolListsViewProps> = ({
  schoolLists,
  schoolPacks,
  catalog,
  onAddItemsToCart,
  onOpenAiScanner,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const filteredLists =
    selectedLevel === 'all'
      ? schoolLists
      : schoolLists.filter((l) => l.level === selectedLevel);

  const handleAddPack = (pack: SchoolPack) => {
    const itemsToAdd: { product: Product; quantity: number }[] = [];
    for (const item of pack.items) {
      const prod = catalog.find((p) => p.id === item.product_id);
      if (prod && prod.stock > 0) {
        itemsToAdd.push({
          product: prod,
          quantity: Math.min(prod.stock, item.quantity),
        });
      }
    }
    if (itemsToAdd.length > 0) {
      onAddItemsToCart(itemsToAdd);
    }
  };

  const handleAddList = (list: SchoolList) => {
    const itemsToAdd: { product: Product; quantity: number }[] = [];
    for (const item of list.items) {
      const prod = catalog.find((p) => p.id === item.product_id);
      if (prod && prod.stock > 0) {
        itemsToAdd.push({
          product: prod,
          quantity: Math.min(prod.stock, item.quantity),
        });
      }
    }
    if (itemsToAdd.length > 0) {
      onAddItemsToCart(itemsToAdd);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-in fade-in duration-150">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
        <div className="space-y-4 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-bold border border-red-500/30">
            <GraduationCap className="w-4 h-4 text-red-400" />
            Vuelta al Cole con BIKIE
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-['Outfit'] leading-tight">
            Listas Escolares Oficiales & Packs con Descuento
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Hemos preparado las listas oficiales de útiles recomendadas para colegios e institutos en Malabo. Añade todos los materiales a tu carrito en 1 clic.
          </p>
        </div>

        {/* AI Scanner Hook Card */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center space-y-3 shrink-0 max-w-xs">
          <Camera className="w-8 h-8 text-yellow-300 mx-auto animate-pulse" />
          <p className="text-xs font-bold text-white">¿Tienes la lista en papel?</p>
          <p className="text-[11px] text-slate-200">
            Fotografíala con tu móvil y nuestra IA armará tu carrito en 3 segundos.
          </p>
          <button
            onClick={onOpenAiScanner}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Escanear con IA</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SECTION 1: Pre-assembled School Packs */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
              <Package className="w-6 h-6 text-red-600" />
              <span>Packs Escolares Todo Incluido</span>
            </h2>
            <p className="text-xs text-slate-500">
              Kits completos preparados con descuento especial por lote
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {schoolPacks.map((pack) => (
            <div
              key={pack.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-red-300 transition-all p-6 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                  <img
                    src={pack.image}
                    alt={pack.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-sm">
                    {pack.level}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 font-['Outfit']">{pack.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{pack.description}</p>
                </div>

                {/* Items included */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Incluye {pack.items.length} productos:
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs text-slate-600">
                    {pack.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="truncate">
                          {item.quantity}x {item.product_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price & Add to Cart */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Precio del pack</span>
                    <span className="text-2xl font-black text-red-600 font-['Outfit']">
                      {formatXAF(pack.price)}
                    </span>
                  </div>
                  {pack.previous_price && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatXAF(pack.previous_price)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAddPack(pack)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Añadir pack completo al carrito</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Official School Grade Lists */}
      <div className="space-y-6 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-red-600" />
              <span>Listas de Materiales por Grado</span>
            </h2>
            <p className="text-xs text-slate-500">
              Desglose detallado por curso académico para que no te falte nada
            </p>
          </div>

          {/* Level Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedLevel === 'all'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-red-600'
              }`}
            >
              Todos los Grados
            </button>
            <button
              onClick={() => setSelectedLevel('Primaria')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedLevel === 'Primaria'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-red-600'
              }`}
            >
              Primaria
            </button>
            <button
              onClick={() => setSelectedLevel('Secundaria')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedLevel === 'Secundaria'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-red-600'
              }`}
            >
              Secundaria
            </button>
            <button
              onClick={() => setSelectedLevel('Bachillerato')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedLevel === 'Bachillerato'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-red-600'
              }`}
            >
              Bachillerato
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLists.map((list) => {
            const listTotal = list.items.reduce(
              (sum, it) => sum + (it.estimated_price || 0) * it.quantity,
              0
            );

            return (
              <div
                key={list.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                        {list.level} {list.grade ? `· ${list.grade}` : ''}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 font-['Outfit'] mt-1">
                        {list.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">{list.description}</p>

                  {/* List breakdown */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Materiales requeridos ({list.items.length}):
                    </p>
                    <div className="space-y-1.5 divide-y divide-slate-50 text-xs">
                      {list.items.map((it, idx) => (
                        <div key={idx} className="pt-1.5 flex justify-between items-center">
                          <span className="text-slate-700 truncate">
                            <strong>{it.quantity}x</strong> {it.product_name}
                          </span>
                          <span className="font-bold text-slate-900 shrink-0">
                            {formatXAF((it.estimated_price || 0) * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer and CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Total estimado</span>
                    <span className="text-lg font-black text-red-600 font-['Outfit']">
                      {formatXAF(listTotal)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddList(list)}
                    className="py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Añadir lista al carrito</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
