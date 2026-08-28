import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Edit3,
  Coffee,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Receipt,
  Share2,
  Scissors,
  Layers,
  FileCheck,
  User,
  Phone,
  CreditCard,
  Building,
} from 'lucide-react';
import { Sale, StoreSettings, UserProfile } from '../types';
import { formatXAF, formatDate } from '../utils/formatters';
import { storageService } from '../lib/storage';

interface ServicePreset {
  id: string;
  category: 'copies' | 'documents' | 'printing' | 'juices' | 'custom';
  name: string;
  price: number;
  unit: string;
  icon: string;
}

const DEFAULT_SERVICE_PRESETS: ServicePreset[] = [
  // COPIAS
  { id: 'srv-cop-bn', category: 'copies', name: 'Fotocopia B/N A4', price: 50, unit: 'página', icon: 'FileText' },
  { id: 'srv-cop-color', category: 'copies', name: 'Fotocopia Color A4', price: 150, unit: 'página', icon: 'FileText' },
  { id: 'srv-cop-a3-bn', category: 'copies', name: 'Fotocopia B/N A3', price: 150, unit: 'página', icon: 'FileText' },
  { id: 'srv-cop-a3-color', category: 'copies', name: 'Fotocopia Color A3', price: 350, unit: 'página', icon: 'FileText' },
  { id: 'srv-plast-a4', category: 'copies', name: 'Plastificado A4', price: 500, unit: 'unidad', icon: 'Layers' },
  { id: 'srv-plast-dni', category: 'copies', name: 'Plastificado Carnet/DNI', price: 300, unit: 'unidad', icon: 'Layers' },
  { id: 'srv-encuad-esp', category: 'copies', name: 'Encuadernación Espiral', price: 1000, unit: 'cuaderno', icon: 'Scissors' },

  // REDACCIÓN DE DOCUMENTOS
  { id: 'srv-red-instancia', category: 'documents', name: 'Redacción de Instancia / Carta Oficial', price: 1500, unit: 'doc', icon: 'Edit3' },
  { id: 'srv-red-cv', category: 'documents', name: 'Redacción y Maquetación de CV', price: 3000, unit: 'doc', icon: 'Edit3' },
  { id: 'srv-red-contrato', category: 'documents', name: 'Redacción de Contrato (Alquiler/Venta)', price: 5000, unit: 'doc', icon: 'FileCheck' },
  { id: 'srv-red-solicitud', category: 'documents', name: 'Redacción Solicitud de Empleo', price: 2000, unit: 'doc', icon: 'Edit3' },
  { id: 'srv-transcripcion', category: 'documents', name: 'Mecanografía / Transcripción', price: 500, unit: 'página', icon: 'Edit3' },
  { id: 'srv-escaneo', category: 'documents', name: 'Escaneo de Documentos a PDF', price: 200, unit: 'página', icon: 'FileText' },

  // IMPRESIÓN DIGITAL
  { id: 'srv-imp-bn', category: 'printing', name: 'Impresión Documento B/N', price: 100, unit: 'página', icon: 'Printer' },
  { id: 'srv-imp-color', category: 'printing', name: 'Impresión Documento Color', price: 250, unit: 'página', icon: 'Printer' },
  { id: 'srv-imp-foto-1015', category: 'printing', name: 'Impresión Foto Brillante 10x15', price: 1000, unit: 'foto', icon: 'Printer' },
  { id: 'srv-imp-foto-a4', category: 'printing', name: 'Impresión Foto Brillante A4', price: 2000, unit: 'foto', icon: 'Printer' },
  { id: 'srv-imp-memoria', category: 'printing', name: 'Impresión Tesis / Memoria Completa', price: 7500, unit: 'unidad', icon: 'Printer' },

  // ZUMOS & BEBIDAS NATURALES
  { id: 'srv-zumo-naranja', category: 'juices', name: 'Zumo Natural de Naranja Exprimida', price: 1000, unit: 'vaso', icon: 'Coffee' },
  { id: 'srv-zumo-pina', category: 'juices', name: 'Zumo Natural de Piña de Malabo', price: 1200, unit: 'vaso', icon: 'Coffee' },
  { id: 'srv-zumo-maracuya', category: 'juices', name: 'Zumo Natural de Maracuyá', price: 1200, unit: 'vaso', icon: 'Coffee' },
  { id: 'srv-zumo-papaya', category: 'juices', name: 'Zumo de Papaya con Limón', price: 1000, unit: 'vaso', icon: 'Coffee' },
  { id: 'srv-batido-tropical', category: 'juices', name: 'Batido Tropical Especial BIKIE', price: 1500, unit: 'vaso', icon: 'Coffee' },
  { id: 'srv-agua-50cl', category: 'juices', name: 'Agua Mineral Fría 50cl', price: 500, unit: 'botella', icon: 'Coffee' },
  { id: 'srv-malta-fria', category: 'juices', name: 'Refresco / Malta Fría', price: 700, unit: 'botella', icon: 'Coffee' },
];

interface CartServiceItem {
  id: string;
  name: string;
  category: string;
  unit_price: number;
  quantity: number;
}

interface ServicesAndSalesManagerProps {
  currentUser: UserProfile;
  settings: StoreSettings;
  onRefreshData: () => void;
  onOpenInvoiceModal: (saleOrOrder: any) => void;
}

export const ServicesAndSalesManager: React.FC<ServicesAndSalesManagerProps> = ({
  currentUser,
  settings,
  onRefreshData,
  onOpenInvoiceModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'copies' | 'documents' | 'printing' | 'juices' | 'custom'>('all');
  const [serviceCart, setServiceCart] = useState<CartServiceItem[]>([]);
  const [customerName, setCustomerName] = useState('Cliente Mostrador');
  const [customerPhone, setCustomerPhone] = useState('+240 ');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Custom Quick Service input state
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<number>(500);
  const [customQty, setCustomQty] = useState<number>(1);
  const [customCategory, setCustomCategory] = useState<'copies' | 'documents' | 'printing' | 'juices'>('copies');

  const filteredPresets = selectedCategory === 'all'
    ? DEFAULT_SERVICE_PRESETS
    : DEFAULT_SERVICE_PRESETS.filter((p) => p.category === selectedCategory);

  const handleAddPreset = (preset: ServicePreset) => {
    const existing = serviceCart.find((i) => i.id === preset.id);
    if (existing) {
      setServiceCart(
        serviceCart.map((i) => (i.id === preset.id ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      setServiceCart([
        ...serviceCart,
        {
          id: preset.id,
          name: preset.name,
          category: preset.category,
          unit_price: preset.price,
          quantity: 1,
        },
      ]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || customPrice <= 0 || customQty <= 0) return;
    const newItem: CartServiceItem = {
      id: `srv-custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      unit_price: customPrice,
      quantity: customQty,
    };
    setServiceCart([...serviceCart, newItem]);
    setCustomName('');
    setCustomPrice(500);
    setCustomQty(1);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setServiceCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartServiceItem[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setServiceCart(serviceCart.filter((i) => i.id !== id));
  };

  const subtotal = serviceCart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleProcessServiceSale = async () => {
    if (serviceCart.length === 0) return;

    const receiptCode = `FAC-BIKIE-${Math.floor(100000 + Math.random() * 900000)}`;

    const newSale: any = {
      id: `sale-srv-${Date.now()}`,
      code: receiptCode,
      receipt_number: receiptCode,
      cash_register_id: 'reg-01',
      cashier_id: currentUser.id,
      cashier_name: currentUser.name || 'Tía Administradora',
      customer_name: customerName.trim() || 'Cliente Mostrador BIKIE',
      customer_phone: customerPhone.trim() || '+240 222 123 456',
      payment_method: paymentMethod,
      subtotal,
      discount: discountAmount,
      total,
      notes: `Ingreso de servicios: ${serviceCart.map((i) => i.name).join(', ')}`,
      items: serviceCart.map((it) => ({
        id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product_id: it.id,
        product_name: it.name,
        category: it.category,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.unit_price * it.quantity,
      })),
      created_at: new Date().toISOString(),
    };

    // Save to DB and storage
    await storageService.addSale(newSale);

    // Auto add cash movement
    const currentReg = storageService.getCurrentCashRegister();
    if (currentReg) {
      await storageService.addCashMovement({
        id: `cmov-${Date.now()}`,
        cash_register_id: currentReg.id,
        type: 'in',
        amount: total,
        reason: `Venta servicios/copias #${receiptCode}`,
        user_name: currentUser.name,
        created_at: new Date().toISOString(),
      });
      // update register balance
      await storageService.updateCashRegister(currentReg.id, {
        current_amount: (currentReg.current_amount || 0) + total,
      });
    }

    // Log Activity
    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `Registró venta de servicios/copias: ${receiptCode} por ${formatXAF(total)}`,
      entity: 'sale',
      entity_id: newSale.id,
      details: `${serviceCart.length} conceptos. Cliente: ${customerName}`,
    });

    setSuccessNotice(`¡Venta registrada con éxito! Código: ${receiptCode} (${formatXAF(total)})`);
    setTimeout(() => setSuccessNotice(null), 5000);

    // Prompt user to print PRO invoice
    onOpenInvoiceModal(newSale);

    // Reset form
    setServiceCart([]);
    setDiscountAmount(0);
    setCustomerName('Cliente Mostrador');
    onRefreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-800">
              Caja & Servicios BIKIE
            </span>
            <span className="text-emerald-400 font-bold text-xs bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Ingresos sincronizados con BD
            </span>
          </div>
          <h2 className="text-2xl font-black font-['Outfit'] text-white mt-1">
            Entradas de Dinero: Copias, Redacción, Impresión & Zumos
          </h2>
          <p className="text-xs text-slate-400">
            Registra cobros rápidos en mostrador, emite facturas oficiales con el nombre del local y controla los ingresos.
          </p>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Catalog Presets on Left, POS Ticket on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Catalog (2 Cols on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Todos los Servicios', icon: Sparkles },
              { id: 'copies', label: 'Copias & Encuadernación', icon: Layers },
              { id: 'documents', label: 'Redacción de Documentos', icon: Edit3 },
              { id: 'printing', label: 'Impresiones Digitales', icon: Printer },
              { id: 'juices', label: 'Zumos & Bebidas Naturales', icon: Coffee },
              { id: 'custom', label: 'Cobro Personalizado', icon: Plus },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                    selectedCategory === tab.id
                      ? 'bg-red-600 text-white shadow-md shadow-red-950'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* If Custom Quick Service Tab is active */}
          {selectedCategory === 'custom' ? (
            <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black font-['Outfit'] text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-400" />
                <span>Cobro de Servicio Manual / Especial</span>
              </h3>
              <form onSubmit={handleAddCustom} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-bold mb-1">
                      Descripción del Trabajo / Concepto
                    </label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Ej. Encuadernación de 5 libros gruesos / Plastificación especial"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Categoría</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 focus:outline-hidden"
                    >
                      <option value="copies">Copias & Encuadernación</option>
                      <option value="documents">Redacción de Documentos</option>
                      <option value="printing">Impresión</option>
                      <option value="juices">Zumos & Cafetería</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Precio Unitario (XAF)</label>
                    <input
                      type="number"
                      required
                      min={50}
                      step={50}
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Cantidad</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={customQty}
                      onChange={(e) => setCustomQty(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Añadir al Cobro Actual</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredPresets.map((preset) => {
                const isSelected = serviceCart.some((i) => i.id === preset.id);

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleAddPreset(preset)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-red-950/40 border-red-600 shadow-md ring-1 ring-red-500/40'
                        : 'bg-slate-800/60 border-slate-700 hover:border-red-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="space-y-1 truncate pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                        <h4 className="font-bold text-xs text-white truncate group-hover:text-red-300 transition-colors">
                          {preset.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 capitalize">
                        Unidad: {preset.unit} · {preset.category}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-red-400 font-['Outfit'] block">
                        {formatXAF(preset.price)}
                      </span>
                      <button
                        type="button"
                        className="mt-1 px-2.5 py-1 rounded-lg bg-red-600 group-hover:bg-red-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Añadir</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right POS Summary Card */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-red-400" />
                <h3 className="font-black text-sm text-white font-['Outfit']">
                  Cobro de Servicios BIKIE
                </h3>
              </div>
              <span className="bg-red-950 text-red-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-800">
                {serviceCart.length} conceptos
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 mt-3 max-h-56 overflow-y-auto pr-1">
              {serviceCart.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Ningún servicio añadido aún</p>
                  <p className="text-[10px] text-slate-500">
                    Haz clic en cualquier servicio de la izquierda para cobrarlo al instante.
                  </p>
                </div>
              ) : (
                serviceCart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate pr-2">
                      <p className="font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {formatXAF(item.unit_price)} × {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-white font-['Outfit']">
                        {formatXAF(item.unit_price * item.quantity)}
                      </span>

                      <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-[11px] font-bold text-white px-1">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form & Totals */}
          <div className="space-y-3 pt-3 border-t border-slate-700 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Nombre Cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-medium focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono focus:border-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Método de Cobro
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-bold focus:border-red-500 focus:outline-hidden cursor-pointer"
              >
                <option value="cash">Efectivo en Caja</option>
                <option value="card">Tarjeta / POS Electrónico</option>
                <option value="transfer">Transferencia Bancaria</option>
              </select>
            </div>

            {/* Breakdown */}
            <div className="space-y-1 pt-2 border-t border-slate-700/60">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>{formatXAF(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Descuento:</span>
                  <span>-{formatXAF(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold text-slate-200">TOTAL A COBRAR:</span>
                <span className="text-xl font-black text-red-400 font-['Outfit']">
                  {formatXAF(total)}
                </span>
              </div>
            </div>

            <button
              onClick={handleProcessServiceSale}
              disabled={serviceCart.length === 0}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cobrar & Emitir Factura PRO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
