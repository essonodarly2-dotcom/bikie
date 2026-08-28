import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Download,
  Building,
  Layers,
  Sparkles,
  X,
  Share2,
} from 'lucide-react';
import { Order, Sale, StoreSettings, UserProfile } from '../types';
import { formatXAF, formatDate } from '../utils/formatters';
import { storageService } from '../lib/storage';

interface SalesHistoryAndReportsProps {
  orders: Order[];
  sales: Sale[];
  settings: StoreSettings;
  currentUser: UserProfile;
  onRefreshData: () => void;
  onOpenInvoiceModal: (item: any) => void;
}

export const SalesHistoryAndReports: React.FC<SalesHistoryAndReportsProps> = ({
  orders,
  sales,
  settings,
  currentUser,
  onRefreshData,
  onOpenInvoiceModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'reports'>('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'annual' | 'all'>('daily');
  const [filterType, setFilterType] = useState<'all' | 'orders' | 'services'>('all');

  // Edit Sale modal state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editTotal, setEditTotal] = useState<number>(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState('cash');
  const [editNotes, setEditNotes] = useState('');

  // Combine unified sales records (Orders + POS/Services Sales)
  const unifiedList = [
    ...orders.map((o) => ({
      id: o.id,
      record_type: 'order' as const,
      code: o.code,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      total: o.total,
      subtotal: o.subtotal,
      discount: o.discount,
      payment_method: o.payment_method,
      status: o.status,
      created_at: o.created_at,
      items: o.items,
      raw: o,
    })),
    ...sales.map((s) => ({
      id: s.id,
      record_type: 'service' as const,
      code: s.code || `FAC-${s.id.slice(-6).toUpperCase()}`,
      customer_name: s.customer_name || 'Cliente Mostrador',
      customer_phone: (s as any).customer_phone || '+240 222 123 456',
      total: s.total,
      subtotal: s.subtotal || s.total,
      discount: s.discount || 0,
      payment_method: s.payment_method || 'Efectivo',
      status: 'completed',
      created_at: s.created_at,
      items: s.items || [],
      raw: s,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Date Filters logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  const currentYear = now.getFullYear();

  const filteredList = unifiedList.filter((item) => {
    // Search query filter
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_phone.includes(searchTerm);

    if (!matchesSearch) return false;

    // Type filter
    if (filterType === 'orders' && item.record_type !== 'order') return false;
    if (filterType === 'services' && item.record_type !== 'service') return false;

    // Period filter
    const itemDate = new Date(item.created_at);
    if (reportPeriod === 'daily') {
      return item.created_at.startsWith(todayStr);
    } else if (reportPeriod === 'weekly') {
      return itemDate >= oneWeekAgo;
    } else if (reportPeriod === 'annual') {
      return itemDate.getFullYear() === currentYear;
    }

    return true;
  });

  // KPI calculations for reports
  const totalRevenue = filteredList.reduce((sum, i) => sum + i.total, 0);
  const totalTransactions = filteredList.length;
  const avgTicket = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  // Breakdown by category/source
  const servicesRevenue = filteredList
    .filter((i) => i.record_type === 'service')
    .reduce((sum, i) => sum + i.total, 0);

  const ordersRevenue = filteredList
    .filter((i) => i.record_type === 'order')
    .reduce((sum, i) => sum + i.total, 0);

  // Edit Sale Handler
  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    setEditCustomerName(item.customer_name);
    setEditCustomerPhone(item.customer_phone);
    setEditTotal(item.total);
    setEditPaymentMethod(item.payment_method);
    setEditNotes(item.raw.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditedSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingItem.record_type === 'order') {
      await storageService.updateOrder(editingItem.id, {
        customer_name: editCustomerName.trim(),
        customer_phone: editCustomerPhone.trim(),
        total: editTotal,
        payment_method: editPaymentMethod as any,
        notes: editNotes.trim(),
      });
    } else {
      await storageService.updateSale(editingItem.id, {
        customer_name: editCustomerName.trim(),
        customer_phone: editCustomerPhone.trim(),
        total: editTotal,
        payment_method: editPaymentMethod,
        notes: editNotes.trim(),
      });
    }

    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `Editó venta/pedido #${editingItem.code} en la Base de Datos`,
      entity: 'sale',
      entity_id: editingItem.id,
      details: `Cliente: ${editCustomerName}, Total: ${formatXAF(editTotal)}`,
    });

    setIsEditModalOpen(false);
    setEditingItem(null);
    onRefreshData();
  };

  // Delete Sale Handler
  const handleDeleteSale = async (item: any) => {
    const confirmMsg = `¿Estás seguro de que deseas eliminar permanentemente la venta #${item.code} (${formatXAF(item.total)}) de la base de datos?\nEsta acción no se puede deshacer.`;
    if (!confirm(confirmMsg)) return;

    if (item.record_type === 'order') {
      await storageService.deleteOrder(item.id);
    } else {
      await storageService.deleteSale(item.id);
    }

    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `Eliminó venta/pedido #${item.code} de la Base de Datos`,
      entity: 'sale',
      entity_id: item.id,
      details: `Total: ${formatXAF(item.total)}`,
    });

    onRefreshData();
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-800">
              Informes Financieros & Auditoría
            </span>
            <span className="text-emerald-400 font-bold text-xs bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Base de Datos Conectada
            </span>
          </div>
          <h2 className="text-2xl font-black font-['Outfit'] text-white mt-1">
            Historial de Ventas, Reportes & Modificación en BD
          </h2>
          <p className="text-xs text-slate-400">
            Consulta, edita o elimina ventas de la base de datos y genera reportes ejecutivos listos para imprimir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'history' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Listado & Edición de Ventas
            </button>
            <button
              onClick={() => setActiveSubTab('reports')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'reports' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Reportes Imprimibles (D/S/A)
            </button>
          </div>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Informe</span>
          </button>
        </div>
      </div>

      {/* Period Selector & Summary Cards */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-red-400" />
              Período de Reporte:
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              {[
                { id: 'daily', label: 'Diario (Hoy)' },
                { id: 'weekly', label: 'Semanal (7 Días)' },
                { id: 'annual', label: `Anual (${currentYear})` },
                { id: 'all', label: 'Histórico Total' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setReportPeriod(p.id as any)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    reportPeriod === p.id
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
            >
              <option value="all">Todas las Ventas & Servicios</option>
              <option value="services">Sólo Servicios (Copias, Redacción, Zumos)</option>
              <option value="orders">Sólo Pedidos de Papelería</option>
            </select>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Ingresos ({reportPeriod})</span>
            <p className="text-2xl font-black text-white font-['Outfit']">{formatXAF(totalRevenue)}</p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{filteredList.length} operaciones registradas</span>
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Venta Media por Cliente</span>
            <p className="text-2xl font-black text-amber-400 font-['Outfit']">{formatXAF(avgTicket)}</p>
            <p className="text-[11px] text-slate-400">Promedio por comprobante</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Servicios & Copistería</span>
            <p className="text-2xl font-black text-red-400 font-['Outfit']">{formatXAF(servicesRevenue)}</p>
            <p className="text-[11px] text-slate-400">Copias, Redacción, Impresiones & Zumos</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Artículos & Material Escolar</span>
            <p className="text-2xl font-black text-emerald-400 font-['Outfit']">{formatXAF(ordersRevenue)}</p>
            <p className="text-[11px] text-slate-400">Pedidos de papelería física</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'history' ? (
        /* History & CRUD Table */
        <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
            <h3 className="font-black text-sm text-white font-['Outfit'] flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-400" />
              <span>Registros en Base de Datos ({filteredList.length})</span>
            </h3>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, cliente o teléfono..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-red-500 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Código</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Cliente / Teléfono</th>
                  <th className="pb-3">Conceptos</th>
                  <th className="pb-3">Método</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3 text-right">Acciones BD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No hay registros de ventas que coincidan con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-red-400">{item.code}</td>
                      <td className="py-3">
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                            item.record_type === 'service'
                              ? 'bg-red-950/60 text-red-300 border-red-800'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {item.record_type === 'service' ? 'Servicios / POS' : 'Pedido Web'}
                        </span>
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-white">{item.customer_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{item.customer_phone}</p>
                      </td>
                      <td className="py-3 text-slate-300">
                        {item.items.length} {item.items.length === 1 ? 'concepto' : 'conceptos'}
                      </td>
                      <td className="py-3 capitalize text-slate-300">{item.payment_method}</td>
                      <td className="py-3 font-black text-white font-['Outfit'] text-sm">
                        {formatXAF(item.total)}
                      </td>
                      <td className="py-3 text-slate-400 text-[11px]">{formatDate(item.created_at)}</td>
                      <td className="py-3 text-right space-x-1.5 shrink-0">
                        {/* Print Invoice Button */}
                        <button
                          onClick={() => onOpenInvoiceModal(item.raw)}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
                          title="Ver / Imprimir Factura PRO"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-white transition-colors cursor-pointer"
                          title="Editar Venta en Base de Datos"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteSale(item)}
                          className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                          title="Eliminar de la Base de Datos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Printable Report View */
        <div
          id="bikie-printable-sales-report"
          className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 space-y-6 shadow-2xl border border-slate-200 font-sans"
        >
          {/* Official Report Header */}
          <div className="flex items-start justify-between border-b-2 border-red-600 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xl font-['Outfit']">
                  B
                </div>
                <div>
                  <h1 className="text-2xl font-black font-['Outfit'] text-slate-950">
                    <span className="text-red-600">B</span>IKIE<span className="text-red-600">.</span>
                  </h1>
                  <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">
                    Papelería · Librería · Copistería & Servicios
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {settings.address || 'Malabo, Guinea Ecuatorial'} · Tel: {settings.phone}
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-black uppercase px-3 py-1 rounded-md inline-block">
                INFORME EJECUTIVO DE VENTAS
              </span>
              <p className="text-sm font-bold text-slate-900">
                Período: {reportPeriod === 'daily' ? 'Diario' : reportPeriod === 'weekly' ? 'Semanal' : 'Anual'}
              </p>
              <p className="text-xs text-slate-500">Fecha Emisión: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Report Financial Highlights */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Facturación Total</p>
              <p className="text-xl font-black text-red-600 font-['Outfit'] mt-1">{formatXAF(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Nº Operaciones</p>
              <p className="text-xl font-black text-slate-900 font-['Outfit'] mt-1">{filteredList.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Ticket Promedio</p>
              <p className="text-xl font-black text-slate-900 font-['Outfit'] mt-1">{formatXAF(avgTicket)}</p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-2">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2">Código</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Método</th>
                  <th className="py-2 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => (
                  <tr key={item.id} className="py-2">
                    <td className="py-2 font-mono font-bold text-slate-700">{item.code}</td>
                    <td className="py-2 text-slate-600 capitalize">
                      {item.record_type === 'service' ? 'Servicios / Copias' : 'Papelería'}
                    </td>
                    <td className="py-2 font-semibold text-slate-900">{item.customer_name}</td>
                    <td className="py-2 text-slate-600 capitalize">{item.payment_method}</td>
                    <td className="py-2 text-right font-black text-slate-950 font-['Outfit']">
                      {formatXAF(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Report Footer & Signatures */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
            <div>
              <p className="font-bold text-slate-700">BIKIE Papelería & Copistería</p>
              <p className="text-[11px]">Sistema de Gestión Integral · Base de Datos Sincronizada</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-slate-300 pb-1 mb-1 font-bold text-slate-700">
                Tía Administradora (BIKIE)
              </div>
              <p className="text-[10px]">Firma & Sello de Conformidad</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT SALE MODAL                                                */}
      {/* ============================================================== */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white font-['Outfit'] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Modificar Venta #{editingItem.code} en BD</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedSale} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Teléfono de Contacto</label>
                <input
                  type="tel"
                  required
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monto Total (XAF)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editTotal}
                    onChange={(e) => setEditTotal(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Forma de Pago</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                    <option value="store">En Tienda</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Modificaciones realizadas..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-md"
                >
                  Guardar Cambios en BD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
