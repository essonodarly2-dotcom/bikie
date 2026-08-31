import React from 'react';
import {
  X,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Store,
  DollarSign,
  Printer,
  MessageCircle,
  XCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { formatXAF, formatDate, getOrderStatusLabel } from '../utils/formatters';

interface OrderDetailModalProps {
  order: Order | null;
  settings: StoreSettings;
  onClose: () => void;
  onAcceptOrder: (order: Order) => void;
  onPrepareOrder: (order: Order) => void;
  onMarkReady: (order: Order) => void;
  onMarkShipped: (order: Order) => void;
  onMarkDelivered: (order: Order) => void;
  onOpenChargeModal: (order: Order) => void;
  onOpenCancelModal: (order: Order) => void;
  onOpenInvoiceModal: (order: Order) => void;
  onSendWhatsApp: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  settings,
  onClose,
  onAcceptOrder,
  onPrepareOrder,
  onMarkReady,
  onMarkShipped,
  onMarkDelivered,
  onOpenChargeModal,
  onOpenCancelModal,
  onOpenInvoiceModal,
  onSendWhatsApp,
}) => {
  if (!order) return null;

  const statusBadge = getOrderStatusLabel(order.status);
  const isPaid = order.payment_status === 'paid';
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white font-['Outfit']">
                  Pedido {order.code}
                </h3>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    isPaid
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700/50'
                      : 'bg-amber-950/60 text-amber-400 border-amber-700/50'
                  }`}
                >
                  {isPaid ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(order.created_at)}</span>
                {order.invoice_number && (
                  <>
                    <span>•</span>
                    <span className="text-slate-300 font-mono font-bold">Fac: {order.invoice_number}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Quick Flow Action Buttons */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-red-400" />
              <span>Flujo de Trabajo del Pedido</span>
            </h4>

            <div className="flex flex-wrap items-center gap-2">
              {order.status === 'pending' && (
                <button
                  onClick={() => onAcceptOrder(order)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. Aceptar Pedido</span>
                </button>
              )}

              {order.status === 'confirmed' && (
                <button
                  onClick={() => onPrepareOrder(order)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-amber-950 transition-all cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>2. Poner en Preparación</span>
                </button>
              )}

              {order.status === 'preparing' && (
                <button
                  onClick={() => onMarkReady(order)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-950 transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>3. Marcar como Listo</span>
                </button>
              )}

              {order.status === 'ready_for_pickup' && (
                <button
                  onClick={() => onMarkShipped(order)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950 transition-all cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>4. Despachar / Enviar</span>
                </button>
              )}

              {order.status === 'shipped' && (
                <button
                  onClick={() => onMarkDelivered(order)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>5. Marcar como Entregado</span>
                </button>
              )}

              {!isPaid && !isCancelled && (
                <button
                  onClick={() => onOpenChargeModal(order)}
                  className="px-4 py-2 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold flex items-center gap-1.5 shadow-md shadow-green-950 transition-all cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Cobrar Pedido ({formatXAF(order.total)})</span>
                </button>
              )}

              <button
                onClick={() => onOpenInvoiceModal(order)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Factura / Ticket</span>
              </button>

              <button
                onClick={() => onSendWhatsApp(order)}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Avisar por WhatsApp</span>
              </button>

              {!isCancelled && !isDelivered && (
                <button
                  onClick={() => onOpenCancelModal(order)}
                  className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 font-bold flex items-center gap-1.5 ml-auto transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rechazar / Cancelar</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer & Delivery Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
              <h4 className="font-bold text-slate-300 flex items-center gap-2 border-b border-slate-700/60 pb-2">
                <User className="w-4 h-4 text-red-400" />
                <span>Datos del Cliente</span>
              </h4>
              <div className="space-y-1.5 text-slate-300">
                <p className="flex justify-between">
                  <span className="text-slate-500 font-medium">Nombre:</span>
                  <span className="font-bold text-white">{order.customer_name}</span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Teléfono:</span>
                  <span className="font-mono font-bold text-red-300">{order.customer_phone}</span>
                </p>
                {order.customer_email && (
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Email:</span>
                    <span className="text-slate-300">{order.customer_email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Delivery & Payment Box */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
              <h4 className="font-bold text-slate-300 flex items-center gap-2 border-b border-slate-700/60 pb-2">
                <Truck className="w-4 h-4 text-red-400" />
                <span>Entrega y Pago</span>
              </h4>
              <div className="space-y-1.5 text-slate-300">
                <p className="flex justify-between">
                  <span className="text-slate-500 font-medium">Tipo:</span>
                  <span className="font-bold text-white capitalize">
                    {order.delivery_type === 'pickup' ? '🏪 Recogida en Tienda BIKIE' : '🚚 Entrega a Domicilio'}
                  </span>
                </p>
                {order.delivery_address && (
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Dirección:</span>
                    <span className="text-right text-slate-300 max-w-[200px] truncate">{order.delivery_address}</span>
                  </p>
                )}
                <p className="flex justify-between">
                  <span className="text-slate-500 font-medium">Método de Pago:</span>
                  <span className="font-bold text-slate-200 capitalize">{order.payment_method}</span>
                </p>
                {order.notes && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <span className="text-slate-500 font-medium block">Notas del cliente:</span>
                    <p className="text-slate-300 italic mt-0.5 bg-slate-900/50 p-2 rounded-lg">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cancellation Info if cancelled */}
          {order.status === 'cancelled' && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>Pedido Cancelado</span>
              </div>
              <p className="text-xs">
                Motivo: {order.cancellation_reason || 'Sin motivo especificado'}. El stock de los artículos fue devuelto al inventario automáticamente.
              </p>
              {order.cancelled_at && (
                <p className="text-[10px] text-red-400/80">Fecha: {formatDate(order.cancelled_at)}</p>
              )}
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-300 flex items-center gap-2">
              <Package className="w-4 h-4 text-red-400" />
              <span>Artículos del Pedido ({order.items.length})</span>
            </h4>

            <div className="border border-slate-700/60 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Producto</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3 text-right">Precio Unit.</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">
                        <p>{it.product_name}</p>
                        {it.sku && <span className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</span>}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-300">{it.quantity}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{formatXAF(it.unit_price)}</td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        {formatXAF(it.total_price || it.unit_price * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-w-sm ml-auto space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-200">{formatXAF(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Descuento {order.coupon_code ? `(${order.coupon_code})` : ''}:</span>
                  <span className="font-mono">-{formatXAF(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white border-t border-slate-800 pt-2">
                <span>Total a Pagar:</span>
                <span className="text-red-400 font-mono">{formatXAF(order.total)}</span>
              </div>
            </div>
          </div>

          {/* History / Audit Log */}
          {order.history && order.history.length > 0 && (
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <h4 className="font-bold text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-400" />
                <span>Historial de Estados y Acciones</span>
              </h4>

              <div className="space-y-2">
                {order.history.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="font-bold text-white capitalize">{h.status}</span>
                      <span className="text-slate-400">— {h.note || 'Actualización'}</span>
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      <span>{h.actor}</span> • <span>{formatDate(h.timestamp)}</span>
                    </div>
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
