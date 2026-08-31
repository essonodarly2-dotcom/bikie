import React, { useState } from 'react';
import {
  X,
  DollarSign,
  CreditCard,
  Building2,
  Store,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { Order, PaymentMethod } from '../types';
import { formatXAF } from '../utils/formatters';

interface ChargeOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCharge: (order: Order, paymentMethod: PaymentMethod, notes?: string) => void;
}

export const ChargeOrderModal: React.FC<ChargeOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmCharge,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(order?.payment_method || 'store');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !order) return null;

  const isAlreadyPaid = order.payment_status === 'paid';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyPaid) {
      alert('Este pedido ya fue cobrado previamente.');
      return;
    }
    setIsProcessing(true);
    onConfirmCharge(order, selectedMethod, notes);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white font-['Outfit']">
                Cobrar Pedido #{order.code}
              </h3>
              <p className="text-[11px] text-slate-400">Cliente: {order.customer_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAlreadyPaid ? (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pedido ya cobrado previamente</span>
            </div>
            <p>
              Este pedido ya cuenta con estado PAGADO ({formatXAF(order.total)}). Si deseas reimprimir el comprobante, usa la opción "Imprimir Factura".
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Amount Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-950/40 to-slate-950 border border-green-800/40 text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Monto Total a Cobrar
              </span>
              <div className="text-2xl font-black text-green-400 font-mono">
                {formatXAF(order.total)}
              </div>
              <p className="text-[10px] text-slate-400">
                {order.items.length} {order.items.length === 1 ? 'artículo' : 'artículos'} incluidos
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-bold">
                Seleccionar Método de Pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('store')}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedMethod === 'store'
                      ? 'bg-green-600/20 border-green-500 text-white shadow-xs'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Store className="w-4 h-4 text-green-400" />
                    <span>Efectivo (Caja)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Suma al arqueo de caja</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('transfer')}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedMethod === 'transfer'
                      ? 'bg-green-600/20 border-green-500 text-white shadow-xs'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>Transferencia</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Cuenta bancaria BIKIE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('online')}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedMethod === 'online'
                      ? 'bg-green-600/20 border-green-500 text-white shadow-xs'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span>Tarjeta / TPV</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Terminal o pasarela</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('other')}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedMethod === 'other'
                      ? 'bg-green-600/20 border-green-500 text-white shadow-xs'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>Pago Móvil / Otro</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Billetera digital</span>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Notas / Referencia del Cobro (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ej. Recibido por María Lidia - Billete 10.000..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-green-950 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Cobro ({formatXAF(order.total)})</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
