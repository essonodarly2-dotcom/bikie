import React from 'react';
import { ShoppingBag, Heart, Sparkles, Plus } from 'lucide-react';
import { Product } from '../types';
import { formatXAF } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onOpenDetails?: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  onOpenDetails,
  onSelectProduct,
}) => {
  const handleSelect = onOpenDetails || onSelectProduct || (() => {});
  const isOutOfStock = product.stock <= 0 || product.status === 'out_of_stock';
  const hasDiscount = product.previous_price && product.previous_price > product.sale_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.previous_price! - product.sale_price) / product.previous_price!) * 100)
    : 0;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-4 relative group hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between ${
        isOutOfStock ? 'opacity-75 grayscale' : ''
      }`}
    >
      {/* Top badges & Favorite button */}
      <div>
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-20">
          {hasDiscount && (
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
              -{discountPercent}%
            </span>
          )}
          {product.is_featured && !hasDiscount && (
            <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
              DESTACADO
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full z-20 transition-all ${
            isFavorite
              ? 'bg-rose-50 text-rose-600 border border-rose-200 scale-110 shadow-xs'
              : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white shadow-xs'
          }`}
          title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Image Box */}
        <div
          onClick={() => handleSelect(product)}
          className="w-full h-36 bg-slate-100 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden cursor-pointer group-hover:opacity-95 transition-opacity"
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 text-slate-300 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-slate-300" />
            </div>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Product Information */}
        <h3
          onClick={() => handleSelect(product)}
          className="font-bold text-sm text-slate-800 truncate cursor-pointer hover:text-red-600 transition-colors"
          title={product.name}
        >
          {product.name}
        </h3>

        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {product.category_name} • <span className="font-semibold text-slate-600">{product.brand}</span>
        </p>
      </div>

      {/* Price & Action Row */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base sm:text-lg font-black text-slate-900 font-['Outfit']">
            {formatXAF(product.sale_price)}
          </span>
          {hasDiscount ? (
            <span className="text-[10px] text-slate-400 line-through">
              {formatXAF(product.previous_price)}
            </span>
          ) : (
            <span className="text-[10px] text-emerald-600 font-semibold">
              {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
            </span>
          )}
        </div>

        {isOutOfStock ? (
          <button
            disabled
            className="w-10 h-10 bg-slate-300 text-white rounded-full flex items-center justify-center cursor-not-allowed"
            title="Agotado"
          >
            <Plus className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => onAddToCart(product, 1)}
            className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-xs active:scale-95 cursor-pointer"
            title="Añadir al carrito"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
};
