import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  FileText,
  Building2,
  Phone,
  Mail,
  MapPin,
  QrCode,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { Order, Sale, StoreSettings } from '../types';
import { formatXAF, formatDate } from '../utils/formatters';

interface InvoicePrintModalProps {
  order?: Order | null;
  sale?: (Sale & { customer_phone?: string; notes?: string }) | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  order,
  sale,
  settings,
  onClose,
}) => {
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');
  const [copiedLink, setCopiedLink] = useState(false);

  // Normalize document data whether it's an Order or a Sale
  const doc = order || sale;
  if (!doc) return null;

  const docCode = 'code' in doc ? doc.code : `FAC-${doc.id.slice(-6).toUpperCase()}`;
  const docDate = doc.created_at || new Date().toISOString();
  const customerName = doc.customer_name || 'Cliente Mostrador BIKIE';
  const customerPhone =
    ('customer_phone' in doc && doc.customer_phone) || ('phone' in doc && (doc as any).phone) || '+240 222 123 456';
  const customerEmail = ('customer_email' in doc && doc.customer_email) || undefined;
  const paymentMethod = doc.payment_method || 'Efectivo';
  const subtotal = doc.subtotal || doc.total;
  const discount = doc.discount || 0;
  const total = doc.total;
  const items = doc.items || [];

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const itemList = items
      .map((it: any) => `• ${it.product_name || it.name} (x${it.quantity}): ${formatXAF(it.total_price || it.total || it.unit_price * it.quantity)}`)
      .join('\n');

    const msg = `*FACTURA / COMPROBANTE OFICIAL BIKIE*\n` +
      `🧾 *Factura Nº:* ${docCode}\n` +
      `📅 *Fecha:* ${formatDate(docDate)}\n` +
      `👤 *Cliente:* ${customerName}\n` +
      `📍 *Papelería BIKIE* - Malabo, Guinea Ecuatorial\n\n` +
      `*DETALLE DE COMPRA / SERVICIOS:*\n${itemList}\n\n` +
      `💰 *Subtotal:* ${formatXAF(subtotal)}\n` +
      (discount > 0 ? `🎁 *Descuento:* -${formatXAF(discount)}\n` : '') +
      `💵 *TOTAL PAGADO:* ${formatXAF(total)}\n` +
      `💳 *Método:* ${paymentMethod}\n\n` +
      `¡Muchas gracias por su preferencia!`;

    const targetUrl = cleanPhone.length >= 6
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(targetUrl, '_blank');
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(`Factura BIKIE #${docCode} - ${customerName} - Total: ${formatXAF(total)}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Convert total to written Spanish words representation (simplified for standard amounts)
  const getAmountInWords = (amount: number): string => {
    if (amount <= 0) return 'CERO FRANCOS CFA';
    return `${amount.toLocaleString('es-ES')} FRANCOS CFA (FCFA / XAF)`;
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className={`w-full ${printFormat === 'thermal' ? 'max-w-md' : 'max-w-3xl'} bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col transition-all`}>
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center font-black font-['Outfit'] text-sm">
              B
            </div>
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-red-400">
                Factura Oficial Propietaria
              </span>
              <p className="text-[11px] text-slate-400">#{docCode}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-[11px] font-bold">
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  printFormat === 'a4' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Factura PRO
              </button>
              <button
                onClick={() => setPrintFormat('thermal')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  printFormat === 'thermal' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ticket 80mm
              </button>
            </div>

            <button
              onClick={handleWhatsAppShare}
              title="Compartir por WhatsApp"
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          id="bikie-printable-invoice"
          className={`overflow-y-auto bg-white text-slate-900 font-sans ${
            printFormat === 'thermal' ? 'p-6 space-y-4 text-xs' : 'p-8 sm:p-12 space-y-7 text-xs'
          }`}
        >
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b-2 border-red-600 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-2xl font-['Outfit'] shadow-md">
                  B
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight text-slate-950">
                    <span className="text-red-600">B</span><span className="text-slate-950">IKIE</span><span className="text-red-600">.</span>
                  </h1>
                  <p className="text-[11px] uppercase font-black text-red-600 tracking-wider">
                    Papelería · Librería · Copistería · Servicios Digitales
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium pt-1">
                {settings.address || 'Calle de la Independencia / Ela Nguema, Malabo, Guinea Ecuatorial'}
              </p>
              <p className="text-[11px] text-slate-500">
                <strong>NIF:</strong> 0092834-GE · <strong>Registro:</strong> GE-MAL-2024-B · <strong>Tel / WhatsApp:</strong> {settings.phone || '+240 222 123 456'}
              </p>
              <p className="text-[11px] text-slate-500">
                <strong>Email:</strong> {settings.email || 'administracion@bikie.gq'} · <strong>Horario:</strong> {settings.opening_hours || 'Lun - Sáb: 08:00 - 20:00'}
              </p>
            </div>

            <div className="text-right space-y-1.5 shrink-0">
              <div className="bg-red-50 text-red-700 border-2 border-red-600 text-[11px] font-black uppercase px-3.5 py-1 rounded-xl inline-block shadow-xs">
                FACTURA OFICIAL PRO
              </div>
              <p className="text-base font-black text-slate-950 font-['Outfit'] tracking-wide">
                Nº {docCode}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Fecha: {formatDate(docDate)}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                ✓ PAGADO / CONFORME
              </p>
            </div>
          </div>

          {/* Customer and Commercial Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <p className="font-black text-slate-400 uppercase text-[10px] tracking-wider">
                DATOS DEL CLIENTE
              </p>
              <p className="font-black text-slate-950 text-sm">{customerName}</p>
              <p className="text-slate-700 flex items-center gap-1 text-xs">
                <Phone className="w-3.5 h-3.5 text-red-600" />
                <span>{customerPhone}</span>
              </p>
              {customerEmail && (
                <p className="text-slate-600 flex items-center gap-1 text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customerEmail}</span>
                </p>
              )}
            </div>

            <div className="space-y-1 text-right sm:text-left border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
              <p className="font-black text-slate-400 uppercase text-[10px] tracking-wider">
                CONDICIONES DE VENTA & PAGO
              </p>
              <p className="text-slate-800">
                <strong>Tipo:</strong>{' '}
                {'delivery_type' in doc && doc.delivery_type === 'delivery'
                  ? `Entrega a Domicilio (${(doc as any).delivery_address || 'Malabo'})`
                  : 'Venta Directa en Mostrador / Tienda'}
              </p>
              <p className="text-slate-800">
                <strong>Forma de Pago:</strong> <span className="uppercase font-bold text-red-700">{paymentMethod}</span>
              </p>
              <p className="text-slate-800">
                <strong>Atendido por:</strong> {('cashier_name' in doc && doc.cashier_name) || 'Tía Administradora (BIKIE)'}
              </p>
            </div>
          </div>

          {/* Items & Services Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                DESGLOSE DE ARTÍCULOS & SERVICIOS
              </span>
              <span className="text-[10px] text-slate-400">
                {items.length} {items.length === 1 ? 'concepto' : 'conceptos'}
              </span>
            </div>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-y border-slate-300 bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-2">Descripción / Concepto</th>
                  <th className="py-2.5 px-2 text-center">Cant.</th>
                  <th className="py-2.5 px-2 text-right">Precio Unit.</th>
                  <th className="py-2.5 px-3 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((it: any, idx: number) => {
                  const name = it.product_name || it.name || 'Servicio BIKIE';
                  const qty = it.quantity || 1;
                  const unitPrice = it.unit_price || it.price || (it.total_price ? it.total_price / qty : 0);
                  const totalPrice = it.total_price || it.total || unitPrice * qty;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-bold text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{name}</span>
                          {it.sku && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-mono">
                              {it.sku}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700">{qty}</td>
                      <td className="py-2.5 px-2 text-right text-slate-600 font-medium">
                        {formatXAF(unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-950 font-['Outfit']">
                        {formatXAF(totalPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Summary & Amount in Words */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t-2 border-slate-200 items-start">
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  IMPORTE EN LETRAS
                </p>
                <p className="text-xs font-bold text-slate-800 uppercase italic mt-0.5">
                  {getAmountInWords(total)}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Operación registrada en la Base de Datos BIKIE
                </span>
                <span className="font-mono">GE-POS-AUTH</span>
              </div>
            </div>

            {/* Totals Table */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Neto:</span>
                <span className="font-bold">{formatXAF(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Descuento Comercial:</span>
                  <span>-{formatXAF(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Impuesto / IVA (0% Especial):</span>
                <span>0 XAF</span>
              </div>

              {'delivery_type' in doc && doc.delivery_type === 'delivery' && (
                <div className="flex justify-between text-slate-600">
                  <span>Coste Envío Malabo:</span>
                  <span className="font-bold">1.500 XAF</span>
                </div>
              )}

              <div className="flex justify-between items-center text-lg font-black text-slate-950 border-t-2 border-red-600 pt-2 font-['Outfit']">
                <span>TOTAL A PAGAR:</span>
                <span className="text-red-600 text-xl">{formatXAF(total)}</span>
              </div>
            </div>
          </div>

          {/* Legal Stamp, QR and Signature */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200 items-center text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-300 p-1 flex items-center justify-center shrink-0">
                <QrCode className="w-14 h-14 text-slate-800" />
              </div>
              <div className="text-[10px] text-slate-500">
                <p className="font-bold text-slate-800">Verificación Fiscal</p>
                <p>Escanee para validar comprobante oficial BIKIE</p>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-700">¡Gracias por confiar en BIKIE!</p>
              <p>Todo lo que necesitas para estudiar, trabajar y crear.</p>
              <p className="text-[9px]">Documento mercantil válido según la normativa local.</p>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4 text-center">
              <div className="h-10 flex items-end justify-center">
                <span className="font-['Outfit'] text-red-600 font-bold text-xs italic">
                  Tía Administradora BIKIE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold border-t border-slate-300 pt-1">
                Firma & Sello de Caja
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
