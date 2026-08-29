import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Calendar,
  Percent,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Clock,
  Package,
  Layers,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { Offer, Product, Category, UserProfile } from '../types';
import { formatXAF, formatDate } from '../utils/formatters';
import { storageService } from '../lib/storage';

interface OffersManagerProps {
  offers: Offer[];
  products: Product[];
  categories: Category[];
  currentUser: UserProfile;
  onRefreshData: () => void;
}

export const OffersManager: React.FC<OffersManagerProps> = ({
  offers,
  products,
  categories,
  currentUser,
  onRefreshData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [type, setType] = useState<Offer['type']>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<Offer['status']>('active');

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setName('');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80');
    setType('percentage');
    setDiscountValue(20);
    setSelectedProductIds([]);
    setSelectedCategoryIds([]);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setName(offer.name);
    setDescription(offer.description);
    setImage(offer.image || '');
    setType(offer.type);
    setDiscountValue(offer.discount_value);
    setSelectedProductIds(offer.product_ids || []);
    setSelectedCategoryIds(offer.category_ids || []);
    setStartDate(offer.start_date ? offer.start_date.split('T')[0] : '');
    setEndDate(offer.end_date ? offer.end_date.split('T')[0] : '');
    setStatus(offer.status);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (offer: Offer) => {
    const newStatus = offer.status === 'active' ? 'paused' : 'active';
    await storageService.updateOffer(offer.id, { status: newStatus });
    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `${newStatus === 'active' ? 'Activó' : 'Pausó'} la oferta: ${offer.name}`,
      entity: 'offer',
      entity_id: offer.id,
      details: `Estado: ${newStatus}`,
    });
    onRefreshData();
  };

  const handleDelete = async (offer: Offer) => {
    if (!confirm(`¿Eliminar la oferta "${offer.name}" de la base de datos?`)) return;
    await storageService.deleteOffer(offer.id);
    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `Eliminó la oferta: ${offer.name} de la Base de Datos`,
      entity: 'offer',
      entity_id: offer.id,
      details: `ID: ${offer.id}`,
    });
    onRefreshData();
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const offerData: Partial<Offer> = {
      name: name.trim(),
      description: description.trim(),
      image: image.trim() || undefined,
      type,
      discount_value: discountValue,
      product_ids: selectedProductIds,
      category_ids: selectedCategoryIds,
      start_date: startDate,
      end_date: endDate,
      status,
    };

    if (editingOffer) {
      await storageService.updateOffer(editingOffer.id, offerData);
      storageService.addActivityLog({
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: `Actualizó oferta: ${name} en BD`,
        entity: 'offer',
        entity_id: editingOffer.id,
        details: `Descuento: ${discountValue}`,
      });
    } else {
      const newId = `off-${Date.now()}`;
      await storageService.createOffer({
        ...offerData,
        id: newId,
      } as Offer);
      storageService.addActivityLog({
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: `Creó nueva oferta: ${name} en BD`,
        entity: 'offer',
        entity_id: newId,
        details: `Tipo: ${type}, Valor: ${discountValue}`,
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
            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-950/80 px-2.5 py-0.5 rounded-full border border-yellow-800">
              Campañas & Promociones
            </span>
            <span className="text-emerald-400 font-bold text-xs bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Sincronizado con Tienda de Clientes
            </span>
          </div>
          <h2 className="text-2xl font-black font-['Outfit'] text-white mt-1">
            Gestión de Ofertas & Descuentos Especiales
          </h2>
          <p className="text-xs text-slate-400">
            Crea promociones y ofertas (porcentajes, 2x1, packs escolares) que se mostrarán automáticamente a los clientes.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nueva Oferta</span>
        </button>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {offers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-800/40 rounded-3xl border border-slate-700 space-y-3">
            <Sparkles className="w-10 h-10 text-yellow-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">No hay ofertas configuradas</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Crea tu primera promoción escolar o descuento especial para atraer más clientes a BIKIE.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Oferta Ahora</span>
            </button>
          </div>
        ) : (
          offers.map((offer) => {
            const isActive = offer.status === 'active';

            return (
              <div
                key={offer.id}
                className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 space-y-4 flex flex-col justify-between group hover:border-slate-600 transition-all shadow-xl"
              >
                <div className="space-y-3">
                  {/* Image or Banner */}
                  {offer.image && (
                    <div className="relative h-32 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700">
                      <img
                        src={offer.image}
                        alt={offer.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isActive ? 'Activa' : 'Pausada'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-black font-['Outfit'] text-white">{offer.name}</h3>
                      <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{offer.description}</p>
                    </div>

                    {!offer.image && (
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isActive ? 'Activa' : 'Pausada'}
                      </span>
                    )}
                  </div>

                  {/* Badge details */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/60 text-xs">
                    <span className="bg-red-950/80 text-red-300 border border-red-800 font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <Percent className="w-3 h-3 text-red-400" />
                      {offer.type === 'percentage'
                        ? `-${offer.discount_value}% Descuento`
                        : offer.type === '2x1'
                        ? 'Promoción 2x1'
                        : offer.type === '3x2'
                        ? 'Promoción 3x2'
                        : `-${formatXAF(offer.discount_value)}`}
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Hasta {offer.end_date}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(offer)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-amber-950/80 text-amber-300 hover:bg-amber-900 border border-amber-800'
                        : 'bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-800'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Activar</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(offer)}
                      className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
                      title="Editar Oferta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(offer)}
                      className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors cursor-pointer"
                      title="Eliminar Oferta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* OFFER CREATE / EDIT MODAL                                      */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white font-['Outfit'] flex items-center gap-2">
                <Tag className="w-5 h-5 text-red-500" />
                {editingOffer ? 'Editar Oferta' : 'Crear Nueva Oferta Comercial'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Título de la Oferta</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. ¡Especial Vuelta al Cole: 20% en Mochilas y Cuadernos!"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Descripción / Condiciones</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Válido para compras en tienda y pedidos online..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tipo de Promoción</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="percentage">Porcentaje Descuento (%)</option>
                    <option value="fixed">Monto Fijo de Descuento (XAF)</option>
                    <option value="2x1">Lleva 2 Paga 1 (2x1)</option>
                    <option value="3x2">Lleva 3 Paga 2 (3x2)</option>
                    <option value="pack">Pack / Lote Especial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Valor del Descuento {type === 'percentage' ? '(%)' : '(XAF)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              {/* Product and Category Targeting */}
              <div className="space-y-3 p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                    <span>🎯 Producto(s) Específico(s) en Oferta (Opcional)</span>
                    <span className="text-[11px] font-semibold text-red-400">
                      {selectedProductIds.length} seleccionados
                    </span>
                  </label>
                  
                  {/* Select dropdown */}
                  <select
                    value={selectedProductIds[0] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setSelectedProductIds((prev) => (prev.includes(val) ? prev : [...prev, val]));
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                  >
                    <option value="">-- Añadir un producto específico a la oferta --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatXAF(p.sale_price)}) - SKU: {p.sku}
                      </option>
                    ))}
                  </select>

                  {/* Selected products chips */}
                  {selectedProductIds.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Productos incluidos en esta promoción:</span>
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds([])}
                          className="text-red-400 hover:underline cursor-pointer"
                        >
                          Quitar todos
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProductIds.map((pId) => {
                          const prod = products.find((p) => p.id === pId);
                          if (!prod) return null;
                          return (
                            <span
                              key={pId}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold"
                            >
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                              />
                              <span className="truncate max-w-[150px]">{prod.name}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedProductIds((prev) => prev.filter((id) => id !== pId))}
                                className="text-red-400 hover:text-white cursor-pointer ml-0.5"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    🏷️ O Aplicar a una Categoría Completa
                  </label>
                  <select
                    value={selectedCategoryIds[0] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setSelectedCategoryIds([val]);
                      } else {
                        setSelectedCategoryIds([]);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:border-red-500 focus:outline-hidden"
                  >
                    <option value="">-- Toda la tienda (Sin categoría fija) --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">URL Imagen Publicitaria / Banner</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Fecha de Finalización</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="active">🟢 Activa (Visible en tienda)</option>
                  <option value="paused">⏸️ Pausada (Oculta y suspendida)</option>
                </select>
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
                  Guardar Oferta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
