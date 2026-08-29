import React, { useState } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Tag,
  User,
  CreditCard,
  FileText,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Building,
  Truck,
  Wrench,
  Receipt,
  Download,
  Printer,
  PieChart,
} from 'lucide-react';
import { Expense, StoreSettings, UserProfile } from '../types';
import { formatXAF, formatDate } from '../utils/formatters';
import { storageService } from '../lib/storage';

interface ExpensesManagerProps {
  expenses: Expense[];
  settings: StoreSettings;
  currentUser: UserProfile;
  onRefreshData: () => void;
}

const EXPENSE_CATEGORIES = [
  { id: 'all', label: 'Todos los Gastos' },
  { id: 'rent', label: 'Alquiler Local', icon: Building, color: 'text-amber-400 bg-amber-950/60 border-amber-800' },
  { id: 'utilities', label: 'Luz, Agua & Servicios', icon: Wrench, color: 'text-sky-400 bg-sky-950/60 border-sky-800' },
  { id: 'supplies', label: 'Mercancía & Insumos', icon: Tag, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' },
  { id: 'salaries', label: 'Nóminas & Personal', icon: User, color: 'text-purple-400 bg-purple-950/60 border-purple-800' },
  { id: 'transport', label: 'Transporte & Envíos', icon: Truck, color: 'text-orange-400 bg-orange-950/60 border-orange-800' },
  { id: 'maintenance', label: 'Mantenimiento', icon: Wrench, color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800' },
  { id: 'taxes', label: 'Impuestos & Tasas', icon: Receipt, color: 'text-rose-400 bg-rose-950/60 border-rose-800' },
  { id: 'other', label: 'Otros Gastos', icon: FileText, color: 'text-slate-400 bg-slate-800 border-slate-700' },
];

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({
  expenses,
  settings,
  currentUser,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form state
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState<Expense['category']>('supplies');
  const [amount, setAmount] = useState<number>(10000);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [beneficiary, setBeneficiary] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'other'>('cash');
  const [notes, setNotes] = useState('');

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const totalAllExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const thisMonthExpenses = expenses
    .filter((e) => e.date && e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const todayExpenses = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Filtering
  const filteredExpenses = expenses.filter((e) => {
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesSearch =
      e.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.beneficiary && e.beneficiary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setConcept('');
    setCategory('supplies');
    setAmount(10000);
    setDate(new Date().toISOString().split('T')[0]);
    setBeneficiary('');
    setPaymentMethod('cash');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setConcept(exp.concept);
    setCategory(exp.category);
    setAmount(exp.amount);
    setDate(exp.date);
    setBeneficiary(exp.beneficiary || '');
    setPaymentMethod((exp.payment_method as any) || 'cash');
    setNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = (exp: Expense) => {
    if (!confirm(`¿Estás segura de eliminar el gasto "${exp.concept}" por ${formatXAF(exp.amount)}?`)) return;
    storageService.deleteExpense(exp.id);
    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `Eliminó gasto: ${exp.concept} (${formatXAF(exp.amount)})`,
      entity: 'expense',
      entity_id: exp.id,
    });
    onRefreshData();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || amount <= 0) return;

    if (editingExpense) {
      storageService.updateExpense(editingExpense.id, {
        concept: concept.trim(),
        category,
        amount: Number(amount),
        date,
        beneficiary: beneficiary.trim() || undefined,
        payment_method: paymentMethod as any,
        notes: notes.trim() || undefined,
      });

      storageService.addActivityLog({
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: `Actualizó gasto: ${concept} (${formatXAF(amount)})`,
        entity: 'expense',
        entity_id: editingExpense.id,
      });
    } else {
      const newExp = storageService.addExpense({
        concept: concept.trim(),
        category,
        amount: Number(amount),
        date,
        beneficiary: beneficiary.trim() || undefined,
        payment_method: paymentMethod as any,
        registered_by: currentUser.name,
        notes: notes.trim() || undefined,
      });

      storageService.addActivityLog({
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: `Registró nuevo gasto: ${concept} (${formatXAF(amount)})`,
        entity: 'expense',
        entity_id: newExp.id,
      });
    }

    setIsModalOpen(false);
    onRefreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Control Financiero & Operativo
            </span>
            <span className="text-slate-400 font-bold text-xs bg-slate-800 px-2 py-0.5 rounded-full">
              {expenses.length} Gastos Registrados
            </span>
          </div>
          <h2 className="text-2xl font-black font-['Outfit'] text-white mt-1">
            Gestión de Gastos & Salidas de Caja
          </h2>
          <p className="text-xs text-slate-400">
            Registra y controla los gastos diarios de BIKIE (alquiler, luz, agua, suministros, nóminas y otros pagos).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Gasto</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Gastos Totales</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black font-['Outfit'] text-rose-400">
            {formatXAF(totalAllExpenses)}
          </p>
          <p className="text-[11px] text-slate-400">Acumulado histórico en el sistema</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Gastos Este Mes</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black font-['Outfit'] text-amber-300">
            {formatXAF(thisMonthExpenses)}
          </p>
          <p className="text-[11px] text-slate-400">Mes en curso</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Gastos de Hoy</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black font-['Outfit'] text-white">
            {formatXAF(todayExpenses)}
          </p>
          <p className="text-[11px] text-slate-400">{formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por concepto o beneficiario..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-hidden focus:border-red-500"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-3xl overflow-hidden shadow-xl">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <TrendingDown className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No hay gastos que coincidan con la búsqueda</h3>
            <p className="text-xs text-slate-400">Registra un nuevo gasto o cambia los filtros de categoría.</p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Gasto</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Concepto / Descripción</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Beneficiario</th>
                  <th className="py-3.5 px-4">Método</th>
                  <th className="py-3.5 px-4 text-right">Monto (XAF)</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredExpenses.map((exp) => {
                  const catConfig = EXPENSE_CATEGORIES.find((c) => c.id === exp.category) || {
                    label: exp.category,
                    color: 'text-slate-300 bg-slate-800 border-slate-700',
                  };

                  return (
                    <tr key={exp.id} className="hover:bg-slate-700/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white max-w-xs">
                        <p className="truncate">{exp.concept}</p>
                        {exp.notes && (
                          <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                            {exp.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${catConfig.color}`}
                        >
                          {catConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {exp.beneficiary || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 uppercase text-[10px] font-bold">
                        {exp.payment_method === 'cash'
                          ? 'Efectivo / Caja'
                          : exp.payment_method === 'transfer'
                          ? 'Transferencia'
                          : exp.payment_method || 'Efectivo'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black font-mono text-sm text-rose-400 whitespace-nowrap">
                        {formatXAF(exp.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* EXPENSE CREATE / EDIT MODAL                                    */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white font-['Outfit'] flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-500" />
                {editingExpense ? 'Editar Gasto' : 'Registrar Salida de Gasto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Concepto del Gasto</label>
                <input
                  type="text"
                  required
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej. Pago de Electricidad SEGESA / Compra insumos zumos..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                  >
                    <option value="supplies">Mercancía & Insumos</option>
                    <option value="rent">Alquiler Local</option>
                    <option value="utilities">Luz, Agua & Servicios</option>
                    <option value="salaries">Nóminas & Personal</option>
                    <option value="transport">Transporte & Envíos</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="taxes">Impuestos & Tasas</option>
                    <option value="other">Otros Gastos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monto (XAF / FCFA)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold focus:border-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                  >
                    <option value="cash">Efectivo / Caja</option>
                    <option value="transfer">Transferencia Bancaria</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Beneficiario / Proveedor (Opcional)</label>
                <input
                  type="text"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  placeholder="Ej. SEGESA / Propietario Local / Mercado Central..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles adicionales del comprobante o factura..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-md shadow-red-950"
                >
                  {editingExpense ? 'Guardar Cambios' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
