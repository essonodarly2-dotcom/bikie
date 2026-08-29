import React, { useState, useEffect } from 'react';
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
  Settings2,
  X,
  Save,
  RotateCcw,
  Edit2,
} from 'lucide-react';
import { Sale, StoreSettings, UserProfile, ServiceItem } from '../types';
import { formatXAF, formatDate } from '../utils/formatters';
import { storageService } from '../lib/storage';

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
  const [servicesList, setServicesList] = useState<ServiceItem[]>(() => storageService.getServices());
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'copies' | 'documents' | 'printing' | 'juices' | 'custom'>('all');
  const [serviceCart, setServiceCart] = useState<CartServiceItem[]>([]);
  const [customerName, setCustomerName] = useState('Cliente Mostrador');
  const [customerPhone, setCustomerPhone] = useState('+240 ');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Manage Services / Price editing Modal state
  const [isPriceManagerOpen, setIsPriceManagerOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number>(500);
  const [newServiceUnit, setNewServiceUnit] = useState('página');
  const [newServiceCategory, setNewServiceCategory] = useState<'copies' | 'documents' | 'printing' | 'juices' | 'other'>('copies');

  // Custom Quick Service input state in POS
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<number>(500);
  const [customQty, setCustomQty] = useState<number>(1);
  const [customCategory, setCustomCategory] = useState<'copies' | 'documents' | 'printing' | 'juices'>('copies');

  const refreshServices = () => {
    setServicesList(storageService.getServices());
  };

  const filteredServices = selectedCategory === 'all'
    ? servicesList.filter((s) => s.is_active !== false)
    : servicesList.filter((s) => s.category === selectedCategory && s.is_active !== false);

  const handleAddPreset = (service: ServiceItem) => {
    const existing = serviceCart.find((i) => i.id === service.id);
    if (existing) {
      setServiceCart(
        serviceCart.map((i) => (i.id === service.id ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      setServiceCart([
        ...serviceCart,
        {
          id: service.id,
          name: service.name,
          category: service.category,
          unit_price: service.price,
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

  // Complete Sale & Auto-Generate Invoice
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
        register_id: currentReg.id,
        type: 'sale',
        amount: total,
        reason: `Venta servicios/copias #${receiptCode}`,
        cashier_name: currentUser.name,
        created_at: new Date().toISOString(),
      });
      // update register balance
      await storageService.updateCashRegister(currentReg.id, {
        total_sales: (currentReg.total_sales || 0) + total,
        expected_amount: (currentReg.expected_amount || 0) + total,
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

    setSuccessNotice(`¡Cobro completado y registrado! Factura generada: ${receiptCode} (${formatXAF(total)})`);
    setTimeout(() => setSuccessNotice(null), 5000);

    // Auto open invoice modal
    onOpenInvoiceModal(newSale);

    // Reset form
    setServiceCart([]);
    setDiscountAmount(0);
    setCustomerName('Cliente Mostrador');
    onRefreshData();
  };

  // Price Modification & Add Service Handlers
  const handleSaveServicePrice = (serviceId: string, newPrice: number) => {
    if (newPrice <= 0) return;
    storageService.updateService(serviceId, { price: newPrice });
    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `Actualizó precio de servicio en BD: ${formatXAF(newPrice)}`,
      entity: 'service',
      entity_id: serviceId,
    });
    refreshServices();
    onRefreshData();
  };

  const handleAddNewService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || newServicePrice <= 0) return;

    storageService.addService({
      name: newServiceName.trim(),
      price: Number(newServicePrice),
      category: newServiceCategory,
      unit: newServiceUnit.trim() || 'unidad',
      is_active: true,
    });

    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `Creó nuevo servicio en catálogo: ${newServiceName.trim()} (${formatXAF(newServicePrice)})`,
      entity: 'service',
      entity_id: `srv-${Date.now()}`,
    });

    setNewServiceName('');
    setNewServicePrice(500);
    setNewServiceUnit('página');
    refreshServices();
    onRefreshData();
  };

  const handleDeleteService = (serviceId: string, name: string) => {
    if (!confirm(`¿Estás segura de eliminar el servicio "${name}" del catálogo?`)) return;
    storageService.deleteService(serviceId);
    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `Eliminó servicio del catálogo: ${name}`,
      entity: 'service',
      entity_id: serviceId,
    });
    refreshServices();
    onRefreshData();
  };

  const handleResetDefaults = () => {
    if (!confirm('¿Restablecer todos los precios y servicios a los valores predeterminados de BIKIE?')) return;
    storageService.resetDefaultServices();
    refreshServices();
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
              Precios Editables & Factura Automática
            </span>
          </div>
          <h2 className="text-2xl font-black font-['Outfit'] text-white mt-1">
            Entradas de Dinero: Copias, Redacción, Impresión & Zumos
          </h2>
          <p className="text-xs text-slate-400">
            Registra cobros rápidos en mostrador, emite facturas oficiales con el nombre de BIKIE y edita los precios cuando lo necesites.
          </p>
        </div>

        <button
          onClick={() => setIsPriceManagerOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-600 shadow-md transition-all cursor-pointer"
        >
          <Settings2 className="w-4 h-4 text-yellow-400" />
          <span>Modificar Precios & Añadir Servicios</span>
        </button>
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
              {filteredServices.map((service) => {
                const isSelected = serviceCart.some((i) => i.id === service.id);

                return (
                  <div
                    key={service.id}
                    onClick={() => handleAddPreset(service)}
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
                          {service.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 capitalize">
                        Unidad: {service.unit} · {service.category}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-red-400 font-['Outfit'] block">
                        {formatXAF(service.price)}
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
              <span>Cobrar & Generar Factura Oficial</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRICE MANAGER & SERVICE CREATION MODAL                         */}
      {/* ============================================================== */}
      {isPriceManagerOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-['Outfit']">
                    Gestión de Precios & Catálogo de Servicios
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modifica los precios de copias, redacción, impresiones o zumos, y añade nuevos servicios.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetDefaults}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  title="Restablecer precios estándar"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Restablecer</span>
                </button>
                <button
                  onClick={() => setIsPriceManagerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add New Service Form */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Nuevo Servicio al Catálogo</span>
              </h4>

              <form onSubmit={handleAddNewService} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Nombre del Servicio</label>
                  <input
                    type="text"
                    required
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="Ej. Fotocopia A2 Plano / Redacción Poder Notarial"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Categoría</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                  >
                    <option value="copies">Copias / Encuadernación</option>
                    <option value="documents">Redacción de Documentos</option>
                    <option value="printing">Impresión Digital</option>
                    <option value="juices">Zumos & Cafetería</option>
                    <option value="other">Otro Servicio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Precio (XAF)</label>
                  <input
                    type="number"
                    required
                    min={25}
                    step={25}
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-400 font-bold mb-1">Unidad (página, doc, vaso, foto)</label>
                  <input
                    type="text"
                    value={newServiceUnit}
                    onChange={(e) => setNewServiceUnit(e.target.value)}
                    placeholder="página, documento, unidad, vaso..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-950 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Guardar Servicio</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of Existing Services with Live Price Edits */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase">
                Servicios Actuales ({servicesList.length}) — Puedes editar el precio de cada uno directamente:
              </h4>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800">
                {servicesList.map((srv) => (
                  <div
                    key={srv.id}
                    className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-800/40 p-2 rounded-xl"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">{srv.name}</p>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {srv.category} · Unidad: {srv.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">Precio actual:</span>
                      <input
                        type="number"
                        defaultValue={srv.price}
                        onBlur={(e) => handleSaveServicePrice(srv.id, Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveServicePrice(srv.id, Number((e.target as HTMLInputElement).value));
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-right text-red-400 font-mono font-bold focus:border-red-500 focus:outline-hidden"
                      />
                      <span className="text-[11px] text-slate-400">XAF</span>

                      <button
                        onClick={() => handleDeleteService(srv.id, srv.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Eliminar servicio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsPriceManagerOpen(false)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-red-950"
              >
                Listo / Cerrar Administrador de Precios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
