import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Truck,
  Store,
  CreditCard,
  Phone,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, Coupon, Order, StoreSettings, UserProfile, Offer } from '../types';
import { formatXAF, formatDate } from '../utils/formatters';
import { storageService } from '../lib/storage';
import { calculateCartPricing } from '../lib/promotions';

interface CheckoutViewProps {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  usePoints: boolean;
  currentUser: UserProfile;
  settings: StoreSettings;
  offers?: Offer[];
  onBackToStore: () => void;
  onOrderCompleted: (order: Order) => void;
  onOpenInvoiceModal?: (order: Order) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  items,
  appliedCoupon,
  usePoints,
  currentUser,
  settings,
  offers = [],
  onBackToStore,
  onOrderCompleted,
}) => {
  const [customerName, setCustomerName] = useState(currentUser.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser.phone || '+240 ');
  const [customerEmail, setCustomerEmail] = useState(currentUser.email || '');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState('Malabo');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'store' | 'transfer' | 'online'>('store');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pricing = calculateCartPricing(
    items,
    offers,
    appliedCoupon,
    usePoints,
    currentUser.points || 0,
    deliveryType
  );

  const subtotal = pricing.subtotal;
  const totalDiscount = pricing.totalDiscount;
  const deliveryCost = pricing.deliveryCost;
  const total = pricing.finalTotal;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = customerName.trim();
    const cleanPhoneDigits = customerPhone.replace(/[^0-9]/g, '');

    if (!cleanName || cleanName.length < 3) {
      setErrorMessage('Por favor ingresa tu Nombre Completo (mínimo 3 letras) para identificar tu pedido.');
      return;
    }

    if (!customerPhone.trim() || cleanPhoneDigits.length < 6) {
      setErrorMessage('Por favor proporciona un Número de Teléfono / WhatsApp válido (mínimo 6 dígitos) para poder contactarte.');
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Por favor proporciona la dirección de entrega exacta en Malabo.');
      return;
    }

    setIsSubmitting(true);

    // Deduct Stock
    const stockResult = storageService.deductStock(
      items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      `Venta web pedido cliente: ${customerName}`,
      currentUser.name
    );

    if (!stockResult.success) {
      setIsSubmitting(false);
      setErrorMessage(stockResult.error || 'Stock insuficiente para procesar el pedido.');
      return;
    }

    // Generate unique order code
    const existingOrders = storageService.getOrders();
    const nextNum = existingOrders.length + 1;
    const orderCode = `BIKIE-${nextNum.toString().padStart(6, '0')}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      code: orderCode,
      customer_id: currentUser.id,
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim() || 'cliente@bikie.gq',
      customer_phone: customerPhone.trim(),
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'delivery' ? deliveryAddress.trim() : undefined,
      city: city.trim(),
      notes: notes.trim() || undefined,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'store' ? 'unpaid' : 'paid',
      subtotal,
      discount: totalDiscount,
      coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
      total,
      items: items.map((i) => ({
        product_id: i.product.id,
        product_name: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        unit_price: i.product.sale_price,
        total_price: i.product.sale_price * i.quantity,
      })),
      created_at: new Date().toISOString(),
    };

    // Save order
    storageService.saveOrders([newOrder, ...existingOrders]);

    // Save activity log
    storageService.addActivityLog({
      user_name: customerName,
      user_role: 'customer',
      action: 'Creó un nuevo pedido',
      entity: 'order',
      entity_id: newOrder.id,
      details: `Pedido ${newOrder.code} por total de ${formatXAF(newOrder.total)}`,
    });

    // Add admin notification
    storageService.addNotification({
      target: 'admin',
      title: `Nuevo Pedido ${newOrder.code}`,
      message: `${newOrder.customer_name} ha realizado un pedido por ${formatXAF(newOrder.total)}.`,
      type: 'order',
    });

    // Fire Confetti
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }

    setCompletedOrder(newOrder);
    setIsSubmitting(false);
    onOrderCompleted(newOrder);
  };

  // WhatsApp Order Link Generator
  const generateWhatsAppLink = (order: Order) => {
    const rawPhone = (settings.whatsapp || '222213126').replace(/[^0-9]/g, '');
    const phone = rawPhone.startsWith('240') ? rawPhone : `240${rawPhone}`;
    const itemsList = order.items
      .map((i) => `• ${i.quantity}x ${i.product_name} (${formatXAF(i.total_price)})`)
      .join('\n');

    const text = `👋 *¡Hola BIKIE Papelería!*\n\nAcabo de realizar el pedido *${order.code}* a través de la web:\n\n*Cliente:* ${order.customer_name}\n*Teléfono:* ${order.customer_phone}\n*Entrega:* ${order.delivery_type === 'pickup' ? 'Recogida en tienda (Paraíso, Malabo)' : 'Envío a domicilio (' + (order.delivery_address || 'Malabo') + ')'}\n*Método de Pago:* ${order.payment_method}\n\n*Artículos:*\n${itemsList}\n\n*TOTAL A PAGAR:* ${formatXAF(order.total)}\n\nPor favor confírmenme cuando esté listo. ¡Muchas gracias!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  // Success Screen
  if (completedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-emerald-100 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            ¡Pedido Confirmado con Éxito!
          </span>

          <h2 className="text-3xl font-black text-slate-900 font-['Outfit']">
            Código: <span className="text-red-600">{completedOrder.code}</span>
          </h2>

          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Gracias por tu compra en <strong>BIKIE</strong>. Hemos registrado tu pedido en nuestra base de datos.
          </p>

          <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100 max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between text-slate-700">
              <span className="font-semibold">Cliente:</span>
              <span>{completedOrder.customer_name}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="font-semibold">Teléfono:</span>
              <span>{completedOrder.customer_phone}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="font-semibold">Tipo de Entrega:</span>
              <span className="font-bold capitalize">
                {completedOrder.delivery_type === 'pickup' ? 'Recogida en tienda' : 'Envío a domicilio'}
              </span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 border-t pt-2">
              <span>Total a pagar:</span>
              <span className="text-red-600">{formatXAF(completedOrder.total)}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={generateWhatsAppLink(completedOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span>Enviar confirmación por WhatsApp a BIKIE</span>
            </a>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToStore}
              className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
            >
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToStore}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit']">
            Finalizar Pedido
          </h1>
          <p className="text-xs text-slate-500">
            Completa tus datos para confirmar la reserva de materiales en BIKIE
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Details Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Customer Info */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Datos Obligatorios del Cliente</span>
              </h2>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                Obligatorio antes de enviar
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Ingresa tu nombre completo y número de teléfono o WhatsApp para contactarte en cuanto preparemos tu pedido.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. María Antonia Nchama"
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-red-600 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Teléfono / WhatsApp <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+240 222 123 456"
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-red-600 focus:outline-hidden font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-red-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Method */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Método de Entrega</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setDeliveryType('pickup')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  deliveryType === 'pickup'
                    ? 'border-red-600 bg-red-50/50'
                    : 'border-slate-200 hover:border-red-200'
                }`}
              >
                <Store className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Recogida en Tienda BIKIE</p>
                  <p className="text-[11px] text-slate-500">Malabo (Sin coste adicional)</p>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">GRATIS</span>
                </div>
              </div>

              <div
                onClick={() => setDeliveryType('delivery')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  deliveryType === 'delivery'
                    ? 'border-red-600 bg-red-50/50'
                    : 'border-slate-200 hover:border-red-200'
                }`}
              >
                <Truck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Envío a Domicilio</p>
                  <p className="text-[11px] text-slate-500">Directo a tu hogar o colegio</p>
                  <span className="text-[10px] text-red-600 font-bold mt-1 inline-block">+1.500 XAF</span>
                </div>
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div className="pt-2 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección exacta de entrega en Malabo *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Barrio, calle, número o referencia cercana (ej. Frente al Colegio Español)"
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Payment Method */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center font-bold">
                3
              </span>
              <span>Método de Pago</span>
            </h2>

            <div className="space-y-2">
              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'store' ? 'border-red-600 bg-red-50/50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'store'}
                    onChange={() => setPaymentMethod('store')}
                    className="text-red-600"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Pago en Tienda / Contra Entrega</p>
                    <p className="text-[11px] text-slate-500">Paga en efectivo o tarjeta al retirar tus materiales</p>
                  </div>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'transfer' ? 'border-red-600 bg-red-50/50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => setPaymentMethod('transfer')}
                    className="text-red-600"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Transferencia Bancaria / Pago Móvil</p>
                    <p className="text-[11px] text-slate-500">Bange, CCEI Bank o dinero móvil en Malabo</p>
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notas especiales del pedido (Opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Instrucciones especiales de empaquetado o entrega..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-red-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Column: Order Review */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-4 sticky top-28">
            <h3 className="text-base font-black text-slate-900 font-['Outfit'] border-b pb-3">
              Resumen del Pedido
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-50">
              {items.map((i) => (
                <div key={i.product.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                  <div className="truncate">
                    <p className="font-bold text-slate-800 truncate">{i.product.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {i.quantity} x {formatXAF(i.product.sale_price)}
                    </p>
                  </div>
                  <span className="font-black text-slate-900 shrink-0">
                    {formatXAF(i.product.sale_price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatXAF(subtotal)}</span>
              </div>
              {pricing.offersDiscount > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>Ofertas y Promociones</span>
                  <span>-{formatXAF(pricing.offersDiscount)}</span>
                </div>
              )}
              {pricing.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Descuento cupón ({appliedCoupon?.code})</span>
                  <span>-{formatXAF(pricing.couponDiscount)}</span>
                </div>
              )}
              {pricing.pointsDiscount > 0 && (
                <div className="flex justify-between text-indigo-600 font-semibold">
                  <span>Descuento puntos</span>
                  <span>-{formatXAF(pricing.pointsDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Envío</span>
                <span>{deliveryCost === 0 ? 'Gratis' : formatXAF(deliveryCost)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-slate-900 border-t pt-2 font-['Outfit']">
                <span>Total</span>
                <span className="text-red-600">{formatXAF(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-red-600/25 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-yellow-300" />
              <span>{isSubmitting ? 'Procesando pedido...' : 'Confirmar Pedido Ahora'}</span>
            </button>

            <div className="p-3 rounded-xl bg-red-50 text-red-900 text-[11px] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
              <span>Ganarás <strong>{Math.floor(total / 100)} puntos BIKIE</strong> con este pedido.</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
