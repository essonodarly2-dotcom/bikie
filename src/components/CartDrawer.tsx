import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Plus,
  Minus,
  Tag,
  Sparkles,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { CartItem, Coupon, UserProfile } from '../types';
import { formatXAF } from '../utils/formatters';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  onApplyCoupon: (code: string) => { success: boolean; message: string };
  onRemoveCoupon: () => void;
  currentUser: UserProfile;
  usePoints: boolean;
  onToggleUsePoints: (use: boolean) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  currentUser,
  usePoints,
  onToggleUsePoints,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success?: boolean; text?: string } | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0);

  // Calculate coupon discount
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      couponDiscount = Math.round((subtotal * appliedCoupon.discount_value) / 100);
    } else {
      couponDiscount = appliedCoupon.discount_value;
    }
  }

  // Calculate points discount (1 point = 5 XAF, max 50% of subtotal or user points)
  const maxPointsToUse = Math.min(currentUser.points || 0, Math.floor(subtotal / 10));
  const pointsDiscount = usePoints ? maxPointsToUse * 5 : 0;

  const totalDiscount = couponDiscount + pointsDiscount;
  const total = Math.max(0, subtotal - totalDiscount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = onApplyCoupon(couponInput.trim());
    setCouponFeedback({ success: res.success, text: res.message });
    if (res.success) setCouponInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Cart Header */}
          <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black font-['Outfit']">Tu Carrito de Compras</h2>
                <p className="text-xs text-slate-300">
                  {items.reduce((s, i) => s + i.quantity, 0)} artículos seleccionados
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-800">Tu carrito está vacío</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Explora nuestro catálogo o utiliza la cámara con IA para escanear tu lista de útiles escolares.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const isOverStock = item.quantity > item.product.stock;

                return (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-red-200 transition-all flex items-center gap-3"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-100 shrink-0"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[11px] text-red-600 font-semibold">
                        {formatXAF(item.product.sale_price)} c/u
                      </p>

                      {isOverStock && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Stock max: {item.product.stock}
                        </p>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-black text-slate-900 min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateQuantity(
                                item.product.id,
                                Math.min(item.product.stock, item.quantity + 1)
                              )
                            }
                            disabled={item.quantity >= item.product.stock}
                            className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 font-bold text-xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-black text-slate-900 font-['Outfit']">
                          {formatXAF(item.product.sale_price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Quitar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer / Checkout Form */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/80 space-y-4">
              {/* Coupon input */}
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Cupón (ej. BIKIE10)"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-red-600 bg-white font-mono uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>

                {couponFeedback && (
                  <p
                    className={`text-[11px] font-semibold ${
                      couponFeedback.success ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {couponFeedback.text}
                  </p>
                )}

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <span className="font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Cupón {appliedCoupon.code} aplicado
                    </span>
                    <button
                      type="button"
                      onClick={onRemoveCoupon}
                      className="text-emerald-700 hover:text-emerald-950 underline font-medium text-[11px] cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </form>

              {/* BIKIE Points Redemption */}
              {currentUser.points > 0 && (
                <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800">Canjear Puntos BIKIE</span>
                      <p className="text-[10px] text-slate-500">
                        Tienes {currentUser.points} pts (descuento {formatXAF(maxPointsToUse * 5)})
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => onToggleUsePoints(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded-md focus:ring-red-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Summary lines */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatXAF(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Descuento cupón</span>
                    <span>-{formatXAF(couponDiscount)}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>Descuento puntos</span>
                    <span>-{formatXAF(pointsDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 border-t pt-2 font-['Outfit']">
                  <span>Total a pagar</span>
                  <span className="text-red-600">{formatXAF(total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onProceedToCheckout();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceder al Pago / Pedido</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onClearCart}
                  className="w-full text-center text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors cursor-pointer"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
