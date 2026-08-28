import React, { useState } from 'react';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  MessageCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { formatXAF, formatDate, getOrderStatusLabel } from '../utils/formatters';

interface OrderTrackingViewProps {
  orders: Order[];
  settings: StoreSettings;
  onOpenInvoiceModal: (order: Order) => void;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Recibido', desc: 'Pedido ingresado en sistema' },
  { key: 'confirmed', label: 'Confirmado', desc: 'Stock apartado' },
  { key: 'preparing', label: 'Preparando', desc: 'Empaquetando en papelería' },
  { key: 'ready_for_pickup', label: 'Listo', desc: 'Disponible para retirar / En camino' },
  { key: 'delivered', label: 'Entregado', desc: 'Completado con éxito' },
];

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orders,
  settings,
  onOpenInvoiceModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const term = searchTerm.trim().toLowerCase();
    const found = orders.find(
      (o) =>
        o.code.toLowerCase() === term ||
        o.customer_phone.toLowerCase().includes(term) ||
        o.customer_name.toLowerCase().includes(term)
    );

    if (found) {
      setSelectedOrder(found);
    } else {
      setSelectedOrder(null);
    }
  };

  const getStepIndex = (status: string): number => {
    switch (status) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'preparing':
        return 2;
      case 'ready_for_pickup':
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = selectedOrder ? getStepIndex(selectedOrder.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <Package className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit']">
          Seguimiento de tu Pedido BIKIE
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Consulta en tiempo real el estado de preparación y entrega de tus materiales
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto">
        <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border border-slate-200 bg-white">
          <Search className="w-5 h-5 text-slate-400 absolute left-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Introduce código de pedido (ej. BIKIE-000001) o teléfono..."
            className="w-full pl-12 pr-28 py-3.5 text-xs sm:text-sm text-slate-800 focus:outline-hidden"
          />
          <button
            type="submit"
            className="absolute right-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Recent Orders Quick Select */}
      {orders.length > 0 && (
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Pedidos registrados:</span>
          {orders.slice(0, 4).map((ord) => (
            <button
              key={ord.id}
              onClick={() => {
                setSelectedOrder(ord);
                setSearchTerm(ord.code);
              }}
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                selectedOrder?.id === ord.id
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
              }`}
            >
              {ord.code}
            </button>
          ))}
        </div>
      )}

      {/* Order Status Display */}
      {selectedOrder ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-6 sm:p-8 space-y-8">
          {/* Top Order Card Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900 font-['Outfit']">
                  {selectedOrder.code}
                </h2>
                {(() => {
                  const badge = getOrderStatusLabel(selectedOrder.status);
                  return (
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full border ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Registrado el {formatDate(selectedOrder.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenInvoiceModal(selectedOrder)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-red-600" />
                <span>Ver Recibo</span>
              </button>
              <a
                href={`https://wa.me/${(settings.whatsapp || '').replace(/[^0-9]/g, '')}?text=Hola%20BIKIE,%20quisiera%20consultar%20el%20estado%20de%20mi%20pedido%20${selectedOrder.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Preguntar por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Timeline Visual Progress */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Progreso del Pedido
            </h3>

            <div className="grid grid-cols-5 gap-2 text-center relative">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="space-y-2 relative">
                    <div
                      className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                          : 'bg-slate-100 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-red-100 scale-110' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold ${
                          isPassed ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-400 hidden sm:block">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Datos de Entrega y Contacto
              </h4>
              <div className="space-y-1 text-slate-600">
                <p>
                  <strong>Cliente:</strong> {selectedOrder.customer_name}
                </p>
                <p>
                  <strong>Teléfono:</strong> {selectedOrder.customer_phone}
                </p>
                <p>
                  <strong>Tipo de Entrega:</strong>{' '}
                  {selectedOrder.delivery_type === 'pickup'
                    ? 'Recogida en tienda BIKIE (Malabo)'
                    : `Envío a domicilio (${selectedOrder.delivery_address || 'Malabo'})`}
                </p>
                {selectedOrder.notes && (
                  <p>
                    <strong>Notas:</strong> {selectedOrder.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Artículos del Pedido ({selectedOrder.items.length})
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="pt-1.5 flex justify-between items-center">
                    <span className="truncate max-w-[200px] text-slate-700">
                      {it.quantity}x {it.product_name}
                    </span>
                    <span className="font-black text-slate-900">{formatXAF(it.total_price)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 flex justify-between items-center text-sm font-black text-red-600 font-['Outfit']">
                <span>Total:</span>
                <span>{formatXAF(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="text-sm font-bold text-slate-800">No se encontró ningún pedido con ese criterio</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Verifica que el código de pedido esté escrito correctamente (ej. BIKIE-000001) o busca por el número de teléfono con el que realizaste la compra.
          </p>
        </div>
      )}
    </div>
  );
};
