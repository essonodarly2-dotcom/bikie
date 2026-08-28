import React, { useState } from 'react';
import {
  User,
  ShoppingBag,
  Heart,
  Camera,
  RotateCcw,
  Sparkles,
  Package,
  Calendar,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile, Order, Product, AiScanRecord } from '../types';
import { formatXAF, formatDate, getOrderStatusLabel } from '../utils/formatters';

interface CustomerAccountViewProps {
  currentUser: UserProfile;
  orders: Order[];
  favoriteProducts: Product[];
  aiScans: AiScanRecord[];
  catalog: Product[];
  onRepeatOrder: (order: Order) => void;
  onRebuyScanList: (scan: AiScanRecord) => void;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onOpenInvoiceModal: (order: Order) => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({
  currentUser,
  orders,
  favoriteProducts,
  aiScans,
  catalog,
  onRepeatOrder,
  onRebuyScanList,
  onToggleFavorite,
  onAddToCart,
  onOpenInvoiceModal,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'scans' | 'favorites'>('orders');

  const customerOrders = orders.filter(
    (o) => o.customer_id === currentUser.id || o.customer_email === currentUser.email
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-150">
      {/* Profile Overview Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0 font-['Outfit']">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-['Outfit']">{currentUser.name}</h1>
              <span className="bg-red-600/90 border border-red-400/40 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                Cliente BIKIE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{currentUser.email} · {currentUser.phone || '+240 555 777 888'}</p>
          </div>
        </div>

        {/* Loyalty Points Badge */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center sm:text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-300 block">Puntos BIKIE Acumulados</span>
          <div className="flex items-center justify-center sm:justify-end gap-1.5 mt-0.5">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-black font-['Outfit'] text-white">
              {currentUser.points} <span className="text-xs font-normal text-slate-300">pts</span>
            </span>
          </div>
          <p className="text-[10px] text-yellow-300 font-semibold mt-1">
            Equivalente a {formatXAF(currentUser.points * 5)} en descuentos
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex rounded-2xl bg-slate-100 p-1.5 text-xs sm:text-sm font-bold text-slate-600 max-w-lg">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-white text-red-600 shadow-xs font-extrabold'
              : 'hover:text-red-600'
          }`}
        >
          <Package className="w-4 h-4 text-red-600" />
          <span>Pedidos ({customerOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scans')}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'scans'
              ? 'bg-white text-red-600 shadow-xs font-extrabold'
              : 'hover:text-red-600'
          }`}
        >
          <Camera className="w-4 h-4 text-red-600" />
          <span>Listas IA ({aiScans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'favorites'
              ? 'bg-white text-red-600 shadow-xs font-extrabold'
              : 'hover:text-red-600'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Favoritos ({favoriteProducts.length})</span>
        </button>
      </div>

      {/* TAB 1: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {customerOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">Aún no has realizado pedidos</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Explora el catálogo o escanea tu lista de materiales para crear tu primer pedido en BIKIE.
              </p>
            </div>
          ) : (
            customerOrders.map((order) => {
              const statusBadge = getOrderStatusLabel(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900 font-['Outfit']">
                          {order.code}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(order.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => onOpenInvoiceModal(order)}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-600" />
                        <span>Recibo</span>
                      </button>

                      <button
                        onClick={() => onRepeatOrder(order)}
                        className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Repetir pedido</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Artículos ({order.items.length}):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between bg-slate-50 p-2 rounded-xl">
                          <span className="truncate">
                            {it.quantity}x {it.product_name}
                          </span>
                          <span className="font-bold text-slate-900 font-['Outfit']">{formatXAF(it.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Tipo: <strong>{order.delivery_type === 'pickup' ? 'Recogida en tienda' : 'Envío a domicilio'}</strong>
                    </span>
                    <span className="text-base font-black text-red-600 font-['Outfit']">
                      Total: {formatXAF(order.total)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: AI Scanned Lists History */}
      {activeTab === 'scans' && (
        <div className="space-y-4">
          {aiScans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
              <Camera className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No tienes listas escaneadas</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Toma una foto de tu lista escolar en cualquier momento para guardarla y volver a comprar cuando lo necesites.
              </p>
            </div>
          ) : (
            aiScans.map((scan) => (
              <div
                key={scan.id}
                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-sm font-black text-slate-900 font-['Outfit']">
                      Lista Escaneada con IA
                    </span>
                    <p className="text-xs text-slate-400">{formatDate(scan.created_at)}</p>
                  </div>

                  <button
                    onClick={() => onRebuyScanList(scan)}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Volver a comprar lista</span>
                  </button>
                </div>

                <div className="p-3 bg-red-50/40 rounded-2xl border border-red-100 space-y-2">
                  <p className="text-[11px] font-bold text-red-700 uppercase">
                    Texto detectado de la imagen ({scan.detected_items_count} artículos):
                  </p>
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono font-sans bg-white p-2.5 rounded-xl border border-red-100">
                    {scan.raw_text}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Saved Favorites */}
      {activeTab === 'favorites' && (
        <div>
          {favoriteProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
              <Heart className="w-12 h-12 text-rose-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No tienes productos en favoritos</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Marca tus productos favoritos en el catálogo con el icono de corazón para tenerlos a mano.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {favoriteProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-red-600">{p.brand}</span>
                      <p className="text-xs font-bold text-slate-900 line-clamp-2">{p.name}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-black text-red-600 font-['Outfit']">
                      {formatXAF(p.sale_price)}
                    </span>
                    <button
                      onClick={() => onAddToCart(p)}
                      disabled={p.stock <= 0}
                      className="p-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white cursor-pointer"
                      title="Añadir al carrito"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
