import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Heart,
  Search,
  Filter,
  Package,
  BookOpen,
  Truck,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Shield,
  ArrowRight,
  User,
  SlidersHorizontal,
  ChevronDown,
  Layers,
} from 'lucide-react';
import {
  Product,
  Category,
  Order,
  Offer,
  Coupon,
  Supplier,
  UserProfile,
  StoreSettings,
  SchoolList,
  SchoolPack,
  AiScanRecord,
} from './types';
import { storageService } from './lib/storage';
import { api } from './lib/api';
import { subscribeToSupabaseRealtime } from './lib/supabase';
import { formatXAF } from './utils/formatters';

// Components
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { AiListScannerModal } from './components/AiListScannerModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutView } from './components/CheckoutView';
import { OrderTrackingView } from './components/OrderTrackingView';
import { SchoolListsView } from './components/SchoolListsView';
import { CustomerAccountView } from './components/CustomerAccountView';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginModal } from './components/LoginModal';
import { ClientOffersBanner } from './components/ClientOffersBanner';
import { LegalModal, LegalDocType } from './components/LegalModal';
import { CookieBanner } from './components/CookieBanner';

const DEFAULT_GUEST_USER: UserProfile = {
  id: 'guest-customer',
  email: 'cliente@bikie.gq',
  name: 'Cliente Invitado',
  phone: '',
  role: 'customer',
  points: 0,
  created_at: new Date().toISOString(),
};

export default function App() {
  // App Data State (loaded from storageService & synchronized with Database)
  const [settings, setSettings] = useState<StoreSettings>(storageService.getSettings());
  const [products, setProducts] = useState<Product[]>(storageService.getProducts());
  const [categories, setCategories] = useState<Category[]>(storageService.getCategories());
  const [orders, setOrders] = useState<Order[]>(storageService.getOrders());
  const [offers, setOffers] = useState<Offer[]>(storageService.getOffers());
  const [coupons, setCoupons] = useState<Coupon[]>(storageService.getCoupons());
  const [suppliers, setSuppliers] = useState<Supplier[]>(storageService.getSuppliers());
  const [schoolLists, setSchoolLists] = useState<SchoolList[]>(storageService.getSchoolLists());
  const [schoolPacks, setSchoolPacks] = useState<SchoolPack[]>(storageService.getSchoolPacks());
  const [users, setUsers] = useState<UserProfile[]>(storageService.getUsers());
  const [aiScans, setAiScans] = useState<AiScanRecord[]>(storageService.getAiScans());

  // Real database initialization and live real-time sync
  useEffect(() => {
    const refreshStateFromDb = () => {
      storageService.syncWithDatabase().then((dbData) => {
        if (dbData) {
          if (dbData.settings) setSettings(dbData.settings);
          if (dbData.categories && dbData.categories.length > 0) setCategories(dbData.categories);
          if (dbData.products && dbData.products.length > 0) setProducts(dbData.products);
          if (dbData.orders) setOrders(dbData.orders);
          if (dbData.offers) setOffers(dbData.offers);
          if (dbData.coupons) setCoupons(dbData.coupons);
          if (dbData.school_packs) setSchoolPacks(dbData.school_packs);
          if (dbData.school_lists) setSchoolLists(dbData.school_lists);
          if (dbData.suppliers) setSuppliers(dbData.suppliers);
          if (dbData.users && dbData.users.length > 0) setUsers(dbData.users);
          if (dbData.ai_scans) setAiScans(dbData.ai_scans);
        }
      }).catch(console.error);
    };

    // Initial load
    refreshStateFromDb();

    // Subscribe to Server-Sent Events (SSE) and Supabase Postgres Realtime for instant live DB updates across devices
    const unsubscribeSse = api.subscribeToRealtime((event) => {
      console.log('Real-time database SSE event received:', event.type);
      refreshStateFromDb();
    });

    const unsubscribeSupabase = subscribeToSupabaseRealtime(
      ['orders', 'products', 'categories', 'offers', 'coupons', 'school_packs', 'school_lists', 'profiles', 'store_settings', 'sales', 'inventory_movements'],
      (payload) => {
        console.log('⚡ Direct Supabase Realtime event:', payload.table, payload.eventType);
        refreshStateFromDb();
      }
    );

    return () => {
      unsubscribeSse();
      unsubscribeSupabase();
    };
  }, []);

  // User State (Restored from secure sessionStorage if unexpired, else guest)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => storageService.getCurrentUser());

  // Active View State
  const [currentView, setCurrentView] = useState<
    'catalog' | 'school_lists' | 'tracking' | 'account' | 'checkout' | 'admin'
  >('catalog');

  // Strict session expiration checker (30-minute security timeout)
  useEffect(() => {
    const sessionCheckInterval = setInterval(() => {
      if (currentUser.id !== DEFAULT_GUEST_USER.id) {
        const validatedUser = storageService.getCurrentUser();
        if (validatedUser.id === DEFAULT_GUEST_USER.id) {
          setCurrentUser(DEFAULT_GUEST_USER);
          if (currentView === 'admin') {
            setCurrentView('catalog');
          }
          showToast('🔒 La sesión de administración ha expirado por seguridad (30 min).');
        }
      }
    }, 15000);

    return () => clearInterval(sessionCheckInterval);
  }, [currentUser, currentView]);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [priceSort, setPriceSort] = useState<'featured' | 'low_high' | 'high_low'>('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Cart State: { product: Product, quantity: number }[]
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [favorites, setFavorites] = useState<string[]>(['prod-01', 'prod-04']);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [usePoints, setUsePoints] = useState(false);

  const handleApplyCoupon = (code: string) => {
    const found = coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase() && c.is_active);
    if (!found) {
      return { success: false, message: 'Cupón no válido o vencido' };
    }
    setAppliedCoupon(found);
    return { success: true, message: `Cupón ${found.code} aplicado con éxito` };
  };

  // Modals and Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [legalModalType, setLegalModalType] = useState<LegalDocType | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleLogoutToGuest = () => {
    storageService.clearAdminSession();
    setCurrentUser(DEFAULT_GUEST_USER);
    if (currentView === 'admin') {
      setCurrentView('catalog');
    }
    showToast('Modo Cliente activado. Puedes comprar sin necesidad de registro.');
  };

  const handleLoginSuccess = (user: UserProfile) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
    showToast(`✓ Sesión iniciada: ${user.name} (${user.role})`);
    if (user.role === 'admin') {
      setCurrentView('admin');
    }
  };

  // Refresh all state from storageService
  const refreshData = () => {
    setProducts(storageService.getProducts());
    setCategories(storageService.getCategories());
    setOrders(storageService.getOrders());
    setOffers(storageService.getOffers());
    setCoupons(storageService.getCoupons());
    setSuppliers(storageService.getSuppliers());
    setSchoolLists(storageService.getSchoolLists());
    setSchoolPacks(storageService.getSchoolPacks());
    setSettings(storageService.getSettings());
    setUsers(storageService.getUsers());
    setAiScans(storageService.getAiScans());
  };

  // Switch User Role
  const handleSwitchUserRole = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      showToast(`Cambiado a perfil: ${found.name} (${found.role})`);
    }
  };

  // Add single product to cart
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) {
      showToast(`⚠️ "${product.name}" está agotado actualmente`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
      }
    });

    showToast(`✓ Añadido: ${quantity}x ${product.name}`);
  };

  // Add multiple items to cart (e.g. from School Pack, School List, or AI Scanner)
  const handleAddMultipleToCart = (itemsToAdd: { product: Product; quantity: number }[]) => {
    setCart((prev) => {
      let newCart = [...prev];
      for (const item of itemsToAdd) {
        const existingIdx = newCart.findIndex((c) => c.product.id === item.product.id);
        if (existingIdx >= 0) {
          const newQty = Math.min(
            item.product.stock,
            newCart[existingIdx].quantity + item.quantity
          );
          newCart[existingIdx] = { ...newCart[existingIdx], quantity: newQty };
        } else {
          newCart.push({ product: item.product, quantity: item.quantity });
        }
      }
      return newCart;
    });

    showToast(`🎉 ¡${itemsToAdd.length} artículos añadidos a tu carrito!`);
    setIsCartOpen(true);
  };

  // Update Item Quantity in Cart
  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Toggle Wishlist / Favorite
  const handleToggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Checkout Success
  const handleOrderSuccess = (order: Order) => {
    setCart([]);
    refreshData();
    setInvoiceOrder(order);
    setCurrentView('tracking');
    showToast(`🎉 ¡Pedido ${order.code} creado con éxito!`);
  };

  // Re-buy / Repeat an order
  const handleRepeatOrder = (order: Order) => {
    const itemsToAdd: { product: Product; quantity: number }[] = [];
    for (const it of order.items) {
      const prod = products.find((p) => p.id === it.product_id);
      if (prod && prod.stock > 0) {
        itemsToAdd.push({
          product: prod,
          quantity: Math.min(prod.stock, it.quantity),
        });
      }
    }
    if (itemsToAdd.length > 0) {
      handleAddMultipleToCart(itemsToAdd);
    } else {
      showToast('Los productos de este pedido ya no tienen existencias');
    }
  };

  // Re-buy AI Scan List
  const handleRebuyScanList = (scan: AiScanRecord) => {
    const matchedProducts = products.filter((p) =>
      scan.raw_text.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
    );
    if (matchedProducts.length > 0) {
      handleAddMultipleToCart(
        matchedProducts.map((p) => ({ product: p, quantity: 1 }))
      );
    } else {
      handleAddMultipleToCart(products.slice(0, 4).map((p) => ({ product: p, quantity: 1 })));
    }
  };

  // Filter Catalog Products
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);

  const filteredProducts = products.filter((p) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchCat = p.category_name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchCat && !matchSku) return false;
    }

    // Category
    if (selectedCategory !== 'all') {
      if (p.category_id !== selectedCategory && p.category_name !== selectedCategory) {
        return false;
      }
    }

    // Brand
    if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
      return false;
    }

    // In Stock
    if (onlyInStock && p.stock <= 0) {
      return false;
    }

    return true;
  });

  // Sort Catalog Products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (priceSort === 'low_high') {
      return a.sale_price - b.sale_price;
    }
    if (priceSort === 'high_low') {
      return b.sale_price - a.sale_price;
    }
    // Featured first
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  // IF ADMIN VIEW IS ACTIVE, RENDER FULL BACKOFFICE
  if (currentView === 'admin') {
    return (
      <AdminDashboard
        currentUser={currentUser}
        settings={settings}
        onSaveSettings={(s) => setSettings(s)}
        products={products}
        categories={categories}
        orders={orders}
        offers={offers}
        coupons={coupons}
        suppliers={suppliers}
        users={users}
        onRefreshData={refreshData}
        onCloseAdmin={() => setCurrentView('catalog')}
        onOpenInvoiceModal={(order) => setInvoiceOrder(order)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafc] text-slate-900 font-sans selection:bg-red-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-70 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-red-500/40 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        cartItemCount={cartTotalItems}
        favoritesCount={favorites.length}
        currentUser={currentUser}
        allUsers={users}
        onSwitchUserRole={handleSwitchUserRole}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAiScanner={() => setIsScannerOpen(true)}
        onOpenAiAssistant={() => setIsAssistantOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogoutToGuest={handleLogoutToGuest}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
      />

      {/* VIEW: CHECKOUT */}
      {currentView === 'checkout' && (
        <main className="flex-1">
          <CheckoutView
            items={cart}
            appliedCoupon={appliedCoupon}
            usePoints={usePoints}
            currentUser={currentUser}
            settings={settings}
            offers={offers}
            onBackToStore={() => setCurrentView('catalog')}
            onOrderCompleted={handleOrderSuccess}
          />
        </main>
      )}

      {/* VIEW: ORDER TRACKING */}
      {currentView === 'tracking' && (
        <main className="flex-1">
          <OrderTrackingView
            orders={orders}
            settings={settings}
            onOpenInvoiceModal={(ord) => setInvoiceOrder(ord)}
          />
        </main>
      )}

      {/* VIEW: SCHOOL LISTS & PACKS */}
      {currentView === 'school_lists' && (
        <main className="flex-1">
          <SchoolListsView
            schoolLists={schoolLists}
            schoolPacks={schoolPacks}
            catalog={products}
            onAddItemsToCart={handleAddMultipleToCart}
            onOpenAiScanner={() => setIsScannerOpen(true)}
          />
        </main>
      )}

      {/* VIEW: CUSTOMER ACCOUNT */}
      {currentView === 'account' && (
        <main className="flex-1">
          <CustomerAccountView
            currentUser={currentUser}
            orders={orders}
            favoriteProducts={favoriteProducts}
            aiScans={aiScans}
            catalog={products}
            onRepeatOrder={handleRepeatOrder}
            onRebuyScanList={handleRebuyScanList}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCart}
            onOpenInvoiceModal={(ord) => setInvoiceOrder(ord)}
          />
        </main>
      )}

      {/* VIEW: MAIN STORE & CATALOG */}
      {currentView === 'catalog' && (
        <main className="flex-1 space-y-10 pb-16">
          {/* Hero Banner with AI Scanner Button */}
          <HeroBanner
            onOpenScanner={() => setIsScannerOpen(true)}
            onExploreCatalog={() => {
              const el = document.getElementById('bikie-catalog-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Quick Value Propositions Bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 font-['Outfit']">Escaneo Inteligente IA</h4>
                  <p className="text-[11px] text-slate-500">Foto a tu lista y carrito listo</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 font-['Outfit']">Entrega en Malabo</h4>
                  <p className="text-[11px] text-slate-500">A domicilio o recogida en tienda</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 font-['Outfit']">Packs Escolares</h4>
                  <p className="text-[11px] text-slate-500">Lotes completos con descuento</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 font-['Outfit']">Soporte por WhatsApp</h4>
                  <p className="text-[11px] text-slate-500">Atención personalizada directa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Catalog Section */}
          <section id="bikie-catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Catalog Top Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                  Catálogo BIKIE
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit'] mt-1">
                  Explora Material Escolar & de Oficina
                </h2>
                <p className="text-xs text-slate-500">
                  Mostrando {sortedProducts.length} de {products.length} productos disponibles
                </p>
              </div>

              {/* Sorting & Filter Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={priceSort}
                    onChange={(e) => setPriceSort(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="featured">Destacados BIKIE</option>
                    <option value="low_high">Precio: Menor a Mayor</option>
                    <option value="high_low">Precio: Mayor a Menor</option>
                  </select>
                </div>

                <label className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="accent-red-600 rounded-sm"
                  />
                  <span>Sólo en stock</span>
                </label>
              </div>
            </div>

            {/* Categories Carousel */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-red-300'
                }`}
              >
                Todas las Categorías
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-red-300'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Brand Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 font-bold mr-1 shrink-0">Marcas:</span>
              <button
                onClick={() => setSelectedBrand('all')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedBrand === 'all'
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'text-slate-500 hover:text-red-600'
                }`}
              >
                Todas
              </button>
              {uniqueBrands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedBrand === b
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'text-slate-500 hover:text-red-600'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            {sortedProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  No se encontraron productos con estos filtros
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Prueba cambiando el término de búsqueda o selecciona otra categoría.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                    setOnlyInStock(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
                >
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sortedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    isFavorite={favorites.includes(p.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToCart={handleAddToCart}
                    onOpenDetails={(prod) => setSelectedProduct(prod)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {/* Floating AI Assistant Trigger Button */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-red-600 hover:bg-red-700 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl flex items-center gap-2 font-black text-xs transition-all active:scale-95 border border-red-400/30 group cursor-pointer"
      >
        <Sparkles className="w-5 h-5 text-white animate-spin-slow group-hover:rotate-45 transition-transform" />
        <span className="hidden sm:inline font-['Outfit']">Asistente BIKIE IA</span>
      </button>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black font-['Outfit'] shadow-md text-xl">
                  B
                </div>
                <span className="text-2xl font-black font-['Outfit'] tracking-tight">
                  <span className="text-red-600">B</span><span className="text-white">IKIE</span><span className="text-red-600">.</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                {settings.slogan || 'Todo lo que necesitas para estudiar, trabajar y crear.'} Innovación en papelería con escaneo inteligente de listas escolares mediante IA y entrega directa en Malabo, Guinea Ecuatorial.
              </p>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Paraiso, cerca de banje, malabo, guinea ecuatorial</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Atención al Cliente: <strong>222213126</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3 text-xs">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px]">
                Navegación
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button
                    onClick={() => setCurrentView('catalog')}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Catálogo de Productos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('school_lists')}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Listas Escolares Oficiales
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Escanear Lista con IA</span>
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('tracking')}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Rastrear mi Pedido
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact / WhatsApp */}
            <div className="space-y-3 text-xs">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px]">
                Contacto & WhatsApp
              </h4>
              <p className="text-slate-400">
                Horario: {settings.opening_hours || 'Lunes a Sábado: 8:00 - 19:30'}
              </p>
              <div className="text-slate-300">
                <p className="font-semibold text-slate-200">Teléfono: 222213126</p>
              </div>
              <a
                href="https://wa.me/240222213126"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Escríbenos al WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Bottom copyright and legal */}
          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <p>© {new Date().getFullYear()} BIKIE Papelería — Malabo, Guinea Ecuatorial.</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <button
                  onClick={() => setLegalModalType('privacy')}
                  className="hover:text-red-400 underline transition-colors cursor-pointer"
                >
                  Privacidad
                </button>
                <span>·</span>
                <button
                  onClick={() => setLegalModalType('terms')}
                  className="hover:text-red-400 underline transition-colors cursor-pointer"
                >
                  Términos
                </button>
                <span>·</span>
                <button
                  onClick={() => setLegalModalType('cookies')}
                  className="hover:text-red-400 underline transition-colors cursor-pointer"
                >
                  Cookies
                </button>
                <span>·</span>
                <button
                  onClick={() => setLegalModalType('shipping')}
                  className="hover:text-red-400 underline transition-colors cursor-pointer"
                >
                  Envíos
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span>Moneda: <strong>Franco CFA (XAF)</strong></span>
              <span>·</span>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-slate-400 hover:text-red-400 font-medium underline cursor-pointer"
              >
                Acceso Privado (Admin)
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* FLOATING BOTTOM CART BAR (Adapta el carrito para que sea flotante y abajo) */}
      {cart.length > 0 && currentView !== 'admin' && currentView !== 'checkout' && !isCartOpen && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-xl animate-in slide-in-from-bottom duration-200">
          <div className="bg-slate-950/95 text-white p-3 sm:p-4 rounded-3xl border border-red-600/40 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-red-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-300 font-medium truncate">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} producto(s) en tu carrito
                </p>
                <p className="text-sm sm:text-base font-black text-white font-['Outfit'] truncate">
                  Total: <span className="text-red-400">{formatXAF(cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0))}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Ver Carrito / Factura</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWERS & MODALS */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        items={cart}
        offers={offers}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={() => setCart([])}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setCurrentView('checkout');
        }}
        coupons={coupons}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={() => setAppliedCoupon(null)}
        usePoints={usePoints}
        onToggleUsePoints={setUsePoints}
        currentUser={currentUser}
        settings={settings}
      />

      <AiListScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        catalog={products}
        onAddItemsToCart={handleAddMultipleToCart}
        settings={settings}
      />

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <AiAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        catalog={products}
        onAddToCart={handleAddToCart}
      />

      <InvoicePrintModal
        order={invoiceOrder}
        settings={settings}
        onClose={() => setInvoiceOrder(null)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogoutToGuest={handleLogoutToGuest}
      />

      {legalModalType && (
        <LegalModal
          isOpen={true}
          type={legalModalType}
          settings={settings}
          onClose={() => setLegalModalType(null)}
        />
      )}

      <CookieBanner
        onOpenLegal={(type) => setLegalModalType(type)}
      />
    </div>
  );
}
