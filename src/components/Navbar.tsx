import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Heart,
  Search,
  Camera,
  ShieldCheck,
  Menu,
  X,
  Package,
  BookOpen,
  ChevronDown,
  Lock,
  Unlock,
  LogOut,
} from 'lucide-react';
import { UserProfile, CartItem, StoreSettings } from '../types';

interface NavbarProps {
  settings?: StoreSettings;
  currentUser: UserProfile;
  onSwitchUser?: (user: UserProfile) => void;
  onSwitchUserRole?: (userId: string) => void;
  availableUsers?: UserProfile[];
  allUsers?: UserProfile[];
  cartItems?: CartItem[];
  cartItemCount?: number;
  favoritesCount: number;
  onOpenCart: () => void;
  onOpenFavorites?: () => void;
  onOpenAiScanner: () => void;
  onOpenAiAssistant?: () => void;
  onOpenAdmin?: () => void;
  onOpenAccount?: () => void;
  onOpenTracking?: () => void;
  onOpenLoginModal?: () => void;
  onLogoutToGuest?: () => void;
  onNavigateHome?: () => void;
  onNavigateCatalog?: (categoryId?: string) => void;
  onNavigateOffers?: () => void;
  onNavigateSchoolLists?: () => void;
  onNavigate?: (view: any) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notificationsCount?: number;
  onOpenNotifications?: () => void;
  activeView?: string;
  currentView?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  currentUser,
  cartItems = [],
  cartItemCount,
  favoritesCount,
  onOpenCart,
  onOpenFavorites,
  onOpenAiScanner,
  onOpenAiAssistant,
  onOpenAdmin,
  onOpenAccount,
  onOpenTracking,
  onOpenLoginModal,
  onLogoutToGuest,
  onNavigateHome,
  onNavigateCatalog,
  onNavigateOffers,
  onNavigateSchoolLists,
  onNavigate,
  searchQuery,
  onSearchChange,
  activeView,
  currentView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const totalCartCount =
    cartItemCount !== undefined
      ? cartItemCount
      : cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const view = currentView || activeView || 'catalog';

  const navigateTo = (v: any) => {
    if (onNavigate) onNavigate(v);
    else if (v === 'catalog' && onNavigateCatalog) onNavigateCatalog();
    else if (v === 'school_lists' && onNavigateSchoolLists) onNavigateSchoolLists();
    else if (v === 'tracking' && onOpenTracking) onOpenTracking();
    else if (v === 'account' && onOpenAccount) onOpenAccount();
    else if (v === 'admin' && onOpenAdmin) onOpenAdmin();
  };

  const isStaff = currentUser.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Notice Bar */}
      <div className="bg-slate-950 text-slate-100 text-xs py-1.5 px-4 sm:px-8 border-b border-red-900/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>¡Haz una foto a tu lista escolar y la IA prepara tu pedido automáticamente!</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>📍 Malabo, Guinea Ecuatorial</span>
            <span>·</span>
            <span>{settings?.opening_hours || 'Lun-Sáb 08:00 - 19:30'}</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5">
        <div className="flex items-center justify-between gap-3 md:gap-8">
          {/* Logo, Lock Button & Navigation Links */}
          <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
            {/* Logo + Lock Combo */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigateTo('catalog')}
                className="text-2xl sm:text-3xl font-black tracking-tighter flex items-center gap-2 transition-transform active:scale-95 text-left cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xs">
                  B
                </div>
                <span className="font-['Outfit'] font-black tracking-tight">
                  <span className="text-red-600">B</span>
                  <span className="text-slate-950">IKIE</span>
                </span>
              </button>

              {/* Small Discreet Lock Button directly next to the BIKIE logo */}
              <button
                onClick={() => {
                  if (onOpenLoginModal) onOpenLoginModal();
                  else if (isStaff) navigateTo('admin');
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  isStaff
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-xs'
                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200'
                }`}
                title={
                  isStaff
                    ? `Sesión Activa: ${currentUser.name}. Clic para administrar o cerrar sesión.`
                    : 'Acceso Propietaria'
                }
              >
                {isStaff ? (
                  <Unlock className="w-3.5 h-3.5 text-red-600 stroke-[2.5]" />
                ) : (
                  <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                {isStaff && (
                  <span className="text-[10px] font-bold text-red-700 hidden sm:inline">
                    Admin
                  </span>
                )}
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <button
                onClick={() => navigateTo('catalog')}
                className={`transition-colors cursor-pointer ${
                  view === 'catalog'
                    ? 'text-red-600 font-bold'
                    : 'hover:text-red-600'
                }`}
              >
                Catálogo
              </button>

              <button
                onClick={() => navigateTo('school_lists')}
                className={`transition-colors cursor-pointer flex items-center gap-1 ${
                  view === 'school_lists'
                    ? 'text-red-600 font-bold'
                    : 'hover:text-red-600'
                }`}
              >
                <BookOpen className="w-4 h-4 text-red-600" />
                Packs Escolares
              </button>

              <button
                onClick={() => navigateTo('tracking')}
                className={`transition-colors cursor-pointer flex items-center gap-1 ${
                  view === 'tracking'
                    ? 'text-red-600 font-bold'
                    : 'hover:text-red-600'
                }`}
              >
                <Package className="w-4 h-4 text-slate-500" />
                Seguimiento
              </button>

              {/* Backoffice Button ONLY visible when the aunt is logged in */}
              {isStaff && (
                <button
                  onClick={() => navigateTo('admin')}
                  className="hover:text-red-700 text-red-600 font-bold cursor-pointer flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-lg border border-red-200 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-red-600" />
                  <span>Panel de Administración</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Controls: Search, Scan IA, Cart, Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Input */}
            <div className="relative hidden md:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (view !== 'catalog') navigateTo('catalog');
                }}
                placeholder="Buscar material escolar, oficina..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-44 lg:w-64 focus:ring-2 focus:ring-red-500 focus:bg-white text-slate-800 transition-all outline-hidden"
              />
              <div className="absolute left-3.5 top-2.5 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* AI Scanner CTA Button */}
            <button
              onClick={onOpenAiScanner}
              className="hidden sm:flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs sm:text-sm shadow-md shadow-red-200 transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Escanear Lista</span>
              <span className="bg-white text-red-600 font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase">
                IA
              </span>
            </button>

            {/* Cart Icon */}
            <div
              onClick={onOpenCart}
              className="relative p-2.5 bg-slate-100 rounded-full cursor-pointer hover:bg-slate-200 transition-colors shrink-0"
              title="Ver Carrito de Compras"
            >
              <ShoppingBag className="w-5 h-5 text-slate-700" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </div>

            {/* Staff User indicator (Only if aunt is logged in) */}
            {isStaff && (
              <div className="relative">
                <div
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-800 text-xs font-bold uppercase shrink-0">
                    T
                  </div>
                  <div className="hidden xl:flex flex-col text-left text-xs leading-tight">
                    <span className="font-bold text-slate-800 truncate max-w-[100px]">
                      Tía (Propietaria)
                    </span>
                    <span className="text-[10px] text-red-600 font-semibold">
                      Administradora
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                </div>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[11px] text-slate-400">Sesión Administradora:</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-xs text-red-600 font-semibold">Control Total BIKIE</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigateTo('admin');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-red-600" />
                        Abrir Panel de Administración
                      </button>

                      {onLogoutToGuest && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onLogoutToGuest();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Cerrar Sesión (Modo Cliente)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-2 border-t border-slate-100 mt-3 space-y-3">
            {/* Mobile Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (view !== 'catalog') navigateTo('catalog');
                }}
                placeholder="Buscar en BIKIE..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-full text-sm text-slate-800 outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>

            {/* Mobile AI Scan Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAiScanner();
              }}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Analizar mi lista escolar con IA</span>
            </button>

            {/* Mobile Links */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('catalog');
                }}
                className="p-3 bg-slate-50 rounded-xl text-left hover:bg-red-50 text-slate-800"
              >
                📚 Catálogo
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('school_lists');
                }}
                className="p-3 bg-slate-50 rounded-xl text-left hover:bg-red-50 text-slate-800"
              >
                🎒 Packs Escolares
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('tracking');
                }}
                className="p-3 bg-slate-50 rounded-xl text-left hover:bg-red-50 text-slate-800"
              >
                📦 Seguimiento
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenLoginModal) onOpenLoginModal();
                }}
                className="p-3 bg-slate-50 rounded-xl text-left hover:bg-red-50 text-slate-800 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-red-600" />
                <span>{isStaff ? 'Panel Admin' : 'Acceso'}</span>
              </button>
            </div>

            {isStaff && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('admin');
                }}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-red-400" />
                Panel de Administración
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
