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
  MessageCircle,
  Phone,
  User,
  MapPin,
  FileText,
  ShieldCheck,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { CartItem, Coupon, Order, StoreSettings, UserProfile } from '../types';
import { formatXAF, formatDate } from '../utils/formatters';
import { storageService } from '../lib/storage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CartItem[];
  cart?: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart?: () => void;
  onProceedToCheckout?: () => void;
  coupons?: Coupon[];
  appliedCoupon?: Coupon | null;
  onApplyCoupon?: (code: string) => { success: boolean; message: string };
  onRemoveCoupon?: () => void;
  currentUser?: UserProfile;
  usePoints?: boolean;
  onToggleUsePoints?: (use: boolean) => void;
  settings?: StoreSettings;
  onOpenInvoiceModal?: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
  currentUser,
  usePoints = false,
  onToggleUsePoints,
  settings,
  onOpenInvoiceModal,
}) => {
  const effectiveItems = items || cart || [];
  const storeSettings: StoreSettings = settings || storageService.getSettings();

  const [customerName, setCustomerName] = useState(currentUser?.name === 'Cliente Invitado' ? '' : (currentUser?.name || ''));
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success?: boolean; text?: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const subtotal = effectiveItems.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0);

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
  const userPoints = currentUser?.points || 0;
  const maxPointsToUse = Math.min(userPoints, Math.floor(subtotal / 10));
  const pointsDiscount = usePoints ? maxPointsToUse * 5 : 0;

  const deliveryCost = deliveryType === 'delivery' ? 1500 : 0;
  const totalDiscount = couponDiscount + pointsDiscount;
  const total = Math.max(0, subtotal - totalDiscount + deliveryCost);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim() || !onApplyCoupon) return;
    const res = onApplyCoupon(couponInput.trim());
    setCouponFeedback({ success: res.success, text: res.message });
    if (res.success) setCouponInput('');
  };

  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();

    if (!cleanName || cleanName.length < 3) {
      setFormError('Por favor introduce tu Nombre y Apellidos para registrar el pedido.');
      return;
    }

    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 6) {
      setFormError('Por favor introduce un Número de Teléfono / WhatsApp válido.');
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setFormError('Por favor indica la dirección de entrega en Malabo.');
      return;
    }

    if (effectiveItems.length === 0) {
      setFormError('El carrito está vacío.');
      return;
    }

    setIsSendingOrder(true);

    try {
      // 1. Deduct Stock
      const stockResult = storageService.deductStock(
        effectiveItems.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        `Pedido web de ${cleanName}`,
        cleanName
      );

      if (!stockResult.success) {
        setFormError(stockResult.error || 'Stock insuficiente para procesar el pedido.');
        setIsSendingOrder(false);
        return;
      }

      // 2. Generate unique order code
      const existingOrders = storageService.getOrders();
      const nextNum = existingOrders.length + 1;
      const orderCode = `BIKIE-${nextNum.toString().padStart(6, '0')}`;

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        code: orderCode,
        customer_id: currentUser?.id || 'guest-customer',
        customer_name: cleanName,
        customer_email: currentUser?.email || 'cliente@bikie.gq',
        customer_phone: cleanPhone,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress.trim() : undefined,
        city: 'Malabo',
        notes: orderNotes.trim() || undefined,
        status: 'pending',
        payment_method: 'store',
        payment_status: 'unpaid',
        subtotal,
        discount: totalDiscount,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        total,
        items: effectiveItems.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          sku: i.product.sku,
          quantity: i.quantity,
          unit_price: i.product.sale_price,
          total_price: i.product.sale_price * i.quantity,
        })),
        created_at: new Date().toISOString(),
      };

      // 3. Save order to database & local persistence
      storageService.saveOrders([newOrder, ...existingOrders]);

      // 4. Save activity log
      storageService.addActivityLog({
        user_name: cleanName,
        user_role: 'customer',
        action: 'Envió un nuevo pedido desde el Carrito',
        details: `Pedido #${orderCode} por ${formatXAF(total)}. Pendiente de cobro y envío de factura por WhatsApp.`,
      });

      // 5. Add Notification for Admin
      storageService.addNotification({
        target: 'admin',
        title: `Nuevo Pedido ${orderCode}`,
        message: `${cleanName} envió un pedido de ${formatXAF(total)}. Revisa y envía la factura tras cobrar.`,
        type: 'order',
      });

      // 6. Clear Cart
      if (onClearCart) {
        onClearCart();
      }

      setSubmittedOrder(newOrder);
      setIsSendingOrder(false);
    } catch (err) {
      console.error('Error al enviar pedido:', err);
      setFormError('Hubo un problema al procesar el pedido. Por favor intenta de nuevo.');
      setIsSendingOrder(false);
    }
  };

  const totalQuantity = effectiveItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-in Drawer */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Cart Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-['Outfit'] flex items-center gap-1.5">
                <span>Tu Carrito de Compras</span>
                {totalQuantity > 0 && (
                  <span className="bg-red-600/80 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                    {totalQuantity}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                BIKIE Papelería · Malabo, Guinea Ecuatorial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List or Submitted Screen */}
        {submittedOrder ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/10">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ¡Pedido Recibido en BIKIE!
              </span>
              <h3 className="text-2xl font-black font-['Outfit'] text-slate-900">
                Pedido #{submittedOrder.code}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Registrado para <strong>{submittedOrder.customer_name}</strong>
              </p>
            </div>

            {/* Explanatory banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-2 w-full">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Gestión de Pedido & Cobro</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                La administradora de BIKIE ha recibido tu pedido de <strong>{formatXAF(submittedOrder.total)}</strong>. Revisará el stock, procesará el cobro y te enviará la factura oficial y comprobante directamente por WhatsApp al número <strong>{submittedOrder.customer_phone}</strong>.
              </p>
            </div>

            {/* Summary mini card */}
            <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between text-slate-600">
                <span>Modalidad:</span>
                <span className="font-bold text-slate-900">
                  {submittedOrder.delivery_type === 'delivery' ? `Domicilio (${submittedOrder.delivery_address})` : 'Recogida en Tienda'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Artículos:</span>
                <span className="font-bold text-slate-900">{submittedOrder.items.length} productos</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200 text-sm">
                <span>Total a Cobrar:</span>
                <span className="text-red-600 font-black">{formatXAF(submittedOrder.total)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full space-y-2.5 pt-2">
              {onOpenInvoiceModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenInvoiceModal(submittedOrder);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  <span>Ver / Imprimir Ticket del Pedido</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSubmittedOrder(null);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-200"
              >
                <span>Aceptar y Seguir Comprando</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {effectiveItems.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-800">Tu carrito está vacío</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Agrega libros, cuadernos, bolígrafos o escanea tu lista escolar con IA para llenar tu carrito.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-xs cursor-pointer"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-xs text-slate-400">
                <span>Artículos ({totalQuantity})</span>
                {onClearCart && (
                  <button
                    onClick={onClearCart}
                    className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Vaciar todo
                  </button>
                )}
              </div>

              {effectiveItems.map((item) => {
                const isOverStock = item.quantity > item.product.stock;

                return (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-red-200 transition-all flex items-center gap-3"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-bold text-slate-900 truncate" title={item.product.name}>
                        {item.product.name}
                      </p>
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
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-black text-slate-900 min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
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
                      type="button"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Quitar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Checkout & WhatsApp Form */}
        {effectiveItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3.5 overflow-y-auto max-h-[50vh]">
            {/* Customer Details Form for Sending Order */}
            <form onSubmit={handleSendOrder} className="space-y-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-red-600" />
                    Datos para la Factura y Envío
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Vía WhatsApp
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Nombre y Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="ej. María Bindang"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-red-600 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="ej. 222213126"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-red-600 bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Delivery options */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Modalidad de Entrega
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        deliveryType === 'pickup'
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="text-[11px]">Recoger en Tienda</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-normal mt-0.5">Paraíso, Malabo (Gratis)</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        deliveryType === 'delivery'
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="text-[11px]">A Domicilio</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-normal mt-0.5">+1.500 FCFA Malabo</p>
                    </button>
                  </div>

                  {deliveryType === 'delivery' && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Dirección exacta en Malabo (Barrio, calle, ref.)"
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-red-600 bg-white font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              {formError && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Summary lines */}
              <div className="space-y-1.5 text-xs pt-1">
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
                {deliveryCost > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Envío Malabo</span>
                    <span>+{formatXAF(deliveryCost)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-1.5 font-['Outfit']">
                  <span>Total a Pagar</span>
                  <span className="text-red-600">{formatXAF(total)}</span>
                </div>
              </div>

              {/* Action Button: Enviar Pedido */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isSendingOrder}
                  className="w-full py-4 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-['Outfit'] tracking-wide"
                >
                  {isSendingOrder ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Registrando Pedido...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>Enviar Pedido ({formatXAF(total)})</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1.5 px-2">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>La administradora revisará el pedido y te enviará la factura por WhatsApp tras cobrar.</span>
                </p>
              </div>
            </form>
          </div>
        )}
      </>
    )}
  </div>
</div>
  );
};
