import React, { useState } from 'react';
import { X, ShoppingBag, Heart, Check, AlertTriangle, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { formatXAF } from '../utils/formatters';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  relatedProducts: Product[];
  onSelectProduct: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  relatedProducts,
  onSelectProduct,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!product) return null;

  const currentImage = selectedImage || product.image;
  const gallery = [product.image, ...(product.gallery || [])].filter(
    (v, i, a) => a.indexOf(v) === i
  );

  const isOutOfStock = product.stock <= 0 || product.status === 'out_of_stock';
  const isLowStock = product.stock > 0 && product.stock <= product.min_stock;
  const maxAllowed = Math.max(1, product.stock);

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-4 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-square w-full rounded-2xl bg-slate-50 overflow-hidden border border-slate-100">
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.previous_price && product.previous_price > product.sale_price && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-sm">
                    Oferta Especial
                  </span>
                )}
              </div>

              {gallery.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        currentImage === img
                          ? 'border-red-600 ring-2 ring-red-100 scale-95'
                          : 'border-slate-200 hover:border-red-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-red-700 bg-red-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {product.brand}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{product.category_name}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] leading-snug">
                  {product.name}
                </h2>

                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-red-600 font-['Outfit']">
                    {formatXAF(product.sale_price)}
                  </span>
                  {product.previous_price && product.previous_price > product.sale_price && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatXAF(product.previous_price)}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div className="py-1">
                  {isOutOfStock ? (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Producto actualmente AGOTADO</span>
                    </div>
                  ) : isLowStock ? (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>¡Últimas {product.stock} unidades en stock!</span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Stock disponible ({product.stock} unidades)</span>
                    </div>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                  {product.description}
                </p>

                {/* Technical Specs */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <span className="font-semibold text-slate-700">SKU:</span> {product.sku}
                  </div>
                  {product.barcode && (
                    <div>
                      <span className="font-semibold text-slate-700">Código de Barras:</span>{' '}
                      {product.barcode}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-4 space-y-3">
                {!isOutOfStock && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Cantidad:</span>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-4 py-1.5 text-xs font-black text-slate-900 bg-slate-50 min-w-[36px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400">Máx: {product.stock}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {isOutOfStock ? (
                    <button
                      disabled
                      className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed text-center"
                    >
                      Producto Agotado
                    </button>
                  ) : (
                    <button
                      onClick={handleAdd}
                      className="flex-1 py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{addedNotice ? '¡Añadido al Carrito!' : `Añadir ${quantity} al carrito`}</span>
                    </button>
                  )}

                  <button
                    onClick={() => onToggleFavorite(product.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isFavorite
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                    title="Favorito"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-red-600" />
                Productos relacionados en {product.category_name}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedProducts.slice(0, 4).map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      onSelectProduct(rel);
                      setSelectedImage('');
                      setQuantity(1);
                    }}
                    className="cursor-pointer p-2 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-red-200 transition-all text-left"
                  >
                    <img
                      src={rel.image}
                      alt={rel.name}
                      className="w-full aspect-square object-cover rounded-lg mb-1.5"
                    />
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{rel.name}</p>
                    <p className="text-xs font-black text-red-600">{formatXAF(rel.sale_price)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
